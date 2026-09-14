import fs from 'node:fs';

const path = 'tools/apply-mobile-acceptance-hardening.mjs';
let source = fs.readFileSync(path, 'utf8');

const replacements = [
  [
    "    `      {\\n      travelX: -24,\\n      durationMs: 620,\\n      repeatDelayMs: 360,\\n      angle: 180,\\n      scale: 0.9,\\n    });`,",
    "    `      travelX: -24,\\n      durationMs: 620,\\n      repeatDelayMs: 360,\\n      angle: 180,\\n      scale: 0.9,`,",
  ],
  [
    "    `      {\\n      travelX: this.metrics.compactChrome ? -34 : -24,\\n      durationMs: 620,\\n      repeatDelayMs: 360,\\n      angle: 180,\\n      scale: this.metrics.compactChrome ? 1.12 : 0.9,\\n    });`,",
    "    `      travelX: this.metrics.compactChrome ? -34 : -24,\\n      durationMs: 620,\\n      repeatDelayMs: 360,\\n      angle: 180,\\n      scale: this.metrics.compactChrome ? 1.12 : 0.9,`,",
  ],
];

for (const [before, after] of replacements) {
  if (!source.includes(before)) throw new Error(`Missing helper target: ${before}`);
  source = source.replace(before, after);
}

fs.writeFileSync(path, source);
