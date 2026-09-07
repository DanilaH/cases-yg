import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const PRODUCT_HEAD = 'afeb2ac50cba02cec68dcabd60a18e16ced97094';
const outDir = '/tmp/result-reward-feel-r3';
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
  await page.waitForTimeout(650);
};

const captureFrames = async (page, prefix, count, intervalMs) => {
  for (let index = 0; index < count; index += 1) {
    await page.screenshot({ path: `${outDir}/${prefix}-${String(index).padStart(2, '0')}.png` });
    await page.waitForTimeout(intervalMs);
  }
};

const performNormalOpen = async ({ width, locale, tag, prefix }) => {
  const context = await browser.newContext({
    viewport: { width, height: 720 },
    locale,
    recordVideo: { dir: outDir, size: { width, height: 720 } },
  });
  const page = await context.newPage();
  wireDiagnostics(page, tag);
  await page.goto('http://127.0.0.1:5173/?debug=1&platform=mock', { waitUntil: 'domcontentloaded' });
  await waitGame(page);
  await hideDebug(page);

  const startX = width / 2 - 158;
  const startY = 177;
  await page.screenshot({ path: `${outDir}/${prefix}-before.png` });
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.waitForTimeout(85);
  await page.screenshot({ path: `${outDir}/${prefix}-grab.png` });

  // Complete one real tear through the production drag path; no staged pending reveal/reload.
  for (let step = 1; step <= 14; step += 1) {
    await page.mouse.move(startX + (312 * step) / 14, startY, { steps: 1 });
    await page.waitForTimeout(18);
  }

  await captureFrames(page, prefix, 52, 90);
  await page.mouse.up();
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${outDir}/${prefix}-tail.png` });
  await context.close();
};

await performNormalOpen({
  width: 1280,
  locale: 'en-US',
  tag: 'normal-en-1280',
  prefix: '10-normal-en-1280',
});

await performNormalOpen({
  width: 900,
  locale: 'ru-RU',
  tag: 'normal-ru-900',
  prefix: '20-normal-ru-900',
});

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
