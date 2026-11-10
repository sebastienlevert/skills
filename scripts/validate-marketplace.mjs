import assert from 'node:assert/strict';
import { lstatSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const schema = 'https://agent-plugins.org/schemas/1.0.0/plugin.schema.json';
const defaultRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function readJson(root, path) {
  const file = join(root, path);
  assert(lstatSync(file).isFile(), `${path} must be a regular file`);
  return JSON.parse(readFileSync(file, 'utf8'));
}

function skillName(root, directory) {
  const path = join(root, 'skills', directory, 'SKILL.md');
  const text = readFileSync(path, 'utf8');
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  assert(match, `${directory}: missing SKILL.md frontmatter`);
  const lines = match[1].split(/\r?\n/);
  const name = match[1].match(/^name:\s*(['"]?)([a-z0-9]+(?:-[a-z0-9]+)*)\1\s*$/m);
  assert(name, `${directory}: missing or invalid skill name`);
  assert.equal(name[2], directory, `${directory}: skill name must match directory`);
  const index = lines.findIndex((line) => /^description:/.test(line));
  assert(index >= 0, `${directory}: missing description`);
  let description = lines[index].replace(/^description:\s*/, '').trim();
  if (/^[>|][+-]?$/.test(description)) {
    description = '';
    for (const line of lines.slice(index + 1)) {
      if (line && !/^\s/.test(line)) break;
      description += ` ${line.trim()}`;
    }
  }
  assert(description.replace(/['"]/g, '').trim(), `${directory}: empty description`);
  if (directory === 'init-toolkit') {
    assert.match(match[1], /^disable-model-invocation:\s*true\s*$/m, 'init-toolkit must disable implicit invocation');
    const policy = readFileSync(join(root, 'skills', directory, 'agents', 'openai.yaml'), 'utf8');
    assert.match(policy, /^policy:\r?\n  allow_implicit_invocation: false\s*$/m, 'init-toolkit must disable Codex implicit invocation');
  }
  return name[2];
}

export function validateMarketplace(root = defaultRoot) {
  for (const directory of ['.github/plugin', '.claude-plugin', '.codex-plugin', '.agents/plugins']) {
    const entry = lstatSync(join(root, directory));
    assert(
      entry.isDirectory() && !entry.isSymbolicLink(),
      `${directory} must be a real directory, not a symlink`
    );
  }

  const manifest = readJson(root, 'plugin.json');
  assert.equal(manifest.$schema, schema, 'portable manifest schema');
  assert.match(manifest.name, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  assert.match(manifest.version, /^\d+\.\d+\.\d+(?:[-+][a-zA-Z0-9.+-]+)?$/);
  assert(manifest.description?.trim(), 'plugin description is required');

  for (const path of ['.claude-plugin/plugin.json', '.codex-plugin/plugin.json']) {
    const compatibility = readJson(root, path);
    for (const field of ['name', 'version', 'description', 'author', 'repository']) {
      assert.deepEqual(compatibility[field], manifest[field], `${path}: ${field} drift`);
    }
  }
  assert.equal(readJson(root, '.codex-plugin/plugin.json').skills, './skills/');

  const github = readJson(root, '.github/plugin/marketplace.json');
  const claude = readJson(root, '.claude-plugin/marketplace.json');
  assert.deepEqual(claude, github, 'Copilot and Claude catalogs must match');
  assert(github.name?.trim(), 'marketplace name is required');
  assert(github.owner?.name?.trim(), 'marketplace owner is required');
  assert.equal(github.metadata.version, manifest.version, 'catalog version drift');
  assert.equal(github.plugins.length, 1, 'this catalog distributes one shared toolkit');
  const entry = github.plugins[0];
  for (const field of ['name', 'version', 'description', 'author']) {
    assert.deepEqual(entry[field], manifest[field], `catalog ${field} drift`);
  }
  assert.equal(entry.source, './', 'plugin source must resolve to the repository root');

  const codex = readJson(root, '.agents/plugins/marketplace.json');
  assert.equal(codex.name, github.name, 'Codex marketplace identity drift');
  assert(codex.interface.displayName?.trim(), 'Codex display name is required');
  assert.equal(codex.plugins.length, 1);
  assert.equal(codex.plugins[0].name, manifest.name, 'Codex plugin identity drift');
  assert.deepEqual(
    codex.plugins[0].source,
    { source: 'local', path: './' },
    'Codex plugin source must resolve to the repository root'
  );
  assert.deepEqual(codex.plugins[0].policy, {
    installation: 'AVAILABLE',
    authentication: 'ON_INSTALL',
  });
  assert.equal(codex.plugins[0].category, 'Productivity');
  assert.deepEqual(readJson(root, 'agency.json').engines, ['copilot', 'claude', 'codex']);

  const skills = readdirSync(join(root, 'skills'), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => skillName(root, entry.name))
    .sort();
  assert(skills.length > 0, 'toolkit must contain skills');
  assert.equal(new Set(skills).size, skills.length, 'skill names must be unique');
  const readme = readFileSync(join(root, 'README.md'), 'utf8');
  for (const name of skills) {
    assert(
      readme.includes(`skills/${name}/SKILL.md`),
      `README must link to the ${name} skill`
    );
  }
  return { name: manifest.name, version: manifest.version, skills };
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  try {
    const result = validateMarketplace();
    console.log(`${result.name} ${result.version}: ${result.skills.length} skills; marketplace checks passed.`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
