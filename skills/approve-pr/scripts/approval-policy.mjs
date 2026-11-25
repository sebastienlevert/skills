import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import picomatch from 'picomatch';
import { isScalar, isSeq, parseAllDocuments, visit } from 'yaml';

const unknown = Symbol('unknown');
const rank = { approves: 0, comments: 1, blocks: 2 };
const topKeys = ['version', 'rules', 'mode', 'nested', 'run', 'locals'];
const ruleKeys = ['purpose', 'paths', 'verdict', 'if', 'override', 'advisory', 'reuse', 'findings', 'use', 'mode', 'nested', 'run'];
const copyKeys = ['verdict', 'override', 'if', 'paths', 'reuse', 'advisory', 'findings'];
const facts = new Set(['pr/files_changed', 'pr/files_added', 'pr/files_removed', 'pr/diff_lines', 'rule/files_changed', 'rule/files_added', 'rule/files_removed', 'pr/authors', 'pr/opened_by', 'pr/approved_by', 'pr/base', 'finding/severity']);
const classifier = /^(?:copilot\/(?:code_review|diff)|repo\/[a-z0-9_]+)(?:\([a-z0-9_=, ]+\))?(?:\.[a-z0-9_]+)?$/;
const fail = (message) => { throw new Error(message); };
const map = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const own = (value, key) => map(value) && Object.hasOwn(value, key);
const account = (value) => typeof value === 'string' ? value.toLowerCase() : '';

function keys(value, allowed, label) {
  if (!map(value)) fail(`${label}: expected a map`);
  for (const key of Object.keys(value)) if (!allowed.includes(key)) fail(`${label}: unknown key ${key}`);
}

function choice(value, allowed, label) {
  if (value !== undefined && !allowed.includes(value)) fail(`${label}: invalid value`);
}

function people(value, { nobody = false } = {}) {
  const list = Array.isArray(value) ? value : [value];
  if (!list.length || list.some((item) => typeof item !== 'string' || !/^(?:!?[a-zA-Z0-9_.-]+(?:\/[a-zA-Z0-9_.-]+)?|!?bot:[a-zA-Z0-9_.-]+)$/.test(item))) fail('Invalid people list');
  if (list.includes('nobody') && (!nobody || list.length !== 1)) fail('nobody is only valid alone under findings');
  if (list.includes('everyone') && (Array.isArray(value) || list.length !== 1)) fail('everyone must be written alone');
  if (!list.some((item) => !item.startsWith('!'))) fail('A people list needs an inclusion');
  if (new Set(list.filter((item) => item.includes('/') && !item.replace(/^!/, '').startsWith('pr/'))).size > 10) fail('Too many teams');
}

function age(value) {
  if (value === undefined) return Infinity;
  const match = typeof value === 'string' && value.match(/^(\d+)([smhd])$/);
  const seconds = match && Number(match[1]) * { s: 1, m: 60, h: 3600, d: 86400 }[match[2]];
  if (!seconds || seconds < 60 || seconds > 83 * 86400) fail('max_age must be between 1m and 83d');
  return seconds * 1000;
}

function verdict(value, partial = false) {
  keys(value, ['copilot', 'seats', 'max_age'], 'verdict');
  choice(value.copilot, Object.keys(rank), 'verdict.copilot');
  if (!partial && !value.copilot) fail('verdict.copilot is required');
  if (value.copilot === 'blocks' && value.seats !== undefined) fail('blocks cannot have seats');
  if (!partial && value.copilot !== 'blocks' && value.seats === undefined) fail('verdict.seats is required');
  if (value.seats !== undefined) {
    if (Number.isInteger(value.seats)) {
      if (value.seats < 0 || value.seats > 16) fail('seats must be 0..16');
    } else {
      if (!Array.isArray(value.seats) || value.seats.length > 8) fail('Invalid seats sets');
      const teams = new Set();
      for (const seat of value.seats) {
        keys(seat, ['count', 'from'], 'seat');
        if (!Number.isInteger(seat.count) || seat.count < 1 || seat.count > 16) fail('seat.count must be 1..16');
        people(seat.from);
        for (const name of Array.isArray(seat.from) ? seat.from : [seat.from]) if (name.includes('/') && !name.replace(/^!/, '').startsWith('pr/')) teams.add(name.replace(/^!/, ''));
      }
      if (teams.size > 10) fail('Too many teams in seats');
    }
  }
  age(value.max_age);
}

