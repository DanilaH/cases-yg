import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const PRODUCT_HEAD = '7a47bab77e27ffa1d92111ffd12283901314ea3d';
const SAVE_KEY = 'mystery-pocket-tech.save';
const outDir = '/tmp/final-independent-pass-3';
const errors = [];
const failedRequests = [];
const assertions = [];

await fs.rm(outDir, { recursive: true, force: true });
await fs.mkdir(outDir, { recursive: true });

const baseSave = (overrides = {}) => ({ version: 2, discoveredStandard: [], discoveredSecrets: [], chips: 0, signal: 0, activeLootPoolId: 'y2k-essentials', totalOpens: 0, pendingReveal: null, muted: false, stats: { duplicates: 0, hiddenPockets: 0 }, ...overrides });
const browser = await chromium.launch({ headless: true, channel: 'chrome', args: ['--use-angle=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] });
const diagnostics = (page, tag) => {
  page.on('pageerror', e => errors.push(`${tag}: ${e.message}`));
  page.on('console', m => { if (m.type() === 'error') errors.push(`${tag}: ${m.text()}`); });
  page.on('requestfailed', r => failedRequests.push({ tag, url: r.url(), error: r.failure()?.errorText ?? 'unknown' }));
};
const waitCanvas = async page => { await page.waitForSelector('#game canvas', { state: 'visible', timeout: 20000 }); await page.waitForFunction(() => document.querySelector('#orientation-gate')?.getAttribute('data-visible') !== 'true'); await page.waitForTimeout(450); };
const hideDebug = async page => page.evaluate(() => { const p = document.querySelector('.mpt-debug-panel'); if (p) p.style.display = 'none'; });
const showDebug = async page => page.evaluate(() => { const p = document.querySelector('.mpt-debug-panel'); if (p) p.style.display = ''; });
const shot = (page, name) => page.screenshot({ path: `${outDir}/${name}.png` });
const tap = async (page, x, y) => { await page.mouse.move(x, y); await page.mouse.down(); await page.waitForTimeout(55); await page.mouse.up(); };
const setSave = async (page, save) => { await page.evaluate(({k,v}) => localStorage.setItem(k, JSON.stringify(v)), {k:SAVE_KEY,v:save}); await page.reload({waitUntil:'domcontentloaded'}); await waitCanvas(page); await hideDebug(page); };
const stage = async (page, name) => { await showDebug(page); await Promise.all([page.waitForEvent('framenavigated',{timeout:10000}), page.getByRole('button',{name,exact:true}).click()]); await waitCanvas(page); await hideDebug(page); };

// 1) Resize during active reveal: the old geometry should not linger/clamp for seconds.
const revealCtx = await browser.newContext({ viewport:{width:1280,height:720}, locale:'en-US', recordVideo:{dir:outDir,size:{width:1280,height:720}} });
const reveal = await revealCtx.newPage(); diagnostics(reveal,'reveal-resize');
await reveal.goto('http://127.0.0.1:5173/?debug=1&platform=mock',{waitUntil:'domcontentloaded'}); await waitCanvas(reveal); await setSave(reveal, baseSave({chips:200,totalOpens:20}));
await stage(reveal,'Force Epic');
await reveal.waitForTimeout(500);
await shot(reveal,'00-wide-reveal-before-resize');
await reveal.setViewportSize({width:800,height:720});
for (const [i,d] of [60,180,400,850,1400].entries()) { await reveal.waitForTimeout(d); await shot(reveal,`01-compact-reveal-${i}`); }
await reveal.waitForTimeout(1800); await shot(reveal,'02-compact-result-after-reveal');
await revealCtx.close();

// 2) Partial tear drag cancel + rapid repeated input must recover to stable idle without accidental open.
const inputCtx = await browser.newContext({ viewport:{width:800,height:720}, locale:'ru-RU', recordVideo:{dir:outDir,size:{width:800,height:720}} });
const input = await inputCtx.newPage(); diagnostics(input,'input-stress');
await input.goto('http://127.0.0.1:5173/?debug=1&platform=mock',{waitUntil:'domcontentloaded'}); await waitCanvas(input); await setSave(input, baseSave({chips:100,totalOpens:7}));
await shot(input,'10-compact-idle-before-drag');
await input.mouse.move(390,390); await input.mouse.down(); await input.mouse.move(455,390,{steps:5}); await input.mouse.up(); await input.waitForTimeout(300); await shot(input,'11-compact-after-drag-cancel');
for (let i=0;i<5;i++) await tap(input,400,390);
await input.waitForTimeout(350); await shot(input,'12-compact-after-rapid-taps');
const stressSave = await input.evaluate(k => JSON.parse(localStorage.getItem(k) ?? 'null'), SAVE_KEY);
assertions.push({name:'rapid-taps-do-not-open',pass:Boolean(stressSave && stressSave.totalOpens===7 && stressSave.pendingReveal===null),observed:stressSave&&{totalOpens:stressSave.totalOpens,pendingReveal:stressSave.pendingReveal}});
await inputCtx.close();

// 3) Hidden Pocket result: compact resize + swipe both ways should remain coherent.
const hpCtx = await browser.newContext({ viewport:{width:1280,height:720}, locale:'en-US', recordVideo:{dir:outDir,size:{width:1280,height:720}} });
const hp = await hpCtx.newPage(); diagnostics(hp,'hidden-pocket');
await hp.goto('http://127.0.0.1:5173/?debug=1&platform=mock',{waitUntil:'domcontentloaded'}); await waitCanvas(hp); await setSave(hp,baseSave({chips:200,totalOpens:15})); await stage(hp,'Force Hidden Pocket');
await hp.waitForTimeout(3600); await shot(hp,'20-wide-hidden-pocket-result');
await hp.setViewportSize({width:800,height:720}); await hp.waitForTimeout(450); await shot(hp,'21-compact-hidden-pocket-result');
await hp.mouse.move(500,330); await hp.mouse.down(); await hp.mouse.move(310,330,{steps:8}); await hp.mouse.up(); await hp.waitForTimeout(400); await shot(hp,'22-compact-hidden-pocket-swiped');
await hp.mouse.move(310,330); await hp.mouse.down(); await hp.mouse.move(500,330,{steps:8}); await hp.mouse.up(); await hp.waitForTimeout(400); await shot(hp,'23-compact-hidden-pocket-swiped-back');
await hpCtx.close();

// 4) Extreme-but-valid HUD values and mute toggle on compact.
const hudCtx = await browser.newContext({viewport:{width:800,height:720},locale:'en-US'}); const hud=await hudCtx.newPage(); diagnostics(hud,'hud');
await hud.goto('http://127.0.0.1:5173/?debug=1&platform=mock',{waitUntil:'domcontentloaded'}); await waitCanvas(hud); await setSave(hud,baseSave({chips:999999,signal:4,totalOpens:999})); await shot(hud,'30-compact-extreme-hud');
await tap(hud,735,55); await hud.waitForTimeout(250); await shot(hud,'31-compact-muted');
await hudCtx.close();

await fs.writeFile(`${outDir}/report.json`,JSON.stringify({auditedProductHead:PRODUCT_HEAD,auditHead:process.env.GITHUB_SHA??null,assertions,errors,failedRequests},null,2));
await browser.close();
if (assertions.some(x=>!x.pass)||errors.length||failedRequests.length) process.exitCode=1;
