import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const PRODUCT_HEAD = '1d450bffe083954c45208071753db03484a661c5';
const SAVE_KEY = 'mystery-pocket-tech.save';
const outDir = '/tmp/phase26-final-r2';
const assertions = [];
const errors = [];
const failedRequests = [];
const badResponses = [];
const syntheticAssetRequests = [];

const allStandard = [
  'camera-common', 'camera-rare', 'camera-epic', 'camera-legendary',
  'flip-phone-common', 'flip-phone-rare', 'flip-phone-epic', 'flip-phone-legendary',
];

await fs.rm(outDir, { recursive: true, force: true });
await fs.mkdir(outDir, { recursive: true });

const baseSave = (overrides = {}) => ({
  version: 3,
  discoveredStandard: [],
  discoveredSecrets: [],
  chips: 0,
  signal: 0,
  overchargeHundredths: 100,
  activeLootPoolId: 'y2k-essentials',
  totalOpens: 3,
  pendingReveal: null,
  muted: false,
  stats: { duplicates: 0, hiddenPockets: 0 },
  ...overrides,
});

const assert = (name, pass, observed) => assertions.push({ name, pass: Boolean(pass), observed });
const shot = (page, name) => page.screenshot({ path: path.join(outDir, `${name}.png`) });
const readSave = page => page.evaluate(key => {
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : null;
}, SAVE_KEY);

const wireDiagnostics = (page, tag) => {
  page.on('pageerror', error => errors.push({ tag, kind: 'pageerror', message: error.message }));
  page.on('console', message => {
    if (message.type() === 'error') errors.push({ tag, kind: 'console-error', message: message.text() });
  });
  page.on('requestfailed', request => failedRequests.push({ tag, url: request.url(), failure: request.failure()?.errorText ?? 'unknown' }));
  page.on('response', response => {
    if (response.status() >= 400) badResponses.push({ tag, status: response.status(), url: response.url() });
    if (/pouch-grab\.mp3|chip-clack\.mp3/i.test(response.url())) syntheticAssetRequests.push({ tag, url: response.url() });
  });
};

const waitGame = async page => {
  await page.locator('#game canvas').waitFor({ state: 'visible', timeout: 20000 });
  await page.waitForFunction(() => document.querySelector('#orientation-gate')?.getAttribute('data-visible') !== 'true');
  await page.waitForTimeout(420);
};
const hideDebug = async page => page.evaluate(() => {
  const panel = document.querySelector('.mpt-debug-panel');
  if (panel) panel.style.display = 'none';
});
const showDebug = async page => page.evaluate(() => {
  const panel = document.querySelector('.mpt-debug-panel');
  if (panel) panel.style.display = '';
});
const setSave = async (page, value) => {
  await page.evaluate(({ key, value }) => localStorage.setItem(key, JSON.stringify(value)), { key: SAVE_KEY, value });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await waitGame(page);
  await hideDebug(page);
};
const tap = async (page, x, y, hold = 38) => {
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.waitForTimeout(hold);
  await page.mouse.up();
};

const layout = width => {
  const logicalWidth = Math.min(1728, Math.max(900, width));
  const offsetX = (width - logicalWidth) / 2;
  const horizontalMargin = Math.min(64, Math.max(28, logicalWidth * 0.04));
  const safeViewportLeft = Math.max(0, -offsetX) + 16;
  const safeLeft = Math.max(horizontalMargin, safeViewportLeft);
  return { logicalWidth, offsetX, safeLeft };
};
const chargedCenterX = width => {
  const m = layout(width);
  return m.offsetX + m.safeLeft + 108;
};

const installRewardSequence = async (page, values, fallback = 0.99) => {
  await page.evaluate(({ values, fallback }) => {
    const w = window;
    if (w.__mptRestoreRewardRandom) w.__mptRestoreRewardRandom();
    const original = Math.random;
    let index = 0;
    let intercepted = 0;
    Math.random = () => {
      const stack = new Error().stack ?? '';
      if (stack.includes('/src/game/systems/random.ts')) {
        const value = values[index++] ?? fallback;
        intercepted += 1;
        w.__mptRewardRandomCalls = intercepted;
        return value;
      }
      return original();
    };
    w.__mptRewardRandomCalls = 0;
    w.__mptRestoreRewardRandom = () => {
      Math.random = original;
      delete w.__mptRestoreRewardRandom;
    };
  }, { values, fallback });
};
const restoreRewardRandom = page => page.evaluate(() => {
  const w = window;
  const calls = w.__mptRewardRandomCalls ?? 0;
  if (w.__mptRestoreRewardRandom) w.__mptRestoreRewardRandom();
  return calls;
});

