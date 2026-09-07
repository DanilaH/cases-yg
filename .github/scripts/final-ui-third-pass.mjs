import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const PRODUCT_HEAD = '7a47bab77e27ffa1d92111ffd12283901314ea3d';
const SAVE_KEY = 'mystery-pocket-tech.save';
const SETTINGS_KEY = 'mystery-pocket-tech.settings';
const outDir = '/tmp/final-ui-third-pass';
const errors = [];
const failedRequests = [];
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

const waitLandscape = async (page) => {
  await page.waitForSelector('#game canvas', { state: 'visible', timeout: 20_000 });
  await page.waitForFunction(() => document.querySelector('#orientation-gate')?.getAttribute('data-visible') !== 'true');
  await page.waitForTimeout(500);
};

const hideDebug = async (page) => page.evaluate(() => {
  const panel = document.querySelector('.mpt-debug-panel');
  if (panel) panel.style.display = 'none';
});
const showDebug = async (page) => page.evaluate(() => {
  const panel = document.querySelector('.mpt-debug-panel');
  if (panel) panel.style.display = '';
});
const shot = (page, name) => page.screenshot({ path: `${outDir}/${name}.png` });
const tap = async (page, x, y, hold = 70) => {
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.waitForTimeout(hold);
  await page.mouse.up();
};
const setSaveAndReload = async (page, save) => {
  await page.evaluate(({ key, value }) => localStorage.setItem(key, JSON.stringify(value)), { key: SAVE_KEY, value: save });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await waitLandscape(page);
  await hideDebug(page);
};
const stage = async (page, buttonName) => {
  await showDebug(page);
  await Promise.all([
    page.waitForEvent('framenavigated', { timeout: 10_000 }),
    page.getByRole('button', { name: buttonName, exact: true }).click(),
  ]);
  await waitLandscape(page);
  await hideDebug(page);
};
const readSave = (page) => page.evaluate((key) => {
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : null;
}, SAVE_KEY);
const waitCommitted = async (page, totalOpens) => {
  await page.waitForFunction(({ key, totalOpens }) => {
    const raw = localStorage.getItem(key);
    if (!raw) return false;
    try {
      const save = JSON.parse(raw);
      return save.pendingReveal === null && save.totalOpens === totalOpens;
    } catch { return false; }
  }, { key: SAVE_KEY, totalOpens }, { timeout: 25_000 });
};

// A. Fresh compact account: disabled Charged, partial tear cancellation, pre-first-open mute availability.
const freshContext = await browser.newContext({
  viewport: { width: 800, height: 720 }, locale: 'ru-RU',
  recordVideo: { dir: outDir, size: { width: 800, height: 720 } },
});
const fresh = await freshContext.newPage();
attachDiagnostics(fresh, 'fresh-compact');
await fresh.goto('http://127.0.0.1:5173/?debug=1&platform=mock', { waitUntil: 'domcontentloaded' });
await waitLandscape(fresh);
await setSaveAndReload(fresh, baseSave());
await shot(fresh, '00-fresh-ru-800-idle');

// Clicking the unavailable Charged selector must not mutate save or start an opening.
await tap(fresh, 120, 305);
await fresh.waitForTimeout(250);
await shot(fresh, '01-fresh-after-disabled-charged-tap');
let save = await readSave(fresh);
assertions.push({ name: 'disabled-charged-does-not-open', pass: save?.totalOpens === 0 && save?.pendingReveal === null, observed: save });

// Start a sub-threshold tear drag and release. It must visibly recover and keep save untouched.
await fresh.mouse.move(235, 172);
await fresh.mouse.down();
await fresh.mouse.move(278, 172, { steps: 5 });
await fresh.waitForTimeout(120);
await shot(fresh, '02-partial-tear-held');
await fresh.mouse.up();
await fresh.waitForTimeout(260);
await shot(fresh, '03-partial-tear-recovered');
save = await readSave(fresh);
assertions.push({ name: 'partial-tear-cancel-is-non-transactional', pass: save?.totalOpens === 0 && save?.pendingReveal === null, observed: save });

// A player should be able to mute before the first audible opening. Current UI has no control here;
// retain this as an evidence-backed finding while allowing later scenarios to run.
await tap(fresh, 710, 52);
await fresh.waitForTimeout(350);
await shot(fresh, '04-pre-first-open-mute-attempt');
const settingsAfterMute = await fresh.evaluate((key) => {
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : null;
}, SETTINGS_KEY);
assertions.push({ name: 'mute-available-before-first-opening', pass: settingsAfterMute?.muted === true, observed: settingsAfterMute });
await fresh.reload({ waitUntil: 'domcontentloaded' });
await waitLandscape(fresh);
await hideDebug(fresh);
await shot(fresh, '05-fresh-after-reload');

