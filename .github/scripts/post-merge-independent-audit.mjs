import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const outDir = '/tmp/post-merge-independent-audit';
await fs.mkdir(outDir, { recursive: true });

const errors = [];
const failedRequests = [];
const checkpoints = [];

const browser = await chromium.launch({
  headless: true,
  args: ['--use-angle=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'],
});

const attachDiagnostics = (page) => {
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`);
  });
  page.on('requestfailed', (request) => {
    failedRequests.push({ url: request.url(), error: request.failure()?.errorText ?? 'unknown' });
  });
};

const waitReady = async (page) => {
  await page.waitForSelector('#game canvas', { state: 'visible', timeout: 20_000 });
  await page.waitForFunction(() => document.querySelector('#orientation-gate')?.getAttribute('data-visible') !== 'true');
  await page.waitForTimeout(700);
};

const setDebugVisible = async (page, visible) => {
  await page.evaluate((show) => {
    const panel = document.querySelector('.mpt-debug-panel');
    if (panel) panel.style.display = show ? '' : 'none';
  }, visible);
};

const clickReload = async (page, name) => {
  await setDebugVisible(page, true);
  await Promise.all([
    page.waitForEvent('framenavigated', { timeout: 10_000 }),
    page.getByRole('button', { name, exact: true }).click(),
  ]);
  await waitReady(page);
};

const shot = async (page, name) => {
  await page.screenshot({ path: `${outDir}/${name}.png` });
  checkpoints.push(name);
};

const context = await browser.newContext({
  viewport: { width: 1280, height: 720 },
  locale: 'en-US',
  recordVideo: { dir: outDir, size: { width: 1280, height: 720 } },
});
const page = await context.newPage();
attachDiagnostics(page);

await page.goto('http://127.0.0.1:5173/?debug=1&platform=mock', { waitUntil: 'domcontentloaded' });
await waitReady(page);
await clickReload(page, 'Reset save');
await setDebugVisible(page, false);

// Independent idle affordance check: star should visibly breathe without moving its anchor.
await page.waitForTimeout(100);
await shot(page, '01-idle-star-a-1280');
await page.waitForTimeout(260);
await shot(page, '02-idle-star-b-1280');
await page.waitForTimeout(360);
await shot(page, '03-idle-star-c-1280');

// Half drag: hint should disappear, strip/body relationship should remain coherent.
const starX = 640 - 158;
const starY = 266 - 83;
await page.mouse.move(starX, starY);
await page.mouse.down();
await page.mouse.move(starX + 145, starY, { steps: 10 });
await page.waitForTimeout(120);
await shot(page, '04-half-drag-1280');
await page.mouse.up();
await page.waitForTimeout(400);
await shot(page, '05-cancelled-drag-reset-1280');

// Fresh real opening: capture the transition itself rather than only a recovered debug result.
await page.mouse.move(starX, starY);
await page.mouse.down();
await page.mouse.move(starX + 315, starY, { steps: 16 });
await page.mouse.up();
for (const [name, delay] of [
  ['06-fresh-reveal-70ms', 70],
  ['07-fresh-reveal-160ms', 90],
  ['08-fresh-reveal-300ms', 140],
  ['09-fresh-reveal-500ms', 200],
  ['10-fresh-reveal-800ms', 300],
]) {
  await page.waitForTimeout(delay);
  await shot(page, name);
}
await page.waitForTimeout(1100);
await shot(page, '11-fresh-result-ready-a');
await page.waitForTimeout(110);
await shot(page, '12-fresh-result-ready-b');

// CTA must actually advance on pointer-down once ready.
await page.mouse.click(640, 568);
await page.waitForTimeout(500);
await shot(page, '13-after-result-continue-idle');

// Result composition checks for tall and high-rarity assets.
await clickReload(page, 'Force Epic Phone');
await setDebugVisible(page, false);
await page.waitForTimeout(1000);
await shot(page, '14-epic-phone-result-1280');

await clickReload(page, 'Force Legendary');
await setDebugVisible(page, false);
await page.waitForTimeout(1000);
await shot(page, '15-legendary-result-1280');

// Hidden Pocket: Secret starts active, Standard can be selected, selection survives resize,
// then swiping back to Secret should still produce the correct side scale with no drift.
await clickReload(page, 'Force Hidden Pocket');
await setDebugVisible(page, false);
await page.waitForTimeout(1000);
await shot(page, '16-hidden-secret-initial-1280');

await page.mouse.move(640, 326);
await page.mouse.down();
await page.mouse.move(715, 326, { steps: 8 });
await shot(page, '17-hidden-mid-drag-to-standard');
await page.mouse.move(790, 326, { steps: 8 });
await page.mouse.up();
await page.waitForTimeout(260);
await shot(page, '18-hidden-standard-selected-1280');

await page.setViewportSize({ width: 900, height: 720 });
await page.waitForTimeout(420);
await shot(page, '19-hidden-standard-after-resize-900');

await page.setViewportSize({ width: 1280, height: 720 });
await page.waitForTimeout(420);
await shot(page, '20-hidden-standard-after-resize-back-1280');

await page.mouse.move(640, 326);
await page.mouse.down();
await page.mouse.move(490, 326, { steps: 12 });
await page.mouse.up();
await page.waitForTimeout(260);
await shot(page, '21-hidden-secret-selected-again-1280');

// Wide idle composition.
await page.setViewportSize({ width: 1728, height: 720 });
await page.waitForTimeout(350);
await clickReload(page, 'Reset save');
await setDebugVisible(page, false);
await page.waitForTimeout(400);
await shot(page, '22-idle-1728');
await context.close();

// RU narrow-ish layout sanity.
const ruContext = await browser.newContext({
  viewport: { width: 1024, height: 720 },
  locale: 'ru-RU',
  recordVideo: { dir: outDir, size: { width: 1024, height: 720 } },
});
const ruPage = await ruContext.newPage();
attachDiagnostics(ruPage);
await ruPage.goto('http://127.0.0.1:5173/?debug=1&platform=mock', { waitUntil: 'domcontentloaded' });
await waitReady(ruPage);
await clickReload(ruPage, 'Force Hidden Pocket');
await setDebugVisible(ruPage, false);
await ruPage.waitForTimeout(1000);
await shot(ruPage, '23-hidden-ru-1024');
await ruContext.close();

await fs.writeFile(
  `${outDir}/report.json`,
  JSON.stringify({
    auditedBaseCommit: '4922a88a9fd836391241235f207b788a0e060f29',
    checkpoints,
    errors,
    failedRequests,
  }, null, 2),
);

await browser.close();
if (errors.length || failedRequests.length) process.exitCode = 1;
