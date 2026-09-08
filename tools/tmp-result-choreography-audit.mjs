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

async function stage(name, delay = 1900) {
  await expandDebug();
  const button = page.getByRole('button', { name, exact: true });
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 10000 }),
    button.click(),
  ]);
  await waitReady(delay);
}

async function reloadIdle(delay = 800) {
  await page.reload({ waitUntil: 'domcontentloaded' });
  await waitReady(delay);
}

async function tearPouch() {
  await page.mouse.move(482, 177);
  await page.mouse.down();
  await page.mouse.move(825, 177, { steps: 12 });
  await page.mouse.up();
}

async function selectCarousel(index) {
  await page.evaluate((nextIndex) => {
    const game = window.__mptAuditGame;
    const scene = game?.scene.getScene('OpeningScene');
    if (!scene?.lastReveal || !scene.root) throw new Error('Opening result scene not available');
    scene.resultCarouselIndex = nextIndex;
    scene.positionResultCarousel(0, false);
    scene.syncCarouselRewardBreathing();
    scene.renderRewardTray(scene.lastReveal, scene.root, false);
    scene.renderResultActionPanel(scene.lastReveal);
  }, index);
  await page.waitForTimeout(220);
}

await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
await waitReady(900);

// Hidden Pocket heading lives above the info panel and carousel chrome follows the active page.
await stage('Force Hidden Pocket Duplicate');
await collapseDebug();
await page.screenshot({ path: `${outDir}/01-secret-active.png`, fullPage: true });
await selectCarousel(0);
await page.screenshot({ path: `${outDir}/02-standard-active.png`, fullPage: true });
await selectCarousel(1);
await page.screenshot({ path: `${outDir}/03-secret-restored.png`, fullPage: true });

// Force a deliberately dense standard reward to prove tray text remains bounded.
await selectCarousel(0);
await page.evaluate(() => {
  const game = window.__mptAuditGame;
  const scene = game?.scene.getScene('OpeningScene');
  if (!scene?.lastReveal || !scene.root) throw new Error('Opening result scene not available');
  const pending = scene.lastReveal;
  const dense = {
    ...pending,
    chips: {
      ...pending.chips,
      base: 20,
      cacheTier: 'mega',
      cacheBonus: 180,
      recycle: 15,
      rawEarned: 215,
      overchargeBonus: 108,
      secretBonus: pending.chips.secretBonus,
      totalEarned: 323 + pending.chips.secretBonus,
    },
    signal: { ...pending.signal, gain: 0, lockRetained: true, lockConsumed: false, lockReached: false },
    overcharge: { ...pending.overcharge, afterHundredths: 150, appliedGainHundredths: 50 },
  };
  scene.renderRewardTray(dense, scene.root, false);
});
await page.waitForTimeout(150);
await page.screenshot({ path: `${outDir}/04-dense-reward-bounded.png`, fullPage: true });

// Reach a real 4/4 committed state, reload to idle without accepting the visual result,
// then open a real pouch. Lock discharge must land in the still-closed pouch first.
await stage('Reach SIGNAL LOCK');
await reloadIdle();
await collapseDebug();
await tearPouch();
await page.waitForTimeout(250);
await page.screenshot({ path: `${outDir}/05-signal-prelude-start.png`, fullPage: true });
await page.waitForTimeout(170);
await page.screenshot({ path: `${outDir}/06-signal-prelude-trail.png`, fullPage: true });
await page.waitForTimeout(260);
await page.screenshot({ path: `${outDir}/07-post-signal-reveal.png`, fullPage: true });

// Charged aura exit: clean state, grant cost, select Charged, then capture exit frames.
await stage('Reset save', 700);
await expandDebug();
const rewarded = page.getByRole('button', { name: /Rewarded \+60 DEV CHIPS/ });
await Promise.all([
  page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 10000 }),
  rewarded.click(),
]);
await waitReady(700);
await collapseDebug();
await page.mouse.click(140, 280);
await page.waitForTimeout(180);
await tearPouch();
await page.waitForTimeout(340);
await page.screenshot({ path: `${outDir}/08-charged-exit-start.png`, fullPage: true });
await page.waitForTimeout(150);
await page.screenshot({ path: `${outDir}/09-charged-exit-mid.png`, fullPage: true });
await page.waitForTimeout(260);
await page.screenshot({ path: `${outDir}/10-charged-post-exit.png`, fullPage: true });

await fs.writeFile(`${outDir}/report.json`, JSON.stringify({ errors }, null, 2));
await browser.close();

if (errors.length) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
}
