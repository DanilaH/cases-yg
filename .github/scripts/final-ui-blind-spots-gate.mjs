import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const PRODUCT_HEAD = '21638f23265bcd11a3afd0e81bd2cc8fa4d58afb';
const SAVE_KEY = 'mystery-pocket-tech.save';
const outDir = '/tmp/final-ui-blind-spots-gate';
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

const waitLandscapeCanvas = async (page) => {
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

const tap = async (page, x, y) => {
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.waitForTimeout(70);
  await page.mouse.up();
};

const setSaveAndReload = async (page, save) => {
  await page.evaluate(({ key, value }) => localStorage.setItem(key, JSON.stringify(value)), { key: SAVE_KEY, value: save });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await waitLandscapeCanvas(page);
  await hideDebug(page);
};

const stage = async (page, buttonName) => {
  await showDebug(page);
  await Promise.all([
    page.waitForEvent('framenavigated', { timeout: 10_000 }),
    page.getByRole('button', { name: buttonName, exact: true }).click(),
  ]);
  await waitLandscapeCanvas(page);
  await hideDebug(page);
};

const waitCommitted = async (page, totalOpens) => {
  await page.waitForFunction(({ key, totalOpens }) => {
    const raw = localStorage.getItem(key);
    if (!raw) return false;
    try {
      const save = JSON.parse(raw);
      return save.pendingReveal === null && save.totalOpens === totalOpens;
    } catch {
      return false;
    }
  }, { key: SAVE_KEY, totalOpens }, { timeout: 20_000 });
  await page.waitForTimeout(300);
};

const acceptResult = async (page, x, y) => {
  await tap(page, x, y);
  await page.waitForTimeout(140);
  await tap(page, x, y);
};

// Regression 1: resize from standard/wide to compact while banking is active.
const bankingContext = await browser.newContext({
  viewport: { width: 1280, height: 720 },
  locale: 'en-US',
  recordVideo: { dir: outDir, size: { width: 1280, height: 720 } },
});
const banking = await bankingContext.newPage();
attachDiagnostics(banking, 'banking-resize');
await banking.goto('http://127.0.0.1:5173/?debug=1&platform=mock', { waitUntil: 'domcontentloaded' });
await waitLandscapeCanvas(banking);
await setSaveAndReload(banking, baseSave({ chips: 80, totalOpens: 12 }));
await stage(banking, 'SIGNAL LOCK waiting for Charged');
await waitCommitted(banking, 13);
await shot(banking, '00-wide-result-before-bank');
await acceptResult(banking, 640, 568);
await banking.waitForTimeout(95);
await shot(banking, '01-wide-banking-before-resize');
await banking.setViewportSize({ width: 800, height: 720 });
for (const [index, delay] of [40, 90, 160, 300, 650].entries()) {
  await banking.waitForTimeout(delay);
  await shot(banking, `02-compact-after-resize-${index}`);
}
await banking.waitForTimeout(700);
await shot(banking, '03-compact-idle-settled');
const settledSave = await banking.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? 'null'), SAVE_KEY);
assertions.push({
  name: 'banking-resize-save-remains-committed',
  pass: Boolean(settledSave && settledSave.pendingReveal === null && settledSave.totalOpens === 13),
  observed: settledSave ? { totalOpens: settledSave.totalOpens, pendingReveal: settledSave.pendingReveal } : null,
});
await bankingContext.close();

// Regression 2: portrait gate is a styled game surface and cleanly releases in landscape.
const portraitContext = await browser.newContext({
  viewport: { width: 430, height: 900 },
  locale: 'ru-RU',
});
const portrait = await portraitContext.newPage();
attachDiagnostics(portrait, 'orientation-gate');
await portrait.goto('http://127.0.0.1:5173/?platform=mock', { waitUntil: 'domcontentloaded' });
await portrait.waitForFunction(() => document.querySelector('#orientation-gate')?.getAttribute('data-visible') === 'true', null, { timeout: 20_000 });
await hideDebug(portrait);
await portrait.waitForTimeout(500);
await shot(portrait, '10-portrait-gate');
const gateStyles = await portrait.evaluate(() => {
  const gate = document.querySelector('#orientation-gate');
  if (!(gate instanceof HTMLElement)) return null;
  const style = getComputedStyle(gate);
  const before = getComputedStyle(gate, '::before');
  const after = getComputedStyle(gate, '::after');
  return {
    text: gate.textContent,
    display: style.display,
    fontFamily: style.fontFamily,
    backgroundImage: style.backgroundImage,
    beforeContent: before.content,
    beforeBorder: before.borderTopWidth,
    beforeRadius: before.borderTopLeftRadius,
    afterContent: after.content,
  };
});
assertions.push({
  name: 'portrait-gate-styled',
  pass: Boolean(
    gateStyles &&
    gateStyles.display === 'grid' &&
    gateStyles.backgroundImage !== 'none' &&
    gateStyles.fontFamily.includes('Press Start 2P') &&
    gateStyles.beforeContent !== 'none' &&
    gateStyles.beforeBorder !== '0px' &&
    gateStyles.afterContent !== 'none'
  ),
  observed: gateStyles,
});
await portrait.setViewportSize({ width: 900, height: 430 });
await portrait.waitForFunction(() => document.querySelector('#orientation-gate')?.getAttribute('data-visible') !== 'true', null, { timeout: 20_000 });
await portrait.waitForSelector('#game canvas', { state: 'visible', timeout: 20_000 });
await hideDebug(portrait);
await portrait.waitForTimeout(500);
await shot(portrait, '11-landscape-after-gate');
assertions.push({ name: 'portrait-gate-releases', pass: true });
await portraitContext.close();

await fs.writeFile(`${outDir}/report.json`, JSON.stringify({
  auditedProductHead: PRODUCT_HEAD,
  auditHead: process.env.GITHUB_SHA ?? null,
  assertions,
  errors,
  failedRequests,
}, null, 2));

await browser.close();
if (assertions.some((entry) => !entry.pass) || errors.length || failedRequests.length) process.exitCode = 1;
