import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const outDir = '/tmp/reveal-layering-audit';
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
  await page.waitForTimeout(700);
};
const clickReload = async (name) => {
  await Promise.all([
    page.waitForEvent('framenavigated', { timeout: 10_000 }),
    page.getByRole('button', { name, exact: true }).click(),
  ]);
  await waitReady();
};
const hideDebug = async () => {
  await page.evaluate(() => {
    const panel = document.querySelector('.mpt-debug-panel');
    if (panel) panel.style.display = 'none';
  });
};
const showDebug = async () => {
  await page.evaluate(() => {
    const panel = document.querySelector('.mpt-debug-panel');
    if (panel) panel.style.display = '';
  });
};
const shot = async (name) => page.screenshot({ path: `${outDir}/${name}.png` });

await page.goto('http://127.0.0.1:5173/?debug=1&platform=mock', { waitUntil: 'domcontentloaded' });
await waitReady();
await clickReload('Reset save');
await hideDebug();
await page.waitForTimeout(500);
await shot('01-idle');

// Current presentation contract: centerX 640 + hitbox offsets from pouch group.
const starX = 640 - 158;
const starY = 246 - 83;
await page.mouse.move(starX, starY);
await page.mouse.down();
await page.waitForTimeout(120);
await page.mouse.move(starX + 90, starY, { steps: 8 });
await page.waitForTimeout(120);
await shot('02-drag-30');
await page.mouse.move(starX + 180, starY, { steps: 8 });
await page.waitForTimeout(120);
await shot('03-drag-60');
await page.mouse.move(starX + 260, starY, { steps: 8 });
await page.waitForTimeout(120);
await shot('04-drag-88');
await page.mouse.move(starX + 310, starY, { steps: 6 });
await page.mouse.up();

for (const [name, delay] of [
  ['05-reveal-70ms', 70],
  ['06-reveal-150ms', 80],
  ['07-reveal-250ms', 100],
  ['08-reveal-370ms', 120],
  ['09-reveal-520ms', 150],
  ['10-reveal-720ms', 200],
]) {
  await page.waitForTimeout(delay);
  await shot(name);
}
await page.waitForTimeout(1200);
await shot('11-result-normal');

// Static composition checks for both production families.
await showDebug();
await clickReload('Force Epic Phone');
await hideDebug();
await page.waitForTimeout(1300);
await shot('12-result-epic-phone');
await showDebug();
await clickReload('Force Epic');
await hideDebug();
await page.waitForTimeout(1300);
await shot('13-result-epic-camera');

await fs.writeFile(`${outDir}/report.json`, JSON.stringify({ errors, failedRequests }, null, 2));
await context.close();
await browser.close();
if (errors.length || failedRequests.length) process.exitCode = 1;
