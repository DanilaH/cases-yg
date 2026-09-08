import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const SAVE_KEY = 'mystery-pocket-tech.save';
const OUT_DIR = '/tmp/final-post-secret-repeated-use-r1';
const PRODUCT_SHA = '341c4a265a39c1d8f9d7e1cd1030b7d4e8c62cba';
const WIDTH = 1280;
const HEIGHT = 720;
const TOTAL_OPENS = 24;
const ALL_STANDARD = [
  'camera-common', 'camera-rare', 'camera-epic', 'camera-legendary',
  'flip-phone-common', 'flip-phone-rare', 'flip-phone-epic', 'flip-phone-legendary',
];

await fs.rm(OUT_DIR, { recursive: true, force: true });
await fs.mkdir(OUT_DIR, { recursive: true });

const assertions = [];
const diagnostics = [];
const openings = [];
const captures = [];
let fatal = null;

const assert = (name, pass, observed) => assertions.push({ name, pass: Boolean(pass), observed });
const shot = async (page, name, meta = {}) => {
  const file = `${name}.png`;
  await page.screenshot({ path: path.join(OUT_DIR, file) });
  captures.push({ file, ...meta });
};
const readSave = page => page.evaluate(key => {
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : null;
}, SAVE_KEY);
const writeSave = (page, state) => page.evaluate(({ key, state }) => localStorage.setItem(key, JSON.stringify(state)), { key: SAVE_KEY, state });
const fallbackFresh = raw => raw ?? {
  version: 4,
  discoveredStandard: [],
  discoveredSecrets: [],
  chips: 0,
  signal: 0,
  overchargeHundredths: 100,
  activeLootPoolId: 'y2k-essentials',
  totalOpens: 0,
  pendingReveal: null,
  muted: false,
  stats: { duplicates: 0, hiddenPockets: 0 },
};

const wireDiagnostics = (page, scenario) => {
  page.on('pageerror', error => diagnostics.push({ scenario, kind: 'pageerror', message: error.message, stack: error.stack ?? null }));
  page.on('console', message => {
    if (message.type() === 'error') diagnostics.push({ scenario, kind: 'console-error', message: message.text() });
  });
  page.on('requestfailed', request => diagnostics.push({ scenario, kind: 'requestfailed', url: request.url(), message: request.failure()?.errorText ?? 'unknown' }));
  page.on('response', response => {
    if (response.status() >= 400) diagnostics.push({ scenario, kind: 'http-error', status: response.status(), url: response.url() });
  });
};

const hideDebug = page => page.evaluate(() => {
  const panel = document.querySelector('.mpt-debug-panel');
  if (panel) panel.style.display = 'none';
});
const waitGame = async page => {
  await page.locator('#game canvas').waitFor({ state: 'visible', timeout: 20000 });
  await page.waitForFunction(() => document.querySelector('#orientation-gate')?.getAttribute('data-visible') !== 'true');
  await page.waitForTimeout(500);
  await hideDebug(page);
};
const tap = async (page, x, y, hold = 32) => {
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.waitForTimeout(hold);
  await page.mouse.up();
};
const realTear = async (page, beforeOpens) => {
  const candidates = [{ dx: 0, dy: 0 }, { dx: 0, dy: 8 }, { dx: -7, dy: 2 }, { dx: 7, dy: 2 }];
  for (let attempt = 0; attempt < candidates.length; attempt += 1) {
    const { dx, dy } = candidates[attempt];
    const startX = WIDTH / 2 - 158 + dx;
    const startY = 177 + dy;
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.waitForTimeout(50);
    for (let step = 1; step <= 14; step += 1) {
      await page.mouse.move(startX + (312 * step) / 14, startY, { steps: 1 });
      await page.waitForTimeout(12);
    }
    await page.mouse.up();
    await page.waitForTimeout(170);
    const state = await readSave(page);
    if (state?.pendingReveal?.openingNumber === beforeOpens + 1 || state?.totalOpens === beforeOpens + 1) return attempt + 1;
    await page.waitForTimeout(180);
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
  }, { key: SAVE_KEY, totalOpens }, { timeout: 20000 });
  return readSave(page);
};
const fastForwardReveal = async page => {
  for (let i = 0; i < 6; i += 1) {
    await tap(page, WIDTH / 2, 420, 22);
    await page.waitForTimeout(155);
  }
};
const acceptAndSettle = async (page, slow = false) => {
  await page.waitForTimeout(slow ? 1180 : 520);
  for (let i = 0; i < 4; i += 1) {
    await tap(page, WIDTH / 2, 585, 28);
    await page.waitForTimeout(slow ? 250 : 170);
  }
  await page.waitForTimeout(slow ? 1600 : 1100);
};
const choosePouch = async (page, state, index) => {
  const charged = state.chips >= 60 && index % 3 === 0;
  await tap(page, 160, charged ? 309 : 241, 30);
  await page.waitForTimeout(170);
  return charged ? 'charged' : 'basic';
};
const cycleCollection = async (page, cycle) => {
  await tap(page, WIDTH - 92, 665, 34);
  await page.waitForTimeout(850);
  await shot(page, `normal-collection-${cycle}`);
  await tap(page, 96, 665, 34);
  await page.waitForTimeout(900);
  await hideDebug(page);
  await shot(page, `normal-after-collection-${cycle}`);
};
const forceHiddenPocketForPrepare = page => page.evaluate(() => {
  window.__mptAuditOriginalRandom = Math.random;
  Math.random = () => 0;
});
const restoreRandom = page => page.evaluate(() => {
  if (typeof window.__mptAuditOriginalRandom === 'function') {
    Math.random = window.__mptAuditOriginalRandom;
    delete window.__mptAuditOriginalRandom;
  }
});

