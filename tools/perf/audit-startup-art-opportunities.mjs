import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

import sharp from 'sharp';

sharp.cache(false);

const repoRoot = process.cwd();
const outputRoot = process.env.STARTUP_ART_AUDIT_OUTPUT ?? '/tmp/startup-art-opportunity-audit';
const MAX_ATLAS_EDGE = 2048;
const ATLAS_PADDING = 4;
const DEFAULT_POOL = 'y2k-essentials';

const artAssetsSource = await fs.readFile(path.join(repoRoot, 'src/game/data/artAssets.ts'), 'utf8');
const collectiblesSource = await fs.readFile(path.join(repoRoot, 'src/game/data/collectibles.ts'), 'utf8');
const trimManifest = JSON.parse(await fs.readFile(path.join(repoRoot, 'src/game/data/artTrim.generated.json'), 'utf8'));

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

const familyPool = new Map();
for (const match of collectiblesSource.matchAll(/family\(\s*'([^']+)'\s*,\s*(DEFAULT_LOOT_POOL_ID|'[^']+')/g)) {
  familyPool.set(match[1], match[2] === 'DEFAULT_LOOT_POOL_ID' ? DEFAULT_POOL : match[2].slice(1, -1));
}
const poolIds = [...new Set(familyPool.values())].sort((left, right) => right.length - left.length);
const familyIds = [...familyPool.keys()].sort((left, right) => right.length - left.length);

const categoryFor = (assetPath) => {
  if (assetPath.includes('/backgrounds/')) return 'background';
  if (assetPath.includes('/collectibles/')) return assetPath.includes('-secret-') ? 'collectible-secret' : 'collectible';
  if (assetPath.includes('pouch-body')) return 'pouch-body';
  if (assetPath.includes('tear-strip')) return 'tear-strip';
  if (assetPath.includes('star-tab')) return 'star-tab';
  return 'other-static';
};

const poolFor = (assetPath) => {
  if (assetPath.includes('/backgrounds/')) return 'global';
  if (assetPath.includes('/collectibles/')) {
    const basename = path.basename(assetPath, '.webp');
    const familyId = familyIds.find((id) => basename === id || basename.startsWith(`${id}-`));
    return familyId ? familyPool.get(familyId) : 'unknown';
  }
  const basename = path.basename(assetPath, '.webp');
  if (basename.startsWith('pouch-') || basename.startsWith('charged-pouch-')) return DEFAULT_POOL;
  return poolIds.find((poolId) => basename.startsWith(`${poolId}-`)) ?? 'unknown';
};

const qualityFor = (assetPath) => {
  if (assetPath.includes('/collectibles/') && assetPath.includes('-secret-')) return 70;
  if (assetPath.includes('/backgrounds/')) return 60;
  if (assetPath.includes('tear-strip') || assetPath.includes('star-tab')) return 60;
  return 65;
};

const mib = (bytes) => bytes / 1024 / 1024;
const kib = (bytes) => bytes / 1024;
const pct = (ratio) => Number((ratio * 100).toFixed(2));

await fs.rm(outputRoot, { recursive: true, force: true });
await fs.mkdir(outputRoot, { recursive: true });

const rows = [];
for (const assetPath of assetPaths) {
  const webpPath = path.join(repoRoot, 'public', assetPath);
  const avifPath = path.join(repoRoot, 'public', assetPath.replace(/\.webp$/, '.avif'));
  const [webpStat, avifStat, meta, raw] = await Promise.all([
    fs.stat(webpPath),
    fs.stat(avifPath),
    sharp(avifPath).metadata(),
    sharp(webpPath).ensureAlpha().raw().toBuffer(),
  ]);
  if (!meta.width || !meta.height) throw new Error(`Missing dimensions for ${assetPath}`);
  const decodedHash = crypto.createHash('sha256')
    .update(`${meta.width}x${meta.height}:`)
    .update(raw)
    .digest('hex');
  rows.push({
    assetPath,
    category: categoryFor(assetPath),
    pool: poolFor(assetPath),
    quality: qualityFor(assetPath),
    width: meta.width,
    height: meta.height,
    webpBytes: webpStat.size,
    avifBytes: avifStat.size,
    decodedHash,
  });
}

