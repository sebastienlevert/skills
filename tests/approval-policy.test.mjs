import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { evaluatePolicy, parsePolicy } from '../skills/approve-pr/scripts/approval-policy.mjs';

const headSha = 'a'.repeat(40);
const baseSha = 'b'.repeat(40);
const author = { login: 'writer', kind: 'human', writeAccess: true, teams: [] };
const reviewer = { login: 'reviewer', kind: 'human', writeAccess: true, teams: ['org/owners'], state: 'APPROVED', commitId: headSha };
const file = (path, extra = {}) => ({ path, status: 'modified', additions: 4, deletions: 1, kind: 'file', previousKind: 'file', ...extra });
const snapshot = (files, extra = {}) => ({ headSha, baseSha, base: 'main', files: files.map((item) => typeof item === 'string' ? file(item) : item), filesComplete: true, authorsComplete: true, approvalsComplete: true, authors: [author], openedBy: author.login, openedHeadSha: headSha, approvals: [], isFork: false, ...extra });
const rule = (paths, verdict, extra = '') => `  - purpose: "Test rule"
    paths: ${JSON.stringify(paths)}
    verdict: ${JSON.stringify(verdict)}
${extra}`;
const evaluate = (rules, input, options) => evaluatePolicy(parsePolicy(`version: 1\nrules:\n${rules}`), input, options);

test('path and extension allowlists respect exclusions, dot folders and strictest overlapping verdict', () => {
  const rules = rule(['**/*.md', 'docs/{a,b}/**', 'assets/[ab]?.txt', '!docs/private/**'], { copilot: 'approves', seats: 0 })
    + rule(['docs/private/**', '**/AGENTS.md'], { copilot: 'comments', seats: 0 });
  for (const path of ['README.md', '.notes/a.md', 'docs/a/image.svg', 'assets/a1.txt']) assert.equal(evaluate(rules, snapshot([path])).automationApprovalAllowed, true, path);
  assert.equal(evaluate(rules, snapshot(['docs/private/a.md'])).copilot, 'comments');
  assert.equal(evaluate(rules, snapshot(['AGENTS.md'])).automationApprovalAllowed, false);
  assert.equal(evaluate(rules, snapshot(['src/a.js'])).policySatisfied, false);
});

test('a rename evaluates old and new paths without double counting files', () => {
  const rules = rule(['docs/**'], { copilot: 'approves', seats: 0 }, '    if: "rule/files_changed = pr/files_changed"\n');
  assert.equal(evaluate(rules, snapshot([file('docs/new.md', { previousPath: 'docs/old.md', status: 'renamed' })])).automationApprovalAllowed, true);
  assert.match(evaluate(rules, snapshot([file('src/new.md', { previousPath: 'docs/old.md', status: 'renamed' })])).reasons.join(), /Uncovered path/);
});

test('facts, grouped conditions and first matching override are deterministic', () => {
  const rules = rule(['**'], { copilot: 'comments', seats: 0 }, `    override:
      - if: "pr/base = 'release/**' AND (pr/files_added = 1 OR pr/diff_lines > 100)"
        verdict: { copilot: blocks }
      - if: "pr/diff_lines <= 10"
        verdict: { copilot: approves }
      - if: "pr/diff_lines <= 100"
        verdict: { copilot: comments }
`);
  assert.equal(evaluate(rules, snapshot(['a.txt'])).copilot, 'approves');
  assert.equal(evaluate(rules, snapshot([file('a.txt', { status: 'added' })], { base: 'release/v2' })).copilot, 'blocks');
});

test('locals and use merge maps, while observe cannot authorize approval or merge', () => {
  const policy = parsePolicy(`version: 1
mode: observe
locals:
  defaults:
    paths: ["**"]
    verdict: { copilot: comments, seats: 0 }
rules:
  - purpose: "Use defaults"
    use: ["@defaults"]
    verdict: { copilot: approves }
`);
  assert.equal(policy.rules[0].verdict.seats, 0);
  const result = evaluatePolicy(policy, snapshot(['a.txt']));
  assert.equal(result.policySatisfied, false);
  assert.equal(result.automationApprovalAllowed, false);
});

