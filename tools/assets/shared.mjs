import fs from 'node:fs/promises';
import path from 'node:path';

import sharp from 'sharp';

export const ROOT = process.cwd();
export const DEFAULT_MANIFEST_PATH = 'assets-src/collectibles.manifest.json';

export const parseArgs = (argv) => {
  const args = new Map();
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token?.startsWith('--')) continue;
    const key = token.slice(2);
    const next = argv[index + 1];
    if (next && !next.startsWith('--')) {
      args.set(key, next);
      index += 1;
    } else {
      args.set(key, true);
    }
  }
  return args;
};

export const resolveRepoPath = (value) => path.resolve(ROOT, value);

export const loadManifest = async (manifestPath = DEFAULT_MANIFEST_PATH) => {
  const raw = await fs.readFile(resolveRepoPath(manifestPath), 'utf8');
  const manifest = JSON.parse(raw);
  if (manifest?.version !== 1 || !Array.isArray(manifest.assets) || typeof manifest.defaults !== 'object') {
    throw new Error(`Invalid asset manifest: ${manifestPath}`);
  }
  return manifest;
};

export const selectEntries = (manifest, args) => {
  const family = args.get('family');
  const id = args.get('id');
  return manifest.assets.filter((entry) => (!family || entry.family === family) && (!id || entry.id === id));
};

const hasUsefulAlpha = async (input) => {
  const { data, info } = await sharp(input).rotate().ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const alphaIndex = info.channels - 1;
  let transparent = 0;
  for (let pixel = 0; pixel < info.width * info.height; pixel += 1) {
    if (data[pixel * info.channels + alphaIndex] < 250) transparent += 1;
  }
  return transparent / (info.width * info.height) > 0.005;
};

const maxRgbDifference = (data, channels, leftPixel, rightPixel) => {
  const left = leftPixel * channels;
  const right = rightPixel * channels;
  return Math.max(
    Math.abs(data[left] - data[right]),
    Math.abs(data[left + 1] - data[right + 1]),
    Math.abs(data[left + 2] - data[right + 2]),
  );
};

/**
 * Removes the kind of clean, smooth generated background used by the art workflow.
 * This is deliberately not a general-purpose segmentation model: it flood-fills
 * only border-connected low-gradient pixels, preserving isolated cream/white areas
 * inside the collectible. Safety bounds make bad masks fail loudly instead of
 * silently destroying an asset.
 */
export const removeBorderBackground = async (
  input,
  { stepTolerance = 18, edgeFeather = 0.8, foregroundMin = 0.04, foregroundMax = 0.9 } = {},
) => {
  const { data, info } = await sharp(input).rotate().ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const pixelCount = width * height;
  const alphaIndex = channels - 1;
  const background = new Uint8Array(pixelCount);
  const queued = new Uint8Array(pixelCount);
  const queue = new Int32Array(pixelCount);
  let head = 0;
  let tail = 0;

  const enqueue = (pixel) => {
    if (queued[pixel]) return;
    queued[pixel] = 1;
    queue[tail] = pixel;
    tail += 1;
  };

  for (let x = 0; x < width; x += 1) {
    enqueue(x);
    enqueue((height - 1) * width + x);
  }
  for (let y = 1; y < height - 1; y += 1) {
    enqueue(y * width);
    enqueue(y * width + width - 1);
  }

  const tryNeighbor = (from, to) => {
    if (to < 0 || to >= pixelCount || queued[to]) return;
    const alpha = data[to * channels + alphaIndex];
    if (alpha < 16 || maxRgbDifference(data, channels, from, to) <= stepTolerance) {
      enqueue(to);
    }
  };

  while (head < tail) {
    const pixel = queue[head];
    head += 1;
    background[pixel] = 1;
    const x = pixel % width;
    const y = Math.floor(pixel / width);
    if (x > 0) tryNeighbor(pixel, pixel - 1);
    if (x < width - 1) tryNeighbor(pixel, pixel + 1);
    if (y > 0) tryNeighbor(pixel, pixel - width);
    if (y < height - 1) tryNeighbor(pixel, pixel + width);
  }

  let foregroundPixels = 0;
  const mask = Buffer.alloc(pixelCount);
  for (let pixel = 0; pixel < pixelCount; pixel += 1) {
    if (!background[pixel]) {
      mask[pixel] = 255;
      foregroundPixels += 1;
    }
  }

  const foregroundRatio = foregroundPixels / pixelCount;
  if (foregroundRatio < foregroundMin || foregroundRatio > foregroundMax) {
    throw new Error(
      `Background removal produced unsafe foreground ratio ${(foregroundRatio * 100).toFixed(1)}%. ` +
        'Use a cleaner source, adjust manifest tolerance, or provide an already-transparent cutout.',
    );
  }

  // One-pixel dilation protects anti-aliased object edges from an over-eager flood fill.
  const dilated = Buffer.from(mask);
  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const pixel = y * width + x;
      if (mask[pixel] !== 255) continue;
      for (let dy = -1; dy <= 1; dy += 1) {
        for (let dx = -1; dx <= 1; dx += 1) {
          dilated[(y + dy) * width + x + dx] = 255;
        }
      }
    }
  }

  const feathered =
    edgeFeather > 0
      ? await sharp(dilated, { raw: { width, height, channels: 1 } }).blur(edgeFeather).raw().toBuffer()
      : dilated;

  const rgba = Buffer.from(data);
  for (let pixel = 0; pixel < pixelCount; pixel += 1) {
    const originalAlpha = data[pixel * channels + alphaIndex];
    rgba[pixel * channels + alphaIndex] = Math.min(originalAlpha, feathered[pixel]);
  }

  return sharp(rgba, { raw: { width, height, channels } }).png().toBuffer();
};