const browser = await chromium.launch({
  channel: 'chrome',
  headless: true,
  args: ['--use-angle=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'],
});

const runNormalLoop = async () => {
  const context = await browser.newContext({
    viewport: { width: WIDTH, height: HEIGHT },
    locale: 'en-US',
    recordVideo: { dir: OUT_DIR, size: { width: WIDTH, height: HEIGHT } },
  });
  const page = await context.newPage();
  wireDiagnostics(page, 'normal-24');
  await page.goto('http://127.0.0.1:5173/?platform=mock', { waitUntil: 'domcontentloaded' });
  await waitGame(page);
  await shot(page, 'normal-00-fresh-idle');

  for (let index = 1; index <= TOTAL_OPENS; index += 1) {
    const before = fallbackFresh(await readSave(page));
    if (before.pendingReveal) throw new Error(`normal opening ${index}: unexpected pending reveal`);
    const intendedPouch = await choosePouch(page, before, index);
    const tearAttempt = await realTear(page, before.totalOpens);
    if (!tearAttempt) throw new Error(`normal opening ${index}: could not acquire/tear pouch`);
    const staged = await waitPending(page, before.totalOpens);
    const pending = staged?.pendingReveal;
    if (!pending) throw new Error(`normal opening ${index}: pending reveal missing`);

    openings.push({ index, intendedPouch, tearAttempt, pouchType: pending.pouchType, standard: pending.standard, chips: pending.chips, signal: pending.signal, overcharge: pending.overcharge, hiddenPocket: pending.hiddenPocket });
    if (index > 4) await fastForwardReveal(page);
    const committed = await waitCommitted(page, before.totalOpens + 1);
    if ([1, 2, 3, 4, 6, 9, 12, 15, 18, 21, 24].includes(index)) {
      await page.waitForTimeout(260);
      await shot(page, `normal-result-${String(index).padStart(2, '0')}-${pending.pouchType}`, { opening: index, pending });
    }
    await acceptAndSettle(page, index <= 4);
    const settled = await readSave(page);
    assert(`normal-${index}-settled`, settled?.totalOpens === committed.totalOpens && settled?.pendingReveal === null, settled);
    assert(`normal-${index}-pouch`, pending.pouchType === intendedPouch, { intendedPouch, actual: pending.pouchType, chipsBefore: before.chips });
    assert(`normal-${index}-wallet`, committed.chips === pending.chips.after, { expected: pending.chips.after, actual: committed.chips });
    if (index % 6 === 0 && index < TOTAL_OPENS) await cycleCollection(page, index / 6);
  }

  const finalSave = await readSave(page);
  await shot(page, 'normal-99-final-idle');
  const counts = {
    charged: openings.filter(item => item.pouchType === 'charged').length,
    duplicates: openings.filter(item => !item.standard.isNew).length,
    signalGain: openings.filter(item => item.signal.gain > 0).length,
    retained: openings.filter(item => item.signal.lockRetained).length,
    consumed: openings.filter(item => item.signal.lockConsumed).length,
    overchargeBonus: openings.filter(item => item.chips.overchargeBonus > 0).length,
    hidden: openings.filter(item => item.hiddenPocket).length,
  };
  assert('normal-completed-24', finalSave?.totalOpens === TOTAL_OPENS && openings.length === TOTAL_OPENS, { finalTotal: finalSave?.totalOpens, recorded: openings.length });
  assert('normal-reached-charged', counts.charged > 0, counts);
  assert('normal-produced-duplicates', counts.duplicates > 0, counts);
  assert('normal-produced-signal', counts.signalGain > 0, counts);
  await fs.writeFile(path.join(OUT_DIR, 'normal-summary.json'), JSON.stringify({ finalSave, counts, openings }, null, 2));
  const video = page.video();
  await context.close();
  if (video) captures.push({ file: path.basename(await video.path()), kind: 'normal-video' });
};

