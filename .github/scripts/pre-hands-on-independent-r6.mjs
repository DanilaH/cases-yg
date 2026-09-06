import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const PRODUCT_HEAD = '5931fcc0ea3b140d1653cb26b5052931fdc7d50b';
const SAVE_KEY = 'mystery-pocket-tech.save';
const outDir = '/tmp/pre-hands-on-independent-r6';
const errors = [];
const failedRequests = [];
const assertions = [];

await fs.rm(outDir, { recursive: true, force: true });
await fs.mkdir(outDir, { recursive: true });

const baseSave = (overrides = {}) => ({
  version: 2,
  discoveredStandard: [],
  discoveredSecrets: [],
  chips: 0,
  signal: 0,
  activeLootPoolId: 'y2k-essentials',
  totalOpens: 6,
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

const assert = (condition, label, details = {}) => {
  assertions.push({ label, pass: Boolean(condition), ...details });
  if (!condition) throw new Error(`Assertion failed: ${label} ${JSON.stringify(details)}`);
};

const waitReady = async (page) => {
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
const shot = async (page, name) => page.screenshot({ path: `${outDir}/${name}.png` });

const setSaveAndReload = async (page, save) => {
  await page.evaluate(({ key, value }) => localStorage.setItem(key, JSON.stringify(value)), { key: SAVE_KEY, value: save });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await waitReady(page);
  await hideDebug(page);
};

const readSave = async (page) => {
  const raw = await page.evaluate((key) => localStorage.getItem(key), SAVE_KEY);
  return raw ? JSON.parse(raw) : null;
};

const stageScenario = async (page, buttonName) => {
  await showDebug(page);
  await Promise.all([
    page.waitForEvent('framenavigated', { timeout: 10_000 }),
    page.getByRole('button', { name: buttonName, exact: true }).click(),
  ]);
  await waitReady(page);
  await hideDebug(page);
};

const waitForCommittedResult = async (page, expectedTotalOpens) => {
  await page.waitForFunction(({ key, total }) => {
    const raw = localStorage.getItem(key);
    if (!raw) return false;
    try {
      const save = JSON.parse(raw);
      return save.pendingReveal === null && save.totalOpens === total;
    } catch {
      return false;
    }
  }, { key: SAVE_KEY, total: expectedTotalOpens }, { timeout: 15_000 });
  await page.waitForTimeout(350);
};

const humanTap = async (page, x, y) => {
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.waitForTimeout(70);
  await page.mouse.up();
};

// 900px compact states: large wallet, unavailable feedback, Charged selection.
const compactContext = await browser.newContext({
  viewport: { width: 900, height: 720 },
  locale: 'ru-RU',
  recordVideo: { dir: outDir, size: { width: 900, height: 720 } },
});
const compact = await compactContext.newPage();
attachDiagnostics(compact, 'compact');
await compact.goto('http://127.0.0.1:5173/?debug=1&platform=mock', { waitUntil: 'domcontentloaded' });
await waitReady(compact);
await hideDebug(compact);

await setSaveAndReload(compact, baseSave({ chips: 999999 }));
await shot(compact, '00-ru-900-six-digit-wallet');

await setSaveAndReload(compact, baseSave({ chips: 20 }));
await shot(compact, '01-ru-900-unavailable-charged-idle');
await humanTap(compact, 135, 330);
await compact.waitForTimeout(80);
await shot(compact, '02-ru-900-unavailable-charged-feedback');
const afterUnavailable = await readSave(compact);
assert(afterUnavailable?.chips === 20 && afterUnavailable?.pendingReveal === null, 'unavailable Charged feedback does not mutate save', afterUnavailable ?? {});

await setSaveAndReload(compact, baseSave({ chips: 100 }));
await humanTap(compact, 135, 330);
await compact.waitForTimeout(220);
await shot(compact, '03-ru-900-charged-selected');

// Duplicate result + banking in compact layout.
await setSaveAndReload(compact, baseSave({ chips: 20, totalOpens: 6 }));
await stageScenario(compact, 'Force Duplicate');
await waitForCommittedResult(compact, 7);
await shot(compact, '04-ru-900-duplicate-result');
// First tap ends current read beat; second accepts and starts banking.
await humanTap(compact, 470, 360);
await compact.waitForTimeout(100);
await humanTap(compact, 470, 360);
for (let i = 0; i < 7; i += 1) {
  await compact.waitForTimeout(90);
  await shot(compact, `05-ru-900-duplicate-bank-${i}`);
}
await compactContext.close();

// EN wide states: Signal transfer, Hidden Pocket and general result composition.
const wideContext = await browser.newContext({
  viewport: { width: 1280, height: 720 },
  locale: 'en-US',
  recordVideo: { dir: outDir, size: { width: 1280, height: 720 } },
});
const wide = await wideContext.newPage();
attachDiagnostics(wide, 'wide');
await wide.goto('http://127.0.0.1:5173/?debug=1&platform=mock', { waitUntil: 'domcontentloaded' });
await waitReady(wide);
await hideDebug(wide);

await setSaveAndReload(wide, baseSave({ chips: 80, signal: 3, totalOpens: 6 }));
await stageScenario(wide, 'Reach SIGNAL LOCK');
await waitForCommittedResult(wide, 7);
await shot(wide, '06-en-signal-lock-reached-result');
await humanTap(wide, 650, 360);
await wide.waitForTimeout(100);
await humanTap(wide, 650, 360);
for (let i = 0; i < 6; i += 1) {
  await wide.waitForTimeout(90);
  await shot(wide, `07-en-signal-lock-bank-${i}`);
}

await setSaveAndReload(wide, baseSave({ chips: 80, totalOpens: 6 }));
await stageScenario(wide, 'Force Hidden Pocket');
await waitForCommittedResult(wide, 7);
await shot(wide, '08-en-hidden-pocket-result');

await fs.writeFile(`${outDir}/report.json`, JSON.stringify({
  auditedProductHead: PRODUCT_HEAD,
  auditHead: process.env.GITHUB_SHA ?? null,
  errors,
  failedRequests,
  assertions,
}, null, 2));

await wideContext.close();
await browser.close();
if (errors.length || failedRequests.length || assertions.some(({ pass }) => !pass)) process.exitCode = 1;
