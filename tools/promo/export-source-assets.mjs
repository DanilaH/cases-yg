import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const assets = path.join(root, 'public', 'assets');
const out = path.join(root, 'promo-output', 'source-assets');

const files = [
  'backgrounds/opening-bg.webp',
  'package/airwaves-basic-pouch-body.webp',
  'package/airwaves-basic-pouch-tear-strip-compact.webp',
  'package/airwaves-basic-pouch-star-tab.webp',
  'collectibles/walkie-talkie-secret-field-radio.webp',
  'collectibles/camera-secret-cosmic.webp',
  'collectibles/handheld-console-legendary.webp',
  'collectibles/flip-phone-secret-noir.webp',
  'collectibles/portable-radio-legendary.webp',
];

for (const relative of files) {
  const source = path.join(assets, relative);
  const target = path.join(out, relative);
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.copyFile(source, target);
}

console.log(`Exported ${files.length} source assets to ${out}`);
