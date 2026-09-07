import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const PRODUCT_HEAD = 'ac6ab29cb3bdd521a2fcabf723290816947e4b85';
const SAVE_KEY = 'mystery-pocket-tech.save';
const SETTINGS_KEY = 'mystery-pocket-tech.settings';
const outDir = '/tmp/final-independent-acceptance-r1';
const errors = [];
const failedRequests = [];
const syntheticAssetRequests = [];
const assertions = [];

await fs.rm(outDir, { recursive: true, force: true });
await fs.mkdir(outDir, { recursive: true });

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

const browser = await chromium.launch({
  headless: true,
  channel: 'chrome',
  args: ['--use-angle=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'],
});

const wireDiagnostics = (page, tag) => {
  page.on('pageerror', error => errors.push(`${tag}: ${error.message}`));
  page.on('console', message => {
    if (message.type() === 'error') errors.push(`${tag}: ${message.text()}`);
  });
  page.on('request', request => {
    const url = request.url();
    if (url.includes('pouch-grab.mp3') || url.includes('chip-clack.mp3')) {
      syntheticAssetRequests.push({ tag, url });
    }
  });
  page.on('requestfailed', request => {
    failedRequests.push({ tag, url: request.url(), error: request.failure()?.errorText ?? 'unknown' });
  });
};

const waitGame = async page => {
  await page.waitForSelector('#game canvas', { state: 'visible', timeout: 20000 });
  await page.waitForFunction(() => document.querySelector('#orientation-gate')?.getAttribute('data-visible') !== 'true');
  await page.waitForTimeout(500);
};

const hideDebug = page => page.evaluate(() => {
  const panel = document.querySelector('.mpt-debug-panel');
  if (panel) panel.style.display = 'none';
});
const showDebug = page => page.evaluate(() => {
  const panel = document.querySelector('.mpt-debug-panel');
  if (panel) panel.style.display = '';
});
const shot = (page, name) => page.screenshot({ path: `${outDir}/${name}.png` });
const tap = async (page, x, y, hold = 55) => {
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
const stageScenario = async (page, name) => {
  await showDebug(page);
  await Promise.all([
    page.waitForEvent('framenavigated', { timeout: 10000 }),
    page.getByRole('button', { name, exact: true }).click(),
  ]);
  await waitGame(page);
  await hideDebug(page);
};
const assert = (name, pass, observed) => assertions.push({ name, pass: Boolean(pass), observed });

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
    if (
      state?.pendingReveal?.openingNumber === beforeOpens + 1 ||
      state?.totalOpens === beforeOpens + 1
    ) {
      return attempt + 1;
    }
  }
  return 0;
};

const finishPendingPresentation = async (page, width, beforeOpens, tag) => {
  await page.waitForFunction(
    ({ key, before }) => {
      const raw = localStorage.getItem(key);
      if (!raw) return false;
      try {
        const state = JSON.parse(raw);
        return (
        state.totalOpens === before &&
        state.pendingReveal !== null &&
        state.pendingReveal.openingNumber === before + 1
      );
      } catch {
        return false;
      }
    },
    { key: SAVE_KEY, before: beforeOpens },
    { timeout: 12000 },
  );

  for (let attempt = 0; attempt < 22; attempt += 1) {
    const state = await readSave(page);
    if (state?.pendingReveal === null) break;
    await tap(page, width / 2, 585, 45);
    await page.waitForTimeout(150);
  }

  const afterAck = await readSave(page);
  assert(`${tag}-pending-cleared`, afterAck?.pendingReveal === null, afterAck?.pendingReveal ?? null);

  // If acknowledge already cleared persistence while visual banking is still running,
  // these are harmless separate gestures outside the idle pouch and fast-forward only presentation.
  for (let i = 0; i < 4; i += 1) {
    await tap(page, width / 2, 585, 40);
    await page.waitForTimeout(110);
  }
  await page.waitForTimeout(500);
};

