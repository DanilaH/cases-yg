import { readFile, writeFile } from 'node:fs/promises';

const path = 'src/game/scenes/OpeningScene.ts';
let source = await readFile(path, 'utf8');
const before = `        target.setTint(SECRET_REVEAL_COLOR);\n        target.setTintFill();\n        target.setBlendMode(Phaser.BlendModes.NORMAL);`;
const after = `        target.setTint(SECRET_REVEAL_COLOR);\n        target.setTintMode(Phaser.TintModes.FILL);\n        target.setBlendMode(Phaser.BlendModes.NORMAL);`;
if (!source.includes(before)) throw new Error('Missing Secret tint patch anchor');
source = source.replace(before, after);
await writeFile(path, source);
console.log('Phaser 4 Secret tint mode fix applied.');
