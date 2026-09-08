import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const SAVE_KEY = 'mystery-pocket-tech.save';
const outDir = '/tmp/overcharge-counter-lifecycle-r1';
const width = 1280;
const height = 720;
const TARGETED_OPENS = 10;
const NORMAL_OPENS = 24;
const assertions = [];
const errors = [];
const failedRequests = [];
const badResponses = [];
const targeted = [];
const normal = [];

const allStandard = [
  'camera-common', 'camera-rare', 'camera-epic', 'camera-legendary',
  'flip-phone-common', 'flip-phone-rare', 'flip-phone-epic', 'flip-phone-legendary',
];

await fs.rm(outDir, { recursive: true, force: true });
await fs.mkdir(outDir, { recursive: true });

const assert = (name, pass, observed) => assertions.push({ name, pass: Boolean(pass), observed });
const shot = (page, name) => page.screenshot({ path: path.join(outDir, `${name}.png`) });
const readSave = page => page.evaluate(key => {
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : null;
}, SAVE_KEY);

const wireDiagnostics = (page, tag) => {
  page.on('pageerror', error => errors.push({ tag, kind: 'pageerror', message: error.message, stack: error.stack ?? null }));
  page.on('console', message => {
    if (message.type() === 'error') errors.push({ tag, kind: 'console-error', message: message.text() });
  });
  page.on('requestfailed', request => failedRequests.push({ tag, url: request.url(), failure: request.failure()?.errorText ?? 'unknown' }));
  page.on('response', response => {
    if (response.status() >= 400) badResponses.push({ tag, status: response.status(), url: response.url() });
  });
};

const waitGame = async page => {
  await page.locator('#game canvas').waitFor({ state: 'visible', timeout: 20000 });
  await page.waitForFunction(() => document.querySelector('#orientation-gate')?.getAttribute('data-visible') !== 'true');
  await page.waitForTimeout(500);
  await page.evaluate(() => {
    const panel = document.querySelector('.mpt-debug-panel');
    if (panel) panel.style.display = 'none';
  });
};

const tap = async (page, x, y, hold = 28) => {
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.waitForTimeout(hold);
  await page.mouse.up();
};

const realTear = async (page, beforeOpens) => {
  const candidates = [{ dx: 0, dy: 0 }, { dx: 0, dy: 8 }, { dx: -7, dy: 2 }, { dx: 7, dy: 2 }];
  for (let attempt = 0; attempt < candidates.length; attempt += 1) {
    const { dx, dy } = candidates[attempt];
    const startX = width / 2 - 158 + dx;
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

const hammerFastForward = async page => {
  for (let i = 0; i < 8; i += 1) {
    await tap(page, width / 2, 420, 20);
    await page.waitForTimeout(65);
  }
};

const acceptAndSettle = async page => {
  await page.waitForTimeout(280);
  for (let i = 0; i < 5; i += 1) {
    await tap(page, width / 2, 585, 24);
    await page.waitForTimeout(105);
  }
  await page.waitForTimeout(980);
};

const choosePouch = async (page, state, openingIndex) => {
  const charged = state.chips >= 60 && openingIndex % 3 === 0;
  await tap(page, 160, charged ? 309 : 241, 30);
  await page.waitForTimeout(150);
  return charged ? 'charged' : 'basic';
};

const cycleCollection = async (page, cycle) => {
  await tap(page, width - 92, 665, 32);
  await page.waitForTimeout(760);
  await shot(page, `normal-collection-${cycle}`);
  await tap(page, 96, 665, 32);
  await page.waitForTimeout(820);
};

const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] });
let fatal = null;
let targetedVideo = null;
let normalVideo = null;