const runSecretLifecycle = async () => {
  const context = await browser.newContext({
    viewport: { width: WIDTH, height: HEIGHT },
    locale: 'en-US',
    recordVideo: { dir: OUT_DIR, size: { width: WIDTH, height: HEIGHT } },
  });
  const page = await context.newPage();
  wireDiagnostics(page, 'secret-lifecycle');
  await page.goto('http://127.0.0.1:5173/?debug=1&platform=mock', { waitUntil: 'domcontentloaded' });
  await waitGame(page);
  const seeded = {
    version: 4,
    discoveredStandard: ALL_STANDARD,
    discoveredSecrets: [],
    chips: 500,
    signal: 0,
    overchargeHundredths: 100,
    activeLootPoolId: 'y2k-essentials',
    totalOpens: 30,
    pendingReveal: null,
    muted: true,
    stats: { duplicates: 12, hiddenPockets: 0 },
  };
  await writeSave(page, seeded);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await waitGame(page);
  await forceHiddenPocketForPrepare(page);
  const attempt = await realTear(page, seeded.totalOpens);
  if (!attempt) throw new Error('secret lifecycle: could not tear forced Hidden Pocket');
  const staged = await waitPending(page, seeded.totalOpens);
  await restoreRandom(page);
  const pending = staged?.pendingReveal;
  if (!pending?.hiddenPocket) throw new Error('secret lifecycle: Hidden Pocket not staged');
  assert('secret-lifecycle-new', pending.hiddenPocket.isNew === true, pending.hiddenPocket);
  assert('secret-lifecycle-jackpot-40', pending.hiddenPocket.bonusChips === 40 && pending.chips.secretBonus === 40, pending.chips);
  const committed = await waitCommitted(page, seeded.totalOpens + 1);
  assert('secret-lifecycle-wallet-exact', committed.chips === pending.chips.after, { expected: pending.chips.after, actual: committed.chips });
  await page.waitForTimeout(1350);
  await shot(page, 'secret-lifecycle-settle', { pending });
  await page.waitForTimeout(3400);
  await shot(page, 'secret-lifecycle-persistent-4s', { pending });

  // Stress teardown of long-lived Secret tweens: accept, let banking finish, navigate
  // to Collection and back, then complete one more real opening.
  await tap(page, WIDTH / 2, 585, 32);
  await page.waitForTimeout(3300);
  await tap(page, WIDTH - 92, 665, 34);
  await page.waitForTimeout(900);
  await shot(page, 'secret-lifecycle-collection-after-collect');
  await tap(page, 96, 665, 34);
  await page.waitForTimeout(900);
  await hideDebug(page);
  await shot(page, 'secret-lifecycle-returned-opening');

  const afterReturn = await readSave(page);
  const nextBefore = fallbackFresh(afterReturn);
  const nextAttempt = await realTear(page, nextBefore.totalOpens);
  if (!nextAttempt) throw new Error('secret lifecycle: next opening could not tear after Secret teardown/navigation');
  const nextStaged = await waitPending(page, nextBefore.totalOpens);
  const nextPending = nextStaged?.pendingReveal;
  if (!nextPending) throw new Error('secret lifecycle: next pending reveal missing');
  await fastForwardReveal(page);
  const nextCommitted = await waitCommitted(page, nextBefore.totalOpens + 1);
  assert('secret-lifecycle-next-opening-committed', nextCommitted.totalOpens === nextBefore.totalOpens + 1 && nextCommitted.pendingReveal === null, nextCommitted);
  assert('secret-lifecycle-next-wallet-exact', nextCommitted.chips === nextPending.chips.after, { expected: nextPending.chips.after, actual: nextCommitted.chips });
  await acceptAndSettle(page, false);
  await shot(page, 'secret-lifecycle-next-idle');
  const video = page.video();
  await context.close();
  if (video) captures.push({ file: path.basename(await video.path()), kind: 'secret-lifecycle-video' });
};

try {
  await runNormalLoop();
  await runSecretLifecycle();
} catch (error) {
  fatal = error instanceof Error ? { message: error.message, stack: error.stack } : { message: String(error) };
} finally {
  await browser.close();
}

assert('zero-runtime-request-http-diagnostics', diagnostics.length === 0, diagnostics);
const failedAssertions = assertions.filter(item => !item.pass);
const report = {
  productSha: PRODUCT_SHA,
  totalAssertions: assertions.length,
  passedAssertions: assertions.length - failedAssertions.length,
  failedAssertions,
  assertions,
  fatal,
  diagnostics,
  captures,
};
await fs.writeFile(path.join(OUT_DIR, 'report.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
if (fatal || failedAssertions.length > 0) process.exitCode = 1;
