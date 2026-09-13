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
  'package/analog-nights-charged-pouch-body.webp',
  'package/analog-nights-charged-pouch-tear-strip-compact.webp',
  'package/analog-nights-charged-pouch-star-tab.webp',
  'collectibles/flip-phone-common.webp',
  'collectibles/flip-phone-rare.webp',
  'collectibles/flip-phone-epic.webp',
  'collectibles/flip-phone-legendary.webp',
  'collectibles/flip-phone-secret-noir.webp',
  'collectibles/camera-legendary.webp',
  'collectibles/camera-secret-cosmic.webp',
  'collectibles/handheld-console-epic.webp',
  'collectibles/handheld-console-legendary.webp',
  'collectibles/mp3-player-legendary.webp',
  'collectibles/mp3-player-secret-pearl.webp',
  'collectibles/pager-legendary.webp',
  'collectibles/pager-secret-flip.webp',
  'collectibles/portable-radio-legendary.webp',
];

for (const relative of files) {
  const source = path.join(assets, relative);
  const target = path.join(out, relative);
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.copyFile(source, target);
}

console.log(`Exported ${files.length} source assets to ${out}`);