// Collection entry is intentionally absent before the first opening; verify stray bottom-corner taps do nothing.
await tap(fresh, 705, 664);
await fresh.waitForTimeout(350);
await shot(fresh, '06-fresh-after-collection-area-tap');
save = await readSave(fresh);
assertions.push({ name: 'hidden-collection-area-does-not-mutate-fresh-save', pass: save?.totalOpens === 0 && save?.pendingReveal === null, observed: save });
await freshContext.close();

// B. Rapid result taps / banking skip must remain idempotent.
// Debug staging normalizes totalOpens to at least 3, so the staged reveal commits as opening #4.
const rapidContext = await browser.newContext({
  viewport: { width: 1280, height: 720 }, locale: 'en-US',
  recordVideo: { dir: outDir, size: { width: 1280, height: 720 } },
});
const rapid = await rapidContext.newPage();
attachDiagnostics(rapid, 'rapid-taps');
await rapid.goto('http://127.0.0.1:5173/?debug=1&platform=mock', { waitUntil: 'domcontentloaded' });
await waitLandscape(rapid);
await setSaveAndReload(rapid, baseSave());
await stage(rapid, 'Force Common');
await waitCommitted(rapid, 4);
await rapid.waitForTimeout(1050);
await shot(rapid, '10-common-result-before-rapid-taps');
for (let i = 0; i < 7; i += 1) {
  await tap(rapid, 640, 568, 25);
  await rapid.waitForTimeout(45);
}
await rapid.waitForTimeout(1400);
await shot(rapid, '11-after-rapid-result-taps');
save = await readSave(rapid);
assertions.push({ name: 'rapid-result-taps-are-idempotent', pass: save?.totalOpens === 4 && save?.pendingReveal === null, observed: save });
await rapidContext.close();

// C. Enter portrait while a result is live, then return to landscape. Result state must survive.
const rotateContext = await browser.newContext({ viewport: { width: 1280, height: 720 }, locale: 'ru-RU' });
const rotate = await rotateContext.newPage();
attachDiagnostics(rotate, 'result-rotate');
await rotate.goto('http://127.0.0.1:5173/?debug=1&platform=mock', { waitUntil: 'domcontentloaded' });
await waitLandscape(rotate);
await setSaveAndReload(rotate, baseSave());
await stage(rotate, 'Force Rare');
await waitCommitted(rotate, 4);
await rotate.waitForTimeout(900);
await shot(rotate, '20-rare-result-before-portrait');
await rotate.setViewportSize({ width: 430, height: 900 });
await rotate.waitForFunction(() => document.querySelector('#orientation-gate')?.getAttribute('data-visible') === 'true');
await hideDebug(rotate);
await rotate.waitForTimeout(350);
await shot(rotate, '21-result-portrait-gate');
await rotate.setViewportSize({ width: 1280, height: 720 });
await rotate.waitForFunction(() => document.querySelector('#orientation-gate')?.getAttribute('data-visible') !== 'true');
await rotate.waitForTimeout(650);
await shot(rotate, '22-result-after-portrait-return');
save = await readSave(rotate);
assertions.push({ name: 'result-survives-orientation-block', pass: save?.totalOpens === 4 && save?.pendingReveal === null, observed: save });
await rotateContext.close();

// D. Pending reveal recovery: staged transaction reloads into recovery and commits exactly once.
const recoveryContext = await browser.newContext({
  viewport: { width: 1024, height: 720 }, locale: 'en-US',
  recordVideo: { dir: outDir, size: { width: 1024, height: 720 } },
});
const recovery = await recoveryContext.newPage();
attachDiagnostics(recovery, 'pending-recovery');
await recovery.goto('http://127.0.0.1:5173/?debug=1&platform=mock', { waitUntil: 'domcontentloaded' });
await waitLandscape(recovery);
await setSaveAndReload(recovery, baseSave({ chips: 120 }));
await stage(recovery, 'Force Epic');
for (let i = 0; i < 8; i += 1) {
  await recovery.waitForTimeout(180);
  await shot(recovery, `30-recovery-${String(i).padStart(2, '0')}`);
}
await waitCommitted(recovery, 4);
await recovery.waitForTimeout(850);
await shot(recovery, '31-recovery-result-settled');
save = await readSave(recovery);
assertions.push({ name: 'pending-recovery-commits-once', pass: save?.totalOpens === 4 && save?.pendingReveal === null, observed: save });
await recoveryContext.close();

await fs.writeFile(`${outDir}/report.json`, JSON.stringify({
  auditedProductHead: PRODUCT_HEAD,
  auditHead: process.env.GITHUB_SHA ?? null,
  assertions,
  errors,
  failedRequests,
}, null, 2));

await browser.close();
if (assertions.some((entry) => !entry.pass) || errors.length || failedRequests.length) process.exitCode = 1;
