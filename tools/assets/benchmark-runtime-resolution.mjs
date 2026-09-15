import fs from 'node:fs/promises';
import path from 'node:path';

import sharp from 'sharp';

sharp.cache(false);

const repoRoot = process.cwd();
const artAssetsSource = await fs.readFile(path.join(repoRoot, 'src/game/data/artAssets.ts'), 'utf8');
const trimManifest = JSON.parse(await fs.readFile(path.join(repoRoot, 'src/game/data/artTrim.generated.json'), 'utf8'));

const WEBP_OPTIONS = {
  quality: 84,
  alphaQuality: 100,
  effort: 4,
  smartSubsample: true,
};
const ALPHA_THRESHOLD = 8;
const PROFILES = [
  { id: 'minus-6.25pct', scale: 0.9375 },
  { id: 'minus-12.5pct', scale: 0.875 },
  { id: 'minus-16.7pct', scale: 5 / 6 },
];

const staticBlockMatch = artAssetsSource.match(/const STATIC_ART_PATHS = \{([\s\S]*?)\n\} as const;/);
if (!staticBlockMatch) throw new Error('Could not parse STATIC_ART_PATHS');
const staticEntries = [...staticBlockMatch[1].matchAll(/'([^']+)'\s*:\s*'([^']+)'/g)]
  .map((match) => ({ id: match[1], assetPath: match[2], kind: 'static' }));

const collectibleBlockMatch = artAssetsSource.match(/export const AVAILABLE_COLLECTIBLE_ART_IDS = new Set<string>\(\[([\s\S]*?)\n\]\);/);
if (!collectibleBlockMatch) throw new Error('Could not parse AVAILABLE_COLLECTIBLE_ART_IDS');
const collectibleEntries = [...collectibleBlockMatch[1].matchAll(/'([^']+)'/g)]
  .map((match) => ({
    id: match[1],
    assetPath: `assets/collectibles/${match[1]}.webp`,
    kind: 'collectible',
  }));

const classify = (entry) => {
  if (entry.kind === 'collectible') return 'collectible';
  if (entry.assetPath.includes('/backgrounds/')) return 'background';
  if (entry.id.includes('pouch-body')) return 'pouch-body';
  if (entry.id.includes('tear-strip')) return 'pouch-tear-strip';
  if (entry.id.includes('star-tab')) return 'pouch-star-tab';
  return 'other-static';
};

const entries = [...staticEntries, ...collectibleEntries].map((entry) => ({ ...entry, category: classify(entry) }));
if (entries.length !== 115) throw new Error(`Expected 115 runtime textures, got ${entries.length}`);

const decode = async (input) => {
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height, channels: info.channels };
};

const compareVisible = (original, candidate) => {
  let rgbAbs = 0;
  let alphaAbs = 0;
  let visible = 0;
  for (let pixel = 0; pixel < original.width * original.height; pixel += 1) {
    const offset = pixel * 4;
    const alphaA = original.data[offset + 3];
    const alphaB = candidate.data[offset + 3];
    if (Math.max(alphaA, alphaB) <= ALPHA_THRESHOLD) continue;
    visible += 1;
    rgbAbs +=
      Math.abs(original.data[offset] - candidate.data[offset]) +
      Math.abs(original.data[offset + 1] - candidate.data[offset + 1]) +
      Math.abs(original.data[offset + 2] - candidate.data[offset + 2]);
    alphaAbs += Math.abs(alphaA - alphaB);
  }
  return {
    visiblePixels: visible,
    rgbMae: visible === 0 ? 0 : rgbAbs / (visible * 3),
    alphaMae: visible === 0 ? 0 : alphaAbs / visible,
  };
};

const percentile = (values, p) => {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * p))];
};

const sourceRows = [];
for (const entry of entries) {
  const absolutePath = path.join(repoRoot, 'public', entry.assetPath);
  const [buffer, stat, metadata] = await Promise.all([
    fs.readFile(absolutePath),
    fs.stat(absolutePath),
    sharp(absolutePath).metadata(),
  ]);
  if (!metadata.width || !metadata.height) throw new Error(`Missing dimensions: ${entry.assetPath}`);
  const trim = trimManifest.frames?.[entry.assetPath] ?? null;
  sourceRows.push({
    ...entry,
    absolutePath,
    buffer,
    encodedBytes: stat.size,
    physicalWidth: metadata.width,
    physicalHeight: metadata.height,
    logicalWidth: trim?.logicalWidth ?? metadata.width,
    logicalHeight: trim?.logicalHeight ?? metadata.height,
  });
}

const baseline = {
  encodedBytes: sourceRows.reduce((sum, row) => sum + row.encodedBytes, 0),
  rgbaBytes: sourceRows.reduce((sum, row) => sum + row.physicalWidth * row.physicalHeight * 4, 0),
};

