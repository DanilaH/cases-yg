import { chromium } from 'playwright';
import { writeFile } from 'node:fs/promises';

const baseUrl = 'http://127.0.0.1:4173/?debug=1';
const reportPath = 'hands-on-audio-audit.json';
const failures = [];
const pageErrors = [];
const badResponses = [];

const assert = (condition, message, details = undefined) => {
  if (!condition) failures.push({ message, details });
};

const browser = await chromium.launch({
  headless: true,
  args: ['--autoplay-policy=no-user-gesture-required'],
});
const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
const page = await context.newPage();

page.on('pageerror', (error) => pageErrors.push(String(error)));
page.on('response', (response) => {
  if (response.status() >= 400 && response.url().startsWith('http://127.0.0.1:4173')) {
    badResponses.push({ status: response.status(), url: response.url() });
  }
});

await page.addInitScript(() => {
  const audit = {
    nextId: 1,
    oscillators: [],
    buffers: [],
  };
  window.__audioAudit = audit;

  const patchAudioParam = (param, record) => {
    const originalSet = param.setValueAtTime.bind(param);
    const originalExp = param.exponentialRampToValueAtTime.bind(param);
    const originalLinear = param.linearRampToValueAtTime.bind(param);
    param.setValueAtTime = (value, time) => {
      record.sets.push({ value, time, wall: performance.now() });
      return originalSet(value, time);
    };
    param.exponentialRampToValueAtTime = (value, time) => {
      record.expRamps.push({ value, time, wall: performance.now() });
      return originalExp(value, time);
    };
    param.linearRampToValueAtTime = (value, time) => {
      record.linearRamps.push({ value, time, wall: performance.now() });
      return originalLinear(value, time);
    };
  };

  const originalCreateOscillator = AudioContext.prototype.createOscillator;
  AudioContext.prototype.createOscillator = function createOscillatorPatched(...args) {
    const node = originalCreateOscillator.apply(this, args);
    const record = {
      id: audit.nextId++,
      kind: 'oscillator',
      createdWall: performance.now(),
      started: false,
      startWall: null,
      stopCalled: false,
      stopWall: null,
      sets: [],
      expRamps: [],
      linearRamps: [],
    };
    audit.oscillators.push(record);
    patchAudioParam(node.frequency, record);
    const originalStart = node.start.bind(node);
    const originalStop = node.stop.bind(node);
    node.start = (...startArgs) => {
      record.started = true;
      record.startWall = performance.now();
      return originalStart(...startArgs);
    };
    node.stop = (...stopArgs) => {
      record.stopCalled = true;
      record.stopWall = performance.now();
      return originalStop(...stopArgs);
    };
    return node;
  };

  const originalCreateBufferSource = AudioContext.prototype.createBufferSource;
  AudioContext.prototype.createBufferSource = function createBufferSourcePatched(...args) {
    const node = originalCreateBufferSource.apply(this, args);
    const rateRecord = { sets: [], expRamps: [], linearRamps: [] };
    const record = {
      id: audit.nextId++,
      kind: 'buffer',
      createdWall: performance.now(),
      started: false,
      startWall: null,
      stopCalled: false,
      stopWall: null,
      loopAtStart: false,
      playbackRate: rateRecord,
    };
    audit.buffers.push(record);
    patchAudioParam(node.playbackRate, rateRecord);
    const originalStart = node.start.bind(node);
    const originalStop = node.stop.bind(node);
    node.start = (...startArgs) => {
      record.started = true;
      record.startWall = performance.now();
      record.loopAtStart = node.loop;
      return originalStart(...startArgs);
    };
    node.stop = (...stopArgs) => {
      record.stopCalled = true;
      record.stopWall = performance.now();
      return originalStop(...stopArgs);
    };
    return node;
  };
});

const persistentSnapshot = async () => page.evaluate(() => {
  const audit = window.__audioAudit;
  const aliveOscillators = audit.oscillators.filter((entry) => entry.started && !entry.stopCalled).length;
  const aliveLoopBuffers = audit.buffers.filter(
    (entry) => entry.started && entry.loopAtStart && !entry.stopCalled,
  ).length;
  return {
    aliveOscillators,
    aliveLoopBuffers,
    total: aliveOscillators + aliveLoopBuffers,
    oscillatorCount: audit.oscillators.length,
    bufferCount: audit.buffers.length,
  };
});

const oscillatorCount = async () => page.evaluate(() => window.__audioAudit.oscillators.length);

const recentCarouselSwitchCount = async (startIndex) => page.evaluate((index) => {
  const rows = window.__audioAudit.oscillators.slice(index).filter((entry) => entry.stopCalled);
  const low = rows.filter((entry) => {
    const value = entry.sets[0]?.value ?? 0;
    return value >= 690 && value <= 750;
  }).length;
  const high = rows.filter((entry) => {
    const value = entry.sets[0]?.value ?? 0;
    return value >= 1030 && value <= 1130;
  }).length;
  return Math.min(low, high);
}, startIndex);

