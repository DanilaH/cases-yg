const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('/tmp/hidpi-playwright/node_modules/playwright-core');

const baseUrl = process.env.BASE_URL || 'http://127.0.0.1:4173';
const chromePath = process.env.CHROME_BIN;
if (!chromePath) throw new Error('CHROME_BIN is required');

const outputDir = path.resolve('artifacts/hidpi-runtime');
fs.mkdirSync(outputDir, { recursive: true });

const waitForAnalytics = async (events, name, timeoutMs = 2500) => {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (events.some((event) => event.includes(name))) return;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error(`Timed out waiting for analytics event: ${name}\nSeen:\n${events.join('\n')}`);
};

const run = async () => {
  const browser = await chromium.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--autoplay-policy=no-user-gesture-required'],
  });

  const report = [];
  try {
    for (const dpr of [1, 2]) {
      const context = await browser.newContext({
        viewport: { width: 1280, height: 720 },
        deviceScaleFactor: dpr,
        locale: 'en-US',
      });
      const page = await context.newPage();
      const analytics = [];
      const runtimeErrors = [];

      page.on('console', (message) => {
        const text = message.text();
        if (text.includes('[analytics]')) analytics.push(text);
        if (message.type() === 'error') runtimeErrors.push(`console: ${text}`);
      });
      page.on('pageerror', (error) => runtimeErrors.push(`pageerror: ${error.message}`));

      await page.goto(`${baseUrl}/?platform=mock&debug`, { waitUntil: 'networkidle' });
      await page.waitForSelector('#game canvas');
      await waitForAnalytics(analytics, 'platform_ready', 4000);
      await page.waitForTimeout(350);

      const metrics = await page.evaluate(() => {
        const canvas = document.querySelector('#game canvas');
        if (!(canvas instanceof HTMLCanvasElement)) throw new Error('game canvas missing');
        const rect = canvas.getBoundingClientRect();
        return {
          devicePixelRatio: window.devicePixelRatio,
          backingWidth: canvas.width,
          backingHeight: canvas.height,
          clientWidth: canvas.clientWidth,
          clientHeight: canvas.clientHeight,
          rectWidth: rect.width,
          rectHeight: rect.height,
        };
      });

      const expectedWidth = 1280 * dpr;
      const expectedHeight = 720 * dpr;
      if (metrics.backingWidth !== expectedWidth || metrics.backingHeight !== expectedHeight) {
        throw new Error(`DPR ${dpr}: backing store ${metrics.backingWidth}x${metrics.backingHeight}, expected ${expectedWidth}x${expectedHeight}`);
      }
      if (Math.abs(metrics.rectWidth - 1280) > 0.5 || Math.abs(metrics.rectHeight - 720) > 0.5) {
        throw new Error(`DPR ${dpr}: CSS canvas size changed: ${metrics.rectWidth}x${metrics.rectHeight}`);
      }

      const toggle = page.locator('.mpt-debug-panel__toggle');
      if (await toggle.isVisible()) {
        const label = (await toggle.textContent())?.trim();
        if (label === 'Hide') await toggle.click();
      }

      await page.screenshot({ path: path.join(outputDir, `opening-dpr${dpr}.png`) });

      analytics.length = 0;
      await page.mouse.click(841, 660);
      await waitForAnalytics(analytics, 'drop_selected');
      await page.waitForTimeout(180);
      await page.screenshot({ path: path.join(outputDir, `drop-switched-dpr${dpr}.png`) });

      await page.evaluate(() => {
        const key = 'mystery-pocket-tech.save';
        const raw = window.localStorage.getItem(key);
        if (!raw) throw new Error('save missing');
        const save = JSON.parse(raw);
        save.chips = 120;
        save.pendingReveal = null;
        window.localStorage.setItem(key, JSON.stringify(save));
      });
      await page.reload({ waitUntil: 'networkidle' });
      await page.waitForSelector('#game canvas');
      await page.waitForTimeout(300);

      analytics.length = 0;
      await page.mouse.click(160, 309);
      await waitForAnalytics(analytics, 'pouch_selected');
      await page.waitForTimeout(220);
      await page.screenshot({ path: path.join(outputDir, `charged-dpr${dpr}.png`) });

      analytics.length = 0;
      await page.mouse.click(160, 241);
      await waitForAnalytics(analytics, 'pouch_selected');
      analytics.length = 0;
      await page.mouse.click(160, 309);
      await waitForAnalytics(analytics, 'pouch_selected');

      await page.evaluate(() => {
        const key = 'mystery-pocket-tech.save';
        const raw = window.localStorage.getItem(key);
        if (!raw) throw new Error('save missing');
        const save = JSON.parse(raw);
        save.totalOpens = Math.max(1, Number(save.totalOpens) || 0);
        window.localStorage.setItem(key, JSON.stringify(save));
      });
      await page.reload({ waitUntil: 'networkidle' });
      await page.waitForSelector('#game canvas');
      await page.waitForTimeout(300);

      analytics.length = 0;
      await page.mouse.click(1170, 668);
      await waitForAnalytics(analytics, 'collection_open');
      await page.waitForTimeout(300);
      await page.screenshot({ path: path.join(outputDir, `collection-shelf-dpr${dpr}.png`) });

      analytics.length = 0;
      await page.mouse.click(718, 129);
      await waitForAnalytics(analytics, 'collection_view_changed');
      await page.waitForTimeout(180);
      await page.screenshot({ path: path.join(outputDir, `collection-library-dpr${dpr}.png`) });

      if (runtimeErrors.length > 0) {
        throw new Error(`DPR ${dpr} runtime errors:\n${runtimeErrors.join('\n')}`);
      }

      report.push({
        dpr,
        metrics,
        interactionChecks: ['drop', 'charged', 'basic', 'charged-again', 'collection', 'library'],
        runtimeErrors,
      });
      await context.close();
    }
  } finally {
    await browser.close();
  }

  fs.writeFileSync(path.join(outputDir, 'report.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
};

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
