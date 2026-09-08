import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const outDir = process.env.AUDIT_OUT ?? 'tmp-grid-polish-audit';
await fs.mkdir(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const report = { hardFailures: [], observations: [], states: [] };

const round = (value) => (typeof value === 'number' && Number.isFinite(value) ? Math.round(value * 10) / 10 : value);
const rect = (bounds) => bounds ? ({
  left: round(bounds.left), top: round(bounds.top), right: round(bounds.right), bottom: round(bounds.bottom),
  width: round(bounds.width), height: round(bounds.height), centerX: round(bounds.centerX), centerY: round(bounds.centerY),
}) : null;
const union = (...rects) => {
  const valid = rects.filter(Boolean);
  if (!valid.length) return null;
  const left = Math.min(...valid.map((r) => r.left));
  const top = Math.min(...valid.map((r) => r.top));
  const right = Math.max(...valid.map((r) => r.right));
  const bottom = Math.max(...valid.map((r) => r.bottom));
  return { left, top, right, bottom, width: right - left, height: bottom - top, centerX: (left + right) / 2, centerY: (top + bottom) / 2 };
};

const hard = (name, pass, detail) => {
  if (!pass) report.hardFailures.push({ name, detail });
};
const observe = (name, detail) => report.observations.push({ name, detail });

async function createAuditPage(locale, viewport) {
  const context = await browser.newContext({ locale, viewport });
  const page = await context.newPage();
  const runtimeErrors = [];
  page.on('pageerror', (error) => runtimeErrors.push(`pageerror: ${error.message}`));
  page.on('console', (msg) => { if (msg.type() === 'error') runtimeErrors.push(`console: ${msg.text()}`); });
  page.on('requestfailed', (request) => runtimeErrors.push(`requestfailed: ${request.url()} ${request.failure()?.errorText ?? ''}`));
  await page.goto('http://127.0.0.1:5173/?platform=mock&debug=1', { waitUntil: 'domcontentloaded' });
  await page.locator('canvas').waitFor({ state: 'visible' });
  await page.waitForFunction(() => Boolean(window.__mptGridAuditGame?.scene?.getScene('OpeningScene')));
  await page.waitForTimeout(700);
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
async function stage(page, buttonName) {
  await expandDebug(page);
  const button = page.getByRole('button', { name: buttonName, exact: true });
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 10000 }),
    button.click(),
  ]);
  await page.locator('canvas').waitFor({ state: 'visible' });
  await page.waitForFunction(() => {
    const scene = window.__mptGridAuditGame?.scene?.getScene('OpeningScene');
    return Boolean(scene && scene.phase === 'result' && scene.resultReady && scene.resultActionPanel?.active);
  }, null, { timeout: 12000 });
  await collapseDebug(page);
  await page.waitForTimeout(180);
}

async function sceneEval(page, fn, arg) {
  return page.evaluate(([source, value]) => {
    const scene = window.__mptGridAuditGame?.scene?.getScene('OpeningScene');
    if (!scene) throw new Error('OpeningScene unavailable');
    return Function('scene', 'arg', `return (${source})(scene, arg);`)(scene, value);
  }, [fn.toString(), arg]);
}

async function selectCarousel(page, index) {
  await sceneEval(page, (scene, nextIndex) => {
    if (!scene.lastReveal || !scene.root) throw new Error('No carousel result');
    scene.resultCarouselIndex = nextIndex;
    scene.positionResultCarousel(0, false);
    scene.syncCarouselRewardBreathing();
    scene.renderRewardTray(scene.lastReveal, scene.root, false);
    scene.renderResultActionPanel(scene.lastReveal);
  }, index);
  await page.waitForTimeout(120);
}

async function makeDenseReward(page) {
  await sceneEval(page, (scene) => {
    const pending = scene.lastReveal;
    if (!pending || !scene.root) throw new Error('No result for dense reward');
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
        secretBonus: 0,
        totalEarned: 323,
      },
      signal: { ...pending.signal, gain: 0, lockRetained: true, lockConsumed: false, lockReached: false },
      overcharge: { ...pending.overcharge, afterHundredths: 150, appliedGainHundredths: 50 },
      hiddenPocket: null,
    };
    scene.renderRewardTray(dense, scene.root, false);
    scene.renderResultActionPanel(dense);
    scene.lastReveal = dense;
  });
  await page.waitForTimeout(100);
}

