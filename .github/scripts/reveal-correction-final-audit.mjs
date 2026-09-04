import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const outDir = '/tmp/reveal-correction-final-audit';
await fs.mkdir(outDir, { recursive: true });
const errors = [];
const failedRequests = [];

const browser = await chromium.launch({
  headless: true,
  channel: 'chrome',
  args: ['--use-angle=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'],
});

const attachDiagnostics = (page) => {
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('requestfailed', (request) => failedRequests.push({ url: request.url(), error: request.failure()?.errorText ?? 'unknown' }));
};
const waitReady = async (page) => {
  await page.waitForSelector('#game canvas', { state: 'visible', timeout: 20_000 });
  await page.waitForFunction(() => document.querySelector('#orientation-gate')?.getAttribute('data-visible') !== 'true');
  await page.waitForTimeout(700);
};
const setDebugVisible = async (page, visible) => {
  await page.evaluate((show) => {
    const panel = document.querySelector('.mpt-debug-panel');
    if (panel) panel.style.display = show ? '' : 'none';
  }, visible);
};
const clickReload = async (page, name) => {
  await setDebugVisible(page, true);
  await Promise.all([
    page.waitForEvent('framenavigated', { timeout: 10_000 }),
    page.getByRole('button', { name, exact: true }).click(),
  ]);
  await waitReady(page);
};
const shot = async (page, name) => page.screenshot({ path: `${outDir}/${name}.png` });

const context = await browser.newContext({
  viewport: { width: 1280, height: 720 },
  locale: 'en-US',
  recordVideo: { dir: outDir, size: { width: 1280, height: 720 } },
});
const page = await context.newPage();
attachDiagnostics(page);
await page.goto('http://127.0.0.1:5173/?debug=1&platform=mock', { waitUntil: 'domcontentloaded' });
await waitReady(page);
await clickReload(page, 'Reset save');
await setDebugVisible(page, false);
await page.waitForTimeout(420);
await shot(page, '01-idle-1280');

const starX = 640 - 158;
const starY = 266 - 83;
await page.mouse.move(starX, starY);
await page.mouse.down();
await page.mouse.move(starX + 150, starY, { steps: 10 });
await page.waitForTimeout(120);
await shot(page, '02-half-drag-1280');
await page.mouse.move(starX + 310, starY, { steps: 10 });
await page.mouse.up();
await page.waitForTimeout(130);
await shot(page, '03-fresh-reveal-burst');
await page.waitForTimeout(1500);
await shot(page, '04-fresh-result-ready');

await clickReload(page, 'Force Epic Phone');
await setDebugVisible(page, false);
await page.waitForTimeout(1000);
await shot(page, '05-epic-phone-1280');

await clickReload(page, 'Force Legendary');
await setDebugVisible(page, false);
await page.waitForTimeout(1000);
await shot(page, '06-legendary-1280');

await clickReload(page, 'Force Hidden Pocket');
await setDebugVisible(page, false);
await page.waitForTimeout(1000);
await shot(page, '07-hidden-secret-selected');

await page.mouse.move(640, 326);
await page.mouse.down();
await page.mouse.move(715, 326, { steps: 8 });
await shot(page, '08-hidden-mid-drag');
await page.mouse.move(790, 326, { steps: 8 });
await page.mouse.up();
await page.waitForTimeout(240);
await shot(page, '09-hidden-standard-selected');

await page.setViewportSize({ width: 900, height: 720 });
await page.waitForTimeout(350);
await shot(page, '10-hidden-standard-900');

await page.setViewportSize({ width: 1728, height: 720 });
await page.waitForTimeout(350);
await clickReload(page, 'Reset save');
await setDebugVisible(page, false);
await page.waitForTimeout(420);
await shot(page, '11-idle-1728');
await context.close();

const ruContext = await browser.newContext({
  viewport: { width: 1024, height: 720 },
  locale: 'ru-RU',
  recordVideo: { dir: outDir, size: { width: 1024, height: 720 } },
});
const ruPage = await ruContext.newPage();
attachDiagnostics(ruPage);
await ruPage.goto('http://127.0.0.1:5173/?debug=1&platform=mock', { waitUntil: 'domcontentloaded' });
await waitReady(ruPage);
await clickReload(ruPage, 'Force Hidden Pocket');
await setDebugVisible(ruPage, false);
await ruPage.waitForTimeout(1000);
await shot(ruPage, '12-hidden-ru-1024');
await ruContext.close();

await fs.writeFile(`${outDir}/report.json`, JSON.stringify({ errors, failedRequests }, null, 2));
await browser.close();
if (errors.length || failedRequests.length) process.exitCode = 1;
