import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const PRODUCT_HEAD = '11c7564764f0fa2cbdb96d22b02620ef5435627d';
const outDir = '/tmp/pre-hands-on-r5-audit';
const SAVE_KEY = 'mystery-pocket-tech.save';
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
  totalOpens: 3,
  pendingReveal: null,
  muted: false,
  stats: { duplicates: 0, hiddenPockets: 0 },
  ...overrides,
});

const basicEligible = [
  'camera-common', 'camera-rare', 'camera-epic',
  'flip-phone-common', 'flip-phone-rare', 'flip-phone-epic',
];

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
  page.on('requestfailed', (request) => {
    failedRequests.push({ tag, url: request.url(), error: request.failure()?.errorText ?? 'unknown' });
  });
};

const assert = (condition, label, details = {}) => {
  assertions.push({ label, pass: Boolean(condition), ...details });
  if (!condition) throw new Error(`Assertion failed: ${label} ${JSON.stringify(details)}`);
};

const shot = async (page, name) => page.screenshot({ path: `${outDir}/${name}.png` });

const waitCanvas = async (page) => {
  await page.waitForSelector('#game canvas', { state: 'visible', timeout: 20_000 });
  await page.waitForTimeout(550);
};

const waitLandscapeReady = async (page) => {
  await waitCanvas(page);
  await page.waitForFunction(() => document.querySelector('#orientation-gate')?.getAttribute('data-visible') !== 'true');
};

const hideDebug = async (page) => page.evaluate(() => {
  const panel = document.querySelector('.mpt-debug-panel');
  if (panel) panel.style.display = 'none';
});

const showDebug = async (page) => page.evaluate(() => {
  const panel = document.querySelector('.mpt-debug-panel');
  if (panel) panel.style.display = '';
});

const setSaveAndReload = async (page, save) => {
  await page.evaluate(({ key, value }) => localStorage.setItem(key, JSON.stringify(value)), { key: SAVE_KEY, value: save });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await waitLandscapeReady(page);
  await hideDebug(page);
};

const readSave = async (page) => {
  const raw = await page.evaluate((key) => localStorage.getItem(key), SAVE_KEY);
  return raw ? JSON.parse(raw) : null;
};

const waitForCommit = async (page, expectedTotalOpens) => {
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
};

// Prove the critical pre-module shell independently of normal JS boot timing.
const startupContext = await browser.newContext({
  viewport: { width: 720, height: 1280 },
  locale: 'en-US',
  recordVideo: { dir: outDir, size: { width: 720, height: 1280 } },
});
const startupPage = await startupContext.newPage();
attachDiagnostics(startupPage, 'startup');
let delayedMainRequest = false;
await startupPage.route('**/src/main.ts', async (route) => {
  delayedMainRequest = true;
  await new Promise((resolve) => setTimeout(resolve, 1_000));
  await route.continue();
});
const navigation = startupPage.goto('http://127.0.0.1:5173/?platform=mock', { waitUntil: 'domcontentloaded' });
await startupPage.waitForSelector('#game-shell', { state: 'attached', timeout: 5_000 });
await startupPage.waitForTimeout(160);
const preModuleStyle = await startupPage.evaluate(() => ({
  bodyBackground: getComputedStyle(document.body).backgroundColor,
  gateDisplay: getComputedStyle(document.querySelector('#orientation-gate')).display,
  gateText: document.querySelector('#orientation-gate')?.textContent ?? '',
}));
assert(delayedMainRequest, 'main.ts request is intentionally delayed during critical-shell proof');
assert(preModuleStyle.bodyBackground === 'rgb(23, 20, 33)', 'pre-module body is dark, not browser-white', preModuleStyle);
assert(preModuleStyle.gateDisplay === 'none', 'raw orientation copy is hidden before bundled CSS/boot', preModuleStyle);
await shot(startupPage, '00-pre-module-critical-shell');
await navigation;
await waitCanvas(startupPage);
await startupPage.waitForFunction(() => document.querySelector('#orientation-gate')?.getAttribute('data-visible') === 'true');
await startupPage.waitForTimeout(180);
await shot(startupPage, '01-styled-orientation-gate-portrait');
await startupContext.close();

