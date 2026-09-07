import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const PRODUCT_HEAD = 'ac6ab29cb3bdd521a2fcabf723290816947e4b85';
const SAVE_KEY = 'mystery-pocket-tech.save';
const outDir = '/tmp/final-independent-acceptance-r2';
fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

const assertions = [];
const errors = [];
const failedRequests = [];
const badResponses = [];
const syntheticAssetRequests = [];

const assert = (name, pass, observed) => {
  assertions.push({ name, pass: Boolean(pass), observed });
};

const baseSave = ({
  chips = 120,
  signal = 0,
  totalOpens = 3,
  discoveredStandard = [],
  discoveredSecrets = [],
  duplicates = 0,
  hiddenPockets = 0,
} = {}) => ({
  version: 2,
  discoveredStandard,
  discoveredSecrets,
  chips,
  signal,
  activeLootPoolId: 'y2k-essentials',
  totalOpens,
  pendingReveal: null,
  muted: false,
  stats: { duplicates, hiddenPockets },
});

const waitGame = async page => {
  await page.locator('canvas').waitFor({ state: 'visible', timeout: 15000 });
  await page.waitForTimeout(450);
};

const hideDebug = async page => {
  const panel = page.locator('.mpt-debug-panel');
  if (await panel.count()) {
    await panel.evaluate(el => { el.style.display = 'none'; });
  }
};

const shot = async (page, name) => {
  await page.screenshot({ path: path.join(outDir, `${name}.png`) });
};

const tap = async (page, x, y, hold = 45) => {
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.waitForTimeout(hold);
  await page.mouse.up();
};

const readSave = page => page.evaluate(key => {
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : null;
}, SAVE_KEY);

const setSave = async (page, value) => {
  await page.evaluate(({ key, value }) => localStorage.setItem(key, JSON.stringify(value)), { key: SAVE_KEY, value });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await waitGame(page);
  await hideDebug(page);
};

const wireDiagnostics = (page, tag) => {
  page.on('pageerror', error => errors.push({ tag, kind: 'pageerror', message: error.message }));
  page.on('console', message => {
    if (message.type() === 'error') errors.push({ tag, kind: 'console-error', message: message.text() });
  });
  page.on('requestfailed', request => {
    failedRequests.push({ tag, url: request.url(), failure: request.failure()?.errorText ?? 'unknown' });
  });
  page.on('response', response => {
    if (response.status() >= 400) badResponses.push({ tag, status: response.status(), url: response.url() });
    if (/chip-clack\.mp3|pouch-grab\.mp3/i.test(response.url())) syntheticAssetRequests.push(response.url());
  });
};

const realTear = async (page, width, beforeOpens) => {
  const candidates = [
    { dx: 0, dy: 0 },
    { dx: 0, dy: 8 },
    { dx: -7, dy: 2 },
    { dx: 7, dy: 2 },
  ];
  for (let attempt = 0; attempt < candidates.length; attempt += 1) {
    const { dx, dy } = candidates[attempt];
    const startX = width / 2 - 158 + dx;
    const startY = 177 + dy;
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.waitForTimeout(65);
    for (let step = 1; step <= 14; step += 1) {
      await page.mouse.move(startX + (312 * step) / 14, startY, { steps: 1 });
      await page.waitForTimeout(15);
    }
    await page.mouse.up();
    await page.waitForTimeout(250);
    const state = await readSave(page);
    if (state?.pendingReveal?.openingNumber === beforeOpens + 1 || state?.totalOpens === beforeOpens + 1) {
      return attempt + 1;
    }
  }
  return 0;
};

const waitPending = async (page, beforeOpens) => {
  await page.waitForFunction(
    ({ key, before }) => {
      const raw = localStorage.getItem(key);
      if (!raw) return false;
      const state = JSON.parse(raw);
      return state.totalOpens === before && state.pendingReveal?.openingNumber === before + 1;
    },
    { key: SAVE_KEY, before: beforeOpens },
    { timeout: 12000 },
  );
  return readSave(page);
};

const waitCommitted = async (page, expectedTotalOpens) => {
  await page.waitForFunction(
    ({ key, expected }) => {
      const raw = localStorage.getItem(key);
      if (!raw) return false;
      const state = JSON.parse(raw);
      return state.totalOpens === expected && state.pendingReveal === null;
    },
    { key: SAVE_KEY, expected: expectedTotalOpens },
    { timeout: 15000 },
  );
  return readSave(page);
};

const collectAndSettle = async (page, width) => {
  await page.waitForTimeout(850);
  await tap(page, width / 2, 585, 55);
  await page.waitForTimeout(1900);
};

const browser = await chromium.launch({ channel: 'chrome', headless: true });
let fatal = null;

