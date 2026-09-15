import fs from 'node:fs/promises';
import path from 'node:path';

import sharp from 'sharp';

sharp.cache(false);

const ALPHA_THRESHOLD = 8;
const GUTTER = 4;
const MIN_PIXEL_SAVING_RATIO = 0.08;
const MAX_VISIBLE_RGB_MAE = 5;
const MAX_ALPHA_MAE = 0.5;
const WEBP_OPTIONS = {
  quality: 88,
  alphaQuality: 100,
  effort: 4,
  smartSubsample: true,
};

const repoRoot = process.cwd();
const collectibleDir = path.join(repoRoot, 'public/assets/collectibles');
const packageDir = path.join(repoRoot, 'public/assets/package');
const generatedManifestPath = path.join(repoRoot, 'src/game/data/artTrim.generated.json');
const reportPath = path.join(repoRoot, '.asset-build/trim-report.json');

const listWebpFiles = async (dir) =>
  (await fs.readdir(dir, { withFileTypes: true }))
    .filter((entry) => entry.isFile() && entry.name.endsWith('.webp'))
    .map((entry) => path.join(dir, entry.name));

const collectibleFiles = await listWebpFiles(collectibleDir);
const packageFiles = (await listWebpFiles(packageDir)).filter((filePath) =>
  /pouch-(?:body|star-tab)\.webp$/.test(path.basename(filePath)),
);
const targetFiles = [...collectibleFiles, ...packageFiles].sort();

const toAssetPath = (absolutePath) =>
  path.relative(path.join(repoRoot, 'public'), absolutePath).split(path.sep).join('/');

const decodeRgba = async (input) => {
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height, channels: info.channels };
};

const findBounds = ({ data, width, height, channels }) => {
  const alphaIndex = channels - 1;
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const alpha = data[(y * width + x) * channels + alphaIndex];
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
  const right = Math.min(width - 1, maxX + GUTTER);
  const bottom = Math.min(height - 1, maxY + GUTTER);
  return {
    x: left,
    y: top,
    width: right - left + 1,
    height: bottom - top + 1,
  };
};

const reconstruct = (cropped, logicalWidth, logicalHeight, crop) => {
  const out = Buffer.alloc(logicalWidth * logicalHeight * 4);
  for (let y = 0; y < crop.height; y += 1) {
    const sourceStart = y * crop.width * 4;
    const sourceEnd = sourceStart + crop.width * 4;
    const targetStart = ((crop.y + y) * logicalWidth + crop.x) * 4;
    cropped.data.copy(out, targetStart, sourceStart, sourceEnd);
  }
  return out;
};

const compareVisible = (original, reconstructed) => {
  let rgbAbs = 0;
  let alphaAbs = 0;
  let visiblePixels = 0;

  for (let pixel = 0; pixel < original.width * original.height; pixel += 1) {
    const offset = pixel * 4;
    const originalAlpha = original.data[offset + 3];
    const candidateAlpha = reconstructed[offset + 3];
    if (Math.max(originalAlpha, candidateAlpha) <= ALPHA_THRESHOLD) continue;
    visiblePixels += 1;
    rgbAbs += Math.abs(original.data[offset] - reconstructed[offset]);
    rgbAbs += Math.abs(original.data[offset + 1] - reconstructed[offset + 1]);
    rgbAbs += Math.abs(original.data[offset + 2] - reconstructed[offset + 2]);
    alphaAbs += Math.abs(originalAlpha - candidateAlpha);
  }

  return {
    visiblePixels,
    rgbMae: visiblePixels === 0 ? 0 : rgbAbs / (visiblePixels * 3),
    alphaMae: visiblePixels === 0 ? 0 : alphaAbs / visiblePixels,
  };
};

const frames = {};
const files = [];
let beforeBytes = 0;
let afterBytes = 0;
let beforePixels = 0;
let afterPixels = 0;

await fs.mkdir(path.dirname(reportPath), { recursive: true });

