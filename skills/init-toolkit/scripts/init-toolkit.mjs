import { isUtf8 } from 'node:buffer';
import { randomUUID } from 'node:crypto';
import { lstatSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { isAbsolute, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const start = '<!-- personal-toolkit:start -->';
const end = '<!-- personal-toolkit:end -->';
const template = readFileSync(new URL('../assets/AGENTS.md', import.meta.url), 'utf8').trimEnd();

function render(existing) {
  const bom = existing.startsWith('\uFEFF') ? '\uFEFF' : '';
  const body = existing.slice(bom.length);
  const newline = body.includes('\r\n') ? '\r\n' : '\n';
  const block = template.replace(/\r?\n/g, newline);
  const starts = [...body.matchAll(/^<!-- personal-toolkit:start -->(?=\r?$)/gm)];
  const ends = [...body.matchAll(/^<!-- personal-toolkit:end -->(?=\r?$)/gm)];
  if (!body.includes(start) && !body.includes(end)) {
    return `${bom}${block}${newline}${body ? newline + body : ''}`;
  }
  if (starts.length !== 1 || ends.length !== 1 || starts[0].index >= ends[0].index
    || body.split(start).length !== 2 || body.split(end).length !== 2) {
    throw new Error('AGENTS.md has malformed or duplicate personal-toolkit markers; preserve it and resolve manually.');
  }
  return bom + body.slice(0, starts[0].index) + block + body.slice(ends[0].index + end.length);
}

export function initializeToolkit(directory, { dryRun = false } = {}) {
  if (!directory || !isAbsolute(directory)) {
    throw new Error('Specify an absolute existing target directory; no implicit workspace is selected.');
  }
  const target = resolve(directory);
  if (!lstatSync(target).isDirectory()) {
    throw new Error('The target must be an existing directory, not a file or symlink.');
  }
  const path = join(target, 'AGENTS.md');
  const entry = lstatSync(path, { throwIfNoEntry: false });
  if (entry && !entry.isFile()) {
    throw new Error('AGENTS.md must be a regular file, not a directory or symlink.');
  }
  const original = entry ? readFileSync(path) : Buffer.alloc(0);
  if (!isUtf8(original) || original.includes(0)) {
    throw new Error('AGENTS.md must be UTF-8 text; no changes were made.');
  }
  const next = render(original.toString('utf8'));
  const changed = !original.equals(Buffer.from(next, 'utf8'));
  if (!changed || dryRun) return { path, changed, created: !entry };

  if (!entry) {
    writeFileSync(path, next, { encoding: 'utf8', flag: 'wx' });
  } else {
    const temporary = join(target, `.AGENTS.md.personal-toolkit-${randomUUID()}.tmp`);
    try {
      writeFileSync(temporary, next, { encoding: 'utf8', flag: 'wx', mode: entry.mode & 0o777 });
      const current = lstatSync(path, { throwIfNoEntry: false });
      if (!current?.isFile() || !readFileSync(path).equals(original)) {
        throw new Error('AGENTS.md changed during initialization; retry after reviewing the current file.');
      }
      renameSync(temporary, path);
    } finally {
      rmSync(temporary, { force: true });
    }
  }
  return { path, changed, created: !entry };
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  try {
    const args = process.argv.slice(2);
    const dryRun = args.includes('--dry-run');
    const targets = args.filter((arg) => arg !== '--dry-run');
    if (targets.length !== 1 || args.length !== targets.length + Number(dryRun)) {
      throw new Error('Usage: node init-toolkit.mjs <absolute-existing-directory> [--dry-run]');
    }
    const result = initializeToolkit(targets[0], { dryRun });
    const action = result.changed ? (result.created ? 'create' : 'update') : 'leave unchanged';
    console.log(`${dryRun ? 'Would' : 'Completed:'} ${action} ${result.path}`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
