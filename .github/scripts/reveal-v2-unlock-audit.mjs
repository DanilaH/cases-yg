import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const outDir = '/tmp/reveal-v2-unlock-audit';
await fs.mkdir(outDir, { recursive: true });
const errors = [];
const failedRequests = [];

const browser = await chromium.launch({
  headless: true,
  channel: 'chrome',
  args: ['--use-angle=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'],
});
const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, locale: 'en-US' });
const page = await context.newPage();
page.on('pageerror', (error) => errors.push(error.message));
page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
page.on('requestfailed', (request) => failedRequests.push({ url: request.url(), error: request.failure()?.errorText ?? 'unknown' }));

const waitReady = async () => {
  await page.waitForSelector('#game canvas', { state: 'visible', timeout: 20_000 });
  await page.waitForFunction(() => document.querySelector('#orientation-gate')?.getAttribute('data-visible') !== 'true', null, { timeout: 10_000 });
  await page.waitForTimeout(800);
};

await page.goto('http://127.0.0.1:5173/?debug=1&platform=mock', { waitUntil: 'domcontentloaded' });
await waitReady();
await Promise.all([
  page.waitForEvent('framenavigated', { timeout: 10_000 }),
  page.getByRole('button', { name: 'Reset save', exact: true }).click(),
]);
await waitReady();
await page.evaluate(() => { const panel = document.querySelector('.mpt-debug-panel'); if (panel) panel.style.display = 'none'; });

// 1280x720 maps 1:1 to the logical canvas width clamped at 1280.
const centerX = 640;
const startX = centerX - 125;
const startY = 340 - 135;
await page.mouse.move(startX, startY);
await page.mouse.down();
await page.mouse.move(startX + 270, startY, { steps: 16 });
await page.mouse.up();

const shot = async (name) => {
  const bytes = await page.screenshot({ path: path.join(outDir, `${name}.png`), fullPage: true });
  return bytes.length;
};

await page.waitForTimeout(1500);
const at1500 = await shot('01-result-1500ms');
await page.waitForTimeout(1000);
const at2500 = await shot('02-result-2500ms');
await page.waitForTimeout(1500);
const at4000 = await shot('03-result-4000ms');

// Tap the unified action panel, then verify that the pouch screen is reachable again.
await page.mouse.click(centerX, 558);
await page.waitForTimeout(600);
const afterTap = await shot('04-after-panel-tap');

await fs.writeFile(path.join(outDir, 'report.json'), JSON.stringify({ at1500, at2500, at4000, afterTap, errors, failedRequests }, null, 2));
await context.close();
await browser.close();
if (errors.length || failedRequests.length) process.exitCode = 1;
