import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const PRODUCT_HEAD = '1626f7954edfc715ff54f4b50060ff9eec68a3c4';
const outDir = '/tmp/gameplay-loop-lite-v2-final-merged-audit';
await fs.rm(outDir, { recursive: true, force: true });
await fs.mkdir(outDir, { recursive: true });

const errors = [];
const failedRequests = [];
const states = [];
const assertions = [];
const SAVE_KEY = 'mystery-pocket-tech.save';

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

const waitReady = async (page) => {
  await page.waitForSelector('#game canvas', { state: 'visible', timeout: 20_000 });
  await page.waitForFunction(() => document.querySelector('#orientation-gate')?.getAttribute('data-visible') !== 'true');
  await page.waitForTimeout(650);
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
  await page.evaluate(({ key, value }) => localStorage.setItem(key, JSON.stringify(value)), {
    key: SAVE_KEY,
    value: save,
  });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await waitReady(page);
  await hideDebug(page);
};

const readSave = async (page, label) => {
  const raw = await page.evaluate((key) => localStorage.getItem(key), SAVE_KEY);
  const save = raw ? JSON.parse(raw) : null;
  states.push({ label, save });
  return save;
};

const assert = (condition, label, details = {}) => {
  assertions.push({ label, pass: Boolean(condition), ...details });
  if (!condition) throw new Error(`Assertion failed: ${label} ${JSON.stringify(details)}`);
};

const waitForPending = async (page) => {
  await page.waitForFunction((key) => {
    const raw = localStorage.getItem(key);
    if (!raw) return false;
    try { return JSON.parse(raw).pendingReveal !== null; } catch { return false; }
  }, SAVE_KEY, { timeout: 5_000 });
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
  }, { key: SAVE_KEY, total: expectedTotalOpens }, { timeout: 12_000 });
  await page.waitForTimeout(750);
};

const dismissResult = async (page) => {
  await page.waitForTimeout(1_600);
  await page.mouse.click(200, 650);
  await page.waitForTimeout(900);
};

const dragTear1280 = async (page) => {
  const startX = 640 - 158;
  const startY = 266 - 83;
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX + 150, startY, { steps: 8 });
  await page.waitForTimeout(90);
  await page.mouse.move(startX + 310, startY, { steps: 10 });
  await page.mouse.up();
};

const runDeterministicTear1280 = async (page, sequence) => {
  await page.evaluate((values) => {
    globalThis.__mptAuditOriginalRandom = Math.random;
    globalThis.__mptAuditRandom = [...values];
    Math.random = () => {
      const queue = globalThis.__mptAuditRandom;
      return Array.isArray(queue) && queue.length > 0 ? queue.shift() : 0.99;
    };
  }, sequence);
  try {
    await dragTear1280(page);
    await waitForPending(page);
  } finally {
    await page.evaluate(() => {
      if (typeof globalThis.__mptAuditOriginalRandom === 'function') Math.random = globalThis.__mptAuditOriginalRandom;
      delete globalThis.__mptAuditOriginalRandom;
      delete globalThis.__mptAuditRandom;
    });
  }
};

const selectCharged1280 = async (page) => {
  await page.mouse.click(750, 96);
  await page.waitForTimeout(240);
};

const basicEligible = [
  'camera-common', 'camera-rare', 'camera-epic',
  'flip-phone-common', 'flip-phone-rare', 'flip-phone-epic',
];

const enContext = await browser.newContext({
  viewport: { width: 1280, height: 720 },
  locale: 'en-US',
  recordVideo: { dir: outDir, size: { width: 1280, height: 720 } },
});
const page = await enContext.newPage();
attachDiagnostics(page, 'en');
await page.goto('http://127.0.0.1:5173/?debug=1&platform=mock', { waitUntil: 'domcontentloaded' });
await waitReady(page);
await hideDebug(page);

// Baseline idle.
await setSaveAndReload(page, baseSave({ totalOpens: 0 }));
await shot(page, '01-idle-basic-1280');

