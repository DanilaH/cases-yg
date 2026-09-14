import fs from 'node:fs/promises';
import path from 'node:path';

import sharp from 'sharp';

const SOURCE_PUBLIC_ROOT = path.resolve('public');
const OUTPUT_PUBLIC_ROOT = path.resolve('.asset-build/public-v2');
const REPORT_PATH = path.resolve('.asset-build/runtime-v2-report.json');
const QA_ROOT = path.resolve('.asset-build/qa-v2');

const COLLECTIBLE_MAX_SIZE = 768;
const POUCH_BODY_MAX_WIDTH = 896;
const POUCH_STRIP_MAX_WIDTH = 768;
const POUCH_TAB_MAX_WIDTH = 640;
const WEBP_QUALITY = 88;

const walkFiles = async (directory) => {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walkFiles(absolute));
    else files.push(absolute);
  }
  return files;
};

const sum = (values) => values.reduce((total, value) => total + value, 0);

const classify = (relativePath) => {
  const normalized = relativePath.replaceAll(path.sep, '/');
  if (normalized.startsWith('assets/collectibles/') && normalized.endsWith('.webp')) {
    return { kind: 'collectible', maxWidth: COLLECTIBLE_MAX_SIZE, maxHeight: COLLECTIBLE_MAX_SIZE };
  }
  if (normalized.startsWith('assets/package/') && normalized.endsWith('-pouch-body.webp')) {
    return { kind: 'pouch-body', maxWidth: POUCH_BODY_MAX_WIDTH };
  }
  if (normalized === 'assets/package/pouch-body.webp' || normalized === 'assets/package/charged-pouch-body.webp') {
    return { kind: 'pouch-body', maxWidth: POUCH_BODY_MAX_WIDTH };
  }
  if (normalized.startsWith('assets/package/') && normalized.endsWith('-pouch-tear-strip-compact.webp')) {
    return { kind: 'pouch-strip', maxWidth: POUCH_STRIP_MAX_WIDTH };
  }
  if (normalized === 'assets/package/pouch-tear-strip-compact.webp' || normalized === 'assets/package/charged-pouch-tear-strip-compact.webp') {
    return { kind: 'pouch-strip', maxWidth: POUCH_STRIP_MAX_WIDTH };
  }
  if (normalized.startsWith('assets/package/') && normalized.endsWith('-pouch-star-tab.webp')) {
    return { kind: 'pouch-tab', maxWidth: POUCH_TAB_MAX_WIDTH };
  }
  if (normalized === 'assets/package/pouch-star-tab.webp' || normalized === 'assets/package/charged-pouch-star-tab.webp') {
    return { kind: 'pouch-tab', maxWidth: POUCH_TAB_MAX_WIDTH };
  }
  if (normalized.startsWith('assets/backgrounds/') && normalized.endsWith('.webp')) {
    return { kind: 'background', passthrough: true };
  }
  return { kind: 'other', passthrough: true };
};

const optimizeWebp = async (source, destination, profile) => {
  const before = await sharp(source).metadata();
  const pipeline = sharp(source).rotate();
  const resize = {};
  if (profile.maxWidth) resize.width = profile.maxWidth;
  if (profile.maxHeight) resize.height = profile.maxHeight;
  if (resize.width || resize.height) {
    pipeline.resize({ ...resize, fit: 'inside', withoutEnlargement: true });
  }
  await pipeline
    .webp({ quality: WEBP_QUALITY, alphaQuality: 100, effort: 6, smartSubsample: true })
    .toFile(destination);
  const after = await sharp(destination).metadata();
  return { before, after };
};