for (const filePath of targetFiles) {
  const originalBuffer = await fs.readFile(filePath);
  const original = await decodeRgba(originalBuffer);
  const bounds = findBounds(original);
  const logicalPixels = original.width * original.height;
  const assetPath = toAssetPath(filePath);
  const beforeStat = await fs.stat(filePath);

  beforeBytes += beforeStat.size;
  beforePixels += logicalPixels;

  if (!bounds) {
    throw new Error(`No visible pixels in ${assetPath}`);
  }

  const croppedPixels = bounds.width * bounds.height;
  const pixelSavingRatio = 1 - croppedPixels / logicalPixels;
  if (pixelSavingRatio < MIN_PIXEL_SAVING_RATIO) {
    afterBytes += beforeStat.size;
    afterPixels += logicalPixels;
    files.push({
      assetPath,
      trimmed: false,
      logicalWidth: original.width,
      logicalHeight: original.height,
      beforeBytes: beforeStat.size,
      afterBytes: beforeStat.size,
      beforePixels: logicalPixels,
      afterPixels: logicalPixels,
      pixelSavingRatio,
    });
    continue;
  }

  const candidatePath = `${filePath}.trim-candidate.webp`;
  try {
    await sharp(originalBuffer)
      .extract({ left: bounds.x, top: bounds.y, width: bounds.width, height: bounds.height })
      .webp(WEBP_OPTIONS)
      .toFile(candidatePath);

    const candidateBuffer = await fs.readFile(candidatePath);
    const candidate = await decodeRgba(candidateBuffer);
    if (candidate.width !== bounds.width || candidate.height !== bounds.height) {
      throw new Error(
        `Unexpected candidate dimensions for ${assetPath}: ${candidate.width}x${candidate.height} vs ${bounds.width}x${bounds.height}`,
      );
    }

    const reconstructed = reconstruct(candidate, original.width, original.height, bounds);
    const quality = compareVisible(original, reconstructed);
    if (quality.rgbMae > MAX_VISIBLE_RGB_MAE || quality.alphaMae > MAX_ALPHA_MAE) {
      throw new Error(
        `Trim QA failed for ${assetPath}: rgb MAE ${quality.rgbMae.toFixed(3)}, alpha MAE ${quality.alphaMae.toFixed(3)}`,
      );
    }

    const candidateStat = await fs.stat(candidatePath);
    await fs.rename(candidatePath, filePath);

    frames[assetPath] = {
      logicalWidth: original.width,
      logicalHeight: original.height,
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
    };

    afterBytes += candidateStat.size;
    afterPixels += croppedPixels;
    files.push({
      assetPath,
      trimmed: true,
      logicalWidth: original.width,
      logicalHeight: original.height,
      ...bounds,
      beforeBytes: beforeStat.size,
      afterBytes: candidateStat.size,
      beforePixels: logicalPixels,
      afterPixels: croppedPixels,
      pixelSavingRatio,
      rgbMae: quality.rgbMae,
      alphaMae: quality.alphaMae,
    });
  } finally {
    await fs.rm(candidatePath, { force: true });
  }
}

const manifest = {
  version: 1,
  alphaThreshold: ALPHA_THRESHOLD,
  gutter: GUTTER,
  frames,
};
await fs.mkdir(path.dirname(generatedManifestPath), { recursive: true });
await fs.writeFile(generatedManifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

const report = {
  generatedAt: new Date().toISOString(),
  targetCount: targetFiles.length,
  trimmedCount: Object.keys(frames).length,
  beforeBytes,
  afterBytes,
  byteSavingRatio: beforeBytes === 0 ? 0 : 1 - afterBytes / beforeBytes,
  beforePixels,
  afterPixels,
  pixelSavingRatio: beforePixels === 0 ? 0 : 1 - afterPixels / beforePixels,
  estimatedRgbaBeforeBytes: beforePixels * 4,
  estimatedRgbaAfterBytes: afterPixels * 4,
  files,
};
await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);

console.log(
  `[trim] ${report.trimmedCount}/${report.targetCount} textures trimmed; ` +
  `encoded ${(beforeBytes / 1024 / 1024).toFixed(2)} -> ${(afterBytes / 1024 / 1024).toFixed(2)} MiB ` +
  `(${(report.byteSavingRatio * 100).toFixed(1)}%); ` +
  `RGBA ${(report.estimatedRgbaBeforeBytes / 1024 / 1024).toFixed(1)} -> ` +
  `${(report.estimatedRgbaAfterBytes / 1024 / 1024).toFixed(1)} MiB ` +
  `(${(report.pixelSavingRatio * 100).toFixed(1)}%).`,
);
