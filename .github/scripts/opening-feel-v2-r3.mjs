import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const PRODUCT_HEAD = '482c2081b75e04bda217950b07bdcf34a723d866';
const SAVE_KEY = 'mystery-pocket-tech.save';
const outDir = '/tmp/opening-feel-v2-r3';
const errors = [];
const failedRequests = [];
const assertions = [];

await fs.rm(outDir, { recursive: true, force: true });
await fs.mkdir(outDir, { recursive: true });

const assert = (condition, label, details = {}) => {
  assertions.push({ label, pass: Boolean(condition), ...details });
  if (!condition) throw new Error(`Assertion failed: ${label} ${JSON.stringify(details)}`);
};

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

const customPendingSave = ({
  chips = 20,
  base = 7,
  cacheBonus = 0,
  recycle = 0,
  signalGain = 0,
  cacheTier = cacheBonus > 0 ? 'cache' : 'none',
  pouchType = 'basic',
  cost = pouchType === 'charged' ? 60 : 0,
  rarity = recycle > 0 ? 'rare' : 'common',
  familyId = 'camera',
} = {}) => {
  const collectibleId = `${familyId}-${rarity}`;
  const totalEarned = base + cacheBonus + recycle;
  const afterChips = chips - cost + totalEarned;
  const discoveredStandard = recycle > 0 ? [collectibleId] : [];
  const nextDiscovered = recycle > 0 ? discoveredStandard : [collectibleId];
  const pending = {
    id: `audit-r3-${Date.now()}-${base}-${cacheBonus}-${recycle}-${signalGain}`,
    baseTotalOpens: 6,
    pouchType,
    lootPoolId: 'y2k-essentials',
    openingNumber: 7,
    standard: { collectibleId, familyId, rarity, isNew: recycle === 0 },
    chips: {
      before: chips,
      cost,
      base,
      cacheTier,
      cacheBonus,
      recycle,
      totalEarned,
      after: afterChips,
    },
    signal: {
      before: 0,
      after: signalGain,
      gain: signalGain,
      lockArmedBefore: false,
      lockConsumed: false,
      lockReached: signalGain >= 4,
      lockRetained: false,
    },
    hiddenPocket: null,
    commit: {
      discoveredStandard: nextDiscovered,
      discoveredSecrets: [],
      chips: afterChips,
      signal: signalGain,
      activeLootPoolId: 'y2k-essentials',
      totalOpens: 7,
      stats: { duplicates: recycle > 0 ? 1 : 0, hiddenPockets: 0 },
    },
  };
  return baseSave({ discoveredStandard, chips, pendingReveal: pending });
};

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

