import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const outDir = '/tmp/reveal-fx-frame-audit';
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
const hideDebug = async () => page.evaluate(() => {
  const panel = document.querySelector('.mpt-debug-panel');
  if (panel) panel.style.display = 'none';
});
const shot = async (name) => page.screenshot({ path: path.join(outDir, `${name}.png`) });

await page.goto('http://127.0.0.1:5173/?debug=1&platform=mock', { waitUntil: 'domcontentloaded' });
await waitReady();
await clickReload('Reset save');
await hideDebug();

// Current correction geometry: groupY=326, hitbox=(-135,-112), dragThreshold=252.
const startX = 640 - 135;
const startY = 326 - 112;
await page.mouse.move(startX, startY);
await page.mouse.down();
await page.mouse.move(startX + 265, startY, { steps: 18 });
await page.mouse.up();

const marks = [250, 275, 300, 325, 350, 375, 400, 450, 525];
let elapsed = 0;
for (const mark of marks) {
  await page.waitForTimeout(Math.max(0, mark - elapsed));
  await shot(`frame-${String(mark).padStart(3, '0')}ms`);
  elapsed = mark;
}

await fs.writeFile(path.join(outDir, 'report.json'), JSON.stringify({ errors, failedRequests }, null, 2));
await context.close();
await browser.close();
if (errors.length || failedRequests.length) process.exitCode = 1;
