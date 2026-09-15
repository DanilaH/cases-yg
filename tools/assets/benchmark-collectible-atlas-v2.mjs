import fs from 'node:fs/promises';
import path from 'node:path';

import texturePacker from 'free-tex-packer-core';
import sharp from 'sharp';

sharp.cache(false);
const { packAsync } = texturePacker;

const repoRoot = process.cwd();
const collectibleDir = path.join(repoRoot, 'public/assets/collectibles');
const outRoot = path.join(repoRoot, '.asset-build/collectible-atlas-v2');
const ALPHA_THRESHOLD = 8;
const WEBP_OPTIONS = {
  quality: 84,
  alphaQuality: 100,
  effort: 4,
  smartSubsample: true,
};

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

const baseline = { fileCount: entries.length, bytes: 0, pixels: 0 };
for (const entry of entries) {
  const [stat, metadata] = await Promise.all([fs.stat(entry.absolutePath), sharp(entry.absolutePath).metadata()]);
  if (!metadata.width || !metadata.height) throw new Error(`Missing dimensions for ${entry.fileName}`);
  baseline.bytes += stat.size;
  baseline.pixels += metadata.width * metadata.height;
}

const input = await Promise.all(
  entries.map(async (entry) => ({ path: entry.fileName, contents: await fs.readFile(entry.absolutePath) })),
);

const packedFiles = await packAsync(input, {
  textureName: 'collectibles',
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
    version: 'collectible-atlas-benchmark-v2',
  },
});

const jsonFiles = packedFiles.filter((file) => file.name.endsWith('.json'));
const pngFiles = packedFiles.filter((file) => file.name.endsWith('.png'));
if (jsonFiles.length === 0 || pngFiles.length === 0) {
  throw new Error('Global pack did not produce Phaser PNG/JSON atlas output');
}

const pngByName = new Map(pngFiles.map((file) => [file.name, file]));
const pngByStem = new Map(pngFiles.map((file) => [path.parse(file.name).name, file]));
const sourceById = new Map(entries.map((entry) => [entry.id, entry]));