const enContext = await browser.newContext({
  viewport: { width: 1280, height: 720 },
  locale: 'en-US',
  recordVideo: { dir: outDir, size: { width: 1280, height: 720 } },
});
const page = await enContext.newPage();
attachDiagnostics(page, 'en');
await page.goto('http://127.0.0.1:5173/?debug=1&platform=mock', { waitUntil: 'domcontentloaded' });
await waitLandscapeReady(page);
await hideDebug(page);

await setSaveAndReload(page, baseSave({ totalOpens: 0, chips: 20 }));
await shot(page, '02-idle-pouch-alignment-1280');

await setSaveAndReload(page, baseSave({ chips: 60, signal: 4, discoveredStandard: basicEligible, totalOpens: 12 }));
await shot(page, '03-en-signal-lock-1280');

await setSaveAndReload(page, baseSave({ chips: 100 }));
await page.mouse.click(110, 315);
await page.waitForTimeout(180);
await shot(page, '04-charged-selected-pouch-1280');

await setSaveAndReload(page, baseSave({ chips: 20 }));
await showDebug(page);
await Promise.all([
  page.waitForEvent('framenavigated', { timeout: 10_000 }),
  page.getByRole('button', { name: 'Force Common', exact: true }).click(),
]);
await waitLandscapeReady(page);
await hideDebug(page);
await shot(page, '05-recovered-basic-early');
await waitForCommit(page, 4);
await page.waitForTimeout(650);
await shot(page, '06-recovered-basic-final');
const recoveredBasic = await readSave(page);
assert(recoveredBasic?.pendingReveal === null && recoveredBasic?.totalOpens === 4, 'recovered Basic commits once', recoveredBasic ?? {});

await setSaveAndReload(page, baseSave({ chips: 100 }));
await showDebug(page);
await Promise.all([
  page.waitForEvent('framenavigated', { timeout: 10_000 }),
  page.getByRole('button', { name: 'Force Legendary (Charged)', exact: true }).click(),
]);
await waitLandscapeReady(page);
await hideDebug(page);
await shot(page, '07-recovered-charged-early');
await waitForCommit(page, 4);
await page.waitForTimeout(650);
await shot(page, '08-recovered-charged-final');
const recoveredCharged = await readSave(page);
assert(recoveredCharged?.pendingReveal === null && recoveredCharged?.totalOpens === 4, 'recovered Charged commits once', recoveredCharged ?? {});
await enContext.close();

const ruContext = await browser.newContext({
  viewport: { width: 1024, height: 720 },
  locale: 'ru-RU',
  recordVideo: { dir: outDir, size: { width: 1024, height: 720 } },
});
const ruPage = await ruContext.newPage();
attachDiagnostics(ruPage, 'ru');
await ruPage.goto('http://127.0.0.1:5173/?debug=1&platform=mock', { waitUntil: 'domcontentloaded' });
await waitLandscapeReady(ruPage);
await setSaveAndReload(ruPage, baseSave({ chips: 60, signal: 4, discoveredStandard: basicEligible, totalOpens: 12 }));
await shot(ruPage, '09-ru-signal-lock-1024');
await ruPage.setViewportSize({ width: 900, height: 720 });
await ruPage.waitForTimeout(450);
await shot(ruPage, '10-ru-signal-lock-900');
await ruContext.close();

await fs.writeFile(`${outDir}/report.json`, JSON.stringify({
  auditedProductHead: PRODUCT_HEAD,
  auditHead: process.env.GITHUB_SHA ?? null,
  errors,
  failedRequests,
  assertions,
}, null, 2));

await browser.close();
if (errors.length || failedRequests.length || assertions.some(({ pass }) => !pass)) process.exitCode = 1;
