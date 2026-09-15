import fs from 'node:fs/promises';
import path from 'node:path';

import sharp from 'sharp';

import trimManifest from '../../src/game/data/artTrim.generated.json' with { type: 'json' };

sharp.cache(false);

const repoRoot = process.cwd();
const publicRoot = path.join(repoRoot, 'public');
const outRoot = path.join(repoRoot, '.asset-build/runtime-image-budget-v3');
const reportPath = path.join(outRoot, 'report.json');
const summaryPath = path.join(outRoot, 'summary.md');
const ALPHA_THRESHOLD = 8;
const WEBP_BASE = { alphaQuality: 100, effort: 4, smartSubsample: true };
const scaleTargets = new Set(Object.keys(trimManifest.frames));

const variants = [
  { id: 'q84', kind: 'quality', quality: 84 },
  { id: 'q82', kind: 'quality', quality: 82 },
  { id: 'scale90-q88', kind: 'scale', quality: 88, scale: 0.9 },
  { id: 'scale85-q88', kind: 'scale', quality: 88, scale: 0.85 },
];

const walk = async (dir) => {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const out = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...await walk(full));
    else if (entry.isFile() && entry.name.endsWith('.webp')) out.push(full);
  }
  return out;
};

const assetFiles = (await walk(path.join(publicRoot, 'assets'))).sort();
const toAssetPath = (filePath) => path.relative(publicRoot, filePath).split(path.sep).join('/');
const categoryOf = (assetPath) => assetPath.split('/')[1] ?? 'unknown';

const decodeRgba = async (input) => {
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height, channels: info.channels };
};

const compareVisible = (baseline, candidate) => {
  if (baseline.width !== candidate.width || baseline.height !== candidate.height) {
    throw new Error(`compare size mismatch ${baseline.width}x${baseline.height} vs ${candidate.width}x${candidate.height}`);
  }
  let rgbAbs = 0;
  let alphaAbs = 0;
  let visible = 0;
  let maxRgb = 0;
  let maxAlpha = 0;
  for (let pixel = 0; pixel < baseline.width * baseline.height; pixel += 1) {
    const offset = pixel * 4;
    const baseAlpha = baseline.data[offset + 3];
    const nextAlpha = candidate.data[offset + 3];
    if (Math.max(baseAlpha, nextAlpha) <= ALPHA_THRESHOLD) continue;
    visible += 1;
    for (let c = 0; c < 3; c += 1) {
      const delta = Math.abs(baseline.data[offset + c] - candidate.data[offset + c]);
      rgbAbs += delta;
      maxRgb = Math.max(maxRgb, delta);
    }
    const alphaDelta = Math.abs(baseAlpha - nextAlpha);
    alphaAbs += alphaDelta;
    maxAlpha = Math.max(maxAlpha, alphaDelta);
  }
  return {
    visiblePixels: visible,
    rgbMae: visible === 0 ? 0 : rgbAbs / (visible * 3),
    alphaMae: visible === 0 ? 0 : alphaAbs / visible,
    maxRgbDelta: maxRgb,
    maxAlphaDelta: maxAlpha,
  };
};

const percentile = (values, p) => {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil(p * sorted.length) - 1));
  return sorted[index];
};

await fs.rm(outRoot, { recursive: true, force: true });
await fs.mkdir(outRoot, { recursive: true });

const files = [];
const totals = {
  baselineBytes: 0,
  baselinePixels: 0,
  variants: Object.fromEntries(variants.map((variant) => [variant.id, { bytes: 0, pixels: 0, changedFiles: 0 }])),
};