async function captureState(page, meta) {
  const data = await sceneEval(page, (scene) => {
    const bounds = (obj) => {
      if (!obj?.active || !obj.getBounds) return null;
      const b = obj.getBounds();
      return { left: b.left, top: b.top, right: b.right, bottom: b.bottom, width: b.width, height: b.height, centerX: b.centerX, centerY: b.centerY };
    };
    const panel = scene.resultActionPanel;
    const title = panel?.getData('title');
    const rarity = panel?.getData('rarity');
    const diamond = rarity?.getData('diamond');
    const status = panel?.getData('status');
    const statusAccent = panel?.getData('statusAccent');
    const hint = panel?.getData('hint');
    const reward = scene.rewardTrayContainer;
    const rewardChildren = reward?.list?.map((child, index) => ({ index, type: child?.type ?? child?.constructor?.name ?? 'unknown', bounds: bounds(child), visible: child?.visible !== false, alpha: child?.alpha ?? 1 })) ?? [];
    const activeItem = scene.resultCarouselItems?.[scene.resultCarouselIndex] ?? scene.resultBreathTarget ?? null;
    return {
      language: document.documentElement.lang,
      phase: scene.phase,
      resultReady: scene.resultReady,
      metrics: scene.metrics ? {
        logicalWidth: scene.metrics.logicalWidth,
        centerX: scene.metrics.centerX,
        safeLeft: scene.metrics.safeLeft,
        safeRight: scene.metrics.safeRight,
        safeTop: scene.metrics.safeTop,
        safeBottom: scene.metrics.safeBottom,
        scale: scene.metrics.scale,
        offsetX: scene.metrics.offsetX,
      } : null,
      panel: panel ? {
        x: panel.x, y: panel.y, width: Number(panel.getData('panelWidth') ?? 0), height: 112,
        bounds: bounds(panel),
        title: bounds(title), rarity: bounds(rarity), diamond: bounds(diamond), status: bounds(status), statusAccent: bounds(statusAccent), hint: bounds(hint),
        titleText: title?.text ?? '', rarityText: rarity?.text ?? '', statusText: status?.text ?? '', accentText: statusAccent?.text ?? '', hintText: hint?.text ?? '',
      } : null,
      reward: reward ? {
        x: reward.x, y: reward.y, storedHeight: Number(reward.getData('height') ?? 0), side: reward.getData('side'), bounds: bounds(reward), children: rewardChildren,
      } : null,
      chipsHud: bounds(scene.chipsHudContainer),
      signalHud: bounds(scene.signalHudContainer),
      collection: bounds(scene.collectionButton),
      heading: bounds(scene.resultCarouselHeading),
      dots: scene.resultCarouselDots?.map((dot) => bounds(dot)) ?? [],
      activeItem: bounds(activeItem),
      carouselIndex: scene.resultCarouselIndex,
      hidden: Boolean(scene.lastReveal?.hiddenPocket),
    };
  });

  const p = data.panel;
  if (p) {
    const titleGroup = union(p.title, p.rarity, p.diamond);
    const statusGroup = union(p.status, p.statusAccent?.width > 0 ? p.statusAccent : null);
    const panelRect = { left: p.x - p.width / 2, right: p.x + p.width / 2, top: p.y - p.height / 2, bottom: p.y + p.height / 2 };
    data.panel.computed = {
      titleGroup, statusGroup, panelRect,
      titleCenterError: round(titleGroup ? titleGroup.centerX - p.x : null),
      statusCenterError: round(statusGroup ? statusGroup.centerX - p.x : null),
      hintCenterError: round(p.hint ? p.hint.centerX - p.x : null),
      topInset: round(titleGroup ? titleGroup.top - panelRect.top : null),
      bottomInset: round(p.hint ? panelRect.bottom - p.hint.bottom : null),
      firstGap: round(titleGroup && statusGroup ? statusGroup.centerY - titleGroup.centerY : null),
      secondGap: round(statusGroup && p.hint ? p.hint.centerY - statusGroup.centerY : null),
    };
    hard(`${meta.key}: panel centered`, Math.abs(data.panel.computed.titleCenterError ?? 99) <= 3 && Math.abs(data.panel.computed.statusCenterError ?? 99) <= 3 && Math.abs(data.panel.computed.hintCenterError ?? 99) <= 2, data.panel.computed);
    hard(`${meta.key}: panel text inside`, (titleGroup?.left ?? -Infinity) >= panelRect.left + 10 && (titleGroup?.right ?? Infinity) <= panelRect.right - 10 && (statusGroup?.left ?? -Infinity) >= panelRect.left + 10 && (statusGroup?.right ?? Infinity) <= panelRect.right - 10 && (p.hint?.left ?? -Infinity) >= panelRect.left + 10 && (p.hint?.right ?? Infinity) <= panelRect.right - 10, { panelRect, titleGroup, statusGroup, hint: p.hint });
    hard(`${meta.key}: vertical rhythm`, Math.abs((data.panel.computed.firstGap ?? 99) - (data.panel.computed.secondGap ?? 0)) <= 5 && (data.panel.computed.topInset ?? 0) >= 10 && (data.panel.computed.bottomInset ?? 0) >= 10, data.panel.computed);
  }

  if (data.chipsHud && data.signalHud) {
    hard(`${meta.key}: resource rail aligned`, Math.abs(data.chipsHud.left - data.signalHud.left) <= 1 && Math.abs(data.chipsHud.width - data.signalHud.width) <= 1, { chips: data.chipsHud, signal: data.signalHud });
  }

  if (data.reward?.bounds && data.metrics) {
    const rb = data.reward.bounds;
    hard(`${meta.key}: reward safe`, rb.left >= data.metrics.safeLeft - 2 && rb.right <= data.metrics.safeRight + 2, { reward: rb, metrics: data.metrics });
    if (data.chipsHud) hard(`${meta.key}: reward top aligns with HUD`, Math.abs(rb.top - data.chipsHud.top) <= 2, { rewardTop: rb.top, hudTop: data.chipsHud.top });
    if (data.signalHud) hard(`${meta.key}: reward separated from rail`, rb.left >= data.signalHud.right + 24, { rewardLeft: rb.left, railRight: data.signalHud.right });

    const trayRect = { left: data.reward.x - 122, right: data.reward.x + 122, top: data.reward.y, bottom: data.reward.y + data.reward.storedHeight };
    const visibleChildren = data.reward.children.filter((child) => child.index > 0 && child.visible && child.alpha > 0.01 && child.bounds && child.bounds.width > 0 && child.bounds.height > 0);
    const overflow = visibleChildren.filter((child) => child.bounds.left < trayRect.left - 1 || child.bounds.right > trayRect.right + 1 || child.bounds.top < trayRect.top - 1 || child.bounds.bottom > trayRect.bottom + 1);
    hard(`${meta.key}: reward children inside`, overflow.length === 0, { trayRect, overflow });
    data.reward.computed = {
      trayRect,
      leftFromCenter: round(rb.left - data.metrics.centerX),
      centerOffset: round(rb.centerX - data.metrics.centerX),
      rightFromCenter: round(rb.right - data.metrics.centerX),
      topInset: round(Math.min(...visibleChildren.map((child) => child.bounds.top)) - trayRect.top),
      bottomInset: round(trayRect.bottom - Math.max(...visibleChildren.map((child) => child.bounds.bottom)),
    };
  }

  if (data.heading && p) {
    data.headingGap = round((p.y - p.height / 2) - data.heading.bottom);
    hard(`${meta.key}: hidden heading separated from panel`, data.headingGap >= 8, { headingGap: data.headingGap, heading: data.heading, panel: p });
  }

  if (data.collection && p) {
    data.collectionVsPanel = {
      rightEdgeError: round(data.metrics ? data.collection.right - data.metrics.safeRight : null),
      centerToPanelBottom: round(data.collection.centerY - (p.y + p.height / 2)),
      bottomToPanelBottom: round(data.collection.bottom - (p.y + p.height / 2)),
    };
  }

  report.states.push({ meta, data });
  await page.screenshot({ path: `${outDir}/${meta.key}.png`, fullPage: true });
  return data;
}

const stateButtons = [
  ['common', 'Force Common'],
  ['duplicate', 'Force Duplicate'],
  ['lock-reached', 'Reach SIGNAL LOCK'],
  ['lock-consumed', 'Consume SIGNAL LOCK'],
  ['lock-waiting', 'SIGNAL LOCK waiting for Charged'],
  ['legendary', 'Force Legendary (Charged)'],
  ['hidden', 'Force Hidden Pocket'],
  ['hidden-duplicate', 'Force Hidden Pocket Duplicate'],
];

async function runSuite(locale, viewport, states, suffix) {
  const { context, page, runtimeErrors } = await createAuditPage(locale, viewport);
  for (const [id, button] of states) {
    await stage(page, button);
    if (id.startsWith('hidden')) {
      await selectCarousel(page, 1);
      await captureState(page, { key: `${suffix}-${id}-secret`, locale, viewport, scenario: id, carousel: 'secret' });
      await selectCarousel(page, 0);
      await captureState(page, { key: `${suffix}-${id}-standard`, locale, viewport, scenario: id, carousel: 'standard' });
    } else {
      await captureState(page, { key: `${suffix}-${id}`, locale, viewport, scenario: id });
    }
  }
  await stage(page, 'Force Duplicate');
  await makeDenseReward(page);
  await captureState(page, { key: `${suffix}-dense-reward`, locale, viewport, scenario: 'synthetic-dense' });
  hard(`${suffix}: runtime clean`, runtimeErrors.length === 0, runtimeErrors);
  await context.close();
}

await runSuite('en-US', { width: 1280, height: 720 }, stateButtons, 'en-1280');
await runSuite('en-US', { width: 900, height: 720 }, [
  ['lock-consumed', 'Consume SIGNAL LOCK'],
  ['lock-waiting', 'SIGNAL LOCK waiting for Charged'],
  ['hidden-duplicate', 'Force Hidden Pocket Duplicate'],
  ['legendary', 'Force Legendary (Charged)'],
], 'en-900');
await runSuite('ru-RU', { width: 900, height: 720 }, [
  ['duplicate', 'Force Duplicate'],
  ['lock-consumed', 'Consume SIGNAL LOCK'],
  ['lock-waiting', 'SIGNAL LOCK waiting for Charged'],
  ['hidden-duplicate', 'Force Hidden Pocket Duplicate'],
  ['legendary', 'Force Legendary (Charged)'],
], 'ru-900');
await runSuite('ru-RU', { width: 820, height: 700 }, [
  ['lock-consumed', 'Consume SIGNAL LOCK'],
  ['lock-waiting', 'SIGNAL LOCK waiting for Charged'],
  ['hidden-duplicate', 'Force Hidden Pocket Duplicate'],
], 'ru-820');

const panelWidths = [...new Set(report.states.map((state) => state.data.panel?.width).filter(Boolean))];
const rewardOffsets = report.states.map((state) => ({ key: state.meta.key, offset: state.data.reward?.computed?.centerOffset })).filter((entry) => typeof entry.offset === 'number');
const collectionOffsets = report.states.map((state) => ({ key: state.meta.key, ...state.data.collectionVsPanel })).filter((entry) => typeof entry.centerToPanelBottom === 'number');
observe('panel widths', panelWidths);
observe('panel width vs 2x HUD', report.states.slice(0, 1).map((state) => ({ panel: state.data.panel?.width, hud: state.data.chipsHud?.width, delta: round((state.data.panel?.width ?? 0) - 2 * (state.data.chipsHud?.width ?? 0)) })));
observe('reward center offsets', rewardOffsets);
observe('collection vs result panel', collectionOffsets);

await fs.writeFile(`${outDir}/report.json`, JSON.stringify(report, null, 2));
await browser.close();

if (report.hardFailures.length) {
  console.error(JSON.stringify(report.hardFailures, null, 2));
  process.exitCode = 1;
}
