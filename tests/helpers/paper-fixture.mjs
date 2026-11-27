import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
export const base = join(root, 'skills', 'paper');
export const atlas = join(base, 'assets', 'paper.html');
export const types = JSON.parse(readFileSync(join(base, 'references', 'paper-types.json'), 'utf8')).types;

export function runPaper(...args) {
  const result = spawnSync(process.platform === 'win32' ? 'python' : 'python3',
    [join(base, 'scripts', 'paper.py'), ...args], {
      cwd: root, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024,
      env: { ...process.env, PYTHONDONTWRITEBYTECODE: '1' },
    });
  assert(!result.error, result.error?.message);
  assert.equal(result.signal, null, result.stderr);
  return { ...result, data: JSON.parse(result.stdout) };
}

export function fixture(t, identifier = 'research-and-investigation', options = {}) {
  const directory = mkdtempSync(join(tmpdir(), 'paper-skill-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const selected = types.find((type) => type.id === identifier);
  const fields = {
    TITLE: 'Synthetic paper fixture',
    DESCRIPTION: 'A labelled fixture for paper behavior, not product evidence.',
    BRAND: 'Paper',
    DEK: 'This synthetic fixture makes no delivery, funding or approval claim.',
    STATUS: 'Synthetic',
    DATE: 'Undated',
    AUDIENCE: 'Test readers',
    SIDEBAR_NOTE: selected.goal,
    FOOTER_HTML: '<p>This is a synthetic verification fixture.</p>',
    TERMINOLOGY_HTML: '<dl><dt>Fixture</dt><dd>A synthetic test input, not independent evidence or approval.</dd></dl>',
  };
  selected.mainSections.forEach((group, index) => {
    fields[`SECTION_${index + 1}_HEADING`] = group.title;
    fields[`SECTION_${index + 1}_HTML`] = '<p>This is a synthetic fixture. Scope and uncertainty remain visible.</p>' +
      group.required.filter((id) => id !== 'terminology').map((id) => {
        const topic = selected.required.find((item) => item.id === id);
        return `<div id="${id}"><h3>${topic.title}</h3><p>This synthetic content tests ${id} coverage, not a real capability.</p></div>`;
      }).join('');
  });
  fields.SECTION_3_HTML += '<details data-reader-depth="1" id="depth-one"><summary>Supporting detail</summary>' +
    '<p>Optional synthetic supporting detail.</p><details data-reader-depth="2" id="depth-two">' +
    '<summary>Technical reference</summary><p id="deep-target">Synthetic reference only.</p></details></details>' +
    '<pre id="fixture-code"><code class="language-json">{\n  "sample": true\n}</code></pre>';
  Object.assign(fields, options.fields);
  const input = join(directory, 'fields.json');
  const paper = join(directory, 'paper.html');
  writeFileSync(input, JSON.stringify(fields));
  const generated = runPaper('init', paper, '--type', identifier, '--content', input, '--palette', options.palette || 'azure');
  assert.equal(generated.status, 0, generated.stdout + generated.stderr);
  const receipt = join(directory, 'review.json');
  return { directory, paper, receipt, selected, fields };
}

export function receiptFor(paper, selected) {
  const checked = runPaper('review', paper, '--structure-only');
  assert.equal(checked.status, 0, JSON.stringify(checked.data));
  assert.equal(checked.data.status, 'needs-author-review');
  return {
    sha256: checked.data.sha256,
    type: selected.id,
    checks: Object.fromEntries(checked.data.rubric.map(({ id }) => [id, {
      status: 'pass',
      rationale: 'This labelled synthetic fixture exercises review completeness; it does not claim independent truth verification.',
      anchors: ['#paper-section-1', '#sources'],
    }])),
    conditionalCoverage: Object.fromEntries(selected.conditional.map(({ id }) => [id, {
      applies: false, reason: 'The synthetic fixture does not request this conditional scope.',
    }])),
    browser: { offline: true, desktop: true, mobile: true, keyboard: true, readerControls: true },
  };
}
