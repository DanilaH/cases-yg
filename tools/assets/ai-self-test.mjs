import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import sharp from 'sharp';

import { prepareCollectible, validateCollectible } from './shared.mjs';

const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'mpt-assets-ai-'));
const previousCwd = process.cwd();
const modelPath = path.resolve(previousCwd, '.asset-models/u2netp.onnx');

try {
  process.chdir(tempRoot);
  await fs.mkdir('raw', { recursive: true });

  // The AI smoke test verifies model download/runtime/inference and rejects
  // all-empty/all-background masks. Semantic cutout quality remains a visual QA
  // gate on real generated art; a synthetic SVG is intentionally not used as a
  // golden segmentation fixture.
  const svg = Buffer.from(`
    <svg width="640" height="640" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stop-color="#ffe6bd"/>
          <stop offset="1" stop-color="#f2cfa7"/>
        </linearGradient>
        <filter id="shadow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="16"/>
        </filter>
      </defs>
      <rect width="640" height="640" fill="url(#bg)"/>
      <ellipse cx="330" cy="544" rx="154" ry="28" fill="#8b6048" opacity="0.28" filter="url(#shadow)"/>
      <rect x="205" y="72" width="230" height="490" rx="62" fill="#17181d" stroke="#f1f2f5" stroke-width="12"/>
      <rect x="242" y="122" width="156" height="176" rx="26" fill="#313842"/>
      <circle cx="320" cy="375" r="54" fill="#d7d9dc" stroke="#63666d" stroke-width="12"/>
      <circle cx="320" cy="375" r="20" fill="#17181d"/>
      <rect x="252" y="457" width="136" height="52" rx="18" fill="#53565d"/>
    </svg>
  `);
  await sharp(svg).png().toFile('raw/phone.png');

  const result = await prepareCollectible('raw/phone.png', 'out/phone.webp', {
    canvas: 256,
    padding: 24,
    webpQuality: 88,
    backgroundRemoval: 'ai',
    aiModelPath: modelPath,
    aiMaskLow: 0.015,
    aiMaskHigh: 0.985,
    aiMaskGamma: 1,
    aiEdgeFeather: 0,
  });
  assert.equal(result.backgroundMethod, 'ai-u2netp');

  const validation = await validateCollectible('out/phone.webp', {
    canvas: 256,
    minTransparentPadding: 8,
    softSizeLimit: 500 * 1024,
  });
  assert.deepEqual(validation.errors, []);
  assert.ok(validation.alpha.transparentRatio > 0.1);
  assert.ok(validation.alpha.visibleRatio > 0.05);
  assert.ok(validation.alpha.visibleRatio < 0.55, 'AI mask retained implausibly much of the source');

  console.log(
    `[assets] AI smoke test passed (visible=${validation.alpha.visibleRatio.toFixed(3)}, ` +
      `transparent=${validation.alpha.transparentRatio.toFixed(3)})`,
  );
} finally {
  process.chdir(previousCwd);
  await fs.rm(tempRoot, { recursive: true, force: true });
}
