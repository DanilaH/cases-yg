import fs from 'node:fs/promises';
import path from 'node:path';

import sharp from 'sharp';

const SOURCE_ROOT = path.resolve('public');
const OUT_ROOT = path.resolve('.asset-build/webp-effort4');
const REPORT_PATH = path.resolve('.asset-build/webp-effort4-report.json');
const RUNTIME_REPORT_PATH = path.resolve('.asset-build/runtime-v2-report.json');
const EFFORT = 4;
const QUALITY = 88;
const CONCURRENCY = 4;

const sum = (values) => values.reduce((total, value) => total + value, 0);

const mapLimit = async (items, limit, mapper) => {
  const results = new Array(items.length);
  let nextIndex = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (true) {
      const index = nextIndex;
      nextIndex += 1;
      if (index >= items.length) return;
      results[index] = await mapper(items[index], index);
    }
  });
  await Promise.all(workers);
  return results;
};

const runtimeReport = JSON.parse(await fs.readFile(RUNTIME_REPORT_PATH, 'utf8'));
const candidates = runtimeReport.records.filter(
  (record) => record.optimized && record.after?.width && record.after?.height,
);

await fs.rm(OUT_ROOT, { recursive: true, force: true });
await fs.mkdir(OUT_ROOT, { recursive: true });

const startedAt = performance.now();
const records = await mapLimit(candidates, CONCURRENCY, async (record) => {
  const source = path.join(SOURCE_ROOT, record.path);
  const destination = path.join(OUT_ROOT, record.path);
  await fs.mkdir(path.dirname(destination), { recursive: true });

  await sharp(source)
    .rotate()
    .resize({
      width: record.after.width,
      height: record.after.height,
      fit: 'fill',
      withoutEnlargement: true,
    })
    .webp({ quality: QUALITY, alphaQuality: 100, effort: EFFORT, smartSubsample: true })
    .toFile(destination);

  const bytes = (await fs.stat(destination)).size;
  return {
    path: record.path,
    kind: record.kind,
    effort6Bytes: record.afterBytes,
    effort4Bytes: bytes,
    deltaBytes: bytes - record.afterBytes,
    width: record.after.width,
    height: record.after.height,
  };
});

const effort6OptimizedBytes = runtimeReport.summary.afterOptimizedBytes;
const effort4OptimizedBytes = sum(records.map((record) => record.effort4Bytes));
const unchangedImageBytes = runtimeReport.summary.allImageAfterBytes - effort6OptimizedBytes;
const allImageEffort4Bytes = unchangedImageBytes + effort4OptimizedBytes;
const conversionMs = Math.round(performance.now() - startedAt);

const kinds = [...new Set(records.map((record) => record.kind))];
const perKind = Object.fromEntries(kinds.map((kind) => {
  const kindRecords = records.filter((record) => record.kind === kind);
  const effort6Bytes = sum(kindRecords.map((record) => record.effort6Bytes));
  const effort4Bytes = sum(kindRecords.map((record) => record.effort4Bytes));
  return [kind, {
    fileCount: kindRecords.length,
    effort6Bytes,
    effort4Bytes,
    deltaBytes: effort4Bytes - effort6Bytes,
  }];
}));

const report = {
  version: 1,
  settings: {
    quality: QUALITY,
    effort: EFFORT,
    concurrency: CONCURRENCY,
  },
  summary: {
    fileCount: records.length,
    effort6OptimizedBytes,
    effort4OptimizedBytes,
    optimizedDeltaBytes: effort4OptimizedBytes - effort6OptimizedBytes,
    allImageEffort6Bytes: runtimeReport.summary.allImageAfterBytes,
    allImageEffort4Bytes,
    allImageDeltaBytes: allImageEffort4Bytes - runtimeReport.summary.allImageAfterBytes,
    effort6ConversionMs: runtimeReport.summary.conversionMs,
    effort4ConversionMs: conversionMs,
  },
  perKind,
  largestRegressions: [...records].sort((a, b) => b.deltaBytes - a.deltaBytes).slice(0, 20),
  largestImprovements: [...records].sort((a, b) => a.deltaBytes - b.deltaBytes).slice(0, 20),
};

await fs.writeFile(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);
console.log('WEBP_EFFORT_V2_JSON=' + JSON.stringify({ summary: report.summary, perKind }));
