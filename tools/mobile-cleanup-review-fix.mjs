import fs from 'node:fs';

const openingPath = 'src/game/scenes/OpeningScene.ts';
let opening = fs.readFileSync(openingPath, 'utf8');
const oldReady = `.text(width - 12, compact ? 10 : 10, 'READY', {\n        color: '#8df8ff',\n        stroke: '#160f20',\n        strokeThickness: 2,\n        fontFamily: DIGITAL_FONT_FAMILY,\n        fontSize: '7px',\n      })`;
const newReady = `.text(width - 12, compact ? 9 : 10, 'READY', {\n        color: '#8df8ff',\n        stroke: '#160f20',\n        strokeThickness: 2,\n        fontFamily: compact ? 'system-ui, sans-serif' : DIGITAL_FONT_FAMILY,\n        fontSize: compact ? '14px' : '7px',\n        fontStyle: 'bold',\n      })`;
if (!opening.includes(oldReady)) throw new Error('Charged READY review target not found');
opening = opening.replace(oldReady, newReady);
opening = opening.replace(
  '// Scene-entry pending reveals represent a tear that already crossed its durable\n    // staging boundary. Render the actual torn state, never the idle selector shell.',
  '// A pending reveal has already crossed its durable staging boundary, whether it\n    // arrived from a live tear handoff or recovery. Rebuild only reveal-owned chrome.',
);
fs.writeFileSync(openingPath, opening);

const docPath = 'docs/MOBILE_ACCEPTANCE_HARDENING_2026-09-14.md';
let doc = fs.readFileSync(docPath, 'utf8');
doc = doc.replace(
  '**Status:** SECOND REAL-PHONE CORRECTION PASS — IMPLEMENTING',
  '**Status:** SECOND REAL-PHONE CORRECTION PASS — IMPLEMENTED, AWAITING PHONE ACCEPTANCE',
);
if (!doc.includes('### Second-pass implementation result')) {
  doc += `\n\n### Second-pass implementation result\n\n- live tears now rebuild into the same reveal-owned shell after the pending reward is durably staged, so odds/pouch/Drop idle chrome cannot survive into reveal/result presentation;\n- compact Opening geometry is centralized in \`openingChromeLayout.ts\` and shared by Opening + Guidance;\n- compact rail height/spacing and odds height were reduced while retaining readable system-font sizes, removing the previous near-overflow pressure;\n- compact Drop navigation is taller internally and places the previous/next controls outside the title/progress surface;\n- \`POUCH\` now has a dark stroke/shadow for authored-background contrast;\n- Charged availability/READY outlines and guidance pointer targets use the same rendered card dimensions;\n- the guidance arrow is optically centered inside its circular target and direction is carried by motion + trailing dots.\n\nAutomated validation remains a pre-merge gate; the real phone remains authoritative for final acceptance.\n`;
}
fs.writeFileSync(docPath, doc);

console.log('final mobile review fix applied');
