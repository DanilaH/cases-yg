import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const outDir = '/tmp/pouch-visual-pass-2';
await fs.mkdir(outDir, { recursive: true });

const errors = [];
const failedRequests = [];

const browser = await chromium.launch({
  headless: true,
  channel: 'chrome',
  args: ['--use-angle=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'],
});

const context = await browser.newContext({
  viewport: { width: 1280, height: 720 },
  locale: 'en-US',
  recordVideo: { dir: outDir, size: { width: 1280, height: 720 } },
});
const page = await context.newPage();
page.on('pageerror', (error) => errors.push(error.message));
page.on('console', (message) => {
  if (message.type() === 'error') errors.push(message.text());
});
page.on('requestfailed', (request) => {
  failedRequests.push({ url: request.url(), error: request.failure()?.errorText ?? 'unknown' });
});

const waitReady = async () => {
  await page.waitForSelector('#game canvas', { state: 'visible', timeout: 20_000 });
  await page.waitForFunction(() => document.querySelector('#orientation-gate')?.getAttribute('data-visible') !== 'true');
  await page.waitForTimeout(900);
};
const shot = async (name) => page.screenshot({ path: `${outDir}/${name}.png` });

await page.goto('http://127.0.0.1:5173/?debug=1&platform=mock', { waitUntil: 'domcontentloaded' });
await waitReady();
await Promise.all([
  page.waitForEvent('framenavigated', { timeout: 10_000 }),
  page.getByRole('button', { name: 'Reset save', exact: true }).click(),
]);
await waitReady();
await page.evaluate(() => {
  const panel = document.querySelector('.mpt-debug-panel');
  if (panel) panel.style.display = 'none';
});
await page.waitForTimeout(650);
await shot('01-idle');

const startX = 640 - 158;
const startY = 246 - 83;
await page.mouse.move(startX, startY);
await page.mouse.down();
await page.waitForTimeout(180);

await page.mouse.move(startX + 90, startY, { steps: 8 });
await page.waitForTimeout(220);
await shot('02-drag-30');

await page.mouse.move(startX + 180, startY, { steps: 8 });
await page.waitForTimeout(220);
await shot('03-drag-60');

await page.mouse.move(startX + 260, startY, { steps: 8 });
await page.waitForTimeout(220);
await shot('04-drag-88');

await page.mouse.move(startX + 310, startY, { steps: 6 });
await page.mouse.up();
await page.waitForTimeout(70);
await shot('05-after-tear-70ms');
await page.waitForTimeout(120);
await shot('06-after-tear-190ms');
await page.waitForTimeout(150);
await shot('07-reward-emerge-340ms');
await page.waitForTimeout(250);
await shot('08-reward-emerge-590ms');
await page.waitForTimeout(850);
await shot('09-result');

await fs.writeFile(
  `${outDir}/report.json`,
  JSON.stringify({ errors, failedRequests }, null, 2),
);
await context.close();
await browser.close();
if (errors.length || failedRequests.length) process.exitCode = 1;