const decodeRgba = async (inputValue) => {
  const { data, info } = await sharp(inputValue).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
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

const normalizeTextures = (atlasData) => {
  if (Array.isArray(atlasData?.textures)) return atlasData.textures;
  if (atlasData?.frames) {
    return [{
      image: atlasData?.meta?.image,
      format: atlasData?.meta?.format,
      size: atlasData?.meta?.size,
      scale: atlasData?.meta?.scale ?? 1,
      frames: Array.isArray(atlasData.frames)
        ? atlasData.frames
        : Object.entries(atlasData.frames).map(([filename, frame]) => ({ filename, ...frame })),
    }];
  }
  throw new Error('Unsupported Phaser atlas JSON');
};

const atlasTextures = [];
const quality = [];
const sheets = [];
let textureBytes = 0;
let atlasPixels = 0;
let frameCount = 0;

for (const jsonFile of jsonFiles) {
  const atlasData = JSON.parse(jsonFile.buffer.toString('utf8'));
  const textures = normalizeTextures(atlasData);
  if (textures.length !== 1) {
    throw new Error(`${jsonFile.name} contains ${textures.length} textures; expected one emitted sheet per JSON`);
  }
  const texture = textures[0];
  const jsonStem = path.parse(jsonFile.name).name;
  const declaredImage = typeof texture.image === 'string' ? texture.image : undefined;
  const pngFile =
    (declaredImage ? pngByName.get(declaredImage) : undefined)
    ?? pngByStem.get(jsonStem)
    ?? (pngFiles.length === 1 ? pngFiles[0] : undefined);
  if (!pngFile) {
    throw new Error(
      `Could not pair ${jsonFile.name}; declared ${String(declaredImage)}; PNGs: ${pngFiles.map((file) => file.name).join(', ')}`,
    );
  }

  const webpBuffer = await sharp(pngFile.buffer).webp(WEBP_OPTIONS).toBuffer();
  const webpMetadata = await sharp(webpBuffer).metadata();
  if (!webpMetadata.width || !webpMetadata.height) throw new Error(`Missing dimensions for ${pngFile.name}`);

  const webpName = `${jsonStem}.webp`;
  await fs.writeFile(path.join(outRoot, webpName), webpBuffer);
  textureBytes += webpBuffer.length;
  atlasPixels += webpMetadata.width * webpMetadata.height;

  const outputTexture = {
    ...texture,
    image: webpName,
    format: 'WEBP',
    size: { w: webpMetadata.width, h: webpMetadata.height },
  };
  atlasTextures.push(outputTexture);

  const frames = Array.isArray(texture.frames) ? texture.frames : [];
  if (frames.length === 0) throw new Error(`No frames in ${jsonFile.name}`);
  for (const frameEntry of frames) {
    const rawFrameName = frameEntry.filename ?? frameEntry.name;
    if (typeof rawFrameName !== 'string' || !frameEntry.frame) {
      throw new Error(`Malformed frame in ${jsonFile.name}`);
    }
    const id = rawFrameName.replace(/\.webp$/, '');
    const sourceEntry = sourceById.get(id);
    if (!sourceEntry) throw new Error(`Unknown collectible frame ${rawFrameName}`);

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
    quality.push({ id, ...compareVisible(sourceDecoded, candidateDecoded) });
    frameCount += 1;
  }

  sheets.push({
    json: jsonFile.name,
    sourcePng: pngFile.name,
    outputWebp: webpName,
    width: webpMetadata.width,
    height: webpMetadata.height,
    pixels: webpMetadata.width * webpMetadata.height,
    bytes: webpBuffer.length,
    frames: frames.length,
  });
}

if (frameCount !== entries.length) {
  throw new Error(`Frame coverage mismatch ${frameCount}/${entries.length}`);
}

const multiAtlas = {
  textures: atlasTextures,
  meta: {
    app: 'Signal 2000 asset benchmark',
    version: '2',
    format: 'WEBP',
  },
};
const multiAtlasBuffer = Buffer.from(`${JSON.stringify(multiAtlas, null, 2)}\n`);
await fs.writeFile(path.join(outRoot, 'collectibles-multiatlas.json'), multiAtlasBuffer);

const sortedRgb = quality.map((entry) => entry.rgbMae).sort((a, b) => a - b);
const percentile = (values, fraction) => values[Math.min(values.length - 1, Math.floor(values.length * fraction))] ?? 0;
const qualitySummary = {
  meanRgbMae: quality.reduce((sum, entry) => sum + entry.rgbMae, 0) / Math.max(1, quality.length),
  p95RgbMae: percentile(sortedRgb, 0.95),
  maxRgbMae: Math.max(0, ...quality.map((entry) => entry.rgbMae)),
  maxAlphaMae: Math.max(0, ...quality.map((entry) => entry.alphaMae)),
};

const atlas = {
  textureCount: sheets.length,
  jsonCount: 1,
  requestCount: sheets.length + 1,
  textureBytes,
  jsonBytes: multiAtlasBuffer.length,
  totalBytes: textureBytes + multiAtlasBuffer.length,
  pixels: atlasPixels,
  estimatedRgbaBytes: atlasPixels * 4,
};
const report = {
  generatedAt: new Date().toISOString(),
  baseline: { ...baseline, estimatedRgbaBytes: baseline.pixels * 4 },
  atlas,
  deltas: {
    requestSavingRatio: 1 - atlas.requestCount / baseline.fileCount,
    byteSavingRatio: 1 - atlas.totalBytes / baseline.bytes,
    pixelSavingRatio: 1 - atlas.pixels / baseline.pixels,
  },
  quality: qualitySummary,
  sheets,
  frames: quality,
};
await fs.writeFile(path.join(outRoot, 'report.json'), `${JSON.stringify(report, null, 2)}\n`);

const summary = `# Collectible Atlas V2 benchmark\n\n` +
  `Baseline: ${baseline.fileCount} image requests, ${mib(baseline.bytes)}, ${(baseline.pixels / 1_000_000).toFixed(1)} MP.\n\n` +
  `Global multi-atlas: ${atlas.textureCount} WebP + 1 JSON = ${atlas.requestCount} requests, ${mib(atlas.totalBytes)}, ${(atlas.pixels / 1_000_000).toFixed(1)} MP.\n\n` +
  `Request reduction: ${pct(report.deltas.requestSavingRatio)}. Byte reduction: ${pct(report.deltas.byteSavingRatio)}. Pixel reduction: ${pct(report.deltas.pixelSavingRatio)}.\n\n` +
  `Additional q84 atlas encode error: mean RGB MAE ${qualitySummary.meanRgbMae.toFixed(3)}, p95 ${qualitySummary.p95RgbMae.toFixed(3)}, max ${qualitySummary.maxRgbMae.toFixed(3)}; max alpha MAE ${qualitySummary.maxAlphaMae.toFixed(3)}.\n`;
await fs.writeFile(path.join(outRoot, 'summary.md'), summary);
console.log(summary);