function expand(value, locals, stack = []) {
  if (stack.length > 32) fail('Local expansion is too deep');
  if (typeof value === 'string' && /^@[a-zA-Z0-9_-]+$/.test(value)) {
    const name = value.slice(1);
    if (!own(locals, name) || stack.includes(name)) fail(`Unknown or cyclic local ${name}`);
    return expand(locals[name], locals, [...stack, name]);
  }
  if (Array.isArray(value)) return value.map((item) => expand(item, locals, stack)).flat();
  if (!map(value)) return value;
  let copied = {};
  if (own(value, 'use')) {
    if (!Array.isArray(value.use) || value.use.length > 8) fail('use must be a list of up to eight locals');
    for (const reference of value.use) {
      if (typeof reference !== 'string' || !reference.startsWith('@')) fail('use needs local references');
      const local = expand(reference, locals, stack);
      keys(local, copyKeys, 'use local');
      copied = merge(copied, local);
    }
  }
  const explicit = Object.fromEntries(Object.entries(value).filter(([key]) => key !== 'use').map(([key, item]) => [key, expand(item, locals, stack)]));
  return merge(copied, explicit);
}

function merge(left, right) {
  const result = { ...left, ...right };
  for (const key of ['verdict', 'findings', 'reuse']) if (map(left[key]) && map(right[key])) result[key] = { ...left[key], ...right[key] };
  return result;
}

function resolution(value, locals) {
  if (Array.isArray(value) && value.some(map)) {
    if (value.length > 16) fail('Too many resolution sets');
    for (const item of value) {
      keys(item, ['if', 'from'], 'resolution set');
      condition(item.if ?? true, locals);
      people(item.from, { nobody: true });
    }
  } else if (map(value)) {
    for (const [name, list] of Object.entries(value)) {
      if (!classifier.test(name)) fail('Unknown resolution classifier');
      people(list, { nobody: true });
    }
  } else people(value, { nobody: true });
}

