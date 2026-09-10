import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdir } from 'node:fs/promises';

const BASE_URL = 'http://127.0.0.1:4173/?debug';
const OUT = 'review-artifacts';
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
await mkdir(OUT, { recursive: true });

const ffmpegArgs = (name) => [
  '-y',
  '-thread_queue_size', '512',
  '-f', 'x11grab',
  '-video_size', '1280x720',
  '-framerate', '30',
  '-i', ':99.0+0,0',
  '-thread_queue_size', '512',
  '-f', 'pulse',
  '-i', 'review_sink.monitor',
  '-c:v', 'libx264',
  '-preset', 'veryfast',
  '-crf', '20',
  '-pix_fmt', 'yuv420p',
  '-c:a', 'aac',
  '-b:a', '160k',
  `${OUT}/${name}.mp4`,
];

const browser = await chromium.launch({
  executablePath: '/usr/bin/google-chrome',
  headless: false,
  args: [
    '--no-sandbox',
    '--disable-dev-shm-usage',
    '--autoplay-policy=no-user-gesture-required',
    '--disable-gpu-sandbox',
    '--window-size=1280,720',
    '--window-position=0,0',
  ],
});
const context = await browser.newContext({ viewport: null, locale: 'en-US' });
const page = await context.newPage();
page.on('console', (message) => {
  if (message.type() === 'error') console.error('[browser]', message.text());
});
page.on('pageerror', (error) => console.error('[pageerror]', error.message));

const waitGame = async () => {
  await page.waitForSelector('canvas', { state: 'visible', timeout: 15000 });
  await page.waitForTimeout(1200);
};

const panelCollapsedKey = 'mystery-pocket-tech.debug-panel-collapsed';
const setCollapsedAfterReload = async () => {
  await page.evaluate((key) => sessionStorage.setItem(key, '1'), panelCollapsedKey);
};

const revealDebugPanel = async () => {
  const debug = page.getByRole('button', { name: 'DEBUG' });
  if (await debug.count()) await debug.click();
};

const triggerReloadingDebugAction = async (label) => {
  await revealDebugPanel();
  await setCollapsedAfterReload();
  const nav = page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 10000 });
  await page.getByRole('button', { name: label }).click();
  await nav;
  await waitGame();
};

const resetSave = async () => triggerReloadingDebugAction('Reset save');
const seedFullDefaultDrop = async () => triggerReloadingDebugAction('Seed all 8/8 + 2/2');
const stageScenario = async (label) => triggerReloadingDebugAction(label);

const grantCharged = async () => {
  await revealDebugPanel();
  await setCollapsedAfterReload();
  const button = page.getByRole('button', { name: /Rewarded \+60 DEV CHIPS/ });
  const nav = page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 10000 });
  await button.click();
  await nav;
  await waitGame();
};

const layout = async () => {
  const box = await page.locator('canvas').boundingBox();
  if (!box) throw new Error('Canvas has no bounding box');
  const scale = box.height / 720;
  const logicalWidth = clamp((box.width / box.height) * 720, 900, 1728);
  const offsetX = (box.width - logicalWidth * scale) / 2;
  const horizontalMargin = clamp(logicalWidth * 0.04, 28, 64);
  return {
    box,
    scale,
    logicalWidth,
    offsetX,
    centerX: logicalWidth / 2,
    safeLeft: Math.max(horizontalMargin, 16),
    safeRight: Math.min(logicalWidth - horizontalMargin, logicalWidth - 16),
    safeTop: 28,
    safeBottom: 692,
  };
};

const physicalPoint = (metrics, logicalX, logicalY) => ({
  x: metrics.box.x + metrics.offsetX + logicalX * metrics.scale,
  y: metrics.box.y + logicalY * metrics.scale,
});

const clickLogical = async (logicalX, logicalY) => {
  const metrics = await layout();
  const point = physicalPoint(metrics, logicalX(metrics), logicalY(metrics));
  await page.mouse.click(point.x, point.y);
};

