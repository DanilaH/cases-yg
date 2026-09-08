import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const outDir = 'tmp-grid-polish-local-audit';
await fs.mkdir(outDir, { recursive: true });
const browser = await chromium.launch({ headless: true });
const report = { failures: [], metrics: [] };
const fail = (name, pass, detail) => { if (!pass) report.failures.push({ name, detail }); };
const round = (value) => Math.round(value * 10) / 10;

const union = (...items) => {
  const rects = items.filter(Boolean);
  if (!rects.length) return null;
  const left = Math.min(...rects.map((r) => r.left));
  const right = Math.max(...rects.map((r) => r.right));
  const top = Math.min(...rects.map((r) => r.top));
  const bottom = Math.max(...rects.map((r) => r.bottom));
  return { left, right, top, bottom, width: right - left, height: bottom - top, centerX: (left + right) / 2, centerY: (top + bottom) / 2 };
};

async function open(locale, viewport) {
  const context = await browser.newContext({ locale, viewport });
  const page = await context.newPage();
  const runtimeErrors = [];
  page.on('pageerror', (e) => runtimeErrors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error') runtimeErrors.push(`console: ${m.text()}`); });
  page.on('requestfailed', (r) => runtimeErrors.push(`requestfailed: ${r.url()} ${r.failure()?.errorText ?? ''}`));
  await page.goto('http://127.0.0.1:5173/?platform=mock&debug=1', { waitUntil: 'domcontentloaded' });
  await page.locator('canvas').waitFor({ state: 'visible' });
  await page.waitForFunction(() => Boolean(window.__mptGridAuditGame?.scene?.getScene('OpeningScene')));
  return { context, page, runtimeErrors };
}

async function expandDebug(page) {
  const button = page.getByRole('button', { name: 'DEBUG', exact: true });
  if (await button.count()) await button.click();
}
async function collapseDebug(page) {
  const button = page.getByRole('button', { name: 'Hide', exact: true });
  if (await button.count()) await button.click();
}
async function stage(page, name) {
  await expandDebug(page);
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 10000 }),
    page.getByRole('button', { name, exact: true }).click(),
  ]);
  await page.locator('canvas').waitFor({ state: 'visible' });
  await page.waitForFunction(() => {
    const scene = window.__mptGridAuditGame?.scene?.getScene('OpeningScene');
    return Boolean(scene?.phase === 'result' && scene?.resultReady && scene?.resultActionPanel?.active);
  }, null, { timeout: 12000 });
  await collapseDebug(page);
}
async function sceneEval(page, fn, arg) {
  return page.evaluate(([source, value]) => {
    const scene = window.__mptGridAuditGame?.scene?.getScene('OpeningScene');
    if (!scene) throw new Error('OpeningScene unavailable');
    return Function('scene', 'arg', `return (${source})(scene, arg);`)(scene, value);
  }, [fn.toString(), arg]);
}
async function selectCarousel(page, index) {
  await sceneEval(page, (scene, next) => {
    scene.resultCarouselIndex = next;
    scene.positionResultCarousel(0, false);
    scene.syncCarouselRewardBreathing();
    scene.renderRewardTray(scene.lastReveal, scene.root, false);
    scene.renderResultActionPanel(scene.lastReveal);
  }, index);
}
async function dense(page) {
  await sceneEval(page, (scene) => {
    const pending = scene.lastReveal;
    const next = {
      ...pending,
      hiddenPocket: null,
      chips: { ...pending.chips, base: 20, cacheTier: 'mega', cacheBonus: 180, recycle: 15, rawEarned: 215, overchargeBonus: 108, secretBonus: 0, totalEarned: 323 },
      signal: { ...pending.signal, gain: 0, lockRetained: true, lockConsumed: false, lockReached: false },
      overcharge: { ...pending.overcharge, afterHundredths: 150, appliedGainHundredths: 50 },
    };
    scene.lastReveal = next;
    scene.renderRewardTray(next, scene.root, false);
    scene.renderResultActionPanel(next);
  });
}

