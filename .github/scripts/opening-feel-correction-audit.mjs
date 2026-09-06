import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const PRODUCT_HEAD = '309c7c86dc4b384aab57dafb1743aa7537594b2f';
const outDir = '/tmp/opening-feel-correction-audit';
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
  await page.waitForTimeout(550);
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
  }, SAVE_KEY, { timeout: 6_000 });
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

const waitForIdleAfterBank = async (page, expectedChips) => {
  await page.waitForFunction(({ key, chips }) => {
    const raw = localStorage.getItem(key);
    if (!raw) return false;
    try {
      const save = JSON.parse(raw);
      return save.pendingReveal === null && save.chips === chips;
    } catch {
      return false;
    }
  }, { key: SAVE_KEY, chips: expectedChips }, { timeout: 8_000 });
  await page.waitForTimeout(850);
};

const dragTear1280 = async (page) => {
  const startX = 640 - 158;
  const startY = 266 - 83;
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX + 68, startY, { steps: 5 });
  await page.waitForTimeout(80);
  await page.mouse.move(startX + 170, startY, { steps: 7 });
  await page.waitForTimeout(70);
  await page.mouse.move(startX + 310, startY, { steps: 8 });
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

const clickCharged1280 = async (page) => {
  await page.mouse.click(110, 315);
  await page.waitForTimeout(180);
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

await setSaveAndReload(page, baseSave({ totalOpens: 0, chips: 20 }));
await shot(page, '01-idle-basic-1280');
await page.mouse.click(110, 315);
await page.waitForTimeout(70);
await shot(page, '02-insufficient-charged-feedback');
const insufficient = await readSave(page, 'insufficient-charged');
assert(insufficient.chips === 20, 'unavailable Charged does not mutate wallet', { chips: insufficient.chips });

await setSaveAndReload(page, baseSave({ chips: 100 }));
await clickCharged1280(page);
await shot(page, '03-charged-selected-idle');
const chargedIdle = await readSave(page, 'charged-selected-idle');
assert(chargedIdle.chips === 100, 'selecting Charged does not spend before tear', { chips: chargedIdle.chips });

await setSaveAndReload(page, baseSave());
await runDeterministicTear1280(page, [0.1, 0.1, 0.0, 0.0, 0.99]);
await page.waitForTimeout(480);
await shot(page, '04-basic-reveal-in-motion');
await waitForCommit(page, 4);
await page.waitForTimeout(180);
await shot(page, '05-basic-result-staged');
const basicCommitted = await readSave(page, 'basic-committed-before-bank');
assert(basicCommitted.pendingReveal === null, 'Basic commits before cosmetic banking');
await page.waitForTimeout(1_000);
await page.mouse.click(640, 568);
await page.waitForTimeout(170);
await shot(page, '06-basic-bank-in-flight');
await waitForIdleAfterBank(page, basicCommitted.chips);
await shot(page, '07-basic-idle-after-bank');

await setSaveAndReload(page, baseSave());
await runDeterministicTear1280(page, [0.1, 0.1, 0.0, 0.999, 0.5, 0.99]);
await waitForCommit(page, 4);
await page.waitForTimeout(220);
await shot(page, '08-mega-result-staged');
const megaCommitted = await readSave(page, 'mega-committed-before-bank');
await page.waitForTimeout(950);
await page.mouse.click(640, 568);
await page.waitForTimeout(260);
await shot(page, '09-mega-bank-and-ready');
await waitForIdleAfterBank(page, megaCommitted.chips);
await shot(page, '10-mega-idle-after-bank');

await setSaveAndReload(page, baseSave({ chips: 20, discoveredStandard: ['camera-common'] }));
await runDeterministicTear1280(page, [0.1, 0.1, 0.0, 0.0, 0.99]);
await waitForCommit(page, 4);
await page.waitForTimeout(220);
await shot(page, '11-duplicate-result-staged');
const duplicateCommitted = await readSave(page, 'duplicate-committed-before-bank');
assert(duplicateCommitted.signal === 1, 'duplicate commits Signal +1', { signal: duplicateCommitted.signal });
await page.waitForTimeout(950);
await page.mouse.click(640, 568);
await page.waitForTimeout(480);
await shot(page, '12-duplicate-bank-signal');
await waitForIdleAfterBank(page, duplicateCommitted.chips);
await shot(page, '13-duplicate-idle-signal-1');

await setSaveAndReload(page, baseSave({ chips: 100 }));
await clickCharged1280(page);
await runDeterministicTear1280(page, [0.1, 0.99, 0.0, 0.0, 0.99]);
await page.waitForTimeout(300);
await shot(page, '14-charged-spend-and-reveal');
await waitForCommit(page, 4);
await page.waitForTimeout(220);
await shot(page, '15-charged-legendary-result');
const chargedCommitted = await readSave(page, 'charged-legendary-committed');
assert(chargedCommitted.chips < 100, 'Charged deterministic fixture spends wallet', { chips: chargedCommitted.chips });

await setSaveAndReload(page, baseSave({
  chips: 60,
  signal: 4,
  discoveredStandard: basicEligible,
  totalOpens: 12,
}));
await shot(page, '16-signal-lock-waiting-charged');

await setSaveAndReload(page, baseSave({ totalOpens: 3 }));
await runDeterministicTear1280(page, [0.1, 0.1, 0.0, 0.0, 0.0, 0.1]);
await waitForCommit(page, 4);
await page.waitForTimeout(1_050);
await shot(page, '17-hidden-secret-final');
await page.mouse.move(640, 326);
await page.mouse.down();
await page.mouse.move(790, 326, { steps: 12 });
await page.mouse.up();
await page.waitForTimeout(300);
await shot(page, '18-hidden-standard-selected');
await page.setViewportSize({ width: 900, height: 720 });
await page.waitForTimeout(450);
await shot(page, '19-hidden-standard-900');
await page.setViewportSize({ width: 1280, height: 720 });
await page.waitForTimeout(300);

await setSaveAndReload(page, baseSave({ chips: 10 }));
await runDeterministicTear1280(page, [0.1, 0.1, 0.0, 0.0, 0.99]);
await page.waitForTimeout(30);
await page.mouse.click(640, 430);
for (let i = 0; i < 8; i += 1) {
  await page.waitForTimeout(150);
  await page.mouse.click(640, 430);
}
await waitForCommit(page, 4);
const fastCommitted = await readSave(page, 'fast-forward-committed');
assert(fastCommitted.totalOpens === 4, 'fast-forward commits exactly one opening', { totalOpens: fastCommitted.totalOpens });
assert(fastCommitted.pendingReveal === null, 'fast-forward leaves no pending reveal');
await page.waitForTimeout(120);
await page.mouse.click(640, 430);
await page.waitForTimeout(180);
await shot(page, '20-fast-forward-result');

await setSaveAndReload(page, baseSave({ chips: 20 }));
await showDebug(page);
await Promise.all([
  page.waitForEvent('framenavigated', { timeout: 10_000 }),
  page.getByRole('button', { name: 'Force Common', exact: true }).click(),
]);
await waitReady(page);
await hideDebug(page);
await waitForCommit(page, 4);
await page.waitForTimeout(1_050);
await shot(page, '21-recovered-basic-final');
const recoveredBasic = await readSave(page, 'recovered-basic-final');
assert(recoveredBasic.pendingReveal === null, 'recovered Basic commits exactly once');

await setSaveAndReload(page, baseSave({ chips: 100 }));
await showDebug(page);
await Promise.all([
  page.waitForEvent('framenavigated', { timeout: 10_000 }),
  page.getByRole('button', { name: 'Force Legendary (Charged)', exact: true }).click(),
]);
await waitReady(page);
await hideDebug(page);
await waitForCommit(page, 4);
await page.waitForTimeout(1_050);
await shot(page, '22-recovered-charged-final');
const recoveredCharged = await readSave(page, 'recovered-charged-final');
assert(recoveredCharged.pendingReveal === null, 'recovered Charged commits exactly once');

await enContext.close();

const ruContext = await browser.newContext({
  viewport: { width: 1024, height: 720 },
  locale: 'ru-RU',
  recordVideo: { dir: outDir, size: { width: 1024, height: 720 } },
});
const ruPage = await ruContext.newPage();
attachDiagnostics(ruPage, 'ru');
await ruPage.goto('http://127.0.0.1:5173/?debug=1&platform=mock', { waitUntil: 'domcontentloaded' });
await waitReady(ruPage);
await setSaveAndReload(ruPage, baseSave({ chips: 60, signal: 4, discoveredStandard: basicEligible, totalOpens: 12 }));
await shot(ruPage, '23-ru-signal-basic-1024');
await ruPage.mouse.click(95, 315);
await ruPage.waitForTimeout(180);
await shot(ruPage, '24-ru-charged-selected-1024');
await ruPage.setViewportSize({ width: 900, height: 720 });
await ruPage.waitForTimeout(450);
await shot(ruPage, '25-ru-charged-selected-900');
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