const results = [];
for (const profile of PROFILES) {
  let encodedBytes = 0;
  let rgbaBytes = 0;
  const qualityRows = [];
  const byCategory = {};

  for (const row of sourceRows) {
    const shouldResize = row.category !== 'background';
    if (!shouldResize) {
      encodedBytes += row.encodedBytes;
      rgbaBytes += row.physicalWidth * row.physicalHeight * 4;
      continue;
    }

    const width = Math.max(1, Math.round(row.physicalWidth * profile.scale));
    const height = Math.max(1, Math.round(row.physicalHeight * profile.scale));
    const candidateBuffer = await sharp(row.buffer)
      .resize({ width, height, fit: 'fill', kernel: sharp.kernel.lanczos3 })
      .webp(WEBP_OPTIONS)
      .toBuffer();
    encodedBytes += candidateBuffer.length;
    rgbaBytes += width * height * 4;

    const [original, restored] = await Promise.all([
      decode(row.buffer),
      decode(
        await sharp(candidateBuffer)
          .resize({ width: row.physicalWidth, height: row.physicalHeight, fit: 'fill', kernel: sharp.kernel.lanczos3 })
          .png()
          .toBuffer(),
      ),
    ]);
    const quality = compareVisible(original, restored);
    qualityRows.push({
      assetPath: row.assetPath,
      category: row.category,
      source: `${row.physicalWidth}x${row.physicalHeight}`,
      candidate: `${width}x${height}`,
      sourceBytes: row.encodedBytes,
      candidateBytes: candidateBuffer.length,
      ...quality,
    });

    const bucket = byCategory[row.category] ??= {
      count: 0,
      sourceBytes: 0,
      candidateBytes: 0,
      sourceRgbaBytes: 0,
      candidateRgbaBytes: 0,
      rgbMae: [],
      alphaMae: [],
    };
    bucket.count += 1;
    bucket.sourceBytes += row.encodedBytes;
    bucket.candidateBytes += candidateBuffer.length;
    bucket.sourceRgbaBytes += row.physicalWidth * row.physicalHeight * 4;
    bucket.candidateRgbaBytes += width * height * 4;
    bucket.rgbMae.push(quality.rgbMae);
    bucket.alphaMae.push(quality.alphaMae);
  }

  const categorySummary = Object.fromEntries(Object.entries(byCategory).map(([category, bucket]) => [category, {
    count: bucket.count,
    sourceBytes: bucket.sourceBytes,
    candidateBytes: bucket.candidateBytes,
    byteSavingRatio: 1 - bucket.candidateBytes / bucket.sourceBytes,
    sourceRgbaBytes: bucket.sourceRgbaBytes,
    candidateRgbaBytes: bucket.candidateRgbaBytes,
    rgbaSavingRatio: 1 - bucket.candidateRgbaBytes / bucket.sourceRgbaBytes,
    meanRgbMae: bucket.rgbMae.reduce((sum, value) => sum + value, 0) / bucket.rgbMae.length,
    p95RgbMae: percentile(bucket.rgbMae, 0.95),
    maxRgbMae: Math.max(...bucket.rgbMae),
    meanAlphaMae: bucket.alphaMae.reduce((sum, value) => sum + value, 0) / bucket.alphaMae.length,
    maxAlphaMae: Math.max(...bucket.alphaMae),
  }]));

  const rgbMae = qualityRows.map((row) => row.rgbMae);
  const alphaMae = qualityRows.map((row) => row.alphaMae);
  results.push({
    ...profile,
    encodedBytes,
    rgbaBytes,
    byteSavingRatio: 1 - encodedBytes / baseline.encodedBytes,
    rgbaSavingRatio: 1 - rgbaBytes / baseline.rgbaBytes,
    quality: {
      meanRgbMae: rgbMae.reduce((sum, value) => sum + value, 0) / rgbMae.length,
      p95RgbMae: percentile(rgbMae, 0.95),
      maxRgbMae: Math.max(...rgbMae),
      meanAlphaMae: alphaMae.reduce((sum, value) => sum + value, 0) / alphaMae.length,
      maxAlphaMae: Math.max(...alphaMae),
    },
    byCategory: categorySummary,
    worstRgb: [...qualityRows].sort((a, b) => b.rgbMae - a.rgbMae).slice(0, 12),
  });
}

const report = { baseline, profiles: results };
await fs.mkdir(path.join(repoRoot, '.asset-build'), { recursive: true });
await fs.writeFile(
  path.join(repoRoot, '.asset-build/runtime-resolution-benchmark.json'),
  `${JSON.stringify(report, null, 2)}\n`,
);

const mib = (bytes) => bytes / 1024 / 1024;
console.log('# Runtime resolution benchmark');
console.log(`Baseline: ${mib(baseline.encodedBytes).toFixed(2)} MiB encoded, ${mib(baseline.rgbaBytes).toFixed(1)} MiB RGBA.`);
for (const result of results) {
  console.log(`\n${result.id}: ${mib(result.encodedBytes).toFixed(2)} MiB (${(result.byteSavingRatio * 100).toFixed(1)}% saved), ${mib(result.rgbaBytes).toFixed(1)} MiB RGBA (${(result.rgbaSavingRatio * 100).toFixed(1)}% saved).`);
  console.log(`quality: RGB MAE mean ${result.quality.meanRgbMae.toFixed(3)}, p95 ${result.quality.p95RgbMae.toFixed(3)}, max ${result.quality.maxRgbMae.toFixed(3)}; alpha mean ${result.quality.meanAlphaMae.toFixed(3)}, max ${result.quality.maxAlphaMae.toFixed(3)}.`);
  for (const [category, value] of Object.entries(result.byCategory)) {
    console.log(`  ${category}: bytes -${(value.byteSavingRatio * 100).toFixed(1)}%, RGBA -${(value.rgbaSavingRatio * 100).toFixed(1)}%, RGB MAE mean/p95/max ${value.meanRgbMae.toFixed(2)}/${value.p95RgbMae.toFixed(2)}/${value.maxRgbMae.toFixed(2)}`);
  }
}
