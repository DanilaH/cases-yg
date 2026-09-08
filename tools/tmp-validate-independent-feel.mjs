import { chromium } from 'playwright';
import fs from 'node:fs';

const OUT = 'audit-independent-feel';
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
const badResponses = [];
page.on('pageerror', (error) => errors.push(`pageerror:${error.message}`));
page.on('console', (message) => {
  if (message.type() === 'error') errors.push(`console:${message.text()}`);
});
page.on('response', (response) => {
  if (response.status() >= 400) badResponses.push(`${response.status()}:${response.url()}`);
});

await page.goto('http://127.0.0.1:5173/?debug=1&platform=mock');
await page.waitForFunction(
  () => window.__auditGame?.scene?.getScene?.('OpeningScene')?.phase === 'idle',
  null,
  { timeout: 15000 },
);
const hide = page.getByRole('button', { name: 'Hide', exact: true });
if (await hide.isVisible().catch(() => false)) await hide.click();
// User gesture for WebAudio unlock, away from the pouch interaction rail.
await page.mouse.click(1030, 690);
await page.waitForTimeout(120);

const prep = async (scenario) => page.evaluate(async (scenarioName) => {
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
  return {
    transactionId: state.pendingReveal?.transactionId ?? null,
    rarity: state.pendingReveal?.standard.rarity ?? null,
    hidden: Boolean(state.pendingReveal?.hiddenPocket),
  };
}, scenario);

const resetIdle = async () => page.evaluate(async () => {
  const { getPlatformRuntime } = await import('/src/app/runtime.ts');
  const { SaveRepository } = await import('/src/game/systems/save.ts');
  const { resetDebugSave } = await import('/src/debug/debugScenarios.ts');
  const s = window.__auditGame.scene.getScene('OpeningScene');
  const repository = new SaveRepository(getPlatformRuntime().storage);
  await resetDebugSave(repository);
  const state = await s.session.load();
  s.saveState = state;
  s.selectedPouchType = 'basic';
  s.lastReveal = null;
  s.resultReady = false;
  s.resultCarouselDrag = null;
  s.ignoreNextResultTap = false;
  s.phase = 'idle';
  s.renderIdle();
});

const startReveal = async () => page.evaluate(() => {
  const s = window.__auditGame.scene.getScene('OpeningScene');
  const pending = s.session.getPendingReveal();
  if (!pending) throw new Error('pending reveal missing');
  s.phase = 'revealing';
  s.lastReveal = pending;
  window.__auditRevealWork = s.playReveal(pending, false);
});

const waitReady = async () => {
  await page.waitForFunction(() => {
    const s = window.__auditGame.scene.getScene('OpeningScene');
    return s.phase === 'result' && s.resultReady === true;
  }, null, { timeout: 12000 });
};

const snapshot = async () => page.evaluate(() => {
  const s = window.__auditGame.scene.getScene('OpeningScene');
  const a = window.__auditAudio;
  return {
    phase: s.phase,
    ready: s.resultReady,
    standardPresenceTargets: s.standardPresenceTargets?.length ?? null,
    secretPremiumTargets: s.secretPremiumTargets?.length ?? null,
    ambientTargets: s.ambientParticles?.length ?? null,
    carouselIndex: s.resultCarouselIndex,
    resultAmbience: a.activeResultAmbience ?? null,
    desiredResultAmbience: a.desiredResultAmbience ?? null,
    persistentRaritySources: a.persistentRaritySources?.length ?? null,
    dragTextureActive: Boolean(a.dragTextureSource),
    pending: Boolean(s.session.getPendingReveal()),
  };
});

const resultRuns = [];
for (const scenario of ['common', 'rare', 'epic', 'legendary', 'duplicate', 'hidden-pocket', 'signal-lock-consumed']) {
  await prep(scenario);
  await startReveal();
  if (scenario === 'epic' || scenario === 'legendary' || scenario === 'hidden-pocket') {
    await page.waitForTimeout(scenario === 'epic' ? 250 : 330);
    await page.screenshot({ path: `${OUT}/${scenario}-mid.png` });
  }
  await waitReady();
  await page.screenshot({ path: `${OUT}/${scenario}-result.png` });
  resultRuns.push({ scenario, state: await snapshot() });
}

