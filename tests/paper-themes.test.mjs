import assert from 'node:assert/strict';
import { test } from 'node:test';
import { chromium } from 'playwright';
import { pathToFileURL } from 'node:url';
import { fixture } from './helpers/paper-fixture.mjs';

test('every visual theme keeps readable desktop/mobile typography and a single-column print layout', {
  skip: !process.env.PAPER_BROWSER, timeout: 120_000,
}, async (t) => {
  const value = fixture(t, 'product-vision');
  const channel = process.env.PAPER_BROWSER;
  const browser = await chromium.launch({ headless: true, ...(channel === 'chromium' ? {} : { channel }) });
  t.after(() => browser.close());
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const errors = [], requests = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.route(/^https?:/, (route) => { requests.push(route.request().url()); return route.abort(); });
  await page.goto(pathToFileURL(value.paper).href);
  const colors = await page.locator('#paper-palette').evaluate((node) => Array.from(node.options, (option) => option.value));
  for (const color of colors) {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.locator('#paper-palette').selectOption(color);
    const desktop = await page.locator('.paper-head').evaluate((node) => ({
      display: getComputedStyle(node).display,
      heading: getComputedStyle(node.querySelector('h1')).fontFamily,
      content: node.textContent,
    }));
    assert(desktop.content.includes('Synthetic paper fixture'));
    if (['ember', 'slate', 'graphite'].includes(color)) assert.equal(desktop.display, 'grid');
    if (['indigo', 'graphite'].includes(color)) assert.match(desktop.heading, /monospace/);
    for (const appearance of ['light', 'dark']) {
      await page.evaluate((mode) => { document.documentElement.dataset.theme = mode; }, appearance);
      const contrast = await page.evaluate(() => {
        const canvas = document.createElement('canvas'), ctx = canvas.getContext('2d');
        const rgb = (css) => { ctx.fillStyle = css; ctx.fillRect(0, 0, 1, 1); return Array.from(ctx.getImageData(0, 0, 1, 1).data).slice(0, 3); };
        const luminance = (channels) => channels.map((channel) => {
          const value = channel / 255; return value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4;
        }).reduce((sum, value, index) => sum + value * [.2126, .7152, .0722][index], 0);
        const style = getComputedStyle(document.body), a = luminance(rgb(style.color)), b = luminance(rgb(style.backgroundColor));
        return (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
      });
      assert(contrast >= 4.5, `${color}/${appearance}: prose contrast ${contrast}`);
    }
    await page.setViewportSize({ width: 320, height: 740 });
    const phone = await page.evaluate(() => ({
      width: document.documentElement.scrollWidth,
      viewport: innerWidth,
      header: getComputedStyle(document.querySelector('.paper-head')).display,
      fontSize: parseFloat(getComputedStyle(document.body).fontSize),
      terms: document.querySelector('#terminology').getBoundingClientRect().width,
    }));
    assert(phone.width <= phone.viewport, `${color}: mobile overflow ${JSON.stringify(phone)}`);
    assert.equal(phone.header, 'block');
    assert(phone.fontSize >= 16);
    assert(phone.terms <= phone.viewport);
    await page.emulateMedia({ media: 'print' });
    assert.equal(await page.locator('.document-layout').evaluate((node) => getComputedStyle(node).display), 'block');
    assert(await page.locator('#paper').isVisible());
    await page.emulateMedia({ media: 'screen' });
  }
  assert.deepEqual(errors, []);
  assert.deepEqual(requests, []);
});