function validateRule(rule, locals) {
  keys(rule, ruleKeys.filter((key) => key !== 'use'), 'rule');
  if (typeof rule.purpose !== 'string' || !rule.purpose.length || rule.purpose.length > 1000 || /[\r\n]/.test(rule.purpose)) fail('Invalid rule purpose');
  if (!Array.isArray(rule.paths) || !rule.paths.length || rule.paths.some((item) => typeof item !== 'string') || rule.paths.filter((item) => !item.startsWith('!')).length > 256) fail('Invalid paths');
  for (const pattern of rule.paths) {
    if (typeof pattern !== 'string' || !pattern || pattern.endsWith('/') || pattern.includes('\\') || pattern.replace(/^!/, '').split('/').some((part) => part.includes('**') && part !== '**')) fail('Invalid path pattern');
  }
  if (!rule.paths.some((item) => !item.startsWith('!'))) fail('paths needs an inclusion');
  choice(rule.mode, ['observe', 'enforce'], 'rule.mode');
  choice(rule.nested, ['overwrite', 'inherit'], 'rule.nested');
  choice(rule.run, ['sequential', 'parallel'], 'rule.run');
  if (rule.verdict !== undefined) verdict(rule.verdict);
  if (rule.if !== undefined) condition(rule.if, locals);
  if (rule.advisory !== undefined && (!Array.isArray(rule.advisory) || rule.advisory.some((name) => typeof name !== 'string' || !classifier.test(name)))) fail('Invalid advisory classifier');
  const reuse = (value, override = false) => {
    if (override && value === 'unset') return;
    if (map(value)) {
      for (const [name, expression] of Object.entries(value)) {
        if (name !== 'seats' && !classifier.test(name)) fail('Invalid reuse key');
        if (!classifier.test(String(expression))) condition(expression, locals);
      }
    } else if (!classifier.test(String(value))) condition(value, locals);
  };
  if (rule.reuse !== undefined) reuse(rule.reuse);
  if (rule.findings !== undefined) {
    keys(rule.findings, ['resolution'], 'findings');
    resolution(rule.findings.resolution, locals);
  }
  if (rule.override !== undefined) {
    if (!Array.isArray(rule.override) || rule.override.length > 16) fail('Too many overrides');
    for (const item of rule.override) {
      keys(item, ['if', 'verdict', 'reuse', 'findings', 'purpose'], 'override');
      if (item.purpose !== undefined && (typeof item.purpose !== 'string' || !item.purpose.length || item.purpose.length > 1000 || /[\r\n]/.test(item.purpose))) fail('Invalid override purpose');
      if (item.if === undefined) fail('override.if is required');
      condition(item.if, locals);
      if (item.verdict !== undefined) verdict(item.verdict, true);
      if (item.reuse !== undefined) reuse(item.reuse, true);
      if (item.findings !== undefined) { keys(item.findings, ['resolution'], 'findings'); resolution(item.findings.resolution, locals); }
      if (item.verdict === undefined && item.reuse === undefined && item.findings === undefined) fail('override needs a replacement');
    }
  }
  if (rule.verdict === undefined && rule.advisory === undefined && rule.findings === undefined && rule.reuse === undefined) fail('rule has no action');
  if (rule.verdict === undefined && rule.advisory === undefined && rule.findings === undefined && rule.reuse !== false && !classifier.test(String(rule.reuse))) fail('reuse-only rule needs false or a classifier');
}

export function parsePolicy(text) {
  if (Buffer.byteLength(text, 'utf8') > 448 * 1024) fail('Policy exceeds 448 KiB');
  const documents = parseAllDocuments(text, { uniqueKeys: true });
  if (documents.length !== 1 || documents[0].errors.length) fail('Policy must be one valid YAML document with unique keys');
  const document = documents[0];
  if (document.warnings.length) fail('Unsupported YAML tags or scalar syntax');
  visit(document, {
    Pair(_, pair) {
      const key = pair.key?.value;
      if (['purpose', 'if'].includes(key) && isScalar(pair.value) && typeof pair.value.value === 'string' && pair.value.type !== 'QUOTE_DOUBLE') fail(`${key} must be double quoted`);
      if (key === 'paths' && isSeq(pair.value)) for (const item of pair.value.items) if (isScalar(item) && item.type !== 'QUOTE_DOUBLE') fail('paths must be double quoted');
    },
    Scalar(_, scalar) { if (typeof scalar.value === 'string' && scalar.value.startsWith('!') && scalar.type !== 'QUOTE_DOUBLE') fail('Exclusions must be double quoted'); },
  });
  const policy = document.toJS({ maxAliasCount: 100 });
  keys(policy, topKeys, 'policy');
  if (policy.version !== 1) fail('version must be the bare number 1');
  choice(policy.mode, ['observe', 'enforce'], 'mode');
  choice(policy.nested, ['overwrite', 'inherit'], 'nested');
  choice(policy.run, ['sequential', 'parallel'], 'run');
  if (!Array.isArray(policy.rules) || policy.rules.length > 512) fail('rules must be a list of at most 512 rules');
  const locals = policy.locals ?? {};
  if (!map(locals) || Object.keys(locals).length > 512) fail('Invalid locals');
  const limitLists = (value, depth = 0) => {
    if (depth > 64) fail('Policy is too deeply nested');
    if (Array.isArray(value) && value.length > 1024) fail('List exceeds 1024 entries');
    if (map(value) || Array.isArray(value)) for (const item of Object.values(value)) limitLists(item, depth + 1);
  };
  limitLists(policy);
  const rules = policy.rules.map((rule) => { keys(rule, ruleKeys, 'rule'); return expand(rule, locals); });
  if (rules.reduce((sum, rule) => sum + (rule.override?.length ?? 0), 0) > 128) fail('Too many policy overrides');
  for (const rule of rules) validateRule(rule, locals);
  return { ...policy, locals, rules };
}

