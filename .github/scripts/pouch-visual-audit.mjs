import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const outDir = '/tmp/pouch-visual-audit';
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
page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
page.on('requestfailed', (request) => failedRequests.push({ url: request.url(), error: request.failure()?.errorText ?? 'unknown' }));

const waitReady = async () => {
  await page.waitForSelector('#game canvas', { state: 'visible', timeout: 20_000 });
  await page.waitForFunction(() => document.querySelector('#orientation-gate')?.getAttribute('data-visible') !== 'true');
  await page.waitForTimeout(900);
};
const clickReload = async (name) => {
  await Promise.all([
    page.waitForEvent('framenavigated', { timeout: 10_000 }),
    page.getByRole('button', { name, exact: true }).click(),
  ]);
  await waitReady();
};
const shot = async (name) => {
  await page.screenshot({ path: `${outDir}/${name}.png` });
};

await page.goto('http://127.0.0.1:5173/?debug=1&platform=mock', { waitUntil: 'domcontentloaded' });
await waitReady();
await clickReload('Reset save');
await page.evaluate(() => {
  const panel = document.querySelector('.mpt-debug-panel');
  if (panel) panel.style.display = 'none';
});
await page.waitForTimeout(650);
await shot('01-idle');

// Visible star center from the presentation contract at 1280x720.
const startX = 640 - 158;
const startY = 326 - 83;
await page.mouse.move(startX, startY);
await page.mouse.down();
await page.waitForTimeout(180);
await page.mouse.move(startX + 90, startY, { steps: 8 });
await page.waitForTimeout(240);
await shot('02-drag-30');
await page.mouse.move(startX + 180, startY, { steps: 8 });
await page.waitForTimeout(240);
await shot('03-drag-60');
await page.mouse.move(startX + 260, startY, { steps: 8 });
await page.waitForTimeout(240);
await shot('04-drag-88');
await page.mouse.move(startX + 310, startY, { steps: 6 });
await page.mouse.up();
await page.waitForTimeout(90);
await shot('05-after-tear-90ms');
await page.waitForTimeout(180);
await shot('06-after-tear-270ms');
await page.waitForTimeout(260);
await shot('07-reward-emerge');
await page.waitForTimeout(900);
await shot('08-result');

await fs.copyFile('public/assets/package/pouch-body.webp', `${outDir}/source-pouch-body.webp`);
await fs.copyFile('public/assets/package/pouch-star-tab.webp', `${outDir}/source-pouch-star-tab.webp`);
await fs.copyFile('public/assets/package/pouch-tear-strip.svg', `${outDir}/source-pouch-tear-strip.svg`);
await fs.writeFile(`${outDir}/report.json`, JSON.stringify({ errors, failedRequests }, null, 2));
await context.close();
await browser.close();
if (errors.length || failedRequests.length) process.exitCode = 1;
