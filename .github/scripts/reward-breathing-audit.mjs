import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const outDir = '/tmp/reward-breathing-audit';
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
const setDebugVisible = async (visible) => {
  await page.evaluate((show) => {
    const panel = document.querySelector('.mpt-debug-panel');
    if (panel) panel.style.display = show ? '' : 'none';
  }, visible);
};
const shot = async (name) => page.screenshot({ path: `${outDir}/${name}.png` });
const swipe = async (fromX, toX, name) => {
  await page.mouse.move(fromX, 326);
  await page.mouse.down();
  await page.mouse.move((fromX + toX) / 2, 326, { steps: 8 });
  await shot(`${name}-mid`);
  await page.mouse.move(toX, 326, { steps: 8 });
  await page.mouse.up();
  await page.waitForTimeout(230);
  await shot(`${name}-settled`);
};

await page.goto('http://127.0.0.1:5173/?debug=1&platform=mock', { waitUntil: 'domcontentloaded' });
await waitReady();

// Normal reward: confirm slow scale breathing is visible but restrained.
await clickReload('Reset save');
await clickReload('Force Epic Phone');
await setDebugVisible(false);
await page.waitForTimeout(900);
await shot('01-normal-breath-a');
await page.waitForTimeout(600);
await shot('02-normal-breath-b');
await page.waitForTimeout(600);
await shot('03-normal-breath-c');

// Hidden Pocket: secret starts active. Verify drag stops breathing, inactive page
// returns to side scale, newly active page breathes from its canonical base,
// and repeated swipes do not accumulate scale drift.
await setDebugVisible(true);
await clickReload('Force Hidden Pocket');
await setDebugVisible(false);
await page.waitForTimeout(900);
await shot('04-secret-active-a');
await page.waitForTimeout(600);
await shot('05-secret-active-b');

// Swipe right: active index 1 -> standard index 0.
await swipe(640, 790, '06-to-standard');
await page.waitForTimeout(600);
await shot('07-standard-breath');

// Swipe left: standard index 0 -> secret index 1.
await swipe(640, 490, '08-back-to-secret');
await page.waitForTimeout(600);
await shot('09-secret-breath-again');

// Repeat once more to expose any scale drift across cycles.
await swipe(640, 790, '10-to-standard-repeat');
await page.waitForTimeout(600);
await shot('11-standard-breath-repeat');
await swipe(640, 490, '12-back-to-secret-repeat');
await page.waitForTimeout(600);
await shot('13-secret-breath-repeat');

await fs.writeFile(`${outDir}/report.json`, JSON.stringify({ errors, failedRequests }, null, 2));
await context.close();
await browser.close();
if (errors.length || failedRequests.length) process.exitCode = 1;
