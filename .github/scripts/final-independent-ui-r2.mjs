import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const PRODUCT_HEAD = '96b4f62481a499a94b2afb10dbab3fb82b9d1da2';
const SAVE_KEY = 'mystery-pocket-tech.save';
const outDir = '/tmp/final-independent-ui-r2';
const errors = [];
const failedRequests = [];

await fs.rm(outDir, { recursive: true, force: true });
await fs.mkdir(outDir, { recursive: true });

const baseSave = (overrides = {}) => ({
  version: 2,
  discoveredStandard: [],
  discoveredSecrets: [],
  chips: 0,
  signal: 0,
  activeLootPoolId: 'y2k-essentials',
  totalOpens: 0,
  pendingReveal: null,
  muted: false,
  stats: { duplicates: 0, hiddenPockets: 0 },
  ...overrides,
});

const browser = await chromium.launch({
  headless: true,
  channel: 'chrome',
  args: ['--use-angle=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'],
});
const attachDiagnostics = (page, tag) => {
  page.on('pageerror', (error) => errors.push(`${tag}: ${error.message}`));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`${tag}: ${message.text()}`);
  });
  page.on('requestfailed', (request) => failedRequests.push({
    tag,
    url: request.url(),
    error: request.failure()?.errorText ?? 'unknown',
  }));
};
const waitCanvas = async (page) => {
  await page.waitForSelector('#game canvas', { state: 'visible', timeout: 20_000 });
  await page.waitForFunction(() => document.querySelector('#orientation-gate')?.getAttribute('data-visible') !== 'true');
  await page.waitForTimeout(500);
};
const hideDebug = async (page) => page.evaluate(() => {
  const panel = document.querySelector('.mpt-debug-panel');
  if (panel) panel.style.display = 'none';
});
const showDebug = async (page) => page.evaluate(() => {
  const panel = document.querySelector('.mpt-debug-panel');
  if (panel) panel.style.display = '';
});
const shot = (page, name) => page.screenshot({ path: `${outDir}/${name}.png` });
const tap = async (page, x, y) => {
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.waitForTimeout(80);
  await page.mouse.up();
};
const setSaveAndReload = async (page, save) => {
  await page.evaluate(({ key, value }) => localStorage.setItem(key, JSON.stringify(value)), { key: SAVE_KEY, value: save });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await waitCanvas(page);
  await hideDebug(page);
};
const stage = async (page, buttonName) => {
  await showDebug(page);
  await Promise.all([
    page.waitForEvent('framenavigated', { timeout: 10_000 }),
    page.getByRole('button', { name: buttonName, exact: true }).click(),
  ]);
  await waitCanvas(page);
  await hideDebug(page);
};
const waitCommitted = async (page, totalOpens) => {
  await page.waitForFunction(({ key, totalOpens }) => {
    const raw = localStorage.getItem(key);
    if (!raw) return false;
    try {
      const save = JSON.parse(raw);
      return save.pendingReveal === null && save.totalOpens === totalOpens;
    } catch { return false; }
  }, { key: SAVE_KEY, totalOpens }, { timeout: 20_000 });
  await page.waitForTimeout(300);
};
const acceptResult = async (page, x, y) => {
  await tap(page, x, y);
  await page.waitForTimeout(140);
  await tap(page, x, y);
};

// Collection at actual compact hit target + both views + resize + return.
const compactContext = await browser.newContext({
  viewport: { width: 800, height: 720 }, locale: 'ru-RU',
  recordVideo: { dir: outDir, size: { width: 800, height: 720 } },
});
const compact = await compactContext.newPage();
attachDiagnostics(compact, 'collection-ru');
await compact.goto('http://127.0.0.1:5173/?debug=1&platform=mock', { waitUntil: 'domcontentloaded' });
await waitCanvas(compact);
await setSaveAndReload(compact, baseSave({ chips: 144, signal: 1, totalOpens: 12 }));
await stage(compact, 'Seed all 8/8 + 2/2');
await shot(compact, '00-ru-800-before-collection');
await tap(compact, 705, 662);
await compact.waitForTimeout(650);
await shot(compact, '01-ru-800-collection-shelf');
await tap(compact, 478, 128);
await compact.waitForTimeout(420);
await shot(compact, '02-ru-800-collection-library');
await compact.setViewportSize({ width: 1280, height: 720 });
await compact.waitForTimeout(450);
await shot(compact, '03-ru-1280-collection-library-resized');
await tap(compact, 562, 128);
await compact.waitForTimeout(420);
await shot(compact, '04-ru-1280-collection-shelf');
await compact.setViewportSize({ width: 800, height: 720 });
await compact.waitForTimeout(420);
await shot(compact, '05-ru-800-collection-shelf-back');
await tap(compact, 75, 662);
await compact.waitForTimeout(650);
await shot(compact, '06-ru-800-returned-opening');
await compactContext.close();

// SIGNAL waiting and Charged compact resize.
const wideContext = await browser.newContext({
  viewport: { width: 1280, height: 720 }, locale: 'en-US',
  recordVideo: { dir: outDir, size: { width: 1280, height: 720 } },
});
const wide = await wideContext.newPage();
attachDiagnostics(wide, 'signal-charged-en');
await wide.goto('http://127.0.0.1:5173/?debug=1&platform=mock', { waitUntil: 'domcontentloaded' });
await waitCanvas(wide);
await setSaveAndReload(wide, baseSave({ chips: 80, totalOpens: 12 }));
await stage(wide, 'SIGNAL LOCK waiting for Charged');
await waitCommitted(wide, 13);
await shot(wide, '10-en-1280-signal-wait-result');
await acceptResult(wide, 640, 568);
for (let i = 0; i < 10; i += 1) {
  await wide.waitForTimeout(90);
  await shot(wide, `11-en-signal-wait-bank-${String(i).padStart(2, '0')}`);
}
await wide.waitForTimeout(950);
await shot(wide, '12-en-1280-signal-wait-idle');

await setSaveAndReload(wide, baseSave({ chips: 100, totalOpens: 12 }));
await tap(wide, 160, 305);
await wide.waitForTimeout(700);
await shot(wide, '13-en-1280-charged-selected');
await wide.setViewportSize({ width: 800, height: 720 });
await wide.waitForTimeout(450);
await shot(wide, '14-en-800-charged-selected-resized');
await wideContext.close();

await fs.writeFile(`${outDir}/report.json`, JSON.stringify({
  auditedProductHead: PRODUCT_HEAD,
  auditHead: process.env.GITHUB_SHA ?? null,
  errors,
  failedRequests,
}, null, 2));
await browser.close();
if (errors.length || failedRequests.length) process.exitCode = 1;
