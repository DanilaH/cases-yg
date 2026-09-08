import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const outDir = process.env.AUDIT_OUT ?? 'tmp-result-choreography-audit';
await fs.mkdir(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
const page = await context.newPage();
const errors = [];
page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
page.on('console', (msg) => {
  if (msg.type() === 'error') errors.push(`console: ${msg.text()}`);
});
page.on('requestfailed', (request) => errors.push(`requestfailed: ${request.url()} ${request.failure()?.errorText ?? ''}`));

const baseUrl = 'http://127.0.0.1:5173/?platform=mock&debug=1';

async function waitReady(delay = 1900) {
  await page.locator('canvas').waitFor({ state: 'visible' });
  await page.waitForTimeout(delay);
}

async function expandDebug() {
  const debug = page.getByRole('button', { name: 'DEBUG', exact: true });
  if (await debug.count()) await debug.click();
}

async function collapseDebug() {
  const hide = page.getByRole('button', { name: 'Hide', exact: true });
  if (await hide.count()) await hide.click();
}

async function stage(name) {
  await expandDebug();
  const button = page.getByRole('button', { name, exact: true });
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 10000 }),
    button.click(),
  ]);
  await waitReady();
}

async function collectResult() {
  await page.mouse.click(640, 604);
  await page.waitForTimeout(1500);
}

async function tearBasic() {
  await page.mouse.move(482, 177);
  await page.mouse.down();
  await page.mouse.move(825, 177, { steps: 12 });
  await page.mouse.up();
}

await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
await waitReady(900);

// Hidden Pocket active page vs standard page chrome and heading visibility.
await stage('Force Hidden Pocket Duplicate');
await collapseDebug();
await page.screenshot({ path: `${outDir}/01-secret-active.png`, fullPage: true });
await page.mouse.move(640, 326);
await page.mouse.down();
await page.mouse.move(850, 326, { steps: 10 });
await page.mouse.up();
await page.waitForTimeout(350);
await page.screenshot({ path: `${outDir}/02-standard-active.png`, fullPage: true });

// Build a real 4/4 state, collect it, then perform a real opening. The Signal
// lock must fly into the still-closed pouch before the collectible reveal.
await stage('Reach SIGNAL LOCK');
await collectResult();
await collapseDebug();
await tearBasic();
await page.waitForTimeout(360);
await page.screenshot({ path: `${outDir}/03-signal-prelude-start.png`, fullPage: true });
await page.waitForTimeout(160);
await page.screenshot({ path: `${outDir}/04-signal-prelude-trail.png`, fullPage: true });
await page.waitForTimeout(430);
await page.screenshot({ path: `${outDir}/05-post-signal-reveal.png`, fullPage: true });

// Ensure a Charged pouch is affordable, select it, and verify pouch/aura exit
// frames do not leave a stationary glow behind.
await expandDebug();
const rewarded = page.getByRole('button', { name: /Rewarded \+60 DEV CHIPS/ });
await Promise.all([
  page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 10000 }),
  rewarded.click(),
]);
await waitReady(800);
await collapseDebug();
await page.mouse.click(140, 280);
await page.waitForTimeout(180);
await tearBasic();
await page.waitForTimeout(350);
await page.screenshot({ path: `${outDir}/06-charged-exit-start.png`, fullPage: true });
await page.waitForTimeout(220);
await page.screenshot({ path: `${outDir}/07-charged-exit-mid.png`, fullPage: true });
await page.waitForTimeout(300);
await page.screenshot({ path: `${outDir}/08-charged-post-exit.png`, fullPage: true });

await fs.writeFile(`${outDir}/report.json`, JSON.stringify({ errors }, null, 2));
await browser.close();

if (errors.length) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
}
