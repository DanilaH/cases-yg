import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const SAVE_KEY = 'mystery-pocket-tech.save';
const outDir = '/tmp/r6-compact-charged-input';
await fs.rm(outDir, { recursive: true, force: true });
await fs.mkdir(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true, channel: 'chrome', args: ['--use-angle=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] });
const context = await browser.newContext({ viewport: { width: 900, height: 720 }, locale: 'ru-RU', recordVideo: { dir: outDir, size: { width: 900, height: 720 } } });
const page = await context.newPage();
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
await page.goto('http://127.0.0.1:5173/?debug=1&platform=mock', { waitUntil: 'domcontentloaded' });
await page.waitForSelector('#game canvas', { state: 'visible', timeout: 20_000 });
await page.evaluate((key) => localStorage.setItem(key, JSON.stringify({
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
})), SAVE_KEY);
await page.reload({ waitUntil: 'domcontentloaded' });
await page.waitForSelector('#game canvas', { state: 'visible', timeout: 20_000 });
await page.waitForTimeout(550);
await page.evaluate(() => { const panel = document.querySelector('.mpt-debug-panel'); if (panel) panel.style.display = 'none'; });

const tap = async (x, y) => { await page.mouse.move(x, y); await page.mouse.down(); await page.waitForTimeout(80); await page.mouse.up(); };
await tap(135, 330);
await page.waitForTimeout(250);
await page.screenshot({ path: `${outDir}/01-after-charged-tap.png` });

// Drag the visible star tab across the authored tear line.
await page.mouse.move(275, 174);
await page.mouse.down();
await page.mouse.move(650, 174, { steps: 18 });
await page.mouse.up();

let observation = null;
for (let i = 0; i < 80; i += 1) {
  observation = await page.evaluate((key) => {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const save = JSON.parse(raw);
    return { chips: save.chips, totalOpens: save.totalOpens, pendingPouchType: save.pendingReveal?.pouchType ?? null };
  }, SAVE_KEY);
  if (observation?.pendingPouchType || observation?.totalOpens === 7) break;
  await page.waitForTimeout(40);
}
await page.screenshot({ path: `${outDir}/02-after-tear.png` });
await fs.writeFile(`${outDir}/report.json`, JSON.stringify({ observation, errors }, null, 2));
await context.close();
await browser.close();

if (errors.length) process.exitCode = 1;
if (!observation || (observation.pendingPouchType !== 'charged' && !(observation.totalOpens === 7 && observation.chips < 100))) {
  throw new Error(`Compact Charged selection did not drive a charged reveal: ${JSON.stringify(observation)}`);
}
