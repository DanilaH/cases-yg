import { chromium } from 'playwright';
import fs from 'node:fs';

const OUT = 'audit-independent-feel-r2';
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
}, scenario);

const startReveal = () => page.evaluate(() => {
  const s = window.__auditGame.scene.getScene('OpeningScene');
  const pending = s.session.getPendingReveal();
  if (!pending) throw new Error('pending reveal missing');
  s.phase = 'revealing';
  s.lastReveal = pending;
  window.__auditRevealWork = s.playReveal(pending, false);
});

const snapshot = () => page.evaluate(() => {
  const s = window.__auditGame.scene.getScene('OpeningScene');
  const a = window.__auditAudio;
  return {
    phase: s.phase,
    ready: s.resultReady,
    standardPresenceTargets: s.standardPresenceTargets?.length ?? 0,
    secretPremiumTargets: s.secretPremiumTargets?.length ?? 0,
    ambientTargets: s.ambientParticles?.length ?? 0,
    carouselIndex: s.resultCarouselIndex,
    resultAmbience: a.activeResultAmbience ?? null,
    desiredResultAmbience: a.desiredResultAmbience ?? null,
    persistentRaritySources: a.persistentRaritySources?.length ?? 0,
    dragTextureActive: Boolean(a.dragTextureSource),
    pending: Boolean(s.session.getPendingReveal()),
  };
});

const waitReady = () => page.waitForFunction(() => {
  const s = window.__auditGame.scene.getScene('OpeningScene');
  return s.phase === 'result' && s.resultReady === true;
}, null, { timeout: 12000 });

const fastForwardUntilReady = async () => {
  const deadline = Date.now() + 10000;
  while (Date.now() < deadline) {
    const state = await snapshot();
    if (state.phase === 'result' && state.ready) return;
    await page.evaluate(() => window.__auditGame.scene.getScene('OpeningScene').requestPresentationFastForward());
    await page.waitForTimeout(45);
  }
  await waitReady();
};

// Existing result-hold skip semantics: one click should only make the result ready, never collect it.
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
if (afterSkip.phase !== 'result' || !afterSkip.ready) throw new Error(`skip left result: ${JSON.stringify(afterSkip)}`);
if (skipMs > 450) throw new Error(`pre-ready skip too slow: ${skipMs}ms`);
await page.waitForTimeout(120);
const stillResult = await snapshot();
if (stillResult.phase !== 'result') throw new Error(`same skip gesture collected: ${JSON.stringify(stillResult)}`);
await page.mouse.click(640, 620);
await page.waitForFunction(() => window.__auditGame.scene.getScene('OpeningScene').phase === 'idle', null, { timeout: 10000 });
const afterCollect = await snapshot();

// Hidden carousel owns its result ambience page-by-page.
await prep('hidden-pocket');
await startReveal();
await fastForwardUntilReady();
const hiddenSecret = await snapshot();
const hiddenStandard = await page.evaluate(() => {
  const s = window.__auditGame.scene.getScene('OpeningScene');
  s.resultCarouselIndex = 0;
  s.positionResultCarousel(0, false);
  return { ambience: window.__auditAudio.activeResultAmbience ?? null, sources: window.__auditAudio.persistentRaritySources?.length ?? 0 };
});
await page.waitForTimeout(80);
const hiddenSecretAgain = await page.evaluate(() => {
  const s = window.__auditGame.scene.getScene('OpeningScene');
  s.resultCarouselIndex = 1;
  s.positionResultCarousel(0, false);
  return { ambience: window.__auditAudio.activeResultAmbience ?? null, sources: window.__auditAudio.persistentRaritySources?.length ?? 0 };
});
if (hiddenSecret.resultAmbience !== 'secret' || hiddenSecretAgain.ambience !== 'secret') throw new Error('secret ambience did not restore');
if (hiddenStandard.ambience === 'secret') throw new Error('secret ambience leaked onto standard carousel page');

// Repeated fast-forward and collect cycles must not leave rarity/audio motion behind.
const stress = [];
for (let index = 0; index < 12; index += 1) {
  const scenario = ['common', 'rare', 'epic', 'legendary', 'duplicate', 'hidden-pocket'][index % 6];
  await prep(scenario);
  await startReveal();
  await fastForwardUntilReady();
  const result = await snapshot();
  await page.evaluate(() => window.__auditGame.scene.getScene('OpeningScene').continueFromResult());
  const deadline = Date.now() + 10000;
  while (Date.now() < deadline) {
    const state = await snapshot();
    if (state.phase === 'idle') break;
    await page.evaluate(() => window.__auditGame.scene.getScene('OpeningScene').requestPresentationFastForward());
    await page.waitForTimeout(45);
  }
  await page.waitForFunction(() => window.__auditGame.scene.getScene('OpeningScene').phase === 'idle', null, { timeout: 10000 });
  const idle = await snapshot();
  if (idle.persistentRaritySources !== 0 || idle.standardPresenceTargets !== 0 || idle.secretPremiumTargets !== 0 || idle.dragTextureActive) {
    throw new Error(`presence leak at loop ${index}: ${JSON.stringify(idle)}`);
  }
  stress.push({ index, scenario, result, idle });
}

// Idle room should have all new motes/glows and visible asynchronous movement.
await page.evaluate(async () => {
  const { getPlatformRuntime } = await import('/src/app/runtime.ts');
  const { SaveRepository } = await import('/src/game/systems/save.ts');
  const { resetDebugSave } = await import('/src/debug/debugScenarios.ts');
  const s = window.__auditGame.scene.getScene('OpeningScene');
  const repository = new SaveRepository(getPlatformRuntime().storage);
  await resetDebugSave(repository);
  const state = await s.session.load();
  s.saveState = state; s.selectedPouchType = 'basic'; s.lastReveal = null; s.resultReady = false; s.phase = 'idle'; s.renderIdle();
});
const idle0State = await snapshot();
await page.screenshot({ path: `${OUT}/idle-0000.png` });
await page.waitForTimeout(6000);
const idle6State = await snapshot();
await page.screenshot({ path: `${OUT}/idle-6000.png` });
if (idle0State.ambientTargets < 27 || idle6State.ambientTargets < 27) throw new Error(`ambient target mismatch: ${JSON.stringify({ idle0State, idle6State })}`);

// Resize while a premium reveal is live, then fast-forward to a coherent compact result.
await prep('legendary');
await startReveal();
await page.waitForTimeout(190);
await page.setViewportSize({ width: 900, height: 720 });
await page.waitForTimeout(80);
await fastForwardUntilReady();
const compact = await snapshot();
await page.screenshot({ path: `${OUT}/compact-legendary-result.png` });
if (compact.phase !== 'result' || !compact.ready) throw new Error(`compact reveal incoherent: ${JSON.stringify(compact)}`);

// Collection is part of the feel audit even though this patch does not touch it.
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
await page.evaluate(() => { const c = window.__auditGame.scene.getScene('CollectionScene'); c.view = 'library'; c.page = 0; c.render(); });
await page.waitForTimeout(120);
await page.screenshot({ path: `${OUT}/collection-library.png` });

const report = {
  sourceProductHead: '203a743464f1bc648b929fb8231948efb6a473a7',
  skip: { beforeSkip, afterSkip, stillResult, afterCollect, skipMs },
  hiddenAudio: { hiddenSecret, hiddenStandard, hiddenSecretAgain },
  stress,
  idle0State,
  idle6State,
  compact,
  errors,
  badResponses,
};
fs.writeFileSync(`${OUT}/report.json`, JSON.stringify(report, null, 2));
await browser.close();
if (errors.length || badResponses.length) process.exitCode = 1;
