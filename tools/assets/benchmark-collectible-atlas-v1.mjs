import fs from 'node:fs/promises';
import path from 'node:path';

import texturePacker from 'free-tex-packer-core';
import sharp from 'sharp';

sharp.cache(false);

const { packAsync } = texturePacker;

const repoRoot = process.cwd();
const collectibleDir = path.join(repoRoot, 'public/assets/collectibles');
const outRoot = path.join(repoRoot, '.asset-build/collectible-atlas-v1');
const WEBP_OPTIONS = {
  quality: 84,
  alphaQuality: 100,
  effort: 4,
  smartSubsample: true,
};
const BATCH_SIZE = 10;
const ALPHA_THRESHOLD = 8;

const mib = (bytes) => `${(bytes / 1024 / 1024).toFixed(2)} MiB`;
const pct = (ratio) => `${(ratio * 100).toFixed(1)}%`;

const entries = (await fs.readdir(collectibleDir, { withFileTypes: true }))
  .filter((entry) => entry.isFile() && entry.name.endsWith('.webp'))
  .map((entry) => ({
    fileName: entry.name,
    id: entry.name.replace(/\.webp$/, ''),
    absolutePath: path.join(collectibleDir, entry.name),
  }))
  .sort((left, right) => left.fileName.localeCompare(right.fileName));

if (entries.length === 0) throw new Error('No collectible WebP files found');

await fs.rm(outRoot, { recursive: true, force: true });
await fs.mkdir(outRoot, { recursive: true });

const baseline = {
  fileCount: entries.length,
  bytes: 0,
  pixels: 0,
};

for (const entry of entries) {
  const [stat, metadata] = await Promise.all([fs.stat(entry.absolutePath), sharp(entry.absolutePath).metadata()]);
  if (!metadata.width || !metadata.height) throw new Error(`Missing dimensions for ${entry.fileName}`);
  baseline.bytes += stat.size;
  baseline.pixels += metadata.width * metadata.height;
}

const decodeRgba = async (input) => {
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height, channels: info.channels };
};

const compareVisible = (source, candidate) => {
  if (source.width !== candidate.width || source.height !== candidate.height) {
    throw new Error(`Frame size mismatch ${source.width}x${source.height} vs ${candidate.width}x${candidate.height}`);
  }

  let rgbAbs = 0;
  let alphaAbs = 0;
  let visiblePixels = 0;
  for (let pixel = 0; pixel < source.width * source.height; pixel += 1) {
    const sourceOffset = pixel * source.channels;
    const candidateOffset = pixel * candidate.channels;
    const sourceAlpha = source.data[sourceOffset + source.channels - 1];
    const candidateAlpha = candidate.data[candidateOffset + candidate.channels - 1];
    if (Math.max(sourceAlpha, candidateAlpha) <= ALPHA_THRESHOLD) continue;
    visiblePixels += 1;
    rgbAbs += Math.abs(source.data[sourceOffset] - candidate.data[candidateOffset]);
    rgbAbs += Math.abs(source.data[sourceOffset + 1] - candidate.data[candidateOffset + 1]);
    rgbAbs += Math.abs(source.data[sourceOffset + 2] - candidate.data[candidateOffset + 2]);
    alphaAbs += Math.abs(sourceAlpha - candidateAlpha);
  }

  return {
    visiblePixels,
    rgbMae: visiblePixels === 0 ? 0 : rgbAbs / (visiblePixels * 3),
    alphaMae: visiblePixels === 0 ? 0 : alphaAbs / visiblePixels,
  };
};

const normalizeFrames = (atlasData) => {
  if (Array.isArray(atlasData.textures)) {
    return atlasData.textures.flatMap((texture) =>
      Array.isArray(texture?.frames)
        ? texture.frames.map((entry) => [entry.filename ?? entry.name, entry])
        : [],
    );
  }
  if (Array.isArray(atlasData.frames)) {
    return atlasData.frames.map((entry) => [entry.filename ?? entry.name, entry]);
  }
  if (atlasData.frames && typeof atlasData.frames === 'object') {
    return Object.entries(atlasData.frames);
  }
  throw new Error('Unsupported Phaser atlas JSON: missing frames');
};

