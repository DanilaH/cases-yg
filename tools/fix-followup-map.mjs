import fs from 'node:fs';

const path = 'tools/mobile-readability-followup.mjs';
let source = fs.readFileSync(path, 'utf8');
const before = "mapMethod(source, 'animateChipsPrelude(', 'getRewardBankOrigin(',";
const after = "mapMethod(source, 'async animateChipsPrelude(', 'getRewardBankOrigin(',";
if (!source.includes(before)) throw new Error('async follow-up target not found');
source = source.replace(before, after);
fs.writeFileSync(path, source);