const dragPouch = async (duration = 900) => {
  const metrics = await layout();
  const start = physicalPoint(metrics, metrics.centerX - 158, 177);
  const end = physicalPoint(metrics, metrics.centerX - 158 + 322, 177);
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  const steps = 28;
  for (let step = 1; step <= steps; step += 1) {
    const t = step / steps;
    await page.mouse.move(
      start.x + (end.x - start.x) * t,
      start.y + Math.sin(t * Math.PI) * 2 * metrics.scale,
      { steps: 1 },
    );
    await sleep(duration / steps);
  }
  await page.mouse.up();
};

const dropArrow = async (direction) => {
  await clickLogical(
    (metrics) => {
      const width = Math.min(470, Math.max(360, metrics.logicalWidth * 0.48));
      return metrics.centerX + direction * (width / 2 - 34);
    },
    (metrics) => metrics.safeBottom - 60,
  );
};

const selectCharged = async () => {
  await clickLogical((metrics) => metrics.safeLeft + 108, (metrics) => metrics.safeTop + 281);
  await sleep(450);
};

const advanceResult = async () => {
  await clickLogical((metrics) => metrics.centerX, () => 600);
};

const openCollection = async () => {
  await clickLogical((metrics) => metrics.safeRight - 64, (metrics) => metrics.safeBottom - 24);
};

const collectionTab = async (view) => {
  await clickLogical((metrics) => metrics.centerX + (view === 'library' ? 78 : -78), () => 128);
};

const collectionNext = async () => {
  await clickLogical((metrics) => metrics.centerX + 72, () => 640);
};

const collectionBack = async () => {
  await clickLogical((metrics) => metrics.safeLeft + 68, (metrics) => metrics.safeBottom - 20);
};

const record = async (name, action) => {
  const capture = spawn('ffmpeg', ffmpegArgs(name), { stdio: ['ignore', 'ignore', 'inherit'] });
  await sleep(900);
  try {
    await action();
  } finally {
    await sleep(900);
    capture.kill('SIGINT');
    await once(capture, 'close');
  }
};

await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
await waitGame();

await resetSave();
await record('01_idle_hint_basic_open', async () => {
  await sleep(6500);
  await dragPouch(1050);
  await sleep(3500);
  await advanceResult();
  await sleep(1800);
});

await resetSave();
await record('02_rapid_drop_switch', async () => {
  const pattern = [1, 1, -1, 1, 1, 1, -1, -1, 1, -1, 1];
  await sleep(700);
  for (const direction of pattern) {
    await dropArrow(direction);
    await sleep(85);
  }
  await sleep(2500);
});

await resetSave();
await grantCharged();
await record('03_charged_select_and_open', async () => {
  await sleep(500);
  await selectCharged();
  await sleep(700);
  await dragPouch(900);
  await sleep(4200);
  await advanceResult();
  await sleep(1800);
});

await resetSave();
await record('04_rarity_recovery_sequence', async () => {
  await stageScenario('Force Rare');
  await sleep(4200);
  await advanceResult();
  await sleep(1400);
  await stageScenario('Force Epic');
  await sleep(4700);
  await advanceResult();
  await sleep(1400);
  await stageScenario('Force Legendary (Charged)');
  await sleep(5200);
  await advanceResult();
  await sleep(1600);
});

await resetSave();
await record('05_duplicate_and_secret', async () => {
  await stageScenario('Force Duplicate');
  await sleep(3800);
  await advanceResult();
  await sleep(1400);
  await stageScenario('Force Hidden Pocket');
  await sleep(6500);
});

await resetSave();
await seedFullDefaultDrop();
await record('06_collection_consistency', async () => {
  await sleep(700);
  await openCollection();
  await sleep(1800);
  await collectionTab('library');
  await sleep(1400);
  await collectionNext();
  await sleep(1800);
  await collectionNext();
  await sleep(1800);
  await collectionTab('shelf');
  await sleep(1200);
  await collectionBack();
  await sleep(1800);
});

await page.screenshot({ path: `${OUT}/final-state.png`, fullPage: true });
await browser.close();
