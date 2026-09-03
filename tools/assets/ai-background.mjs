import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

import sharp from 'sharp';

export const U2NETP_MODEL = Object.freeze({
  path: '.asset-models/u2netp.onnx',
  url: 'https://huggingface.co/edgetools/u2netp/resolve/main/u2netp.onnx?download=true',
  bytes: 4_574_861,
  sha256: '309c8469258dda742793dce0ebea8e6dd393174f89934733ecc8b14c76f4ddd8',
  resolution: 320,
});

const MEAN = [0.485, 0.456, 0.406];
const STD = [0.229, 0.224, 0.225];
const sessionCache = new Map();

const resolvePath = (value) => path.resolve(process.cwd(), value);

const sha256Buffer = (buffer) => crypto.createHash('sha256').update(buffer).digest('hex');

const verifyModelBuffer = (buffer) => {
  if (buffer.byteLength !== U2NETP_MODEL.bytes) {
    throw new Error(`U2NetP model size mismatch: expected ${U2NETP_MODEL.bytes}, got ${buffer.byteLength}`);
  }
  const digest = sha256Buffer(buffer);
  if (digest !== U2NETP_MODEL.sha256) {
    throw new Error(`U2NetP model SHA-256 mismatch: expected ${U2NETP_MODEL.sha256}, got ${digest}`);
  }
};

