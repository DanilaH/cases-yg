import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = process.cwd();
const ASSETS = path.join(ROOT, 'public', 'assets');
const OUT = path.join(ROOT, 'promo-output');

const openingBg = path.join(ASSETS, 'backgrounds', 'opening-bg.webp');
const pouchBody = path.join(ASSETS, 'package', 'airwaves-charged-pouch-body.webp');
const pouchStrip = path.join(ASSETS, 'package', 'airwaves-charged-pouch-tear-strip-compact.webp');
const pouchStar = path.join(ASSETS, 'package', 'airwaves-charged-pouch-star-tab.webp');
const secretHero = path.join(ASSETS, 'collectibles', 'walkie-talkie-secret-field-radio.webp');
const legendaryHero = path.join(ASSETS, 'collectibles', 'walkie-talkie-legendary.webp');

await fs.mkdir(OUT, { recursive: true });

const escapeXml = (value) => value.replace(/[&<>\"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[char]);

const svg = (width, height, body) => Buffer.from(
  `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">${body}</svg>`,
);

const rgbaOverlay = (width, height, opacity) => svg(width, height, `<rect width="100%" height="100%" fill="#100d18" fill-opacity="${opacity}"/>`);

const accentGlow = (width, height, x, y, rx, ry) => svg(width, height, `
  <defs>
    <radialGradient id="g">
      <stop offset="0" stop-color="#7ee9ff" stop-opacity="0.20"/>
      <stop offset="0.55" stop-color="#a968dc" stop-opacity="0.075"/>
      <stop offset="1" stop-color="#171421" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="url(#g)"/>
`);

const titleSvg = () => svg(330, 190, `
  <style>
    .title { font-family: "DejaVu Sans Mono", "Liberation Mono", monospace; font-weight: 800; fill: #f5effc; letter-spacing: 2px; }
    .micro { font-family: "DejaVu Sans Mono", "Liberation Mono", monospace; font-weight: 700; fill: #8df8ff; letter-spacing: 2.4px; }
  </style>
  <text x="0" y="28" class="micro" font-size="13">MYSTERY // TECH</text>
  <rect x="0" y="44" width="44" height="3" rx="1.5" fill="#8df8ff" fill-opacity="0.85"/>
  <text x="0" y="93" class="title" font-size="46">MYSTERY</text>
  <text x="0" y="144" class="title" font-size="43">POCKET TECH</text>
`);

const cornerMarks = () => svg(800, 470, `
  <g fill="none" stroke="#d8cce8" stroke-opacity="0.22" stroke-width="1.2">
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

const withShadow = async (input, opacity = 0.34, sigma = 11) => {
  const image = sharp(input).ensureAlpha();
  const meta = await image.metadata();
  const alpha = await image.extractChannel('alpha').blur(sigma).toBuffer();
  const shadow = await sharp({ create: { width: meta.width, height: meta.height, channels: 4, background: { r: 7, g: 6, b: 12, alpha: 0 } } })
    .joinChannel(alpha)
    .removeAlpha()
    .ensureAlpha(opacity)
    .png()
    .toBuffer();
  return shadow;
};

const buildPouch = async () => {
  // Reconstruct the real Airwaves Charged pouch using the exact runtime presentation values.
  // Runtime logical origin is mapped to (270, 160) inside this transparent staging canvas.
  const W = 540;
  const H = 520;
  const ox = 270;
  const oy = 160;

  const body = await prepareLayer(pouchBody, 413);      // 420 + charged(-7)
  const strip = await prepareLayer(pouchStrip, 364);   // 360 + charged(+4)
  const star = await prepareLayer(pouchStar, 286);

  const place = (layer, cx, cy) => ({
    input: layer.input,
    left: Math.round(cx - layer.width / 2),
    top: Math.round(cy - layer.height / 2),
  });

  return sharp({ create: { width: W, height: H, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([
      place(body, ox - 7, oy + 96),
      place(strip, ox, oy - 108),
      place(star, ox - 62, oy + 20),
    ])
    .png()
    .toBuffer();
};

const pouch = await buildPouch();

const buildCover = async ({ heroPath, fileName, heroWidth = 306, heroLeft = 492, heroTop = 18 }) => {
  const bg = await sharp(openingBg)
    .resize(800, 470, { fit: 'cover', position: 'centre' })
    .blur(1.1)
    .png()
    .toBuffer();

  const hero = await prepareLayer(heroPath, heroWidth);
  const heroShadow = await withShadow(hero.input, 0.28, 12);
  const pouchScaled = await sharp(pouch).resize({ width: 438 }).png().toBuffer();
  const pouchMeta = await sharp(pouchScaled).metadata();
  const pouchShadow = await withShadow(pouchScaled, 0.26, 13);

  const heroShadowPos = { input: heroShadow, left: heroLeft + 9, top: heroTop + 14, blend: 'over' };
  const heroPos = { input: hero.input, left: heroLeft, top: heroTop, blend: 'over' };
  const pouchLeft = 385;
  const pouchTop = 91;

  const out = await sharp(bg)
    .composite([
      { input: rgbaOverlay(800, 470, 0.40), left: 0, top: 0 },
      { input: accentGlow(800, 470, 612, 181, 300, 255), left: 0, top: 0 },
      heroShadowPos,
      heroPos,
      { input: pouchShadow, left: pouchLeft + 10, top: pouchTop + 15 },
      { input: pouchScaled, left: pouchLeft, top: pouchTop },
      { input: titleSvg(), left: 54, top: 78 },
      { input: cornerMarks(), left: 0, top: 0 },
    ])
    .png()
    .toBuffer();

  await fs.writeFile(path.join(OUT, fileName), out);
  return out;
};

const primaryCover = await buildCover({
  heroPath: secretHero,
  fileName: 'yandex-cover-800x470-secret.png',
  heroWidth: 308,
  heroLeft: 488,
  heroTop: 10,
});

await buildCover({
  heroPath: legendaryHero,
  fileName: 'yandex-cover-800x470-legendary.png',
  heroWidth: 304,
  heroLeft: 494,
  heroTop: 14,
});

const buildIcon = async () => {
  const bg = await sharp(openingBg)
    .resize(512, 512, { fit: 'cover', position: 'centre' })
    .blur(1.1)
    .png()
    .toBuffer();

  const hero = await prepareLayer(secretHero, 344);
  const heroShadow = await withShadow(hero.input, 0.30, 14);
  const pouchScaled = await sharp(pouch).resize({ width: 468 }).png().toBuffer();
  const pouchShadow = await withShadow(pouchScaled, 0.28, 14);

  const icon = await sharp(bg)
    .composite([
      { input: rgbaOverlay(512, 512, 0.34), left: 0, top: 0 },
      { input: accentGlow(512, 512, 264, 196, 285, 260), left: 0, top: 0 },
      { input: heroShadow, left: 94, top: 24 },
      { input: hero.input, left: 84, top: 8 },
      { input: pouchShadow, left: 32, top: 154 },
      { input: pouchScaled, left: 22, top: 140 },
    ])
    .png()
    .toBuffer();

  await fs.writeFile(path.join(OUT, 'yandex-icon-512x512.png'), icon);
  await fs.writeFile(path.join(OUT, 'yandex-icon-128-preview.png'), await sharp(icon).resize(128, 128).png().toBuffer());
  await fs.writeFile(path.join(OUT, 'yandex-icon-64-preview.png'), await sharp(icon).resize(64, 64).png().toBuffer());
  return icon;
};

const icon = await buildIcon();

// One review sheet for fast visual QA; all underlying deliverables remain separate files.
const iconPreview = await sharp(icon).resize(300, 300).png().toBuffer();
const coverPreview = await sharp(primaryCover).resize({ width: 700 }).png().toBuffer();
const label = svg(1100, 70, `<text x="0" y="42" font-family="DejaVu Sans Mono, monospace" font-size="24" font-weight="700" fill="#f5effc">MYSTERY POCKET TECH // YANDEX STORE ART — REAL GAME ASSETS ONLY</text>`);
await sharp({ create: { width: 1100, height: 760, channels: 4, background: '#171421' } })
  .composite([
    { input: label, left: 44, top: 24 },
    { input: coverPreview, left: 44, top: 110 },
    { input: iconPreview, left: 756, top: 110 },
  ])
  .png()
  .toFile(path.join(OUT, 'review-sheet.png'));

console.log(`Built store assets in ${OUT}`);
