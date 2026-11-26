import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const unavailableMessage = 'Upgrade to GitHub Pro or make this repository public to enable this feature.';
const apis = ['branch-protection', 'effective-rules'];

export function classifyNativeRuleAccess(context, reads) {
  const verified = context.identityVerified === true && context.writeAccessVerified === true;
  const complete = Array.isArray(reads) && reads.length === 2 &&
    apis.every((api) => reads.filter((read) => read?.api === api).length === 1) &&
    reads.every((read) => read?.complete === true);
  const classified = complete ? reads.map((read) => {
    const object = read.body !== null && typeof read.body === 'object';
    let availability = 'unknown';
    if (read.httpStatus === 200 && object &&
      (read.api === 'effective-rules' ? Array.isArray(read.body) : !Array.isArray(read.body) &&
        'required_status_checks' in read.body && 'enforce_admins' in read.body)) availability = 'available';
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
  if (typeof host !== 'string' || !/^[a-z0-9.-]+$/i.test(host) ||
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
