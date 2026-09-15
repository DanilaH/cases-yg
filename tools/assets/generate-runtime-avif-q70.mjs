import fs from 'node:fs/promises';
import path from 'node:path';

import sharp from 'sharp';

sharp.cache(false);

const repoRoot = process.cwd();
const QUALITY = 70;
const artAssetsSource = await fs.readFile(path.join(repoRoot, 'src/game/data/artAssets.ts'), 'utf8');

const staticBlockMatch = artAssetsSource.match(/const STATIC_ART_PATHS = \{([\s\S]*?)\n\} as const;/);
if (!staticBlockMatch) throw new Error('Could not parse STATIC_ART_PATHS');
const staticEntries = [...staticBlockMatch[1].matchAll(/'([^']+)'\s*:\s*'([^']+\.webp)'/g)]
  .map((match) => ({ id: match[1], assetPath: match[2], category: 'static' }));

const collectibleBlockMatch = artAssetsSource.match(/export const AVAILABLE_COLLECTIBLE_ART_IDS = new Set<string>\(\[([\s\S]*?)\n\]\);/);
if (!collectibleBlockMatch) throw new Error('Could not parse AVAILABLE_COLLECTIBLE_ART_IDS');
const collectibleEntries = [...collectibleBlockMatch[1].matchAll(/'([^']+)'/g)]
  .map((match) => ({ id: match[1], assetPath: `assets/collectibles/${match[1]}.webp`, category: 'collectible' }));

const classifyStatic = (entry) => {
  if (entry.assetPath.includes('/backgrounds/')) return 'background';
  if (entry.id.includes('pouch-body')) return 'pouch-body';
  if (entry.id.includes('tear-strip')) return 'pouch-tear-strip';
  if (entry.id.includes('star-tab')) return 'pouch-star-tab';
  return 'other-static';
};

const entries = [
  ...staticEntries.map((entry) => ({ ...entry, category: classifyStatic(entry) })),
  ...collectibleEntries,
];
if (entries.length !== 115) throw new Error(`Expected 115 runtime textures, got ${entries.length}`);

const decode = async (filePath) => sharp(filePath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });

const compare = (baseline, candidate) => {
  if (baseline.info.width !== candidate.info.width || baseline.info.height !== candidate.info.height) {
    throw new Error(`Dimension mismatch ${baseline.info.width}x${baseline.info.height} vs ${candidate.info.width}x${candidate.info.height}`);
  }
  const channels = baseline.info.channels;
  const pixelCount = baseline.info.width * baseline.info.height;
  let rgbAbs = 0;
  let rgbSq = 0;
  let rgbSamples = 0;
  let alphaAbs = 0;
  let maxRgbAbs = 0;
  const histogram = new Uint32Array(256);

  for (let pixel = 0; pixel < pixelCount; pixel += 1) {
    const offset = pixel * channels;
    const baseAlpha = baseline.data[offset + 3];
    const candAlpha = candidate.data[offset + 3];
    alphaAbs += Math.abs(baseAlpha - candAlpha);
    if (Math.max(baseAlpha, candAlpha) <= 8) continue;
    for (let channel = 0; channel < 3; channel += 1) {
      const delta = Math.abs(baseline.data[offset + channel] - candidate.data[offset + channel]);
      rgbAbs += delta;
      rgbSq += delta * delta;
      rgbSamples += 1;
      maxRgbAbs = Math.max(maxRgbAbs, delta);
      histogram[delta] += 1;
    }
  }

  const target = Math.ceil(rgbSamples * 0.95);
  let running = 0;
  let p95 = 0;
  for (let delta = 0; delta < histogram.length; delta += 1) {
    running += histogram[delta];
    if (running >= target) {
      p95 = delta;
      break;
    }
  }
  const mae = rgbSamples ? rgbAbs / rgbSamples : 0;
  const mse = rgbSamples ? rgbSq / rgbSamples : 0;
  return {
    rgbMae: mae,
    rgbP95Abs: p95,
    rgbMaxAbs: maxRgbAbs,
    rgbPsnrDb: mse === 0 ? Infinity : 10 * Math.log10((255 * 255) / mse),
    alphaMae: alphaAbs / pixelCount,
  };
};

