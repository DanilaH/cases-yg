import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const PRODUCT_HEAD = '31b4534f633ceab4968eb5e3b5e7bf22dfb07124';
const SAVE_KEY = 'mystery-pocket-tech.save';
const SETTINGS_KEY = 'mystery-pocket-tech.settings';
const outDir = '/tmp/pre-first-open-mute-gate';
const errors = [];
const failedRequests = [];
const assertions = [];

await fs.rm(outDir, { recursive: true, force: true });
await fs.mkdir(outDir, { recursive: true });

const browser = await chromium.launch({
  headless: true,
  channel: 'chrome',
  args: ['--use-angle=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'],
});

const baseSave = () => ({
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

const waitReady = async (page) => {
  await page.waitForSelector('#game canvas', { state: 'visible', timeout: 20_000 });
  await page.waitForFunction(() => document.querySelector('#orientation-gate')?.getAttribute('data-visible') !== 'true');
  await page.waitForTimeout(650);
};

const setFreshSave = async (page) => {
  await page.evaluate(({ saveKey, settingsKey, save }) => {
    localStorage.setItem(saveKey, JSON.stringify(save));
    localStorage.removeItem(settingsKey);
  }, { saveKey: SAVE_KEY, settingsKey: SETTINGS_KEY, save: baseSave() });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await waitReady(page);
};

const shot = (page, name) => page.screenshot({ path: `${outDir}/${name}.png` });
const click = async (page, x, y) => {
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.waitForTimeout(80);
  await page.mouse.up();
};

const runFreshCase = async ({ width, locale, tag, clickX }) => {
  const context = await browser.newContext({ viewport: { width, height: 720 }, locale });
  const page = await context.newPage();
  attachDiagnostics(page, tag);
  await page.goto('http://127.0.0.1:5173/?platform=mock', { waitUntil: 'domcontentloaded' });
  await waitReady(page);
  await setFreshSave(page);
  await shot(page, `${tag}-00-fresh-unmuted`);

  const saveBefore = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? 'null'), SAVE_KEY);
  await click(page, clickX, 50);
  await page.waitForTimeout(400);
  await shot(page, `${tag}-01-fresh-muted`);
  const settingsAfter = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? 'null'), SETTINGS_KEY);
  const saveAfter = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? 'null'), SAVE_KEY);
  assertions.push({
    name: `${tag}-mute-before-first-open`,
    pass: settingsAfter?.muted === true && saveAfter?.totalOpens === 0 && saveAfter?.pendingReveal === null,
    observed: { settingsAfter, saveBefore, saveAfter },
  });

  await page.reload({ waitUntil: 'domcontentloaded' });
  await waitReady(page);
  await shot(page, `${tag}-02-muted-after-reload`);
  const settingsReloaded = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? 'null'), SETTINGS_KEY);
  assertions.push({
    name: `${tag}-mute-persists-after-reload`,
    pass: settingsReloaded?.muted === true,
    observed: settingsReloaded,
  });
  await context.close();
};

await runFreshCase({ width: 800, locale: 'ru-RU', tag: 'ru-800', clickX: 744 });
await runFreshCase({ width: 1280, locale: 'en-US', tag: 'en-1280', clickX: 1200 });

await fs.writeFile(`${outDir}/report.json`, JSON.stringify({
  auditedProductHead: PRODUCT_HEAD,
  auditHead: process.env.GITHUB_SHA ?? null,
  assertions,
  errors,
  failedRequests,
}, null, 2));

await browser.close();
if (assertions.some((entry) => !entry.pass) || errors.length || failedRequests.length) process.exitCode = 1;
