import fs from 'node:fs/promises';
import path from 'node:path';

import sharp from 'sharp';

sharp.cache(false);

const repoRoot = process.cwd();
const artAssetsSource = await fs.readFile(path.join(repoRoot, 'src/game/data/artAssets.ts'), 'utf8');
const trimManifest = JSON.parse(await fs.readFile(path.join(repoRoot, 'src/game/data/artTrim.generated.json'), 'utf8'));

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

const entries = [...staticEntries, ...collectibleEntries];
if (entries.length !== 115) throw new Error(`Expected 115 runtime textures, got ${entries.length}`);

const classify = (entry) => {
  if (entry.kind === 'collectible') return 'collectible';
  if (entry.assetPath.includes('/backgrounds/')) return 'background';
  if (entry.id.includes('pouch-body')) return 'pouch-body';
  if (entry.id.includes('tear-strip')) return 'pouch-tear-strip';
  if (entry.id.includes('star-tab')) return 'pouch-star-tab';
  return 'other-static';
};

const rows = [];
for (const entry of entries) {
  const absolutePath = path.join(repoRoot, 'public', entry.assetPath);
  const [stat, metadata] = await Promise.all([
    fs.stat(absolutePath),
    sharp(absolutePath).metadata(),
  ]);
  if (!metadata.width || !metadata.height) throw new Error(`Missing dimensions: ${entry.assetPath}`);
  const trim = trimManifest.frames?.[entry.assetPath] ?? null;
  const logicalWidth = trim?.logicalWidth ?? metadata.width;
  const logicalHeight = trim?.logicalHeight ?? metadata.height;
  const physicalPixels = metadata.width * metadata.height;
  const logicalPixels = logicalWidth * logicalHeight;
  rows.push({
    id: entry.id,
    assetPath: entry.assetPath,
    category: classify(entry),
    encodedBytes: stat.size,
    physicalWidth: metadata.width,
    physicalHeight: metadata.height,
    physicalPixels,
    logicalWidth,
    logicalHeight,
    logicalPixels,
    trimmed: Boolean(trim),
    trimPixelSavingRatio: 1 - physicalPixels / logicalPixels,
    estimatedRgbaBytes: physicalPixels * 4,
  });
}

const summarize = (items) => ({
  count: items.length,
  encodedBytes: items.reduce((sum, item) => sum + item.encodedBytes, 0),
  physicalPixels: items.reduce((sum, item) => sum + item.physicalPixels, 0),
  logicalPixels: items.reduce((sum, item) => sum + item.logicalPixels, 0),
  estimatedRgbaBytes: items.reduce((sum, item) => sum + item.estimatedRgbaBytes, 0),
});

const categories = Object.fromEntries(
  [...new Set(rows.map((row) => row.category))]
    .sort()
    .map((category) => [category, summarize(rows.filter((row) => row.category === category))]),
);

const total = summarize(rows);
const topByRgba = [...rows].sort((a, b) => b.estimatedRgbaBytes - a.estimatedRgbaBytes).slice(0, 20);
const topByEncoded = [...rows].sort((a, b) => b.encodedBytes - a.encodedBytes).slice(0, 20);
const collectibleDimensions = Object.entries(
  rows
    .filter((row) => row.category === 'collectible')
    .reduce((counts, row) => {
      const key = `${row.logicalWidth}x${row.logicalHeight} -> ${row.physicalWidth}x${row.physicalHeight}`;
      counts[key] = (counts[key] ?? 0) + 1;
      return counts;
    }, {}),
).sort((a, b) => b[1] - a[1]);

const mib = (bytes) => bytes / 1024 / 1024;
const mp = (pixels) => pixels / 1_000_000;

const report = {
  textureCount: rows.length,
  total,
  categories,
  collectibleDimensions,
  topByRgba,
  topByEncoded,
  rows,
};

await fs.mkdir(path.join(repoRoot, '.asset-build'), { recursive: true });
await fs.writeFile(
  path.join(repoRoot, '.asset-build/runtime-art-audit.json'),
  `${JSON.stringify(report, null, 2)}\n`,
);

console.log('# Runtime art audit');
console.log(`Total: ${rows.length} textures, ${mib(total.encodedBytes).toFixed(2)} MiB encoded, ${mp(total.physicalPixels).toFixed(1)} MP physical, ${mib(total.estimatedRgbaBytes).toFixed(1)} MiB RGBA proxy.`);
for (const [category, summary] of Object.entries(categories)) {
  console.log(`${category}: ${summary.count} textures, ${mib(summary.encodedBytes).toFixed(2)} MiB, ${mp(summary.physicalPixels).toFixed(1)} MP, ${mib(summary.estimatedRgbaBytes).toFixed(1)} MiB RGBA.`);
}
console.log('\nTop encoded offenders:');
for (const row of topByEncoded.slice(0, 12)) {
  console.log(`- ${row.assetPath}: ${(row.encodedBytes / 1024).toFixed(0)} KiB, ${row.physicalWidth}x${row.physicalHeight} (${mib(row.estimatedRgbaBytes).toFixed(2)} MiB RGBA)`);
}
console.log('\nTop RGBA offenders:');
for (const row of topByRgba.slice(0, 12)) {
  console.log(`- ${row.assetPath}: ${row.physicalWidth}x${row.physicalHeight} (${mib(row.estimatedRgbaBytes).toFixed(2)} MiB), ${(row.encodedBytes / 1024).toFixed(0)} KiB`);
}
console.log('\nCollectible dimension patterns:');
for (const [dimensions, count] of collectibleDimensions) console.log(`- ${count}x ${dimensions}`);
