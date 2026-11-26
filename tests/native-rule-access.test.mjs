import assert from 'node:assert/strict';
import { test } from 'node:test';
import { classifyNativeRuleAccess, readNativeRuleAccess } from '../skills/approve/scripts/native-rule-access.mjs';

const message = 'Upgrade to GitHub Pro or make this repository public to enable this feature.';
const context = { host: 'github.com', privateRepository: true, identityVerified: true, writeAccessVerified: true };
const unavailable = () => ['branch-protection', 'effective-rules'].map((api) => ({ api, httpStatus: 403, body: { message }, complete: true }));
const options = { host: 'github.com', repository: 'owner/repo', branch: 'release/v1' };
const response = (httpStatus, body, separator = '\r\n') =>
  `HTTP/2.0 ${httpStatus}${separator}Content-Type: application/json${separator}${separator}${JSON.stringify(body)}`;

test('verified private-plan capability limitations do not become paid merge prerequisites or absent rules', () => {
  const result = classifyNativeRuleAccess(context, unavailable());
  assert.equal(result.status, 'native-enforcement-only');
  assert.equal(result.rulesKnownAbsent, false);
  assert.equal(result.requiresNormalGitHubEnforcement, true);
  assert.deepEqual(result.reads.map((read) => read.availability), ['feature-unavailable', 'feature-unavailable']);
});

test('authentication failures, other denials, ambiguous missing and malformed responses stay blocked', () => {
  for (const read of [
    { httpStatus: 401, body: { message: 'Bad credentials' } },
    { httpStatus: 403, body: { message: 'Resource not accessible by integration' } },
    { httpStatus: 404, body: { message: 'Not Found' } },
    { httpStatus: 200, body: null },
    { httpStatus: 200, body: {} },
    { httpStatus: null, body: null },
    { httpStatus: 403, body: { message }, complete: false },
  ]) {
    const reads = unavailable();
    reads[0] = { api: 'branch-protection', complete: true, ...read };
    assert.equal(classifyNativeRuleAccess(context, reads).status, 'blocked', JSON.stringify(read));
  }
});

test('a capability message without verified private-repository identity/write access cannot authorize the route', () => {
  for (const override of [
    { identityVerified: false }, { writeAccessVerified: false }, { privateRepository: false }, { host: 'ghe.example' },
  ]) assert.equal(classifyNativeRuleAccess({ ...context, ...override }, unavailable()).status, 'blocked');
  assert.equal(classifyNativeRuleAccess(context, unavailable().slice(0, 1)).status, 'blocked');
  assert.equal(classifyNativeRuleAccess(context, [unavailable()[0], unavailable()[0]]).status, 'blocked');
});

test('available rule data remains inspectable even when another API is a verified unavailable capability', () => {
  const reads = unavailable();
  reads[1] = { api: 'effective-rules', httpStatus: 200, body: [{ type: 'pull_request', parameters: { required_approving_review_count: 2 } }], complete: true };
  const result = classifyNativeRuleAccess(context, reads);
  assert.equal(result.status, 'inspection-required');
  assert.equal(result.reads[1].data[0].parameters.required_approving_review_count, 2);
  reads[0] = { api: 'branch-protection', httpStatus: 404, body: { message: 'Branch not protected' }, complete: true };
  assert.equal(classifyNativeRuleAccess(context, reads).status, 'inspection-required');
});

function reader({ secondLogin = 'owner', writeAccess = true, malformed = false, paginated = false, failedSuccess = false } = {}) {
  let userReads = 0;
  const endpoints = [];
  const execute = (command, args) => {
    assert.equal(command, 'gh');
    assert.equal(args[args.indexOf('--method') + 1], 'GET');
    assert.equal(args[args.indexOf('--hostname') + 1], 'github.com');
    const endpoint = args.at(-1);
    endpoints.push(endpoint);
    if (endpoint === 'user') return response(200, { login: ++userReads === 1 ? 'owner' : secondLogin });
    if (endpoint === 'repos/owner/repo') return response(200, { full_name: 'owner/repo', private: true, permissions: { push: writeAccess } });
    if (paginated && endpoint.includes('/rules/branches/')) return response(200, []).replace('Content-Type:', 'Link: <https://api.github.com/next>; rel="next"\r\nContent-Type:');
    const error = new Error('gh request failed');
    error.stdout = malformed ? 'not an HTTP response' : failedSuccess
      ? response(200, { required_status_checks: null, enforce_admins: { enabled: false } })
      : response(403, { message }, '\n');
    throw error;
  };
  return { execute, endpoints };
}

test('the live reader captures denied HTTP bodies, binds identity/access, and URL-encodes the exact branch using only GETs', () => {
  const fixture = reader();
  const result = readNativeRuleAccess(options, fixture.execute);
  assert.equal(result.status, 'native-enforcement-only');
  assert(fixture.endpoints.includes('repos/owner/repo/branches/release%2Fv1/protection'));
  assert(fixture.endpoints.includes('repos/owner/repo/rules/branches/release%2Fv1'));
});

test('identity change, missing write access and unusable HTTP evidence fail closed in the live reader', () => {
  for (const input of [{ secondLogin: 'different-owner' }, { secondLogin: 12 }, { writeAccess: false },
    { malformed: true }, { paginated: true }, { failedSuccess: true }]) {
    assert.equal(readNativeRuleAccess(options, reader(input).execute).status, 'blocked');
  }
});

test('invalid destination arguments never reach gh', () => {
  const execute = () => { assert.fail('Must not execute'); };
  for (const override of [{ host: 'github.com\nbad' }, { repository: '../repo' }, { branch: 'main\nbad' }, { branch: '' }]) {
    assert.throws(() => readNativeRuleAccess({ ...options, ...override }, execute), /actual GitHub host/);
  }
});
