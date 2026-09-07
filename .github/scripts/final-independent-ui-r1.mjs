import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const PRODUCT_HEAD = '96b4f62481a499a94b2afb10dbab3fb82b9d1da2';
const SAVE_KEY = 'mystery-pocket-tech.save';
const outDir = '/tmp/final-independent-ui-r1';
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
  totalOpens: 0,
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
  signalBefore = 0,
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
  const signalAfter = Math.min(4, signalBefore + signalGain);
  const pending = {
    id: `independent-${Date.now()}-${base}-${cacheBonus}-${recycle}-${signalGain}`,
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
      before: signalBefore,
      after: signalAfter,
      gain: signalGain,
      lockArmedBefore: signalBefore >= 4,
      lockConsumed: false,
      lockReached: signalAfter >= 4 && signalBefore < 4,
      lockRetained: signalAfter >= 4,
    },
    hiddenPocket: null,
    commit: {
      discoveredStandard: nextDiscovered,
      discoveredSecrets: [],
      chips: afterChips,
      signal: signalAfter,
      activeLootPoolId: 'y2k-essentials',
      totalOpens: 7,
      stats: { duplicates: recycle > 0 ? 1 : 0, hiddenPockets: 0 },
    },
  };
  return baseSave({
    discoveredStandard,
    chips,
    signal: signalBefore,
    totalOpens: 6,
    pendingReveal: pending,
  });
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
const humanTap = async (page, x, y) => {
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.waitForTimeout(70);
  await page.mouse.up();
};
const setSaveAndReload = async (page, save) => {
  await page.evaluate(({ key, value }) => localStorage.setItem(key, JSON.stringify(value)), { key: SAVE_KEY, value: save });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await waitReady(page);
  await hideDebug(page);
};
const debugAndReload = async (page, buttonName) => {
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
  await page.waitForTimeout(300);
};
const acceptResult = async (page, x, y) => {
  await humanTap(page, x, y);
  await page.waitForTimeout(130);
  await humanTap(page, x, y);
};
const makeContext = (width, height, locale) => browser.newContext({
  viewport: { width, height },
  locale,
  recordVideo: { dir: outDir, size: { width, height } },
});

// Compact RU blind spots: first-open idle, dense mature idle, unavailable feedback, resize during result/banking.
const compactContext = await makeContext(800, 720, 'ru-RU');
const compact = await compactContext.newPage();
attachDiagnostics(compact, 'ru-800');
await compact.goto('http://127.0.0.1:5173/?debug=1&platform=mock', { waitUntil: 'domcontentloaded' });
await waitReady(compact);
await hideDebug(compact);

await setSaveAndReload(compact, baseSave());
await shot(compact, '00-ru-800-first-open-idle');

await setSaveAndReload(compact, baseSave({
  chips: 999999,
  signal: 4,
  totalOpens: 24,
  discoveredStandard: ['camera-common','camera-rare','camera-epic','camera-legendary','flip-phone-common','flip-phone-rare','flip-phone-epic','flip-phone-legendary'],
}));
await shot(compact, '01-ru-800-mature-idle-six-digit-lock');

await setSaveAndReload(compact, baseSave({ chips: 20, totalOpens: 12 }));
await shot(compact, '02-ru-800-idle-charged-unavailable');
await humanTap(compact, 130, 306);
await compact.waitForTimeout(130);
await shot(compact, '03-ru-800-unavailable-feedback');

await compact.setViewportSize({ width: 1280, height: 720 });
await compact.waitForTimeout(360);
await shot(compact, '04-ru-resize-idle-1280');
await compact.setViewportSize({ width: 800, height: 720 });
await compact.waitForTimeout(360);
await shot(compact, '05-ru-resize-idle-back-800');

await setSaveAndReload(compact, customPendingSave({ chips: 100, base: 7, cacheBonus: 33, recycle: 4, signalBefore: 3, signalGain: 1, rarity: 'rare' }));
await waitForCommittedResult(compact);
await shot(compact, '06-ru-800-four-row-signal-result');
await compact.setViewportSize({ width: 1280, height: 720 });
await compact.waitForTimeout(360);
await shot(compact, '07-ru-result-resized-1280');
await acceptResult(compact, 640, 568);
await compact.waitForTimeout(180);
await compact.setViewportSize({ width: 800, height: 720 });
for (let index = 0; index < 12; index += 1) {
  await compact.waitForTimeout(85);
  await shot(compact, `08-ru-resize-during-bank-${String(index).padStart(2, '0')}`);
}
await compact.waitForTimeout(900);
await shot(compact, '09-ru-after-resized-bank-idle');