export const ensureU2NetpModel = async ({ force = false, modelPath = U2NETP_MODEL.path } = {}) => {
  const absolute = resolvePath(modelPath);

  if (!force) {
    try {
      const existing = await fs.readFile(absolute);
      verifyModelBuffer(existing);
      return absolute;
    } catch (error) {
      if (error?.code !== 'ENOENT') {
        throw error;
      }
    }
  }

  const response = await fetch(U2NETP_MODEL.url, { redirect: 'follow' });
  if (!response.ok) {
    throw new Error(`Failed to download U2NetP model: HTTP ${response.status}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  verifyModelBuffer(buffer);
  await fs.mkdir(path.dirname(absolute), { recursive: true });
  const temporary = `${absolute}.${process.pid}.tmp`;
  await fs.writeFile(temporary, buffer);
  await fs.rename(temporary, absolute);
  return absolute;
};

const loadRuntime = async () => {
  try {
    return await import('onnxruntime-node');
  } catch (error) {
    throw new Error(
      'AI background removal requires the optional onnxruntime-node dependency. Run `npm install` without `--omit=optional`.',
      { cause: error },
    );
  }
};

const getSession = async (modelPath) => {
  const absolute = resolvePath(modelPath);
  const cached = sessionCache.get(absolute);
  if (cached) return cached;

  const promise = (async () => {
    const ort = await loadRuntime();
    const verifiedPath = await ensureU2NetpModel({ modelPath });
    const session = await ort.InferenceSession.create(verifiedPath);
    return { ort, session };
  })();

  sessionCache.set(absolute, promise);
  try {
    return await promise;
  } catch (error) {
    sessionCache.delete(absolute);
    throw error;
  }
};

const createInputTensor = async (ort, input, resolution) => {
  const { data, info } = await sharp(input)
    .rotate()
    .removeAlpha()
    .toColourspace('srgb')
    .resize(resolution, resolution, { fit: 'fill' })
    .raw()
    .toBuffer({ resolveWithObject: true });

  if (info.channels !== 3) {
    throw new Error(`U2NetP preprocessing expected 3 RGB channels, got ${info.channels}`);
  }

  let max = 0;
  for (const value of data) max = Math.max(max, value);
  const divisor = Math.max(max, 1);
  const plane = resolution * resolution;
  const tensor = new Float32Array(3 * plane);

  for (let y = 0; y < resolution; y += 1) {
    for (let x = 0; x < resolution; x += 1) {
      const pixel = (y * resolution + x) * 3;
      const target = y * resolution + x;
      for (let channel = 0; channel < 3; channel += 1) {
        const scaled = data[pixel + channel] / divisor;
        tensor[channel * plane + target] = (scaled - MEAN[channel]) / STD[channel];
      }
    }
  }

  return new ort.Tensor('float32', tensor, [1, 3, resolution, resolution]);
};

const normalizeMask = (prediction, { low = 0, high = 1, gamma = 1 } = {}) => {
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  for (const raw of prediction) {
    const value = Number(raw);
    min = Math.min(min, value);
    max = Math.max(max, value);
  }

  const range = max - min;
  if (!Number.isFinite(range) || range < 1e-8) {
    throw new Error('U2NetP produced an unusable flat segmentation mask');
  }

  const lowClamped = Math.max(0, Math.min(0.95, low));
  const highClamped = Math.max(lowClamped + 0.01, Math.min(1, high));
  const gammaSafe = Math.max(0.1, gamma);
  const output = Buffer.alloc(prediction.length);

  for (let index = 0; index < prediction.length; index += 1) {
    const normalized = (Number(prediction[index]) - min) / range;
    const leveled = Math.max(0, Math.min(1, (normalized - lowClamped) / (highClamped - lowClamped)));
    output[index] = Math.round(Math.pow(leveled, gammaSafe) * 255);
  }

  return output;
};

export const removeBackgroundWithU2Netp = async (
  input,
  {
    modelPath = U2NETP_MODEL.path,
    maskLow = 0.015,
    maskHigh = 0.985,
    maskGamma = 1,
    edgeFeather = 0,
  } = {},
) => {
  const source = await sharp(input).rotate().png().toBuffer();
  const metadata = await sharp(source).metadata();
  if (!metadata.width || !metadata.height) {
    throw new Error('Unable to read source dimensions for AI background removal');
  }

  const { ort, session } = await getSession(modelPath);
  const inputTensor = await createInputTensor(ort, source, U2NETP_MODEL.resolution);

  let results;
  try {
    const inputName = session.inputNames[0];
    if (!inputName) throw new Error('U2NetP session exposes no input tensor');
    results = await session.run({ [inputName]: inputTensor });
  } finally {
    inputTensor.dispose?.();
  }

  const outputName = session.outputNames[0];
  const prediction = outputName ? results[outputName] : undefined;
  if (!prediction || prediction.dims.length < 2) {
    throw new Error('U2NetP session exposes no usable output tensor');
  }

  const dims = prediction.dims;
  const maskWidth = Number(dims[dims.length - 1]);
  const maskHeight = Number(dims[dims.length - 2]);
  if (!maskWidth || !maskHeight || prediction.data.length < maskWidth * maskHeight) {
    throw new Error(`Unexpected U2NetP output shape: ${dims.join('x')}`);
  }

  const mask = normalizeMask(prediction.data.slice(0, maskWidth * maskHeight), {
    low: maskLow,
    high: maskHigh,
    gamma: maskGamma,
  });

  let alphaPipeline = sharp(mask, { raw: { width: maskWidth, height: maskHeight, channels: 1 } }).resize(
    metadata.width,
    metadata.height,
    { fit: 'fill' },
  );
  if (edgeFeather > 0) alphaPipeline = alphaPipeline.blur(edgeFeather);
  const alpha = await alphaPipeline.raw().toBuffer();

  const rgb = await sharp(source).removeAlpha().toColourspace('srgb').raw().toBuffer();
  const rgba = Buffer.alloc(metadata.width * metadata.height * 4);
  for (let pixel = 0; pixel < metadata.width * metadata.height; pixel += 1) {
    rgba[pixel * 4] = rgb[pixel * 3];
    rgba[pixel * 4 + 1] = rgb[pixel * 3 + 1];
    rgba[pixel * 4 + 2] = rgb[pixel * 3 + 2];
    rgba[pixel * 4 + 3] = alpha[pixel];
  }

  return sharp(rgba, {
    raw: { width: metadata.width, height: metadata.height, channels: 4 },
  })
    .png()
    .toBuffer();
};
