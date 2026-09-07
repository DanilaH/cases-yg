import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const PRODUCT_HEAD = 'ac6ab29cb3bdd521a2fcabf723290816947e4b85';
const SAVE_KEY = 'mystery-pocket-tech.save';
const outDir = '/tmp/final-independent-hidden-r3';
fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

const assertions = [];
const errors = [];
const failedRequests = [];
const badResponses = [];
const syntheticAssetRequests = [];
const assert = (name, pass, observed) => assertions.push({ name, pass: Boolean(pass), observed });

const baseSave = () => ({
  version: 2,
  discoveredStandard: [],
  discoveredSecrets: [],
  chips: 120,
  signal: 0,
  activeLootPoolId: 'y2k-essentials',
  totalOpens: 3,
  pendingReveal: null,
  muted: false,
  stats: { duplicates: 0, hiddenPockets: 0 },
});

const waitGame = async page => {
  await page.locator('canvas').waitFor({ state: 'visible', timeout: 15000 });
  await page.waitForTimeout(450);
};
const hideDebug = async page => {
  const panel = page.locator('.mpt-debug-panel');
  if (await panel.count()) await panel.evaluate(el => { el.style.display = 'none'; });
};
const shot = (page, name) => page.screenshot({ path: path.join(outDir, `${name}.png`) });
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
const tap = async (page, x, y, hold = 45) => {
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.waitForTimeout(hold);
  await page.mouse.up();
};
const wireDiagnostics = (page, tag) => {
  page.on('pageerror', error => errors.push({ tag, kind: 'pageerror', message: error.message }));
  page.on('console', message => {
    if (message.type() === 'error') errors.push({ tag, kind: 'console-error', message: message.text() });
  });
  page.on('requestfailed', request => failedRequests.push({ tag, url: request.url(), failure: request.failure()?.errorText ?? 'unknown' }));
  page.on('response', response => {
    if (response.status() >= 400) badResponses.push({ tag, status: response.status(), url: response.url() });
    if (/chip-clack\.mp3|pouch-grab\.mp3/i.test(response.url())) syntheticAssetRequests.push(response.url());
  });
};

const installRewardRandomOverride = async (page, value) => {
  await page.evaluate(value => {
    const w = window;
    if (w.__mptRestoreRewardRandom) w.__mptRestoreRewardRandom();
    const original = Math.random;
    let interceptedCalls = 0;
    Math.random = () => {
      const stack = new Error().stack ?? '';
      if (stack.includes('/src/game/systems/random.ts')) {
        interceptedCalls += 1;
        w.__mptRewardRandomCalls = interceptedCalls;
        return value;
      }
      return original();
    };
    w.__mptRewardRandomCalls = 0;
    w.__mptRestoreRewardRandom = () => {
      Math.random = original;
      delete w.__mptRestoreRewardRandom;
    };
  }, value);
};
const restoreRewardRandomOverride = async page => {
  return page.evaluate(() => {
    const w = window;
    const calls = w.__mptRewardRandomCalls ?? 0;
    if (w.__mptRestoreRewardRandom) w.__mptRestoreRewardRandom();
    return calls;
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
    await page.waitForTimeout(260);
    const state = await readSave(page);
    if (state?.pendingReveal?.openingNumber === beforeOpens + 1 || state?.totalOpens === beforeOpens + 1) return attempt + 1;
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

const browser = await chromium.launch({ channel: 'chrome', headless: true });
let fatal = null;
try {
  const width = 900;
  const ctx = await browser.newContext({
    viewport: { width, height: 720 },
    locale: 'ru-RU',
    recordVideo: { dir: outDir, size: { width, height: 720 } },
  });
  const page = await ctx.newPage();
  wireDiagnostics(page, 'hidden-r3');
  await page.goto('http://127.0.0.1:5173/?debug=1&platform=mock', { waitUntil: 'domcontentloaded' });
  await waitGame(page);
  await setSave(page, baseSave());
  await shot(page, '00-hidden-idle-before');

  const before = await readSave(page);
  await installRewardRandomOverride(page, 0.001);
  const attempts = await realTear(page, width, before.totalOpens);
  assert('hidden-star-acquired', attempts > 0, attempts);
  if (!attempts) throw new Error('Hidden Pocket audit could not acquire star');

  const pendingState = await waitPending(page, before.totalOpens);
  const randomCalls = await restoreRewardRandomOverride(page);
  const pending = pendingState.pendingReveal;
  assert('reward-rng-intercepted', randomCalls >= 6, randomCalls);
  assert('hidden-pending-present', Boolean(pending?.hiddenPocket), pending?.hiddenPocket ?? null);
  assert('hidden-secret-camera', pending?.hiddenPocket?.collectibleId === 'camera-secret-cosmic', pending?.hiddenPocket ?? null);
  assert('hidden-standard-common-camera', pending?.standard?.rarity === 'common' && pending?.standard?.familyId === 'camera', pending?.standard ?? null);
  await shot(page, '01-hidden-after-tear');
  await page.waitForTimeout(700);
  await shot(page, '02-hidden-reveal-early');
  await page.waitForTimeout(850);
  await shot(page, '03-hidden-reveal-late');

  const committed = await waitCommitted(page, before.totalOpens + 1);
  assert('hidden-committed-once', committed?.totalOpens === 4 && committed?.pendingReveal === null, committed);
  assert('hidden-secret-persisted', committed?.discoveredSecrets?.includes('camera-secret-cosmic') === true, committed?.discoveredSecrets);
  assert('hidden-stat-incremented', committed?.stats?.hiddenPockets === 1, committed?.stats);
  await page.waitForTimeout(900);
  await shot(page, '04-hidden-result-carousel');

  await tap(page, width / 2, 585, 55);
  await page.waitForTimeout(2400);
  await shot(page, '05-hidden-idle-after-banking');
  const stable = await readSave(page);
  assert('hidden-banking-no-save-mutation', JSON.stringify(stable) === JSON.stringify(committed), { committed, stable });
  await ctx.close();
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

const report = { auditedProductHead: PRODUCT_HEAD, assertions, errors, failedRequests, badResponses, syntheticAssetRequests };
fs.writeFileSync(path.join(outDir, 'report.json'), JSON.stringify(report, null, 2));
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
