import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const PRODUCT_HEAD = 'a952f79c2b8cfb79d9f72245fbab36c9eaf0b831';
const SAVE_KEY = 'mystery-pocket-tech.save';
const outDir = '/tmp/idle-handoff-r1';
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

const customPendingSave = ({ chips = 20, base = 7, cacheBonus = 33, recycle = 4, signalGain = 1 } = {}) => {
  const familyId = 'camera';
  const rarity = recycle > 0 ? 'rare' : 'common';
  const collectibleId = `${familyId}-${rarity}`;
  const totalEarned = base + cacheBonus + recycle;
  const afterChips = chips + totalEarned;
  const discoveredStandard = recycle > 0 ? [collectibleId] : [];
  const nextDiscovered = recycle > 0 ? discoveredStandard : [collectibleId];
  const pending = {
    id: `idle-handoff-${Date.now()}`,
    baseTotalOpens: 6,
    pouchType: 'basic',
    lootPoolId: 'y2k-essentials',
    openingNumber: 7,
    standard: { collectibleId, familyId, rarity, isNew: recycle === 0 },
    chips: {
      before: chips,
      cost: 0,
      base,
      cacheTier: cacheBonus > 0 ? 'cache' : 'none',
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
const captureBurst = async (page, prefix, count, intervalMs) => {
  for (let index = 0; index < count; index += 1) {
    await page.waitForTimeout(intervalMs);
    await shot(page, `${prefix}-${String(index).padStart(2, '0')}`);
  }
};
const makeContext = (width, locale) => browser.newContext({
  viewport: { width, height: 720 },
  locale,
  recordVideo: { dir: outDir, size: { width, height: 720 } },
});

// Standard result -> banking -> idle at compact width.
const compactContext = await makeContext(900, 'ru-RU');
const compact = await compactContext.newPage();
attachDiagnostics(compact, 'ru-900-standard');
await compact.goto('http://127.0.0.1:5173/?debug=1&platform=mock', { waitUntil: 'domcontentloaded' });
await waitReady(compact);
await hideDebug(compact);
await setSaveAndReload(compact, customPendingSave());
await waitForCommittedResult(compact);
await shot(compact, '00-standard-result');
await acceptResult(compact, 450, 568);
await captureBurst(compact, '01-standard-handoff', 24, 55);
await compact.waitForTimeout(450);
await shot(compact, '02-standard-idle');
const standardSave = await readSave(compact);
assert(standardSave?.pendingReveal === null && standardSave?.totalOpens === 7, 'standard banking preserves committed save', standardSave ?? {});
await compactContext.close();

// Hidden Pocket carousel result -> banking -> idle at wide width.
const wideContext = await makeContext(1280, 'en-US');
const wide = await wideContext.newPage();
attachDiagnostics(wide, 'en-1280-hidden');
await wide.goto('http://127.0.0.1:5173/?debug=1&platform=mock', { waitUntil: 'domcontentloaded' });
await waitReady(wide);
await hideDebug(wide);
await setSaveAndReload(wide, baseSave({ chips: 80 }));
await stageScenario(wide, 'Force Hidden Pocket');
await waitForCommittedResult(wide);
await shot(wide, '10-hidden-result');
await acceptResult(wide, 640, 568);
await captureBurst(wide, '11-hidden-handoff', 24, 55);
await wide.waitForTimeout(450);
await shot(wide, '12-hidden-idle');
const hiddenSave = await readSave(wide);
assert(hiddenSave?.pendingReveal === null && hiddenSave?.totalOpens === 7, 'hidden banking preserves committed save', hiddenSave ?? {});
await wideContext.close();

await fs.writeFile(`${outDir}/report.json`, JSON.stringify({
  auditedProductHead: PRODUCT_HEAD,
  auditHead: process.env.GITHUB_SHA ?? null,
  errors,
  failedRequests,
  assertions,
}, null, 2));

await browser.close();
if (errors.length || failedRequests.length || assertions.some(({ pass }) => !pass)) process.exitCode = 1;
