import fs from 'node:fs/promises';
import path from 'node:path';

import sharp from 'sharp';

sharp.cache(false);

const QUALITY = 84;
const ALPHA_THRESHOLD = 8;
const MAX_RGB_MAE = 4;
const MAX_ALPHA_MAE = 0.5;
const repoRoot = process.cwd();
const assetRoot = path.join(repoRoot, 'public/assets');
const reportPath = path.join(repoRoot, '.asset-build/runtime-q84-report.json');

const walk = async (dir) => {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await walk(full));
    else if (entry.isFile() && entry.name.endsWith('.webp')) files.push(full);
  }
  return files;
};

const decode = async (buffer) => {
  const { data, info } = await sharp(buffer).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height, channels: info.channels };
};

const compareVisible = (before, after) => {
  if (before.width !== after.width || before.height !== after.height) {
    throw new Error(`dimension mismatch ${before.width}x${before.height} vs ${after.width}x${after.height}`);
  }
  let rgbAbs = 0;
  let alphaAbs = 0;
  let visible = 0;
  for (let pixel = 0; pixel < before.width * before.height; pixel += 1) {
    const offset = pixel * 4;
    const beforeAlpha = before.data[offset + 3];
    const afterAlpha = after.data[offset + 3];
    if (Math.max(beforeAlpha, afterAlpha) <= ALPHA_THRESHOLD) continue;
    visible += 1;
    rgbAbs += Math.abs(before.data[offset] - after.data[offset]);
    rgbAbs += Math.abs(before.data[offset + 1] - after.data[offset + 1]);
    rgbAbs += Math.abs(before.data[offset + 2] - after.data[offset + 2]);
    alphaAbs += Math.abs(beforeAlpha - afterAlpha);
  }
  return {
    rgbMae: visible === 0 ? 0 : rgbAbs / (visible * 3),
    alphaMae: visible === 0 ? 0 : alphaAbs / visible,
  };
};

const files = (await walk(assetRoot)).sort();
const report = { quality: QUALITY, fileCount: files.length, beforeBytes: 0, afterBytes: 0, files: [] };

await fs.mkdir(path.dirname(reportPath), { recursive: true });

for (const filePath of files) {
  const assetPath = path.relative(path.join(repoRoot, 'public'), filePath).split(path.sep).join('/');
  const beforeBuffer = await fs.readFile(filePath);
  const beforeStat = await fs.stat(filePath);
  const before = await decode(beforeBuffer);
  const candidatePath = `${filePath}.q84-candidate.webp`;

  try {
    await sharp(beforeBuffer)
      .webp({ quality: QUALITY, alphaQuality: 100, effort: 4, smartSubsample: true })
      .toFile(candidatePath);

    const candidateBuffer = await fs.readFile(candidatePath);
    const after = await decode(candidateBuffer);
    const quality = compareVisible(before, after);
    if (quality.rgbMae > MAX_RGB_MAE || quality.alphaMae > MAX_ALPHA_MAE) {
      throw new Error(
        `q84 QA failed for ${assetPath}: rgb MAE ${quality.rgbMae.toFixed(3)}, alpha MAE ${quality.alphaMae.toFixed(3)}`,
      );
    }

    const afterStat = await fs.stat(candidatePath);
    await fs.rename(candidatePath, filePath);
    report.beforeBytes += beforeStat.size;
    report.afterBytes += afterStat.size;
    report.files.push({
      assetPath,
      width: before.width,
      height: before.height,
      beforeBytes: beforeStat.size,
      afterBytes: afterStat.size,
      byteSavingRatio: 1 - afterStat.size / beforeStat.size,
      ...quality,
    });
  } finally {
    await fs.rm(candidatePath, { force: true });
  }
}

report.byteSavingRatio = 1 - report.afterBytes / report.beforeBytes;
report.maxRgbMae = Math.max(...report.files.map((file) => file.rgbMae));
report.maxAlphaMae = Math.max(...report.files.map((file) => file.alphaMae));
await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);

console.log(
  `[q84] ${report.fileCount} WebP files; ` +
  `${(report.beforeBytes / 1024 / 1024).toFixed(2)} -> ${(report.afterBytes / 1024 / 1024).toFixed(2)} MiB ` +
  `(${(report.byteSavingRatio * 100).toFixed(1)}%); ` +
  `max RGB MAE ${report.maxRgbMae.toFixed(3)}, max alpha MAE ${report.maxAlphaMae.toFixed(3)}`,
);
