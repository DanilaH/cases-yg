import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const SAVE_KEY = 'mystery-pocket-tech.save';
const OUT_DIR = '/tmp/secret-presentation-acceptance-r1';
const PRODUCT_SHA = '629d5beb666aa9365ce7197082938ea1a50d9d15';
const allStandard = [
  'camera-common', 'camera-rare', 'camera-epic', 'camera-legendary',
  'flip-phone-common', 'flip-phone-rare', 'flip-phone-epic', 'flip-phone-legendary',
];
const allSecrets = ['camera-secret-cosmic', 'flip-phone-secret-noir'];

const baseState = {
  version: 4,
  discoveredStandard: allStandard,
  discoveredSecrets: [],
  chips: 500,
  signal: 0,
  overchargeHundredths: 100,
  activeLootPoolId: 'y2k-essentials',
  totalOpens: 12,
  pendingReveal: null,
  muted: true,
  stats: { duplicates: 5, hiddenPockets: 0 },
};

await fs.rm(OUT_DIR, { recursive: true, force: true });
await fs.mkdir(OUT_DIR, { recursive: true });

const assertions = [];
const diagnostics = [];
const captures = [];
let fatal = null;

const assert = (name, pass, observed) => {
  assertions.push({ name, pass: Boolean(pass), observed });
};

const readSave = page => page.evaluate(key => {
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : null;
}, SAVE_KEY);

const writeSave = (page, state) => page.evaluate(({ key, state }) => {
  localStorage.setItem(key, JSON.stringify(state));
}, { key: SAVE_KEY, state });

const hideDebugPanel = page => page.evaluate(() => {
  const panel = document.querySelector('.mpt-debug-panel');
  if (panel) panel.style.display = 'none';
});

const forceDeterministicHiddenPocket = page => page.evaluate(() => {
  window.__mptAuditOriginalRandom = Math.random;
  Math.random = () => 0;
});

const restoreRandom = page => page.evaluate(() => {
  if (typeof window.__mptAuditOriginalRandom === 'function') {
    Math.random = window.__mptAuditOriginalRandom;
    delete window.__mptAuditOriginalRandom;
  }
});

