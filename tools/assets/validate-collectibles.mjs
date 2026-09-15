import fs from 'node:fs/promises';

import sharp from 'sharp';

import {
  DEFAULT_MANIFEST_PATH,
  findAlphaBounds,
  loadManifest,
  mergedOptions,
  parseArgs,
  resolveRepoPath,
  selectEntries,
  validateCollectible,
} from './shared.mjs';

const args = parseArgs(process.argv.slice(2));
const manifestPath = args.get('manifest') || DEFAULT_MANIFEST_PATH;
const requireAll = args.has('require-all');
const strictSize = args.has('strict-size');
const manifest = await loadManifest(manifestPath);
const entries = selectEntries(manifest, args);

if (entries.length === 0) {
  throw new Error('No asset manifest entries matched the requested filters');
}

let trimFrames = {};
try {
  const trimManifest = JSON.parse(
    await fs.readFile(resolveRepoPath('src/game/data/artTrim.generated.json'), 'utf8'),
  );
  if (trimManifest?.version !== 1 || typeof trimManifest.frames !== 'object') {
    throw new Error('invalid trim manifest shape');
  }
  trimFrames = trimManifest.frames;
} catch (error) {
  if (error?.code !== 'ENOENT') throw error;
}

const toAssetPath = (output) => output.replace(/^public[\\/]/, '').replaceAll('\\', '/');

const validateTrimmedCollectible = async (output, logicalCanvas, trim) => {
  const absolute = resolveRepoPath(output);
  const metadata = await sharp(absolute).metadata();
  const alpha = await findAlphaBounds(absolute);
  const stat = await fs.stat(absolute);
  const errors = [];
  const warnings = [];

  if (metadata.format !== 'webp') errors.push(`expected WebP, got ${metadata.format ?? 'unknown'}`);
  if (metadata.width !== trim.width || metadata.height !== trim.height) {
    errors.push(`trim metadata expects ${trim.width}x${trim.height}, got ${metadata.width}x${metadata.height}`);
  }
  if (trim.logicalWidth !== logicalCanvas || trim.logicalHeight !== logicalCanvas) {
    errors.push(
      `expected logical ${logicalCanvas}x${logicalCanvas}, got ${trim.logicalWidth}x${trim.logicalHeight}`,
    );
  }
  if (
    trim.x < 0 ||
    trim.y < 0 ||
    trim.width <= 0 ||
    trim.height <= 0 ||
    trim.x + trim.width > trim.logicalWidth ||
    trim.y + trim.height > trim.logicalHeight
  ) {
    errors.push('trim rectangle falls outside logical canvas');
  }
  if (!metadata.hasAlpha || alpha.transparentRatio < 0.001) errors.push('missing meaningful transparency');
  if (alpha.visibleRatio < 0.02) errors.push('visible foreground is effectively empty');
  if (!alpha.bounds) {
    errors.push('no visible foreground pixels');
  } else {
    const localPadding = Math.min(
      alpha.bounds.minX,
      alpha.bounds.minY,
      trim.width - 1 - alpha.bounds.maxX,
      trim.height - 1 - alpha.bounds.maxY,
    );
    if (localPadding < 2) {
      errors.push(`trimmed foreground gutter is too small (${localPadding}px)`);
    }
  }
  if (stat.size > 500 * 1024) warnings.push(`large output ${(stat.size / 1024).toFixed(0)} KB`);

  return { errors, warnings, bytes: stat.size };
};

let checked = 0;
let skipped = 0;
let failed = false;

for (const entry of entries) {
  try {
    await fs.access(resolveRepoPath(entry.output));
  } catch {
    if (requireAll) {
      console.error(`[assets] missing output ${entry.id}: ${entry.output}`);
      failed = true;
    } else {
      console.warn(`[assets] skip ${entry.id}: output not present yet`);
      skipped += 1;
    }
    continue;
  }

  const options = mergedOptions(manifest, entry);
  const trim = trimFrames[toAssetPath(entry.output)];
  const result = trim
    ? await validateTrimmedCollectible(entry.output, options.canvas, trim)
    : await validateCollectible(entry.output, { canvas: options.canvas });

  for (const warning of result.warnings) console.warn(`[assets] ${entry.id}: ${warning}`);
  if (strictSize && result.warnings.length > 0) failed = true;
  for (const error of result.errors) {
    console.error(`[assets] ${entry.id}: ${error}`);
    failed = true;
  }
  if (result.errors.length === 0) {
    const suffix = trim ? ' trimmed' : '';
    console.log(`[assets] ok ${entry.id} (${(result.bytes / 1024).toFixed(0)} KB${suffix})`);
  }
  checked += 1;
}

console.log(`[assets] validation: ${checked} checked, ${skipped} skipped`);
if (failed) process.exitCode = 1;
