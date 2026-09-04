import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const baseUrl = 'http://127.0.0.1:5173/?debug=1&platform=mock';
const outDir = process.env.AUDIT_OUT ?? '/tmp/final-hands-on-audit';
await fs.mkdir(outDir, { recursive: true });

const report = {
  startedAt: new Date().toISOString(),
  errors: [],
  warnings: [],
  failedRequests: [],
  captures: [],
};

const browser = await chromium.launch({
  headless: true,
  channel: process.env.PW_CHANNEL || undefined,
  args: ['--use-angle=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'],
});

const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, locale: 'en-US' });
const page = await context.newPage();

page.on('pageerror', (error) => report.errors.push({ kind: 'pageerror', message: error.message }));
page.on('console', (message) => {
  if (message.type() === 'error') report.errors.push({ kind: 'console', message: message.text() });
  if (message.type() === 'warning' && !message.text().includes('software WebGL')) {
    report.warnings.push({ message: message.text() });
  }
});
page.on('requestfailed', (request) => {
  report.failedRequests.push({ url: request.url(), error: request.failure()?.errorText ?? 'unknown' });
});

const waitForGame = async () => {
  await page.waitForSelector('#game canvas', { state: 'visible', timeout: 20_000 });
  await page.waitForTimeout(800);
};

const hideDebugPanel = async () => {
  await page.evaluate(() => {
    const panel = document.querySelector('.mpt-debug-panel');
    if (panel) panel.style.display = 'none';
  });
};

const showDebugPanel = async () => {
  await page.evaluate(() => {
    const panel = document.querySelector('.mpt-debug-panel');
    if (panel) panel.style.display = '';
  });
};

const clickDebugButton = async (name) => {
  await showDebugPanel();
  const button = page.getByRole('button', { name, exact: true });
  await button.waitFor({ state: 'visible', timeout: 10_000 });
  await button.click();
  await page.waitForTimeout(700);
  await waitForGame();
};

const capture = async (name) => {
  const file = path.join(outDir, `${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  report.captures.push({ name, file });
};

const gotoFresh = async () => {
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  await waitForGame();
};

const dragPouchTab = async () => {
  const centerX = 640;
  const startX = centerX - 126;
  const startY = 392 - 126;
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX + 285, startY, { steps: 28 });
  await page.mouse.up();
};

const swipeResult = async (deltaX) => {
  await page.mouse.move(640, 350);
  await page.mouse.down();
  await page.mouse.move(640 + deltaX, 350, { steps: 22 });
  await page.mouse.up();
  await page.waitForTimeout(400);
};

await gotoFresh();
await clickDebugButton('Reset save');
await hideDebugPanel();
await capture('01-opening-pouch');

await dragPouchTab();
await page.waitForTimeout(3000);
await capture('02-normal-result');
await page.mouse.click(640, 646);
await page.waitForTimeout(700);
await capture('03-next-pouch-returns-idle');

await gotoFresh();
await clickDebugButton('Seed all 8/8 + 2/2');
await hideDebugPanel();
// Collection button is anchored at bottom-right. Stay comfortably inside its visual bounds.
await page.mouse.click(1170, 662);
await page.waitForTimeout(900);
await capture('04-collection-shelf-phone-pivot');
// Library tab: logical center + 78 at y=128.
await page.mouse.click(718, 128);
await page.waitForTimeout(450);
await capture('05-collection-library-phone-pivot');
// Open more is anchored bottom-left. Stay inside the padded button, not on its lower edge.
await page.mouse.click(105, 662);
await page.waitForTimeout(900);
await capture('06-open-more-back-to-opening');

await gotoFresh();
await clickDebugButton('Force Hidden Pocket');
await page.waitForTimeout(4500);
await hideDebugPanel();
await capture('07-hidden-pocket-secret-centered');
await swipeResult(210);
await capture('08-hidden-pocket-standard-page');
await swipeResult(-210);
await capture('09-hidden-pocket-secret-page');

report.finishedAt = new Date().toISOString();
await fs.writeFile(path.join(outDir, 'report.json'), JSON.stringify(report, null, 2));
await context.close();
await browser.close();

console.log(JSON.stringify({
  captures: report.captures.length,
  errors: report.errors.length,
  warnings: report.warnings.length,
  failedRequests: report.failedRequests.length,
}, null, 2));

if (report.errors.length > 0 || report.failedRequests.length > 0) process.exitCode = 1;