test('author-filled seats differ from independent seats and never become GitHub reviews', () => {
  const one = rule(['**'], { copilot: 'approves', seats: 1 });
  assert.equal(evaluate(one, snapshot(['a.txt'])).seatsSatisfied, true);
  assert.equal(evaluate(one, snapshot(['a.txt'], { isFork: true })).seatsSatisfied, false);
  assert.equal(evaluate(one, snapshot(['a.txt'], { outsideContributor: true })).seatsSatisfied, false);
  const independent = rule(['**'], { copilot: 'approves', seats: [{ count: 1, from: ['humans', '!pr/authors'] }] });
  assert.equal(evaluate(independent, snapshot(['a.txt'])).seatsSatisfied, false);
  assert.equal(evaluate(independent, snapshot(['a.txt'], { approvals: [reviewer] })).automationApprovalAllowed, true);
  assert.equal(evaluate(independent, snapshot(['a.txt'], { approvals: [reviewer], isFork: true })).seatsSatisfied, false);
});

test('each seat set must be filled; one verified person can satisfy several sets', () => {
  const rules = rule(['**'], { copilot: 'comments', seats: [{ count: 1, from: ['humans', '!pr/authors'] }, { count: 1, from: 'org/owners' }] });
  const result = evaluate(rules, snapshot(['a.txt'], { approvals: [reviewer] }));
  assert.equal(result.policySatisfied, true);
  assert.equal(result.automationApprovalAllowed, false);
  assert.equal(evaluate(rules, snapshot(['a.txt'], { approvals: [{ ...reviewer, teams: [] }] })).seatsSatisfied, false);
  assert.match(evaluate(rules, snapshot(['a.txt'], { approvals: [{ ...reviewer, teams: undefined }] })).reasons.join(), /Unknown seat/);
});

test('GitHub account case cannot evade exclusions or count the same reviewer twice', () => {
  const exclusions = rule(['**'], { copilot: 'approves', seats: [{ count: 1, from: ['humans', '!WRITER'] }] });
  assert.equal(evaluate(exclusions, snapshot(['a.txt'])).seatsSatisfied, false);
  const independent = rule(['**'], { copilot: 'approves', seats: [{ count: 2, from: ['humans', '!pr/authors'] }] });
  assert.equal(evaluate(independent, snapshot(['a.txt'], { approvals: [reviewer, { ...reviewer, login: 'REVIEWER' }] })).seatsSatisfied, false);
});

test('ANY and ALL apply inequality per person and approved_by excludes authors and bots', () => {
  const rules = rule(['**'], { copilot: 'approves', seats: 0 }, '    if: "ANY pr/authors != bot:dependabot AND pr/approved_by != empty"\n');
  const bot = { login: 'dependabot[bot]', kind: 'bot', writeAccess: true, teams: [] };
  assert.equal(evaluate(rules, snapshot(['a.txt'], { authors: [author, bot], approvals: [reviewer] })).automationApprovalAllowed, true);
  assert.equal(evaluate(rules, snapshot(['a.txt'], { approvals: [{ ...author, state: 'APPROVED', commitId: headSha }] })).policySatisfied, false);
});

test('people-list facts and bot-opener overrides cannot relax another account push', () => {
  const ownership = rule(['**'], { copilot: 'approves', seats: 0 }, '    if: "pr/opened_by = pr/authors AND ALL pr/authors = humans"\n');
  assert.equal(evaluate(ownership, snapshot(['a.txt'])).automationApprovalAllowed, true);
  const overrides = rule(['**'], { copilot: 'comments', seats: 0 }, `    override:
      - if: "pr/opened_by = bot:dependabot"
        verdict: { copilot: approves }
`);
  const bot = { login: 'dependabot[bot]', kind: 'bot', writeAccess: true, teams: [] };
  const input = snapshot(['a.txt'], { openedBy: bot.login, authors: [bot], openedHeadSha: baseSha, latestCommit: { authorLogin: bot.login, pusherLogin: bot.login } });
  assert.equal(evaluate(overrides, input).automationApprovalAllowed, true);
  assert.equal(evaluate(overrides, { ...input, latestCommit: { authorLogin: bot.login, pusherLogin: author.login }, authors: [bot, author] }).copilot, 'comments');
});

