import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.argv[2] || 'dist');
const label = process.argv[3] || 'build';
const imageExtensions = new Set(['.webp', '.png', '.jpg', '.jpeg', '.avif', '.ktx', '.ktx2', '.pvr']);
const files = [];

const walk = (directory) => {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(absolute);
    else {
      const stat = fs.statSync(absolute);
      files.push({ path: path.relative(root, absolute).replaceAll(path.sep, '/'), bytes: stat.size });
    }
  }
};

walk(root);
const sum = (items) => items.reduce((total, item) => total + item.bytes, 0);
const assetFiles = files.filter((file) => file.path.startsWith('assets/'));
const imageFiles = files.filter((file) => imageExtensions.has(path.extname(file.path).toLowerCase()));
const report = {
  label,
  distBytes: sum(files),
  distFileCount: files.length,
  assetBytes: sum(assetFiles),
  assetFileCount: assetFiles.length,
  imageBytes: sum(imageFiles),
  imageFileCount: imageFiles.length,
  largestFiles: [...files].sort((a, b) => b.bytes - a.bytes).slice(0, 30),
};

console.log('BUILD_FOOTPRINT_JSON=' + JSON.stringify(report));