const rows = [];
for (const entry of entries) {
  const webpPath = path.join(repoRoot, 'public', entry.assetPath);
  const avifAssetPath = entry.assetPath.replace(/\.webp$/, '.avif');
  const avifPath = path.join(repoRoot, 'public', avifAssetPath);
  const webpStat = await fs.stat(webpPath);
  const baseline = await decode(webpPath);

  await sharp(webpPath)
    .avif({ quality: QUALITY, effort: 4 })
    .toFile(avifPath);

  const [avifStat, candidate] = await Promise.all([fs.stat(avifPath), decode(avifPath)]);
  rows.push({
    id: entry.id,
    category: entry.category,
    webpAssetPath: entry.assetPath,
    avifAssetPath,
    width: baseline.info.width,
    height: baseline.info.height,
    webpBytes: webpStat.size,
    avifBytes: avifStat.size,
    savingBytes: webpStat.size - avifStat.size,
    savingRatio: 1 - avifStat.size / webpStat.size,
    ...compare(baseline, candidate),
  });
}

const summarize = (items) => {
  const webpBytes = items.reduce((sum, row) => sum + row.webpBytes, 0);
  const avifBytes = items.reduce((sum, row) => sum + row.avifBytes, 0);
  return {
    count: items.length,
    webpBytes,
    avifBytes,
    savingBytes: webpBytes - avifBytes,
    savingRatio: 1 - avifBytes / webpBytes,
    weightedRgbMae: items.reduce((sum, row) => sum + row.rgbMae * row.webpBytes, 0) / webpBytes,
    weightedAlphaMae: items.reduce((sum, row) => sum + row.alphaMae * row.webpBytes, 0) / webpBytes,
    worstRgbMae: Math.max(...items.map((row) => row.rgbMae)),
    worstRgbP95Abs: Math.max(...items.map((row) => row.rgbP95Abs)),
    minPsnrDb: Math.min(...items.map((row) => row.rgbPsnrDb)),
  };
};

const categories = Object.fromEntries(
  [...new Set(rows.map((row) => row.category))].sort().map((category) => [category, summarize(rows.filter((row) => row.category === category))]),
);
const total = summarize(rows);
const report = { quality: QUALITY, total, categories, rows };
await fs.mkdir(path.join(repoRoot, '.asset-build'), { recursive: true });
await fs.writeFile(path.join(repoRoot, '.asset-build', 'runtime-avif-q70.json'), `${JSON.stringify(report, null, 2)}\n`);

const mib = (bytes) => bytes / 1024 / 1024;
console.log('# Runtime AVIF q70 candidate');
console.log(
  `Total: ${mib(total.webpBytes).toFixed(2)} -> ${mib(total.avifBytes).toFixed(2)} MiB ` +
  `(-${(total.savingRatio * 100).toFixed(1)}%, ${mib(total.savingBytes).toFixed(2)} MiB), ` +
  `weighted RGB MAE ${total.weightedRgbMae.toFixed(3)}/255, worst MAE ${total.worstRgbMae.toFixed(3)}, ` +
  `worst p95 ${total.worstRgbP95Abs}, min PSNR ${total.minPsnrDb.toFixed(2)} dB, alpha MAE ${total.weightedAlphaMae.toFixed(4)}/255`,
);
for (const [category, summary] of Object.entries(categories)) {
  console.log(
    `${category}: ${mib(summary.webpBytes).toFixed(2)} -> ${mib(summary.avifBytes).toFixed(2)} MiB ` +
    `(-${(summary.savingRatio * 100).toFixed(1)}%), RGB MAE ${summary.weightedRgbMae.toFixed(3)}, min PSNR ${summary.minPsnrDb.toFixed(2)} dB`,
  );
}