const alphaBounds = async (file) => {
  const image = sharp(file).ensureAlpha();
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
  const alphaIndex = info.channels - 1;
  let minX = info.width;
  let minY = info.height;
  let maxX = -1;
  let maxY = -1;
  let visible = 0;
  for (let y = 0; y < info.height; y += 1) {
    for (let x = 0; x < info.width; x += 1) {
      const alpha = data[(y * info.width + x) * info.channels + alphaIndex];
      if (alpha <= 8) continue;
      visible += 1;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }
  return {
    visibleRatio: visible / Math.max(1, info.width * info.height),
    bounds: maxX >= 0 ? { minX, minY, maxX, maxY } : null,
  };
};

const copyQaPair = async (relativePath, source, candidate) => {
  const basename = relativePath.replaceAll('/', '__');
  await fs.mkdir(QA_ROOT, { recursive: true });
  await fs.copyFile(source, path.join(QA_ROOT, `before__${basename}`));
  await fs.copyFile(candidate, path.join(QA_ROOT, `after__${basename}`));
};

const qaSamples = new Set([
  'assets/collectibles/camera-common.webp',
  'assets/collectibles/crt-tv-legendary.webp',
  'assets/collectibles/handheld-console-secret-phone.webp',
  'assets/package/analog-nights-charged-pouch-body.webp',
  'assets/package/game-zone-charged-pouch-tear-strip-compact.webp',
  'assets/package/pouch-star-tab.webp',
  'assets/backgrounds/opening-bg.webp',
]);

await fs.rm(OUTPUT_PUBLIC_ROOT, { recursive: true, force: true });
await fs.rm(QA_ROOT, { recursive: true, force: true });
await fs.mkdir(path.dirname(OUTPUT_PUBLIC_ROOT), { recursive: true });
await fs.cp(SOURCE_PUBLIC_ROOT, OUTPUT_PUBLIC_ROOT, { recursive: true });

const sourceFiles = await walkFiles(SOURCE_PUBLIC_ROOT);
const records = [];

for (const source of sourceFiles) {
  const relative = path.relative(SOURCE_PUBLIC_ROOT, source).replaceAll(path.sep, '/');
  const destination = path.join(OUTPUT_PUBLIC_ROOT, relative);
  const profile = classify(relative);
  const beforeStat = await fs.stat(source);
  const extension = path.extname(relative).toLowerCase();

  let beforeMetadata = null;
  let afterMetadata = null;
  let alpha = null;

  if (extension === '.webp') {
    beforeMetadata = await sharp(source).metadata();
    if (!profile.passthrough) {
      const optimized = await optimizeWebp(source, destination, profile);
      beforeMetadata = optimized.before;
      afterMetadata = optimized.after;
    } else {
      afterMetadata = beforeMetadata;
    }
    if (profile.kind === 'collectible' || profile.kind.startsWith('pouch-')) {
      alpha = await alphaBounds(destination);
    }
  }

  const afterStat = await fs.stat(destination);
  const beforePixels = beforeMetadata?.width && beforeMetadata?.height
    ? beforeMetadata.width * beforeMetadata.height
    : null;
  const afterPixels = afterMetadata?.width && afterMetadata?.height
    ? afterMetadata.width * afterMetadata.height
    : null;

  records.push({
    path: relative,
    kind: profile.kind,
    optimized: !profile.passthrough,
    beforeBytes: beforeStat.size,
    afterBytes: afterStat.size,
    deltaBytes: afterStat.size - beforeStat.size,
    savingRatio: beforeStat.size > 0 ? 1 - afterStat.size / beforeStat.size : 0,
    before: beforeMetadata ? { width: beforeMetadata.width, height: beforeMetadata.height, hasAlpha: beforeMetadata.hasAlpha } : null,
    after: afterMetadata ? { width: afterMetadata.width, height: afterMetadata.height, hasAlpha: afterMetadata.hasAlpha } : null,
    estimatedRgbaBeforeBytes: beforePixels === null ? null : beforePixels * 4,
    estimatedRgbaAfterBytes: afterPixels === null ? null : afterPixels * 4,
    alpha,
  });

  if (qaSamples.has(relative)) await copyQaPair(relative, source, destination);
}

const optimized = records.filter((record) => record.optimized);
const imageRecords = records.filter((record) => record.before !== null);
const report = {
  version: 1,
  settings: {
    collectibleMaxSize: COLLECTIBLE_MAX_SIZE,
    pouchBodyMaxWidth: POUCH_BODY_MAX_WIDTH,
    pouchStripMaxWidth: POUCH_STRIP_MAX_WIDTH,
    pouchTabMaxWidth: POUCH_TAB_MAX_WIDTH,
    webpQuality: WEBP_QUALITY,
  },
  summary: {
    optimizedFileCount: optimized.length,
    beforeOptimizedBytes: sum(optimized.map((record) => record.beforeBytes)),
    afterOptimizedBytes: sum(optimized.map((record) => record.afterBytes)),
    savedOptimizedBytes: sum(optimized.map((record) => record.beforeBytes - record.afterBytes)),
    allImageBeforeBytes: sum(imageRecords.map((record) => record.beforeBytes)),
    allImageAfterBytes: sum(imageRecords.map((record) => record.afterBytes)),
    estimatedRgbaBeforeBytes: sum(imageRecords.map((record) => record.estimatedRgbaBeforeBytes ?? 0)),
    estimatedRgbaAfterBytes: sum(imageRecords.map((record) => record.estimatedRgbaAfterBytes ?? 0)),
  },
  largestSavings: [...optimized]
    .sort((a, b) => (b.beforeBytes - b.afterBytes) - (a.beforeBytes - a.afterBytes))
    .slice(0, 30),
  records,
};

await fs.mkdir(path.dirname(REPORT_PATH), { recursive: true });
await fs.writeFile(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);
console.log('ASSET_PIPELINE_V2_JSON=' + JSON.stringify(report.summary));
console.log(`[asset-v2] generated ${OUTPUT_PUBLIC_ROOT}`);
