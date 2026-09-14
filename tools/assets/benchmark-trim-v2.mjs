import fs from 'node:fs/promises';
import path from 'node:path';

import sharp from 'sharp';

const SOURCE_ROOT = path.resolve('.asset-build/public-v2');
const OUTPUT_ROOT = path.resolve('.asset-build/public-v2-trim');
const QA_ROOT = path.resolve('.asset-build/qa-trim-v2');
const REPORT_PATH = path.resolve('.asset-build/trim-v2-report.json');
const RUNTIME_REPORT_PATH = path.resolve('.asset-build/runtime-v2-report.json');

const ALPHA_THRESHOLD = 8;
const GUTTER = 4;
const WEBP_QUALITY = 88;
const CONCURRENCY = 4;

const qaSamples = new Set([
  'assets/collectibles/camera-common.webp',
  'assets/collectibles/crt-tv-legendary.webp',
  'assets/collectibles/handheld-console-secret-phone.webp',
  'assets/package/analog-nights-charged-pouch-body.webp',
  'assets/package/pouch-star-tab.webp',
]);

const sum = (values) => values.reduce((total, value) => total + value, 0);

const mapLimit = async (items, limit, mapper) => {
  const results = new Array(items.length);
  let nextIndex = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (true) {
      const index = nextIndex;
      nextIndex += 1;
      if (index >= items.length) return;
      results[index] = await mapper(items[index], index);
    }
  });
  await Promise.all(workers);
  return results;
};

const trimEligible = (record) =>
  record.kind === 'collectible' || record.kind === 'pouch-body' || record.kind === 'pouch-tab';

const findBounds = (data, info) => {
  const alphaIndex = info.channels - 1;
  let minX = info.width;
  let minY = info.height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < info.height; y += 1) {
    for (let x = 0; x < info.width; x += 1) {
      const alpha = data[(y * info.width + x) * info.channels + alphaIndex];
      if (alpha <= ALPHA_THRESHOLD) continue;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }

  if (maxX < 0) return null;
  const left = Math.max(0, minX - GUTTER);
  const top = Math.max(0, minY - GUTTER);
  const right = Math.min(info.width - 1, maxX + GUTTER);
  const bottom = Math.min(info.height - 1, maxY + GUTTER);
  return {
    left,
    top,
    width: right - left + 1,
    height: bottom - top + 1,
    visible: { minX, minY, maxX, maxY },
  };
};

const copyQaPair = async (relative, before, after) => {
  const name = relative.replaceAll('/', '__');
  await fs.mkdir(QA_ROOT, { recursive: true });
  await Promise.all([
    fs.copyFile(before, path.join(QA_ROOT, `before__${name}`)),
    fs.copyFile(after, path.join(QA_ROOT, `after__${name}`)),
  ]);
};

const runtimeReport = JSON.parse(await fs.readFile(RUNTIME_REPORT_PATH, 'utf8'));
await fs.rm(OUTPUT_ROOT, { recursive: true, force: true });
await fs.rm(QA_ROOT, { recursive: true, force: true });
await fs.cp(SOURCE_ROOT, OUTPUT_ROOT, { recursive: true });