const chipClacksSince = async (startIndex) => page.evaluate((index) => {
  const expectedRatio = 860 / 1180;
  return window.__audioAudit.oscillators
    .slice(index)
    .map((entry) => ({
      start: entry.sets[0]?.value ?? 0,
      end: entry.expRamps[0]?.value ?? 0,
      wall: entry.startWall ?? entry.createdWall,
    }))
    .filter((entry) => {
      if (entry.start < 1000 || entry.start > 1450 || entry.end <= 0) return false;
      return Math.abs(entry.end / entry.start - expectedRatio) <= 0.018;
    })
    .sort((a, b) => a.wall - b.wall);
}, startIndex);

const hideDebugPanel = async () => page.evaluate(() => {
  const panel = document.querySelector('.mpt-debug-panel');
  if (panel instanceof HTMLElement) panel.style.display = 'none';
});

await page.goto(baseUrl, { waitUntil: 'networkidle' });
const reloadPromise = page.waitForEvent('load', { timeout: 10000 });
await page.getByRole('button', { name: 'Force Hidden Pocket', exact: true }).click();
await reloadPromise;
await page.waitForSelector('canvas');
await page.waitForTimeout(3200);
await hideDebugPanel();

const canvas = page.locator('canvas');
const box = await canvas.boundingBox();
if (!box) throw new Error('Canvas bounding box unavailable');
const centerX = box.x + box.width / 2;
const carouselY = box.y + (326 / 720) * box.height;
const resultY = box.y + (612 / 720) * box.height;

const drag = async (deltaX) => {
  await page.mouse.move(centerX, carouselY);
  await page.mouse.down();
  await page.mouse.move(centerX + deltaX, carouselY, { steps: 7 });
  await page.mouse.up();
  await page.waitForTimeout(620);
};

const standardInitial = await persistentSnapshot();

const subthresholdMark = await oscillatorCount();
await drag(-30);
const subthresholdClicks = await recentCarouselSwitchCount(subthresholdMark);
assert(subthresholdClicks === 0, 'Sub-threshold carousel drag emitted a switch cue', { subthresholdClicks });

const realSwitchMark = await oscillatorCount();
await drag(-112);
const firstSwitchClicks = await recentCarouselSwitchCount(realSwitchMark);
const secretFirst = await persistentSnapshot();
assert(firstSwitchClicks === 1, 'Real carousel page change did not emit exactly one switch cue', { firstSwitchClicks });
assert(secretFirst.total > standardInitial.total, 'Secret page did not take persistent ambience ownership', {
  standardInitial,
  secretFirst,
});

const returnMark = await oscillatorCount();
await drag(112);
const returnClicks = await recentCarouselSwitchCount(returnMark);
const standardAfterReturn = await persistentSnapshot();
assert(returnClicks === 1, 'Return page change did not emit exactly one switch cue', { returnClicks });
assert(standardAfterReturn.total < secretFirst.total, 'Secret persistent sources were not retired on return', {
  secretFirst,
  standardAfterReturn,
});

const secondSecretMark = await oscillatorCount();
await drag(-112);
const secondSecretClicks = await recentCarouselSwitchCount(secondSecretMark);
const secretSecond = await persistentSnapshot();
assert(secondSecretClicks === 1, 'Second Secret page change did not emit exactly one switch cue', { secondSecretClicks });
assert(Math.abs(secretSecond.total - secretFirst.total) <= 1, 'Persistent rarity sources stacked across carousel cycles', {
  secretFirst,
  secretSecond,
});

await drag(112);
const standardSecondReturn = await persistentSnapshot();
assert(Math.abs(standardSecondReturn.total - standardAfterReturn.total) <= 1, 'Base/persistent source count drifted after repeated page switching', {
  standardAfterReturn,
  standardSecondReturn,
});

const bankingMark = await oscillatorCount();
await page.mouse.click(centerX, resultY);
await page.waitForTimeout(4200);
const clacks = await chipClacksSince(bankingMark);
assert(clacks.length >= 4, 'Too few CHIPS clacks observed to validate the pitch contour', { clacks });
if (clacks.length >= 2) {
  const starts = clacks.map((entry) => entry.start);
  assert(starts.at(-1) > starts[0] * 1.12, 'CHIPS pitch contour did not rise materially across the full banking sequence', {
    first: starts[0],
    last: starts.at(-1),
    starts,
  });
  assert(Math.max(...starts) <= 1180 * 1.21, 'CHIPS pitch exceeded the bounded pleasant ceiling', {
    max: Math.max(...starts),
  });
  assert(Math.min(...starts) >= 1180 * 0.88, 'CHIPS pitch started below the intended bounded floor', {
    min: Math.min(...starts),
  });
}

const afterBanking = await persistentSnapshot();
assert(afterBanking.total <= standardSecondReturn.total + 1, 'Result ambience remained stacked after collect/banking', {
  standardSecondReturn,
  afterBanking,
});

assert(pageErrors.length === 0, 'Browser page errors occurred', { pageErrors });
assert(badResponses.length === 0, 'Bad local HTTP responses occurred', { badResponses });

const report = {
  failures,
  pageErrors,
  badResponses,
  standardInitial,
  secretFirst,
  standardAfterReturn,
  secretSecond,
  standardSecondReturn,
  afterBanking,
  switchCounts: {
    subthreshold: subthresholdClicks,
    firstSecret: firstSwitchClicks,
    firstReturn: returnClicks,
    secondSecret: secondSecretClicks,
  },
  chipClacks: clacks,
};

await writeFile(reportPath, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
await browser.close();

if (failures.length > 0) process.exitCode = 1;
