import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const outDir = process.env.AUDIT_OUT ?? 'tmp-final-result-panel-audit';
await fs.mkdir(outDir, { recursive: true });

const errors = [];
const assertions = [];
const note = (name, pass, detail = '') => {
  assertions.push({ name, pass, detail });
  if (!pass) errors.push(`assertion: ${name}${detail ? ` — ${detail}` : ''}`);
};

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
const page = await context.newPage();
page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
page.on('console', (msg) => {
  if (msg.type() === 'error') errors.push(`console: ${msg.text()}`);
});
page.on('requestfailed', (request) => errors.push(`requestfailed: ${request.url()} ${request.failure()?.errorText ?? ''}`));

const baseUrl = 'http://127.0.0.1:5173/?platform=mock&debug=1';

async function waitReady(delay = 900) {
  await page.locator('canvas').waitFor({ state: 'visible' });
  await page.waitForFunction(() => Boolean(window.__mptAuditGame?.scene?.getScene('OpeningScene')));
  if (delay) await page.waitForTimeout(delay);
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

async function sceneEval(fn, arg) {
  return page.evaluate(([source, value]) => {
    const scene = window.__mptAuditGame?.scene?.getScene('OpeningScene');
    if (!scene) throw new Error('OpeningScene unavailable');
    // Audit-only dynamic function keeps the script independent of TS private modifiers.
    return Function('scene', 'arg', `return (${source})(scene, arg);`)(scene, value);
  }, [fn.toString(), arg]);
}

async function selectCarousel(index) {
  await sceneEval((scene, nextIndex) => {
    if (!scene.lastReveal || !scene.root) throw new Error('Opening result scene not available');
    scene.resultCarouselIndex = nextIndex;
    scene.positionResultCarousel(0, false);
    scene.syncCarouselRewardBreathing();
    scene.renderRewardTray(scene.lastReveal, scene.root, false);
    scene.renderResultActionPanel(scene.lastReveal);
  }, index);
  await page.waitForTimeout(180);
}

async function installSignalOrderProbe() {
  await sceneEval((scene) => {
    const events = [];
    scene.__finalPanelAuditEvents = events;
    const now = () => Math.round(performance.now());

    const originalPrelude = scene.animateSignalLockConsumptionPrelude.bind(scene);
    scene.animateSignalLockConsumptionPrelude = async function (pending) {
      events.push({ name: 'prelude:start', t: now(), signal: pending.signal.before });
      scene.__finalPanelAuditInPrelude = true;
      const result = await originalPrelude(pending);
      scene.__finalPanelAuditInPrelude = false;
      events.push({ name: 'prelude:end', t: now(), signal: pending.signal.after });
      return result;
    };

    const originalHud = scene.renderSignalHud.bind(scene);
    scene.renderSignalHud = function (root, state) {
      if (scene.__finalPanelAuditInPrelude && state?.signal === 0) {
        events.push({ name: 'hud:post-consume', t: now(), signal: state.signal });
      }
      return originalHud(root, state);
    };

    const originalReveal = scene.animateStandardReveal.bind(scene);
    scene.animateStandardReveal = async function (pending) {
      events.push({ name: 'reveal:start', t: now(), signal: pending.signal.after });
      return originalReveal(pending);
    };
  });
}

async function prepareRealSignalLock() {
  await stage('Reach SIGNAL LOCK', 2100);
  await reloadIdle(850);
  await collapseDebug();
}

async function runSignalConsume(label, fastForward) {
  await prepareRealSignalLock();
  await installSignalOrderProbe();
  await tearPouch();
  if (fastForward) {
    await page.waitForTimeout(150);
    await page.mouse.click(650, 330);
    await page.waitForTimeout(70);
    await page.mouse.click(650, 330);
  }
  await page.waitForTimeout(190);
  await page.screenshot({ path: `${outDir}/${label}-signal-flight.png`, fullPage: true });
  await page.waitForTimeout(fastForward ? 1750 : 2500);
  const events = await sceneEval((scene) => scene.__finalPanelAuditEvents ?? []);
  const names = events.map((event) => event.name);
  const pStart = names.indexOf('prelude:start');
  const hud = names.indexOf('hud:post-consume');
  const pEnd = names.indexOf('prelude:end');
  const reveal = names.indexOf('reveal:start');
  note(`${label}: signal ordering`, pStart >= 0 && hud > pStart && pEnd > hud && reveal > pEnd, JSON.stringify(events));
  return events;
}

await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
await waitReady(900);

// Normal consumed-lock flow also provides the final info-panel state for copy/accent/layout checks.
await runSignalConsume('01-normal', false);
await page.waitForTimeout(1500);
const panel = await sceneEval((scene) => {
  const resultPanel = scene.resultActionPanel;
  const status = resultPanel?.getData('status');
  const accent = resultPanel?.getData('statusAccent');
  const hint = resultPanel?.getData('hint');
  const title = resultPanel?.getData('title');
  return {
    panelY: resultPanel?.y ?? null,
    titleY: title?.y ?? null,
    statusY: status?.y ?? null,
    hintY: hint?.y ?? null,
    statusText: status?.text ?? null,
    accentText: accent?.text ?? null,
    accentColor: accent?.style?.color ?? null,
    accentVisible: accent?.visible ?? false,
  };
});
note('panel anchor is lowest safe Y', panel.panelY === 612, JSON.stringify(panel));
note('panel rows use balanced anchors', panel.titleY === -31 && panel.statusY === 1 && panel.hintY === 35, JSON.stringify(panel));
note('consumed copy names Signal Lock explicitly', panel.accentText?.includes('SIGNAL LOCK CONSUMED') === true, JSON.stringify(panel));
note('consumed state is visibly accented', panel.accentVisible && panel.accentColor?.toLowerCase() === '#ff9ed4', JSON.stringify(panel));
await page.screenshot({ path: `${outDir}/02-consumed-result-panel-1280.png`, fullPage: true });

// Fast-forward must shorten beats without reordering the consumed-lock semantic contract.
await runSignalConsume('03-fast-forward', true);

// Hidden Pocket heading must stay derived from the moved panel and follow active carousel state.
await stage('Force Hidden Pocket Duplicate', 2200);
await collapseDebug();
await selectCarousel(1);
let hidden = await sceneEval((scene) => ({
  panelY: scene.resultActionPanel?.y ?? null,
  headingY: scene.resultCarouselHeading?.y ?? null,
  headingVisible: scene.resultCarouselHeading?.visible ?? false,
  expectedHeadingY: scene.getHiddenPocketHeadingY(),
}));
note('Hidden Pocket heading follows panel anchor', hidden.panelY === 612 && hidden.headingY === hidden.expectedHeadingY, JSON.stringify(hidden));
note('Hidden Pocket heading visible on Secret', hidden.headingVisible === true, JSON.stringify(hidden));
await page.screenshot({ path: `${outDir}/04-hidden-secret-1280.png`, fullPage: true });
await selectCarousel(0);
hidden = await sceneEval((scene) => ({ headingVisible: scene.resultCarouselHeading?.visible ?? false }));
note('Hidden Pocket heading hidden on standard carousel page', hidden.headingVisible === false, JSON.stringify(hidden));
await page.screenshot({ path: `${outDir}/05-hidden-standard-1280.png`, fullPage: true });

// Dense reward at desktop, then repeat at a narrower landscape viewport.
await sceneEval((scene) => {
  const pending = scene.lastReveal;
  if (!pending || !scene.root) throw new Error('No result available for dense reward probe');
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
let trayBounds = await sceneEval((scene) => {
  const tray = scene.rewardTrayContainer;
  const bounds = tray?.getBounds();
  return {
    storedHeight: Number(tray?.getData('height') ?? 0),
    width: bounds?.width ?? 0,
    height: bounds?.height ?? 0,
  };
});
note('dense reward stays within tray bounds at 1280', trayBounds.width <= 250 && trayBounds.height <= trayBounds.storedHeight + 4, JSON.stringify(trayBounds));
await page.screenshot({ path: `${outDir}/06-dense-reward-1280.png`, fullPage: true });

await page.setViewportSize({ width: 900, height: 720 });
await page.waitForTimeout(500);
await selectCarousel(0);
await sceneEval((scene) => {
  const pending = scene.lastReveal;
  if (!pending || !scene.root) throw new Error('No result available after narrow resize');
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
trayBounds = await sceneEval((scene) => {
  const tray = scene.rewardTrayContainer;
  const bounds = tray?.getBounds();
  const metrics = scene.metrics;
  return {
    storedHeight: Number(tray?.getData('height') ?? 0),
    width: bounds?.width ?? 0,
    height: bounds?.height ?? 0,
    left: bounds?.left ?? 0,
    right: bounds?.right ?? 0,
    safeLeft: metrics?.safeLeft ?? 0,
    safeRight: metrics?.safeRight ?? 900,
    panelY: scene.resultActionPanel?.y ?? null,
  };
});
note('dense reward stays bounded at 900x720', trayBounds.width <= 250 && trayBounds.height <= trayBounds.storedHeight + 4, JSON.stringify(trayBounds));
note('narrow reward remains inside safe horizontal area', trayBounds.left >= trayBounds.safeLeft - 2 && trayBounds.right <= trayBounds.safeRight + 2, JSON.stringify(trayBounds));
note('result panel anchor survives narrow resize', trayBounds.panelY === 612, JSON.stringify(trayBounds));
await page.screenshot({ path: `${outDir}/07-dense-reward-900.png`, fullPage: true });

// Restore desktop before the Charged recovery probe.
await page.setViewportSize({ width: 1280, height: 720 });
await page.waitForTimeout(400);

// Debug Force Legendary stages a charged pendingReveal and reloads; this is the real recovery path.
await expandDebug();
const legendary = page.getByRole('button', { name: 'Force Legendary (Charged)', exact: true });
await Promise.all([
  page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 10000 }),
  legendary.click(),
]);
await page.locator('canvas').waitFor({ state: 'visible' });
await page.waitForFunction(() => {
  const scene = window.__mptAuditGame?.scene?.getScene('OpeningScene');
  return Boolean(scene?.lastReveal?.pouchType === 'charged');
});
const chargedStart = await sceneEval((scene) => ({
  pouchType: scene.lastReveal?.pouchType ?? null,
  phase: scene.phase,
  auraActive: Boolean(scene.chargedAura?.active),
  auraAlpha: scene.chargedAura?.alpha ?? null,
  pouchAlpha: scene.pouch?.group?.alpha ?? null,
}));
note('Charged recovery uses a charged pending reveal', chargedStart.pouchType === 'charged', JSON.stringify(chargedStart));
await page.screenshot({ path: `${outDir}/08-charged-recovery-start.png`, fullPage: true });
await page.waitForTimeout(85);
const chargedMid = await sceneEval((scene) => ({
  auraActive: Boolean(scene.chargedAura?.active),
  auraAlpha: scene.chargedAura?.alpha ?? null,
  pouchAlpha: scene.pouch?.group?.alpha ?? null,
}));
await page.screenshot({ path: `${outDir}/09-charged-recovery-mid.png`, fullPage: true });
await page.waitForTimeout(190);
const chargedEnd = await sceneEval((scene) => ({
  auraExists: scene.chargedAura !== null,
  pouchAlpha: scene.pouch?.group?.alpha ?? null,
}));
note('Charged recovery tears down aura after exit tween', chargedEnd.auraExists === false, JSON.stringify({ chargedStart, chargedMid, chargedEnd }));
note(
  'Charged recovery shows a non-instant exit sample',
  chargedStart.auraAlpha === null || chargedMid.auraAlpha === null || chargedStart.auraAlpha >= chargedMid.auraAlpha,
  JSON.stringify({ chargedStart, chargedMid }),
);
await page.screenshot({ path: `${outDir}/10-charged-recovery-post.png`, fullPage: true });

await fs.writeFile(
  `${outDir}/report.json`,
  JSON.stringify({ errors, assertions, chargedStart, chargedMid, chargedEnd }, null, 2),
);
await browser.close();

if (errors.length) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
}
