import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const unavailableMessage = 'Upgrade to GitHub Pro or make this repository public to enable this feature.';
const apis = ['branch-protection', 'effective-rules'];

const object = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const text = (value) => typeof value === 'string' && value.length > 0;
const boolean = (value) => typeof value === 'boolean';
const integer = (minimum, maximum = Number.MAX_SAFE_INTEGER) =>
  (value) => Number.isSafeInteger(value) && value >= minimum && value <= maximum;
const number = (value) => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 100;
const oneOf = (...values) => (value) => values.includes(value);
const list = (validate) => (value) => Array.isArray(value) && value.length <= 1000 && value.every(validate);
const optional = (value, validate) => value === undefined || validate(value);
const uri = (value) => {
  try { return text(value) && ['http:', 'https:'].includes(new URL(value).protocol); } catch { return false; }
};
const fields = (value, required, extra = {}) => object(value) &&
  Object.entries(required).every(([key, validate]) => validate(value[key])) &&
  Object.entries(extra).every(([key, validate]) => optional(value[key], validate)) &&
  Object.keys(value).every((key) => Object.hasOwn(required, key) || Object.hasOwn(extra, key));
const statusCheck = (value) => fields(value, { context: text }, { integration_id: integer(0) });
const pattern = (value) => fields(value, { operator: oneOf('starts_with', 'ends_with', 'contains', 'regex'),
  pattern: (item) => typeof item === 'string' }, { name: text, negate: boolean });
const flag = (value) => fields(value, { enabled: boolean }, { url: uri });
const people = (value) => fields(value, {}, { users: list((person) => object(person) && text(person.login)),
  teams: list((team) => object(team) && text(team.slug)), apps: list((app) => object(app) && integer(1)(app.id)),
  url: uri, users_url: uri, teams_url: uri, apps_url: uri });

function validProtection(value) {
  if (!object(value) || !uri(value.url)) return false;
  const validators = {
    url: uri, enabled: boolean, name: text, protection_url: uri,
    required_status_checks: (item) => item === null || fields(item, {
      contexts: list(text), checks: list((check) => fields(check, { context: text,
        app_id: (id) => id === null || integer(-1)(id) })), strict: boolean,
    }, { url: uri, contexts_url: uri, enforcement_level: text }),
    enforce_admins: (item) => fields(item, { url: uri, enabled: boolean }),
    required_pull_request_reviews: (item) => item === null || fields(item, {
      dismiss_stale_reviews: boolean, require_code_owner_reviews: boolean,
    }, { url: uri, required_approving_review_count: integer(0, 6), require_last_push_approval: boolean,
      dismissal_restrictions: people, bypass_pull_request_allowances: people }),
    restrictions: (item) => item === null || fields(item, { url: uri, users_url: uri, teams_url: uri, apps_url: uri,
      users: list((person) => object(person) && text(person.login)), teams: list((team) => object(team) && text(team.slug)),
      apps: list((app) => object(app) && integer(1)(app.id)) }),
  };
  for (const key of ['required_linear_history', 'allow_force_pushes', 'allow_deletions', 'block_creations',
    'required_conversation_resolution', 'lock_branch', 'allow_fork_syncing']) validators[key] = flag;
  validators.required_signatures = (item) => fields(item, { url: uri, enabled: boolean });
  return Object.entries(value).every(([key, item]) => Object.hasOwn(validators, key) && validators[key](item));
}