for (const filePath of assetFiles) {
  const assetPath = toAssetPath(filePath);
  const baselineBuffer = await fs.readFile(filePath);
  const baseline = await decodeRgba(baselineBuffer);
  const baselineStat = await fs.stat(filePath);
  const row = {
    assetPath,
    category: categoryOf(assetPath),
    scaleTarget: scaleTargets.has(assetPath),
    baseline: {
      bytes: baselineStat.size,
      width: baseline.width,
      height: baseline.height,
      pixels: baseline.width * baseline.height,
    },
    variants: {},
  };
  totals.baselineBytes += baselineStat.size;
  totals.baselinePixels += baseline.width * baseline.height;

  for (const variant of variants) {
    if (variant.kind === 'scale' && !scaleTargets.has(assetPath)) {
      row.variants[variant.id] = {
        skipped: true,
        bytes: baselineStat.size,
        width: baseline.width,
        height: baseline.height,
        pixels: baseline.width * baseline.height,
        byteSavingRatio: 0,
        pixelSavingRatio: 0,
        rgbMae: 0,
        alphaMae: 0,
      };
      totals.variants[variant.id].bytes += baselineStat.size;
      totals.variants[variant.id].pixels += baseline.width * baseline.height;
      continue;
    }

    const targetWidth = variant.kind === 'scale'
      ? Math.max(1, Math.round(baseline.width * variant.scale))
      : baseline.width;
    const targetHeight = variant.kind === 'scale'
      ? Math.max(1, Math.round(baseline.height * variant.scale))
      : baseline.height;
    const candidatePath = path.join(outRoot, variant.id, assetPath.replace(/^assets\//, ''));
    await fs.mkdir(path.dirname(candidatePath), { recursive: true });

    let pipeline = sharp(baselineBuffer);
    if (variant.kind === 'scale') {
      pipeline = pipeline.resize(targetWidth, targetHeight, { fit: 'fill', kernel: sharp.kernel.lanczos3 });
    }
    await pipeline.webp({ ...WEBP_BASE, quality: variant.quality }).toFile(candidatePath);
    const candidateStat = await fs.stat(candidatePath);
    const candidatePhysical = await decodeRgba(await fs.readFile(candidatePath));
    let compareCandidate = candidatePhysical;
    if (variant.kind === 'scale') {
      const restored = await sharp(candidatePhysical.data, {
        raw: {
          width: candidatePhysical.width,
          height: candidatePhysical.height,
          channels: 4,
        },
      })
        .resize(baseline.width, baseline.height, { fit: 'fill', kernel: sharp.kernel.lanczos3 })
        .raw()
        .toBuffer({ resolveWithObject: true });
      compareCandidate = {
        data: restored.data,
        width: restored.info.width,
        height: restored.info.height,
        channels: restored.info.channels,
      };
    }
    const quality = compareVisible(baseline, compareCandidate);
    const pixels = candidatePhysical.width * candidatePhysical.height;
    row.variants[variant.id] = {
      skipped: false,
      bytes: candidateStat.size,
      width: candidatePhysical.width,
      height: candidatePhysical.height,
      pixels,
      byteSavingRatio: 1 - candidateStat.size / baselineStat.size,
      pixelSavingRatio: 1 - pixels / (baseline.width * baseline.height),
      ...quality,
    };
    totals.variants[variant.id].bytes += candidateStat.size;
    totals.variants[variant.id].pixels += pixels;
    totals.variants[variant.id].changedFiles += 1;
  }

  files.push(row);
}

const variantSummary = {};
for (const variant of variants) {
  const metrics = files
    .map((file) => file.variants[variant.id])
    .filter((value) => value && !value.skipped);
  variantSummary[variant.id] = {
    ...totals.variants[variant.id],
    byteSavingRatio: 1 - totals.variants[variant.id].bytes / totals.baselineBytes,
    pixelSavingRatio: 1 - totals.variants[variant.id].pixels / totals.baselinePixels,
    meanRgbMae: metrics.length === 0 ? 0 : metrics.reduce((sum, value) => sum + value.rgbMae, 0) / metrics.length,
    p95RgbMae: percentile(metrics.map((value) => value.rgbMae), 0.95),
    maxRgbMae: Math.max(0, ...metrics.map((value) => value.rgbMae)),
    meanAlphaMae: metrics.length === 0 ? 0 : metrics.reduce((sum, value) => sum + value.alphaMae, 0) / metrics.length,
    p95AlphaMae: percentile(metrics.map((value) => value.alphaMae), 0.95),
    maxAlphaMae: Math.max(0, ...metrics.map((value) => value.alphaMae)),
  };
}

const byCategory = {};
for (const file of files) {
  byCategory[file.category] ??= {
    baselineBytes: 0,
    baselinePixels: 0,
    variants: Object.fromEntries(variants.map((variant) => [variant.id, { bytes: 0, pixels: 0 }])),
  };
  const category = byCategory[file.category];
  category.baselineBytes += file.baseline.bytes;
  category.baselinePixels += file.baseline.pixels;
  for (const variant of variants) {
    category.variants[variant.id].bytes += file.variants[variant.id].bytes;
    category.variants[variant.id].pixels += file.variants[variant.id].pixels;
  }
}
for (const category of Object.values(byCategory)) {
  for (const variant of variants) {
    const current = category.variants[variant.id];
    current.byteSavingRatio = 1 - current.bytes / category.baselineBytes;
    current.pixelSavingRatio = 1 - current.pixels / category.baselinePixels;
  }
}

const report = {
  generatedAt: new Date().toISOString(),
  fileCount: files.length,
  scaleTargetCount: scaleTargets.size,
  baseline: {
    bytes: totals.baselineBytes,
    pixels: totals.baselinePixels,
    estimatedRgbaBytes: totals.baselinePixels * 4,
  },
  variants: variantSummary,
  byCategory,
  files,
};
await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);

const mb = (bytes) => (bytes / 1024 / 1024).toFixed(2);
const pct = (ratio) => `${(ratio * 100).toFixed(1)}%`;
const rows = variants.map((variant) => {
  const summary = variantSummary[variant.id];
  return `| ${variant.id} | ${mb(summary.bytes)} MiB | ${pct(summary.byteSavingRatio)} | ${pct(summary.pixelSavingRatio)} | ${summary.meanRgbMae.toFixed(3)} | ${summary.p95RgbMae.toFixed(3)} | ${summary.maxRgbMae.toFixed(3)} |`;
});
const markdown = [
  '# Runtime Image Budget V3 benchmark',
  '',
  `Baseline: ${report.fileCount} WebP files, ${mb(report.baseline.bytes)} MiB, ${(report.baseline.pixels / 1_000_000).toFixed(1)} MP physical pixels.`,
  '',
  '| Variant | Total bytes | Byte saving | Pixel saving | Mean RGB MAE | P95 RGB MAE | Max file RGB MAE |',
  '| --- | ---: | ---: | ---: | ---: | ---: | ---: |',
  ...rows,
  '',
  'Scale variants only resize the 98 textures already governed by alpha-trim metadata; other WebP assets remain baseline-sized for total-budget accounting.',
  '',
].join('\n');
await fs.writeFile(summaryPath, `${markdown}\n`);
console.log(markdown);
