import fs from 'node:fs/promises';

import {
  DEFAULT_MANIFEST_PATH,
  loadManifest,
  mergedOptions,
  parseArgs,
  prepareCollectible,
  resolveRepoPath,
  selectEntries,
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

for (const entry of entries) {
  try {
    await fs.access(resolveRepoPath(entry.source));
  } catch {
    if (requireAll) throw new Error(`Missing source for ${entry.id}: ${entry.source}`);
    console.warn(`[assets] skip ${entry.id}: source not found at ${entry.source}`);
    skipped += 1;
    continue;
  }

  const result = await prepareCollectible(entry.source, entry.output, mergedOptions(manifest, entry));
  console.log(`[assets] prepared ${entry.id} -> ${entry.output} [${result.backgroundMethod}]`);
  processed += 1;
}

console.log(`[assets] done: ${processed} prepared, ${skipped} skipped`);
