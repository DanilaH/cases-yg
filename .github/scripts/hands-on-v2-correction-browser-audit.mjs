import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const outDir = '/tmp/hands-on-v2-correction-browser-audit';
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

const waitForGameReady = async (page) => {
  await page.waitForSelector('#game canvas', { state: 'visible', timeout: 20_000 });
  await page.waitForFunction(
    () => document.querySelector('#orientation-gate')?.getAttribute('data-visible') !== 'true',
    null,
    { timeout: 10_000 },
  );
  await page.waitForTimeout(950);
};

const hideDebug = async (page) => {
  await page.evaluate(() => {
    const panel = document.querySelector('.mpt-debug-panel');
    if (panel) panel.style.display = 'none';
  });
};

const clickReloadingDebugAction = async (page, name) => {
  const action = page.getByRole('button', { name, exact: true });
  await Promise.all([
    page.waitForEvent('framenavigated', { timeout: 10_000 }),
    action.click(),
  ]);
  await waitForGameReady(page);
};

const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, locale: 'en-US' });
const page = await context.newPage();
page.on('pageerror', (error) => errors.push(error.message));
page.on('console', (message) => {
  if (message.type() === 'error') errors.push(message.text());
});
page.on('requestfailed', (request) => {
  failedRequests.push({ url: request.url(), error: request.failure()?.errorText ?? 'unknown' });
});

const openGame = async ({ width = 1280, height = 720, force = null, reset = true } = {}) => {
  await page.setViewportSize({ width, height });
  await page.goto('http://127.0.0.1:5173/?debug=1&platform=mock', { waitUntil: 'domcontentloaded' });
  await waitForGameReady(page);
  if (reset) await clickReloadingDebugAction(page, 'Reset save');
  if (force) await clickReloadingDebugAction(page, force);
  await hideDebug(page);
  return layout(width, height);
};

const dragPouch = async (metrics, fraction = 1) => {
  const startX = metrics.sx(metrics.centerX - 135);
  const startY = metrics.sy(326 - 112);
  const distance = 265 * fraction;
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX + metrics.scale * distance, startY, { steps: 18 });
  if (fraction >= 1) await page.mouse.up();
};

const shot = async (name) => {
  const file = path.join(outDir, `${name}.png`);
  const bytes = await page.screenshot({ path: file, fullPage: true });
  report.scenarios.push({ name, screenshotBytes: bytes.length });
  return bytes;
};

// Pouch geometry + idle attraction + ambient drift.
let metrics = await openGame();
await shot('01-idle-pouch-pulse-a');
await page.waitForTimeout(360);
await shot('02-idle-pouch-pulse-b');
await page.waitForTimeout(1600);
await shot('03-idle-pouch-ambient-later');

// Tear geometry while moving.
await dragPouch(metrics, 0.5);
await page.waitForTimeout(120);
await shot('04-pouch-half-drag');
await page.mouse.up();
await page.waitForTimeout(360);

// Fresh normal reveal is the important contrast/spectacle gate.
metrics = await openGame();
await dragPouch(metrics, 1);
await page.waitForTimeout(240);
await shot('05-normal-reveal-burst-early');
await page.waitForTimeout(180);
await shot('06-normal-reveal-burst-late');
await page.waitForTimeout(1300);
await shot('07-normal-result-pulse-a');
await page.waitForTimeout(330);
await shot('08-normal-result-pulse-b');

// Phone and responsive result layout.
metrics = await openGame({ force: 'Force Epic Phone' });
await page.waitForTimeout(1200);
await shot('09-epic-phone-result-1280');
await page.waitForTimeout(330);
await shot('10-epic-phone-result-pulse-b');

// Hidden Pocket: active breathing must remain inside carousel scaling.
metrics = await openGame({ force: 'Force Hidden Pocket' });
await page.waitForTimeout(1200);
await shot('11-hidden-secret-active-a');
await page.waitForTimeout(500);
await shot('12-hidden-secret-active-b');

const carouselY = metrics.sy(326);
const carouselX = metrics.sx(metrics.centerX);
await page.mouse.move(carouselX, carouselY);
await page.mouse.down();
await page.mouse.move(carouselX + metrics.scale * 145, carouselY, { steps: 14 });
await page.waitForTimeout(120);
await shot('13-hidden-mid-drag');
await page.mouse.up();
await page.waitForTimeout(420);
await shot('14-hidden-standard-active-a');
await page.waitForTimeout(500);
await shot('15-hidden-standard-active-b');

metrics = await openGame({ width: 900, height: 720, force: 'Force Epic Phone' });
await page.waitForTimeout(1200);
await shot('16-epic-phone-900x720');

metrics = await openGame({ width: 1728, height: 720 });
await shot('17-idle-pouch-1728x720');

await context.close();
await fs.writeFile(path.join(outDir, 'report.json'), JSON.stringify(report, null, 2));
await browser.close();

if (errors.length || failedRequests.length) process.exitCode = 1;