const getDeclaredImageName = (atlasData) => {
  if (typeof atlasData?.meta?.image === 'string') return atlasData.meta.image;
  if (Array.isArray(atlasData?.textures) && atlasData.textures.length === 1) {
    const imageName = atlasData.textures[0]?.image;
    return typeof imageName === 'string' ? imageName : undefined;
  }
  return undefined;
};

const packBatch = async (batch, batchIndex) => {
  const textureName = `collectibles-${String(batchIndex + 1).padStart(2, '0')}`;
  const input = [];
  for (const entry of batch) {
    input.push({ path: entry.fileName, contents: await fs.readFile(entry.absolutePath) });
  }

  return packAsync(input, {
    textureName,
    width: 2048,
    height: 2048,
    fixedSize: false,
    powerOfTwo: false,
    padding: 4,
    extrude: 2,
    allowRotation: false,
    detectIdentical: false,
    allowTrim: false,
    removeFileExtension: true,
    prependFolderName: false,
    textureFormat: 'png',
    exporter: 'Phaser3',
    packer: 'OptimalPacker',
    appInfo: {
      url: 'https://github.com/DanilaH/cases-yg',
      version: 'collectible-atlas-benchmark-v1',
    },
  });
};

const atlas = {
  textureCount: 0,
  jsonCount: 0,
  requestCount: 0,
  textureBytes: 0,
  jsonBytes: 0,
  totalBytes: 0,
  pixels: 0,
  frames: 0,
};
const quality = [];
const sheetReports = [];

for (let offset = 0, batchIndex = 0; offset < entries.length; offset += BATCH_SIZE, batchIndex += 1) {
  const batch = entries.slice(offset, offset + BATCH_SIZE);
  const packedFiles = await packBatch(batch, batchIndex);
  const jsonFiles = packedFiles.filter((file) => file.name.endsWith('.json'));
  const pngFiles = packedFiles.filter((file) => file.name.endsWith('.png'));

  if (jsonFiles.length === 0 || pngFiles.length === 0) {
    throw new Error(`Batch ${batchIndex + 1} did not produce Phaser PNG/JSON atlas output`);
  }

  const pngByName = new Map(pngFiles.map((file) => [file.name, file]));
  const pngByStem = new Map(pngFiles.map((file) => [path.parse(file.name).name, file]));
  for (const jsonFile of jsonFiles) {
    const atlasData = JSON.parse(jsonFile.buffer.toString('utf8'));
    const imageName = getDeclaredImageName(atlasData);
    const jsonStem = path.parse(jsonFile.name).name;
    const pngFile =
      (typeof imageName === 'string' ? pngByName.get(imageName) : undefined)
      ?? pngByStem.get(jsonStem)
      ?? (pngFiles.length === 1 ? pngFiles[0] : undefined);
    if (!pngFile) {
      throw new Error(
        `Could not pair ${jsonFile.name} with an atlas image; declared ${String(imageName)}; produced PNGs: ${pngFiles.map((file) => file.name).join(', ')}`,
      );
    }

    const webpBuffer = await sharp(pngFile.buffer).webp(WEBP_OPTIONS).toBuffer();
    const webpMetadata = await sharp(webpBuffer).metadata();
    if (!webpMetadata.width || !webpMetadata.height) throw new Error(`Missing atlas dimensions for ${pngFile.name}`);

    const stem = path.parse(jsonFile.name).name;
    await fs.writeFile(path.join(outRoot, `${stem}.webp`), webpBuffer);
    await fs.writeFile(path.join(outRoot, jsonFile.name), jsonFile.buffer);

    atlas.textureCount += 1;
    atlas.jsonCount += 1;
    atlas.textureBytes += webpBuffer.length;
    atlas.jsonBytes += jsonFile.buffer.length;
    atlas.pixels += webpMetadata.width * webpMetadata.height;

    let sheetFrames = 0;
    const normalizedFrames = normalizeFrames(atlasData);
    if (normalizedFrames.length === 0) {
      throw new Error(`No frames found in ${jsonFile.name}`);
    }
    for (const [rawFrameName, frameEntry] of normalizedFrames) {
      if (typeof rawFrameName !== 'string' || !frameEntry?.frame) {
        throw new Error(`Malformed frame in ${jsonFile.name}`);
      }
      const id = rawFrameName.replace(/\.webp$/, '');
      const sourceEntry = entries.find((entry) => entry.id === id);
      if (!sourceEntry) throw new Error(`Atlas frame ${rawFrameName} does not map to a collectible source`);

      const rect = frameEntry.frame;
      const width = rect.w ?? rect.width;
      const height = rect.h ?? rect.height;
      if (![rect.x, rect.y, width, height].every(Number.isFinite)) {
        throw new Error(`Invalid frame rectangle for ${rawFrameName}`);
      }

      const extracted = await sharp(webpBuffer)
        .extract({ left: rect.x, top: rect.y, width, height })
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });
      const sourceDecoded = await decodeRgba(sourceEntry.absolutePath);
      const candidateDecoded = {
        data: extracted.data,
        width: extracted.info.width,
        height: extracted.info.height,
        channels: extracted.info.channels,
      };
      const metrics = compareVisible(sourceDecoded, candidateDecoded);
      quality.push({ id, ...metrics });
      atlas.frames += 1;
      sheetFrames += 1;
    }

    sheetReports.push({
      json: jsonFile.name,
      image: `${stem}.webp`,
      width: webpMetadata.width,
      height: webpMetadata.height,
      pixels: webpMetadata.width * webpMetadata.height,
      textureBytes: webpBuffer.length,
      jsonBytes: jsonFile.buffer.length,
      frames: sheetFrames,
    });
  }
}