// Basic normal payout.
await setSaveAndReload(page, baseSave());
await runDeterministicTear1280(page, [0.1, 0.1, 0.0, 0.0, 0.99]);
await page.waitForTimeout(260);
await shot(page, '02-basic-chips-selector-hidden');
await waitForCommit(page, 4);
await shot(page, '03-basic-final-result');
await readSave(page, 'basic-final');

// Mega cache + Charged-ready beat.
await setSaveAndReload(page, baseSave());
await runDeterministicTear1280(page, [0.1, 0.1, 0.0, 0.999, 0.5, 0.99]);
await page.waitForTimeout(650);
await shot(page, '04-mega-cache-beat');
await page.waitForTimeout(650);
await shot(page, '05-charged-ready-beat');
await waitForCommit(page, 4);
await shot(page, '06-mega-cache-final');
await readSave(page, 'mega-cache-final');

// Duplicate recycle + Signal.
await setSaveAndReload(page, baseSave({ chips: 20, discoveredStandard: ['camera-common'] }));
await runDeterministicTear1280(page, [0.1, 0.1, 0.0, 0.0, 0.99]);
await page.waitForTimeout(1_000);
await shot(page, '07-duplicate-recycle');
await waitForCommit(page, 4);
await shot(page, '08-duplicate-final');
const duplicateFinal = await readSave(page, 'duplicate-final');
assert(duplicateFinal.signal === 1, 'duplicate increments Signal to 1/4', { signal: duplicateFinal.signal });

// Charged idle + spend + Legendary.
await setSaveAndReload(page, baseSave({ chips: 100 }));
await selectCharged1280(page);
await shot(page, '09-charged-selected-idle');
await runDeterministicTear1280(page, [0.1, 0.99, 0.0, 0.0, 0.99]);
await page.waitForTimeout(260);
await shot(page, '10-charged-spend-selector-hidden');
await waitForCommit(page, 4);
await shot(page, '11-charged-legendary-final');
const chargedFinal = await readSave(page, 'charged-final');
assert(chargedFinal.chips < 100, 'Charged spend remains a sink in this deterministic fixture', { chips: chargedFinal.chips });

// Signal lock waiting for Charged.
await setSaveAndReload(page, baseSave({
  chips: 60,
  signal: 4,
  discoveredStandard: basicEligible,
  totalOpens: 12,
}));
await shot(page, '12-signal-lock-waiting-charged');

// Hidden Pocket + carousel + resize continuity.
await setSaveAndReload(page, baseSave({ totalOpens: 3 }));
await runDeterministicTear1280(page, [0.1, 0.1, 0.0, 0.0, 0.0, 0.1]);
await waitForCommit(page, 4);
await shot(page, '13-hidden-secret-final');
await page.mouse.move(640, 326);
await page.mouse.down();
await page.mouse.move(790, 326, { steps: 12 });
await page.mouse.up();
await page.waitForTimeout(280);
await shot(page, '14-hidden-standard-selected');
await page.setViewportSize({ width: 900, height: 720 });
await page.waitForTimeout(400);
await shot(page, '15-hidden-standard-900');
await page.setViewportSize({ width: 1280, height: 720 });
await page.waitForTimeout(280);

// Recovery: staged Basic reveal.
await setSaveAndReload(page, baseSave({ chips: 20 }));
await showDebug(page);
await Promise.all([
  page.waitForEvent('framenavigated', { timeout: 10_000 }),
  page.getByRole('button', { name: 'Force Common', exact: true }).click(),
]);
await waitReady(page);
await hideDebug(page);
await waitForCommit(page, 4);
await shot(page, '16-recovered-basic-final');
const recoveredBasic = await readSave(page, 'recovered-basic-final');
assert(recoveredBasic.pendingReveal === null, 'recovered Basic commits exactly once');