// Repeated Legendary mid-reveal captures should no longer share a stamped spoke pattern.
for (let index = 0; index < 3; index += 1) {
  await prep('legendary');
  await startReveal();
  await page.waitForTimeout(330);
  await page.screenshot({ path: `${OUT}/legendary-random-${index + 1}.png` });
  // Finish aggressively without letting one run leak into the next.
  const deadline = Date.now() + 10000;
  while (Date.now() < deadline) {
    const state = await snapshot();
    if (state.phase === 'result' && state.ready) break;
    await page.evaluate(() => window.__auditGame.scene.getScene('OpeningScene').requestPresentationFastForward());
    await page.waitForTimeout(55);
  }
  await waitReady();
}

// Verify the pre-ready result hint's existing skip path actually works and one gesture cannot collect.
await prep('common');
await startReveal();
await page.waitForFunction(() => {
  const s = window.__auditGame.scene.getScene('OpeningScene');
  return s.phase === 'result' && s.resultReady === false;
}, null, { timeout: 10000 });
const beforeSkip = await snapshot();
const skipStarted = Date.now();
await page.mouse.click(640, 620);
await waitReady();
const skipMs = Date.now() - skipStarted;
const afterSkip = await snapshot();
if (afterSkip.phase !== 'result' || !afterSkip.ready || !afterSkip.pending) {
  throw new Error(`pre-ready skip incorrectly collected/left result: ${JSON.stringify(afterSkip)}`);
}
if (skipMs > 450) throw new Error(`pre-ready skip too slow: ${skipMs}ms`);
await page.mouse.click(640, 620);
await page.waitForFunction(
  () => window.__auditGame.scene.getScene('OpeningScene').phase === 'idle',
  null,
  { timeout: 10000 },
);
const afterCollect = await snapshot();
if (afterCollect.pending) throw new Error('collect did not clear pending reveal');

// Hidden Pocket audio/presence ownership must follow the selected carousel page without stacking.
await prep('hidden-pocket');
await startReveal();
await waitReady();
const hiddenSecret = await snapshot();
const hiddenStandard = await page.evaluate(() => {
  const s = window.__auditGame.scene.getScene('OpeningScene');
  s.resultCarouselIndex = 0;
  s.positionResultCarousel(0, false);
  return {
    index: s.resultCarouselIndex,
    ambience: window.__auditAudio.activeResultAmbience ?? null,
    sources: window.__auditAudio.persistentRaritySources?.length ?? null,
  };
});
const hiddenSecretAgain = await page.evaluate(() => {
  const s = window.__auditGame.scene.getScene('OpeningScene');
  s.resultCarouselIndex = 1;
  s.positionResultCarousel(0, false);
  return {
    index: s.resultCarouselIndex,
    ambience: window.__auditAudio.activeResultAmbience ?? null,
    sources: window.__auditAudio.persistentRaritySources?.length ?? null,
  };
});
if (hiddenSecret.resultAmbience !== 'secret' || hiddenSecretAgain.ambience !== 'secret') {
  throw new Error(`secret ambience did not restore: ${JSON.stringify({ hiddenSecret, hiddenSecretAgain })}`);
}
if (hiddenStandard.ambience === 'secret') {
  throw new Error(`secret ambience leaked onto standard page: ${JSON.stringify(hiddenStandard)}`);
}