const waitGame = async page => {
  await page.locator('#game canvas').waitFor({ state: 'visible', timeout: 20000 });
  await page.waitForFunction(() => document.querySelector('#orientation-gate')?.getAttribute('data-visible') !== 'true');
  await page.waitForTimeout(500);
  await hideDebugPanel(page);
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
    await page.waitForTimeout(45);
    for (let step = 1; step <= 14; step += 1) {
      await page.mouse.move(startX + (312 * step) / 14, startY, { steps: 1 });
      await page.waitForTimeout(12);
    }
    await page.mouse.up();
    await page.waitForTimeout(140);
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

const swipe = async (page, fromX, toX, y = 326) => {
  await page.mouse.move(fromX, y);
  await page.mouse.down();
  await page.waitForTimeout(30);
  await page.mouse.move(toX, y, { steps: 8 });
  await page.waitForTimeout(30);
  await page.mouse.up();
  await page.waitForTimeout(360);
};

const screenshot = async (page, file, meta = {}) => {
  await page.screenshot({ path: path.join(OUT_DIR, file) });
  captures.push({ file, ...meta });
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

const browser = await chromium.launch({
  channel: 'chrome',
  headless: true,
  args: ['--use-angle=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'],
});

const runScenario = async ({ name, width, locale, state, mode }) => {
  const context = await browser.newContext({
    viewport: { width, height: 720 },
    locale,
    recordVideo: { dir: OUT_DIR, size: { width, height: 720 } },
  });
  const page = await context.newPage();
  wireDiagnostics(page, name);
  await page.goto('http://127.0.0.1:5173/?debug=1&platform=mock', { waitUntil: 'domcontentloaded' });
  await waitGame(page);
  await writeSave(page, state);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await waitGame(page);
  await forceDeterministicHiddenPocket(page);

  const before = await readSave(page);
  assert(`${name}-valid-idle-v4`, before?.version === 4 && before.pendingReveal === null, before);
  const attempt = await realTear(page, width, before.totalOpens);
  assert(`${name}-tear-acquired`, attempt > 0, { attempt });
  if (!attempt) throw new Error(`${name}: could not acquire/tear pouch`);

  const staged = await waitPending(page, before.totalOpens);
  await restoreRandom(page);
  const pending = staged?.pendingReveal;
  if (!pending) throw new Error(`${name}: pending reveal missing after tear`);

  assert(`${name}-hidden-pocket`, pending.hiddenPocket !== null, pending.hiddenPocket);
  assert(`${name}-secret-bonus-40`, pending.chips.secretBonus === 40 && pending.hiddenPocket?.bonusChips === 40, pending.chips);
  assert(
    `${name}-secret-not-overcharged`,
    pending.chips.totalEarned === pending.chips.rawEarned + pending.chips.overchargeBonus + pending.chips.secretBonus,
    pending.chips,
  );

  if (mode === 'new') {
    assert(`${name}-secret-is-new`, pending.hiddenPocket?.isNew === true, pending.hiddenPocket);
  }
  if (mode === 'duplicate') {
    assert(`${name}-secret-is-duplicate`, pending.hiddenPocket?.isNew === false, pending.hiddenPocket);
    assert(`${name}-duplicate-collection-unchanged`, pending.commit.discoveredSecrets.length === state.discoveredSecrets.length, pending.commit.discoveredSecrets);
  }

  if (mode === 'recovery') {
    const stagedId = pending.id;
    const stagedHidden = pending.hiddenPocket;
    await page.reload({ waitUntil: 'domcontentloaded' });
    await waitGame(page);
    const recovered = await waitCommitted(page, before.totalOpens + 1);
    assert(`${name}-recovery-committed`, recovered.pendingReveal === null && recovered.totalOpens === before.totalOpens + 1, recovered);
    assert(`${name}-recovery-wallet-exact`, recovered.chips === pending.chips.after, { expected: pending.chips.after, actual: recovered.chips });
    assert(`${name}-recovery-secret-id-preserved`, recovered.discoveredSecrets.includes(stagedHidden.collectibleId), { stagedId, stagedHidden, recovered: recovered.discoveredSecrets });
    await page.waitForTimeout(1350);
    await screenshot(page, `${name}-recovered-settle.png`, { pending });
    await page.waitForTimeout(3200);
    await screenshot(page, `${name}-recovered-persistent-4s.png`, { pending });
  } else if (mode === 'fast-forward') {
    let committed = null;
    for (let i = 0; i < 24 && !committed; i += 1) {
      await page.waitForTimeout(i === 0 ? 140 : 70);
      await tap(page, width / 2, 420, 18);
      const now = await readSave(page);
      if (now?.totalOpens === before.totalOpens + 1 && now.pendingReveal === null) committed = now;
    }
    committed ??= await waitCommitted(page, before.totalOpens + 1);
    assert(`${name}-fast-forward-committed`, committed.totalOpens === before.totalOpens + 1 && committed.pendingReveal === null, committed);
    assert(`${name}-fast-forward-wallet-exact`, committed.chips === pending.chips.after, { expected: pending.chips.after, actual: committed.chips });
    await page.waitForTimeout(1250);
    await screenshot(page, `${name}-fast-forward-result.png`, { pending });
  } else {
    const committed = await waitCommitted(page, before.totalOpens + 1);
    assert(`${name}-committed`, committed.pendingReveal === null && committed.totalOpens === before.totalOpens + 1, committed);
    assert(`${name}-wallet-exact`, committed.chips === pending.chips.after, { expected: pending.chips.after, actual: committed.chips });
    if (pending.hiddenPocket?.isNew) {
      assert(`${name}-new-secret-added-once`, committed.discoveredSecrets.includes(pending.hiddenPocket.collectibleId), committed.discoveredSecrets);
    }

    await page.waitForTimeout(1300);
    await screenshot(page, `${name}-secret-settle.png`, { pending });
    await page.waitForTimeout(3400);
    await screenshot(page, `${name}-secret-persistent-4s.png`, { pending });

    const centerX = width / 2;
    await swipe(page, centerX, centerX + 160);
    await screenshot(page, `${name}-standard-page.png`, { pending });
    await swipe(page, centerX, centerX - 160);
    await screenshot(page, `${name}-secret-page-return.png`, { pending });
  }

  const video = page.video();
  await context.close();
  if (video) {
    const source = await video.path();
    const target = path.join(OUT_DIR, `${name}.webm`);
    await fs.rename(source, target).catch(async () => {
      await fs.copyFile(source, target);
    });
    captures.push({ file: `${name}.webm`, kind: 'video' });
  }
};

try {
  await runScenario({
    name: 'new-secret-en-1280',
    width: 1280,
    locale: 'en-US',
    state: { ...baseState, discoveredSecrets: [] },
    mode: 'new',
  });

  await runScenario({
    name: 'duplicate-secret-ru-900',
    width: 900,
    locale: 'ru-RU',
    state: { ...baseState, discoveredSecrets: allSecrets, totalOpens: 22, stats: { duplicates: 9, hiddenPockets: 2 } },
    mode: 'duplicate',
  });

  await runScenario({
    name: 'recovery-secret-en-1280',
    width: 1280,
    locale: 'en-US',
    state: { ...baseState, discoveredSecrets: [], totalOpens: 32, stats: { duplicates: 12, hiddenPockets: 1 } },
    mode: 'recovery',
  });

  await runScenario({
    name: 'fast-forward-secret-en-1280',
    width: 1280,
    locale: 'en-US',
    state: { ...baseState, discoveredSecrets: [], totalOpens: 42, stats: { duplicates: 15, hiddenPockets: 2 } },
    mode: 'fast-forward',
  });
} catch (error) {
  fatal = error instanceof Error ? { message: error.message, stack: error.stack } : { message: String(error) };
} finally {
  await browser.close();
}

assert('no-runtime-request-http-errors', diagnostics.length === 0, diagnostics);
const failedAssertions = assertions.filter(item => !item.pass);
const report = {
  productSha: PRODUCT_SHA,
  totalAssertions: assertions.length,
  passedAssertions: assertions.length - failedAssertions.length,
  failedAssertions,
  assertions,
  diagnostics,
  fatal,
  captures,
};
await fs.writeFile(path.join(OUT_DIR, 'report.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
if (fatal || failedAssertions.length > 0) process.exitCode = 1;
