import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, readdirSync, rmdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { initializeToolkit } from '../skills/init-toolkit/scripts/init-toolkit.mjs';

const template = readFileSync(new URL('../skills/init-toolkit/assets/AGENTS.md', import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const script = fileURLToPath(new URL('../skills/init-toolkit/scripts/init-toolkit.mjs', import.meta.url));

function fixture(t) {
  const directory = mkdtempSync(join(tmpdir(), 'toolkit-init-test-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  return directory;
}

test('creates the workspace entry point and repeats without changing it', (t) => {
  const directory = fixture(t);
  assert.equal(initializeToolkit(directory).created, true);
  const path = join(directory, 'AGENTS.md');
  assert.equal(readFileSync(path, 'utf8'), template);
  assert.equal(initializeToolkit(directory).changed, false);
  assert.deepEqual(readdirSync(directory), ['AGENTS.md']);
});

test('preserves unmarked instructions, BOM, CRLF and local registry data', (t) => {
  const directory = fixture(t);
  const path = join(directory, 'AGENTS.md');
  const original = '# Local instructions\r\n\r\n## Registry\r\n| private-repo | local-path |\r\n';
  writeFileSync(path, '\uFEFF' + original);
  initializeToolkit(directory);
  const actual = readFileSync(path, 'utf8');
  assert(actual.startsWith('\uFEFF<!-- personal-toolkit:start -->\r\n'));
  assert(actual.endsWith(original));
  assert.equal(initializeToolkit(directory).changed, false);
});

test('refreshes only the managed block and leaves child repositories untouched', (t) => {
  const directory = fixture(t);
  const path = join(directory, 'AGENTS.md');
  const before = '# Local prefix\n\n';
  const after = '\n\n## Local registry\nKeep every row.\n';
  writeFileSync(path, before + '<!-- personal-toolkit:start -->\nOld routing\n<!-- personal-toolkit:end -->' + after);
  const child = join(directory, 'child-repo');
  mkdirSync(child);
  writeFileSync(join(child, 'AGENTS.md'), 'Child-specific rules.\n');
  initializeToolkit(directory);
  assert.equal(readFileSync(path, 'utf8'), before + template.trimEnd() + after);
  assert.equal(readFileSync(join(child, 'AGENTS.md'), 'utf8'), 'Child-specific rules.\n');
  assert.equal(initializeToolkit(directory).changed, false);
});

test('dry run previews creation and refresh without filesystem changes', (t) => {
  const directory = fixture(t);
  assert.deepEqual(initializeToolkit(directory, { dryRun: true }), {
    path: join(directory, 'AGENTS.md'), changed: true, created: true,
  });
  assert.deepEqual(readdirSync(directory), []);
  const path = join(directory, 'AGENTS.md');
  writeFileSync(path, 'Keep these instructions.\n');
  assert.equal(initializeToolkit(directory, { dryRun: true }).changed, true);
  assert.equal(readFileSync(path, 'utf8'), 'Keep these instructions.\n');
});

test('rejects malformed, reversed and duplicate markers without replacing content', (t) => {
  const directory = fixture(t);
  const path = join(directory, 'AGENTS.md');
  for (const original of [
    '<!-- personal-toolkit:start -->\nMissing end.\n',
    '<!-- personal-toolkit:end -->\n<!-- personal-toolkit:start -->\n',
    '<!-- personal-toolkit:start -->\n<!-- personal-toolkit:start -->\n<!-- personal-toolkit:end -->\n',
    'Inline <!-- personal-toolkit:start -->\n<!-- personal-toolkit:end -->\n',
  ]) {
    writeFileSync(path, original);
    assert.throws(() => initializeToolkit(directory), /malformed or duplicate/);
    assert.equal(readFileSync(path, 'utf8'), original);
  }
  assert.deepEqual(readdirSync(directory), ['AGENTS.md']);
});

test('rejects implicit targets, non-files and non-UTF-8 content', (t) => {
  const directory = fixture(t);
  assert.throws(() => initializeToolkit(), /absolute existing/);
  assert.throws(() => initializeToolkit('relative-folder'), /absolute existing/);
  assert.throws(() => initializeToolkit(join(directory, 'missing')), /ENOENT/);
  const path = join(directory, 'AGENTS.md');
  mkdirSync(path);
  assert.throws(() => initializeToolkit(directory), /regular file/);
  rmdirSync(path);
  for (const bytes of [Buffer.from([0xff]), Buffer.from([0])]) {
    writeFileSync(path, bytes);
    assert.throws(() => initializeToolkit(directory), /UTF-8 text/);
    assert.deepEqual(readFileSync(path), bytes);
  }
});

test('CLI requires an explicit target instead of modifying its current directory', (t) => {
  const directory = fixture(t);
  const result = spawnSync(process.execPath, [script], { cwd: directory, encoding: 'utf8' });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Usage:/);
  assert.deepEqual(readdirSync(directory), []);
});

test('refuses a linked AGENTS.md without changing the linked destination', (t) => {
  const directory = fixture(t);
  const destination = join(directory, 'original');
  mkdirSync(destination);
  writeFileSync(join(destination, 'keep.txt'), 'Preserve this destination.\n');
  symlinkSync(destination, join(directory, 'AGENTS.md'), 'junction');
  assert.throws(() => initializeToolkit(directory), /regular file/);
  assert.equal(readFileSync(join(destination, 'keep.txt'), 'utf8'), 'Preserve this destination.\n');
  assert.deepEqual(readdirSync(destination), ['keep.txt']);
});