test('stale, dismissed and changes-requested reviews cannot silently fill seats', () => {
  const rules = rule(['**'], { copilot: 'approves', seats: [{ count: 1, from: ['humans', '!pr/authors'] }] });
  for (const review of [{ ...reviewer, commitId: baseSha }, { ...reviewer, nativeValid: false }, { ...reviewer, state: 'DISMISSED' }]) assert.equal(evaluate(rules, snapshot(['a.txt'], { approvals: [review] })).seatsSatisfied, false);
  const result = evaluate(rules, snapshot(['a.txt'], { approvals: [reviewer, { ...reviewer, state: 'CHANGES_REQUESTED' }] }));
  assert.match(result.reasons.join(), /Changes requested/);
});

test('ordinal classifier overrides require current sourced evidence and keep strict fallback on error', () => {
  const rules = rule(['**'], { copilot: 'comments', seats: 0 }, `    override:
      - if: "repo/change_risk <= medium"
        verdict: { copilot: approves }
      - if: "pr/files_changed = 1"
        verdict: { copilot: approves }
`);
  const result = { headSha, baseSha, source: 'verified-local-evidence', status: 'complete', value: 'low', values: ['low', 'medium', 'high'] };
  assert.equal(evaluate(rules, snapshot(['a.txt'], { classifiers: { 'repo/change_risk': result } })).automationApprovalAllowed, true);
  assert.equal(evaluate(rules, snapshot(['a.txt'], { classifiers: { 'repo/change_risk': { ...result, headSha: baseSha } } })).automationApprovalAllowed, false);
  const failed = evaluate(rules, snapshot(['a.txt'], { classifiers: { 'repo/change_risk': { ...result, status: 'error' } } }));
  assert.equal(failed.copilot, 'comments');
  assert.equal(failed.policySatisfied, true);
});

test('missing or invalid classifier outputs cannot satisfy a negative predicate', () => {
  const rules = rule(['**'], { copilot: 'comments', seats: 0 }, `    override:
      - if: "repo/change_risk != high"
        verdict: { copilot: approves }
`);
  const metadata = { headSha, baseSha, source: 'verified-definition', status: 'complete', values: ['low', 'medium', 'high'] };
  for (const result of [{ ...metadata }, { ...metadata, value: 'unlisted' }, { ...metadata, value: 1 }]) assert.equal(evaluate(rules, snapshot(['a.txt'], { classifiers: { 'repo/change_risk': result } })).automationApprovalAllowed, false);
});

test('finding-resolution rules cannot be waived by a clean verdict without owner evidence', () => {
  const rules = rule(['**'], { copilot: 'approves', seats: 0 }, '    findings: { resolution: nobody }\n');
  assert.equal(evaluate(rules, snapshot(['a.txt'])).policySatisfied, false);
  assert.equal(evaluate(rules, snapshot(['a.txt'], { findingsEvidence: { headSha, baseSha, source: 'verified-resolution-policy' } })).policySatisfied, true);
});

test('protected modes, unknown file metadata and evaluation expiry block automation', () => {
  const rules = rule(['**'], { copilot: 'approves', seats: 0, max_age: '1m' });
  for (const changed of [file('.gitattributes'), file('link.md', { kind: 'symlink' }), file('module', { kind: 'submodule' }), file('a.md', { kind: undefined }), file('link.md', { previousKind: 'symlink' }), file('a.md', { previousKind: undefined })]) assert.equal(evaluate(rules, snapshot([changed])).automationApprovalAllowed, false);
  const now = Date.parse('2026-11-25T05:00:00Z');
  assert.equal(evaluate(rules, snapshot(['a.txt'], { evaluatedAt: '2026-11-25T04:58:00Z' }), { now }).policySatisfied, false);
  assert.equal(evaluate(rules, snapshot(['a.txt'], { evaluatedAt: 'invalid' }), { now }).expiresAt, null);
});

