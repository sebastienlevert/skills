import assert from 'node:assert/strict';
import { join } from 'node:path';
import { test } from 'node:test';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright';
import { atlas, fixture } from './helpers/paper-fixture.mjs';

const enabled = Boolean(process.env.PAPER_BROWSER);
const options = { skip: !enabled, timeout: 120_000 };

async function browserFor(t) {
  const channel = process.env.PAPER_BROWSER;
  const browser = await chromium.launch({ headless: true, ...(channel === 'chromium' ? {} : { channel }) });
  t.after(() => browser.close());
  return browser;
}

async function open(context, file) {
  const page = await context.newPage();
  const errors = [], requests = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.route(/^https?:/, (route) => { requests.push(route.request().url()); return route.abort(); });
  await page.goto(pathToFileURL(file).href);
  await page.waitForTimeout(150);
  return { page, errors, requests };
}

test('finished papers keep progressive reading, deep anchors, highlighting and reader defaults offline', options, async (t) => {
  const value = fixture(t, 'research-and-investigation', { palette: 'forest' });
  const browser = await browserFor(t);
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const { page, errors, requests } = await open(context, value.paper);
  assert.equal(await page.locator('#paper > section').count(), 5);
  assert.equal(await page.locator('meta[name="paper-default-palette"]').getAttribute('content'), 'forest');
  assert.equal(await page.locator('#paper-palette').inputValue(), 'forest');
  assert.equal(await page.locator('#paper-reader-persona').inputValue(), 'overview');
  assert.equal(await page.locator('#depth-one').evaluate((node) => node.open), false);
  await page.locator('#paper-reader-persona').selectOption('product');
  assert.equal(await page.locator('#depth-one').evaluate((node) => node.open), true);
  assert.equal(await page.locator('#depth-two').evaluate((node) => node.open), false);
  await page.locator('#paper-reader-persona').selectOption('technical');
  assert.equal(await page.locator('#depth-two').evaluate((node) => node.open), true);
  await page.locator('#paper-reader-persona').selectOption('overview');
  await page.evaluate(() => { location.hash = 'deep-target'; });
  await page.waitForTimeout(100);
  assert.equal(await page.locator('#depth-two').evaluate((node) => node.open), true);
  assert(await page.locator('#fixture-code [class^="syn-"]').count() > 0,
    'JSON code should receive syntax spans');
  assert.match(await page.locator('#fixture-code').innerText(), /"sample": true/);
  assert.deepEqual(errors, []);
  assert.deepEqual(requests, []);
});

test('atlas palette changes preserve structure and configured source reopens without duplicate controls', options, async (t) => {
  const value = fixture(t);
  const browser = await browserFor(t);
  const context = await browser.newContext({ acceptDownloads: true, viewport: { width: 1440, height: 900 } });
  const { page, errors, requests } = await open(context, atlas);
  const candidates = await page.locator('select').evaluateAll((nodes) => nodes.map((node) => ({ id: node.id, values: Array.from(node.options, (option) => option.value) })));
  const picker = candidates.find((node) => node.values.includes('sand') && node.values.includes('azure'));
  assert(picker, 'reader palette picker exists');
  const selector = page.locator(`#${picker.id}`);
  const before = await page.locator('#paper').evaluate((node) =>
    Array.from(node.querySelectorAll('*'), (child) => [child.tagName, child.id, child.children.length]));
  const treatments = new Set();
  for (const color of candidates.find((node) => node.id === picker.id).values) {
    await selector.selectOption(color);
    const current = await page.locator('#paper').evaluate((node) =>
      Array.from(node.querySelectorAll('*'), (child) => [child.tagName, child.id, child.children.length]));
    assert.deepEqual(current, before);
    treatments.add(await page.evaluate(() => JSON.stringify({
      bodyFont: getComputedStyle(document.body).fontFamily,
      headingFont: getComputedStyle(document.querySelector('h1')).fontFamily,
      leading: getComputedStyle(document.body).lineHeight,
      columns: getComputedStyle(document.querySelector('.document-layout')).gridTemplateColumns,
      header: getComputedStyle(document.querySelector('.paper-head')).display,
      measure: getComputedStyle(document.querySelector('.paper-head')).maxWidth,
    })));
  }
  assert.equal(treatments.size, 12, 'all theme choices must produce distinct typography/layout treatments');
  await page.locator('#paper-reader-persona').selectOption('technical');
  await page.locator('#paper-default-palette').selectOption('indigo');
  await page.locator('#paper-set-default').click();
  await selector.selectOption('rose');
  await page.locator('#paper-use-default').click();
  assert.equal(await selector.inputValue(), 'indigo');
  const buttons = await page.locator('button').evaluateAll((nodes) => nodes.filter((node) => /configured|download.*html/i.test(node.textContent)).map((node) => node.id));
  assert(buttons.length, 'author-configured export remains available');
  const downloadPromise = page.waitForEvent('download');
  await page.locator(`#${buttons[0]}`).click();
  const download = await downloadPromise;
  const output = join(value.directory, 'configured.html');
  await download.saveAs(output);
  const reopened = await open(await browser.newContext({ viewport: { width: 1440, height: 900 } }), output);
  assert.equal(await reopened.page.locator('#paper-reader-persona').inputValue(), 'overview');
  assert.equal(await reopened.page.locator('meta[name="paper-default-palette"]').getAttribute('content'), 'indigo');
  assert.equal(await reopened.page.locator('#paper-palette').inputValue(), 'indigo');
  assert.equal(await reopened.page.locator('#paper > section').count(), 5);
  assert.equal(await reopened.page.locator('#paper-reader-persona').count(), 1);
  const sectionControls = await reopened.page.locator('#paper > section').evaluateAll((nodes) =>
    nodes.map((node) => node.querySelectorAll(':scope > .reader-section-controls').length));
  assert(sectionControls.every((count) => count === 1), JSON.stringify(sectionControls));
  assert.deepEqual([...errors, ...reopened.errors], []);
  assert.deepEqual([...requests, ...reopened.requests], []);
});

