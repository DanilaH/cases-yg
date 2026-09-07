import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const PRODUCT_HEAD = 'fae3ad271c51c5788aad6a01f4f9858590e7ecbc';
const SAVE_KEY = 'mystery-pocket-tech.save';
const outDir = '/tmp/final-independent-pass-4';
const errors = [];
const expectedErrors = [];
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

const allStandard = [
  'camera-common','camera-rare','camera-epic','camera-legendary',
  'flip-phone-common','flip-phone-rare','flip-phone-epic','flip-phone-legendary',
];
const allSecrets = ['camera-secret-cosmic','flip-phone-secret-noir'];

const browser = await chromium.launch({
  headless: true,
  channel: 'chrome',
  args: ['--use-angle=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'],
});

const diagnostics = (page, tag, { allowConsoleErrors = false } = {}) => {
  page.on('pageerror', e => (allowConsoleErrors ? expectedErrors : errors).push(`${tag}: ${e.message}`));
  page.on('console', m => {
    if (m.type() === 'error') (allowConsoleErrors ? expectedErrors : errors).push(`${tag}: ${m.text()}`);
  });
  page.on('requestfailed', r => failedRequests.push({ tag, url: r.url(), error: r.failure()?.errorText ?? 'unknown' }));
};
const waitCanvas = async page => {
  await page.waitForSelector('#game canvas', { state: 'visible', timeout: 20000 });
  await page.waitForFunction(() => document.querySelector('#orientation-gate')?.getAttribute('data-visible') !== 'true');
  await page.waitForTimeout(450);
};
const hideDebug = async page => page.evaluate(() => { const p = document.querySelector('.mpt-debug-panel'); if (p) p.style.display = 'none'; });
const shot = (page, name) => page.screenshot({ path: `${outDir}/${name}.png` });
const setSave = async (page, save) => {
  await page.evaluate(({ k, v }) => localStorage.setItem(k, JSON.stringify(v)), { k: SAVE_KEY, v: save });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await waitCanvas(page);
  await hideDebug(page);
};
const clearSave = async page => {
  await page.evaluate(k => localStorage.removeItem(k), SAVE_KEY);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await waitCanvas(page);
  await hideDebug(page);
};
const tap = async (page, x, y) => { await page.mouse.move(x,y); await page.mouse.down(); await page.waitForTimeout(55); await page.mouse.up(); };
const collectionButton = page => ({ x: page.viewportSize().width - 65, y: page.viewportSize().height - 48 });
const openCollection = async page => {
  const p = collectionButton(page);
  await tap(page, p.x, p.y);
  await page.waitForTimeout(500);
};
const tabLibrary = async page => {
  const { width, height } = page.viewportSize();
  const scale = height / 720;
  await tap(page, width / 2 + 78 * scale, 128 * scale);
  await page.waitForTimeout(250);
};
const tabShelf = async page => {
  const { width, height } = page.viewportSize();
  const scale = height / 720;
  await tap(page, width / 2 - 78 * scale, 128 * scale);
  await page.waitForTimeout(250);
};
const returnOpening = async page => {
  const { height } = page.viewportSize();
  await tap(page, 90, height - 48);
  await page.waitForTimeout(500);
};

// 1) First-run: compare RU compact, EN standard, and short landscape. No returning-player chrome should collide with onboarding.
for (const cfg of [
  { tag:'ru-compact', locale:'ru-RU', viewport:{width:800,height:720} },
  { tag:'en-standard', locale:'en-US', viewport:{width:1280,height:720} },
  { tag:'ru-short', locale:'ru-RU', viewport:{width:1024,height:576} },
]) {
  const ctx = await browser.newContext({ viewport: cfg.viewport, locale: cfg.locale });
  const page = await ctx.newPage(); diagnostics(page, `first-${cfg.tag}`);
  await page.goto('http://127.0.0.1:5173/?debug=1&platform=mock', { waitUntil:'domcontentloaded' });
  await waitCanvas(page); await clearSave(page);
  await shot(page, `00-first-${cfg.tag}`);
  const save = await page.evaluate(k => JSON.parse(localStorage.getItem(k) ?? 'null'), SAVE_KEY);
  assertions.push({ name:`first-run-save-${cfg.tag}`, pass:Boolean(save && save.totalOpens===0 && save.pendingReveal===null), observed:save&&{totalOpens:save.totalOpens,pendingReveal:save.pendingReveal} });
  await ctx.close();
}

