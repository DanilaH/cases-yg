import { chromium } from 'playwright';
import fs from 'node:fs';

const OUT = 'audit-secret-presence';
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
await page.waitForTimeout(120);

const prepareHidden = () => page.evaluate(async () => {
  const { getPlatformRuntime } = await import('/src/app/runtime.ts');
  const { SaveRepository } = await import('/src/game/systems/save.ts');
  const { resetDebugSave, stageDebugReveal } = await import('/src/debug/debugScenarios.ts');
  const scene = window.__auditGame.scene.getScene('OpeningScene');
  const repository = new SaveRepository(getPlatformRuntime().storage);
  await resetDebugSave(repository);
  await stageDebugReveal(repository, 'hidden-pocket');
  const state = await scene.session.load();
  scene.saveState = state;
  scene.selectedPouchType = state.pendingReveal?.pouchType ?? 'basic';
  scene.lastReveal = state.pendingReveal;
  scene.resultReady = false;
  scene.resultCarouselDrag = null;
  scene.ignoreNextResultTap = false;
  scene.phase = 'idle';
  scene.renderIdle();
  if (scene.pouch) scene.pouch.tab.setX(scene.pouch.tabEndX);
});

const runHidden = async (index) => {
  await prepareHidden();
  await page.evaluate(() => {
    const scene = window.__auditGame.scene.getScene('OpeningScene');
    const pending = scene.session.getPendingReveal();
    if (!pending?.hiddenPocket) throw new Error('hidden pending reveal missing');
    scene.phase = 'revealing';
    scene.lastReveal = pending;
    return scene.playReveal(pending, false);
  });
  await page.waitForFunction(() => {
    const scene = window.__auditGame.scene.getScene('OpeningScene');
    return scene.phase === 'result' && scene.resultReady === true && scene.resultCarouselIndex === 1;
  }, null, { timeout: 12000 });
  await page.waitForTimeout(260);

  const secret = await page.evaluate(() => {
    const scene = window.__auditGame.scene.getScene('OpeningScene');
    const tiny = scene.secretPremiumTargets
      .filter((target) => target?.active && Number(target.displayWidth ?? 999) < 10)
      .map((target) => ({
        x: Math.round(Number(target.x) * 10) / 10,
        y: Math.round(Number(target.y) * 10) / 10,
        w: Math.round(Number(target.displayWidth) * 10) / 10,
      }));
    const audio = window.__auditAudio;
    return {
      index: scene.resultCarouselIndex,
      tiny,
      signature: tiny.map(({ x, y, w }) => `${x}:${y}:${w}`).join('|'),
      desired: audio?.desiredResultAmbience ?? null,
      active: audio?.activeResultAmbience ?? null,
      sources: audio?.persistentRaritySources?.length ?? null,
    };
  });
  if (secret.tiny.length !== 10) throw new Error(`expected 10 persistent Secret sparkles, got ${secret.tiny.length}`);
  if (secret.desired !== 'secret') throw new Error(`Secret page desired ambience mismatch: ${secret.desired}`);
  await page.screenshot({ path: `${OUT}/secret-${index}.png` });

  await page.evaluate(() => {
    const scene = window.__auditGame.scene.getScene('OpeningScene');
    scene.resultCarouselIndex = 0;
    scene.positionResultCarousel(0, true);
    scene.syncCarouselRewardBreathing();
  });
  await page.waitForTimeout(320);
  const standard = await page.evaluate(() => {
    const scene = window.__auditGame.scene.getScene('OpeningScene');
    const audio = window.__auditAudio;
    return {
      index: scene.resultCarouselIndex,
      desired: audio?.desiredResultAmbience ?? null,
      active: audio?.activeResultAmbience ?? null,
      sources: audio?.persistentRaritySources?.length ?? null,
    };
  });
  if (standard.index !== 0) throw new Error('standard carousel page did not activate');
  if (standard.desired === 'secret') throw new Error('Secret ambience remained desired on standard carousel page');

  await page.evaluate(() => {
    const scene = window.__auditGame.scene.getScene('OpeningScene');
    scene.resultCarouselIndex = 1;
    scene.positionResultCarousel(0, true);
    scene.syncCarouselRewardBreathing();
  });
  await page.waitForTimeout(320);
  const restored = await page.evaluate(() => {
    const scene = window.__auditGame.scene.getScene('OpeningScene');
    const audio = window.__auditAudio;
    return {
      index: scene.resultCarouselIndex,
      desired: audio?.desiredResultAmbience ?? null,
      active: audio?.activeResultAmbience ?? null,
      sources: audio?.persistentRaritySources?.length ?? null,
    };
  });
  if (restored.index !== 1 || restored.desired !== 'secret') throw new Error('Secret ambience did not restore after carousel return');

  await page.evaluate(() => window.__auditGame.scene.getScene('OpeningScene').continueFromResult());
  await page.waitForFunction(() => window.__auditGame.scene.getScene('OpeningScene').phase === 'idle', null, { timeout: 12000 });
  await page.waitForTimeout(180);
  const idle = await page.evaluate(() => {
    const scene = window.__auditGame.scene.getScene('OpeningScene');
    const audio = window.__auditAudio;
    return {
      secretTargets: scene.secretPremiumTargets.length,
      standardTargets: scene.standardPresenceTargets.length,
      desired: audio?.desiredResultAmbience ?? null,
      active: audio?.activeResultAmbience ?? null,
      sources: audio?.persistentRaritySources?.length ?? null,
    };
  });
  if (idle.secretTargets !== 0 || idle.standardTargets !== 0 || idle.desired !== null || idle.sources !== 0) {
    throw new Error(`idle teardown mismatch: ${JSON.stringify(idle)}`);
  }
  return { secret, standard, restored, idle };
};

const runs = [];
for (let index = 1; index <= 3; index += 1) runs.push(await runHidden(index));
const signatures = runs.map((run) => run.secret.signature);
if (new Set(signatures).size !== signatures.length) throw new Error(`Secret sparkle composition repeated: ${JSON.stringify(signatures)}`);

const report = { runs, distinctSignatures: new Set(signatures).size, errors, badResponses };
fs.writeFileSync(`${OUT}/report.json`, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
await browser.close();
if (errors.length || badResponses.length) process.exitCode = 1;
