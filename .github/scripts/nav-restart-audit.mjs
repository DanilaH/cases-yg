import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const outDir = '/tmp/nav-restart-audit';
await fs.mkdir(outDir, { recursive: true });
const errors = [];
const failedRequests = [];
const browser = await chromium.launch({ headless: true, channel: 'chrome', args: ['--use-angle=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] });
const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, locale: 'en-US' });
const page = await context.newPage();
page.on('pageerror', (error) => errors.push(error.message));
page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
page.on('requestfailed', (request) => failedRequests.push({ url: request.url(), error: request.failure()?.errorText ?? 'unknown' }));

await page.goto('http://127.0.0.1:5173/?debug=1&platform=mock', { waitUntil: 'domcontentloaded' });
await page.waitForSelector('#game canvas', { state: 'visible', timeout: 20_000 });
await page.waitForTimeout(900);
const seed = page.getByRole('button', { name: 'Seed all 8/8 + 2/2', exact: true });
await seed.click();
await page.waitForTimeout(800);
await page.evaluate(() => { const panel = document.querySelector('.mpt-debug-panel'); if (panel) panel.style.display = 'none'; });

// Opening -> Collection.
await page.mouse.click(1170, 662);
await page.waitForTimeout(900);
await page.screenshot({ path: path.join(outDir, '01-collection.png'), fullPage: true });

// Collection -> Opening via Open more.
await page.mouse.click(105, 662);
await page.waitForTimeout(1200);
const screenshot = await page.screenshot({ path: path.join(outDir, '02-opening-after-open-more.png'), fullPage: true });
if (screenshot.length < 200_000) throw new Error(`Opening screenshot looks blank after restart (${screenshot.length} bytes)`);

await fs.writeFile(path.join(outDir, 'report.json'), JSON.stringify({ errors, failedRequests, screenshotBytes: screenshot.length }, null, 2));
await context.close();
await browser.close();
if (errors.length || failedRequests.length) process.exitCode = 1;