const eligible = runtimeReport.records.filter((record) => record.after && trimEligible(record));
const startedAt = performance.now();
const trimmedRecords = await mapLimit(eligible, CONCURRENCY, async (record) => {
  const source = path.join(SOURCE_ROOT, record.path);
  const destination = path.join(OUTPUT_ROOT, record.path);
  const beforeBytes = (await fs.stat(source)).size;
  const { data, info } = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const bounds = findBounds(data, info);
  if (!bounds) throw new Error(`No visible alpha pixels in ${record.path}`);

  await sharp(data, { raw: { width: info.width, height: info.height, channels: info.channels } })
    .extract({ left: bounds.left, top: bounds.top, width: bounds.width, height: bounds.height })
    .webp({ quality: WEBP_QUALITY, alphaQuality: 100, effort: 6, smartSubsample: true })
    .toFile(destination);

  const afterBytes = (await fs.stat(destination)).size;
  const sourceCenterX = info.width / 2;
  const sourceCenterY = info.height / 2;
  const trimCenterX = bounds.left + bounds.width / 2;
  const trimCenterY = bounds.top + bounds.height / 2;

  if (qaSamples.has(record.path)) await copyQaPair(record.path, source, destination);

  return {
    path: record.path,
    kind: record.kind,
    beforeBytes,
    afterBytes,
    savedBytes: beforeBytes - afterBytes,
    logicalWidth: info.width,
    logicalHeight: info.height,
    trim: {
      left: bounds.left,
      top: bounds.top,
      width: bounds.width,
      height: bounds.height,
      gutter: GUTTER,
      centerOffsetX: trimCenterX - sourceCenterX,
      centerOffsetY: trimCenterY - sourceCenterY,
    },
    estimatedRgbaBeforeBytes: info.width * info.height * 4,
    estimatedRgbaAfterBytes: bounds.width * bounds.height * 4,
  };
});

const beforeEligibleBytes = sum(trimmedRecords.map((record) => record.beforeBytes));
const afterEligibleBytes = sum(trimmedRecords.map((record) => record.afterBytes));
const beforeEligibleRgba = sum(trimmedRecords.map((record) => record.estimatedRgbaBeforeBytes));
const afterEligibleRgba = sum(trimmedRecords.map((record) => record.estimatedRgbaAfterBytes));
const allImageBeforeBytes = runtimeReport.summary.allImageAfterBytes;
const allImageAfterBytes = allImageBeforeBytes - beforeEligibleBytes + afterEligibleBytes;
const allRgbaBeforeBytes = runtimeReport.summary.estimatedRgbaAfterBytes;
const allRgbaAfterBytes = allRgbaBeforeBytes - beforeEligibleRgba + afterEligibleRgba;

const perKind = Object.fromEntries(
  [...new Set(trimmedRecords.map((record) => record.kind))].map((kind) => {
    const records = trimmedRecords.filter((record) => record.kind === kind);
    const beforeBytes = sum(records.map((record) => record.beforeBytes));
    const afterBytes = sum(records.map((record) => record.afterBytes));
    const beforeRgbaBytes = sum(records.map((record) => record.estimatedRgbaBeforeBytes));
    const afterRgbaBytes = sum(records.map((record) => record.estimatedRgbaAfterBytes));
    return [kind, {
      fileCount: records.length,
      beforeBytes,
      afterBytes,
      savedBytes: beforeBytes - afterBytes,
      beforeRgbaBytes,
      afterRgbaBytes,
      savedRgbaBytes: beforeRgbaBytes - afterRgbaBytes,
    }];
  }),
);

const report = {
  version: 1,
  settings: {
    alphaThreshold: ALPHA_THRESHOLD,
    gutter: GUTTER,
    webpQuality: WEBP_QUALITY,
    concurrency: CONCURRENCY,
  },
  summary: {
    trimmedFileCount: trimmedRecords.length,
    beforeEligibleBytes,
    afterEligibleBytes,
    savedEligibleBytes: beforeEligibleBytes - afterEligibleBytes,
    allImageBeforeBytes,
    allImageAfterBytes,
    savedAllImageBytes: allImageBeforeBytes - allImageAfterBytes,
    allRgbaBeforeBytes,
    allRgbaAfterBytes,
    savedAllRgbaBytes: allRgbaBeforeBytes - allRgbaAfterBytes,
    conversionMs: Math.round(performance.now() - startedAt),
  },
  perKind,
  largestRgbaSavings: [...trimmedRecords]
    .sort((a, b) => b.estimatedRgbaBeforeBytes - b.estimatedRgbaAfterBytes - (a.estimatedRgbaBeforeBytes - a.estimatedRgbaAfterBytes))
    .slice(0, 30),
  records: trimmedRecords,
};

await fs.writeFile(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);
console.log('TRIM_PIPELINE_V2_JSON=' + JSON.stringify({ summary: report.summary, perKind }));
