import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const outDir = '/tmp/reveal-v2-final-gate';
await fs.mkdir(outDir, { recursive: true });

const browser = await chromium.launch({
  headless: true,
  channel: 'chrome',
  args: ['--use-angle=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'],
});
const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, locale: 'en-US' });
const page = await context.newPage();
const errors = [];
const failedRequests = [];
page.on('pageerror', (error) => errors.push(error.message));
page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
page.on('requestfailed', (request) => failedRequests.push({ url: request.url(), error: request.failure()?.errorText ?? 'unknown' }));

const waitReady = async () => {
  await page.waitForSelector('#game canvas', { state: 'visible', timeout: 20_000 });
  await page.waitForFunction(() => document.querySelector('#orientation-gate')?.getAttribute('data-visible') !== 'true');
  await page.waitForTimeout(900);
};

const clickReloadingDebug = async (name) => {
  const button = page.getByRole('button', { name, exact: true });
  await Promise.all([
    page.waitForEvent('framenavigated', { timeout: 10_000 }),
    button.click(),
  ]);
  await waitReady();
};

const hideDebug = async () => {
  await page.evaluate(() => {
    const panel = document.querySelector('.mpt-debug-panel');
    if (panel) panel.style.display = 'none';
  });
};

const dragPouch = async () => {
  const startX = 640 - 125;
  const startY = 340 - 135;
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX + 270, startY, { steps: 18 });
  await page.mouse.up();
};

await page.goto('http://127.0.0.1:5173/?debug=1&platform=mock', { waitUntil: 'domcontentloaded' });
await waitReady();
await clickReloadingDebug('Reset save');
await hideDebug();

// First real opening.
await dragPouch();
await page.waitForTimeout(900);
await page.screenshot({ path: `${outDir}/01-first-reveal-900ms.png` });
await page.waitForTimeout(1800);
await page.screenshot({ path: `${outDir}/02-first-result-2700ms.png` });

// Unified result panel must be ready by now and return us to idle.
await page.mouse.click(640, 558);
await page.waitForTimeout(700);
await page.screenshot({ path: `${outDir}/03-after-panel-click.png` });

// If resultReady/panel transition failed, this drag will not open a second pouch.
await dragPouch();
await page.waitForTimeout(4200);
await page.screenshot({ path: `${outDir}/04-second-result.png` });

const state = await page.evaluate(() => {
  const raw = localStorage.getItem('mystery-pocket-tech.save');
  return raw ? JSON.parse(raw) : null;
});
const report = {
  totalOpens: state?.totalOpens ?? null,
  pendingReveal: state?.pendingReveal ?? null,
  errors,
  failedRequests,
};
await fs.writeFile(`${outDir}/report.json`, JSON.stringify(report, null, 2));

await context.close();
await browser.close();

if (errors.length || failedRequests.length) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}
if (!state || state.totalOpens < 2) {
  console.error('Result panel did not unlock/return to idle reliably', JSON.stringify(report, null, 2));
  process.exit(2);
}
console.log(JSON.stringify(report, null, 2));