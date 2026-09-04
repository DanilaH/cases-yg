import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const baseUrl = 'http://127.0.0.1:5173/?debug=1&platform=mock';
const outDir = process.env.AUDIT_OUT ?? '/tmp/runtime-audit';
await fs.mkdir(outDir, { recursive: true });

const report = {
  startedAt: new Date().toISOString(),
  errors: [],
  warnings: [],
  failedRequests: [],
  captures: [],
  notes: [],
};

const browser = await chromium.launch({
  headless: true,
  channel: process.env.PW_CHANNEL || undefined,
  args: ['--use-angle=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'],
});

const attachDiagnostics = (page, label) => {
  page.on('pageerror', (error) => report.errors.push({ label, kind: 'pageerror', message: error.message }));
  page.on('console', (message) => {
    const type = message.type();
    const text = message.text();
    if (type === 'error') report.errors.push({ label, kind: 'console', message: text });
    if (type === 'warning') report.warnings.push({ label, message: text });
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

const capture = async (page, name, extra = {}) => {
  const file = path.join(outDir, `${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  const metrics = await page.evaluate(() => {
    const canvas = document.querySelector('#game canvas');
    const gate = document.querySelector('#orientation-gate');
    const panel = document.querySelector('.mpt-debug-panel');
    return {
      viewport: { width: innerWidth, height: innerHeight, dpr: devicePixelRatio },
      canvas: canvas ? {
        clientWidth: canvas.clientWidth,
        clientHeight: canvas.clientHeight,
        width: canvas.width,
        height: canvas.height,
      } : null,
      orientationGateVisible: gate?.dataset.visible ?? null,
      debugPanelVisible: panel ? getComputedStyle(panel).display !== 'none' : false,
      save: localStorage.getItem('mystery-pocket-tech.save'),
    };
  });
  report.captures.push({ name, file, metrics, ...extra });
};

const clickDebugButton = async (page, text) => {
  await showDebugPanel(page);
  const button = page.getByRole('button', { name: text, exact: true });
  await button.waitFor({ state: 'visible', timeout: 10_000 });
  await Promise.all([
    page.waitForEvent('load', { timeout: 10_000 }).catch(() => null),
    button.click(),
  ]);
  await waitForGame(page);
};

const openCollectionByCanvas = async (page) => {
  await hideDebugPanel(page);
  const viewport = page.viewportSize();
  if (!viewport) throw new Error('No viewport');
  await page.mouse.click(viewport.width - 90, viewport.height - 48);
  await page.waitForTimeout(650);
};

const clickLibraryTab = async (page) => {
  const viewport = page.viewportSize();
  if (!viewport) throw new Error('No viewport');
  const scale = viewport.height / 720;
  const logicalWidth = Math.min(1728, Math.max(900, (viewport.width / viewport.height) * 720));
  const contentWidth = logicalWidth * scale;
  const offsetX = (viewport.width - contentWidth) / 2;
  const centerX = offsetX + (logicalWidth / 2) * scale;
  await page.mouse.click(centerX + 78 * scale, 128 * scale);
  await page.waitForTimeout(300);
};

const dragPouchTab = async (page) => {
  const viewport = page.viewportSize();
  if (!viewport) throw new Error('No viewport');
  const scale = viewport.height / 720;
  const logicalWidth = Math.min(1728, Math.max(900, (viewport.width / viewport.height) * 720));
  const contentWidth = logicalWidth * scale;
  const offsetX = (viewport.width - contentWidth) / 2;
  const centerX = offsetX + (logicalWidth / 2) * scale;
  const startX = centerX - 114 * scale;
  const startY = (392 - 99) * scale;
  const endX = startX + 270 * scale;
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(endX, startY, { steps: 24 });
  await page.mouse.up();
};

{
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, locale: 'en-US' });
  const page = await context.newPage();
  attachDiagnostics(page, 'main-1280');
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  await waitForGame(page);

  await clickDebugButton(page, 'Reset save');
  await hideDebugPanel(page);
  await capture(page, '01-opening-clean-1280x720');

  await dragPouchTab(page);
  await page.waitForTimeout(2500);
  await capture(page, '02-normal-drag-result');

  await openCollectionByCanvas(page);
  await capture(page, '03-collection-after-one-open');
  await clickLibraryTab(page);
  await capture(page, '04-library-after-one-open');

  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  await waitForGame(page);
  await clickDebugButton(page, 'Force Legendary');
  await page.waitForTimeout(2700);
  await hideDebugPanel(page);
  await capture(page, '05-forced-legendary-result');

  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  await waitForGame(page);
  await clickDebugButton(page, 'Force Hidden Pocket');
  await page.waitForTimeout(4000);
  await hideDebugPanel(page);
  await capture(page, '06-hidden-pocket-result');

  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  await waitForGame(page);
  await clickDebugButton(page, 'Seed all 8/8 + 2/2');
  await hideDebugPanel(page);
  await openCollectionByCanvas(page);
  await capture(page, '07-collection-full-shelf');
  await clickLibraryTab(page);
  await capture(page, '08-collection-full-library');

  await context.close();
}

for (const viewport of [
  { width: 900, height: 720, name: '09-opening-min-landscape-900x720' },
  { width: 1728, height: 720, name: '10-opening-wide-1728x720' },
]) {
  const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height }, locale: 'en-US' });
  const page = await context.newPage();
  attachDiagnostics(page, viewport.name);
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  await waitForGame(page);
  await clickDebugButton(page, 'Reset save');
  await hideDebugPanel(page);
  await capture(page, viewport.name);
  await context.close();
}

{
  const context = await browser.newContext({ viewport: { width: 1024, height: 768 }, locale: 'ru-RU' });
  const page = await context.newPage();
  attachDiagnostics(page, 'ru-1024');
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  await waitForGame(page);
  await clickDebugButton(page, 'Seed all 8/8 + 2/2');
  await hideDebugPanel(page);
  await openCollectionByCanvas(page);
  await capture(page, '11-collection-full-shelf-ru-1024x768');
  await clickLibraryTab(page);
  await capture(page, '12-collection-full-library-ru-1024x768');
  await context.close();
}

{
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'en-US' });
  const page = await context.newPage();
  attachDiagnostics(page, 'portrait-gate');
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);
  await hideDebugPanel(page);
  await capture(page, '13-portrait-orientation-gate');
  await context.close();
}

report.finishedAt = new Date().toISOString();
await fs.writeFile(path.join(outDir, 'report.json'), JSON.stringify(report, null, 2));
await browser.close();

if (report.errors.length > 0) {
  console.error('Runtime audit captured errors:', JSON.stringify(report.errors, null, 2));
}
console.log(JSON.stringify({
  captures: report.captures.length,
  errors: report.errors.length,
  warnings: report.warnings.length,
  failedRequests: report.failedRequests.length,
}, null, 2));
