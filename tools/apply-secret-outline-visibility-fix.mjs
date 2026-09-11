import { readFile, writeFile } from 'node:fs/promises';

const path = 'src/game/data/presentation.ts';
let source = await readFile(path, 'utf8');
const before = `  secretOutlineCopies: 10,\n  secretOutlineRadius: 4.2,\n  secretOutlineAlpha: 0.5,\n  secretOutlinePeakAlpha: 0.82,\n  secretOutlinePulseMs: 720,`;
const after = `  secretOutlineCopies: 12,\n  secretOutlineRadius: 6.2,\n  secretOutlineAlpha: 0.64,\n  secretOutlinePeakAlpha: 0.94,\n  secretOutlinePulseMs: 720,`;
if (!source.includes(before)) throw new Error('Missing Secret outline visibility patch anchor');
source = source.replace(before, after);
await writeFile(path, source);
console.log('Secret outline visibility correction applied.');
