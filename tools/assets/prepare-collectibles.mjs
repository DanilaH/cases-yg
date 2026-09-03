import fs from 'node:fs/promises';

import {
  DEFAULT_MANIFEST_PATH,
  loadManifest,
  mergedOptions,
  parseArgs,
  prepareCollectible,
  resolveRepoPath,
  selectEntries,
  validateCollectible,
} from './shared.mjs';

const args = parseArgs(process.argv.slice(2));
const manifestPath = args.get('manifest') || DEFAULT_MANIFEST_PATH;
const requireAll = args.has('require-all');
const manifest = await loadManifest(manifestPath);
const entries = selectEntries(manifest, args);

if (entries.length === 0) {
  throw new Error('No asset manifest entries matched the requested filters');
}

let processed = 0;
let skipped = 0;
let failed = false;

for (const entry of entries) {
  try {
    await fs.access(resolveRepoPath(entry.source));
  } catch {
    if (requireAll) throw new Error(`Missing source for ${entry.id}: ${entry.source}`);
    console.warn(`[assets] skip ${entry.id}: source not found at ${entry.source}`);
    skipped += 1;
    continue;
  }

  const options = mergedOptions(manifest, entry);
  const result = await prepareCollectible(entry.source, entry.output, options);
  const validation = await validateCollectible(entry.output, { canvas: options.canvas });

  console.log(`[assets] prepared ${entry.id} -> ${entry.output} [${result.backgroundMethod}]`);
  for (const warning of validation.warnings) console.warn(`[assets] ${entry.id}: ${warning}`);
  for (const error of validation.errors) {
    console.error(`[assets] ${entry.id}: ${error}`);
    failed = true;
  }
  processed += 1;
}

console.log(`[assets] done: ${processed} prepared, ${skipped} skipped`);
if (failed) process.exitCode = 1;