function includes(person, value, snapshot) {
  const list = Array.isArray(value) ? value : [value];
  const matches = (item) => {
    if (item === 'everyone') return true;
    if (item === 'nobody') return false;
    if (item === 'humans') return person.kind === 'human';
    if (item === 'bots') return person.kind === 'bot';
    if (item === 'pr/authors') return snapshot.authors.some((author) => account(author.login) === account(person.login));
    if (item === 'pr/opened_by') return account(person.login) === account(snapshot.openedBy);
    if (item.startsWith('bot:')) return person.kind === 'bot' && account(person.login).replace(/\[bot\]$/, '') === account(item.slice(4));
    if (item.includes('/')) return Array.isArray(person.teams) ? person.teams.some((team) => account(team) === account(item)) : unknown;
    return account(person.login) === account(item);
  };
  const positive = list.filter((item) => !item.startsWith('!')).map(matches);
  const negative = list.filter((item) => item.startsWith('!')).map((item) => matches(item.slice(1)));
  if (negative.includes(true) || !positive.includes(true) && !positive.includes(unknown)) return false;
  if (negative.includes(unknown) || !positive.includes(true)) return unknown;
  return true;
}

function condition(expression, locals = {}, snapshot, context = {}) {
  if (typeof expression === 'boolean') return expression;
  if (typeof expression !== 'string' || !expression.length || expression.length > 4096) fail('Invalid condition');
  const tokens = [];
  const token = /\s*(>=|<=|!=|[=<>()[\],]|'[^']*'|-?\d+|@[a-zA-Z0-9_-]+|[a-zA-Z_][a-zA-Z0-9_/:.-]*(?:\([a-z0-9_=, ]+\))?)/y;
  let offset = 0;
  while (offset < expression.length) {
    token.lastIndex = offset;
    const match = token.exec(expression);
    if (!match) { if (!expression.slice(offset).trim()) break; fail('Unsupported condition syntax'); }
    tokens.push(match[1]); offset = token.lastIndex;
  }
  let index = 0;
  const take = () => tokens[index++];
  const peek = () => tokens[index];
  const operand = (asPeople = false) => {
    const item = take();
    if (!item) fail('Missing condition operand');
    if (item === '[') {
      const result = [];
      while (peek() !== ']') {
        if (result.length) { if (take() !== ',') fail('Invalid condition list'); }
        const value = operand(true);
        if (typeof value !== 'string') fail('Invalid condition people list');
        result.push(value);
      }
      take(); return result;
    }
    if (item.startsWith("'")) return item.slice(1, -1);
    if (/^-?\d+$/.test(item)) return Number(item);
    if (item.startsWith('@')) {
      if (!own(locals, item.slice(1)) || map(locals[item.slice(1)])) fail('Unknown condition local');
      return expand(item, locals);
    }
    if (item === 'true' || item === 'false') return item === 'true';
    if (asPeople) return item;
    if (item.startsWith('pr/') || item.startsWith('rule/') || item === 'finding/severity') {
      if (!facts.has(item)) fail(`Unknown fact ${item}`);
      if (!snapshot) return unknown;
      if (item === 'pr/authors') return snapshot.authors;
      if (item === 'pr/opened_by') return snapshot.authors.find((person) => account(person.login) === account(snapshot.openedBy)) ?? unknown;
      if (item === 'pr/approved_by') return context.approved.filter((person) => person.kind === 'human' && !snapshot.authors.some((author) => account(author.login) === account(person.login)));
      if (item === 'pr/base') return { branch: snapshot.base };
      return context[item] ?? unknown;
    }
    if (item.startsWith('copilot/') || item.startsWith('repo/')) {
      if (!classifier.test(item)) fail('Invalid classifier reference');
      if (!snapshot) return unknown;
      const result = snapshot.classifiers?.[item];
      if (!result || result.headSha !== snapshot.headSha || result.baseSha !== snapshot.baseSha || typeof result.source !== 'string' || !result.source.trim()) { context.pending = true; return unknown; }
      if (result.status === 'error' || result.status === 'incomplete') { context.noAnswer = true; return { value: result.status, noAnswer: true }; }
      if (result.status !== 'complete') { context.pending = true; return unknown; }
      const predefined = item.endsWith('.severity') ? ['none', 'minimal', 'low', 'medium', 'high', 'critical']
        : item.startsWith('copilot/code_review') ? ['pass', 'fail']
          : item.startsWith('copilot/diff') ? ['trivial', 'same_intent', 'different'] : undefined;
      const values = predefined ?? result.values;
      const valid = typeof result.value === 'string' ? Array.isArray(values) && values.includes(result.value)
        : typeof result.value === 'number' && Number.isFinite(result.value) && Number.isFinite(result.min) && Number.isFinite(result.max) && result.value >= result.min && result.value <= result.max;
      if (!valid) { context.pending = true; return unknown; }
      return { value: result.value, order: result.type === 'criteria' ? undefined : values };
    }
    return item;
  };
  const comparison = () => {
    const quantifier = ['ANY', 'ALL'].includes(peek()) ? take() : null;
    const left = operand(); const operator = take(); const right = operand(Boolean(quantifier) || Array.isArray(left) || map(left) && Boolean(left.login));
    if (!['=', '!=', '<', '<=', '>', '>='].includes(operator)) fail('Invalid condition operator');
    if (!snapshot) return unknown;
    if (left === unknown || right === unknown) return unknown;
    let a = left; let b = right;
    if (Array.isArray(left) || map(left) && left.login) {
      if (!['=', '!='].includes(operator)) fail('People comparisons need = or !=');
      if (Array.isArray(left) && right === 'empty') return operator === '=' ? left.length === 0 : left.length !== 0;
      if (Array.isArray(left) && !quantifier) fail('People lists need ANY or ALL');
      people(right);
      const outcomes = (Array.isArray(left) ? left : [left]).map((person) => {
        const result = includes(person, right, snapshot);
        return result === unknown || operator === '=' ? result : !result;
      });
      const result = quantifier === 'ALL' ? (outcomes.includes(false) ? false : outcomes.includes(unknown) ? unknown : true) : (outcomes.includes(true) ? true : outcomes.includes(unknown) ? unknown : false);
      return result;
    }
    if (quantifier) fail('ANY/ALL requires a people list');
    if (map(left) && own(left, 'branch')) {
      if (!['=', '!='].includes(operator) || typeof right !== 'string') fail('Invalid branch comparison');
      const result = picomatch(right, { dot: true })(left.branch);
      return operator === '=' ? result : !result;
    }
    if (map(left) && own(left, 'value')) {
      a = left.value;
      if (left.noAnswer && !['error', 'incomplete'].includes(right)) return unknown;
      if (!['=', '!='].includes(operator)) {
        if (typeof a !== 'number' || typeof b !== 'number') {
          if (!Array.isArray(left.order) || !left.order.includes(a) || !left.order.includes(b)) return unknown;
          a = left.order.indexOf(a); b = left.order.indexOf(b);
        }
      }
    }
    if (map(right) && own(right, 'value')) b = right.value;
    if (!['=', '!='].includes(operator) && (typeof a !== 'number' || typeof b !== 'number')) return unknown;
    return ({ '=': () => a === b, '!=': () => a !== b, '<': () => a < b, '<=': () => a <= b, '>': () => a > b, '>=': () => a >= b })[operator]();
  };
  const primary = (depth) => {
    if (depth > 8) fail('Condition nesting exceeds eight levels');
    if (peek() !== '(') return comparison();
    take(); const result = group(depth + 1); if (take() !== ')') fail('Unclosed condition group'); return result;
  };
  const group = (depth = 0) => {
    let result = primary(depth); let joining;
    while (['AND', 'OR'].includes(peek())) {
      const operator = take();
      if (joining && joining !== operator) fail('Use parentheses when mixing AND and OR');
      joining = operator;
      const next = primary(depth);
      result = operator === 'AND' ? (result === false || next === false ? false : result === unknown || next === unknown ? unknown : true) : (result === true || next === true ? true : result === unknown || next === unknown ? unknown : false);
    }
    return result;
  };
  const result = group();
  if (index !== tokens.length) fail('Unexpected condition token');
  return result;
}