// Recovery: staged Charged reveal.
await setSaveAndReload(page, baseSave({ chips: 100 }));
await showDebug(page);
await Promise.all([
  page.waitForEvent('framenavigated', { timeout: 10_000 }),
  page.getByRole('button', { name: 'Force Legendary (Charged)', exact: true }).click(),
]);
await waitReady(page);
await hideDebug(page);
await waitForCommit(page, 4);
await shot(page, '17-recovered-charged-final');
const recoveredCharged = await readSave(page, 'recovered-charged-final');
assert(recoveredCharged.pendingReveal === null, 'recovered Charged commits exactly once');

// FINAL FIX GATE A: repeated Charged must remain selected while affordable.
await setSaveAndReload(page, baseSave({ chips: 130 }));
await selectCharged1280(page);
await shot(page, '18-continuity-charged-before-first-open');
await runDeterministicTear1280(page, [0.1, 0.99, 0.0, 0.0, 0.99]);
let firstPending = await readSave(page, 'continuity-first-pending');
assert(firstPending.pendingReveal?.pouchType === 'charged', 'first continuity opening is Charged', { pouchType: firstPending.pendingReveal?.pouchType });
await waitForCommit(page, 4);
const firstCommitted = await readSave(page, 'continuity-first-committed');
assert(firstCommitted.chips >= 60, 'continuity fixture remains Charged-affordable', { chips: firstCommitted.chips });
await dismissResult(page);
await shot(page, '19-continuity-charged-persists-idle');
await runDeterministicTear1280(page, [0.1, 0.99, 0.0, 0.0, 0.99]);
const repeatedPending = await readSave(page, 'continuity-second-pending');
assert(repeatedPending.pendingReveal?.pouchType === 'charged', 'repeated affordable opening preserves Charged', { pouchType: repeatedPending.pendingReveal?.pouchType });

// FINAL FIX GATE B: unaffordable Charged must fall back to Basic.
await setSaveAndReload(page, baseSave({ chips: 60 }));
await selectCharged1280(page);
await shot(page, '20-fallback-charged-before-open');
await runDeterministicTear1280(page, [0.1, 0.99, 0.0, 0.0, 0.99]);
const fallbackPending = await readSave(page, 'fallback-charged-pending');
assert(fallbackPending.pendingReveal?.pouchType === 'charged', 'fallback fixture opening starts Charged', { pouchType: fallbackPending.pendingReveal?.pouchType });
await waitForCommit(page, 4);
const fallbackCommitted = await readSave(page, 'fallback-charged-committed');
assert(fallbackCommitted.chips < 60, 'fallback fixture becomes unaffordable', { chips: fallbackCommitted.chips });
await dismissResult(page);
await shot(page, '21-fallback-basic-idle');
await runDeterministicTear1280(page, [0.1, 0.1, 0.0, 0.0, 0.99]);
const fallbackNextPending = await readSave(page, 'fallback-next-pending');
assert(fallbackNextPending.pendingReveal?.pouchType === 'basic', 'unaffordable Charged falls back to Basic', { pouchType: fallbackNextPending.pendingReveal?.pouchType });

await enContext.close();

// RU/narrow-width regression.
const ruContext = await browser.newContext({
  viewport: { width: 1024, height: 720 },
  locale: 'ru-RU',
  recordVideo: { dir: outDir, size: { width: 1024, height: 720 } },
});
const ruPage = await ruContext.newPage();
attachDiagnostics(ruPage, 'ru');
await ruPage.goto('http://127.0.0.1:5173/?debug=1&platform=mock', { waitUntil: 'domcontentloaded' });
await waitReady(ruPage);
await setSaveAndReload(ruPage, baseSave({
  chips: 60,
  signal: 4,
  discoveredStandard: basicEligible,
  totalOpens: 12,
}));
await shot(ruPage, '22-ru-signal-charged-1024');
await ruContext.close();

await fs.writeFile(`${outDir}/report.json`, JSON.stringify({
  auditedProductHead: PRODUCT_HEAD,
  auditBranchHead: process.env.GITHUB_SHA ?? null,
  errors,
  failedRequests,
  assertions,
  states,
}, null, 2));

await browser.close();
if (errors.length || failedRequests.length || assertions.some(({ pass }) => !pass)) process.exitCode = 1;
