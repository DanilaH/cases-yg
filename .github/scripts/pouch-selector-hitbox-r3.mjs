import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const PRODUCT_HEAD = '1e984ba85171cf59a9c3c19d8143d6a9b415be34';
const SAVE_KEY = 'mystery-pocket-tech.save';
const outDir = '/tmp/pouch-selector-hitbox-r3';
const errors = [];
const failedRequests = [];
const assertions = [];

await fs.rm(outDir, { recursive: true, force: true });
await fs.mkdir(outDir, { recursive: true });

const baseSave = (chips) => ({
  version: 2,
  discoveredStandard: [],
  discoveredSecrets: [],
  chips,
  signal: 0,
  activeLootPoolId: 'y2k-essentials',
  totalOpens: 6,
  pendingReveal: null,
  muted: false,
  stats: { duplicates: 0, hiddenPockets: 0 },
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

const assert = (condition, label, details = {}) => {
  assertions.push({ label, pass: Boolean(condition), ...details });
  if (!condition) throw new Error(`Assertion failed: ${label} ${JSON.stringify(details)}`);
};

const waitReady = async (page) => {
  await page.waitForSelector('#game canvas', { state: 'visible', timeout: 20_000 });
  await page.waitForFunction(() => document.querySelector('#orientation-gate')?.getAttribute('data-visible') !== 'true');
  await page.waitForTimeout(420);
  await page.evaluate(() => {
    const panel = document.querySelector('.mpt-debug-panel');
    if (panel) panel.style.display = 'none';
  });
};

const setSaveAndReload = async (page, chips) => {
  await page.evaluate(({ key, value }) => localStorage.setItem(key, JSON.stringify(value)), {
    key: SAVE_KEY,
    value: baseSave(chips),
  });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await waitReady(page);
};

const tap = async (page, x, y) => {
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.waitForTimeout(70);
  await page.mouse.up();
};

const tear = async (page, viewportWidth) => {
  const centerX = viewportWidth / 2;
  await page.mouse.move(centerX - 175, 174);
  await page.mouse.down();
  await page.mouse.move(centerX + 200, 174, { steps: 20 });
  await page.mouse.up();
};

const waitPendingType = async (page) => {
  for (let i = 0; i < 90; i += 1) {
    const state = await page.evaluate((key) => {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const save = JSON.parse(raw);
      return {
        chips: save.chips,
        pendingType: save.pendingReveal?.pouchType ?? null,
        totalOpens: save.totalOpens,
      };
    }, SAVE_KEY);
    if (state?.pendingType) return state;
    await page.waitForTimeout(35);
  }
  return null;
};

const cardRects = (width) => {
  const safeLeft = Math.max(width * 0.04, 28);
  return {
    basic: { left: safeLeft, top: 232, width: 216, height: 58 },
    charged: { left: safeLeft, top: 300, width: 216, height: 58 },
  };
};

const pointsFor = (rect) => [
  ['top-left', rect.left + 8, rect.top + 8],
  ['top-right', rect.left + rect.width - 8, rect.top + 8],
  ['center', rect.left + rect.width / 2, rect.top + rect.height / 2],
  ['bottom-left', rect.left + 8, rect.top + rect.height - 8],
  ['bottom-right', rect.left + rect.width - 8, rect.top + rect.height - 8],
];

const auditViewport = async (viewportWidth) => {
  const context = await browser.newContext({
    viewport: { width: viewportWidth, height: 720 },
    locale: viewportWidth === 900 ? 'ru-RU' : 'en-US',
    recordVideo: { dir: outDir, size: { width: viewportWidth, height: 720 } },
  });
  const page = await context.newPage();
  attachDiagnostics(page, `${viewportWidth}`);
  await page.goto('http://127.0.0.1:5173/?debug=1&platform=mock', { waitUntil: 'domcontentloaded' });
  await waitReady(page);

  const rects = cardRects(viewportWidth);

  for (const [name, x, y] of pointsFor(rects.charged)) {
    await setSaveAndReload(page, 100);
    await tap(page, x, y);
    await page.waitForTimeout(180);
    if (name === 'bottom-right') {
      await page.screenshot({ path: `${outDir}/${viewportWidth}-charged-selected-bottom-right.png` });
    }
    await tear(page, viewportWidth);
    const state = await waitPendingType(page);
    assert(state?.pendingType === 'charged', `${viewportWidth} Charged ${name} selects full visible card`, state ?? {});
  }

  for (const [name, x, y] of pointsFor(rects.basic)) {
    await setSaveAndReload(page, 100);
    await tap(page, rects.charged.left + 44, rects.charged.top + 12);
    await page.waitForTimeout(180);
    await tap(page, x, y);
    await page.waitForTimeout(180);
    if (name === 'top-left') {
      await page.screenshot({ path: `${outDir}/${viewportWidth}-basic-reselected-top-left.png` });
    }
    await tear(page, viewportWidth);
    const state = await waitPendingType(page);
    assert(state?.pendingType === 'basic', `${viewportWidth} Basic ${name} selects full visible card`, state ?? {});
  }

  await setSaveAndReload(page, 20);
  const unavailableX = rects.charged.left + rects.charged.width - 8;
  const unavailableY = rects.charged.top + rects.charged.height - 8;
  await tap(page, unavailableX, unavailableY);
  await page.waitForTimeout(85);
  await page.screenshot({ path: `${outDir}/${viewportWidth}-unavailable-bottom-right-feedback.png` });
  const unavailableState = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)), SAVE_KEY);
  assert(
    unavailableState?.chips === 20 && unavailableState?.pendingReveal === null,
    `${viewportWidth} unavailable Charged lower-right remains non-mutating`,
    unavailableState ?? {},
  );

  await context.close();
};

await auditViewport(900);
await auditViewport(1280);

await fs.writeFile(`${outDir}/report.json`, JSON.stringify({
  auditedProductHead: PRODUCT_HEAD,
  auditHead: process.env.GITHUB_SHA ?? null,
  errors,
  failedRequests,
  assertions,
}, null, 2));

await browser.close();
if (errors.length || failedRequests.length || assertions.some(({ pass }) => !pass)) process.exitCode = 1;
