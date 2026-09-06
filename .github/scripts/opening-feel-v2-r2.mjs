import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const PRODUCT_HEAD = 'cc89a6a77c682e6a72b9dd4a4eb06e5c7c20769e';
const SAVE_KEY = 'mystery-pocket-tech.save';
const outDir = '/tmp/opening-feel-v2-r2';
const errors = [];
const failedRequests = [];
const assertions = [];

await fs.rm(outDir, { recursive: true, force: true });
await fs.mkdir(outDir, { recursive: true });

const assert = (condition, label, details = {}) => {
  assertions.push({ label, pass: Boolean(condition), ...details });
  if (!condition) throw new Error(`Assertion failed: ${label} ${JSON.stringify(details)}`);
};

const baseSave = (overrides = {}) => ({
  version: 2,
  discoveredStandard: [],
  discoveredSecrets: [],
  chips: 100,
  signal: 0,
  activeLootPoolId: 'y2k-essentials',
  totalOpens: 6,
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

const context = await browser.newContext({
  viewport: { width: 1280, height: 720 },
  locale: 'en-US',
  recordVideo: { dir: outDir, size: { width: 1280, height: 720 } },
});
const page = await context.newPage();
page.on('pageerror', (error) => errors.push(error.message));
page.on('console', (message) => {
  if (message.type() === 'error') errors.push(message.text());
});
page.on('requestfailed', (request) => failedRequests.push({
  url: request.url(),
  error: request.failure()?.errorText ?? 'unknown',
}));

const waitReady = async () => {
  await page.waitForSelector('#game canvas', { state: 'visible', timeout: 20_000 });
  await page.waitForFunction(() => document.querySelector('#orientation-gate')?.getAttribute('data-visible') !== 'true');
  await page.waitForTimeout(520);
};

const hideDebug = async () => page.evaluate(() => {
  const panel = document.querySelector('.mpt-debug-panel');
  if (panel) panel.style.display = 'none';
});

const shot = async (name) => page.screenshot({ path: `${outDir}/${name}.png` });
const readSave = async () => {
  const raw = await page.evaluate((key) => localStorage.getItem(key), SAVE_KEY);
  return raw ? JSON.parse(raw) : null;
};
const humanTap = async (x, y) => {
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.waitForTimeout(75);
  await page.mouse.up();
};

await page.goto('http://127.0.0.1:5173/?debug=1&platform=mock', { waitUntil: 'domcontentloaded' });
await waitReady();
await page.evaluate(({ key, value }) => localStorage.setItem(key, JSON.stringify(value)), {
  key: SAVE_KEY,
  value: baseSave(),
});
await page.reload({ waitUntil: 'domcontentloaded' });
await waitReady();
await hideDebug();
await shot('00-basic-idle');

// Select Charged through the real scene hit target.
await humanTap(160, 305);
await page.waitForTimeout(180);
await shot('01-charged-selected');
const beforeTear = await readSave();
assert(beforeTear?.chips === 100 && beforeTear?.pendingReveal === null, 'Charged selection does not charge before tear');

// Real pointer drag across the tear path. The same release must not fast-forward the first reveal beat.
await page.mouse.move(478, 170);
await page.mouse.down();
for (const x of [525, 575, 625, 675, 725, 775, 825]) {
  await page.mouse.move(x, 170, { steps: 2 });
  await page.waitForTimeout(28);
}
await page.mouse.up();

for (let index = 0; index < 12; index += 1) {
  await page.waitForTimeout(55);
  await shot(`02-charged-spend-${String(index).padStart(2, '0')}`);
}

await page.waitForFunction((key) => {
  const raw = localStorage.getItem(key);
  if (!raw) return false;
  try {
    const save = JSON.parse(raw);
    return save.pendingReveal === null && save.totalOpens === 7;
  } catch {
    return false;
  }
}, SAVE_KEY, { timeout: 15_000 });
const committed = await readSave();
assert(committed?.totalOpens === 7, 'real Charged tear commits exactly one opening', committed ?? {});
assert(Number.isFinite(committed?.chips) && committed.chips >= 0, 'real Charged tear leaves a valid durable wallet', committed ?? {});
await page.waitForTimeout(1200);
await shot('03-charged-result-ready');

// A single physical click accepts the result on pointer release. It must not also skip the first banking leg.
await humanTap(640, 568);
for (let index = 0; index < 12; index += 1) {
  await page.waitForTimeout(55);
  await shot(`04-first-bank-leg-${String(index).padStart(2, '0')}`);
}

// Let cosmetic banking settle back to idle.
await page.waitForTimeout(1600);
await shot('05-after-bank-idle');
const finalSave = await readSave();
assert(finalSave?.totalOpens === 7 && finalSave?.pendingReveal === null, 'banking is presentation-only after durable commit', finalSave ?? {});

const reservedAudioRequests = failedRequests.filter(({ url }) => /(?:ui-click|ui-skip|pouch-select|ui-denied|charged-spend|chip-clack)\.mp3/.test(url));
assert(reservedAudioRequests.length === 0, 'synth-only UI cues do not request absent MP3 files', { reservedAudioRequests });

await fs.writeFile(`${outDir}/report.json`, JSON.stringify({
  auditedProductHead: PRODUCT_HEAD,
  auditHead: process.env.GITHUB_SHA ?? null,
  errors,
  failedRequests,
  assertions,
  committedChips: committed?.chips ?? null,
}, null, 2));

await context.close();
await browser.close();
if (errors.length || failedRequests.length || assertions.some(({ pass }) => !pass)) process.exitCode = 1;