async function measure(page, key) {
  const data = await sceneEval(page, (scene) => {
    const localRect = (obj) => {
      if (!obj?.active) return null;
      const width = Number(obj.displayWidth ?? obj.width ?? 0);
      const height = Number(obj.displayHeight ?? obj.height ?? 0);
      const ox = Number(obj.originX ?? 0.5);
      const oy = Number(obj.originY ?? 0.5);
      const rotation = Number(obj.rotation ?? 0);
      const rotatedWidth = Math.abs(Math.cos(rotation)) * width + Math.abs(Math.sin(rotation)) * height;
      const rotatedHeight = Math.abs(Math.sin(rotation)) * width + Math.abs(Math.cos(rotation)) * height;
      return {
        left: obj.x - rotatedWidth * ox,
        right: obj.x + rotatedWidth * (1 - ox),
        top: obj.y - rotatedHeight * oy,
        bottom: obj.y + rotatedHeight * (1 - oy),
        width: rotatedWidth,
        height: rotatedHeight,
        centerX: obj.x + rotatedWidth * (0.5 - ox),
        centerY: obj.y + rotatedHeight * (0.5 - oy),
      };
    };
    const panel = scene.resultActionPanel;
    const title = panel?.getData('title');
    const rarity = panel?.getData('rarity');
    const diamond = rarity?.getData('diamond');
    const status = panel?.getData('status');
    const accent = panel?.getData('statusAccent');
    const hint = panel?.getData('hint');
    const reward = scene.rewardTrayContainer;
    return {
      language: document.documentElement.lang,
      metrics: scene.metrics ? { centerX: scene.metrics.centerX, safeLeft: scene.metrics.safeLeft, safeRight: scene.metrics.safeRight, safeTop: scene.metrics.safeTop, safeBottom: scene.metrics.safeBottom, logicalWidth: scene.metrics.logicalWidth } : null,
      panel: panel ? {
        x: panel.x, y: panel.y, width: Number(panel.getData('panelWidth') ?? 0), height: 112,
        title: localRect(title), rarity: localRect(rarity), diamond: localRect(diamond), status: localRect(status), accent: localRect(accent), hint: localRect(hint),
        titleText: title?.text ?? '', rarityText: rarity?.text ?? '', statusText: status?.text ?? '', accentText: accent?.text ?? '', hintText: hint?.text ?? '',
      } : null,
      reward: reward ? {
        x: reward.x, y: reward.y, height: Number(reward.getData('height') ?? 0), side: reward.getData('side'),
        texts: reward.list.filter((child) => child?.type === 'Text').map((child) => ({ text: child.text, rect: localRect(child) })),
        icons: reward.list.filter((child) => child?.type === 'Container' || child?.type === 'Rectangle').map((child) => ({ type: child.type, x: child.x, y: child.y })),
      } : null,
      chips: scene.chipsHudContainer ? { x: scene.chipsHudContainer.x, y: scene.chipsHudContainer.y } : null,
      signal: scene.signalHudContainer ? { x: scene.signalHudContainer.x, y: scene.signalHudContainer.y } : null,
      collection: scene.collectionButton ? { x: scene.collectionButton.x, y: scene.collectionButton.y, rect: localRect(scene.collectionButton) } : null,
      heading: scene.resultCarouselHeading?.visible ? localRect(scene.resultCarouselHeading) : null,
      headingY: scene.resultCarouselHeading?.visible ? scene.resultCarouselHeading.y : null,
      carouselIndex: scene.resultCarouselIndex,
    };
  });

  const p = data.panel;
  const m = data.metrics;
  if (!p || !m) throw new Error(`Missing panel/metrics for ${key}`);
  const titleGroup = union(p.title, p.rarity, p.diamond);
  const statusGroup = union(p.status, p.accent?.width > 0 ? p.accent : null);
  const panelRect = { left: -p.width / 2, right: p.width / 2, top: -p.height / 2, bottom: p.height / 2 };
  const panelMetrics = {
    titleCenter: round(titleGroup.centerX), statusCenter: round(statusGroup.centerX), hintCenter: round(p.hint.centerX),
    titleSideMin: round(Math.min(titleGroup.left - panelRect.left, panelRect.right - titleGroup.right)),
    statusSideMin: round(Math.min(statusGroup.left - panelRect.left, panelRect.right - statusGroup.right)),
    hintSideMin: round(Math.min(p.hint.left - panelRect.left, panelRect.right - p.hint.right)),
    topInset: round(titleGroup.top - panelRect.top), bottomInset: round(panelRect.bottom - p.hint.bottom),
    rowGap1: round(statusGroup.centerY - titleGroup.centerY), rowGap2: round(p.hint.centerY - statusGroup.centerY),
  };
  fail(`${key}: panel centers`, Math.abs(panelMetrics.titleCenter) <= 2 && Math.abs(panelMetrics.statusCenter) <= 2 && Math.abs(panelMetrics.hintCenter) <= 1, panelMetrics);
  fail(`${key}: panel side padding`, panelMetrics.titleSideMin >= 12 && panelMetrics.statusSideMin >= 12 && panelMetrics.hintSideMin >= 12, panelMetrics);
  fail(`${key}: panel vertical padding`, panelMetrics.topInset >= 8 && panelMetrics.bottomInset >= 8, panelMetrics);
  fail(`${key}: panel row rhythm`, Math.abs(panelMetrics.rowGap1 - panelMetrics.rowGap2) <= 4, panelMetrics);
  fail(`${key}: panel root centered`, Math.abs(p.x - m.centerX) <= 0.01, { panelX: p.x, centerX: m.centerX });

  fail(`${key}: rail x`, Math.abs(data.chips.x - data.signal.x) <= 0.01 && Math.abs(data.chips.x - m.safeLeft) <= 0.01, { chips: data.chips, signal: data.signal, safeLeft: m.safeLeft });
  fail(`${key}: rail y rhythm`, Math.abs((data.signal.y - data.chips.y) - 74) <= 0.01, { chipsY: data.chips.y, signalY: data.signal.y });

  const rewardMetrics = data.reward ? { width: 244, left: data.reward.x - 122, right: data.reward.x + 122, top: data.reward.y, bottom: data.reward.y + data.reward.height } : null;
  if (rewardMetrics) {
    const textOverflow = data.reward.texts.filter(({ rect }) => rect.left < -122 - 0.1 || rect.right > 122 + 0.1 || rect.top < -0.1 || rect.bottom > data.reward.height + 0.1);
    fail(`${key}: reward text inside`, textOverflow.length === 0, { reward: data.reward, textOverflow });
    fail(`${key}: reward top grid`, Math.abs(data.reward.y - (m.safeTop + 8)) <= 0.01, { rewardY: data.reward.y, expected: m.safeTop + 8 });
    fail(`${key}: reward safe`, rewardMetrics.left >= m.safeLeft && rewardMetrics.right <= m.safeRight, { rewardMetrics, safeLeft: m.safeLeft, safeRight: m.safeRight });
    fail(`${key}: reward rail separation`, rewardMetrics.left - (m.safeLeft + 216) >= 24, { rewardLeft: rewardMetrics.left, railRight: m.safeLeft + 216 });
  }

  let headingGap = null;
  if (data.heading) {
    headingGap = round((p.y - p.height / 2) - (data.headingY + data.heading.bottom - data.heading.centerY));
    fail(`${key}: hidden heading gap`, headingGap >= 8, { headingGap, heading: data.heading, headingY: data.headingY, panelTop: p.y - p.height / 2 });
  }

  let collectionMetrics = null;
  if (data.collection) {
    const collectionLeft = data.collection.x + data.collection.rect.left - data.collection.rect.centerX;
    const collectionRight = data.collection.x + data.collection.rect.right - data.collection.rect.centerX;
    const panelRight = p.x + p.width / 2;
    collectionMetrics = { left: round(collectionLeft), right: round(collectionRight), horizontalGap: round(collectionLeft - panelRight), y: round(data.collection.y), safeBottomGap: round(m.safeBottom - data.collection.y) };
    fail(`${key}: collection right anchor`, Math.abs(data.collection.x - m.safeRight) <= 0.01, { x: data.collection.x, safeRight: m.safeRight });
    fail(`${key}: collection/panel horizontal separation`, collectionMetrics.horizontalGap >= 20, collectionMetrics);
  }

  report.metrics.push({ key, panel: panelMetrics, reward: data.reward ? { height: data.reward.height, x: round(data.reward.x), textCount: data.reward.texts.length } : null, headingGap, collection: collectionMetrics, copy: { title: p.titleText, rarity: p.rarityText, status: p.statusText, accent: p.accentText, hint: p.hintText } });
}

