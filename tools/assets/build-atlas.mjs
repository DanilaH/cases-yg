import fs from 'node:fs/promises';
import path from 'node:path';

import texturePacker from 'free-tex-packer-core';

import {
  DEFAULT_MANIFEST_PATH,
  loadManifest,
  parseArgs,
  resolveRepoPath,
  selectEntries,
} from './shared.mjs';

const { packAsync } = texturePacker;

export const buildAtlasFiles = async (entries, textureName) => {
  const images = [];
  for (const entry of entries) {
    images.push({
      path: `${entry.id}.webp`,
      contents: await fs.readFile(resolveRepoPath(entry.output)),
    });
  }

  return packAsync(images, {
    textureName,
    width: 2048,
    height: 2048,
    fixedSize: false,
    powerOfTwo: false,
    padding: 4,
    extrude: 2,
    allowRotation: false,
    detectIdentical: true,
    allowTrim: true,
    trimMode: 'trim',
    alphaThreshold: 8,
    removeFileExtension: true,
    prependFolderName: false,
    textureFormat: 'webp',
    exporter: 'Phaser3',
    packer: 'OptimalPacker',
    appInfo: {
      url: 'https://github.com/DanilaH/cases-yg',
      version: 'asset-pipeline-v1',
    },
  });
};

const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname);

if (isMain) {
  const args = parseArgs(process.argv.slice(2));
  const manifestPath = args.get('manifest') || DEFAULT_MANIFEST_PATH;
  const manifest = await loadManifest(manifestPath);
  const selected = selectEntries(manifest, args);
  const families = [...new Set(selected.map((entry) => entry.family))];
  const outRoot = resolveRepoPath(args.get('out') || '.asset-build/atlases');

  if (families.length === 0) throw new Error('No families matched the requested filters');

  for (const family of families) {
    const familyEntries = selected.filter((entry) => entry.family === family);
    const existing = [];
    for (const entry of familyEntries) {
      try {
        await fs.access(resolveRepoPath(entry.output));
        existing.push(entry);
      } catch {
        console.warn(`[atlas] skip missing ${entry.id}`);
      }
    }
    if (existing.length === 0) {
      console.warn(`[atlas] skip ${family}: no prepared outputs`);
      continue;
    }

    const files = await buildAtlasFiles(existing, `${family}-collectibles`);
    const outDir = path.join(outRoot, family);
    await fs.mkdir(outDir, { recursive: true });
    for (const file of files) {
      await fs.writeFile(path.join(outDir, file.name), file.buffer);
      console.log(`[atlas] ${family}: ${path.relative(process.cwd(), path.join(outDir, file.name))}`);
    }
  }
}