const normalizeToCanvas = async (input, { canvas, padding, offsetX = 0, offsetY = 0, webpQuality }) => {
  const trimmed = await sharp(input)
    .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 }, threshold: 8 })
    .png()
    .toBuffer();

  const inner = canvas - padding * 2;
  if (inner <= 0) throw new Error(`Invalid canvas/padding combination: ${canvas}/${padding}`);

  const resized = await sharp(trimmed)
    .resize({ width: inner, height: inner, fit: 'inside', withoutEnlargement: false })
    .png()
    .toBuffer({ resolveWithObject: true });

  const left = Math.round((canvas - resized.info.width) / 2 + offsetX);
  const top = Math.round((canvas - resized.info.height) / 2 + offsetY);
  if (left < 0 || top < 0 || left + resized.info.width > canvas || top + resized.info.height > canvas) {
    throw new Error('Configured visual offset pushes the collectible outside the output canvas');
  }

  return sharp({
    create: {
      width: canvas,
      height: canvas,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: resized.data, left, top }])
    .webp({ quality: webpQuality, alphaQuality: 100, effort: 6, smartSubsample: true })
    .toBuffer();
};

export const prepareCollectible = async (sourcePath, outputPath, options) => {
  const source = resolveRepoPath(sourcePath);
  const output = resolveRepoPath(outputPath);
  const sourceBuffer = await fs.readFile(source);
  const usefulAlpha = await hasUsefulAlpha(sourceBuffer);
  const cutout = options.removeBackground && !usefulAlpha
    ? await removeBorderBackground(sourceBuffer, {
        stepTolerance: options.backgroundStepTolerance,
        edgeFeather: options.edgeFeather,
      })
    : await sharp(sourceBuffer).rotate().ensureAlpha().png().toBuffer();

  const normalized = await normalizeToCanvas(cutout, options);
  await fs.mkdir(path.dirname(output), { recursive: true });
  await fs.writeFile(output, normalized);
  return { output, removedBackground: options.removeBackground && !usefulAlpha };
};

export const findAlphaBounds = async (filePath, threshold = 8) => {
  const { data, info } = await sharp(filePath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const alphaIndex = info.channels - 1;
  let minX = info.width;
  let minY = info.height;
  let maxX = -1;
  let maxY = -1;
  let transparent = 0;
  let solid = 0;

  for (let y = 0; y < info.height; y += 1) {
    for (let x = 0; x < info.width; x += 1) {
      const alpha = data[(y * info.width + x) * info.channels + alphaIndex];
      if (alpha < 250) transparent += 1;
      if (alpha >= 250) solid += 1;
      if (alpha <= threshold) continue;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }

  return {
    width: info.width,
    height: info.height,
    bounds: maxX >= 0 ? { minX, minY, maxX, maxY } : null,
    transparentRatio: transparent / (info.width * info.height),
    solidRatio: solid / (info.width * info.height),
  };
};

export const validateCollectible = async (
  filePath,
  { canvas = 1024, minTransparentPadding = 24, softSizeLimit = 500 * 1024 } = {},
) => {
  const absolute = resolveRepoPath(filePath);
  const metadata = await sharp(absolute).metadata();
  const alpha = await findAlphaBounds(absolute);
  const stat = await fs.stat(absolute);
  const errors = [];
  const warnings = [];

  if (metadata.format !== 'webp') errors.push(`expected WebP, got ${metadata.format ?? 'unknown'}`);
  if (metadata.width !== canvas || metadata.height !== canvas) {
    errors.push(`expected ${canvas}x${canvas}, got ${metadata.width}x${metadata.height}`);
  }
  if (!metadata.hasAlpha || alpha.transparentRatio < 0.01) errors.push('missing meaningful transparency');
  if (alpha.solidRatio < 0.02) errors.push('foreground is effectively empty');
  if (!alpha.bounds) {
    errors.push('no visible foreground pixels');
  } else {
    const padding = Math.min(
      alpha.bounds.minX,
      alpha.bounds.minY,
      canvas - 1 - alpha.bounds.maxX,
      canvas - 1 - alpha.bounds.maxY,
    );
    if (padding < minTransparentPadding) errors.push(`foreground padding is only ${padding}px`);
  }
  if (stat.size > softSizeLimit) warnings.push(`encoded size ${(stat.size / 1024).toFixed(0)} KB exceeds soft target`);

  return { errors, warnings, bytes: stat.size, alpha };
};

export const mergedOptions = (manifest, entry) => ({
  ...manifest.defaults,
  ...(entry.options ?? {}),
});
