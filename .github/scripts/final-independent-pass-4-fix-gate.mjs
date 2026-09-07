import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const PRODUCT_HEAD = 'd87e39210d29a0cbdff033c57c4f824075ae0180';
const SAVE_KEY = 'mystery-pocket-tech.save';
const SETTINGS_KEY = 'mystery-pocket-tech.settings';
const outDir = '/tmp/final-independent-pass-4-fix-gate';
const errors = [];
const expectedErrors = [];
const failedRequests = [];
const assertions = [];

await fs.rm(outDir, { recursive: true, force: true });
await fs.mkdir(outDir, { recursive: true });

const save = (overrides = {}) => ({
  version: 2,
  discoveredStandard: [], discoveredSecrets: [], chips: 0, signal: 0,
  activeLootPoolId: 'y2k-essentials', totalOpens: 0, pendingReveal: null, muted: false,
  stats: { duplicates: 0, hiddenPockets: 0 }, ...overrides,
});

const browser = await chromium.launch({
  headless: true,
  channel: 'chrome',
  args: ['--use-angle=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'],
});

const attachDiagnostics = (page, tag, expected = false) => {
  page.on('pageerror', e => (expected ? expectedErrors : errors).push(`${tag}: ${e.message}`));
  page.on('console', m => {
    if (m.type() === 'error') (expected ? expectedErrors : errors).push(`${tag}: ${m.text()}`);
  });
  page.on('requestfailed', r => failedRequests.push({ tag, url:r.url(), error:r.failure()?.errorText ?? 'unknown' }));
};
const waitGame = async page => {
  await page.waitForSelector('#game canvas', { state:'visible', timeout:20000 });
  await page.waitForFunction(() => document.querySelector('#orientation-gate')?.getAttribute('data-visible') !== 'true');
  await page.waitForTimeout(500);
};
const hideDebug = page => page.evaluate(() => { const el=document.querySelector('.mpt-debug-panel'); if(el) el.style.display='none'; });
const shot = (page, name) => page.screenshot({ path:`${outDir}/${name}.png` });
const tap = async (page,x,y) => { await page.mouse.move(x,y); await page.mouse.down(); await page.waitForTimeout(60); await page.mouse.up(); };
const setSave = async (page, value) => {
  await page.evaluate(({k,v}) => localStorage.setItem(k, JSON.stringify(v)), {k:SAVE_KEY,v:value});
  await page.reload({waitUntil:'domcontentloaded'}); await waitGame(page); await hideDebug(page);
};

// Fresh first-run mute: RU compact, then persistence; EN standard composition.
{
  const ctx = await browser.newContext({viewport:{width:800,height:720}, locale:'ru-RU'});
  const page = await ctx.newPage(); attachDiagnostics(page,'first-ru');
  await page.goto('http://127.0.0.1:5173/?debug=1&platform=mock',{waitUntil:'domcontentloaded'}); await waitGame(page);
  await page.evaluate(({s,k}) => { localStorage.removeItem(s); localStorage.removeItem(k); }, {s:SAVE_KEY,k:SETTINGS_KEY});
  await page.reload({waitUntil:'domcontentloaded'}); await waitGame(page); await hideDebug(page);
  await shot(page,'00-first-ru-unmuted');
  await tap(page,700,50); await page.waitForTimeout(250); await shot(page,'01-first-ru-muted');
  const settings = await page.evaluate(k => localStorage.getItem(k), SETTINGS_KEY);
  assertions.push({name:'first-run-mute-persists', pass:Boolean(settings && JSON.parse(settings).muted===true), observed:settings});
  await page.reload({waitUntil:'domcontentloaded'}); await waitGame(page); await hideDebug(page); await shot(page,'02-first-ru-muted-after-reload');
  await ctx.close();
}
{
  const ctx = await browser.newContext({viewport:{width:1280,height:720}, locale:'en-US'});
  const page = await ctx.newPage(); attachDiagnostics(page,'first-en');
  await page.goto('http://127.0.0.1:5173/?debug=1&platform=mock',{waitUntil:'domcontentloaded'}); await waitGame(page);
  await page.evaluate(({s,k}) => { localStorage.removeItem(s); localStorage.removeItem(k); }, {s:SAVE_KEY,k:SETTINGS_KEY});
  await page.reload({waitUntil:'domcontentloaded'}); await waitGame(page); await hideDebug(page); await shot(page,'03-first-en-unmuted');
  await ctx.close();
}

// Opening load failure card, both locales. Console parse error expected.
for (const cfg of [
  {tag:'ru',locale:'ru-RU',viewport:{width:800,height:720}},
  {tag:'en',locale:'en-US',viewport:{width:1280,height:720}},
]) {
  const ctx = await browser.newContext({viewport:cfg.viewport,locale:cfg.locale});
  const page = await ctx.newPage(); attachDiagnostics(page,`opening-failure-${cfg.tag}`,true);
  await page.goto('http://127.0.0.1:5173/?debug=1&platform=mock',{waitUntil:'domcontentloaded'}); await waitGame(page);
  await page.evaluate(k => localStorage.setItem(k,'{corrupt-json'), SAVE_KEY);
  await page.reload({waitUntil:'domcontentloaded'}); await page.waitForSelector('#game canvas',{state:'visible',timeout:20000}); await page.waitForTimeout(650); await hideDebug(page);
  await shot(page,`10-opening-failure-${cfg.tag}`);
  await ctx.close();
}

// Collection load failure: Opening starts from valid in-memory save, then storage is corrupted before entering Collection.
{
  const ctx = await browser.newContext({viewport:{width:800,height:720},locale:'ru-RU'});
  const page = await ctx.newPage(); attachDiagnostics(page,'collection-failure',true);
  await page.goto('http://127.0.0.1:5173/?debug=1&platform=mock',{waitUntil:'domcontentloaded'}); await waitGame(page);
  await setSave(page, save({totalOpens:3,chips:8,signal:1}));
  await page.evaluate(k => localStorage.setItem(k,'{corrupt-json'), SAVE_KEY);
  await tap(page,735,672); await page.waitForTimeout(650); await shot(page,'20-collection-failure-ru');
  await ctx.close();
}

// Safe-area pressure: verify real button location and Collection layout, rather than tapping the old viewport edge.
{
  const ctx = await browser.newContext({viewport:{width:960,height:640},locale:'ru-RU'});
  const page = await ctx.newPage(); attachDiagnostics(page,'safe-area');
  await page.goto('http://127.0.0.1:5173/?debug=1&platform=mock',{waitUntil:'domcontentloaded'}); await waitGame(page);
  await setSave(page, save({totalOpens:12,chips:60,signal:4}));
  await page.addStyleTag({content:':root{--safe-area-left:70px !important;--safe-area-right:55px !important;--safe-area-top:38px !important;--safe-area-bottom:42px !important;}'});
  await page.setViewportSize({width:961,height:640}); await page.waitForTimeout(350); await shot(page,'30-safe-area-idle');
  await tap(page,850,575); await page.waitForTimeout(600); await shot(page,'31-safe-area-collection');
  await ctx.close();
}

await fs.writeFile(`${outDir}/report.json`, JSON.stringify({auditedProductHead:PRODUCT_HEAD,auditHead:process.env.GITHUB_SHA??null,assertions,errors,expectedErrors,failedRequests},null,2));
await browser.close();
if (assertions.some(x=>!x.pass) || errors.length || failedRequests.length) process.exitCode=1;
