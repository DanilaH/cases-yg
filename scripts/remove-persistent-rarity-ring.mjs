import fs from 'node:fs';

const path = 'src/game/scenes/OpeningScene.ts';
let source = fs.readFileSync(path, 'utf8');

const startMarker = "    if (profile.ringAlpha > 0) {";
const endMarker = "\n\n    for (let index = 0; index < profile.sparkleCount; index += 1) {";
const start = source.indexOf(startMarker);
if (start === -1) throw new Error('Persistent rarity ring block not found');
if (source.indexOf(startMarker, start + startMarker.length) !== -1) {
  throw new Error('Expected exactly one persistent rarity ring block');
}
const end = source.indexOf(endMarker, start);
if (end === -1) throw new Error('Persistent rarity sparkle block boundary not found');

source = source.slice(0, start) + source.slice(end + 2);
fs.writeFileSync(path, source);