const waitReady = async (page) => {
  await page.waitForSelector('#game canvas', { state: 'visible', timeout: 20_000 });
  await page.waitForFunction(() => document.querySelector('#orientation-gate')?.getAttribute('data-visible') !== 'true');
  await page.waitForTimeout(520);
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
const readSave = async (page) => {
  const raw = await page.evaluate((key) => localStorage.getItem(key), SAVE_KEY);
  return raw ? JSON.parse(raw) : null;
};
const setSaveAndReload = async (page, save) => {
  await page.evaluate(({ key, value }) => localStorage.setItem(key, JSON.stringify(value)), { key: SAVE_KEY, value: save });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await waitReady(page);
  await hideDebug(page);
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
const waitForCommittedResult = async (page, total = 7) => {
  await page.waitForFunction(({ key, totalOpens }) => {
    const raw = localStorage.getItem(key);
    if (!raw) return false;
    try {
      const save = JSON.parse(raw);
      return save.pendingReveal === null && save.totalOpens === totalOpens;
    } catch {
      return false;
    }
  }, { key: SAVE_KEY, totalOpens: total }, { timeout: 15_000 });
  await page.waitForTimeout(260);
};
const humanTap = async (page, x, y) => {
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.waitForTimeout(75);
  await page.mouse.up();
};
const acceptResult = async (page, x, y) => {
  await humanTap(page, x, y);
  await page.waitForTimeout(130);
  await humanTap(page, x, y);
};
const makeContext = (width, locale) => browser.newContext({
  viewport: { width, height: 720 },
  locale,
  recordVideo: { dir: outDir, size: { width, height: 720 } },
});

// 900 RU: dense four-row payout and the refined emitter path.
const compactContext = await makeContext(900, 'ru-RU');
const compact = await compactContext.newPage();
attachDiagnostics(compact, 'ru-900');
await compact.goto('http://127.0.0.1:5173/?debug=1&platform=mock', { waitUntil: 'domcontentloaded' });
await waitReady(compact);
await hideDebug(compact);

await setSaveAndReload(compact, baseSave({
  chips: 999999,
  signal: 4,
  discoveredStandard: ['camera-common','camera-rare','camera-epic','flip-phone-common','flip-phone-rare','flip-phone-epic'],
}));
await shot(compact, '00-ru-900-six-digit-lock-hud');

await setSaveAndReload(compact, baseSave({ chips: 20 }));
await humanTap(compact, 135, 306);
await compact.waitForTimeout(130);
const unavailableSave = await readSave(compact);
assert(unavailableSave?.chips === 20 && unavailableSave?.pendingReveal === null, 'unavailable Charged remains non-mutating');
await shot(compact, '01-ru-900-unavailable-feedback');

await setSaveAndReload(compact, customPendingSave({ chips: 20, base: 7, cacheBonus: 33, recycle: 4, signalGain: 1, cacheTier: 'cache', rarity: 'rare' }));
await waitForCommittedResult(compact);
await shot(compact, '02-ru-900-four-row-result');
await acceptResult(compact, 450, 568);
for (let index = 0; index < 12; index += 1) {
  await compact.waitForTimeout(65);
  await shot(compact, `03-ru-900-bank-${String(index).padStart(2, '0')}`);
}
await compact.waitForTimeout(1200);
await shot(compact, '04-ru-900-after-bank-idle');
await compactContext.close();

// 1024 EN: 1/2/3 row result geometry.
const midContext = await makeContext(1024, 'en-US');
const mid = await midContext.newPage();
attachDiagnostics(mid, 'en-1024');
await mid.goto('http://127.0.0.1:5173/?debug=1&platform=mock', { waitUntil: 'domcontentloaded' });
await waitReady(mid);
await hideDebug(mid);
for (const [rows, save] of [
  [1, customPendingSave({ chips: 100, base: 7 })],
  [2, customPendingSave({ chips: 100, base: 7, recycle: 4, rarity: 'rare' })],
  [3, customPendingSave({ chips: 100, base: 7, cacheBonus: 33, recycle: 4, rarity: 'rare' })],
]) {
  await setSaveAndReload(mid, save);
  await waitForCommittedResult(mid);
  await shot(mid, `05-en-1024-${rows}-row-result`);
}
await midContext.close();

// 1280 EN: real Charged debit flow, Signal banking, Hidden Pocket and selector regression.
const wideContext = await makeContext(1280, 'en-US');
const wide = await wideContext.newPage();
attachDiagnostics(wide, 'en-1280');
await wide.goto('http://127.0.0.1:5173/?debug=1&platform=mock', { waitUntil: 'domcontentloaded' });
await waitReady(wide);
await hideDebug(wide);

await setSaveAndReload(wide, baseSave({ chips: 100 }));
await humanTap(wide, 160, 305);
await wide.waitForTimeout(700);
await shot(wide, '06-en-1280-charged-selected');
const preTear = await readSave(wide);
assert(preTear?.chips === 100 && preTear?.pendingReveal === null, 'Charged selection does not debit before tear');

await wide.mouse.move(478, 170);
await wide.mouse.down();
for (const x of [525, 575, 625, 675, 725, 775, 825]) {
  await wide.mouse.move(x, 170, { steps: 2 });
  await wide.waitForTimeout(28);
}
await wide.mouse.up();
for (let index = 0; index < 12; index += 1) {
  await wide.waitForTimeout(55);
  await shot(wide, `07-en-1280-charged-spend-${String(index).padStart(2, '0')}`);
}
await waitForCommittedResult(wide);
const chargedCommit = await readSave(wide);
assert(chargedCommit?.totalOpens === 7 && chargedCommit?.chips < 100, 'real Charged tear debits and commits exactly one opening', chargedCommit ?? {});
await shot(wide, '08-en-1280-charged-result');

await setSaveAndReload(wide, baseSave({ chips: 100 }));
await humanTap(wide, 160, 305);
await wide.waitForTimeout(700);
await humanTap(wide, 160, 235);
await wide.waitForTimeout(700);
await shot(wide, '09-en-1280-basic-reselected');

await setSaveAndReload(wide, baseSave({ chips: 80, signal: 3 }));
await stageScenario(wide, 'Reach SIGNAL LOCK');
await waitForCommittedResult(wide);
await shot(wide, '10-en-1280-signal-lock-result');
await acceptResult(wide, 640, 568);
for (let index = 0; index < 8; index += 1) {
  await wide.waitForTimeout(80);
  await shot(wide, `11-en-1280-signal-bank-${String(index).padStart(2, '0')}`);
}

await setSaveAndReload(wide, baseSave({ chips: 80 }));
await stageScenario(wide, 'Force Hidden Pocket');
await waitForCommittedResult(wide);
await shot(wide, '12-en-1280-hidden-pocket-result');

const reservedAudioRequests = failedRequests.filter(({ url }) => /(?:ui-click|ui-skip|pouch-select|ui-denied|charged-spend|chip-clack)\.mp3/.test(url));
assert(reservedAudioRequests.length === 0, 'synth-only UI cues do not request absent MP3 files', { reservedAudioRequests });

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