test('phone diagrams offer a complete fit, pinch/pan/expanded view and vertical phase roadmap', options, async (t) => {
  const browser = await browserFor(t);
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
  const { page, errors, requests } = await open(context, atlas);
  await page.locator('#paper-reader-persona').selectOption('technical');
  await page.locator('#component-example-diagram-overview').evaluate((node) => { node.open = true; });
  const viewport = page.locator('#component-example-diagram-overview .dg-viewport').first();
  await viewport.scrollIntoViewIfNeeded();
  const box = await viewport.boundingBox();
  assert(box.width <= 390 && box.height > 100, JSON.stringify(box));
  const svg = viewport.locator('svg').first();
  const fitted = await svg.evaluate((node) => {
    const content = node.getBBox(), camera = node.viewBox.baseVal;
    return camera.x <= content.x && camera.y <= content.y &&
      camera.x + camera.width >= content.x + content.width &&
      camera.y + camera.height >= content.y + content.height;
  });
  assert(fitted, 'the initial phone camera contains the complete drawn overview');
  const viewBefore = await svg.getAttribute('viewBox');
  const session = await context.newCDPSession(page);
  const x = box.x + box.width / 2, y = box.y + box.height / 2;
  await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: x - 35, y, id: 1 }, { x: x + 35, y, id: 2 }] });
  await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x - 70, y, id: 1 }, { x: x + 70, y, id: 2 }] });
  await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  assert.notEqual(await svg.getAttribute('viewBox'), viewBefore, 'native pinch changes camera');
  const expand = page.locator('#component-example-diagram-overview').getByRole('button', { name: /expand/i }).first();
  await expand.click();
  const dialog = page.locator('dialog[open]').first();
  assert.equal(await dialog.count(), 1);
  const dialogBox = await dialog.boundingBox();
  assert(dialogBox.width <= 390, JSON.stringify(dialogBox));
  await page.keyboard.press('Escape');
  await page.locator('#component-horizontal-roadmap').evaluate((node) => {
    for (let parent = node; parent; parent = parent.parentElement) if (parent.tagName === 'DETAILS') parent.open = true;
  });
  const stages = await page.locator('#component-horizontal-roadmap .hr-stage').evaluateAll((nodes) =>
    nodes.filter((node) => node.getBoundingClientRect().height > 0).map((node) => {
      const box = node.getBoundingClientRect(); return { x: box.x, y: box.y };
    }));
  assert(stages.length > 1);
  assert(stages[1].y > stages[0].y, 'phases stack vertically on a phone');
  await page.setViewportSize({ width: 844, height: 390 });
  await page.waitForTimeout(150);
  assert.deepEqual(errors, []);
  assert.deepEqual(requests, []);
});

test('rendered outputs remain readable without JavaScript and with keyboard and reduced motion', options, async (t) => {
  const value = fixture(t, 'delivery-roadmap', { palette: 'forest' });
  const browser = await browserFor(t);
  const fallback = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 320, height: 740 } });
  const plain = await open(fallback, value.paper);
  assert(await plain.page.locator('#paper').innerText());
  assert.equal(await plain.page.locator('#terminology dt').count(), 1);
  assert.match(await plain.page.locator('body').evaluate((node) => getComputedStyle(node).fontFamily), /Georgia/);
  await plain.page.locator('#depth-one > summary').click();
  assert.equal(await plain.page.locator('#depth-one').getAttribute('open'), '');
  const context = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 430, height: 932 } });
  const { page, errors, requests } = await open(context, value.paper);
  await page.keyboard.press('Tab');
  assert.equal(await page.locator(':focus').getAttribute('href'), '#paper');
  await page.keyboard.press('Enter');
  assert.equal(new URL(page.url()).hash, '#paper');
  await page.emulateMedia({ media: 'print' });
  assert(await page.locator('#paper').isVisible());
  assert.deepEqual(errors, []);
  assert.deepEqual(requests, []);
});
