import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const SAVE_KEY = 'mystery-pocket-tech.save';
const outDir = '/tmp/final-repeated-use-r1';
const width = 1280;
const height = 720;
const TOTAL_OPENS = 24;
const assertions = [];
const errors = [];
const failedRequests = [];
const badResponses = [];
const openings = [];

await fs.rm(outDir, { recursive: true, force: true });
await fs.mkdir(outDir, { recursive: true });

const assert = (name, pass, observed) => assertions.push({ name, pass: Boolean(pass), observed });
const sleep = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));
const shot = (page, name) => page.screenshot({ path: path.join(outDir, `${name}.png`) });

const readSave = page => page.evaluate(key => {
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : null;
}, SAVE_KEY);

const wireDiagnostics = page => {
  page.on('pageerror', error => errors.push({ kind: 'pageerror', message: error.message }));
  page.on('console', message => {
    if (message.type() === 'error') errors.push({ kind: 'console-error', message: message.text() });
  });
  page.on('requestfailed', request => failedRequests.push({ url: request.url(), failure: request.failure()?.errorText ?? 'unknown' }));
  page.on('response', response => {
    if (response.status() >= 400) badResponses.push({ status: response.status(), url: response.url() });
  });
};

const waitGame = async page => {
  await page.locator('#game canvas').waitFor({ state: 'visible', timeout: 20000 });
  await page.waitForFunction(() => document.querySelector('#orientation-gate')?.getAttribute('data-visible') !== 'true');
  await page.waitForTimeout(500);
};

const tap = async (page, x, y, hold = 36) => {
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
    await page.waitForTimeout(55);
    for (let step = 1; step <= 14; step += 1) {
      await page.mouse.move(startX + (312 * step) / 14, startY, { steps: 1 });
      await page.waitForTimeout(13);
    }
    await page.mouse.up();
    await page.waitForTimeout(180);
    const state = await readSave(page);
    if (state?.pendingReveal?.openingNumber === beforeOpens + 1 || state?.totalOpens === beforeOpens + 1) return attempt + 1;
    await page.waitForTimeout(220);
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
    await tap(page, width / 2, 420, 24);
    await page.waitForTimeout(185);
  }
};

const acceptAndSettle = async (page, slowRead) => {
  await page.waitForTimeout(slowRead ? 1180 : 520);
  for (let i = 0; i < 4; i += 1) {
    await tap(page, width / 2, 585, 32);
    await page.waitForTimeout(slowRead ? 260 : 185);
  }
  await page.waitForTimeout(slowRead ? 1650 : 1150);
};

const choosePouch = async (page, state, openingIndex) => {
  // Exercise both cards through the real root-space hit zones. Charged is selected
  // only when affordable and every third opening; otherwise deliberately return to Basic.
  const shouldUseCharged = state.chips >= 60 && openingIndex % 3 === 0;
  const y = shouldUseCharged ? 309 : 241;
  await tap(page, 160, y, 32);
  await page.waitForTimeout(180);
  return shouldUseCharged ? 'charged' : 'basic';
};

const cycleCollection = async (page, cycle) => {
  await tap(page, width - 92, 665, 36);
  await page.waitForTimeout(850);
  await shot(page, `collection-cycle-${cycle}`);
  // Collection's "open more" control is anchored at safe-left / safe-bottom.
  await tap(page, 96, 665, 36);
  await page.waitForTimeout(900);
  await shot(page, `opening-after-collection-${cycle}`);
};

const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] });
let fatal = null;
let videoPath = null;

try {
  const context = await browser.newContext({
    viewport: { width, height },
    locale: 'en-US',
    recordVideo: { dir: outDir, size: { width, height } },
  });
  const page = await context.newPage();
  wireDiagnostics(page);
  await page.goto('http://127.0.0.1:5173/?platform=mock', { waitUntil: 'domcontentloaded' });
  await waitGame(page);
  await shot(page, '00-fresh-idle');

  for (let index = 1; index <= TOTAL_OPENS; index += 1) {
    const before = await readSave(page);
    if (!before || before.pendingReveal) throw new Error(`Opening ${index}: invalid idle save`);
    const intendedPouch = await choosePouch(page, before, index);
    const tearAttempt = await realTear(page, before.totalOpens);
    if (!tearAttempt) throw new Error(`Opening ${index}: could not acquire/tear pouch`);

    const staged = await waitPending(page, before.totalOpens);
    const pending = staged.pendingReveal;
    if (!pending) throw new Error(`Opening ${index}: pending reveal disappeared before capture`);

    openings.push({
      index,
      intendedPouch,
      pouchType: pending.pouchType,
      standard: pending.standard,
      chips: pending.chips,
      signal: pending.signal,
      overcharge: pending.overcharge,
      hiddenPocket: pending.hiddenPocket,
      tearAttempt,
    });

    if (index > 4) await fastForwardReveal(page);
    const committed = await waitCommitted(page, before.totalOpens + 1);

    if ([1, 2, 3, 4, 6, 9, 12, 15, 18, 21, 24].includes(index)) {
      await page.waitForTimeout(260);
      await shot(page, `result-${String(index).padStart(2, '0')}-${pending.pouchType}`);
    }

    await acceptAndSettle(page, index <= 4);
    const settled = await readSave(page);
    assert(`opening-${index}-settled`, settled?.totalOpens === committed.totalOpens && settled?.pendingReveal === null, settled);
    assert(`opening-${index}-pouch-selection`, pending.pouchType === intendedPouch, { intendedPouch, actual: pending.pouchType, chipsBefore: before.chips });

    if (index % 6 === 0 && index < TOTAL_OPENS) {
      await cycleCollection(page, index / 6);
    }
  }

  const finalSave = await readSave(page);
  await shot(page, '99-final-idle');

  const chargedCount = openings.filter(item => item.pouchType === 'charged').length;
  const duplicateCount = openings.filter(item => !item.standard.isNew).length;
  const signalGainCount = openings.filter(item => item.signal.gain > 0).length;
  const retainedCount = openings.filter(item => item.signal.lockRetained).length;
  const consumedCount = openings.filter(item => item.signal.lockConsumed).length;
  const overchargeBonusCount = openings.filter(item => item.chips.overchargeBonus > 0).length;
  const hiddenCount = openings.filter(item => item.hiddenPocket).length;

  assert('completed-24-normal-openings', finalSave?.totalOpens === TOTAL_OPENS && openings.length === TOTAL_OPENS, { totalOpens: finalSave?.totalOpens, recorded: openings.length });
  assert('normal-loop-reached-charged', chargedCount > 0, chargedCount);
  assert('normal-loop-produced-duplicates', duplicateCount > 0, duplicateCount);
  assert('normal-loop-produced-signal', signalGainCount > 0, signalGainCount);
  assert('no-runtime-errors', errors.length === 0, errors);
  assert('no-request-failures', failedRequests.length === 0, failedRequests);
  assert('no-http-errors', badResponses.length === 0, badResponses);

  await fs.writeFile(path.join(outDir, 'summary.json'), JSON.stringify({
    finalSave,
    counts: { chargedCount, duplicateCount, signalGainCount, retainedCount, consumedCount, overchargeBonusCount, hiddenCount },
    openings,
  }, null, 2));

  videoPath = await page.video()?.path();
  await context.close();
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
  videoPath,
};
await fs.writeFile(path.join(outDir, 'report.json'), JSON.stringify(report, null, 2));

if (fatal || report.failedAssertions.length > 0) {
  console.error(JSON.stringify(report, null, 2));
  process.exitCode = 1;
} else {
  console.log(JSON.stringify(report, null, 2));
}