const realTear = async (page, width, beforeOpens) => {
  const candidates = [{ dx: 0, dy: 0 }, { dx: 0, dy: 8 }, { dx: -7, dy: 2 }, { dx: 7, dy: 2 }];
  for (let attempt = 0; attempt < candidates.length; attempt += 1) {
    const { dx, dy } = candidates[attempt];
    const startX = width / 2 - 158 + dx;
    const startY = 177 + dy;
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.waitForTimeout(55);
    for (let step = 1; step <= 14; step += 1) {
      await page.mouse.move(startX + (312 * step) / 14, startY, { steps: 1 });
      await page.waitForTimeout(13);
    }
    await page.mouse.up();
    await page.waitForTimeout(180);
    const state = await readSave(page);
    if (state?.pendingReveal?.openingNumber === beforeOpens + 1 || state?.totalOpens === beforeOpens + 1) return attempt + 1;
  }
  return 0;
};
const waitPending = async (page, beforeOpens) => {
  await page.waitForFunction(({ key, before }) => {
    const raw = localStorage.getItem(key);
    if (!raw) return false;
    const state = JSON.parse(raw);
    return state.totalOpens === before && state.pendingReveal?.openingNumber === before + 1;
  }, { key: SAVE_KEY, before: beforeOpens }, { timeout: 10000 });
  return readSave(page);
};
const waitCommitted = async (page, totalOpens) => {
  await page.waitForFunction(({ key, totalOpens }) => {
    const raw = localStorage.getItem(key);
    if (!raw) return false;
    const state = JSON.parse(raw);
    return state.totalOpens === totalOpens && state.pendingReveal === null;
  }, { key: SAVE_KEY, totalOpens }, { timeout: 15000 });
  return readSave(page);
};
const collectAndIdle = async (page, width) => {
  await page.waitForTimeout(1150);
  for (let i = 0; i < 4; i += 1) {
    await tap(page, width / 2, 585, 38);
    await page.waitForTimeout(180);
  }
  await page.waitForTimeout(1500);
};
const stageDebug = async (page, label) => {
  await showDebug(page);
  const nav = page.waitForEvent('framenavigated', { timeout: 10000 });
  await page.getByRole('button', { name: label, exact: true }).click();
  await nav;
  await waitGame(page);
  await hideDebug(page);
  await page.waitForFunction(key => {
    const raw = localStorage.getItem(key);
    return raw && JSON.parse(raw).pendingReveal === null;
  }, SAVE_KEY, { timeout: 15000 });
  await page.waitForTimeout(1120);
};

const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] });
let fatal = null;

