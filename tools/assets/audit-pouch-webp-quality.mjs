import fs from 'node:fs/promises';
import path from 'node:path';

import sharp from 'sharp';

sharp.cache(false);

const repoRoot = process.cwd();
const artAssetsSource = await fs.readFile(path.join(repoRoot, 'src/game/data/artAssets.ts'), 'utf8');
const staticBlockMatch = artAssetsSource.match(/const STATIC_ART_PATHS = \{([\s\S]*?)\n\} as const;/);
if (!staticBlockMatch) throw new Error('Could not parse STATIC_ART_PATHS');

const pouchBodies = [...staticBlockMatch[1].matchAll(/'([^']*pouch-body)'\s*:\s*'([^']+)'/g)]
  .map((match) => ({ id: match[1], assetPath: match[2] }));
if (pouchBodies.length !== 14) throw new Error(`Expected 14 pouch bodies, got ${pouchBodies.length}`);

const qualities = [82, 80];
const outputRoot = path.join(repoRoot, '.asset-build', 'pouch-quality');
await fs.rm(outputRoot, { recursive: true, force: true });
await fs.mkdir(outputRoot, { recursive: true });

const decode = async (filePath) => sharp(filePath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });

const compare = (baseline, candidate) => {
  if (baseline.info.width !== candidate.info.width || baseline.info.height !== candidate.info.height) {
    throw new Error('Dimension mismatch');
  }
  const channels = baseline.info.channels;
  const pixelCount = baseline.info.width * baseline.info.height;
  let rgbAbs = 0;
  let rgbSq = 0;
  let rgbSamples = 0;
  let alphaAbs = 0;
  let alphaSamples = 0;
  let maxRgbAbs = 0;
  const absErrors = [];

  for (let pixel = 0; pixel < pixelCount; pixel += 1) {
    const offset = pixel * channels;
    const baseAlpha = baseline.data[offset + 3];
    const candAlpha = candidate.data[offset + 3];
    const alphaDelta = Math.abs(baseAlpha - candAlpha);
    alphaAbs += alphaDelta;
    alphaSamples += 1;

    // Ignore RGB in fully transparent pixels: it is not visible and is codec-noise-prone.
    if (Math.max(baseAlpha, candAlpha) <= 8) continue;
    for (let channel = 0; channel < 3; channel += 1) {
      const delta = Math.abs(baseline.data[offset + channel] - candidate.data[offset + channel]);
      rgbAbs += delta;
      rgbSq += delta * delta;
      rgbSamples += 1;
      maxRgbAbs = Math.max(maxRgbAbs, delta);
      absErrors.push(delta);
    }
  }

  absErrors.sort((a, b) => a - b);
  const p95 = absErrors.length ? absErrors[Math.min(absErrors.length - 1, Math.floor(absErrors.length * 0.95))] : 0;
  const mae = rgbSamples ? rgbAbs / rgbSamples : 0;
  const mse = rgbSamples ? rgbSq / rgbSamples : 0;
  const psnr = mse === 0 ? Infinity : 10 * Math.log10((255 * 255) / mse);

  return {
    rgbMae: mae,
    rgbP95Abs: p95,
    rgbMaxAbs: maxRgbAbs,
    rgbPsnrDb: psnr,
    alphaMae: alphaSamples ? alphaAbs / alphaSamples : 0,
  };
};

const rows = [];
for (const pouch of pouchBodies) {
  const source = path.join(repoRoot, 'public', pouch.assetPath);
  const baselineStat = await fs.stat(source);
  const baseline = await decode(source);

  const candidates = {};
  for (const quality of qualities) {
    const candidatePath = path.join(outputRoot, `q${quality}`, path.basename(pouch.assetPath));
    await fs.mkdir(path.dirname(candidatePath), { recursive: true });
    await sharp(source)
      .webp({ quality, alphaQuality: 100, effort: 4, smartSubsample: true })
      .toFile(candidatePath);
    const [candidateStat, candidateDecoded] = await Promise.all([
      fs.stat(candidatePath),
      decode(candidatePath),
    ]);
    candidates[`q${quality}`] = {
      bytes: candidateStat.size,
      savingBytes: baselineStat.size - candidateStat.size,
      savingRatio: 1 - candidateStat.size / baselineStat.size,
      ...compare(baseline, candidateDecoded),
    };
  }

  rows.push({
    id: pouch.id,
    assetPath: pouch.assetPath,
    baselineBytes: baselineStat.size,
    width: baseline.info.width,
    height: baseline.info.height,
    candidates,
  });
}

const summarize = (quality) => {
  const key = `q${quality}`;
  const baselineBytes = rows.reduce((sum, row) => sum + row.baselineBytes, 0);
  const candidateBytes = rows.reduce((sum, row) => sum + row.candidates[key].bytes, 0);
  const weightedRgbMae = rows.reduce((sum, row) => sum + row.candidates[key].rgbMae * row.baselineBytes, 0) / baselineBytes;
  const weightedAlphaMae = rows.reduce((sum, row) => sum + row.candidates[key].alphaMae * row.baselineBytes, 0) / baselineBytes;
  return {
    quality,
    baselineBytes,
    candidateBytes,
    savingBytes: baselineBytes - candidateBytes,
    savingRatio: 1 - candidateBytes / baselineBytes,
    weightedRgbMae,
    weightedAlphaMae,
    worstRgbMae: Math.max(...rows.map((row) => row.candidates[key].rgbMae)),
    worstRgbP95Abs: Math.max(...rows.map((row) => row.candidates[key].rgbP95Abs)),
    worstRgbMaxAbs: Math.max(...rows.map((row) => row.candidates[key].rgbMaxAbs)),
    minPsnrDb: Math.min(...rows.map((row) => row.candidates[key].rgbPsnrDb)),
  };
};

const summary = qualities.map(summarize);
const report = { pouchBodyCount: rows.length, summary, rows };
await fs.writeFile(path.join(outputRoot, 'report.json'), `${JSON.stringify(report, null, 2)}\n`);

const kib = (bytes) => bytes / 1024;
const mib = (bytes) => bytes / 1024 / 1024;
console.log('# Pouch body WebP quality audit');
for (const item of summary) {
  console.log(
    `q${item.quality}: ${mib(item.baselineBytes).toFixed(2)} -> ${mib(item.candidateBytes).toFixed(2)} MiB ` +
    `(-${(item.savingRatio * 100).toFixed(1)}%, ${kib(item.savingBytes).toFixed(0)} KiB), ` +
    `weighted RGB MAE ${item.weightedRgbMae.toFixed(3)}/255, worst MAE ${item.worstRgbMae.toFixed(3)}, ` +
    `worst p95 ${item.worstRgbP95Abs}, min PSNR ${item.minPsnrDb.toFixed(2)} dB, ` +
    `weighted alpha MAE ${item.weightedAlphaMae.toFixed(4)}/255`,
  );
}

console.log('\nPer-file savings (q80):');
for (const row of [...rows].sort((a, b) => b.candidates.q80.savingBytes - a.candidates.q80.savingBytes)) {
  console.log(
    `- ${row.id}: ${kib(row.baselineBytes).toFixed(0)} -> ${kib(row.candidates.q80.bytes).toFixed(0)} KiB ` +
    `(-${(row.candidates.q80.savingRatio * 100).toFixed(1)}%), RGB MAE ${row.candidates.q80.rgbMae.toFixed(3)}, ` +
    `p95 ${row.candidates.q80.rgbP95Abs}, PSNR ${row.candidates.q80.rgbPsnrDb.toFixed(2)} dB`,
  );
}
