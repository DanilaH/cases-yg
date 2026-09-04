import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const outDir = '/tmp/interaction-pulse-audit';
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

await page.goto('http://127.0.0.1:5173/?debug=1&platform=mock', { waitUntil: 'domcontentloaded' });
await waitReady();
await clickReload('Reset save');
await setDebugVisible(false);
await page.waitForTimeout(120);
await shot('01-star-base');
await page.waitForTimeout(260);
await shot('02-star-expand');
await page.waitForTimeout(260);
await shot('03-star-return');
await page.waitForTimeout(520);
await shot('04-star-next-cycle');

await setDebugVisible(true);
await clickReload('Force Epic Phone');
await setDebugVisible(false);
// Recovered debug reveal settles quickly, then resultReady flips after 600ms.
await page.waitForTimeout(850);
await shot('05-cta-ready-base');
await page.waitForTimeout(110);
await shot('06-cta-heartbeat-rise');
await page.waitForTimeout(110);
await shot('07-cta-heartbeat-fall');
await page.waitForTimeout(300);
await shot('08-cta-rest');
await page.waitForTimeout(520);
await shot('09-cta-next-beat');
await page.waitForTimeout(900);
await shot('10-cta-later');

await fs.writeFile(`${outDir}/report.json`, JSON.stringify({ errors, failedRequests }, null, 2));
await context.close();
await browser.close();
if (errors.length || failedRequests.length) process.exitCode = 1;
