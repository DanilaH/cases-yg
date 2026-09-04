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

const waitForGameReady = async (page) => {
  await page.waitForSelector('#game canvas', { state: 'visible', timeout: 20_000 });
  await page.waitForFunction(
    () => document.querySelector('#orientation-gate')?.getAttribute('data-visible') !== 'true',
    null,
    { timeout: 10_000 },
  );
  await page.waitForTimeout(900);
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
  const startX = metrics.sx(metrics.centerX - 125);
  const startY = metrics.sy(340 - 135);
  const distance = 270 * fraction;
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX + metrics.scale * distance, startY, { steps: 16 });
  if (fraction >= 1) await page.mouse.up();
};

const shot = async (name) => {
  const file = path.join(outDir, `${name}.png`);
  const bytes = await page.screenshot({ path: file, fullPage: true });
  report.scenarios.push({ name, screenshotBytes: bytes.length });
  return bytes;
};

// Idle pouch and measured half drag.
let metrics = await openGame();
await shot('01-idle-pouch-1280');
await dragPouch(metrics, 0.5);
await page.waitForTimeout(120);
await shot('02-pouch-half-drag-1280');
await page.mouse.up();
await page.waitForTimeout(300);

// Real non-recovered reveal: capture the visual burst shortly after a full tear.
metrics = await openGame();
await dragPouch(metrics, 1);
await page.waitForTimeout(280);
await shot('03-normal-reveal-burst');
await page.waitForTimeout(1500);
await shot('04-normal-result');

// Forced scenarios stage a pending reward and reload; the game then recovers it automatically.
metrics = await openGame({ force: 'Force Epic Phone' });
await page.waitForTimeout(1200);
await shot('05-epic-phone-result-1280');

await page.mouse.click(metrics.sx(metrics.centerX + 330), metrics.sy(650));
await page.waitForTimeout(700);
await shot('06-background-tap-next-pouch');

metrics = await openGame({ force: 'Force Hidden Pocket' });
await page.waitForTimeout(1200);
await shot('07-hidden-secret-selected');

const carouselY = metrics.sy(326);
const carouselX = metrics.sx(metrics.centerX);
await page.mouse.move(carouselX, carouselY);
await page.mouse.down();
await page.mouse.move(carouselX + metrics.scale * 145, carouselY, { steps: 12 });
await page.waitForTimeout(120);
await shot('08-hidden-mid-drag');
await page.mouse.up();
await page.waitForTimeout(350);
await shot('09-hidden-standard-selected');

await page.mouse.click(metrics.sx(metrics.centerX), metrics.sy(558));
await page.waitForTimeout(700);
await shot('10-panel-tap-next-pouch');

metrics = await openGame({ width: 900, height: 720, force: 'Force Epic Phone' });
await page.waitForTimeout(1200);
await shot('11-epic-phone-900x720');

metrics = await openGame({ width: 1728, height: 720 });
await shot('12-idle-pouch-1728x720');

await context.close();

const ruContext = await browser.newContext({ viewport: { width: 1024, height: 720 }, locale: 'ru-RU' });
const ruPage = await ruContext.newPage();
ruPage.on('pageerror', (error) => errors.push(`RU: ${error.message}`));
ruPage.on('console', (message) => {
  if (message.type() === 'error') errors.push(`RU: ${message.text()}`);
});
ruPage.on('requestfailed', (request) => {
  failedRequests.push({ url: request.url(), error: request.failure()?.errorText ?? 'unknown' });
});
await ruPage.goto('http://127.0.0.1:5173/?debug=1&platform=mock&lang=ru', { waitUntil: 'domcontentloaded' });
await waitForGameReady(ruPage);
await clickReloadingDebugAction(ruPage, 'Reset save');
await clickReloadingDebugAction(ruPage, 'Force Hidden Pocket');
await hideDebug(ruPage);
await ruPage.waitForTimeout(1200);
const ruBytes = await ruPage.screenshot({ path: path.join(outDir, '13-hidden-ru-1024x720.png'), fullPage: true });
report.scenarios.push({ name: '13-hidden-ru-1024x720', screenshotBytes: ruBytes.length });
await ruContext.close();

await fs.writeFile(path.join(outDir, 'report.json'), JSON.stringify(report, null, 2));
await browser.close();

if (errors.length || failedRequests.length) process.exitCode = 1;