// 2) Empty Collection in RU compact, then library, then short resize, then return. This is an under-exercised visual state.
{
  const ctx = await browser.newContext({ viewport:{width:800,height:720}, locale:'ru-RU', recordVideo:{dir:outDir,size:{width:800,height:720}} });
  const page = await ctx.newPage(); diagnostics(page,'collection-empty-ru');
  await page.goto('http://127.0.0.1:5173/?debug=1&platform=mock',{waitUntil:'domcontentloaded'}); await waitCanvas(page);
  await setSave(page, baseSave({ totalOpens:1, chips:7, signal:1 }));
  await openCollection(page); await shot(page,'10-collection-empty-ru-shelf-800');
  await tabLibrary(page); await shot(page,'11-collection-empty-ru-library-800');
  await page.setViewportSize({width:1024,height:576}); await page.waitForTimeout(400); await shot(page,'12-collection-empty-ru-library-1024x576');
  await tabShelf(page); await shot(page,'13-collection-empty-ru-shelf-1024x576');
  await returnOpening(page); await shot(page,'14-returned-opening-after-empty-collection');
  await ctx.close();
}

// 3) Full Collection in EN wide -> compact; toggle mute in Collection and round-trip scenes twice to catch reused-scene/listener drift.
{
  const ctx = await browser.newContext({ viewport:{width:1280,height:720}, locale:'en-US', recordVideo:{dir:outDir,size:{width:1280,height:720}} });
  const page = await ctx.newPage(); diagnostics(page,'collection-full-cycle');
  await page.goto('http://127.0.0.1:5173/?debug=1&platform=mock',{waitUntil:'domcontentloaded'}); await waitCanvas(page);
  await setSave(page, baseSave({ discoveredStandard:allStandard, discoveredSecrets:allSecrets, chips:120, signal:4, totalOpens:42, stats:{duplicates:30,hiddenPockets:2} }));
  await openCollection(page); await shot(page,'20-collection-full-en-shelf-1280');
  await tabLibrary(page); await shot(page,'21-collection-full-en-library-1280');
  await tap(page, 1210, 40); await page.waitForTimeout(250); await shot(page,'22-collection-full-en-muted');
  await page.setViewportSize({width:800,height:720}); await page.waitForTimeout(400); await shot(page,'23-collection-full-en-library-800');
  await returnOpening(page); await shot(page,'24-opening-after-full-collection-cycle1');
  await openCollection(page); await shot(page,'25-collection-cycle2-shelf');
  await tabLibrary(page); await shot(page,'26-collection-cycle2-library');
  await returnOpening(page); await shot(page,'27-opening-after-full-collection-cycle2');
  const settings = await page.evaluate(() => localStorage.getItem('mystery-pocket-tech.settings'));
  assertions.push({ name:'collection-mute-persisted-through-scene-cycles', pass:Boolean(settings && JSON.parse(settings).muted===true), observed:settings });
  await ctx.close();
}

// 4) Safe-area pressure: inject non-zero insets, trigger layout refresh, inspect top/right/bottom chrome on a compact-ish landscape.
{
  const ctx = await browser.newContext({ viewport:{width:960,height:640}, locale:'ru-RU' });
  const page = await ctx.newPage(); diagnostics(page,'safe-area');
  await page.goto('http://127.0.0.1:5173/?debug=1&platform=mock',{waitUntil:'domcontentloaded'}); await waitCanvas(page);
  await setSave(page, baseSave({ chips:60, signal:4, totalOpens:12 }));
  await page.addStyleTag({content:':root{--safe-area-left:70px !important;--safe-area-right:55px !important;--safe-area-top:38px !important;--safe-area-bottom:42px !important;}'});
  await page.setViewportSize({width:961,height:640}); await page.waitForTimeout(350); await shot(page,'30-safe-area-ru-idle');
  await openCollection(page); await shot(page,'31-safe-area-ru-collection');
  await ctx.close();
}

// 5) Corrupt save startup UI in both locales. Console error is expected here; visual fallback must still render.
for (const cfg of [
  { tag:'ru', locale:'ru-RU', viewport:{width:800,height:720} },
  { tag:'en', locale:'en-US', viewport:{width:1280,height:720} },
]) {
  const ctx = await browser.newContext({ viewport:cfg.viewport, locale:cfg.locale });
  const page = await ctx.newPage(); diagnostics(page,`corrupt-save-${cfg.tag}`,{allowConsoleErrors:true});
  await page.goto('http://127.0.0.1:5173/?debug=1&platform=mock',{waitUntil:'domcontentloaded'}); await waitCanvas(page);
  await page.evaluate(k => localStorage.setItem(k,'{definitely-not-valid-json'), SAVE_KEY);
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForSelector('#game canvas',{state:'visible',timeout:20000}); await page.waitForTimeout(700); await hideDebug(page);
  await shot(page,`40-corrupt-save-${cfg.tag}`);
  await ctx.close();
}

await fs.writeFile(`${outDir}/report.json`, JSON.stringify({ auditedProductHead:PRODUCT_HEAD, auditHead:process.env.GITHUB_SHA??null, assertions, errors, expectedErrors, failedRequests }, null, 2));
await browser.close();
if (assertions.some(x=>!x.pass) || errors.length || failedRequests.length) process.exitCode=1;