try {
  // A. Real Hidden Pocket path at compact width. Math.random is deterministic,
  // but the pouch interaction and presentation path are production behavior.
  {
    const width = 900;
    const ctx = await browser.newContext({
      viewport: { width, height: 720 },
      locale: 'ru-RU',
      recordVideo: { dir: outDir, size: { width, height: 720 } },
    });
    await ctx.addInitScript(value => { Math.random = () => value; }, 0.001);
    const page = await ctx.newPage();
    wireDiagnostics(page, 'hidden-pocket-real');
    await page.goto('http://127.0.0.1:5173/?debug=1&platform=mock', { waitUntil: 'domcontentloaded' });
    await waitGame(page);
    await setSave(page, baseSave({ chips: 120, signal: 0, totalOpens: 3 }));
    await shot(page, '10-hidden-idle-before');

    const before = await readSave(page);
    const attempts = await realTear(page, width, before.totalOpens);
    assert('hidden-star-acquired', attempts > 0, attempts);
    if (!attempts) throw new Error('hidden-pocket: star acquisition failed');
    const pendingState = await waitPending(page, before.totalOpens);
    const pending = pendingState.pendingReveal;
    assert('hidden-real-pending-present', Boolean(pending?.hiddenPocket), pending?.hiddenPocket ?? null);
    assert('hidden-real-standard-common', pending?.standard?.rarity === 'common', pending?.standard ?? null);
    assert('hidden-real-secret-camera', pending?.hiddenPocket?.collectibleId === 'camera-secret-cosmic', pending?.hiddenPocket ?? null);
    await shot(page, '11-hidden-real-tear');
    await page.waitForTimeout(1100);
    await shot(page, '12-hidden-real-mid-reveal');

    const committed = await waitCommitted(page, before.totalOpens + 1);
    assert('hidden-committed-once', committed?.totalOpens === 4 && committed?.pendingReveal === null, committed);
    assert('hidden-secret-persisted', committed?.discoveredSecrets?.includes('camera-secret-cosmic') === true, committed?.discoveredSecrets);
    assert('hidden-stat-incremented', committed?.stats?.hiddenPockets === 1, committed?.stats);
    await page.waitForTimeout(900);
    await shot(page, '13-hidden-result-carousel');
    await collectAndSettle(page, width);
    await shot(page, '14-hidden-idle-after-banking');
    const after = await readSave(page);
    assert('hidden-banking-no-save-mutation', JSON.stringify(after) === JSON.stringify(committed), { committed, after });
    await ctx.close();
  }

  // B. Natural duplicate -> 4/4 LOCK, then the next eligible new item consumes it.
  {
    const width = 1280;
    const ctx = await browser.newContext({
      viewport: { width, height: 720 },
      locale: 'en-US',
      recordVideo: { dir: outDir, size: { width, height: 720 } },
    });
    await ctx.addInitScript(value => { Math.random = () => value; }, 0.1);
    const page = await ctx.newPage();
    wireDiagnostics(page, 'signal-reach-consume');
    await page.goto('http://127.0.0.1:5173/?debug=1&platform=mock', { waitUntil: 'domcontentloaded' });
    await waitGame(page);
    await setSave(page, baseSave({
      chips: 100,
      signal: 3,
      totalOpens: 10,
      discoveredStandard: ['camera-common'],
      duplicates: 1,
    }));
    await shot(page, '20-signal-3-of-4-before');

    let before = await readSave(page);
    let attempts = await realTear(page, width, before.totalOpens);
    assert('signal-reach-star-acquired', attempts > 0, attempts);
    if (!attempts) throw new Error('signal-reach: star acquisition failed');
    let pendingState = await waitPending(page, before.totalOpens);
    let pending = pendingState.pendingReveal;
    assert('signal-lock-reached-flag', pending?.signal?.lockReached === true && pending?.signal?.after === 4, pending?.signal ?? null);
    assert('signal-lock-reached-by-duplicate', pending?.standard?.isNew === false, pending?.standard ?? null);
    await waitCommitted(page, before.totalOpens + 1);
    await page.waitForTimeout(900);
    await shot(page, '21-signal-lock-reached-result');
    await collectAndSettle(page, width);
    await shot(page, '22-signal-lock-4-of-4-idle');
    let stable = await readSave(page);
    assert('signal-lock-persists-at-idle', stable?.signal === 4, stable?.signal);

    before = stable;
    attempts = await realTear(page, width, before.totalOpens);
    assert('signal-consume-star-acquired', attempts > 0, attempts);
    if (!attempts) throw new Error('signal-consume: star acquisition failed');
    pendingState = await waitPending(page, before.totalOpens);
    pending = pendingState.pendingReveal;
    assert('signal-lock-consumed-flag', pending?.signal?.lockConsumed === true && pending?.signal?.after === 0, pending?.signal ?? null);
    assert('signal-lock-produces-new-item', pending?.standard?.isNew === true, pending?.standard ?? null);
    await waitCommitted(page, before.totalOpens + 1);
    await page.waitForTimeout(900);
    await shot(page, '23-signal-lock-consumed-result');
    await collectAndSettle(page, width);
    await shot(page, '24-signal-after-consume-idle');
    stable = await readSave(page);
    assert('signal-after-consume-zero', stable?.signal === 0, stable?.signal);
    await ctx.close();
  }

  // C. LOCK has no Basic-eligible new item: it must stay armed, then Charged
  // consumes it on one of the two remaining Legendaries.
  {
    const width = 1280;
    const ctx = await browser.newContext({
      viewport: { width, height: 720 },
      locale: 'ru-RU',
      recordVideo: { dir: outDir, size: { width, height: 720 } },
    });
    await ctx.addInitScript(value => { Math.random = () => value; }, 0.1);
    const page = await ctx.newPage();
    wireDiagnostics(page, 'signal-waits-charged');
    await page.goto('http://127.0.0.1:5173/?debug=1&platform=mock', { waitUntil: 'domcontentloaded' });
    await waitGame(page);
    const nonLegendary = [
      'camera-common', 'camera-rare', 'camera-epic',
      'flip-phone-common', 'flip-phone-rare', 'flip-phone-epic',
    ];
    await setSave(page, baseSave({
      chips: 120,
      signal: 4,
      totalOpens: 20,
      discoveredStandard: nonLegendary,
      duplicates: 8,
    }));
    await shot(page, '30-lock-waiting-basic-idle');

    let before = await readSave(page);
    let attempts = await realTear(page, width, before.totalOpens);
    assert('lock-wait-basic-star-acquired', attempts > 0, attempts);
    if (!attempts) throw new Error('lock-wait-basic: star acquisition failed');
    let pendingState = await waitPending(page, before.totalOpens);
    let pending = pendingState.pendingReveal;
    assert('lock-retained-on-basic', pending?.signal?.lockRetained === true && pending?.signal?.after === 4, pending?.signal ?? null);
    assert('lock-basic-remains-duplicate', pending?.standard?.isNew === false, pending?.standard ?? null);
    await waitCommitted(page, before.totalOpens + 1);
    await page.waitForTimeout(900);
    await shot(page, '31-lock-retained-basic-result');
    await collectAndSettle(page, width);
    await shot(page, '32-lock-retained-idle');
    let stable = await readSave(page);
    assert('lock-still-four-before-charged', stable?.signal === 4, stable?.signal);

    await tap(page, 144, 309, 50);
    await page.waitForTimeout(220);
    await shot(page, '33-lock-charged-selected');
    before = await readSave(page);
    attempts = await realTear(page, width, before.totalOpens);
    assert('lock-charged-star-acquired', attempts > 0, attempts);
    if (!attempts) throw new Error('lock-charged: star acquisition failed');
    pendingState = await waitPending(page, before.totalOpens);
    pending = pendingState.pendingReveal;
    assert('lock-charged-pouch-type', pending?.pouchType === 'charged', pending?.pouchType ?? null);
    assert('lock-charged-consumes-lock', pending?.signal?.lockConsumed === true && pending?.signal?.after === 0, pending?.signal ?? null);
    assert('lock-charged-yields-legendary-new', pending?.standard?.rarity === 'legendary' && pending?.standard?.isNew === true, pending?.standard ?? null);
    await shot(page, '34-lock-charged-real-tear');
    const committed = await waitCommitted(page, before.totalOpens + 1);
    await page.waitForTimeout(900);
    await shot(page, '35-lock-charged-legendary-result');
    await collectAndSettle(page, width);
    await shot(page, '36-lock-charged-final-idle');
    stable = await readSave(page);
    assert('lock-charged-final-signal-zero', stable?.signal === 0, stable?.signal);
    assert('lock-charged-one-new-standard', stable?.discoveredStandard?.length === 7, stable?.discoveredStandard);
    assert('lock-charged-save-stable-after-banking', stable?.totalOpens === committed?.totalOpens && stable?.chips === committed?.chips, { committed, stable });
    await ctx.close();
  }
} catch (error) {
  fatal = error;
  errors.push({ tag: 'harness', kind: 'fatal', message: error instanceof Error ? error.stack ?? error.message : String(error) });
} finally {
  await browser.close();
  const report = {
    auditedProductHead: PRODUCT_HEAD,
    assertions,
    errors,
    failedRequests,
    badResponses,
    syntheticAssetRequests,
  };
  fs.writeFileSync(path.join(outDir, 'report.json'), JSON.stringify(report, null, 2));
  const failedAssertions = assertions.filter(entry => !entry.pass);
  console.log(JSON.stringify({
    auditedProductHead: PRODUCT_HEAD,
    assertions: assertions.length,
    failedAssertions: failedAssertions.map(entry => entry.name),
    errors: errors.length,
    failedRequests: failedRequests.length,
    badResponses: badResponses.length,
    syntheticAssetRequests: syntheticAssetRequests.length,
  }, null, 2));
  if (fatal || failedAssertions.length > 0 || errors.length > 0 || failedRequests.length > 0 || badResponses.length > 0 || syntheticAssetRequests.length > 0) {
    process.exitCode = 1;
  }
}
