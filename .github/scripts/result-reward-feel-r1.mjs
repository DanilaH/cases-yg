import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const PRODUCT_HEAD = 'afeb2ac50cba02cec68dcabd60a18e16ced97094';
const outDir = '/tmp/result-reward-feel-r1';
const errors = [];
const failedRequests = [];
const pouchGrabAssetRequests = [];

await fs.rm(outDir, { recursive: true, force: true });
await fs.mkdir(outDir, { recursive: true });

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
    if (request.url().includes('pouch-grab.mp3')) pouchGrabAssetRequests.push({ tag, url: request.url() });
  });
  page.on('requestfailed', request => failedRequests.push({ tag, url: request.url(), error: request.failure()?.errorText ?? 'unknown' }));
};

const hideDebug = page => page.evaluate(() => {
  const panel = document.querySelector('.mpt-debug-panel');
  if (panel) panel.style.display = 'none';
});

const waitGame = async page => {
  await page.waitForSelector('#game canvas', { state: 'visible', timeout: 20000 });
  await page.waitForFunction(() => document.querySelector('#orientation-gate')?.getAttribute('data-visible') !== 'true');
  await page.waitForTimeout(450);
};

const stageScenario = async (page, buttonName) => {
  const nav = page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.getByRole('button', { name: buttonName, exact: true }).click();
  await nav;
  await waitGame(page);
  await hideDebug(page);
};

const captureFrames = async (page, prefix, count, intervalMs) => {
  for (let index = 0; index < count; index += 1) {
    await page.screenshot({ path: `${outDir}/${prefix}-${String(index).padStart(2, '0')}.png` });
    await page.waitForTimeout(intervalMs);
  }
};

// A) EN duplicate: real 3-row tray. Capture the whole staging -> resolved-result seam at high cadence.
{
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    locale: 'en-US',
    recordVideo: { dir: outDir, size: { width: 1280, height: 720 } },
  });
  const page = await context.newPage();
  wireDiagnostics(page, 'duplicate-en-1280');
  await page.goto('http://127.0.0.1:5173/?debug=1&platform=mock', { waitUntil: 'domcontentloaded' });
  await waitGame(page);
  await stageScenario(page, 'Force Duplicate');
  await captureFrames(page, '10-duplicate-en-1280', 38, 170);
  await context.close();
}

// B) RU compact Legendary result: stress long localized title + large rarity capsule.
{
  const context = await browser.newContext({
    viewport: { width: 900, height: 720 },
    locale: 'ru-RU',
    recordVideo: { dir: outDir, size: { width: 900, height: 720 } },
  });
  const page = await context.newPage();
  wireDiagnostics(page, 'legendary-ru-900');
  await page.goto('http://127.0.0.1:5173/?debug=1&platform=mock', { waitUntil: 'domcontentloaded' });
  await waitGame(page);
  await stageScenario(page, 'Force Legendary (Charged)');
  await captureFrames(page, '20-legendary-ru-900', 34, 210);
  await context.close();
}

// C) Hidden Pocket: ensure stronger badge/border remains coherent when carousel copy switches to SECRET.
{
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    locale: 'en-US',
    recordVideo: { dir: outDir, size: { width: 1280, height: 720 } },
  });
  const page = await context.newPage();
  wireDiagnostics(page, 'hidden-en-1280');
  await page.goto('http://127.0.0.1:5173/?debug=1&platform=mock', { waitUntil: 'domcontentloaded' });
  await waitGame(page);
  await stageScenario(page, 'Force Hidden Pocket');
  await captureFrames(page, '30-hidden-en-1280', 42, 210);
  await context.close();
}

// D) Fresh idle star grab: grab only, do not complete the tear. Confirm visual tactile state and that synth-only cue requests no MP3.
{
  const context = await browser.newContext({ viewport: { width: 900, height: 720 }, locale: 'en-US' });
  const page = await context.newPage();
  wireDiagnostics(page, 'grab-en-900');
  await page.goto('http://127.0.0.1:5173/?debug=1&platform=mock', { waitUntil: 'domcontentloaded' });
  await waitGame(page);
  await hideDebug(page);
  await page.screenshot({ path: `${outDir}/40-grab-before.png` });
  // Pouch center = 450, star hitbox offset = -158, pouch group y=260, star hitbox y=-83.
  await page.mouse.move(292, 177);
  await page.mouse.down();
  await page.waitForTimeout(90);
  await page.screenshot({ path: `${outDir}/41-grab-held.png` });
  await page.mouse.up();
  await page.waitForTimeout(220);
  await page.screenshot({ path: `${outDir}/42-grab-cancelled.png` });
  await context.close();
}

const report = {
  auditedProductHead: PRODUCT_HEAD,
  auditHead: process.env.GITHUB_SHA ?? null,
  errors,
  failedRequests,
  pouchGrabAssetRequests,
};
await fs.writeFile(`${outDir}/report.json`, JSON.stringify(report, null, 2));
await browser.close();
if (errors.length || failedRequests.length || pouchGrabAssetRequests.length) process.exitCode = 1;