try {
  // A. Visual matrix: all rarity treatments at all supported widths in both languages.
  const visualScenarios = [
    ['common', 'Force Common'],
    ['rare', 'Force Rare'],
    ['epic', 'Force Epic'],
    ['legendary', 'Force Legendary (Charged)'],
    ['secret', 'Force Hidden Pocket'],
  ];
  for (const locale of ['en-US', 'ru-RU']) {
    const lang = locale.startsWith('ru') ? 'ru' : 'en';
    for (const width of [800, 900, 1280]) {
      const ctx = await browser.newContext({ viewport: { width, height: 720 }, locale });
      const page = await ctx.newPage();
      wireDiagnostics(page, `visual-${lang}-${width}`);
      await page.goto('http://127.0.0.1:5173/?debug=1&platform=mock', { waitUntil: 'domcontentloaded' });
      await waitGame(page);
      await setSave(page, baseSave({ chips: 180 }));
      for (const [slug, label] of visualScenarios) {
        await stageDebug(page, label);
        await shot(page, `visual-${lang}-${width}-${slug}`);
        await collectAndIdle(page, width);
      }
      assert(`visual-matrix-${lang}-${width}`, true, visualScenarios.map(([slug]) => slug));
      await ctx.close();
    }
  }

  // B. 24 rapid unaffordable Charged taps must not drift or mutate economy.
  {
    const width = 900;
    const ctx = await browser.newContext({ viewport: { width, height: 720 }, locale: 'en-US', recordVideo: { dir: outDir, size: { width, height: 720 } } });
    const page = await ctx.newPage();
    wireDiagnostics(page, 'denial');
    await page.goto('http://127.0.0.1:5173/?debug=1&platform=mock', { waitUntil: 'domcontentloaded' });
    await waitGame(page);
    await setSave(page, baseSave({ chips: 59, totalOpens: 12 }));
    await shot(page, 'denial-00-before');
    const x = chargedCenterX(width);
    for (let i = 0; i < 24; i += 1) {
      await tap(page, x, 309, 12);
      await page.waitForTimeout(18);
    }
    await shot(page, 'denial-01-burst-end');
    await page.waitForTimeout(520);
    await shot(page, 'denial-02-settled');
    const after = await readSave(page);
    assert('denial-24-no-save-mutation', after?.chips === 59 && after?.totalOpens === 12 && after?.pendingReveal === null, after);
    await ctx.close();
  }

  // C. 3/4 -> 4/4: lock reaches but does not gain Overcharge on the same opening.
  {
    const width = 900;
    const ctx = await browser.newContext({ viewport: { width, height: 720 }, locale: 'ru-RU', recordVideo: { dir: outDir, size: { width, height: 720 } } });
    const page = await ctx.newPage();
    wireDiagnostics(page, 'lock-reached');
    await page.goto('http://127.0.0.1:5173/?debug=1&platform=mock', { waitUntil: 'domcontentloaded' });
    await waitGame(page);
    const initial = baseSave({ chips: 120, signal: 3, discoveredStandard: ['camera-common'], totalOpens: 8 });
    await setSave(page, initial);
    await installRewardSequence(page, [0.1, 0.1, 0, 0, 0.99]);
    const attempts = await realTear(page, width, initial.totalOpens);
    assert('lock-reached-star-acquired', attempts > 0, attempts);
    const staged = await waitPending(page, initial.totalOpens);
    const pending = staged.pendingReveal;
    const calls = await restoreRewardRandom(page);
    assert('lock-reached-rng-used', calls >= 5, calls);
    assert('lock-reached-transition', pending?.signal?.before === 3 && pending?.signal?.after === 4 && pending?.signal?.lockReached === true, pending?.signal);
    assert('lock-reached-no-same-open-overcharge', pending?.overcharge?.beforeHundredths === 100 && pending?.overcharge?.afterHundredths === 100 && pending?.overcharge?.appliedGainHundredths === 0, pending?.overcharge);
    await waitCommitted(page, initial.totalOpens + 1);
    await page.waitForTimeout(250);
    await shot(page, 'signal-3-to-4-result');
    await ctx.close();
  }

  // D. Complete Drop retained Basic lock: current x1.20 applies, then +0.10 for next opening.
  {
    const width = 1280;
    const ctx = await browser.newContext({ viewport: { width, height: 720 }, locale: 'en-US', recordVideo: { dir: outDir, size: { width, height: 720 } } });
    const page = await ctx.newPage();
    wireDiagnostics(page, 'retained-basic');
    await page.goto('http://127.0.0.1:5173/?debug=1&platform=mock', { waitUntil: 'domcontentloaded' });
    await waitGame(page);
    const initial = baseSave({ chips: 200, signal: 4, overchargeHundredths: 120, discoveredStandard: allStandard, totalOpens: 20 });
    await setSave(page, initial);
    await installRewardSequence(page, [0.1, 0.1, 0, 0, 0.99]);
    const attempts = await realTear(page, width, initial.totalOpens);
    assert('retained-basic-star-acquired', attempts > 0, attempts);
    const staged = await waitPending(page, initial.totalOpens);
    const pending = staged.pendingReveal;
    await restoreRewardRandom(page);
    assert('retained-basic-lock-retained', pending?.signal?.lockRetained === true && pending?.signal?.after === 4, pending?.signal);
    assert('retained-basic-current-multiplier-applied', pending?.overcharge?.beforeHundredths === 120 && pending?.chips?.overchargeBonus === Math.round(pending?.chips?.rawEarned * 0.2), pending?.chips);
    assert('retained-basic-next-gain-10', pending?.overcharge?.appliedGainHundredths === 10 && pending?.overcharge?.afterHundredths === 130, pending?.overcharge);
    const committed = await waitCommitted(page, initial.totalOpens + 1);
    assert('retained-basic-committed-130', committed?.signal === 4 && committed?.overchargeHundredths === 130, committed);
    await page.waitForTimeout(280);
    await shot(page, 'overcharge-basic-retained-result');
    await collectAndIdle(page, width);
    await shot(page, 'overcharge-basic-retained-idle-130');
    await ctx.close();
  }

  // E. Charged near-cap + max-density tray: x1.40 uses current multiplier, actual +0.10 -> MAX.
  {
    const width = 900;
    const ctx = await browser.newContext({ viewport: { width, height: 720 }, locale: 'ru-RU', recordVideo: { dir: outDir, size: { width, height: 720 } } });
    const page = await ctx.newPage();
    wireDiagnostics(page, 'near-cap');
    await page.goto('http://127.0.0.1:5173/?debug=1&platform=mock', { waitUntil: 'domcontentloaded' });
    await waitGame(page);
    const initial = baseSave({ chips: 500, signal: 4, overchargeHundredths: 140, discoveredStandard: allStandard, totalOpens: 30 });
    await setSave(page, initial);
    await tap(page, chargedCenterX(width), 309, 45);
    await page.waitForTimeout(140);
    await installRewardSequence(page, [0.1, 0.99, 0, 0.995, 0.99, 0.99]);
    const attempts = await realTear(page, width, initial.totalOpens);
    assert('near-cap-star-acquired', attempts > 0, attempts);
    const staged = await waitPending(page, initial.totalOpens);
    const pending = staged.pendingReveal;
    await restoreRewardRandom(page);
    assert('near-cap-charged', pending?.pouchType === 'charged' && pending?.chips?.cost === 60, pending?.pouchType);
    assert('near-cap-max-density-components', pending?.standard?.rarity === 'legendary' && pending?.standard?.isNew === false && pending?.chips?.cacheTier === 'mega' && pending?.chips?.recycle === 15, { standard: pending?.standard, chips: pending?.chips });
    assert('near-cap-bonus-from-x140', pending?.chips?.overchargeBonus === Math.round(pending?.chips?.rawEarned * 0.4), pending?.chips);
    assert('near-cap-clamped-real-delta', pending?.overcharge?.beforeHundredths === 140 && pending?.overcharge?.appliedGainHundredths === 10 && pending?.overcharge?.afterHundredths === 150, pending?.overcharge);
    const committed = await waitCommitted(page, initial.totalOpens + 1);
    assert('near-cap-committed-max', committed?.signal === 4 && committed?.overchargeHundredths === 150, committed);
    await page.waitForTimeout(320);
    await shot(page, 'overcharge-max-density-tray-ru-900');
    await collectAndIdle(page, width);
    await shot(page, 'overcharge-max-idle');
    await ctx.close();
  }

  // F. Already MAX: multiplier still applies and no fake gain is staged.
  {
    const width = 800;
    const ctx = await browser.newContext({ viewport: { width, height: 720 }, locale: 'en-US' });
    const page = await ctx.newPage();
    wireDiagnostics(page, 'max-repeat');
    await page.goto('http://127.0.0.1:5173/?debug=1&platform=mock', { waitUntil: 'domcontentloaded' });
    await waitGame(page);
    const initial = baseSave({ chips: 300, signal: 4, overchargeHundredths: 150, discoveredStandard: allStandard, totalOpens: 40 });
    await setSave(page, initial);
    await installRewardSequence(page, [0.1, 0.1, 0, 0, 0.99]);
    const attempts = await realTear(page, width, initial.totalOpens);
    assert('max-repeat-star-acquired', attempts > 0, attempts);
    const staged = await waitPending(page, initial.totalOpens);
    const pending = staged.pendingReveal;
    await restoreRewardRandom(page);
    assert('max-repeat-bonus-applies', pending?.chips?.overchargeBonus === Math.round(pending?.chips?.rawEarned * 0.5), pending?.chips);
    assert('max-repeat-no-fake-gain', pending?.overcharge?.beforeHundredths === 150 && pending?.overcharge?.afterHundredths === 150 && pending?.overcharge?.appliedGainHundredths === 0, pending?.overcharge);
    await waitCommitted(page, initial.totalOpens + 1);
    await page.waitForTimeout(260);
    await shot(page, 'overcharge-max-repeat-en-800');
    await ctx.close();
  }

  // G. Charged lock consume: current x1.50 cashes out, then Signal/Overcharge reset atomically.
  {
    const width = 1280;
    const ctx = await browser.newContext({ viewport: { width, height: 720 }, locale: 'en-US', recordVideo: { dir: outDir, size: { width, height: 720 } } });
    const page = await ctx.newPage();
    wireDiagnostics(page, 'consume');
    await page.goto('http://127.0.0.1:5173/?debug=1&platform=mock', { waitUntil: 'domcontentloaded' });
    await waitGame(page);
    const discovered = allStandard.filter(id => id !== 'camera-legendary');
    const initial = baseSave({ chips: 400, signal: 4, overchargeHundredths: 150, discoveredStandard: discovered, totalOpens: 50 });
    await setSave(page, initial);
    await tap(page, chargedCenterX(width), 309, 45);
    await page.waitForTimeout(130);
    await installRewardSequence(page, [0, 0, 0, 0, 0.99]);
    const attempts = await realTear(page, width, initial.totalOpens);
    assert('consume-star-acquired', attempts > 0, attempts);
    const staged = await waitPending(page, initial.totalOpens);
    const pending = staged.pendingReveal;
    await restoreRewardRandom(page);
    assert('consume-guaranteed-legendary-new', pending?.standard?.collectibleId === 'camera-legendary' && pending?.standard?.isNew === true, pending?.standard);
    assert('consume-lock-flags', pending?.signal?.lockConsumed === true && pending?.signal?.after === 0, pending?.signal);
    assert('consume-cashout-x150', pending?.overcharge?.beforeHundredths === 150 && pending?.chips?.overchargeBonus === Math.round(pending?.chips?.rawEarned * 0.5), { overcharge: pending?.overcharge, chips: pending?.chips });
    assert('consume-reset-predetermined', pending?.overcharge?.afterHundredths === 100 && pending?.overcharge?.appliedGainHundredths === 0, pending?.overcharge);
    const committed = await waitCommitted(page, initial.totalOpens + 1);
    assert('consume-commit-reset', committed?.signal === 0 && committed?.overchargeHundredths === 100 && committed?.discoveredStandard?.includes('camera-legendary'), committed);
    await page.waitForTimeout(280);
    await shot(page, 'overcharge-consume-cashout-result');
    await collectAndIdle(page, width);
    await shot(page, 'overcharge-consume-reset-idle');
    await ctx.close();
  }

  // H. Recovery during a durable near-cap transition: exact pending economics survive reload and commit once.
  {
    const width = 900;
    const ctx = await browser.newContext({ viewport: { width, height: 720 }, locale: 'ru-RU' });
    const page = await ctx.newPage();
    wireDiagnostics(page, 'recovery');
    await page.goto('http://127.0.0.1:5173/?debug=1&platform=mock', { waitUntil: 'domcontentloaded' });
    await waitGame(page);
    const initial = baseSave({ chips: 300, signal: 4, overchargeHundredths: 140, discoveredStandard: allStandard, totalOpens: 60 });
    await setSave(page, initial);
    await installRewardSequence(page, [0.1, 0.1, 0, 0, 0.99]);
    const attempts = await realTear(page, width, initial.totalOpens);
    assert('recovery-star-acquired', attempts > 0, attempts);
    const first = await waitPending(page, initial.totalOpens);
    await restoreRewardRandom(page);
    const fingerprint = state => state?.pendingReveal ? {
      id: state.pendingReveal.id,
      openingNumber: state.pendingReveal.openingNumber,
      standard: state.pendingReveal.standard,
      chips: state.pendingReveal.chips,
      signal: state.pendingReveal.signal,
      overcharge: state.pendingReveal.overcharge,
      commit: state.pendingReveal.commit,
    } : null;
    const beforeReloadFingerprint = fingerprint(first);
    await page.reload({ waitUntil: 'domcontentloaded' });
    const immediate = await readSave(page);
    assert('recovery-pending-identical-after-reload', JSON.stringify(fingerprint(immediate)) === JSON.stringify(beforeReloadFingerprint), { beforeReloadFingerprint, after: fingerprint(immediate) });
    await waitGame(page);
    const committed = await waitCommitted(page, initial.totalOpens + 1);
    assert('recovery-committed-once', committed?.totalOpens === initial.totalOpens + 1 && committed?.pendingReveal === null && committed?.overchargeHundredths === 150, committed);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await waitGame(page);
    const stable = await readSave(page);
    assert('recovery-stable-after-second-reload', stable?.totalOpens === committed?.totalOpens && stable?.chips === committed?.chips && stable?.overchargeHundredths === committed?.overchargeHundredths && stable?.pendingReveal === null, { committed, stable });
    await shot(page, 'overcharge-recovery-stable');
    await ctx.close();
  }

  // I. Real Hidden Pocket with scoped deterministic reward RNG: Secret persists and presentation is captured.
  {
    const width = 900;
    const ctx = await browser.newContext({ viewport: { width, height: 720 }, locale: 'ru-RU', recordVideo: { dir: outDir, size: { width, height: 720 } } });
    const page = await ctx.newPage();
    wireDiagnostics(page, 'hidden');
    await page.goto('http://127.0.0.1:5173/?debug=1&platform=mock', { waitUntil: 'domcontentloaded' });
    await waitGame(page);
    const initial = baseSave({ chips: 120, totalOpens: 3 });
    await setSave(page, initial);
    await installRewardSequence(page, [0.1, 0.1, 0, 0, 0.001, 0]);
    const attempts = await realTear(page, width, initial.totalOpens);
    assert('hidden-star-acquired', attempts > 0, attempts);
    const staged = await waitPending(page, initial.totalOpens);
    const pending = staged.pendingReveal;
    const calls = await restoreRewardRandom(page);
    assert('hidden-rng-scoped', calls >= 6 && calls < 20, calls);
    assert('hidden-present', pending?.hiddenPocket?.collectibleId === 'camera-secret-cosmic', pending?.hiddenPocket);
    await page.waitForTimeout(620);
    await shot(page, 'hidden-premium-early');
    await page.waitForTimeout(760);
    await shot(page, 'hidden-premium-late');
    const committed = await waitCommitted(page, initial.totalOpens + 1);
    assert('hidden-persisted', committed?.discoveredSecrets?.includes('camera-secret-cosmic') && committed?.stats?.hiddenPockets === 1, committed);
    await page.waitForTimeout(450);
    await shot(page, 'hidden-result-added-to-collection');
    await ctx.close();
  }
} catch (error) {
  fatal = error;
  errors.push({ tag: 'harness', kind: 'fatal', message: error instanceof Error ? error.stack ?? error.message : String(error) });
} finally {
  await browser.close();
}

assert('no-runtime-errors', errors.length === 0, errors);
assert('no-request-failures', failedRequests.length === 0, failedRequests);
assert('no-http-errors', badResponses.length === 0, badResponses);
assert('no-synthetic-sfx-requests', syntheticAssetRequests.length === 0, syntheticAssetRequests);

const report = {
  auditedProductHead: PRODUCT_HEAD,
  assertions,
  errors,
  failedRequests,
  badResponses,
  syntheticAssetRequests,
};
await fs.writeFile(path.join(outDir, 'report.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify({
  auditedProductHead: PRODUCT_HEAD,
  assertions: assertions.length,
  failedAssertions: assertions.filter(entry => !entry.pass).map(entry => entry.name),
  errors: errors.length,
  failedRequests: failedRequests.length,
  badResponses: badResponses.length,
  syntheticAssetRequests: syntheticAssetRequests.length,
}, null, 2));

if (fatal || assertions.some(entry => !entry.pass)) process.exitCode = 1;
