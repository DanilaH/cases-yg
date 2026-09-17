import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = process.cwd();
const ASSETS = path.join(ROOT, 'public', 'assets');
const OUT = path.join(ROOT, 'promo-output');

const openingBg = path.join(ASSETS, 'backgrounds', 'opening-bg.webp');
const secretHero = path.join(ASSETS, 'collectibles', 'walkie-talkie-secret-field-radio.webp');

await fs.mkdir(OUT, { recursive: true });

const svg = (width, height, body) => Buffer.from(
  `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">${body}</svg>`,
);

const rgbaOverlay = (width, height, opacity) =>
  svg(width, height, `<rect width="100%" height="100%" fill="#100d18" fill-opacity="${opacity}"/>`);

const accentGlow = (width, height, x, y, rx, ry, strength = 0.16) => svg(width, height, `
  <defs>
    <radialGradient id="g">
      <stop offset="0" stop-color="#8df8ff" stop-opacity="${strength}"/>
      <stop offset="0.56" stop-color="#a968dc" stop-opacity="0.065"/>
      <stop offset="1" stop-color="#171421" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="url(#g)"/>
`);

const contactShadow = (width, height, x, y, rx, ry, opacity = 0.24) => svg(width, height, `
  <defs><filter id="blur"><feGaussianBlur stdDeviation="14"/></filter></defs>
  <ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="#09070d" fill-opacity="${opacity}" filter="url(#blur)"/>
`);

const titleSvg = () => svg(340, 190, `
  <style>
    .title { font-family: "DejaVu Sans Mono", "Liberation Mono", monospace; font-weight: 800; fill: #f7f2ff; letter-spacing: 1.8px; }
    .micro { font-family: "DejaVu Sans Mono", "Liberation Mono", monospace; font-weight: 700; fill: #8df8ff; letter-spacing: 2.2px; }
  </style>
  <text x="0" y="26" class="micro" font-size="12">MYSTERY // TECH</text>
  <rect x="0" y="41" width="39" height="3" rx="1.5" fill="#8df8ff" fill-opacity="0.82"/>
  <text x="0" y="92" class="title" font-size="46">MYSTERY</text>
  <text x="0" y="143" class="title" font-size="42">POCKET TECH</text>
`);

const cornerMarks = () => svg(800, 470, `
  <g fill="none" stroke="#e7dff1" stroke-opacity="0.16" stroke-width="1.1">
    <path d="M28 52V28H52"/><path d="M748 28H772V52"/>
    <path d="M28 418V442H52"/><path d="M748 442H772V418"/>
  </g>
`);

const prepareLayer = async (file, displayWidth) => {
  const meta = await sharp(file).metadata();
  const width = Math.round(displayWidth);
  const height = Math.max(1, Math.round((meta.height / meta.width) * width));
  return {
    input: await sharp(file).resize({ width }).png().toBuffer(),
    width,
    height,
  };
};

const variantConfig = {
  basic: {
    body: path.join(ASSETS, 'package', 'airwaves-basic-pouch-body.webp'),
    strip: path.join(ASSETS, 'package', 'airwaves-basic-pouch-tear-strip-compact.webp'),
    star: path.join(ASSETS, 'package', 'airwaves-basic-pouch-star-tab.webp'),
    bodyWidth: 400, // 420 - themed Basic optical correction(20)
    bodyX: -6,
    bodyY: 92,
    stripWidth: 352,
  },
  charged: {
    body: path.join(ASSETS, 'package', 'airwaves-charged-pouch-body.webp'),
    strip: path.join(ASSETS, 'package', 'airwaves-charged-pouch-tear-strip-compact.webp'),
    star: path.join(ASSETS, 'package', 'airwaves-charged-pouch-star-tab.webp'),
    bodyWidth: 413,
    bodyX: -7,
    bodyY: 96,
    stripWidth: 364,
  },
};

