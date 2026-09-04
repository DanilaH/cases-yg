import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const baseUrl = 'http://127.0.0.1:5173/?debug=1&platform=mock';
const outDir = process.env.AUDIT_OUT ?? '/tmp/hands-on-audit';
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

const attachDiagnostics = (page, label) => {
  page.on('pageerror', (error) => report.errors.push({ label, kind: 'pageerror', message: error.message }));
  page.on('console', (message) => {
    if (message.type() === 'error') report.errors.push({ label, kind: 'console', message: message.text() });
    if (message.type() === 'warning') report.warnings.push({ label, message: message.text() });
  });
  page.on('requestfailed', (request) => {
    report.failedRequests.push({ label, url: request.url(), error: request.failure()?.errorText ?? 'unknown' });
  });
};

const hideDebugPanel = async (page) => {
  await page.evaluate(() => {
    const panel = document.querySelector('.mpt-debug-panel');
    if (panel) panel.style.display = 'none';
  });
};

const showDebugPanel = async (page) => {
  await page.evaluate(() => {
    const panel = document.querySelector('.mpt-debug-panel');
    if (panel) panel.style.display = '';
  });
};

const waitForGame = async (page) => {
  await page.waitForSelector('#game canvas', { state: 'visible', timeout: 20_000 });
  await page.waitForTimeout(800);
};

const capture = async (page, name) => {
  const file = path.join(outDir, `${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  report.captures.push({ name, file });
};

const clickDebugButton = async (page, text) => {
  await showDebugPanel(page);
  const button = page.getByRole('button', { name: text, exact: true });
  await button.waitFor({ state: 'visible', timeout: 10_000 });
  await button.click();
  await page.waitForTimeout(650);
  await waitForGame(page);
};

const logicalMetrics = (viewport) => {
  const scale = viewport.height / 720;
  const logicalWidth = Math.min(1728, Math.max(900, (viewport.width / viewport.height) * 720));
  const contentWidth = logicalWidth * scale;
  const offsetX = (viewport.width - contentWidth) / 2;
  const centerX = offsetX + (logicalWidth / 2) * scale;
  return { scale, logicalWidth, offsetX, centerX };
};

const dragPouchTab = async (page) => {
  const viewport = page.viewportSize();
  if (!viewport) throw new Error('No viewport');
  const { scale, centerX } = logicalMetrics(viewport);
  const startX = centerX - 126 * scale;
  const startY = (392 - 126) * scale;
  const endX = startX + 285 * scale;
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(endX, startY, { steps: 28 });
  await page.mouse.up();
};

const clickResultPrompt = async (page) => {
  const viewport = page.viewportSize();
  if (!viewport) throw new Error('No viewport');
  const { scale, centerX } = logicalMetrics(viewport);
  await page.mouse.click(centerX, 646 * scale);
  await page.waitForTimeout(650);
};

const openCollection = async (page) => {
  const viewport = page.viewportSize();
  if (!viewport) throw new Error('No viewport');
  const { scale, logicalWidth, offsetX } = logicalMetrics(viewport);
  await page.mouse.click(offsetX + (logicalWidth - 78) * scale, (720 - 34) * scale);
  await page.waitForTimeout(700);
};

const openMoreFromCollection = async (page) => {
  const viewport = page.viewportSize();
  if (!viewport) throw new Error('No viewport');
  const { scale, offsetX } = logicalMetrics(viewport);
  await page.mouse.click(offsetX + 84 * scale, (720 - 34) * scale);
  await page.waitForTimeout(900);
};

const swipeCarousel = async (page, direction) => {
  const viewport = page.viewportSize();
  if (!viewport) throw new Error('No viewport');
  const { scale, centerX } = logicalMetrics(viewport);
  const y = 350 * scale;
  const delta = 180 * scale * direction;
  await page.mouse.move(centerX, y);
  await page.mouse.down();
  await page.mouse.move(centerX + delta, y, { steps: 20 });
  await page.mouse.up();
  await page.waitForTimeout(350);
};

const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, locale: 'en-US' });
const page = await context.newPage();
attachDiagnostics(page, 'hands-on-1280');
await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
await waitForGame(page);

await clickDebugButton(page, 'Reset save');
await hideDebugPanel(page);
await capture(page, '01-opening-pouch-fixed');

await dragPouchTab(page);
await page.waitForTimeout(3000);
await capture(page, '02-normal-result');

await clickResultPrompt(page);
await capture(page, '03-next-pouch-button');

await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
await waitForGame(page);
await clickDebugButton(page, 'Seed all 8/8 + 2/2');
await hideDebugPanel(page);
await openCollection(page);
await capture(page, '04-full-collection-phone-pivot');
await openMoreFromCollection(page);
await capture(page, '05-open-more-returns-to-opening');

await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
await waitForGame(page);
await clickDebugButton(page, 'Force Hidden Pocket');
await page.waitForTimeout(4500);
await hideDebugPanel(page);
await capture(page, '06-hidden-pocket-secret-centered');
await swipeCarousel(page, 1);
await capture(page, '07-hidden-pocket-standard-page');
await swipeCarousel(page, -1);
await capture(page, '08-hidden-pocket-secret-page');

await context.close();
report.finishedAt = new Date().toISOString();
await fs.writeFile(path.join(outDir, 'report.json'), JSON.stringify(report, null, 2));
await browser.close();

console.log(JSON.stringify({
  captures: report.captures.length,
  errors: report.errors.length,
  warnings: report.warnings.length,
  failedRequests: report.failedRequests.length,
}, null, 2));

if (report.errors.length > 0 || report.failedRequests.length > 0) {
  process.exitCode = 1;
}