// Collection was barely audited previously: seed everything, inspect shelf/library compact and wide.
await debugAndReload(compact, 'Seed all 8/8 + 2/2');
await humanTap(compact, 735, 690);
await compact.waitForTimeout(520);
await shot(compact, '10-ru-800-collection-shelf-full');
await humanTap(compact, 478, 128);
await compact.waitForTimeout(320);
await shot(compact, '11-ru-800-collection-library-full');
await compact.setViewportSize({ width: 1280, height: 720 });
await compact.waitForTimeout(360);
await shot(compact, '12-ru-1280-collection-library-resized');
await humanTap(compact, 562, 128);
await compact.waitForTimeout(320);
await shot(compact, '13-ru-1280-collection-shelf-resized');

// Orientation blocker and recovery.
await compact.setViewportSize({ width: 720, height: 900 });
await compact.waitForTimeout(250);
const portraitVisible = await compact.locator('#orientation-gate').getAttribute('data-visible');
assert(portraitVisible === 'true', 'portrait orientation gate is visible', { portraitVisible });
await shot(compact, '14-ru-portrait-orientation-gate');
await compact.setViewportSize({ width: 800, height: 720 });
await compact.waitForFunction(() => document.querySelector('#orientation-gate')?.getAttribute('data-visible') !== 'true');
await compact.waitForTimeout(380);
await shot(compact, '15-ru-landscape-recovered-from-orientation');
await compactContext.close();

// Wide EN blind spots: Hidden Pocket carousel interaction, result resize, SIGNAL waiting state.
const wideContext = await makeContext(1280, 720, 'en-US');
const wide = await wideContext.newPage();
attachDiagnostics(wide, 'en-1280');
await wide.goto('http://127.0.0.1:5173/?debug=1&platform=mock', { waitUntil: 'domcontentloaded' });
await waitReady(wide);
await hideDebug(wide);

await setSaveAndReload(wide, baseSave({ chips: 120, totalOpens: 6 }));
await debugAndReload(wide, 'Force Hidden Pocket');
await waitForCommittedResult(wide);
await shot(wide, '20-en-1280-hidden-default');

await wide.mouse.move(760, 350);
await wide.mouse.down();
await wide.mouse.move(520, 350, { steps: 8 });
await wide.mouse.up();
await wide.waitForTimeout(360);
await shot(wide, '21-en-1280-hidden-after-left-swipe');

await wide.mouse.move(520, 350);
await wide.mouse.down();
await wide.mouse.move(790, 350, { steps: 8 });
await wide.mouse.up();
await wide.waitForTimeout(360);
await shot(wide, '22-en-1280-hidden-after-right-swipe');

await wide.setViewportSize({ width: 900, height: 720 });
await wide.waitForTimeout(380);
await shot(wide, '23-en-900-hidden-result-after-resize');
await wide.setViewportSize({ width: 1280, height: 720 });
await wide.waitForTimeout(320);

await setSaveAndReload(wide, baseSave({ chips: 80, totalOpens: 12 }));
await debugAndReload(wide, 'SIGNAL LOCK waiting for Charged');
await waitForCommittedResult(wide);
await shot(wide, '24-en-1280-signal-waiting-result');
await acceptResult(wide, 640, 568);
for (let index = 0; index < 10; index += 1) {
  await wide.waitForTimeout(90);
  await shot(wide, `25-en-signal-wait-bank-${String(index).padStart(2, '0')}`);
}
await wide.waitForTimeout(850);
await shot(wide, '26-en-1280-signal-waiting-idle');

await setSaveAndReload(wide, baseSave({ chips: 100, totalOpens: 12 }));
await humanTap(wide, 160, 305);
await wide.waitForTimeout(700);
await shot(wide, '27-en-1280-charged-selected-long-look');
await wide.setViewportSize({ width: 800, height: 720 });
await wide.waitForTimeout(380);
await shot(wide, '28-en-800-charged-selected-after-resize');

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
