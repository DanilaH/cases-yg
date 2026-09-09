import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const outDir = 'audit-hands-on-visual';
await fs.mkdir(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const pageErrors = [];
const badResponses = [];
page.on('pageerror', (error) => pageErrors.push(String(error)));
page.on('response', (response) => {
  if (response.status() >= 400) badResponses.push(`${response.status()} ${response.url()}`);
});

const waitForResult = async () => {
  await page.waitForFunction(() => {
    const game = window.__auditGame;
    if (!game) return false;
    const scene = game.scene.getScene('OpeningScene');
    return scene?.phase === 'result' && scene?.lastReveal && scene?.root;
  }, null, { timeout: 15000 });
};

await page.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle' });
await page.getByRole('button', { name: 'Force Epic Phone' }).click();
await page.waitForLoadState('domcontentloaded');
await waitForResult();

const baseline = await page.evaluate(() => {
  const scene = window.__auditGame.scene.getScene('OpeningScene');
  window.__auditEnvironmentRef = scene.environmentRoot;
  window.__auditAmbientRefs = [...scene.ambientParticles];
  return {
    phase: scene.phase,
    familyId: scene.lastReveal.standard.familyId,
    isNew: scene.lastReveal.standard.isNew,
    environmentChildren: scene.environmentRoot?.list?.length ?? -1,
    ambientCount: scene.ambientParticles.length,
  };
});
await page.screenshot({ path: `${outDir}/01-stable-result.png` });

const continuity = await page.evaluate(() => {
  const scene = window.__auditGame.scene.getScene('OpeningScene');
  const pending = scene.lastReveal;
  const beforeEnvironment = window.__auditEnvironmentRef;
  const beforeAmbient = window.__auditAmbientRefs;
  scene.renderResolvedResult(pending);
  return {
    sameEnvironment: scene.environmentRoot === beforeEnvironment,
    sameAmbientObjects:
      scene.ambientParticles.length === beforeAmbient.length &&
      scene.ambientParticles.every((item, index) => item === beforeAmbient[index]),
    ambientCount: scene.ambientParticles.length,
  };
});
await page.screenshot({ path: `${outDir}/02-after-result-rerender.png` });

const discoveryStart = await page.evaluate(() => {
  const scene = window.__auditGame.scene.getScene('OpeningScene');
  const pending = scene.lastReveal;
  const target = scene.resultBreathTarget;
  if (!pending || !target) throw new Error('missing stable result discovery target');
  window.__auditDiscoveryPromise = scene.animateDiscoveryBeat(pending, target);
  return { started: true };
});
await page.waitForTimeout(280);
const discoveryMid = await page.evaluate(() => {
  const scene = window.__auditGame.scene.getScene('OpeningScene');
  const target = scene.resultBreathTarget;
  const images = target.list.filter((item) => item.type === 'Image');
  const visibleImages = images.filter((item) => item.alpha > 0.05);
  const source = images.reduce((best, item) => (item.alpha > (best?.alpha ?? -1) ? item : best), null);
  const sourceBounds = source?.getBounds?.();
  const cloneBounds = images.filter((item) => item !== source).map((item) => item.getBounds());
  const union = cloneBounds.reduce((acc, bounds) => ({
    left: Math.min(acc.left, bounds.left),
    right: Math.max(acc.right, bounds.right),
    top: Math.min(acc.top, bounds.top),
    bottom: Math.max(acc.bottom, bounds.bottom),
  }), { left: Infinity, right: -Infinity, top: Infinity, bottom: -Infinity });
  return {
    totalImageCount: images.length,
    visibleImageCount: visibleImages.length,
    sourceBounds: sourceBounds ? {
      left: sourceBounds.left, right: sourceBounds.right, top: sourceBounds.top, bottom: sourceBounds.bottom,
    } : null,
    outlineUnion: Number.isFinite(union.left) ? union : null,
  };
});
await page.screenshot({ path: `${outDir}/03-discovery-silhouette.png` });
await page.evaluate(async () => { await window.__auditDiscoveryPromise; });
const discoveryEnd = await page.evaluate(() => {
  const scene = window.__auditGame.scene.getScene('OpeningScene');
  return {
    imageCountAfter: scene.resultBreathTarget.list.filter((item) => item.type === 'Image').length,
  };
});

const milestoneStart = await page.evaluate(() => {
  const scene = window.__auditGame.scene.getScene('OpeningScene');
  const bounds = scene.getActiveResultCollectibleLogicalBounds();
  scene.showCollectionMilestone({ kind: 'standards-half', current: 4, total: 8 });
  return { bounds };
});
await page.waitForTimeout(360);
const milestoneMid = await page.evaluate(() => {
  const scene = window.__auditGame.scene.getScene('OpeningScene');
  const toast = scene.collectionMilestoneTarget;
  const panelTop = 612 - 112 / 2;
  return {
    active: Boolean(toast?.active),
    x: toast?.x ?? null,
    y: toast?.y ?? null,
    width: Number(toast?.getData('panelWidth') ?? 0),
    panelTop,
    safeLeft: scene.metrics.safeLeft,
    safeRight: scene.metrics.safeRight,
    centerX: scene.metrics.centerX,
  };
});
await page.screenshot({ path: `${outDir}/04-contextual-milestone.png` });
await page.waitForTimeout(1200);
const milestoneHold = await page.evaluate(() => {
  const scene = window.__auditGame.scene.getScene('OpeningScene');
  return { stillActiveAt1560ms: Boolean(scene.collectionMilestoneTarget?.active) };
});

const overlayContinuity = await page.evaluate(() => {
  const scene = window.__auditGame.scene.getScene('OpeningScene');
  const env = scene.environmentRoot;
  const ambientRefs = [...scene.ambientParticles];
  scene.createRevealBackdrop(0.36, 780);
  const sameAmbient = scene.ambientParticles.every((item, index) => item === ambientRefs[index]);
  return {
    sameEnvironment: scene.environmentRoot === env,
    sameAmbient,
    environmentChildrenWithBackdrop: env.list.length,
  };
});
await page.waitForTimeout(180);
await page.screenshot({ path: `${outDir}/05-backdrop-fading-in.png` });
await page.waitForTimeout(1150);
await page.screenshot({ path: `${outDir}/06-backdrop-faded-out.png` });

const idleContinuity = await page.evaluate(() => {
  const scene = window.__auditGame.scene.getScene('OpeningScene');
  const env = scene.environmentRoot;
  const ambientRefs = [...scene.ambientParticles];
  scene.renderIdle(undefined, true);
  return {
    sameEnvironment: scene.environmentRoot === env,
    sameAmbientObjects:
      scene.ambientParticles.length === ambientRefs.length &&
      scene.ambientParticles.every((item, index) => item === ambientRefs[index]),
    phase: scene.phase,
  };
});
await page.screenshot({ path: `${outDir}/07-idle-continuity.png` });

await page.setViewportSize({ width: 900, height: 720 });
await page.waitForTimeout(250);
await page.getByRole('button', { name: 'Force Epic Phone' }).click();
await page.waitForLoadState('domcontentloaded');
await waitForResult();
await page.evaluate(() => {
  const scene = window.__auditGame.scene.getScene('OpeningScene');
  scene.showCollectionMilestone({ kind: 'standards-half', current: 4, total: 8 });
});
await page.waitForTimeout(360);
const narrow = await page.evaluate(() => {
  const scene = window.__auditGame.scene.getScene('OpeningScene');
  const toast = scene.collectionMilestoneTarget;
  const width = Number(toast?.getData('panelWidth') ?? 0);
  const half = width / 2;
  const panelTop = 612 - 112 / 2;
  return {
    toast: { x: toast?.x ?? null, y: toast?.y ?? null, width },
    bounds: scene.getActiveResultCollectibleLogicalBounds(),
    withinHorizontalSafe: Boolean(toast) && toast.x - half >= scene.metrics.safeLeft && toast.x + half <= scene.metrics.safeRight,
    aboveResultPanel: Boolean(toast) && toast.y + 30 + 20 <= panelTop + 0.01,
  };
});
await page.screenshot({ path: `${outDir}/08-narrow-milestone.png` });

const report = {
  baseline,
  continuity,
  discoveryStart,
  discoveryMid,
  discoveryEnd,
  milestoneStart,
  milestoneMid,
  milestoneHold,
  overlayContinuity,
  idleContinuity,
  narrow,
  pageErrors,
  badResponses,
};
await fs.writeFile(`${outDir}/report.json`, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));

if (!baseline.isNew || baseline.familyId !== 'flip-phone') throw new Error('debug Epic Phone was not a new Flip Phone');
if (!continuity.sameEnvironment || !continuity.sameAmbientObjects) throw new Error('environment rebuilt across stable result rerender');
if (discoveryMid.totalImageCount !== 9 || discoveryMid.visibleImageCount < 8) throw new Error('silhouette outline did not create 8 image-backed contour copies');
if (discoveryEnd.imageCountAfter !== 1) throw new Error('silhouette contour copies did not clean up');
if (!milestoneMid.active || !milestoneHold.stillActiveAt1560ms) throw new Error('milestone toast dwell is still too short');
if (!overlayContinuity.sameEnvironment || !overlayContinuity.sameAmbient) throw new Error('reveal backdrop disturbed persistent environment');
if (!idleContinuity.sameEnvironment || !idleContinuity.sameAmbientObjects) throw new Error('environment rebuilt on result to idle transition');
if (!narrow.withinHorizontalSafe || !narrow.aboveResultPanel) throw new Error('narrow milestone placement violated bounds');
if (pageErrors.length || badResponses.length) throw new Error(`runtime errors: ${pageErrors.length}, bad responses: ${badResponses.length}`);

await browser.close();