test('refuses malformed schema/YAML, unknown facts, partial evidence and unsafe coverage assumptions', () => {
  for (const text of [
    'version: 1\nrules: []\nversion: 1',
    'version: 1\nrules: []\n---\nversion: 1',
    'version: 1\nrules: []\nfile_types: [md]',
    'version: 2\nrules: []',
    `version: 1\nrules:\n${rule(['**'], { copilot: 'approves', seats: 17 })}`,
    `version: 1\nrules:\n${rule(['infra/'], { copilot: 'approves', seats: 0 })}`,
    `version: 1\nrules:\n${rule(['**'], { copilot: 'approves', seats: 0 }, '    if: "pr/unknown = 1"\n')}`,
    'version: 1\nrules:\n  - purpose: unquoted\n    paths: ["**"]\n    verdict: { copilot: approves, seats: 0 }',
  ]) assert.throws(() => parsePolicy(text));
  const rules = rule(['**'], { copilot: 'approves', seats: 0 });
  assert.throws(() => evaluate(rules, snapshot(['a.txt'], { filesComplete: false })), /complete/);
  assert.throws(() => evaluate(rules, snapshot(['a.txt'], { authors: [] })), /author/);
  assert.throws(() => evaluate(rules, snapshot([file('a.txt', { additions: undefined })])), /counts/);
  assert.throws(() => evaluate(rules, snapshot([file('a.txt', { status: 'renamed' })])), /rename paths/);
  assert.throws(() => evaluate(rules, snapshot(['a.txt'], { nestedPolicies: ['service'] })), /hierarchical/);
});

test('bundled sidecar previews safely and protects policy files from its documentation fast path', () => {
  const text = readFileSync(new URL('../skills/approve-pr/assets/APPROVALS.yml', import.meta.url), 'utf8');
  const observe = parsePolicy(text);
  assert.equal(evaluatePolicy(observe, snapshot(['README.md'])).automationApprovalAllowed, false);
  const enforce = parsePolicy(text.replace('mode: observe', 'mode: enforce'));
  assert.equal(evaluatePolicy(enforce, snapshot(['README.md'])).automationApprovalAllowed, true);
  assert.equal(evaluatePolicy(enforce, snapshot(['APPROVALS.md'], { approvals: [reviewer] })).copilot, 'comments');
});

test('CLI evaluates all rules while returning bounded details and fails closed for invalid YAML', (t) => {
  const directory = mkdtempSync(join(tmpdir(), 'toolkit-policy-test-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const policyFile = join(directory, 'APPROVALS.yml');
  const snapshotFile = join(directory, 'snapshot.json');
  const script = fileURLToPath(new URL('../skills/approve-pr/scripts/approval-policy.mjs', import.meta.url));
  writeFileSync(policyFile, `version: 1\nrules:\n${rule(['**'], { copilot: 'approves', seats: 0 }).repeat(20)}`);
  writeFileSync(snapshotFile, JSON.stringify(snapshot(['docs/a.md'])));
  const result = spawnSync(process.execPath, [script, policyFile, snapshotFile], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  const decision = JSON.parse(result.stdout);
  assert.equal(decision.policySatisfied, true);
  assert.equal(decision.ruleCount, 20);
  assert.equal(decision.rules.length, 16);
  assert.equal(decision.detailsTruncated, true);
  writeFileSync(policyFile, 'version: 1\nrules: invalid');
  const rejected = spawnSync(process.execPath, [script, policyFile, snapshotFile], { encoding: 'utf8' });
  assert.equal(rejected.status, 1);
  assert.equal(rejected.stdout, '');
});
