import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const outDir = '/tmp/reveal-v2-browser-audit';
await fs.mkdir(outDir, { recursive: true });

const errors = [];
const failedRequests = [];
const report = { scenarios: [], errors, failedRequests };

const browser = await chromium.launch({
  headless: true,
  channel: 'chrome',
  args: ['--use-angle=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'],
});

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const layout = (width, height) => {
  const scale = height / 720;
  const logicalWidth = clamp((width / height) * 720, 900, 1728);
  const offsetX = (width - logicalWidth * scale) / 2;
  return {
    scale,
    logicalWidth,
    centerX: logicalWidth / 2,
    sx: (x) => offsetX + x * scale,
    sy: (y) => y * scale,
  };
};

const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, locale: 'en-US' });
const page = await context.newPage();
page.on('pageerror', (error) => errors.push(error.message));
page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
page.on('requestfailed', (request) => failedRequests.push({ url: request.url(), error: request.failure()?.errorText ?? 'unknown' }));

const openGame = async ({ width = 1280, height = 720, force = null, reset = true } = {}) => {
  await page.setViewportSize({ width, height });
  await page.goto('http://127.0.0.1:5173/?debug=1&platform=mock', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#game canvas', { state: 'visible', timeout: 20_000 });
  await page.waitForTimeout(800);
  if (reset) {
    const resetButton = page.getByRole('button', { name: 'Reset save', exact: true });
    if (await resetButton.count()) {
      await resetButton.click();
      await page.waitForTimeout(450);
    }
  }
  if (force) {
    await page.getByRole('button', { name: force, exact: true }).click();
    await page.waitForTimeout(250);
  }
  await page.evaluate(() => {
    const panel = document.querySelector('.mpt-debug-panel');
    if (panel) panel.style.display = 'none';
  });
  return layout(width, height);
};

const dragPouch = async (metrics, fraction = 1) => {
  const startX = metrics.sx(metrics.centerX - 125);
  const startY = metrics.sy(340 - 135);
  const distance = 270 * fraction;
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX + metrics.scale * distance, startY, { steps: 16 });
  if (fraction >= 1) {
    await page.mouse.up();
  }
};

const shot = async (name) => {
  const file = path.join(outDir, `${name}.png`);
  const bytes = await page.screenshot({ path: file, fullPage: true });
  report.scenarios.push({ name, screenshotBytes: bytes.length });
  return bytes;
};

// 1. Idle pouch and measured half-drag geometry.
let metrics = await openGame();
await shot('01-idle-pouch-1280');
await dragPouch(metrics, 0.5);
await page.waitForTimeout(120);
await shot('02-pouch-half-drag-1280');
await page.mouse.up();
await page.waitForTimeout(300);

// 2. Epic phone: centered, larger, unified bottom panel.
metrics = await openGame({ force: 'Force Epic' });
await dragPouch(metrics, 1);
await page.waitForTimeout(2300);
await shot('03-epic-phone-result-1280');

// Free-background tap should continue after the hold.
await page.mouse.click(metrics.sx(metrics.centerX + 330), metrics.sy(650));
await page.waitForTimeout(650);
await shot('04-background-tap-next-pouch');

// 3. Hidden Pocket final carousel: secret selected, side item subordinate.
metrics = await openGame({ force: 'Force Hidden Pocket' });
await dragPouch(metrics, 1);
await page.waitForTimeout(3300);
await shot('05-hidden-secret-selected');

// Mid-drag interpolation toward the standard item.
const carouselY = metrics.sy(326);
const carouselX = metrics.sx(metrics.centerX);
await page.mouse.move(carouselX, carouselY);
await page.mouse.down();
await page.mouse.move(carouselX + metrics.scale * 145, carouselY, { steps: 12 });
await page.waitForTimeout(120);
await shot('06-hidden-mid-drag');
await page.mouse.up();
await page.waitForTimeout(350);
await shot('07-hidden-standard-selected');

// Large bottom panel should advance.
await page.mouse.click(metrics.sx(metrics.centerX), metrics.sy(558));
await page.waitForTimeout(650);
await shot('08-panel-tap-next-pouch');

// 4. Compact viewport composition.
metrics = await openGame({ width: 900, height: 720, force: 'Force Epic' });
await dragPouch(metrics, 1);
await page.waitForTimeout(2300);
await shot('09-epic-phone-900x720');

// 5. Wide viewport pouch composition.
metrics = await openGame({ width: 1728, height: 720 });
await shot('10-idle-pouch-1728x720');

// 6. RU compact layout and Hidden Pocket copy/panel.
await context.close();
const ruContext = await browser.newContext({ viewport: { width: 1024, height: 768 }, locale: 'ru-RU' });
const ruPage = await ruContext.newPage();
ruPage.on('pageerror', (error) => errors.push(`RU: ${error.message}`));
ruPage.on('console', (message) => { if (message.type() === 'error') errors.push(`RU: ${message.text()}`); });
ruPage.on('requestfailed', (request) => failedRequests.push({ url: request.url(), error: request.failure()?.errorText ?? 'unknown' }));
await ruPage.goto('http://127.0.0.1:5173/?debug=1&platform=mock&lang=ru', { waitUntil: 'domcontentloaded' });
await ruPage.waitForSelector('#game canvas', { state: 'visible', timeout: 20_000 });
await ruPage.waitForTimeout(800);
const ruReset = ruPage.getByRole('button', { name: 'Reset save', exact: true });
if (await ruReset.count()) { await ruReset.click(); await ruPage.waitForTimeout(450); }
await ruPage.getByRole('button', { name: 'Force Hidden Pocket', exact: true }).click();
await ruPage.waitForTimeout(250);
await ruPage.evaluate(() => { const panel = document.querySelector('.mpt-debug-panel'); if (panel) panel.style.display = 'none'; });
const ruMetrics = layout(1024, 768);
const ruStartX = ruMetrics.sx(ruMetrics.centerX - 125);
const ruStartY = ruMetrics.sy(340 - 135);
await ruPage.mouse.move(ruStartX, ruStartY);
await ruPage.mouse.down();
await ruPage.mouse.move(ruStartX + ruMetrics.scale * 270, ruStartY, { steps: 16 });
await ruPage.mouse.up();
await ruPage.waitForTimeout(3300);
const ruBytes = await ruPage.screenshot({ path: path.join(outDir, '11-hidden-ru-1024x768.png'), fullPage: true });
report.scenarios.push({ name: '11-hidden-ru-1024x768', screenshotBytes: ruBytes.length });
await ruContext.close();

await fs.writeFile(path.join(outDir, 'report.json'), JSON.stringify(report, null, 2));
await browser.close();

if (errors.length || failedRequests.length) process.exitCode = 1;
