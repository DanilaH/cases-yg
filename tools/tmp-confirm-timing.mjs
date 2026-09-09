import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });

await page.goto('http://127.0.0.1:5173/?debug=1&platform=mock');
await page.waitForFunction(() => window.__auditGame?.scene?.getScene?.('OpeningScene')?.phase === 'idle', null, { timeout: 15000 });
const hide = page.getByRole('button', { name: 'Hide', exact: true });
if (await hide.isVisible().catch(() => false)) await hide.click();

const prep = (scenario) => page.evaluate(async (name) => {
  const { getPlatformRuntime } = await import('/src/app/runtime.ts');
  const { SaveRepository } = await import('/src/game/systems/save.ts');
  const { resetDebugSave, stageDebugReveal } = await import('/src/debug/debugScenarios.ts');
  const scene = window.__auditGame.scene.getScene('OpeningScene');
  const repository = new SaveRepository(getPlatformRuntime().storage);
  await resetDebugSave(repository);
  await stageDebugReveal(repository, name);
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
}, scenario);

const run = async (scenario) => {
  await prep(scenario);
  const start = await page.evaluate(() => performance.now());
  await page.evaluate(() => {
    const scene = window.__auditGame.scene.getScene('OpeningScene');
    const pending = scene.session.getPendingReveal();
    if (!pending) throw new Error('pending reveal missing');
    scene.phase = 'revealing';
    scene.lastReveal = pending;
    return scene.playReveal(pending, false);
  });
  const end = await page.evaluate(() => performance.now());
  const ready = await page.evaluate(() => window.__auditGame.scene.getScene('OpeningScene').resultReady);
  await page.evaluate(() => window.__auditGame.scene.getScene('OpeningScene').continueFromResult());
  await page.waitForFunction(() => window.__auditGame.scene.getScene('OpeningScene').phase === 'idle', null, { timeout: 12000 });
  return { scenario, revealToReadyMs: Math.round(end - start), ready };
};

const runs = [];
for (const scenario of ['common', 'rare', 'common', 'epic', 'common']) runs.push(await run(scenario));
console.log(JSON.stringify({ runs, errors }, null, 2));
await browser.close();
if (errors.length) process.exitCode = 1;
