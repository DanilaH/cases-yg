import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const out = '/tmp/nav-audit';
await fs.mkdir(out, { recursive: true });
const report = { errors: [], failedRequests: [], captures: [] };
const browser = await chromium.launch({ headless: true, channel: 'chrome', args: ['--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist'] });
const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, locale: 'en-US' });
const page = await context.newPage();
page.on('pageerror', e => report.errors.push(e.message));
page.on('console', m => { if (m.type() === 'error') report.errors.push(m.text()); });
page.on('requestfailed', r => report.failedRequests.push({ url: r.url(), error: r.failure()?.errorText ?? 'unknown' }));
const base = 'http://127.0.0.1:5173/?debug=1&platform=mock';
const waitGame = async () => { await page.waitForSelector('#game canvas', { state:'visible', timeout:20000 }); await page.waitForTimeout(700); };
const hideDebug = async () => page.evaluate(() => { const p=document.querySelector('.mpt-debug-panel'); if(p) p.style.display='none'; });
const showDebug = async () => page.evaluate(() => { const p=document.querySelector('.mpt-debug-panel'); if(p) p.style.display=''; });
const capture = async name => { await page.screenshot({ path:path.join(out, name+'.png'), fullPage:true }); report.captures.push(name); };

await page.goto(base, { waitUntil:'domcontentloaded' });
await waitGame();
await showDebug();
await page.getByRole('button', { name:'Seed all 8/8 + 2/2', exact:true }).click();
await page.waitForTimeout(700);
await waitGame();
await hideDebug();
// Collection button at lower-right of the logical 1280x720 canvas.
await page.mouse.click(1155, 665);
await page.waitForTimeout(800);
await capture('01-collection-after-click');
// Open more button lower-left.
await page.mouse.click(130, 665);
await page.waitForTimeout(900);
await capture('02-opening-after-open-more');

await fs.writeFile(path.join(out,'report.json'), JSON.stringify(report,null,2));
await browser.close();
if (report.errors.length || report.failedRequests.length) process.exitCode=1;