const totalAvifBytes = rows.reduce((sum, row) => sum + row.avifBytes, 0);
const groupBreakdown = (key) => [...new Set(rows.map((row) => row[key]))]
  .sort()
  .map((value) => {
    const selected = rows.filter((row) => row[key] === value);
    const bytes = selected.reduce((sum, row) => sum + row.avifBytes, 0);
    return {
      [key]: value,
      count: selected.length,
      avifKiB: Number(kib(bytes).toFixed(1)),
      avifMiB: Number(mib(bytes).toFixed(3)),
      sharePct: pct(bytes / totalAvifBytes),
    };
  })
  .sort((left, right) => right.avifKiB - left.avifKiB);

const hashGroups = new Map();
for (const row of rows) {
  const bucket = hashGroups.get(row.decodedHash) ?? [];
  bucket.push(row.assetPath);
  hashGroups.set(row.decodedHash, bucket);
}
const exactDecodedDuplicates = [...hashGroups.values()].filter((paths) => paths.length > 1);

const packRows = (selectedRows) => {
  const sorted = [...selectedRows].sort((left, right) =>
    (right.height - left.height) || (right.width - left.width));
  const pages = [];
  for (const row of sorted) {
    const tileWidth = row.width + ATLAS_PADDING * 2;
    const tileHeight = row.height + ATLAS_PADDING * 2;
    if (tileWidth > MAX_ATLAS_EDGE || tileHeight > MAX_ATLAS_EDGE) {
      throw new Error(`Atlas tile too large: ${row.assetPath} ${tileWidth}x${tileHeight}`);
    }
    let placement = null;
    for (const page of pages) {
      for (const shelf of page.shelves) {
        if (tileHeight <= shelf.height && shelf.x + tileWidth <= MAX_ATLAS_EDGE) {
          placement = { page, shelf, x: shelf.x, y: shelf.y };
          break;
        }
      }
      if (placement) break;
      const nextY = page.shelves.reduce((max, shelf) => Math.max(max, shelf.y + shelf.height), 0);
      if (nextY + tileHeight <= MAX_ATLAS_EDGE) {
        const shelf = { x: 0, y: nextY, height: tileHeight };
        page.shelves.push(shelf);
        placement = { page, shelf, x: 0, y: nextY };
        break;
      }
    }
    if (!placement) {
      const page = { shelves: [{ x: 0, y: 0, height: tileHeight }], placements: [] };
      pages.push(page);
      placement = { page, shelf: page.shelves[0], x: 0, y: 0 };
    }
    placement.page.placements.push({
      row,
      left: placement.x + ATLAS_PADDING,
      top: placement.y + ATLAS_PADDING,
      tileRight: placement.x + tileWidth,
      tileBottom: placement.y + tileHeight,
    });
    placement.shelf.x += tileWidth;
  }
  return pages.map((page) => ({
    ...page,
    width: Math.max(...page.placements.map((placement) => placement.tileRight)),
    height: Math.max(...page.placements.map((placement) => placement.tileBottom)),
  }));
};

