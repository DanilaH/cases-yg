import fs from 'node:fs/promises';
import path from 'node:path';

import sharp from 'sharp';

sharp.cache(false);

const repoRoot = process.cwd();
const outputRoot = process.env.AVIF_AUDIT_OUTPUT ?? '/tmp/avif-quality-audit';
const CANDIDATE_QUALITIES = [55, 60, 65];
const BASELINE_QUALITY = 70;
const EFFORT = 4;
const PARALLEL = 4;

const artAssetsSource = await fs.readFile(path.join(repoRoot, 'src/game/data/artAssets.ts'), 'utf8');
const staticBlockMatch = artAssetsSource.match(/const STATIC_ART_PATHS = \{([\s\S]*?)\n\} as const;/);
if (!staticBlockMatch) throw new Error('Could not parse STATIC_ART_PATHS');
const staticPaths = [...staticBlockMatch[1].matchAll(/'[^']+'\s*:\s*'([^']+\.webp)'/g)].map((match) => match[1]);

const collectibleBlockMatch = artAssetsSource.match(/export const AVAILABLE_COLLECTIBLE_ART_IDS = new Set<string>\(\[([\s\S]*?)\n\]\);/);
if (!collectibleBlockMatch) throw new Error('Could not parse AVAILABLE_COLLECTIBLE_ART_IDS');
const collectiblePaths = [...collectibleBlockMatch[1].matchAll(/'([^']+)'/g)].map(
  (match) => `assets/collectibles/${match[1]}.webp`,
);

const assetPaths = [...new Set([...staticPaths, ...collectiblePaths])];
if (assetPaths.length !== 115) throw new Error(`Expected 115 runtime textures, found ${assetPaths.length}`);

const categoryFor = (assetPath) => {
  if (assetPath.includes('/backgrounds/')) return 'background';
  if (assetPath.includes('/collectibles/')) return assetPath.includes('-secret-') ? 'collectible-secret' : 'collectible';
  if (assetPath.includes('pouch-body')) return 'pouch-body';
  if (assetPath.includes('tear-strip')) return 'tear-strip';
  if (assetPath.includes('star-tab')) return 'star-tab';
  return 'other-static';
};

const ensureDirFor = async (filePath) => fs.mkdir(path.dirname(filePath), { recursive: true });
const mib = (bytes) => bytes / 1024 / 1024;
const xmlEscape = (value) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

await fs.rm(outputRoot, { recursive: true, force: true });
await fs.mkdir(outputRoot, { recursive: true });

