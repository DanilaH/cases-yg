import fs from 'node:fs/promises';
import path from 'node:path';

import sharp from 'sharp';

sharp.cache(false);

const repoRoot = process.cwd();
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

let webpBytes = 0;
let avifBytes = 0;
const errors = [];

for (const assetPath of assetPaths) {
  const webpPath = path.join(repoRoot, 'public', assetPath);
  const avifAssetPath = assetPath.replace(/\.webp$/, '.avif');
  const avifPath = path.join(repoRoot, 'public', avifAssetPath);

  try {
    const [webpStat, avifStat, webpMeta, avifMeta] = await Promise.all([
      fs.stat(webpPath),
      fs.stat(avifPath),
      sharp(webpPath).metadata(),
      sharp(avifPath).metadata(),
    ]);
    webpBytes += webpStat.size;
    avifBytes += avifStat.size;

    if (avifMeta.format !== 'heif') {
      errors.push(`${avifAssetPath}: expected AVIF/HEIF metadata, got ${avifMeta.format ?? 'unknown'}`);
    }
    if (webpMeta.width !== avifMeta.width || webpMeta.height !== avifMeta.height) {
      errors.push(
        `${avifAssetPath}: dimension mismatch ` +
        `${webpMeta.width}x${webpMeta.height} vs ${avifMeta.width}x${avifMeta.height}`,
      );
    }
    if (webpMeta.hasAlpha && !avifMeta.hasAlpha) {
      errors.push(`${avifAssetPath}: lost alpha channel`);
    }
  } catch (error) {
    errors.push(`${avifAssetPath}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

const savingRatio = webpBytes > 0 ? 1 - avifBytes / webpBytes : 0;
if (savingRatio < 0.2) {
  errors.push(`AVIF payload saving regressed below 20% (${(savingRatio * 100).toFixed(1)}%)`);
}

if (errors.length > 0) {
  console.error(`Runtime AVIF validation failed with ${errors.length} issue(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log(
    `Runtime AVIF validation passed: ${assetPaths.length}/${assetPaths.length} companions, ` +
    `${(webpBytes / 1024 / 1024).toFixed(2)} -> ${(avifBytes / 1024 / 1024).toFixed(2)} MiB ` +
    `(-${(savingRatio * 100).toFixed(1)}%).`,
  );
}
