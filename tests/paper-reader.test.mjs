import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { Script } from 'node:vm';
import { atlas, base, fixture, receiptFor, runPaper, types } from './helpers/paper-fixture.mjs';
import { validateMarketplace } from '../scripts/validate-marketplace.mjs';

test('one discoverable paper skill replaces the legacy invocation and has linked local contracts', () => {
  const result = validateMarketplace();
  assert(result.skills.includes('paper'));
  assert(!result.skills.includes('paper-strategist'));
  const source = readFileSync(join(base, 'SKILL.md'), 'utf8');
  for (const [, target] of source.matchAll(/\]\(([^)#]+)(?:#[^)]*)?\)/g)) {
    assert(readFileSync(join(base, target), 'utf8').trim(), target);
  }
});

test('type starters regenerate from one atlas and preserve each outcome without private topic rules', () => {
  assert.equal(runPaper('themes', '--check').status, 0);
  assert.equal(runPaper('templates', '--check').status, 0);
  for (const selected of types) {
    const source = readFileSync(join(base, 'templates', `${selected.id}.html`), 'utf8');
    assert.equal((source.match(/<section id="paper-section-/g) || []).length, 5);
    assert.match(source, /id="terminology"/);
    assert.match(source, /id="paper-reader-persona"/);
    assert.doesNotMatch(source, /id="component-library"/);
    const coverage = selected.mainSections.flatMap((group) => group.required);
    assert.deepEqual([...coverage].sort(), selected.required.map((topic) => topic.id).sort());
  }
  const rules = JSON.parse(readFileSync(join(base, 'references', 'critical-content-rules.json'), 'utf8'));
  assert(!rules.evaluationServiceTopic);
});

test('atlas retains valid executable reader scripts and generic SVG-only examples', () => {
  const source = readFileSync(atlas, 'utf8');
  for (const [, attrs, script] of source.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)) {
    if (!attrs.includes('application/json')) new Script(script);
  }
  assert.doesNotMatch(source, /Pensieve|slevert|sharepoint|INC-104|M365-Copilot-Agent-Evals|@microsoft\/vally/i);
  assert.doesNotMatch(source, /<(?:img|image|foreignObject|iframe)\b/i);
  assert.match(source, /<svg\b[^>]*viewBox=/i);
});

test('creation is a draft and unfinished placeholders cannot pass review', (t) => {
  const { directory } = fixture(t);
  const draft = join(directory, 'draft.html');
  const created = runPaper('init', draft, '--type', 'delivery-roadmap', '--palette', 'forest');
  assert.equal(created.data.status, 'draft');
  const checked = runPaper('review', draft);
  assert.equal(checked.data.status, 'hold');
  assert(checked.data.issues.some((issue) => issue.includes('drafting guidance')));
  assert.equal(runPaper('init', draft, '--type', 'delivery-roadmap').status, 1);
});

test('escaped scalar text and inert code remain safe; active HTML slot injection is rejected', (t) => {
  const value = fixture(t, 'product-vision', { fields: { TITLE: '<img src=x onerror=alert(1)>' } });
  assert.match(readFileSync(value.paper, 'utf8'), /&lt;img src=x onerror=alert\(1\)&gt;/);
  const fields = join(value.directory, 'unsafe.json');
  for (const unsafe of ['<script>fetch("https://example.com")</script>', '<p onclick="alert(1)">Text</p>',
    '<img src="https://example.com/image.png">', '<a href="file:///C:/private.md">Local</a>',
    '<svg><use href="https://example.com/diagram.svg#node"></use></svg>',
    '<svg><path fill="url(https://example.com/paint.svg)"></path></svg>']) {
    writeFileSync(fields, JSON.stringify({ SECTION_1_HTML: unsafe }));
    assert.equal(runPaper('init', join(value.directory, 'unsafe.html'), '--type', 'product-vision', '--content', fields).status, 1);
  }
});

test('all seven types require substantive review, not just a successful HTML check', (t) => {
  for (const selected of types) {
    const value = fixture(t, selected.id);
    const source = readFileSync(value.paper, 'utf8');
    assert.match(source, /<header\b[^>]*class="paper-head"[^>]*>[\s\S]*?<h1\b[^>]*>Synthetic paper fixture<\/h1>/);
    assert.match(source, /<footer\b[^>]*class="paper-footer"[^>]*>[\s\S]*?synthetic verification fixture/);
    const incomplete = runPaper('review', value.paper);
    assert.equal(incomplete.data.status, 'needs-author-review', JSON.stringify(incomplete.data));
    assert.equal(incomplete.status, 1);
    const receipt = receiptFor(value.paper, selected);
    writeFileSync(value.receipt, JSON.stringify(receipt));
    assert.equal(runPaper('review', value.paper, '--author-review', value.receipt).data.status, 'ready');
    receipt.checks['type-outcome-1'].status = 'fail';
    writeFileSync(value.receipt, JSON.stringify(receipt));
    assert.equal(runPaper('review', value.paper, '--author-review', value.receipt).data.status, 'hold');
  }
});

test('exact byte hash invalidates a review after content or line-ending changes', (t) => {
  const value = fixture(t);
  const receipt = receiptFor(value.paper, value.selected);
  writeFileSync(value.receipt, JSON.stringify(receipt));
  writeFileSync(value.paper, readFileSync(value.paper, 'utf8').replace(/\n/g, '\r\n'));
  const checked = runPaper('review', value.paper, '--author-review', value.receipt);
  assert(checked.data.issues.some((issue) => issue.includes('stale')));
});

test('conditional coverage and actual browser evidence cannot be silently assumed', (t) => {
  const value = fixture(t, 'architecture-and-convergence');
  const receipt = receiptFor(value.paper, value.selected);
  const conditional = value.selected.conditional[0];
  receipt.conditionalCoverage[conditional.id] = { applies: true, reason: 'The requested fixture now needs this scope.' };
  receipt.browser.mobile = null;
  writeFileSync(value.receipt, JSON.stringify(receipt));
  const checked = runPaper('review', value.paper, '--author-review', value.receipt);
  assert(checked.data.issues.some((issue) => issue.includes(conditional.id)));
  assert(checked.data.issues.some((issue) => issue.includes('mobile')));
});

test('structural holds catch local source links, duplicate/broken IDs, missing terms and extra h2 groups', (t) => {
  for (const [fragment, expected] of [
    ['<a href="../private.md">Local evidence</a>', 'HTTPS'],
    ['<p id="sources">Duplicate</p>', 'duplicate'],
    ['<p id>Malformed identifier</p>', 'Empty'],
    ['<a href="#missing-source">Broken anchor</a>', 'Broken'],
    ['<h2>Sixth major heading</h2>', 'h3/h4'],
    ['<details data-reader-depth="2"><p data-paper-critical="true">Essential caveat</p></details>', 'qualifications'],
  ]) {
    const value = fixture(t);
    writeFileSync(value.paper, readFileSync(value.paper, 'utf8').replace('</main>', fragment + '</main>'));
    const checked = runPaper('review', value.paper, '--structure-only');
    assert(checked.data.issues.some((issue) => issue.includes(expected)), JSON.stringify(checked.data));
  }
  const value = fixture(t);
  writeFileSync(value.paper, readFileSync(value.paper, 'utf8').replace(/<dt>Fixture<\/dt><dd>[^<]*<\/dd>/, ''));
  assert(runPaper('review', value.paper).data.issues.some((issue) => issue.includes('terms')));
});

test('core budget includes the argument while leaving genuine collapsed technical reference available', (t) => {
  const value = fixture(t);
  let source = readFileSync(value.paper, 'utf8');
  const reference = 'reference '.repeat(1600);
  source = source.replace('Synthetic reference only.', reference);
  writeFileSync(value.paper, source);
  assert.equal(runPaper('review', value.paper, '--structure-only').status, 0);
  writeFileSync(value.paper, source.replace('</main>', `<p>${reference}</p></main>`));
  assert(runPaper('review', value.paper).data.issues.some((issue) => issue.includes('Core narrative')));
});

test('malformed receipt structures return a hold instead of an exception', (t) => {
  const value = fixture(t);
  for (const receipt of [[], { checks: [], conditionalCoverage: [], browser: [] }]) {
    writeFileSync(value.receipt, JSON.stringify(receipt));
    assert.equal(runPaper('review', value.paper, '--author-review', value.receipt).data.status, 'hold');
  }
});

test('headings and empty coverage aliases cannot stand in for actual overview or required content', (t) => {
  const value = fixture(t);
  const source = readFileSync(value.paper, 'utf8');
  writeFileSync(value.paper, source.replace(/<div id="findings">[\s\S]*?<\/div>/, '<div id="findings"><h3>Findings</h3></div>'));
  assert(runPaper('review', value.paper).data.issues.some((issue) => issue.includes('findings')));
  writeFileSync(value.paper, source.replace(/<section id="paper-section-2">[\s\S]*?<\/section>/,
    '<section id="paper-section-2"><h2>Summary</h2><details data-reader-depth="2"><p id="summary">Hidden argument</p></details></section>'));
  assert(runPaper('review', value.paper).data.issues.some((issue) => issue.includes('useful overview')));
});

test('checklists start unapproved and can be regenerated only for the explicitly named file', (t) => {
  const value = fixture(t);
  assert.equal(runPaper('review', value.paper, '--checklist', value.receipt).data.status, 'needs-author-review');
  const checklist = JSON.parse(readFileSync(value.receipt, 'utf8'));
  assert(Object.values(checklist.checks).every((answer) => answer.status === 'needs-review'));
  assert.equal(checklist.browser.mobile, null);
  assert.equal(runPaper('review', value.paper, '--checklist', value.receipt).status, 1);
  assert.equal(runPaper('review', value.paper, '--checklist', value.receipt, '--overwrite-checklist').data.status, 'needs-author-review');
  assert.equal(runPaper('review', value.paper, '--checklist', value.paper, '--overwrite-checklist').status, 1);
  assert.match(readFileSync(value.paper, 'utf8'), /<!doctype html>/i);
});