try {
  // A. Deterministic reproduction of the former stale Text.setText race.
  {
    const context = await browser.newContext({
      viewport: { width, height },
      locale: 'en-US',
      recordVideo: { dir: outDir, size: { width, height } },
    });
    const page = await context.newPage();
    wireDiagnostics(page, 'targeted');
    await page.goto('http://127.0.0.1:5173/?debug=1&platform=mock', { waitUntil: 'domcontentloaded' });
    await waitGame(page);
    await page.evaluate(({ key, allStandard }) => {
      localStorage.setItem(key, JSON.stringify({
        version: 3,
        discoveredStandard: allStandard,
        discoveredSecrets: [],
        chips: 220,
        signal: 4,
        overchargeHundredths: 120,
        activeLootPoolId: 'y2k-essentials',
        totalOpens: 20,
        pendingReveal: null,
        muted: true,
        stats: { duplicates: 12, hiddenPockets: 0 },
      }));
    }, { key: SAVE_KEY, allStandard });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await waitGame(page);
    await shot(page, 'targeted-00-start');

    for (let index = 1; index <= TARGETED_OPENS; index += 1) {
      const before = await readSave(page);
      if (!before || before.pendingReveal) throw new Error(`Targeted ${index}: invalid idle state`);
      const tearAttempt = await realTear(page, before.totalOpens);
      if (!tearAttempt) throw new Error(`Targeted ${index}: tear failed`);
      const staged = await waitPending(page, before.totalOpens);
      const pending = staged.pendingReveal;
      if (!pending) throw new Error(`Targeted ${index}: pending missing`);
      targeted.push({
        index,
        tearAttempt,
        rawEarned: pending.chips.rawEarned,
        overchargeBonus: pending.chips.overchargeBonus,
        overcharge: pending.overcharge,
        signal: pending.signal,
      });
      assert(`targeted-${index}-retained-lock`, pending.signal.lockRetained === true, pending.signal);
      assert(`targeted-${index}-bonus-countup-active`, pending.chips.overchargeBonus > 0, pending.chips);
      await hammerFastForward(page);
      const committed = await waitCommitted(page, before.totalOpens + 1);
      assert(`targeted-${index}-committed`, committed.pendingReveal === null && committed.totalOpens === before.totalOpens + 1, committed);
      if ([1, 4, 7, 10].includes(index)) await shot(page, `targeted-${String(index).padStart(2, '0')}-result`);
      await acceptAndSettle(page);
    }

    const final = await readSave(page);
    assert('targeted-completed-all-openings', final?.totalOpens === 20 + TARGETED_OPENS, final);
    targetedVideo = await page.video()?.path();
    await context.close();
  }

  // B. Fresh-state repeated-use loop with real pouch selection + Collection round-trips.
  {
    const context = await browser.newContext({
      viewport: { width, height },
      locale: 'en-US',
      recordVideo: { dir: outDir, size: { width, height } },
    });
    const page = await context.newPage();
    wireDiagnostics(page, 'normal');
    await page.goto('http://127.0.0.1:5173/?debug=1&platform=mock', { waitUntil: 'domcontentloaded' });
    await waitGame(page);
    await page.evaluate(key => localStorage.removeItem(key), SAVE_KEY);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await waitGame(page);
    await shot(page, 'normal-00-fresh-idle');

    for (let index = 1; index <= NORMAL_OPENS; index += 1) {
      const stored = await readSave(page);
      const before = stored ?? { chips: 0, totalOpens: 0, pendingReveal: null };
      if (before.pendingReveal) throw new Error(`Normal ${index}: pending at idle`);
      const intendedPouch = await choosePouch(page, before, index);
      const tearAttempt = await realTear(page, before.totalOpens);
      if (!tearAttempt) throw new Error(`Normal ${index}: tear failed`);
      const staged = await waitPending(page, before.totalOpens);
      const pending = staged.pendingReveal;
      if (!pending) throw new Error(`Normal ${index}: pending missing`);
      normal.push({
        index,
        intendedPouch,
        pouchType: pending.pouchType,
        isNew: pending.standard.isNew,
        rarity: pending.standard.rarity,
        cacheTier: pending.chips.cacheTier,
        chipsAfter: pending.chips.after,
        signal: pending.signal,
        overcharge: pending.overcharge,
        hiddenPocket: Boolean(pending.hiddenPocket),
      });
      assert(`normal-${index}-selection`, pending.pouchType === intendedPouch, { intendedPouch, actual: pending.pouchType, chipsBefore: before.chips });
      if (index > 4) await hammerFastForward(page);
      const committed = await waitCommitted(page, before.totalOpens + 1);
      assert(`normal-${index}-commit`, committed.pendingReveal === null && committed.totalOpens === before.totalOpens + 1, committed);
      if ([1, 2, 3, 4, 6, 12, 18, 24].includes(index)) await shot(page, `normal-result-${String(index).padStart(2, '0')}-${pending.pouchType}`);
      await acceptAndSettle(page);
      if (index % 6 === 0 && index < NORMAL_OPENS) await cycleCollection(page, index / 6);
    }

    const final = await readSave(page);
    await shot(page, 'normal-99-final-idle');
    const chargedCount = normal.filter(item => item.pouchType === 'charged').length;
    const duplicateCount = normal.filter(item => !item.isNew).length;
    const signalCount = normal.filter(item => item.signal.gain > 0).length;
    const retainedCount = normal.filter(item => item.signal.lockRetained).length;
    const consumedCount = normal.filter(item => item.signal.lockConsumed).length;
    const overchargeBonusCount = normal.filter(item => item.overcharge.beforeHundredths > 100).length;
    assert('normal-completed-24', final?.totalOpens === NORMAL_OPENS && normal.length === NORMAL_OPENS, { final, count: normal.length });
    assert('normal-reached-charged', chargedCount > 0, chargedCount);
    assert('normal-produced-duplicates', duplicateCount > 0, duplicateCount);
    assert('normal-produced-signal', signalCount > 0, signalCount);
    await fs.writeFile(path.join(outDir, 'normal-summary.json'), JSON.stringify({
      final,
      counts: { chargedCount, duplicateCount, signalCount, retainedCount, consumedCount, overchargeBonusCount },
      openings: normal,
    }, null, 2));
    normalVideo = await page.video()?.path();
    await context.close();
  }

  assert('no-runtime-errors', errors.length === 0, errors);
  assert('no-request-failures', failedRequests.length === 0, failedRequests);
  assert('no-http-errors', badResponses.length === 0, badResponses);
} catch (error) {
  fatal = error instanceof Error ? { message: error.message, stack: error.stack } : { message: String(error) };
} finally {
  await browser.close();
}

const report = {
  totalAssertions: assertions.length,
  failedAssertions: assertions.filter(item => !item.pass),
  assertions,
  fatal,
  errors,
  failedRequests,
  badResponses,
  targeted,
  targetedVideo,
  normalVideo,
};
await fs.writeFile(path.join(outDir, 'report.json'), JSON.stringify(report, null, 2));

if (fatal || report.failedAssertions.length > 0) {
  console.error(JSON.stringify(report, null, 2));
  process.exitCode = 1;
} else {
  console.log(JSON.stringify(report, null, 2));
}