const atlasExperiments = [];
const runAtlasExperiment = async (name, selectedRows, quality) => {
  const pages = packRows(selectedRows);
  const dir = path.join(outputRoot, 'atlases', name);
  await fs.mkdir(dir, { recursive: true });
  let atlasBytes = 0;
  let atlasArea = 0;
  for (let index = 0; index < pages.length; index += 1) {
    const page = pages[index];
    const composites = page.placements.map((placement) => ({
      input: path.join(repoRoot, 'public', placement.row.assetPath),
      left: placement.left,
      top: placement.top,
    }));
    const outputPath = path.join(dir, `page-${index + 1}.avif`);
    await sharp({
      create: {
        width: page.width,
        height: page.height,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    })
      .composite(composites)
      .avif({ quality, effort: 4 })
      .toFile(outputPath);
    const stat = await fs.stat(outputPath);
    atlasBytes += stat.size;
    atlasArea += page.width * page.height;
  }
  const sourceBytes = selectedRows.reduce((sum, row) => sum + row.avifBytes, 0);
  const sourceArea = selectedRows.reduce((sum, row) => sum + row.width * row.height, 0);
  atlasExperiments.push({
    name,
    quality,
    assetCount: selectedRows.length,
    requestCountBefore: selectedRows.length,
    requestCountAfter: pages.length,
    currentKiB: Number(kib(sourceBytes).toFixed(1)),
    atlasKiB: Number(kib(atlasBytes).toFixed(1)),
    byteDeltaPct: pct(atlasBytes / sourceBytes - 1),
    sourceDecodedMiB: Number((sourceArea * 4 / 1024 / 1024).toFixed(1)),
    atlasDecodedMiB: Number((atlasArea * 4 / 1024 / 1024).toFixed(1)),
    decodedAreaDeltaPct: pct(atlasArea / sourceArea - 1),
    pages: pages.map((page, index) => ({ page: index + 1, width: page.width, height: page.height, frames: page.placements.length })),
  });
};

await runAtlasExperiment('package-small-q60', rows.filter((row) => row.category === 'tear-strip' || row.category === 'star-tab'), 60);
await runAtlasExperiment('ordinary-collectibles-q65', rows.filter((row) => row.category === 'collectible'), 65);
await runAtlasExperiment('secret-collectibles-q70', rows.filter((row) => row.category === 'collectible-secret'), 70);
await runAtlasExperiment('pouch-bodies-q65', rows.filter((row) => row.category === 'pouch-body'), 65);

const logicalCanvas = async (assetPath) => {
  const sourcePath = path.join(repoRoot, 'public', assetPath);
  const frame = trimManifest.frames?.[assetPath];
  const meta = await sharp(sourcePath).metadata();
  if (!meta.width || !meta.height) throw new Error(`Missing metadata for ${assetPath}`);
  const logicalWidth = frame?.logicalWidth ?? meta.width;
  const logicalHeight = frame?.logicalHeight ?? meta.height;
  const left = frame?.x ?? 0;
  const top = frame?.y ?? 0;
  const { data } = await sharp({
    create: {
      width: logicalWidth,
      height: logicalHeight,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: sourcePath, left, top }])
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { data, width: logicalWidth, height: logicalHeight };
};

const comparePair = async (basicPath, chargedPath, pool, layer) => {
  const [basic, charged] = await Promise.all([logicalCanvas(basicPath), logicalCanvas(chargedPath)]);
  if (basic.width !== charged.width || basic.height !== charged.height) {
    return { pool, layer, basicPath, chargedPath, comparable: false, reason: 'logical-dimension-mismatch' };
  }
  const pixels = basic.width * basic.height;
  let intersection = 0;
  let union = 0;
  let alphaAbs = 0;
  const sums = Array.from({ length: 3 }, () => ({ w: 0, x: 0, y: 0, xx: 0, xy: 0 }));
  for (let offset = 0; offset < basic.data.length; offset += 4) {
    const ba = basic.data[offset + 3];
    const ca = charged.data[offset + 3];
    const bOn = ba > 8;
    const cOn = ca > 8;
    if (bOn && cOn) intersection += 1;
    if (bOn || cOn) union += 1;
    alphaAbs += Math.abs(ba - ca);
    const w = Math.min(ba, ca) / 255;
    if (w <= 0.02) continue;
    for (let channel = 0; channel < 3; channel += 1) {
      const x = basic.data[offset + channel];
      const y = charged.data[offset + channel];
      const sum = sums[channel];
      sum.w += w;
      sum.x += w * x;
      sum.y += w * y;
      sum.xx += w * x * x;
      sum.xy += w * x * y;
    }
  }
  const affine = sums.map((sum) => {
    const denom = sum.xx - (sum.x * sum.x / Math.max(sum.w, 1));
    const a = Math.abs(denom) < 1e-9 ? 1 : (sum.xy - (sum.x * sum.y / Math.max(sum.w, 1))) / denom;
    const b = (sum.y - a * sum.x) / Math.max(sum.w, 1);
    return { a, b };
  });
  let residual = 0;
  let weight = 0;
  for (let offset = 0; offset < basic.data.length; offset += 4) {
    const w = Math.min(basic.data[offset + 3], charged.data[offset + 3]) / 255;
    if (w <= 0.02) continue;
    for (let channel = 0; channel < 3; channel += 1) {
      const predicted = affine[channel].a * basic.data[offset + channel] + affine[channel].b;
      residual += w * Math.abs(charged.data[offset + channel] - predicted);
      weight += w;
    }
  }
  return {
    pool,
    layer,
    basicPath,
    chargedPath,
    comparable: true,
    alphaIoU: Number((intersection / Math.max(1, union)).toFixed(4)),
    alphaMae: Number((alphaAbs / pixels).toFixed(3)),
    affineRgbMae: Number((residual / Math.max(1, weight)).toFixed(3)),
    affine: affine.map(({ a, b }) => ({ a: Number(a.toFixed(3)), b: Number(b.toFixed(2)) })),
  };
};

const pouchPairs = [];
const layerFiles = {
  body: ['pouch-body.webp', 'charged-pouch-body.webp'],
  'tear-strip': ['pouch-tear-strip-compact.webp', 'charged-pouch-tear-strip-compact.webp'],
  'star-tab': ['pouch-star-tab.webp', 'charged-pouch-star-tab.webp'],
};
for (const [layer, [basicFile, chargedFile]] of Object.entries(layerFiles)) {
  pouchPairs.push(await comparePair(`assets/package/${basicFile}`, `assets/package/${chargedFile}`, DEFAULT_POOL, layer));
}
for (const pool of poolIds.filter((pool) => pool !== DEFAULT_POOL)) {
  for (const [layer, suffix] of Object.entries({
    body: 'pouch-body.webp',
    'tear-strip': 'pouch-tear-strip-compact.webp',
    'star-tab': 'pouch-star-tab.webp',
  })) {
    pouchPairs.push(await comparePair(
      `assets/package/${pool}-basic-${suffix}`,
      `assets/package/${pool}-charged-${suffix}`,
      pool,
      layer,
    ));
  }
}

const simulateQueue = (orderedRows, options = {}) => {
  const lanes = Array.from({ length: options.concurrency ?? 6 }, () => 0);
  const latencyMs = options.latencyMs ?? 0;
  const laneMbps = options.laneMbps ?? 1;
  for (const row of orderedRows) {
    let lane = 0;
    for (let index = 1; index < lanes.length; index += 1) {
      if (lanes[index] < lanes[lane]) lane = index;
    }
    const transferMs = row.avifBytes * 8 / (laneMbps * 1_000_000) * 1000;
    lanes[lane] += latencyMs + transferMs;
  }
  return Math.max(...lanes);
};

const queueProfiles = [
  { name: 'size-only', latencyMs: 0, laneMbps: 1 },
  { name: '80ms-1.67Mbps-per-lane', latencyMs: 80, laneMbps: 1.67 },
  { name: '250ms-0.25Mbps-per-lane', latencyMs: 250, laneMbps: 0.25 },
].map((profile) => {
  const current = simulateQueue(rows, profile);
  const largestFirst = simulateQueue([...rows].sort((left, right) => right.avifBytes - left.avifBytes), profile);
  const smallestFirst = simulateQueue([...rows].sort((left, right) => left.avifBytes - right.avifBytes), profile);
  return {
    profile: profile.name,
    currentMs: Number(current.toFixed(1)),
    largestFirstMs: Number(largestFirst.toFixed(1)),
    largestFirstDeltaPct: pct(largestFirst / current - 1),
    smallestFirstMs: Number(smallestFirst.toFixed(1)),
    smallestFirstDeltaPct: pct(smallestFirst / current - 1),
  };
});

const heaviest = [...rows]
  .sort((left, right) => right.avifBytes - left.avifBytes)
  .slice(0, 25)
  .map((row) => ({
    assetPath: row.assetPath,
    category: row.category,
    pool: row.pool,
    quality: row.quality,
    dimensions: `${row.width}x${row.height}`,
    avifKiB: Number(kib(row.avifBytes).toFixed(1)),
    sharePct: pct(row.avifBytes / totalAvifBytes),
  }));

const summary = {
  generatedAt: new Date().toISOString(),
  textureCount: rows.length,
  totalAvifKiB: Number(kib(totalAvifBytes).toFixed(1)),
  totalAvifMiB: Number(mib(totalAvifBytes).toFixed(3)),
  byCategory: groupBreakdown('category'),
  byPool: groupBreakdown('pool'),
  exactDecodedDuplicates,
  atlasExperiments,
  pouchPairs,
  queueProfiles,
  heaviest,
};

await fs.writeFile(path.join(outputRoot, 'summary.json'), JSON.stringify(summary, null, 2));
console.log(JSON.stringify(summary, null, 2));