// A. A real repeated-play session: ten production drag/reveal/collect loops in one Phaser activation.
{
  const width = 1280;
  const ctx = await browser.newContext({
    viewport: { width, height: 720 },
    locale: 'en-US',
    recordVideo: { dir: outDir, size: { width, height: 720 } },
  });
  const page = await ctx.newPage();
  wireDiagnostics(page, 'repeat-session');
  await page.goto('http://127.0.0.1:5173/?debug=1&platform=mock', { waitUntil: 'domcontentloaded' });
  await waitGame(page);
  await page.evaluate(({ saveKey, settingsKey }) => {
    localStorage.removeItem(saveKey);
    localStorage.removeItem(settingsKey);
  }, { saveKey: SAVE_KEY, settingsKey: SETTINGS_KEY });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await waitGame(page);
  await hideDebug(page);
  await shot(page, '00-repeat-fresh-idle');

  for (let index = 1; index <= 10; index += 1) {
    const before = (await readSave(page)) ?? baseSave();
    const tearAttempts = await realTear(page, width, before.totalOpens);
    assert(`repeat-${index}-star-acquired`, tearAttempts > 0, tearAttempts);
    if (tearAttempts === 0) throw new Error(`repeat-${index}: star could not be acquired inside hit area`);
    await finishPendingPresentation(page, width, before.totalOpens, `repeat-${index}`);
    const after = await readSave(page);
    assert(`repeat-${index}-one-open`, after?.totalOpens === before.totalOpens + 1, {
      before: before.totalOpens,
      after: after?.totalOpens,
    });
    assert(`repeat-${index}-valid-wallet`, Number.isInteger(after?.chips) && after.chips >= 0, after?.chips);
    assert(`repeat-${index}-valid-signal`, Number.isInteger(after?.signal) && after.signal >= 0 && after.signal <= 4, after?.signal);
    if ([1, 5, 10].includes(index)) await shot(page, `0${index}-repeat-idle-after-open`);

    if (index === 3) {
      await tap(page, width - 65, 55);
      await page.waitForTimeout(180);
      const settings = await page.evaluate(key => localStorage.getItem(key), SETTINGS_KEY);
      assert('repeat-mute-setting-written', Boolean(settings && JSON.parse(settings).muted === true), settings);
    }
  }

  const finalSave = await readSave(page);
  assert('repeat-session-ten-opens', finalSave?.totalOpens === 10, finalSave?.totalOpens);
  await shot(page, '11-repeat-final-idle');
  await ctx.close();
}

// B. Selector semantics around the exact Charged affordability boundary, then one real Charged opening.
{
  const width = 900;
  const ctx = await browser.newContext({
    viewport: { width, height: 720 },
    locale: 'ru-RU',
    recordVideo: { dir: outDir, size: { width, height: 720 } },
  });
  const page = await ctx.newPage();
  wireDiagnostics(page, 'charged-boundary');
  await page.goto('http://127.0.0.1:5173/?debug=1&platform=mock', { waitUntil: 'domcontentloaded' });
  await waitGame(page);

  await setSave(page, baseSave({ chips: 59, totalOpens: 12 }));
  await shot(page, '20-charged-59-before');
  await tap(page, 144, 309);
  await page.waitForTimeout(80);
  await shot(page, '21-charged-59-denied-peak');
  await page.waitForTimeout(320);
  const denied = await readSave(page);
  assert('charged-59-no-mutation', denied?.chips === 59 && denied?.totalOpens === 12 && denied?.pendingReveal === null, denied);

  await setSave(page, baseSave({ chips: 60, totalOpens: 12 }));
  await tap(page, 144, 309);
  await page.waitForTimeout(180);
  await shot(page, '22-charged-60-selected');
  const before = await readSave(page);
  const chargedTearAttempts = await realTear(page, width, before.totalOpens);
    assert('charged-star-acquired', chargedTearAttempts > 0, chargedTearAttempts);
    if (chargedTearAttempts === 0) throw new Error('charged: star could not be acquired inside hit area');
    await page.waitForFunction(
    key => {
      const raw = localStorage.getItem(key);
      if (!raw) return false;
      const state = JSON.parse(raw);
      return state.pendingReveal?.pouchType === 'charged';
    },
    SAVE_KEY,
    { timeout: 12000 },
  );
  const pending = await readSave(page);
  assert('charged-real-open-cost-60', pending?.pendingReveal?.chips?.cost === 60, pending?.pendingReveal?.chips);
  await shot(page, '23-charged-real-reveal');
  await finishPendingPresentation(page, width, before.totalOpens, 'charged-real');
  await shot(page, '24-charged-idle-after');
  await ctx.close();
}

// C. Recovery idempotency under an actual second reload while a staged reveal is already recovering.
{
  const width = 1280;
  const ctx = await browser.newContext({
    viewport: { width, height: 720 },
    locale: 'en-US',
    recordVideo: { dir: outDir, size: { width, height: 720 } },
  });
  const page = await ctx.newPage();
  wireDiagnostics(page, 'recovery');
  await page.goto('http://127.0.0.1:5173/?debug=1&platform=mock', { waitUntil: 'domcontentloaded' });
  await waitGame(page);
  await setSave(page, baseSave({ chips: 87, totalOpens: 17 }));
  await showDebug(page);
await Promise.all([
  page.waitForEvent('framenavigated', { timeout: 10000 }),
  page.getByRole('button', { name: 'Force Epic', exact: true }).click(),
]);
await page.waitForLoadState('domcontentloaded');
const first = await readSave(page);
assert('recovery-first-load-has-pending', first?.pendingReveal !== null && first?.totalOpens === 17, {
  totalOpens: first?.totalOpens,
  pending: first?.pendingReveal?.transactionId ?? null,
});

// Reload again immediately, while the first recovery presentation is still active.
await page.reload({ waitUntil: 'domcontentloaded' });
const second = await readSave(page);
const fingerprint = state => state?.pendingReveal ? {
  transactionId: state.pendingReveal.transactionId,
  openingNumber: state.pendingReveal.openingNumber,
  collectibleId: state.pendingReveal.standard?.collectibleId,
  chips: state.pendingReveal.chips,
  signal: state.pendingReveal.signal,
} : null;
assert('recovery-pending-identical-after-second-reload', JSON.stringify(fingerprint(first)) === JSON.stringify(fingerprint(second)), {
  first: fingerprint(first), second: fingerprint(second),
});
await waitGame(page);
await hideDebug(page);
await shot(page, '30-recovery-after-second-reload');
await page.waitForFunction(
  key => {
    const raw = localStorage.getItem(key);
    if (!raw) return false;
    const state = JSON.parse(raw);
    return state.totalOpens === 18 && state.pendingReveal === null;
  },
  SAVE_KEY,
  { timeout: 12000 },
);
const completed = await readSave(page);
assert('recovery-completes-once', completed?.totalOpens === 18 && completed?.pendingReveal === null, completed);
for (let i = 0; i < 5; i += 1) {
  await tap(page, width / 2, 585, 45);
  await page.waitForTimeout(140);
}
await page.reload({ waitUntil: 'domcontentloaded' });
await waitGame(page);
await hideDebug(page);
const afterReload = await readSave(page);
assert('recovery-stays-complete-after-reload', afterReload?.totalOpens === completed?.totalOpens && afterReload?.chips === completed?.chips && afterReload?.pendingReveal === null, {
  completed, afterReload,
});
await shot(page, '31-recovery-final-idle');
  await ctx.close();
}

