import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const SAVE_KEY = 'mystery-pocket-tech.save';
const outDir = '/tmp/reward-tray-compact-audit';
const allStandard = [
  'camera-common', 'camera-rare', 'camera-epic', 'camera-legendary',
  'flip-phone-common', 'flip-phone-rare', 'flip-phone-epic', 'flip-phone-legendary',
];
const baseState = {
  version: 3,
  discoveredStandard: [],
  discoveredSecrets: [],
  chips: 220,
  signal: 0,
  overchargeHundredths: 100,
  activeLootPoolId: 'y2k-essentials',
  totalOpens: 10,
  pendingReveal: null,
  muted: true,
  stats: { duplicates: 0, hiddenPockets: 0 },
};

await fs.rm(outDir, { recursive: true, force: true });
await fs.mkdir(outDir, { recursive: true });

const assertions = [];
const errors = [];
const failedRequests = [];
const badResponses = [];
const captures = [];
const assert = (name, pass, observed) => assertions.push({ name, pass: Boolean(pass), observed });

const readSave = page => page.evaluate(key => {
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : null;
}, SAVE_KEY);

const waitGame = async page => {
  await page.locator('#game canvas').waitFor({ state: 'visible', timeout: 20000 });
  await page.waitForFunction(() => document.querySelector('#orientation-gate')?.getAttribute('data-visible') !== 'true');
  await page.waitForTimeout(500);
  await page.evaluate(() => {
    const panel = document.querySelector('.mpt-debug-panel');
    if (panel) panel.style.display = 'none';
  });
};

const tap = async (page, x, y, hold = 24) => {
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.waitForTimeout(hold);
  await page.mouse.up();
};

const realTear = async (page, width, beforeOpens) => {
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

const fastForward = async (page, width) => {
  for (let index = 0; index < 7; index += 1) {
    await tap(page, width / 2, 420, 20);
    await page.waitForTimeout(90);
  }
};

const settle = async (page, width) => {
  await page.waitForTimeout(360);
  for (let index = 0; index < 4; index += 1) {
    await tap(page, width / 2, 585, 24);
    await page.waitForTimeout(130);
  }
  await page.waitForTimeout(900);
};

const wireDiagnostics = (page, scenario) => {
  page.on('pageerror', error => errors.push({ scenario, kind: 'pageerror', message: error.message, stack: error.stack ?? null }));
  page.on('console', message => {
    if (message.type() === 'error') errors.push({ scenario, kind: 'console-error', message: message.text() });
  });
  page.on('requestfailed', request => failedRequests.push({ scenario, url: request.url(), failure: request.failure()?.errorText ?? 'unknown' }));
  page.on('response', response => {
    if (response.status() >= 400) badResponses.push({ scenario, status: response.status(), url: response.url() });
  });
};

const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] });
let fatal = null;

const runScenario = async ({ name, width, locale, state, expected, stressOpens = 1 }) => {
  const context = await browser.newContext({ viewport: { width, height: 720 }, locale });
  const page = await context.newPage();
  wireDiagnostics(page, name);
  await page.goto('http://127.0.0.1:5173/?debug=1&platform=mock', { waitUntil: 'domcontentloaded' });
  await waitGame(page);
  await page.evaluate(({ key, value }) => localStorage.setItem(key, JSON.stringify(value)), { key: SAVE_KEY, value: state });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await waitGame(page);

  for (let index = 1; index <= stressOpens; index += 1) {
    const before = await readSave(page);
    if (!before || before.pendingReveal) throw new Error(`${name} opening ${index}: invalid idle state`);
    const attempt = await realTear(page, width, before.totalOpens);
    if (!attempt) throw new Error(`${name} opening ${index}: tear failed`);
    const staged = await waitPending(page, before.totalOpens);
    const pending = staged.pendingReveal;
    if (!pending) throw new Error(`${name} opening ${index}: pending missing`);
    if (index === 1) {
      for (const [key, predicate] of Object.entries(expected)) {
        assert(`${name}-${key}`, predicate(pending), pending);
      }
    }
    await fastForward(page, width);
    await waitCommitted(page, before.totalOpens + 1);
    await page.waitForTimeout(300);
    if (index === 1 || index === stressOpens) {
      const file = `${name}-${String(index).padStart(2, '0')}.png`;
      await page.screenshot({ path: path.join(outDir, file) });
      captures.push({ name, index, file, pending });
    }
    if (index < stressOpens) await settle(page, width);
  }
  await context.close();
};

try {
  await runScenario({
    name: 'en-1280-max-retained',
    width: 1280,
    locale: 'en-US',
    state: { ...baseState, discoveredStandard: allStandard, signal: 4, overchargeHundredths: 150, totalOpens: 20 },
    stressOpens: 8,
    expected: {
      duplicate: pending => pending.standard.isNew === false,
      retained: pending => pending.signal.lockRetained === true,
      max: pending => pending.overcharge.beforeHundredths === 150 && pending.overcharge.afterHundredths === 150,
      bonus: pending => pending.chips.overchargeBonus > 0,
    },
  });
  await runScenario({
    name: 'ru-900-max-retained',
    width: 900,
    locale: 'ru-RU',
    state: { ...baseState, discoveredStandard: allStandard, signal: 4, overchargeHundredths: 150, totalOpens: 20 },
    expected: {
      duplicate: pending => pending.standard.isNew === false,
      retained: pending => pending.signal.lockRetained === true,
      max: pending => pending.overcharge.afterHundredths === 150,
      bonus: pending => pending.chips.overchargeBonus > 0,
    },
  });
  await runScenario({
    name: 'en-1280-cashout',
    width: 1280,
    locale: 'en-US',
    state: { ...baseState, discoveredStandard: allStandard.filter(id => id !== 'camera-epic'), signal: 4, overchargeHundredths: 150, totalOpens: 30 },
    expected: {
      newItem: pending => pending.standard.isNew === true,
      consumed: pending => pending.signal.lockConsumed === true,
      reset: pending => pending.overcharge.afterHundredths === 100,
      bonus: pending => pending.chips.overchargeBonus > 0,
    },
  });
  await runScenario({
    name: 'en-1280-duplicate',
    width: 1280,
    locale: 'en-US',
    state: { ...baseState, discoveredStandard: allStandard, signal: 0, overchargeHundredths: 100, totalOpens: 40 },
    expected: {
      duplicate: pending => pending.standard.isNew === false,
      recycle: pending => pending.chips.recycle > 0,
      inactiveOvercharge: pending => pending.chips.overchargeBonus === 0,
    },
  });
} catch (error) {
  fatal = error instanceof Error ? { message: error.message, stack: error.stack } : { message: String(error) };
} finally {
  await browser.close();
}

assert('no-runtime-errors', errors.length === 0, errors);
assert('no-request-failures', failedRequests.length === 0, failedRequests);
assert('no-http-errors', badResponses.length === 0, badResponses);
const report = { totalAssertions: assertions.length, failedAssertions: assertions.filter(item => !item.pass), assertions, fatal, errors, failedRequests, badResponses, captures };
await fs.writeFile(path.join(outDir, 'report.json'), JSON.stringify(report, null, 2));
if (fatal || report.failedAssertions.length > 0) {
  console.error(JSON.stringify(report, null, 2));
  process.exitCode = 1;
} else {
  console.log(JSON.stringify(report, null, 2));
}