// Repeated fast-forward/collect stress: no stuck phases or result-audio/presence leakage.
const stressSamples = [];
for (let index = 0; index < 12; index += 1) {
  const scenario = ['common', 'rare', 'epic', 'legendary', 'duplicate', 'hidden-pocket'][index % 6];
  await prep(scenario);
  await startReveal();
  const revealDeadline = Date.now() + 10000;
  while (Date.now() < revealDeadline) {
    const state = await snapshot();
    if (state.phase === 'result' && state.ready) break;
    await page.evaluate(() => window.__auditGame.scene.getScene('OpeningScene').requestPresentationFastForward());
    await page.waitForTimeout(45);
  }
  await waitReady();
  const atResult = await snapshot();
  await page.evaluate(() => window.__auditGame.scene.getScene('OpeningScene').continueFromResult());
  const bankDeadline = Date.now() + 10000;
  while (Date.now() < bankDeadline) {
    const state = await snapshot();
    if (state.phase === 'idle') break;
    await page.evaluate(() => window.__auditGame.scene.getScene('OpeningScene').requestPresentationFastForward());
    await page.waitForTimeout(45);
  }
  await page.waitForFunction(() => window.__auditGame.scene.getScene('OpeningScene').phase === 'idle', null, { timeout: 10000 });
  const atIdle = await snapshot();
  if ((atIdle.persistentRaritySources ?? 0) !== 0 || (atIdle.standardPresenceTargets ?? 0) !== 0 || (atIdle.secretPremiumTargets ?? 0) !== 0) {
    throw new Error(`result presence leaked after loop ${index}: ${JSON.stringify(atIdle)}`);
  }
  stressSamples.push({ index, scenario, atResult, atIdle });
}

// Idle room motion before/after six seconds for independent visual comparison.
await resetIdle();
await page.screenshot({ path: `${OUT}/idle-0000.png` });
await page.waitForTimeout(6000);
await page.screenshot({ path: `${OUT}/idle-6000.png` });
const idleState = await snapshot();
if ((idleState.ambientTargets ?? 0) < 24) throw new Error(`ambient target count too low: ${JSON.stringify(idleState)}`);

// Active reveal + compact resize should resolve to a coherent result state.
await prep('legendary');
await startReveal();
await page.waitForTimeout(190);
await page.setViewportSize({ width: 900, height: 720 });
await page.waitForTimeout(80);
await page.evaluate(() => window.__auditGame.scene.getScene('OpeningScene').requestPresentationFastForward());
const resizeDeadline = Date.now() + 10000;
while (Date.now() < resizeDeadline) {
  const state = await snapshot();
  if (state.phase === 'result' && state.ready) break;
  await page.evaluate(() => window.__auditGame.scene.getScene('OpeningScene').requestPresentationFastForward());
  await page.waitForTimeout(55);
}
await waitReady();
const compact = await snapshot();
await page.screenshot({ path: `${OUT}/compact-legendary-result.png` });

// Collection is intentionally audited too: capture both modes after a full seed.
await page.setViewportSize({ width: 1280, height: 720 });
await page.evaluate(async () => {
  const { getPlatformRuntime } = await import('/src/app/runtime.ts');
  const { SaveRepository } = await import('/src/game/systems/save.ts');
  const { seedDebugCollection } = await import('/src/debug/debugScenarios.ts');
  const repository = new SaveRepository(getPlatformRuntime().storage);
  await seedDebugCollection(repository, 'all');
  window.__auditGame.scene.getScene('OpeningScene').scene.start('CollectionScene');
});
await page.waitForFunction(() => Boolean(window.__auditGame.scene.getScene('CollectionScene').root), null, { timeout: 10000 });
await page.screenshot({ path: `${OUT}/collection-shelf.png` });
await page.evaluate(() => {
  const c = window.__auditGame.scene.getScene('CollectionScene');
  c.view = 'library';
  c.page = 0;
  c.render();
});
await page.waitForTimeout(150);
await page.screenshot({ path: `${OUT}/collection-library.png` });

const report = {
  sourceHead: '203a743464f1bc648b929fb8231948efb6a473a7',
  resultRuns,
  skip: { beforeSkip, afterSkip, afterCollect, skipMs },
  hiddenAudio: { hiddenSecret, hiddenStandard, hiddenSecretAgain },
  stressSamples,
  idleState,
  compact,
  errors,
  badResponses,
};
fs.writeFileSync(`${OUT}/report.json`, JSON.stringify(report, null, 2));

await browser.close();
if (errors.length > 0 || badResponses.length > 0) {
  console.error(JSON.stringify({ errors, badResponses }, null, 2));
  process.exitCode = 1;
}
