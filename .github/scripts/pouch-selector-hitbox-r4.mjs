import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const PRODUCT_HEAD = 'fdf275189bb9f696b7cc1ad1334be759038fb213';
const SAVE_KEY = 'mystery-pocket-tech.save';
const outDir = '/tmp/pouch-selector-hitbox-r4';
const errors = [], failedRequests = [], assertions = [];
await fs.rm(outDir, { recursive: true, force: true });
await fs.mkdir(outDir, { recursive: true });

const baseSave = (chips) => ({ version: 2, discoveredStandard: [], discoveredSecrets: [], chips, signal: 0, activeLootPoolId: 'y2k-essentials', totalOpens: 6, pendingReveal: null, muted: false, stats: { duplicates: 0, hiddenPockets: 0 } });
const browser = await chromium.launch({ headless: true, channel: 'chrome', args: ['--use-angle=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] });
const attach = (page, tag) => {
  page.on('pageerror', e => errors.push(`${tag}: ${e.message}`));
  page.on('console', m => { if (m.type() === 'error') errors.push(`${tag}: ${m.text()}`); });
  page.on('requestfailed', r => failedRequests.push({ tag, url: r.url(), error: r.failure()?.errorText ?? 'unknown' }));
};
const assert = (ok, label, details = {}) => { assertions.push({ label, pass: !!ok, ...details }); if (!ok) throw new Error(`Assertion failed: ${label} ${JSON.stringify(details)}`); };
const waitReady = async page => { await page.waitForSelector('#game canvas', { state: 'visible', timeout: 20000 }); await page.waitForFunction(() => document.querySelector('#orientation-gate')?.getAttribute('data-visible') !== 'true'); await page.waitForTimeout(420); await page.evaluate(() => { const p = document.querySelector('.mpt-debug-panel'); if (p) p.style.display = 'none'; }); };
const reset = async (page, chips) => { await page.evaluate(({ k, v }) => localStorage.setItem(k, JSON.stringify(v)), { k: SAVE_KEY, v: baseSave(chips) }); await page.reload({ waitUntil: 'domcontentloaded' }); await waitReady(page); };
const tap = async (page, x, y) => { await page.mouse.move(x, y); await page.mouse.down(); await page.waitForTimeout(70); await page.mouse.up(); };
const tear = async (page, width) => { const cx = width / 2; await page.mouse.move(cx - 175, 174); await page.mouse.down(); await page.mouse.move(cx + 200, 174, { steps: 20 }); await page.mouse.up(); };
const pending = async page => { for (let i = 0; i < 90; i++) { const s = await page.evaluate(k => { const r = localStorage.getItem(k); if (!r) return null; const v = JSON.parse(r); return { chips: v.chips, pendingType: v.pendingReveal?.pouchType ?? null, totalOpens: v.totalOpens }; }, SAVE_KEY); if (s?.pendingType) return s; await page.waitForTimeout(35); } return null; };
const rects = width => { const left = Math.max(width * .04, 28); return { basic: { left, top: 232, width: 216, height: 58 }, charged: { left, top: 300, width: 216, height: 58 } }; };
const points = r => [['top-left', r.left + 8, r.top + 8], ['top-right', r.left + r.width - 8, r.top + 8], ['center', r.left + r.width / 2, r.top + r.height / 2], ['bottom-left', r.left + 8, r.top + r.height - 8], ['bottom-right', r.left + r.width - 8, r.top + r.height - 8]];

for (const width of [900, 1280]) {
  const context = await browser.newContext({ viewport: { width, height: 720 }, locale: width === 900 ? 'ru-RU' : 'en-US', recordVideo: { dir: outDir, size: { width, height: 720 } } });
  const page = await context.newPage(); attach(page, `${width}`);
  await page.goto('http://127.0.0.1:5173/?debug=1&platform=mock', { waitUntil: 'domcontentloaded' }); await waitReady(page);
  const r = rects(width);
  for (const [name, x, y] of points(r.charged)) {
    await reset(page, 100); await tap(page, x, y); await page.waitForTimeout(180);
    if (name === 'top-right' || name === 'bottom-right') await page.screenshot({ path: `${outDir}/${width}-charged-${name}.png` });
    await tear(page, width); const s = await pending(page); assert(s?.pendingType === 'charged', `${width} Charged ${name}`, s ?? {});
  }
  for (const [name, x, y] of points(r.basic)) {
    await reset(page, 100); await tap(page, r.charged.left + 44, r.charged.top + 12); await page.waitForTimeout(180); await tap(page, x, y); await page.waitForTimeout(180);
    if (name === 'top-left' || name === 'bottom-right') await page.screenshot({ path: `${outDir}/${width}-basic-${name}.png` });
    await tear(page, width); const s = await pending(page); assert(s?.pendingType === 'basic', `${width} Basic ${name}`, s ?? {});
  }
  await reset(page, 20); await tap(page, r.charged.left + r.charged.width - 8, r.charged.top + r.charged.height - 8); await page.waitForTimeout(90); await page.screenshot({ path: `${outDir}/${width}-unavailable.png` });
  const unavailable = await page.evaluate(k => JSON.parse(localStorage.getItem(k)), SAVE_KEY); assert(unavailable?.chips === 20 && unavailable?.pendingReveal === null, `${width} unavailable non-mutating`, unavailable ?? {});
  await context.close();
}
await fs.writeFile(`${outDir}/report.json`, JSON.stringify({ auditedProductHead: PRODUCT_HEAD, auditHead: process.env.GITHUB_SHA ?? null, errors, failedRequests, assertions }, null, 2));
await browser.close();
if (errors.length || failedRequests.length || assertions.some(a => !a.pass)) process.exitCode = 1;