atlas.requestCount = atlas.textureCount + atlas.jsonCount;
atlas.totalBytes = atlas.textureBytes + atlas.jsonBytes;

if (atlas.frames !== entries.length) {
  throw new Error(`Atlas frame coverage mismatch: ${atlas.frames}/${entries.length}`);
}

const sortedRgb = quality.map((entry) => entry.rgbMae).sort((a, b) => a - b);
const percentile = (values, fraction) => values[Math.min(values.length - 1, Math.floor(values.length * fraction))] ?? 0;
const qualitySummary = {
  meanRgbMae: quality.reduce((sum, entry) => sum + entry.rgbMae, 0) / Math.max(1, quality.length),
  p95RgbMae: percentile(sortedRgb, 0.95),
  maxRgbMae: Math.max(0, ...quality.map((entry) => entry.rgbMae)),
  meanAlphaMae: quality.reduce((sum, entry) => sum + entry.alphaMae, 0) / Math.max(1, quality.length),
  maxAlphaMae: Math.max(0, ...quality.map((entry) => entry.alphaMae)),
};

const report = {
  generatedAt: new Date().toISOString(),
  batchSize: BATCH_SIZE,
  baseline: {
    ...baseline,
    estimatedRgbaBytes: baseline.pixels * 4,
  },
  atlas: {
    ...atlas,
    estimatedRgbaBytes: atlas.pixels * 4,
  },
  deltas: {
    requestSavingRatio: 1 - atlas.requestCount / baseline.fileCount,
    byteSavingRatio: 1 - atlas.totalBytes / baseline.bytes,
    pixelSavingRatio: 1 - atlas.pixels / baseline.pixels,
  },
  quality: qualitySummary,
  sheets: sheetReports,
  frames: quality,
};

await fs.writeFile(path.join(outRoot, 'report.json'), `${JSON.stringify(report, null, 2)}\n`);
const summary = `# Collectible Atlas V1 benchmark\n\n` +
  `Baseline: ${baseline.fileCount} image requests, ${mib(baseline.bytes)}, ${(baseline.pixels / 1_000_000).toFixed(1)} MP physical pixels.\n\n` +
  `Atlas: ${atlas.textureCount} WebP textures + ${atlas.jsonCount} JSON = ${atlas.requestCount} requests, ${mib(atlas.totalBytes)}, ${(atlas.pixels / 1_000_000).toFixed(1)} MP atlas pixels.\n\n` +
  `Request reduction: ${pct(report.deltas.requestSavingRatio)}. Byte reduction: ${pct(report.deltas.byteSavingRatio)}. Pixel reduction: ${pct(report.deltas.pixelSavingRatio)}.\n\n` +
  `Additional atlas encode error vs current q84 sources: mean RGB MAE ${qualitySummary.meanRgbMae.toFixed(3)}, p95 ${qualitySummary.p95RgbMae.toFixed(3)}, max ${qualitySummary.maxRgbMae.toFixed(3)}; max alpha MAE ${qualitySummary.maxAlphaMae.toFixed(3)}.\n`;
await fs.writeFile(path.join(outRoot, 'summary.md'), summary);
console.log(summary);
