import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const PRODUCT_HEAD = '40db07a3c8069ef8ca01c5c35de0c355337d410e';
const SAVE_KEY = 'mystery-pocket-tech.save';
const outDir = '/tmp/phase26-cashout-visual-r3';
const assertions = [];
const errors = [];
const failedRequests = [];
const badResponses = [];

await fs.rm(outDir, { recursive: true, force: true });
await fs.mkdir(outDir, { recursive: true });

const assert = (name, pass, observed) => assertions.push({ name, pass: Boolean(pass), observed });
const baseSave = () => ({
  version: 3,
  discoveredStandard: [],
  discoveredSecrets: [],
  chips: 200,
  signal: 4,
  overchargeHundredths: 150,
  activeLootPoolId: 'y2k-essentials',
  totalOpens: 10,
  pendingReveal: null,
  muted: false,
  stats: { duplicates: 0, hiddenPockets: 0 },
});

const waitGame = async page => {
  await page.locator('#game canvas').waitFor({ state: 'visible', timeout: 20000 });
  await page.waitForFunction(() => document.querySelector('#orientation-gate')?.getAttribute('data-visible') !== 'true');
  await page.waitForTimeout(500);
};
const hideDebug = async page => {
  const panel = page.locator('.mpt-debug-panel');
  if (await panel.count()) await panel.evaluate(el => { el.style.display = 'none'; });
};
const readSave = page => page.evaluate(key => {
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : null;
}, SAVE_KEY);
const setSave = async (page, value) => {
  await page.evaluate(({ key, value }) => localStorage.setItem(key, JSON.stringify(value)), { key: SAVE_KEY, value });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await waitGame(page);
};
const tap = async (page, x, y, hold = 50) => {
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
  });
};

const runScenario = async ({ locale, width, tag }) => {
  const ctx = await browser.newContext({
    viewport: { width, height: 720 },
    locale,
    recordVideo: { dir: outDir, size: { width, height: 720 } },
  });
  const page = await ctx.newPage();
  wireDiagnostics(page, tag);
  await page.goto('http://127.0.0.1:5173/?debug=1&platform=mock', { waitUntil: 'domcontentloaded' });
  await waitGame(page);
  await setSave(page, baseSave());

  const before = await readSave(page);
  assert(`${tag}-armed-before`, before?.signal === 4 && before?.overchargeHundredths === 150, before);

  await Promise.all([
    page.waitForEvent('framenavigated', { timeout: 10000 }),
    page.getByRole('button', { name: 'Consume SIGNAL LOCK', exact: true }).click(),
  ]);
  await waitGame(page);
  await hideDebug(page);

  await page.waitForFunction(
    ({ key, expected }) => {
      const raw = localStorage.getItem(key);
      if (!raw) return false;
      const state = JSON.parse(raw);
      return state.totalOpens === expected && state.pendingReveal === null;
    },
    { key: SAVE_KEY, expected: 11 },
    { timeout: 15000 },
  );
  const committed = await readSave(page);
  assert(`${tag}-commit-once`, committed?.totalOpens === 11 && committed?.pendingReveal === null, committed);
  assert(`${tag}-durable-reset-after-consume`, committed?.signal === 0 && committed?.overchargeHundredths === 100, {
    signal: committed?.signal,
    overchargeHundredths: committed?.overchargeHundredths,
  });

  // Capture the cash-out result. It must visually keep the pre-opening 4/4 lock and multiplier.
  await page.waitForTimeout(2400);
  await page.screenshot({ path: path.join(outDir, `${tag}-cashout-result.png`) });

  const beforeAck = await readSave(page);
  assert(`${tag}-result-hold-no-mutation`, JSON.stringify(beforeAck) === JSON.stringify(committed), beforeAck);

  // Two separate gestures are deliberate: the first may finish any remaining result presentation;
  // the second acknowledges the now-actionable result. During banking, a second gesture is only a safe fast-forward.
  await tap(page, width / 2, 585, 55);
  await page.waitForTimeout(1200);
  await tap(page, width / 2, 585, 55);
  await page.waitForTimeout(3400);
  await page.screenshot({ path: path.join(outDir, `${tag}-idle-after-discharge.png`) });
  const stable = await readSave(page);
  assert(`${tag}-banking-no-durable-mutation`, JSON.stringify(stable) === JSON.stringify(committed), stable);
  assert(`${tag}-idle-reset-state`, stable?.signal === 0 && stable?.overchargeHundredths === 100, {
    signal: stable?.signal,
    overchargeHundredths: stable?.overchargeHundredths,
  });

  await ctx.close();
};

const browser = await chromium.launch({
  channel: 'chrome',
  headless: true,
  args: ['--use-angle=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'],
});

let fatal = null;
try {
  await runScenario({ locale: 'ru-RU', width: 900, tag: 'ru-900' });
  await runScenario({ locale: 'en-US', width: 1280, tag: 'en-1280' });
} catch (error) {
  fatal = error;
  errors.push({ tag: 'harness', kind: 'fatal', message: error instanceof Error ? error.stack ?? error.message : String(error) });
} finally {
  await browser.close();
}

assert('no-runtime-errors', errors.length === 0, errors);
assert('no-request-failures', failedRequests.length === 0, failedRequests);
assert('no-http-errors', badResponses.length === 0, badResponses);

const report = { auditedProductHead: PRODUCT_HEAD, assertions, errors, failedRequests, badResponses };
await fs.writeFile(path.join(outDir, 'report.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify({
  auditedProductHead: PRODUCT_HEAD,
  assertions: assertions.length,
  failedAssertions: assertions.filter(entry => !entry.pass).map(entry => entry.name),
  errors: errors.length,
  failedRequests: failedRequests.length,
  badResponses: badResponses.length,
}, null, 2));

if (fatal || assertions.some(entry => !entry.pass)) process.exitCode = 1;
