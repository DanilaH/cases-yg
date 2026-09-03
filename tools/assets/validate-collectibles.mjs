import fs from 'node:fs/promises';

import {
  DEFAULT_MANIFEST_PATH,
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
  const result = await validateCollectible(entry.output, { canvas: options.canvas });
  for (const warning of result.warnings) console.warn(`[assets] ${entry.id}: ${warning}`);
  if (strictSize && result.warnings.length > 0) failed = true;
  for (const error of result.errors) {
    console.error(`[assets] ${entry.id}: ${error}`);
    failed = true;
  }
  if (result.errors.length === 0) {
    console.log(`[assets] ok ${entry.id} (${(result.bytes / 1024).toFixed(0)} KB)`);
  }
  checked += 1;
}

console.log(`[assets] validation: ${checked} checked, ${skipped} skipped`);
if (failed) process.exitCode = 1;
