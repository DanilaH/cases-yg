import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';

import sharp from 'sharp';

const toolRequire = createRequire(path.join(process.cwd(), '.asset-build/gpu-tools/package.json'));
const gpuTexEnc = toolRequire('gpu-tex-enc');

const PUBLIC_V2 = path.resolve('.asset-build/public-v2');
const OUT_ROOT = path.resolve('.asset-build/gpu-benchmark');
const REPORT_PATH = path.join(OUT_ROOT, 'report.json');

const SAMPLES = [
  'assets/collectibles/camera-common.webp',
  'assets/collectibles/crt-tv-legendary.webp',
  'assets/collectibles/handheld-console-secret-phone.webp',
  'assets/package/analog-nights-charged-pouch-body.webp',
  'assets/package/game-zone-charged-pouch-tear-strip-compact.webp',
  'assets/package/pouch-star-tab.webp',
];

const statBytes = async (file) => (await fs.stat(file)).size;
const sum = (values) => values.reduce((total, value) => total + value, 0);

const estimateAstcBytes = (width, height, blockWidth, blockHeight) =>
  Math.ceil(width / blockWidth) * Math.ceil(height / blockHeight) * 16 + 64;
const estimateEtc2RgbaBytes = (width, height) =>
  Math.ceil(width / 4) * Math.ceil(height / 4) * 16 + 64;

await fs.rm(OUT_ROOT, { recursive: true, force: true });
await fs.mkdir(OUT_ROOT, { recursive: true });

const runtimeReport = JSON.parse(await fs.readFile(path.resolve('.asset-build/runtime-v2-report.json'), 'utf8'));
const imageRecords = runtimeReport.records.filter((record) => record.after?.width && record.after?.height);

const catalogEstimate = {
  optimizedWebpBytes: runtimeReport.summary.allImageAfterBytes,
  rgbaBytes: runtimeReport.summary.estimatedRgbaAfterBytes,
  astc4x4Bytes: sum(imageRecords.map((record) => estimateAstcBytes(record.after.width, record.after.height, 4, 4))),
  astc6x6Bytes: sum(imageRecords.map((record) => estimateAstcBytes(record.after.width, record.after.height, 6, 6))),
  astc8x8Bytes: sum(imageRecords.map((record) => estimateAstcBytes(record.after.width, record.after.height, 8, 8))),
  etc2RgbaBytes: sum(imageRecords.map((record) => estimateEtc2RgbaBytes(record.after.width, record.after.height))),
};

const sampleResults = [];
for (const relative of SAMPLES) {
  const inputWebp = path.join(PUBLIC_V2, relative);
  const sampleName = relative.replaceAll('/', '__').replace(/\.webp$/i, '');
  const png = path.join(OUT_ROOT, `${sampleName}.png`);
  await sharp(inputWebp).png().toFile(png);
  const metadata = await sharp(inputWebp).metadata();

  const astc6 = await gpuTexEnc.generateASTC(png, '6x6', 'medium', 'cl', ['-silent']);
  const astc8 = await gpuTexEnc.generateASTC(png, '8x8', 'medium', 'cl', ['-silent']);
  const etc2 = await gpuTexEnc.generateETC(png, 'RGBA8', 60, 'rgba', ['-j', '2']);
  const basisEtc1s = await gpuTexEnc.generateBasis(png, 'ETC1S', true, ['-q', '160']);
  const basisUastc = await gpuTexEnc.generateBasis(
    png,
    'UASTC',
    true,
    ['-uastc_level', '2', '-uastc_rdo_l', '0.75', '-ktx2_no_zstandard'],
  );

  const webpBytes = await statBytes(inputWebp);
  const formats = {
    astc6x6: { path: path.basename(astc6), bytes: await statBytes(astc6), phaserNative: true },
    astc8x8: { path: path.basename(astc8), bytes: await statBytes(astc8), phaserNative: true },
    etc2Rgba: { path: path.basename(etc2), bytes: await statBytes(etc2), phaserNative: true },
    basisEtc1s: { path: path.basename(basisEtc1s), bytes: await statBytes(basisEtc1s), phaserNative: false },
    basisUastc: { path: path.basename(basisUastc), bytes: await statBytes(basisUastc), phaserNative: false },
  };

  sampleResults.push({
    path: relative,
    width: metadata.width,
    height: metadata.height,
    webpBytes,
    formats,
  });
}

const totals = {
  webpBytes: sum(sampleResults.map((sample) => sample.webpBytes)),
};
for (const key of ['astc6x6', 'astc8x8', 'etc2Rgba', 'basisEtc1s', 'basisUastc']) {
  totals[`${key}Bytes`] = sum(sampleResults.map((sample) => sample.formats[key].bytes));
}

const report = {
  version: 1,
  note: 'ASTC/ETC KTX outputs are Phaser-native candidates. Basis KTX2 is size research only and requires a runtime transcoder before adoption.',
  catalogEstimate,
  totals,
  samples: sampleResults,
};

await fs.writeFile(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);
console.log('GPU_TEXTURE_BENCHMARK_JSON=' + JSON.stringify({ catalogEstimate, totals }));
