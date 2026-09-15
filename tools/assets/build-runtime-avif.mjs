import fs from 'node:fs/promises';
import path from 'node:path';

import sharp from 'sharp';

sharp.cache(false);

const repoRoot = process.cwd();
const EFFORT = 4;
const PARALLEL = 4;
const artAssetsSource = await fs.readFile(path.join(repoRoot, 'src/game/data/artAssets.ts'), 'utf8');

const staticBlockMatch = artAssetsSource.match(/const STATIC_ART_PATHS = \{([\s\S]*?)\n\} as const;/);
if (!staticBlockMatch) throw new Error('Could not parse STATIC_ART_PATHS');
const staticPaths = [...staticBlockMatch[1].matchAll(/'[^']+'\s*:\s*'([^']+\.webp)'/g)]
  .map((match) => match[1]);

const collectibleBlockMatch = artAssetsSource.match(/export const AVAILABLE_COLLECTIBLE_ART_IDS = new Set<string>\(\[([\s\S]*?)\n\]\);/);
if (!collectibleBlockMatch) throw new Error('Could not parse AVAILABLE_COLLECTIBLE_ART_IDS');
const collectiblePaths = [...collectibleBlockMatch[1].matchAll(/'([^']+)'/g)]
  .map((match) => `assets/collectibles/${match[1]}.webp`);

const assetPaths = [...new Set([...staticPaths, ...collectiblePaths])];
if (assetPaths.length === 0) throw new Error('No runtime art paths found');

// Evidence from issue #183: q65 is visually indistinguishable at reviewed game scale
// for the large/high-frequency surfaces, while q60 remains a safer byte win for
// backgrounds and small package layers. Secret collectibles retain q70 headroom.
const qualityForAssetPath = (assetPath) => {
  if (assetPath.includes('/collectibles/') && assetPath.includes('-secret-')) return 70;
  if (assetPath.includes('/backgrounds/')) return 60;
  if (assetPath.includes('tear-strip') || assetPath.includes('star-tab')) return 60;
  return 65;
};

let webpBytes = 0;
let avifBytes = 0;
const qualityCounts = new Map();

const encode = async (assetPath) => {
  const quality = qualityForAssetPath(assetPath);
  const webpPath = path.join(repoRoot, 'public', assetPath);
  const avifPath = path.join(repoRoot, 'public', assetPath.replace(/\.webp$/, '.avif'));
  const webpStat = await fs.stat(webpPath);
  await sharp(webpPath)
    .avif({ quality, effort: EFFORT })
    .toFile(avifPath);
  const avifStat = await fs.stat(avifPath);
  return { quality, webpBytes: webpStat.size, avifBytes: avifStat.size };
};

for (let index = 0; index < assetPaths.length; index += PARALLEL) {
  const batch = await Promise.all(assetPaths.slice(index, index + PARALLEL).map(encode));
  for (const row of batch) {
    webpBytes += row.webpBytes;
    avifBytes += row.avifBytes;
    qualityCounts.set(row.quality, (qualityCounts.get(row.quality) ?? 0) + 1);
  }
}

const mib = (bytes) => bytes / 1024 / 1024;
const savingRatio = 1 - avifBytes / webpBytes;
const profile = [...qualityCounts.entries()]
  .sort(([left], [right]) => left - right)
  .map(([quality, count]) => `q${quality}:${count}`)
  .join(', ');
console.log(
  `Runtime AVIF profile (${profile}): ${assetPaths.length} textures, ` +
  `${mib(webpBytes).toFixed(2)} -> ${mib(avifBytes).toFixed(2)} MiB ` +
  `(-${(savingRatio * 100).toFixed(1)}%).`,
);
