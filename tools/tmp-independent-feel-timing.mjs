import { chromium } from 'playwright';
import fs from 'node:fs';

const OUT = 'audit-independent-feel-timing';
fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
const badResponses = [];
page.on('pageerror', (error) => errors.push(`pageerror:${error.message}`));
page.on('console', (message) => { if (message.type() === 'error') errors.push(`console:${message.text()}`); });
page.on('response', (response) => { if (response.status() >= 400) badResponses.push(`${response.status()}:${response.url()}`); });

await page.goto('http://127.0.0.1:5173/?debug=1&platform=mock');
await page.waitForFunction(() => window.__auditGame?.scene?.getScene?.('OpeningScene')?.phase === 'idle', null, { timeout: 15000 });
const hide = page.getByRole('button', { name: 'Hide', exact: true });
if (await hide.isVisible().catch(() => false)) await hide.click();
await page.mouse.click(1030, 690);
await page.waitForTimeout(100);

await page.evaluate(() => {
  const s = window.__auditGame.scene.getScene('OpeningScene');
  window.__timingEvents = [];
  const mark = (kind, name, extra = {}) => window.__timingEvents.push({ t: performance.now(), kind, name, ...extra });
  const methods = [
    'animateTearDetach',
    'animateChipsPrelude',
    'animateSignalLockConsumptionPrelude',
    'animateStandardReveal',
    'animatePostStandardEconomy',
    'animateDiscoveryBeat',
    'animateRewardStaging',
    'animateHiddenPocket',
    'animateCollectionAcceptance',
    'animateRewardBanking',
    'bankSignalGain',
    'animateOverchargeTransition',
  ];
  for (const name of methods) {
    if (typeof s[name] !== 'function') continue;
    const original = s[name].bind(s);
    s[name] = async (...args) => {
      mark('start', name);
      try {
        return await original(...args);
      } finally {
        mark('end', name);
      }
    };
  }
  if (typeof s.renderResolvedResult === 'function') {
    const original = s.renderResolvedResult.bind(s);
    s.renderResolvedResult = (...args) => {
      mark('instant', 'renderResolvedResult', { ready: s.resultReady });
      return original(...args);
    };
  }
  if (typeof s.renderResultActionPanel === 'function') {
    const original = s.renderResultActionPanel.bind(s);
    s.renderResultActionPanel = (...args) => {
      mark('instant', 'renderResultActionPanel', { ready: s.resultReady });
      return original(...args);
    };
  }
});

const prep = (scenario) => page.evaluate(async (scenarioName) => {
  const { getPlatformRuntime } = await import('/src/app/runtime.ts');
  const { SaveRepository } = await import('/src/game/systems/save.ts');
  const { resetDebugSave, stageDebugReveal } = await import('/src/debug/debugScenarios.ts');
  const s = window.__auditGame.scene.getScene('OpeningScene');
  const repository = new SaveRepository(getPlatformRuntime().storage);
  await resetDebugSave(repository);
  await stageDebugReveal(repository, scenarioName);
  const state = await s.session.load();
  s.saveState = state;
  s.selectedPouchType = state.pendingReveal?.pouchType ?? 'basic';
  s.lastReveal = state.pendingReveal;
  s.resultReady = false;
  s.resultCarouselDrag = null;
  s.ignoreNextResultTap = false;
  s.phase = 'idle';
  s.renderIdle();
  if (s.pouch) s.pouch.tab.setX(s.pouch.tabEndX);
  window.__timingEvents = [];
  return {
    rarity: state.pendingReveal?.standard.rarity,
    isNew: state.pendingReveal?.standard.isNew,
    hidden: Boolean(state.pendingReveal?.hiddenPocket),
    signalConsumed: Boolean(state.pendingReveal?.signal.lockConsumed),
    pouchType: state.pendingReveal?.pouchType,
  };
}, scenario);

const durationsFromEvents = (events) => {
  const starts = new Map();
  const durations = {};
  for (const event of events) {
    if (event.kind === 'start') starts.set(event.name, event.t);
    if (event.kind === 'end' && starts.has(event.name)) {
      const duration = event.t - starts.get(event.name);
      if (!durations[event.name]) durations[event.name] = [];
      durations[event.name].push(Math.round(duration));
      starts.delete(event.name);
    }
  }
  return durations;
};

const scenarios = ['common', 'rare', 'epic', 'legendary', 'duplicate', 'hidden-pocket', 'signal-lock-consumed'];
const runs = [];
for (const scenario of scenarios) {
  const setup = await prep(scenario);
  const revealStart = await page.evaluate(() => performance.now());
  await page.evaluate(() => {
    const s = window.__auditGame.scene.getScene('OpeningScene');
    const pending = s.session.getPendingReveal();
    if (!pending) throw new Error('pending reveal missing');
    s.phase = 'revealing';
    s.lastReveal = pending;
    return s.playReveal(pending, false);
  });
  const revealEnd = await page.evaluate(() => performance.now());
  const revealEvents = await page.evaluate(() => window.__timingEvents);
  const resolved = revealEvents.find((e) => e.name === 'renderResolvedResult');
  const readyEvent = [...revealEvents].reverse().find((e) => e.name === 'renderResultActionPanel' && e.ready === true);
  const resultHoldMs = resolved && readyEvent ? Math.round(readyEvent.t - resolved.t) : null;

  await page.evaluate(() => { window.__timingEvents = []; });
  const collectStart = await page.evaluate(() => performance.now());
  await page.evaluate(() => window.__auditGame.scene.getScene('OpeningScene').continueFromResult());
  await page.waitForFunction(() => window.__auditGame.scene.getScene('OpeningScene').phase === 'idle', null, { timeout: 12000 });
  const collectEnd = await page.evaluate(() => performance.now());
  const collectEvents = await page.evaluate(() => window.__timingEvents);

  runs.push({
    scenario,
    setup,
    revealToReadyMs: Math.round(revealEnd - revealStart),
    resultHoldMs,
    revealDurations: durationsFromEvents(revealEvents),
    collectToIdleMs: Math.round(collectEnd - collectStart),
    collectDurations: durationsFromEvents(collectEvents),
  });
}

const report = {
  sourceProductHead: '203a743464f1bc648b929fb8231948efb6a473a7',
  runs,
  errors,
  badResponses,
};
fs.writeFileSync(`${OUT}/report.json`, JSON.stringify(report, null, 2));
await browser.close();
if (errors.length || badResponses.length) process.exitCode = 1;