// D. Fully populated collection, Shelf/Library, resize, and repeated scene reuse without reload.
{
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    locale: 'ru-RU',
    recordVideo: { dir: outDir, size: { width: 1280, height: 720 } },
  });
  const page = await ctx.newPage();
  wireDiagnostics(page, 'collection-cycle');
  await page.goto('http://127.0.0.1:5173/?debug=1&platform=mock', { waitUntil: 'domcontentloaded' });
  await waitGame(page);
  await setSave(page, baseSave({ chips: 120, totalOpens: 3 }));
await showDebug(page);
  await Promise.all([
    page.waitForEvent('framenavigated', { timeout: 10000 }),
    page.getByRole('button', { name: 'Seed all 8/8 + 2/2', exact: true }).click(),
  ]);
  await waitGame(page);
  await hideDebug(page);
  await shot(page, '40-full-collection-opening');

  for (let cycle = 0; cycle < 3; cycle += 1) {
    await tap(page, 1180, 660);
    await page.waitForTimeout(550);
    await shot(page, `41-collection-shelf-cycle-${cycle}`);
    if (cycle === 0) {
      await tap(page, 718, 128);
      await page.waitForTimeout(300);
      await shot(page, '42-collection-library-wide');
      await page.setViewportSize({ width: 900, height: 720 });
      await page.waitForTimeout(350);
      await shot(page, '43-collection-library-compact');
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.waitForTimeout(300);
    }
    await tap(page, 90, 660);
    await waitGame(page);
    await hideDebug(page);
    await page.waitForTimeout(250);
  }
  await shot(page, '44-opening-after-three-collection-cycles');
  const fullSave = await readSave(page);
  assert('collection-cycles-preserve-full-save', fullSave?.discoveredStandard?.length === 8 && fullSave?.discoveredSecrets?.length === 2 && fullSave?.pendingReveal === null, {
    standards: fullSave?.discoveredStandard?.length,
    secrets: fullSave?.discoveredSecrets?.length,
    pending: fullSave?.pendingReveal,
  });
  await ctx.close();
}

// E. Orientation blocking/wake in the same session, with no reload and no save mutation.
{
  const ctx = await browser.newContext({ viewport: { width: 900, height: 720 }, locale: 'en-US' });
  const page = await ctx.newPage();
  wireDiagnostics(page, 'orientation');
  await page.goto('http://127.0.0.1:5173/?debug=1&platform=mock', { waitUntil: 'domcontentloaded' });
  await waitGame(page);
  await setSave(page, baseSave({ chips: 123, signal: 2, totalOpens: 9 }));
  const before = await readSave(page);
  await page.setViewportSize({ width: 620, height: 900 });
  await page.waitForFunction(() => document.querySelector('#orientation-gate')?.getAttribute('data-visible') === 'true');
  await page.waitForTimeout(250);
  await shot(page, '50-orientation-portrait');
  await page.setViewportSize({ width: 900, height: 720 });
  await waitGame(page);
  await hideDebug(page);
  await shot(page, '51-orientation-restored');
  const after = await readSave(page);
  assert('orientation-no-save-mutation', JSON.stringify(before) === JSON.stringify(after), { before, after });
  await ctx.close();
}

const report = {
  auditedProductHead: PRODUCT_HEAD,
  auditHead: process.env.GITHUB_SHA ?? null,
  assertions,
  errors,
  failedRequests,
  syntheticAssetRequests,
};
await fs.writeFile(`${outDir}/report.json`, JSON.stringify(report, null, 2));
await browser.close();

if (assertions.some(item => !item.pass) || errors.length || failedRequests.length || syntheticAssetRequests.length) {
  process.exitCode = 1;
}