async function suite(locale, viewport, suffix, entries) {
  const { context, page, runtimeErrors } = await open(locale, viewport);
  for (const [id, button, carousel] of entries) {
    await stage(page, button);
    if (carousel != null) await selectCarousel(page, carousel);
    await measure(page, `${suffix}-${id}`);
  }
  await stage(page, 'Force Duplicate');
  await dense(page);
  await measure(page, `${suffix}-dense`);
  fail(`${suffix}: runtime`, runtimeErrors.length === 0, runtimeErrors);
  await context.close();
}

await suite('en-US', { width: 1280, height: 720 }, 'en1280', [
  ['common', 'Force Common'], ['duplicate', 'Force Duplicate'], ['reached', 'Reach SIGNAL LOCK'], ['consumed', 'Consume SIGNAL LOCK'], ['waiting', 'SIGNAL LOCK waiting for Charged'], ['legendary', 'Force Legendary (Charged)'], ['hidden-secret', 'Force Hidden Pocket Duplicate', 1], ['hidden-standard', 'Force Hidden Pocket Duplicate', 0],
]);
await suite('en-US', { width: 900, height: 720 }, 'en900', [
  ['consumed', 'Consume SIGNAL LOCK'], ['waiting', 'SIGNAL LOCK waiting for Charged'], ['hidden-secret', 'Force Hidden Pocket Duplicate', 1], ['hidden-standard', 'Force Hidden Pocket Duplicate', 0],
]);
await suite('ru-RU', { width: 900, height: 720 }, 'ru900', [
  ['duplicate', 'Force Duplicate'], ['consumed', 'Consume SIGNAL LOCK'], ['waiting', 'SIGNAL LOCK waiting for Charged'], ['legendary', 'Force Legendary (Charged)'], ['hidden-secret', 'Force Hidden Pocket Duplicate', 1], ['hidden-standard', 'Force Hidden Pocket Duplicate', 0],
]);
await suite('ru-RU', { width: 820, height: 700 }, 'ru820', [
  ['consumed', 'Consume SIGNAL LOCK'], ['waiting', 'SIGNAL LOCK waiting for Charged'], ['hidden-secret', 'Force Hidden Pocket Duplicate', 1], ['hidden-standard', 'Force Hidden Pocket Duplicate', 0],
]);

await fs.writeFile(`${outDir}/report.json`, JSON.stringify(report, null, 2));
await browser.close();
if (report.failures.length) {
  console.error(JSON.stringify(report.failures, null, 2));
  process.exitCode = 1;
}