const parameterRules = {
  update: (value) => fields(value, { update_allows_fetch_and_merge: boolean }),
  merge_queue: (value) => fields(value, { check_response_timeout_minutes: integer(1, 360),
    grouping_strategy: oneOf('ALLGREEN', 'HEADGREEN'), max_entries_to_build: integer(0, 100),
    max_entries_to_merge: integer(0, 100), merge_method: oneOf('MERGE', 'SQUASH', 'REBASE'),
    min_entries_to_merge: integer(0, 100), min_entries_to_merge_wait_minutes: integer(0, 360) }),
  required_deployments: (value) => fields(value, { required_deployment_environments: list(text) }),
  pull_request: (value) => fields(value, { dismiss_stale_reviews_on_push: boolean, require_code_owner_review: boolean,
    require_last_push_approval: boolean, required_approving_review_count: integer(0, 10),
    required_review_thread_resolution: boolean }, {
    allowed_merge_methods: list(oneOf('merge', 'squash', 'rebase')),
    require_extra_approval_for_unattributed_changes: boolean,
    dismissal_restriction: (item) => fields(item, { enabled: boolean }, {
      allowed_actors: list((actor) => fields(actor, { id: integer(1),
        type: oneOf('User', 'Team', 'IntegrationInstallation', 'RepositoryRole') })),
    }),
    required_reviewers: list((item) => fields(item, { file_patterns: list(text), minimum_approvals: integer(0),
      reviewer: (person) => fields(person, { id: integer(1), type: oneOf('Team', 'User') }) })),
  }),
  required_status_checks: (value) => fields(value, { required_status_checks: list(statusCheck),
    strict_required_status_checks_policy: boolean }, { do_not_enforce_on_create: boolean }),
  workflows: (value) => fields(value, { workflows: list((item) => fields(item, {
    path: text, repository_id: integer(1),
  }, { ref: text, sha: text })) }, { do_not_enforce_on_create: boolean }),
  code_scanning: (value) => fields(value, { code_scanning_tools: list((tool) => fields(tool, {
    tool: text, alerts_threshold: oneOf('none', 'errors', 'errors_and_warnings', 'all'),
    security_alerts_threshold: oneOf('none', 'critical', 'high_or_higher', 'medium_or_higher', 'all'),
  })) }),
  code_quality: (value) => fields(value, { severity: oneOf('errors', 'warnings', 'notes', 'all') }),
  code_coverage: (value) => fields(value, {}, { max_coverage_drop: number, minimum_coverage: number }),
  copilot_code_review: (value) => fields(value, {}, { review_draft_pull_requests: boolean, review_on_push: boolean }),
  file_path_restriction: (value) => fields(value, { restricted_file_paths: list(text) }, { ignored_file_paths: list(text) }),
  max_file_path_length: (value) => fields(value, { max_file_path_length: integer(1, 32767) }),
  file_extension_restriction: (value) => fields(value, { restricted_file_extensions: list(text) }),
  max_file_size: (value) => fields(value, { max_file_size: integer(1, 100) }, { ignored_file_paths: list(text) }),
};
for (const type of ['commit_message_pattern', 'commit_author_email_pattern', 'committer_email_pattern',
  'branch_name_pattern', 'tag_name_pattern']) parameterRules[type] = pattern;
const simpleRules = new Set(['creation', 'deletion', 'required_linear_history', 'required_signatures',
  'non_fast_forward', 'license_compliance_scanning']);

function validRule(value) {
  if (!object(value) || !text(value.type)) return false;
  if (!optional(value.ruleset_id, integer(1)) || !optional(value.ruleset_source, text) ||
    !optional(value.ruleset_source_type, oneOf('Repository', 'Organization', 'Enterprise'))) return false;
  if (Object.keys(value).some((key) => !['type', 'parameters', 'ruleset_id', 'ruleset_source',
    'ruleset_source_type'].includes(key))) return false;
  if (simpleRules.has(value.type)) return value.parameters === undefined || fields(value.parameters, {});
  return Object.hasOwn(parameterRules, value.type) && parameterRules[value.type](value.parameters);
}

