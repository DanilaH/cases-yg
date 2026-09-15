import fs from 'node:fs/promises';
import path from 'node:path';

import sharp from 'sharp';

sharp.cache(false);

const SCALE = 0.875;
const TARGET_CANVAS = 672;
const WEBP_OPTIONS = {
  quality: 84,
  alphaQuality: 100,
  effort: 4,
  smartSubsample: true,
};

const repoRoot = process.cwd();
const collectibleDir = path.join(repoRoot, 'public/assets/collectibles');
const trimManifestPath = path.join(repoRoot, 'src/game/data/artTrim.generated.json');
const sourceManifestPath = path.join(repoRoot, 'assets-src/collectibles.manifest.json');
const reportPath = path.join(repoRoot, '.asset-build/collectibles-672-report.json');

const trimManifest = JSON.parse(await fs.readFile(trimManifestPath, 'utf8'));
if (trimManifest?.version !== 1 || typeof trimManifest.frames !== 'object') {
  throw new Error('Invalid trim manifest');
}
const sourceManifest = JSON.parse(await fs.readFile(sourceManifestPath, 'utf8'));
if (sourceManifest?.version !== 1 || typeof sourceManifest.defaults !== 'object') {
  throw new Error('Invalid collectible source manifest');
}
if (sourceManifest.defaults.canvas !== 768) {
  throw new Error(`Expected source manifest canvas 768, got ${sourceManifest.defaults.canvas}`);
}

const filenames = (await fs.readdir(collectibleDir, { withFileTypes: true }))
  .filter((entry) => entry.isFile() && entry.name.endsWith('.webp'))
  .map((entry) => entry.name)
  .sort();

const rows = [];
let beforeBytes = 0;
let afterBytes = 0;
let beforePixels = 0;
let afterPixels = 0;

for (const filename of filenames) {
  const assetPath = `assets/collectibles/${filename}`;
  const frame = trimManifest.frames[assetPath];
  if (!frame) throw new Error(`Missing trim metadata for ${assetPath}`);
  if (frame.logicalWidth !== 768 || frame.logicalHeight !== 768) {
    throw new Error(`Expected 768x768 logical canvas for ${assetPath}`);
  }

  const absolutePath = path.join(collectibleDir, filename);
  const [buffer, stat, metadata] = await Promise.all([
    fs.readFile(absolutePath),
    fs.stat(absolutePath),
    sharp(absolutePath).metadata(),
  ]);
  if (!metadata.width || !metadata.height) throw new Error(`Missing dimensions for ${assetPath}`);
  if (metadata.width !== frame.width || metadata.height !== frame.height) {
    throw new Error(
      `Physical/trim mismatch for ${assetPath}: ${metadata.width}x${metadata.height} vs ${frame.width}x${frame.height}`,
    );
  }

  const width = Math.max(1, Math.round(metadata.width * SCALE));
  const height = Math.max(1, Math.round(metadata.height * SCALE));
  const candidatePath = `${absolutePath}.672-candidate.webp`;
  try {
    await sharp(buffer)
      .resize({ width, height, fit: 'fill', kernel: sharp.kernel.lanczos3 })
      .webp(WEBP_OPTIONS)
      .toFile(candidatePath);
    const candidateStat = await fs.stat(candidatePath);
    await fs.rename(candidatePath, absolutePath);

    let x = Math.round(frame.x * SCALE);
    let y = Math.round(frame.y * SCALE);
    x = Math.max(0, Math.min(x, TARGET_CANVAS - width));
    y = Math.max(0, Math.min(y, TARGET_CANVAS - height));
    trimManifest.frames[assetPath] = {
      logicalWidth: TARGET_CANVAS,
      logicalHeight: TARGET_CANVAS,
      x,
      y,
      width,
      height,
    };

    beforeBytes += stat.size;
    afterBytes += candidateStat.size;
    beforePixels += metadata.width * metadata.height;
    afterPixels += width * height;
    rows.push({
      assetPath,
      beforeBytes: stat.size,
      afterBytes: candidateStat.size,
      beforeWidth: metadata.width,
      beforeHeight: metadata.height,
      afterWidth: width,
      afterHeight: height,
      byteSavingRatio: 1 - candidateStat.size / stat.size,
      pixelSavingRatio: 1 - (width * height) / (metadata.width * metadata.height),
    });
  } finally {
    await fs.rm(candidatePath, { force: true });
  }
}

if (rows.length !== 70) throw new Error(`Expected 70 collectibles, resized ${rows.length}`);
sourceManifest.defaults.canvas = TARGET_CANVAS;
sourceManifest.defaults.padding = Math.round(Number(sourceManifest.defaults.padding ?? 48) * SCALE);

await fs.writeFile(trimManifestPath, `${JSON.stringify(trimManifest, null, 2)}\n`);
await fs.writeFile(sourceManifestPath, `${JSON.stringify(sourceManifest, null, 2)}\n`);
await fs.mkdir(path.dirname(reportPath), { recursive: true });
const report = {
  scale: SCALE,
  targetCanvas: TARGET_CANVAS,
  count: rows.length,
  beforeBytes,
  afterBytes,
  byteSavingRatio: 1 - afterBytes / beforeBytes,
  beforePixels,
  afterPixels,
  pixelSavingRatio: 1 - afterPixels / beforePixels,
  estimatedRgbaBeforeBytes: beforePixels * 4,
  estimatedRgbaAfterBytes: afterPixels * 4,
  rows,
};
await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);

console.log(
  `[collectibles-672] ${rows.length} textures: ` +
  `${(beforeBytes / 1024 / 1024).toFixed(2)} -> ${(afterBytes / 1024 / 1024).toFixed(2)} MiB ` +
  `(${(report.byteSavingRatio * 100).toFixed(1)}%); RGBA proxy ` +
  `${(report.estimatedRgbaBeforeBytes / 1024 / 1024).toFixed(1)} -> ` +
  `${(report.estimatedRgbaAfterBytes / 1024 / 1024).toFixed(1)} MiB ` +
  `(${(report.pixelSavingRatio * 100).toFixed(1)}%).`,
);
