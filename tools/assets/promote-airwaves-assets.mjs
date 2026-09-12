import fs from 'node:fs/promises';
import path from 'node:path';

import sharp from 'sharp';

// One-time source promotion for the reviewed Radio + Walkie-Talkie Drop art.
const root = process.cwd();
const resolve = (value) => path.resolve(root, value);

const collectibles = [
  ['biba/ChatGPT Image Sep 12, 2026, 03_38_12 PM.png', 'public/assets/collectibles/portable-radio-common.webp'],
  ['biba/ChatGPT Image Sep 12, 2026, 03_38_15 PM.png', 'public/assets/collectibles/portable-radio-rare.webp'],
  ['biba/ChatGPT Image Sep 12, 2026, 03_38_54 PM.png', 'public/assets/collectibles/portable-radio-epic.webp'],
  ['biba/ChatGPT Image Sep 12, 2026, 03_38_47 PM.png', 'public/assets/collectibles/portable-radio-legendary.webp'],
  ['biba/ChatGPT Image Sep 12, 2026, 03_38_58 PM.png', 'public/assets/collectibles/portable-radio-secret-shortwave.webp'],
  ['biba/ChatGPT Image Sep 12, 2026, 05_08_15 PM (1).png', 'public/assets/collectibles/walkie-talkie-common.webp'],
  ['biba/ChatGPT Image Sep 12, 2026, 05_08_22 PM (2).png', 'public/assets/collectibles/walkie-talkie-rare.webp'],
  ['biba/ChatGPT Image Sep 12, 2026, 05_08_24 PM (3).png', 'public/assets/collectibles/walkie-talkie-epic.webp'],
  ['biba/ChatGPT Image Sep 12, 2026, 05_08_24 PM (4).png', 'public/assets/collectibles/walkie-talkie-legendary.webp'],
  ['biba/ChatGPT Image Sep 12, 2026, 05_08_24 PM (5).png', 'public/assets/collectibles/walkie-talkie-secret-field-radio.webp'],
];

const pouches = [
  ['public/assets/package/ChatGPT Image Sep 12, 2026, 05_30_15 PM (1).png', 'public/assets/package/airwaves-basic-pouch-body.webp', 'body'],
  ['public/assets/package/ChatGPT Image Sep 12, 2026, 05_30_16 PM (2).png', 'public/assets/package/airwaves-basic-pouch-star-tab.webp', 'star'],
  ['public/assets/package/ChatGPT Image Sep 12, 2026, 05_30_16 PM (3).png', 'public/assets/package/airwaves-basic-pouch-tear-strip-compact.webp', 'strip'],
  ['public/assets/package/ChatGPT Image Sep 12, 2026, 05_30_16 PM (4).png', 'public/assets/package/airwaves-charged-pouch-body.webp', 'body'],
  ['public/assets/package/ChatGPT Image Sep 12, 2026, 05_30_17 PM (5).png', 'public/assets/package/airwaves-charged-pouch-star-tab.webp', 'star'],
  ['public/assets/package/ChatGPT Image Sep 12, 2026, 05_30_17 PM (6).png', 'public/assets/package/airwaves-charged-pouch-tear-strip-compact.webp', 'strip'],
];

const webp = { quality: 90, alphaQuality: 100, effort: 4 };

const prepareCollectible = async (source, output) => {
  await fs.mkdir(path.dirname(resolve(output)), { recursive: true });
  await sharp(resolve(source))
    .trim()
    .resize(896, 896, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .extend({
      top: 64,
      bottom: 64,
      left: 64,
      right: 64,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .webp(webp)
    .toFile(resolve(output));
};

const preparePouch = async (source, output, kind) => {
  await fs.mkdir(path.dirname(resolve(output)), { recursive: true });
  let pipeline = sharp(resolve(source)).trim();

  if (kind === 'body') {
    pipeline = pipeline
      .resize(923, 959, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .extend({ top: 28, bottom: 37, left: 68, right: 33, background: { r: 0, g: 0, b: 0, alpha: 0 } });
  } else if (kind === 'star') {
    pipeline = pipeline
      .resize(271, 259, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .extend({ top: 15, bottom: 750, left: 33, right: 720, background: { r: 0, g: 0, b: 0, alpha: 0 } });
  } else {
    pipeline = pipeline.resize(984, 235, { fit: 'fill' });
  }

  await pipeline.webp(webp).toFile(resolve(output));
};

for (const [source, output] of collectibles) {
  await prepareCollectible(source, output);
  console.log(`[airwaves] collectible ${output}`);
}
for (const [source, output, kind] of pouches) {
  await preparePouch(source, output, kind);
  console.log(`[airwaves] pouch ${output}`);
}
