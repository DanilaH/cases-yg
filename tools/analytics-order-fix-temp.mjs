import { readFile, writeFile } from 'node:fs/promises';

const path = 'src/game/scenes/OpeningScene.ts';
let source = await readFile(path, 'utf8');
const before = `      this.lastReveal = pending;\n      getPlatformRuntime().analytics.track('opening_started', {\n        openingNumber: pending.openingNumber,\n        lootPoolId: pending.lootPoolId,\n        pouchType: pending.pouchType,\n      });\n      if (firstInteraction && pending.openingNumber === 1) {\n        this.firstInteractionTracked = true;\n        getPlatformRuntime().analytics.track('first_package_interaction');\n      }`;
const after = `      this.lastReveal = pending;\n      if (firstInteraction && pending.openingNumber === 1) {\n        this.firstInteractionTracked = true;\n        getPlatformRuntime().analytics.track('first_package_interaction');\n      }\n      getPlatformRuntime().analytics.track('opening_started', {\n        openingNumber: pending.openingNumber,\n        lootPoolId: pending.lootPoolId,\n        pouchType: pending.pouchType,\n      });`;
const index = source.indexOf(before);
if (index < 0 || source.indexOf(before, index + before.length) >= 0) throw new Error('opening analytics ordering anchor missing or ambiguous');
source = source.slice(0, index) + after + source.slice(index + before.length);
await writeFile(path, source);
