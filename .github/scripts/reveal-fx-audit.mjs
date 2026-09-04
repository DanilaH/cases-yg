import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const outDir = '/tmp/reveal-fx-audit';
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
  recordVideo: { dir: outDir, size: { width: 640, height: 360 } },
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

await page.goto('http://127.0.0.1:5173/?debug=1&platform=mock', { waitUntil: 'domcontentloaded' });
await waitReady();
await clickReload('Reset save');
await setDebugVisible(false);
await shot('ambient-00-start');
await page.waitForTimeout(2600);
await shot('ambient-01-later');

const starX = 640 - 158;
const starY = 266 - 83;
for (let open = 1; open <= 15; open += 1) {
  await page.mouse.move(starX, starY);
  await page.mouse.down();
  await page.mouse.move(starX + 310, starY, { steps: 10 });
  await page.mouse.up();

  await page.waitForTimeout(300);
  await shot(`open-${String(open).padStart(2, '0')}-fx-a`);
  await page.waitForTimeout(150);
  await shot(`open-${String(open).padStart(2, '0')}-fx-b`);
  await page.waitForTimeout(220);
  await shot(`open-${String(open).padStart(2, '0')}-fx-c`);

  // Long enough for both normal and Hidden Pocket paths to settle + unlock.
  await page.waitForTimeout(2600);
  await shot(`open-${String(open).padStart(2, '0')}-result`);
  await page.mouse.click(640, 568);
  await page.waitForTimeout(450);
}

await fs.writeFile(`${outDir}/report.json`, JSON.stringify({ errors, failedRequests }, null, 2));
await context.close();
await browser.close();
if (errors.length || failedRequests.length) process.exitCode = 1;