export function classifyNativeRuleAccess(context, reads) {
  const verified = context.identityVerified === true && context.writeAccessVerified === true;
  const complete = Array.isArray(reads) && reads.length === 2 &&
    apis.every((api) => reads.filter((read) => read?.api === api).length === 1) &&
    reads.every((read) => read?.complete === true);
  const classified = complete ? reads.map((read) => {
    let availability = 'unknown';
    if (read.httpStatus === 200 &&
      (read.api === 'effective-rules' ? list(validRule)(read.body) : validProtection(read.body))) availability = 'available';
    else if (read.api === 'branch-protection' && read.httpStatus === 404 &&
      read.body?.message === 'Branch not protected') availability = 'not-protected';
    else if (read.httpStatus === 403 && read.body?.message === unavailableMessage &&
      context.host === 'github.com' && context.privateRepository === true && verified) availability = 'feature-unavailable';
    else if ([401, 403].includes(read.httpStatus)) availability = 'denied';
    return { api: read.api, httpStatus: read.httpStatus, availability,
      ...(availability === 'available' ? { data: read.body } : {}) };
  }) : [];
  const blocked = !verified || !complete ||
    classified.some((read) => !['available', 'not-protected', 'feature-unavailable'].includes(read.availability));
  return {
    status: blocked ? 'blocked' : classified.some((read) => read.availability === 'available') ?
      'inspection-required' : 'native-enforcement-only',
    identityVerified: context.identityVerified === true,
    writeAccessVerified: context.writeAccessVerified === true,
    rulesKnownAbsent: false,
    requiresNormalGitHubEnforcement: true,
    reads: classified,
  };
}

export function readNativeRuleAccess({ host, repository, branch }, execute = execFileSync) {
  if (typeof host !== 'string' || !/^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)*[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i.test(host) ||
    typeof repository !== 'string' || !/^[a-z0-9_.-]+\/[a-z0-9_.-]+$/i.test(repository) ||
    repository.split('/').some((part) => ['.', '..'].includes(part)) ||
    typeof branch !== 'string' || !branch || branch.length > 256 || /[\s\x00-\x1f\x7f]/.test(branch)) {
    throw new Error('An actual GitHub host, owner/repo and base branch are required.');
  }
  const read = (endpoint) => {
    let output;
    let failed = false;
    try {
      output = execute('gh', ['api', '--hostname', host, '--method', 'GET', '--include', endpoint], {
        encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 10_000, maxBuffer: 512 * 1024,
      });
    } catch (error) {
      failed = true;
      output = error.stdout ?? '';
    }
    output = String(output);
    const status = /^HTTP\/[\d.]+\s+(\d{3})\b/m.exec(output);
    const separator = /\r?\n\r?\n/.exec(output);
    try {
      if (!status || !separator) throw new Error('Incomplete HTTP response');
      const httpStatus = Number(status[1]);
      const paginated = /(?:^|\n)link:[^\r\n]*\brel="?next"?/i.test(output.slice(0, separator.index));
      return { httpStatus, body: JSON.parse(output.slice(separator.index + separator[0].length)),
        complete: (!failed || httpStatus >= 400) && !paginated };
    } catch {
      return { httpStatus: null, body: null, complete: false };
    }
  };
  const firstUser = read('user');
  const repo = read(`repos/${repository}`);
  const branchPath = encodeURIComponent(branch);
  const reads = [
    { api: apis[0], ...read(`repos/${repository}/branches/${branchPath}/protection`) },
    { api: apis[1], ...read(`repos/${repository}/rules/branches/${branchPath}`) },
  ];
  const lastUser = read('user');
  const login = firstUser.body?.login;
  const lastLogin = lastUser.body?.login;
  const repositoryName = repo.body?.full_name;
  const context = {
    host: host.toLowerCase(),
    privateRepository: repo.body?.private === true,
    identityVerified: firstUser.complete && lastUser.complete && firstUser.httpStatus === 200 && lastUser.httpStatus === 200 &&
      typeof login === 'string' && Boolean(login) && typeof lastLogin === 'string' && login.toLowerCase() === lastLogin.toLowerCase(),
    writeAccessVerified: repo.complete && repo.httpStatus === 200 && typeof repositoryName === 'string' &&
      repositoryName.toLowerCase() === repository.toLowerCase() && repo.body?.permissions?.push === true,
  };
  return { host, repository, branch, login, ...classifyNativeRuleAccess(context, reads) };
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  try {
    const [host, repository, branch, ...extra] = process.argv.slice(2);
    if (extra.length) throw new Error('Usage: native-rule-access.mjs <host> <owner/repo> <base-branch>');
    const result = readNativeRuleAccess({ host, repository, branch });
    console.log(JSON.stringify(result));
    if (result.status === 'blocked') process.exitCode = 1;
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
