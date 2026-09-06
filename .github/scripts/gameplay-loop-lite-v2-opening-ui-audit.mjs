import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const outDir = '/tmp/gameplay-loop-lite-v2-opening-ui-audit';
await fs.rm(outDir, { recursive: true, force: true });
await fs.mkdir(outDir, { recursive: true });

const errors = [];
const failedRequests = [];
const states = [];
const SAVE_KEY = 'mystery-pocket-tech.save';

const baseSave = (overrides = {}) => ({
  version: 2,
  discoveredStandard: [],
  discoveredSecrets: [],
  chips: 0,
  signal: 0,
  activeLootPoolId: 'y2k-essentials',
  totalOpens: 3,
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
  page.on('requestfailed', (request) => {
    failedRequests.push({ tag, url: request.url(), error: request.failure()?.errorText ?? 'unknown' });
  });
};

const waitReady = async (page) => {
  await page.waitForSelector('#game canvas', { state: 'visible', timeout: 20_000 });
  await page.waitForFunction(() => document.querySelector('#orientation-gate')?.getAttribute('data-visible') !== 'true');
  await page.waitForTimeout(650);
};

const hideDebug = async (page) => {
  await page.evaluate(() => {
    const panel = document.querySelector('.mpt-debug-panel');
    if (panel) panel.style.display = 'none';
  });
};

const showDebug = async (page) => {
  await page.evaluate(() => {
    const panel = document.querySelector('.mpt-debug-panel');
    if (panel) panel.style.display = '';
  });
};

const shot = async (page, name) => {
  await page.screenshot({ path: `${outDir}/${name}.png` });
};

const setSaveAndReload = async (page, save) => {
  await page.evaluate(({ key, value }) => localStorage.setItem(key, JSON.stringify(value)), {
    key: SAVE_KEY,
    value: save,
  });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await waitReady(page);
  await hideDebug(page);
};

const readSave = async (page, label) => {
  const raw = await page.evaluate((key) => localStorage.getItem(key), SAVE_KEY);
  const parsed = raw ? JSON.parse(raw) : null;
  states.push({ label, save: parsed });
  return parsed;
};

const dragTear1280 = async (page) => {
  const startX = 640 - 158;
  const startY = 266 - 83;
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX + 150, startY, { steps: 8 });
  await page.waitForTimeout(90);
  await page.mouse.move(startX + 310, startY, { steps: 10 });
  await page.mouse.up();
};

const runDeterministicTear1280 = async (page, sequence) => {
  await page.evaluate((values) => {
    globalThis.__mptAuditOriginalRandom = Math.random;
    globalThis.__mptAuditRandom = [...values];
    Math.random = () => {
      const queue = globalThis.__mptAuditRandom;
      return Array.isArray(queue) && queue.length > 0 ? queue.shift() : 0.99;
    };
  }, sequence);

  try {
    await dragTear1280(page);
    await page.waitForFunction((key) => {
      const raw = localStorage.getItem(key);
      if (!raw) return false;
      try {
        return JSON.parse(raw).pendingReveal !== null;
      } catch {
        return false;
      }
    }, SAVE_KEY, { timeout: 4_000 });
  } finally {
    await page.evaluate(() => {
      if (typeof globalThis.__mptAuditOriginalRandom === 'function') {
        Math.random = globalThis.__mptAuditOriginalRandom;
      }
      delete globalThis.__mptAuditOriginalRandom;
      delete globalThis.__mptAuditRandom;
    });
  }
};

const selectCharged1280 = async (page) => {
  await page.mouse.click(640 + 110, 116);
  await page.waitForTimeout(180);
};

const enContext = await browser.newContext({
  viewport: { width: 1280, height: 720 },
  locale: 'en-US',
  recordVideo: { dir: outDir, size: { width: 1280, height: 720 } },
});
const page = await enContext.newPage();
attachDiagnostics(page, 'en');
await page.goto('http://127.0.0.1:5173/?debug=1&platform=mock', { waitUntil: 'domcontentloaded' });
await waitReady(page);
await hideDebug(page);

// 01 — clean idle: CHIPS + segmented Signal + Basic/Charged selector.
await setSaveAndReload(page, baseSave({ totalOpens: 0 }));
await shot(page, '01-idle-basic-1280');

// 02–04 — real Basic opening with deterministic common, base CHIPS and no cache.
await setSaveAndReload(page, baseSave());
await runDeterministicTear1280(page, [0.1, 0.1, 0.0, 0.0, 0.99]);
await page.waitForTimeout(300);
await shot(page, '02-basic-chips-spill');
await page.waitForTimeout(520);
await shot(page, '03-basic-collectible-emerge');
await page.waitForTimeout(900);
await shot(page, '04-basic-result-ready');
await readSave(page, 'basic-result');