const decodeRgba = async (filePath) => {
  const { data, info } = await sharp(filePath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  if (info.channels !== 4) throw new Error(`Expected RGBA decode for ${filePath}`);
  return { data, width: info.width, height: info.height };
};

const compareDecoded = (baseline, candidate) => {
  if (baseline.width !== candidate.width || baseline.height !== candidate.height) {
    throw new Error(`Dimension mismatch ${baseline.width}x${baseline.height} vs ${candidate.width}x${candidate.height}`);
  }
  let weightedSquared = 0;
  let weightedAbsolute = 0;
  let weightSum = 0;
  let alphaAbsolute = 0;
  const pixels = baseline.width * baseline.height;
  for (let offset = 0; offset < baseline.data.length; offset += 4) {
    const weight = baseline.data[offset + 3] / 255;
    alphaAbsolute += Math.abs(candidate.data[offset + 3] - baseline.data[offset + 3]);
    if (weight <= 0.01) continue;
    for (let channel = 0; channel < 3; channel += 1) {
      const delta = candidate.data[offset + channel] - baseline.data[offset + channel];
      weightedSquared += weight * delta * delta;
      weightedAbsolute += weight * Math.abs(delta);
      weightSum += weight;
    }
  }
  return { weightedSquared, weightedAbsolute, weightSum, alphaAbsolute, pixels };
};

const encodeAndMeasure = async (assetPath) => {
  const sourcePath = path.join(repoRoot, 'public', assetPath);
  const productionAvifPath = path.join(repoRoot, 'public', assetPath.replace(/\.webp$/, '.avif'));
  const sourceStat = await fs.stat(sourcePath);
  const baselineStat = await fs.stat(productionAvifPath);
  const baselineMeta = await sharp(productionAvifPath).metadata();
  const baselineDecoded = await decodeRgba(productionAvifPath);

  const candidate = {};
  for (const quality of CANDIDATE_QUALITIES) {
    const relativeAvif = assetPath.replace(/\.webp$/, '.avif');
    const candidatePath = path.join(outputRoot, `q${quality}`, relativeAvif);
    await ensureDirFor(candidatePath);
    await sharp(sourcePath).avif({ quality, effort: EFFORT }).toFile(candidatePath);
    const stat = await fs.stat(candidatePath);
    const decoded = await decodeRgba(candidatePath);
    const delta = compareDecoded(baselineDecoded, decoded);
    candidate[quality] = { path: candidatePath, bytes: stat.size, ...delta };
  }

  return {
    assetPath,
    category: categoryFor(assetPath),
    width: baselineMeta.width,
    height: baselineMeta.height,
    webpBytes: sourceStat.size,
    baselineBytes: baselineStat.size,
    candidate,
  };
};

const rows = [];
for (let index = 0; index < assetPaths.length; index += PARALLEL) {
  const batch = await Promise.all(assetPaths.slice(index, index + PARALLEL).map(encodeAndMeasure));
  rows.push(...batch);
  console.log(`Audited ${Math.min(index + PARALLEL, assetPaths.length)}/${assetPaths.length}`);
}

const summarizeQuality = (quality) => {
  let bytes = 0;
  let weightedSquared = 0;
  let weightedAbsolute = 0;
  let weightSum = 0;
  let alphaAbsolute = 0;
  let pixels = 0;
  for (const row of rows) {
    if (quality === BASELINE_QUALITY) {
      bytes += row.baselineBytes;
      continue;
    }
    const metric = row.candidate[quality];
    bytes += metric.bytes;
    weightedSquared += metric.weightedSquared;
    weightedAbsolute += metric.weightedAbsolute;
    weightSum += metric.weightSum;
    alphaAbsolute += metric.alphaAbsolute;
    pixels += metric.pixels;
  }
  const mse = quality === BASELINE_QUALITY ? 0 : weightedSquared / Math.max(1, weightSum);
  return {
    quality,
    bytes,
    mib: Number(mib(bytes).toFixed(3)),
    savingVsQ70Pct: quality === BASELINE_QUALITY ? 0 : Number(((1 - bytes / baselineTotalBytes) * 100).toFixed(2)),
    weightedRgbMae: quality === BASELINE_QUALITY ? 0 : Number((weightedAbsolute / Math.max(1, weightSum)).toFixed(3)),
    weightedPsnrDb: quality === BASELINE_QUALITY || mse === 0 ? null : Number((10 * Math.log10((255 * 255) / mse)).toFixed(2)),
    alphaMae: quality === BASELINE_QUALITY ? 0 : Number((alphaAbsolute / Math.max(1, pixels)).toFixed(4)),
  };
};

const baselineTotalBytes = rows.reduce((sum, row) => sum + row.baselineBytes, 0);
const qualities = [...CANDIDATE_QUALITIES, BASELINE_QUALITY].map(summarizeQuality);
const categories = [...new Set(rows.map((row) => row.category))].sort().map((category) => {
  const categoryRows = rows.filter((row) => row.category === category);
  const q70Bytes = categoryRows.reduce((sum, row) => sum + row.baselineBytes, 0);
  return {
    category,
    count: categoryRows.length,
    q70MiB: Number(mib(q70Bytes).toFixed(3)),
    shareOfQ70Pct: Number(((q70Bytes / baselineTotalBytes) * 100).toFixed(2)),
    qualities: Object.fromEntries(
      CANDIDATE_QUALITIES.map((quality) => {
        const bytes = categoryRows.reduce((sum, row) => sum + row.candidate[quality].bytes, 0);
        return [
          `q${quality}`,
          {
            mib: Number(mib(bytes).toFixed(3)),
            savingVsCategoryQ70Pct: Number(((1 - bytes / q70Bytes) * 100).toFixed(2)),
          },
        ];
      }),
    ),
  };
});

const heaviest = [...rows]
  .sort((a, b) => b.baselineBytes - a.baselineBytes)
  .slice(0, 30)
  .map((row) => ({
    assetPath: row.assetPath,
    category: row.category,
    dimensions: `${row.width}x${row.height}`,
    q70KiB: Number((row.baselineBytes / 1024).toFixed(1)),
    q65KiB: Number((row.candidate[65].bytes / 1024).toFixed(1)),
    q60KiB: Number((row.candidate[60].bytes / 1024).toFixed(1)),
    q55KiB: Number((row.candidate[55].bytes / 1024).toFixed(1)),
    q60SavingPct: Number(((1 - row.candidate[60].bytes / row.baselineBytes) * 100).toFixed(1)),
    q60PsnrDb: Number((10 * Math.log10((255 * 255) / (row.candidate[60].weightedSquared / Math.max(1, row.candidate[60].weightSum)))).toFixed(2)),
    q60RgbMae: Number((row.candidate[60].weightedAbsolute / Math.max(1, row.candidate[60].weightSum)).toFixed(3)),
  }));

const selectRepresentativeRows = () => {
  const selected = [];
  const add = (row) => {
    if (row && !selected.some((candidate) => candidate.assetPath === row.assetPath)) selected.push(row);
  };
  const sorted = [...rows].sort((a, b) => b.baselineBytes - a.baselineBytes);
  sorted.slice(0, 6).forEach(add);
  for (const category of ['background', 'pouch-body', 'tear-strip', 'star-tab', 'collectible-secret', 'collectible']) {
    add(sorted.find((row) => row.category === category));
  }
  for (const row of sorted) {
    if (selected.length >= 12) break;
    add(row);
  }
  return selected.slice(0, 12);
};

const makeContactSheet = async (quality, selectedRows) => {
  const tileWidth = 760;
  const tileHeight = 310;
  const imageWidth = 330;
  const imageHeight = 240;
  const columns = 2;
  const rowsCount = Math.ceil(selectedRows.length / columns);
  const canvas = sharp({
    create: {
      width: tileWidth * columns,
      height: tileHeight * rowsCount,
      channels: 4,
      background: '#171717',
    },
  });
  const composites = [];
  for (let index = 0; index < selectedRows.length; index += 1) {
    const row = selectedRows[index];
    const x = (index % columns) * tileWidth;
    const y = Math.floor(index / columns) * tileHeight;
    const productionAvifPath = path.join(repoRoot, 'public', row.assetPath.replace(/\.webp$/, '.avif'));
    const q70 = await sharp(productionAvifPath)
      .resize(imageWidth, imageHeight, { fit: 'contain', background: '#242424' })
      .png()
      .toBuffer();
    const candidate = await sharp(row.candidate[quality].path)
      .resize(imageWidth, imageHeight, { fit: 'contain', background: '#242424' })
      .png()
      .toBuffer();
    const label = xmlEscape(path.basename(row.assetPath, '.webp'));
    const svg = Buffer.from(
      `<svg width="${tileWidth}" height="${tileHeight}" xmlns="http://www.w3.org/2000/svg">` +
        `<rect width="100%" height="100%" fill="#171717"/>` +
        `<text x="18" y="24" font-family="monospace" font-size="16" fill="#ffffff">${label}</text>` +
        `<text x="18" y="48" font-family="monospace" font-size="14" fill="#bdbdbd">q70 ${(row.baselineBytes / 1024).toFixed(1)} KiB</text>` +
        `<text x="398" y="48" font-family="monospace" font-size="14" fill="#bdbdbd">q${quality} ${(row.candidate[quality].bytes / 1024).toFixed(1)} KiB</text>` +
        `</svg>`,
    );
    composites.push({ input: svg, left: x, top: y });
    composites.push({ input: q70, left: x + 18, top: y + 58 });
    composites.push({ input: candidate, left: x + 398, top: y + 58 });
  }
  await canvas.composite(composites).png().toFile(path.join(outputRoot, `contact-q${quality}.png`));
};

const selectedRows = selectRepresentativeRows();
for (const quality of CANDIDATE_QUALITIES) await makeContactSheet(quality, selectedRows);

const summary = {
  textureCount: rows.length,
  baseline: { quality: BASELINE_QUALITY, mib: Number(mib(baselineTotalBytes).toFixed(3)) },
  qualities,
  categories,
  representativeAssets: selectedRows.map((row) => row.assetPath),
  heaviest,
};
await fs.writeFile(path.join(outputRoot, 'summary.json'), JSON.stringify(summary, null, 2));

const csvHeader = ['assetPath', 'category', 'width', 'height', 'q70KiB', 'q65KiB', 'q60KiB', 'q55KiB', 'q60PsnrDb', 'q60RgbMae'];
const csvRows = rows.map((row) => {
  const mse60 = row.candidate[60].weightedSquared / Math.max(1, row.candidate[60].weightSum);
  return [
    row.assetPath,
    row.category,
    row.width,
    row.height,
    (row.baselineBytes / 1024).toFixed(1),
    (row.candidate[65].bytes / 1024).toFixed(1),
    (row.candidate[60].bytes / 1024).toFixed(1),
    (row.candidate[55].bytes / 1024).toFixed(1),
    (10 * Math.log10((255 * 255) / mse60)).toFixed(2),
    (row.candidate[60].weightedAbsolute / Math.max(1, row.candidate[60].weightSum)).toFixed(3),
  ];
});
await fs.writeFile(path.join(outputRoot, 'assets.csv'), [csvHeader, ...csvRows].map((row) => row.join(',')).join('\n'));

console.log(JSON.stringify(summary, null, 2));
