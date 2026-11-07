import assert from 'node:assert/strict';
import { cpSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { validateMarketplace } from '../scripts/validate-marketplace.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function fixture(t) {
  const directory = mkdtempSync(join(tmpdir(), 'personal-toolkit-test-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  for (const path of [
    'plugin.json',
    'agency.json',
    '.github',
    '.claude-plugin',
    '.codex-plugin',
    '.agents',
    'skills',
    'README.md',
  ]) {
    cpSync(join(root, path), join(directory, path), { recursive: true });
  }
  return directory;
}

function editJson(directory, path, edit) {
  const file = join(directory, path);
  const value = JSON.parse(readFileSync(file, 'utf8'));
  edit(value);
  writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

test('all native catalogs resolve the same toolkit and discover bundled skills', () => {
  const result = validateMarketplace(root);
  assert(result.skills.includes('implement'));
  assert(result.skills.includes('new-issue'));
});

test('rejects compatibility-manifest version drift', (t) => {
  const directory = fixture(t);
  editJson(directory, '.claude-plugin/plugin.json', (value) => {
    value.version = '0.0.0';
  });
  assert.throws(() => validateMarketplace(directory), /version drift/);
});

test('rejects divergent Copilot and Claude catalogs', (t) => {
  const directory = fixture(t);
  editJson(directory, '.claude-plugin/marketplace.json', (value) => {
    value.plugins[0].name = 'different-toolkit';
  });
  assert.throws(() => validateMarketplace(directory), /catalogs must match/);
});

test('rejects symlink-only Claude metadata that breaks ordinary Windows checkouts', (t) => {
  const directory = fixture(t);
  const metadata = join(directory, '.claude-plugin');
  rmSync(metadata, { recursive: true });
  symlinkSync(join(directory, '.github', 'plugin'), metadata, 'junction');
  assert.throws(() => validateMarketplace(directory), /real directory, not a symlink/);
});

test('rejects a plugin path that resolves outside the marketplace root', (t) => {
  const directory = fixture(t);
  for (const path of ['.github/plugin/marketplace.json', '.claude-plugin/marketplace.json']) {
    editJson(directory, path, (value) => {
      value.plugins[0].source = '../other-plugin';
    });
  }
  assert.throws(() => validateMarketplace(directory), /repository root/);
});

test('rejects Codex catalog identity and source drift', (t) => {
  for (const [label, edit, expected] of [
    ['identity', (value) => { value.plugins[0].name = 'wrong'; }, /identity drift/],
    ['source', (value) => { value.plugins[0].source.path = './missing'; }, /Codex plugin source/],
  ]) {
    const directory = fixture(t);
    editJson(directory, '.agents/plugins/marketplace.json', edit);
    assert.throws(() => validateMarketplace(directory), expected, label);
  }
});

test('rejects renamed skills and missing descriptions', (t) => {
  for (const [label, edit, expected] of [
    ['name', (text) => text.replace('name: new-issue', 'name: wrong'), /must match directory/],
    ['description', (text) => text.replace(/description: >[\s\S]*?\n---/, 'description: ""\n---'), /empty description/],
  ]) {
    const directory = fixture(t);
    const file = join(directory, 'skills', 'new-issue', 'SKILL.md');
    writeFileSync(file, edit(readFileSync(file, 'utf8')));
    assert.throws(() => validateMarketplace(directory), expected, label);
  }
});

test('rejects missing skill entrypoints and undocumented bundled skills', (t) => {
  const directory = fixture(t);
  const skillFile = join(directory, 'skills', 'new-issue', 'SKILL.md');
  const text = readFileSync(skillFile, 'utf8');
  rmSync(skillFile);
  assert.throws(() => validateMarketplace(directory), /ENOENT/);
  writeFileSync(skillFile, text);
  const readme = join(directory, 'README.md');
  writeFileSync(readme, readFileSync(readme, 'utf8').replaceAll('skills/new-issue/SKILL.md', 'removed'));
  assert.throws(() => validateMarketplace(directory), /README must link/);
});