export function evaluatePolicy(policy, snapshot, { now = Date.now() } = {}) {
  if (!snapshot?.filesComplete || !Array.isArray(snapshot.files) || !snapshot.files.length || snapshot.files.length >= 2000 || !snapshot.authorsComplete || !snapshot.approvalsComplete || !Array.isArray(snapshot.authors) || !Array.isArray(snapshot.approvals) || !snapshot.headSha || !snapshot.baseSha || typeof snapshot.isFork !== 'boolean') fail('A complete revision-bound PR snapshot is required');
  const paths = (file) => file.status === 'renamed' ? [file.path, file.previousPath] : [file.path];
  if (snapshot.files.some((file) => paths(file).some((path) => typeof path !== 'string' || !path || path.startsWith('/') || path.includes('\\') || path.split('/').includes('..')))) fail('Complete canonical Git paths are required, including both rename paths');
  if (snapshot.files.some((file) => !Number.isInteger(file.additions) || file.additions < 0 || !Number.isInteger(file.deletions) || file.deletions < 0 || !['added', 'modified', 'removed', 'renamed', 'copied', 'changed'].includes(file.status))) fail('Complete changed-file counts/status are required');
  if (snapshot.authors.length > 1024 || snapshot.approvals.length > 1024) fail('Snapshot account/review limits exceeded');
  if (!snapshot.authors.length || typeof snapshot.openedBy !== 'string' || !snapshot.openedBy || !snapshot.authors.some((person) => account(person.login) === account(snapshot.openedBy)) || typeof snapshot.base !== 'string' || !snapshot.base) fail('Complete PR author/opener/base metadata is required');
  if (snapshot.authors.concat(snapshot.approvals).some((person) => typeof person.login !== 'string' || !person.login || !['human', 'bot'].includes(person.kind) || typeof person.writeAccess !== 'boolean')) fail('Verified account type and write-access metadata is required');
  if (snapshot.commitCount > 250 && JSON.stringify(policy.rules).includes('!pr/authors')) fail('Too many commits to verify excluded authors');
  if (snapshot.nestedPolicies?.length) fail('Nested sidecars need hierarchical evaluation; root-only evaluation cannot waive them');
  const knownPeople = snapshot.authors.concat(snapshot.approvals).filter((person) => person.writeAccess === true);
  const current = new Map();
  for (const review of snapshot.approvals) if (['APPROVED', 'CHANGES_REQUESTED', 'DISMISSED'].includes(review.state)) current.set(account(review.login), review);
  const approved = [...current.values()].filter((person) => person.state === 'APPROVED' && person.writeAccess === true && person.nativeValid !== false && (person.commitId === snapshot.headSha || snapshot.diffUnchanged === true));
  const authorSeat = !snapshot.isFork && snapshot.outsideContributor !== true && typeof snapshot.latestCommit?.authorLogin === 'string' && account(snapshot.latestCommit.authorLogin) === account(snapshot.latestCommit.pusherLogin)
    ? knownPeople.find((person) => account(person.login) === account(snapshot.latestCommit.authorLogin) && (person.kind !== 'bot' || account(person.login) === account(snapshot.openedBy)))
    : snapshot.openedHeadSha === snapshot.headSha && !snapshot.isFork && snapshot.outsideContributor !== true ? knownPeople.find((person) => account(person.login) === account(snapshot.openedBy) && (person.kind !== 'bot' || account(snapshot.latestCommit?.pusherLogin) === account(person.login))) : null;
  const candidates = new Map(approved.map((person) => [account(person.login), person]));
  if (authorSeat) candidates.set(account(authorSeat.login), authorSeat);
  const totals = (prefix, files) => ({ [`${prefix}/files_changed`]: files.length, [`${prefix}/files_added`]: files.filter((file) => file.status === 'added').length, [`${prefix}/files_removed`]: files.filter((file) => file.status === 'removed').length });
  const context = { ...totals('pr', snapshot.files), 'pr/diff_lines': snapshot.files.reduce((sum, file) => sum + (file.additions ?? 0) + (file.deletions ?? 0), 0), approved };
  const reasons = []; const results = []; const coverage = new Map(snapshot.files.flatMap(paths).map((path) => [path, { covered: false, applied: false }]));
  let action = 'approves'; let seatsSatisfied = true; let maxAge = Infinity;
  for (const rule of policy.rules) {
    const positive = rule.paths.filter((path) => !path.startsWith('!')).map((path) => picomatch(path, { dot: true }));
    const negative = rule.paths.filter((path) => path.startsWith('!')).map((path) => picomatch(path.slice(1), { dot: true }));
    const matches = (path) => positive.some((match) => match(path)) && !negative.some((match) => match(path));
    const matched = snapshot.files.filter((file) => paths(file).some(matches));
    const enforced = (rule.mode ?? policy.mode ?? 'enforce') === 'enforce';
    if (!matched.length || !enforced) continue;
    for (const path of matched.flatMap(paths).filter(matches)) if (rule.verdict) coverage.get(path).covered = true;
    const ruleContext = { ...context, ...totals('rule', matched) };
    const applies = condition(rule.if ?? true, policy.locals, snapshot, ruleContext);
    if (applies === unknown) { reasons.push(`Unknown condition: ${rule.purpose}`); continue; }
    if (!applies) continue;
    const findingEvidence = snapshot.findingsEvidence;
    if (rule.findings && (!findingEvidence || findingEvidence.headSha !== snapshot.headSha || findingEvidence.baseSha !== snapshot.baseSha || typeof findingEvidence.source !== 'string' || !findingEvidence.source.trim())) reasons.push(`Unverified finding-resolution policy: ${rule.purpose}`);
    let effective = rule.verdict && { ...rule.verdict };
    for (const override of rule.override ?? []) {
      const opener = snapshot.authors.find((person) => account(person.login) === account(snapshot.openedBy));
      if (typeof override.if === 'string' && override.if.includes('pr/opened_by') && opener?.kind === 'bot' && snapshot.openedHeadSha !== snapshot.headSha && account(snapshot.latestCommit?.pusherLogin) !== account(snapshot.openedBy)) continue;
      const overrideContext = { ...ruleContext };
      const applies = condition(override.if, policy.locals, snapshot, overrideContext);
      if (applies === unknown) { if (overrideContext.pending || !overrideContext.noAnswer) reasons.push(`Pending override: ${rule.purpose}`); break; }
      if (applies) { if (override.verdict) effective = { ...effective, ...override.verdict }; break; }
    }
    if (!effective) continue;
    if (effective.copilot === 'blocks') delete effective.seats;
    verdict(effective);
    for (const path of matched.flatMap(paths).filter(matches)) coverage.get(path).applied = true;
    if (rank[effective.copilot] > rank[action]) action = effective.copilot;
    maxAge = Math.min(maxAge, age(effective.max_age));
    const sets = Number.isInteger(effective.seats) ? effective.seats ? [{ count: effective.seats, from: 'humans' }] : [] : effective.seats ?? [];
    const seats = sets.map((seat) => {
      const outcomes = [...candidates.values()].map((person) => [person.login, includes(person, seat.from, snapshot)]);
      const filled = outcomes.filter(([, result]) => result === true).map(([login]) => login);
      if (filled.length < seat.count && outcomes.some(([, result]) => result === unknown)) reasons.push(`Unknown seat membership: ${rule.purpose}`);
      if (snapshot.isFork && (Array.isArray(seat.from) ? seat.from : [seat.from]).includes('!pr/authors')) filled.length = 0;
      return { required: seat.count, filled, satisfied: filled.length >= seat.count };
    });
    if (seats.some((seat) => !seat.satisfied)) seatsSatisfied = false;
    results.push({ purpose: rule.purpose, paths: matched.flatMap(paths).filter(matches), copilot: effective.copilot, seats });
  }
  for (const [path, state] of coverage) if (!state.covered) reasons.push(`Uncovered path: ${path}`); else if (!state.applied) reasons.push(`No rule applies: ${path}`);
  if (results.length && [...current.values()].some((person) => person.state === 'CHANGES_REQUESTED' && person.writeAccess === true)) reasons.push('Changes requested');
  const kinds = (file) => ['modified', 'renamed', 'changed'].includes(file.status) ? [file.kind, file.previousKind] : [file.kind];
  const protectedFiles = snapshot.files.filter((file) => paths(file).some((path) => /(?:^|\/)(?:APPROVALS\.(?:md|ya?ml)|CODEOWNERS|\.gitmodules|\.gitattributes)$/.test(path) || path === 'REVIEW.md' || /(?:^|\/)\.github\/classifiers\//.test(path)) || kinds(file).some((kind) => ['symlink', 'submodule'].includes(kind)));
  if (protectedFiles.length && ![...candidates.values()].some((person) => person.kind === 'human')) reasons.push('Protected files need a person with write access');
  if (snapshot.files.some((file) => kinds(file).some((kind) => !['file', 'symlink', 'submodule'].includes(kind)))) reasons.push('Unknown changed-file mode');
  if (snapshot.files.some((file) => kinds(file).some((kind) => ['symlink', 'submodule'].includes(kind)) || paths(file).some((path) => path.split('/').at(-1) === '.gitattributes'))) reasons.push('This protected file cannot receive automated approval');
  const observed = (policy.mode ?? 'enforce') === 'observe';
  if (observed) reasons.push('Policy is observing, not enforcing');
  const evaluatedAt = snapshot.evaluatedAt === undefined ? now : Date.parse(snapshot.evaluatedAt);
  if (!Number.isFinite(evaluatedAt) || evaluatedAt > now || now - evaluatedAt > maxAge) reasons.push('Evaluation is expired or has an invalid timestamp');
  if (!seatsSatisfied) reasons.push('Required seats are not filled');
  if (action === 'blocks') reasons.push('A rule blocks this change');
  const policySatisfied = !reasons.length && results.length > 0;
  return { version: 1, headSha: snapshot.headSha, baseSha: snapshot.baseSha, mode: observed ? 'observe' : 'enforce', copilot: action, seatsSatisfied, policySatisfied, automationApprovalAllowed: action === 'approves' && policySatisfied, expiresAt: Number.isFinite(maxAge) && Number.isFinite(evaluatedAt) ? new Date(evaluatedAt + maxAge).toISOString() : null, reasons: [...new Set(reasons)], rules: results };
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  try {
    const [policyFile, snapshotFile, ...extra] = process.argv.slice(2);
    if (!policyFile || !snapshotFile || extra.length) fail('Usage: node approval-policy.mjs <APPROVALS.yml> <verified-snapshot.json>');
    const result = evaluatePolicy(parsePolicy(readFileSync(policyFile, 'utf8')), JSON.parse(readFileSync(snapshotFile, 'utf8')));
    console.log(JSON.stringify({
      ...result,
      reasonCount: result.reasons.length,
      reasons: result.reasons.slice(0, 16),
      ruleCount: result.rules.length,
      rules: result.rules.slice(0, 16).map(({ paths, ...rule }) => ({ ...rule, matchedPathCount: paths.length, samplePaths: paths.slice(0, 3) })),
      detailsTruncated: result.reasons.length > 16 || result.rules.length > 16 || result.rules.some((rule) => rule.paths.length > 3),
    }));
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
