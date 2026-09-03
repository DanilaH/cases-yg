import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { prepareCollectible, validateCollectible } from './shared.mjs';

const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'mpt-assets-ai-'));
const previousCwd = process.cwd();
const modelPath = path.resolve(previousCwd, '.asset-models/u2netp.onnx');

// Temporary low-resolution derivative of the accepted Noir-style source used only
// to verify the segmentation model against the actual generated-art domain.
const NOIR_FIXTURE_BASE64 = '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';

try {
  process.chdir(tempRoot);
  await fs.mkdir('raw', { recursive: true });
  await fs.writeFile('raw/phone.jpg', Buffer.from(NOIR_FIXTURE_BASE64, 'base64'));

  const result = await prepareCollectible('raw/phone.jpg', 'out/phone.webp', {
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
  assert.ok(validation.alpha.visibleRatio < 0.6, 'AI mask retained too much of the source background');

  const bounds = validation.alpha.bounds;
  assert.ok(bounds, 'AI mask produced no visible bounds');
  const visibleWidth = bounds.maxX - bounds.minX + 1;
  const visibleHeight = bounds.maxY - bounds.minY + 1;
  console.log(
    `[assets] AI Noir fixture geometry: visible=${validation.alpha.visibleRatio.toFixed(3)} ` +
      `bounds=${visibleWidth}x${visibleHeight} aspect=${(visibleHeight / visibleWidth).toFixed(3)}`,
  );
  assert.ok(visibleHeight / visibleWidth > 1.2, 'AI mask lost the expected tall Noir phone silhouette');

  console.log('[assets] AI cutout Noir-domain check passed');
} finally {
  process.chdir(previousCwd);
  await fs.rm(tempRoot, { recursive: true, force: true });
}