// 05–07 — Mega cache path and CHARGED READY crossing beat.
await setSaveAndReload(page, baseSave());
await runDeterministicTear1280(page, [0.1, 0.1, 0.0, 0.999, 0.5, 0.99]);
await page.waitForTimeout(760);
await shot(page, '05-mega-cache-beat');
await page.waitForTimeout(620);
await shot(page, '06-charged-ready-crossing');
await page.waitForTimeout(700);
await shot(page, '07-mega-cache-result');
await readSave(page, 'mega-cache-result');

// 08–10 — duplicate recycle into CHIPS plus Signal segment gain.
await setSaveAndReload(page, baseSave({
  chips: 20,
  discoveredStandard: ['camera-common'],
}));
await runDeterministicTear1280(page, [0.1, 0.1, 0.0, 0.0, 0.99]);
await page.waitForTimeout(980);
await shot(page, '08-duplicate-recycle-start');
await page.waitForTimeout(260);
await shot(page, '09-duplicate-recycle-flight');
await page.waitForTimeout(700);
await shot(page, '10-duplicate-result-signal');
await readSave(page, 'duplicate-result');

// 11–13 — Charged selection, aura, spend and deterministic Legendary.
await setSaveAndReload(page, baseSave({ chips: 100 }));
await selectCharged1280(page);
await shot(page, '11-charged-selected-idle');
await runDeterministicTear1280(page, [0.1, 0.99, 0.0, 0.0, 0.99]);
await page.waitForTimeout(260);
await shot(page, '12-charged-spend-and-base');
await page.waitForTimeout(1050);
await shot(page, '13-charged-legendary');
await page.waitForTimeout(700);
await readSave(page, 'charged-legendary-result');

// 14 — armed Signal with only Legendary missing: Basic cannot consume it.
const basicEligible = [
  'camera-common', 'camera-rare', 'camera-epic',
  'flip-phone-common', 'flip-phone-rare', 'flip-phone-epic',
];
await setSaveAndReload(page, baseSave({
  chips: 60,
  signal: 4,
  discoveredStandard: basicEligible,
  totalOpens: 12,
}));
await shot(page, '14-signal-lock-waiting-charged');

// 15–18 — real Hidden Pocket opening, carousel, swipe and resize preservation.
await setSaveAndReload(page, baseSave({ totalOpens: 3 }));
await runDeterministicTear1280(page, [0.1, 0.1, 0.0, 0.0, 0.0, 0.1]);
await page.waitForTimeout(1750);
await shot(page, '15-hidden-secret-reveal');
await page.waitForTimeout(850);
await shot(page, '16-hidden-secret-result');
await page.mouse.move(640, 326);
await page.mouse.down();
await page.mouse.move(790, 326, { steps: 12 });
await page.mouse.up();
await page.waitForTimeout(260);
await shot(page, '17-hidden-standard-selected');
await page.setViewportSize({ width: 900, height: 720 });
await page.waitForTimeout(360);
await shot(page, '18-hidden-standard-900');
await page.setViewportSize({ width: 1280, height: 720 });
await page.waitForTimeout(260);
await readSave(page, 'hidden-result');

// 19 — recovery of an already staged Charged transaction: no economy replay.
await showDebug(page);
await Promise.all([
  page.waitForEvent('framenavigated', { timeout: 10_000 }),
  page.getByRole('button', { name: 'Force Legendary (Charged)', exact: true }).click(),
]);
await waitReady(page);
await hideDebug(page);
await page.waitForTimeout(1150);
await shot(page, '19-recovered-charged-result');
await readSave(page, 'recovered-charged-result');

await enContext.close();

// 20 — RU/narrow-width stress for selector + resources + waiting Signal copy.
const ruContext = await browser.newContext({
  viewport: { width: 1024, height: 720 },
  locale: 'ru-RU',
  recordVideo: { dir: outDir, size: { width: 1024, height: 720 } },
});
const ruPage = await ruContext.newPage();
attachDiagnostics(ruPage, 'ru');
await ruPage.goto('http://127.0.0.1:5173/?debug=1&platform=mock', { waitUntil: 'domcontentloaded' });
await waitReady(ruPage);
await setSaveAndReload(ruPage, baseSave({
  chips: 60,
  signal: 4,
  discoveredStandard: basicEligible,
  totalOpens: 12,
}));
await shot(ruPage, '20-ru-signal-charged-1024');
await ruContext.close();

await fs.writeFile(
  `${outDir}/report.json`,
  JSON.stringify({
    auditedProductHead: '8ac24e4d8613ba7e5d6bc86d0bc717d0f3a3a7a2',
    auditBranchHead: process.env.GITHUB_SHA ?? null,
    errors,
    failedRequests,
    states,
  }, null, 2),
);

await browser.close();
if (errors.length || failedRequests.length) process.exitCode = 1;