const buildPouch = async (variant, openingProgress = 0) => {
  // Reconstruct authored pouch layers using the same optical presentation values
  // as runtime. `openingProgress` only offsets the removable strip/star to freeze
  // a plausible opening moment; no pixels are invented or repainted.
  const cfg = variantConfig[variant];
  const W = 560;
  const H = 540;
  const ox = 280;
  const oy = 170;

  const body = await prepareLayer(cfg.body, cfg.bodyWidth);
  const strip = await prepareLayer(cfg.strip, cfg.stripWidth);
  const star = await prepareLayer(cfg.star, 286);

  const stripShiftX = Math.round(118 * openingProgress);
  const stripShiftY = Math.round(-14 * openingProgress);
  const starShiftX = Math.round(170 * openingProgress);
  const starShiftY = Math.round(-8 * openingProgress);

  const place = (layer, cx, cy) => ({
    input: layer.input,
    left: Math.round(cx - layer.width / 2),
    top: Math.round(cy - layer.height / 2),
  });

  return sharp({ create: { width: W, height: H, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([
      place(body, ox + cfg.bodyX, oy + cfg.bodyY),
      place(strip, ox + stripShiftX, oy - 108 + stripShiftY),
      place(star, ox - 62 + starShiftX, oy + 20 + starShiftY),
    ])
    .png()
    .toBuffer();
};

const buildCover = async ({ variant, fileName }) => {
  const bg = await sharp(openingBg)
    .resize(800, 470, { fit: 'cover', position: 'centre' })
    .blur(0.7)
    .png()
    .toBuffer();

  const hero = await prepareLayer(secretHero, 335);
  const pouch = await buildPouch(variant, 0.55);
  const pouchScaled = await sharp(pouch).resize({ width: 452 }).png().toBuffer();

  const out = await sharp(bg)
    .composite([
      { input: rgbaOverlay(800, 470, variant === 'charged' ? 0.34 : 0.30), left: 0, top: 0 },
      { input: accentGlow(800, 470, 620, 184, 288, 238, variant === 'charged' ? 0.14 : 0.11), left: 0, top: 0 },
      { input: contactShadow(800, 470, 610, 436, 176, 22, 0.24), left: 0, top: 0 },
      // Hero first, pouch second: the lower device is occluded by the real pouch art,
      // reading as a collectible emerging from inside the package.
      { input: hero.input, left: 475, top: -28 },
      { input: pouchScaled, left: 370, top: 92 },
      { input: titleSvg(), left: 54, top: 77 },
      { input: cornerMarks(), left: 0, top: 0 },
    ])
    .png()
    .toBuffer();

  await fs.writeFile(path.join(OUT, fileName), out);
  return out;
};

const basicCover = await buildCover({
  variant: 'basic',
  fileName: 'yandex-cover-800x470-basic.png',
});

const chargedCover = await buildCover({
  variant: 'charged',
  fileName: 'yandex-cover-800x470-charged.png',
});

const buildIcon = async ({ variant, fileName, openingProgress }) => {
  const bg = await sharp(openingBg)
    .resize(512, 512, { fit: 'cover', position: 'centre' })
    .blur(0.75)
    .png()
    .toBuffer();

  const hero = await prepareLayer(secretHero, 372);
  const pouch = await buildPouch(variant, openingProgress);
  const pouchScaled = await sharp(pouch).resize({ width: 492 }).png().toBuffer();

  const icon = await sharp(bg)
    .composite([
      { input: rgbaOverlay(512, 512, variant === 'charged' ? 0.28 : 0.25), left: 0, top: 0 },
      { input: accentGlow(512, 512, 265, 207, 278, 246, variant === 'charged' ? 0.13 : 0.09), left: 0, top: 0 },
      { input: contactShadow(512, 512, 260, 485, 184, 18, 0.23), left: 0, top: 0 },
      { input: hero.input, left: 70, top: -20 },
      { input: pouchScaled, left: 10, top: 135 },
    ])
    .png()
    .toBuffer();

  await fs.writeFile(path.join(OUT, fileName), icon);
  return icon;
};

const basicIcon = await buildIcon({
  variant: 'basic',
  fileName: 'yandex-icon-512x512-basic.png',
  openingProgress: 0.22,
});

const chargedIcon = await buildIcon({
  variant: 'charged',
  fileName: 'yandex-icon-512x512-charged.png',
  openingProgress: 0.22,
});

await fs.writeFile(path.join(OUT, 'yandex-icon-128-preview.png'), await sharp(basicIcon).resize(128, 128).png().toBuffer());
await fs.writeFile(path.join(OUT, 'yandex-icon-64-preview.png'), await sharp(basicIcon).resize(64, 64).png().toBuffer());

const review = async () => {
  const coverA = await sharp(basicCover).resize({ width: 620 }).png().toBuffer();
  const coverB = await sharp(chargedCover).resize({ width: 620 }).png().toBuffer();
  const iconA = await sharp(basicIcon).resize(260, 260).png().toBuffer();
  const iconB = await sharp(chargedIcon).resize(260, 260).png().toBuffer();
  const label = svg(1320, 80, `<text x="0" y="45" font-family="DejaVu Sans Mono, monospace" font-size="24" font-weight="700" fill="#f5effc">MYSTERY POCKET TECH // STORE ART // AUTHORED GAME ASSETS ONLY</text>`);
  const tags = svg(1320, 80, `
    <text x="0" y="32" font-family="DejaVu Sans Mono, monospace" font-size="17" font-weight="700" fill="#8df8ff">BASIC — PRIMARY</text>
    <text x="660" y="32" font-family="DejaVu Sans Mono, monospace" font-size="17" font-weight="700" fill="#8df8ff">CHARGED — ALTERNATE</text>
  `);

  await sharp({ create: { width: 1320, height: 850, channels: 4, background: '#171421' } })
    .composite([
      { input: label, left: 40, top: 20 },
      { input: tags, left: 40, top: 78 },
      { input: coverA, left: 40, top: 125 },
      { input: coverB, left: 660, top: 125 },
      { input: iconA, left: 220, top: 530 },
      { input: iconB, left: 840, top: 530 },
    ])
    .png()
    .toFile(path.join(OUT, 'review-sheet.png'));
};

await review();
console.log(`Built store assets in ${OUT}`);
