import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdir } from 'node:fs/promises';

const BASE_URL = 'http://127.0.0.1:4173/?debug';
const OUT = 'review-artifacts';
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
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
  '-shortest',
  `${OUT}/${name}.mp4`,
];

const browser = await chromium.launch({
  headless: false,
  args: [
    '--no-sandbox',
    '--disable-dev-shm-usage',
    '--autoplay-policy=no-user-gesture-required',
    '--window-size=1280,720',
    '--window-position=0,0',
  ],
});
const context = await browser.newContext({ viewport: null, locale: 'en-US' });
const page = await context.newPage();
page.on('console', (message) => {
  if (message.type() === 'error') console.error('[browser]', message.text());
});

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

const resetSave = async () => {
  await revealDebugPanel();
  await setCollapsedAfterReload();
  const nav = page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 10000 });
  await page.getByRole('button', { name: 'Reset save' }).click();
  await nav;
  await waitGame();
};

const grantCharged = async () => {
  await revealDebugPanel();
  await setCollapsedAfterReload();
  const button = page.getByRole('button', { name: /Rewarded \+60 DEV CHIPS/ });
  const nav = page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 10000 });
  await button.click();
  await nav;
  await waitGame();
};

const stageScenario = async (label) => {
  await revealDebugPanel();
  await setCollapsedAfterReload();
  const nav = page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 10000 });
  await page.getByRole('button', { name: label }).click();
  await nav;
  await waitGame();
};

const canvasBox = async () => {
  const box = await page.locator('canvas').boundingBox();
  if (!box) throw new Error('Canvas has no bounding box');
  return box;
};

const dragPouch = async (duration = 900) => {
  const box = await canvasBox();
  const sx = box.x + box.width / 2 - 158;
  const sy = box.y + 177;
  const ex = sx + 322;
  await page.mouse.move(sx, sy);
  await page.mouse.down();
  const steps = 28;
  for (let step = 1; step <= steps; step += 1) {
    const t = step / steps;
    await page.mouse.move(sx + (ex - sx) * t, sy + Math.sin(t * Math.PI) * 2, { steps: 1 });
    await sleep(duration / steps);
  }
  await page.mouse.up();
};

const dropArrow = async (direction) => {
  const box = await canvasBox();
  const centerX = box.x + box.width / 2;
  const y = box.y + box.height - 60;
  const x = centerX + (direction > 0 ? 201 : -201);
  await page.mouse.click(x, y);
};

const selectCharged = async () => {
  const box = await canvasBox();
  await page.mouse.click(box.x + 132, box.y + 289);
  await sleep(450);
};

const advanceResult = async () => {
  const box = await canvasBox();
  await page.mouse.click(box.x + box.width / 2, box.y + box.height - 105);
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
  // Observe quiet idle first, then the delayed teaching hint and its finite star nudge.
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

await page.screenshot({ path: `${OUT}/final-state.png`, fullPage: true });
await browser.close();
