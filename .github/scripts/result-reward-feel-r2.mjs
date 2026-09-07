import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const PRODUCT_HEAD = 'afeb2ac50cba02cec68dcabd60a18e16ced97094';
const SAVE_KEY = 'mystery-pocket-tech.save';
const outDir = '/tmp/result-reward-feel-r2';
const errors = [];
const failedRequests = [];
const pouchGrabAssetRequests = [];

await fs.rm(outDir, { recursive: true, force: true });
await fs.mkdir(outDir, { recursive: true });

const fixture = {
  version: 2,
  discoveredStandard: ['camera-epic'],
  discoveredSecrets: [],
  chips: 200,
  signal: 0,
  activeLootPoolId: 'y2k-essentials',
  totalOpens: 3,
  muted: false,
  stats: { duplicates: 0, hiddenPockets: 0 },
  pendingReveal: {
    id: 'audit-epic-cache-duplicate',
    baseTotalOpens: 3,
    pouchType: 'charged',
    lootPoolId: 'y2k-essentials',
    openingNumber: 4,
    standard: {
      collectibleId: 'camera-epic',
      familyId: 'camera',
      rarity: 'epic',
      isNew: false,
    },
    chips: {
      before: 200,
      cost: 60,
      base: 23,
      cacheTier: 'cache',
      cacheBonus: 22,
      recycle: 8,
      totalEarned: 53,
      after: 193,
    },
    signal: {
      before: 0,
      after: 1,
      gain: 1,
      lockArmedBefore: false,
      lockConsumed: false,
      lockReached: false,
      lockRetained: false,
    },
    hiddenPocket: null,
    commit: {
      discoveredStandard: ['camera-epic'],
      discoveredSecrets: [],
      chips: 193,
      signal: 1,
      activeLootPoolId: 'y2k-essentials',
      totalOpens: 4,
      stats: { duplicates: 1, hiddenPockets: 0 },
    },
  },
};

const browser = await chromium.launch({
  headless: true,
  channel: 'chrome',
  args: ['--use-angle=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'],
});

const run = async ({ tag, locale, width }) => {
  const context = await browser.newContext({
    viewport: { width, height: 720 },
    locale,
    recordVideo: { dir: outDir, size: { width, height: 720 } },
  });
  await context.addInitScript(({ key, value }) => {
    localStorage.setItem(key, JSON.stringify(value));
  }, { key: SAVE_KEY, value: fixture });
  const page = await context.newPage();
  page.on('pageerror', e => errors.push(`${tag}: ${e.message}`));
  page.on('console', m => { if (m.type() === 'error') errors.push(`${tag}: ${m.text()}`); });
  page.on('request', r => { if (r.url().includes('pouch-grab.mp3')) pouchGrabAssetRequests.push({ tag, url: r.url() }); });
  page.on('requestfailed', r => failedRequests.push({ tag, url: r.url(), error: r.failure()?.errorText ?? 'unknown' }));
  await page.goto('http://127.0.0.1:5173/?debug=1&platform=mock', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#game canvas', { state: 'visible', timeout: 20000 });
  await page.waitForFunction(() => document.querySelector('#orientation-gate')?.getAttribute('data-visible') !== 'true');
  await page.evaluate(() => { const p = document.querySelector('.mpt-debug-panel'); if (p) p.style.display = 'none'; });
  for (let i = 0; i < 32; i += 1) {
    await page.screenshot({ path: `${outDir}/${tag}-${String(i).padStart(2, '0')}.png` });
    await page.waitForTimeout(190);
  }
  await context.close();
};

await run({ tag: '10-epic-cache-en-1280', locale: 'en-US', width: 1280 });
await run({ tag: '20-epic-cache-ru-900', locale: 'ru-RU', width: 900 });

await fs.writeFile(`${outDir}/report.json`, JSON.stringify({
  auditedProductHead: PRODUCT_HEAD,
  auditHead: process.env.GITHUB_SHA ?? null,
  errors,
  failedRequests,
  pouchGrabAssetRequests,
}, null, 2));
await browser.close();
if (errors.length || failedRequests.length || pouchGrabAssetRequests.length) process.exitCode = 1;
