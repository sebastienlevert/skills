import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const html = readFileSync(new URL('../skills/paper-strategist/assets/paper.html', import.meta.url), 'utf8');
const script = html.match(/<script type="module" id="reader-script">([\s\S]*?)<\/script>/)[1];
const reader = await import(`data:text/javascript;base64,${Buffer.from(script).toString('base64')}`);

test('reading estimate counts prose words and rounds up at the documented rate', () => {
  assert.equal(reader.countWords("A well-scoped decision isn't a feature list."), 7);
  assert.equal(reader.countWords('  \n '), 0);
  assert.equal(reader.countWords('Caf\u00e9 and na\u00efve are words.'), 5);
  assert.equal(reader.readingMinutes(0), 1);
  assert.equal(reader.readingMinutes(230), 1);
  assert.equal(reader.readingMinutes(231), 2);
});

test('generated heading anchors are readable for punctuation, accents and empty text', () => {
  assert.equal(reader.headingId('4. Proposal & trade-offs'), '4-proposal-trade-offs');
  assert.equal(reader.headingId('Caf\u00e9: why now?'), 'cafe-why-now');
  assert.equal(reader.headingId('!!!'), 'section');
});

test('paper is a self-contained SVG-only artifact without remote runtime dependencies', () => {
  assert.doesNotMatch(html, /<(?:img|image|foreignObject|iframe)\b/i);
  assert.doesNotMatch(html, /<(?:script|link)\b[^>]*(?:src|href)\s*=/i);
  assert.doesNotMatch(html, /(?:fetch\s*\(|url\s*\(|https?:\/\/|data:image\/)/i);
  assert.match(html, /<svg\b[^>]*viewBox=/i);
  assert.match(html, /<svg\b[^>]*aria-labelledby=/i);
});
