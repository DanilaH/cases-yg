import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import sharp from 'sharp';

import { buildAtlasFiles } from './build-atlas.mjs';
import { prepareCollectible, validateCollectible } from './shared.mjs';

const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'mpt-assets-'));
const previousCwd = process.cwd();

try {
  process.chdir(tempRoot);
  await fs.mkdir('raw', { recursive: true });

  const makeSource = async (filename, bodyColor) => {
    const svg = Buffer.from(`
      <svg width="640" height="640" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stop-color="#f8e6c7"/>
            <stop offset="1" stop-color="#efd0a4"/>
          </linearGradient>
        </defs>
        <rect width="640" height="640" fill="url(#bg)"/>
        <rect x="210" y="70" width="220" height="500" rx="64" fill="${bodyColor}" stroke="#54253d" stroke-width="12"/>
        <rect x="245" y="140" width="150" height="150" rx="24" fill="#242631"/>
        <circle cx="320" cy="370" r="46" fill="#f7eef1" stroke="#54253d" stroke-width="10"/>
        <circle cx="320" cy="370" r="18" fill="${bodyColor}"/>
      </svg>
    `);
    await sharp(svg).png().toFile(`raw/${filename}`);
  };

  await makeSource('one.png', '#e93f8d');
  await makeSource('two.png', '#6bc7ba');

  const commonOptions = {
    canvas: 256,
    padding: 24,
    webpQuality: 88,
    removeBackground: true,
    backgroundStepTolerance: 18,
    edgeFeather: 0.8,
  };

  await prepareCollectible('raw/one.png', 'out/one.webp', commonOptions);
  await prepareCollectible('raw/two.png', 'out/two.webp', commonOptions);

  const validation = await validateCollectible('out/one.webp', {
    canvas: 256,
    minTransparentPadding: 8,
    softSizeLimit: 500 * 1024,
  });
  assert.deepEqual(validation.errors, []);
  assert.ok(validation.alpha.transparentRatio > 0.1);
  assert.ok(validation.alpha.solidRatio > 0.05);

  const files = await buildAtlasFiles(
    [
      { id: 'one', output: 'out/one.webp' },
      { id: 'two', output: 'out/two.webp' },
    ],
    'self-test',
  );
  const image = files.find((file) => file.name.endsWith('.webp'));
  const json = files.find((file) => file.name.endsWith('.json'));
  assert.ok(image, 'atlas WebP was not generated');
  assert.ok(json, 'atlas JSON was not generated');
  const parsed = JSON.parse(json.buffer.toString('utf8'));
  assert.ok(parsed, 'atlas JSON is invalid');

  console.log('[assets] self-test passed');
} finally {
  process.chdir(previousCwd);
  await fs.rm(tempRoot, { recursive: true, force: true });
}
