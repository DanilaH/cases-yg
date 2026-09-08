import fs from 'node:fs/promises';

const path = 'src/game/scenes/OpeningScene.ts';
const source = await fs.readFile(path, 'utf8');
const before = `            onUpdate: () => tag.setText(\`+\${Math.round(counter.value)}\`),
            onComplete: () => tag.setText(\`+\${pending.chips.overchargeBonus}\`),`;
const after = `            onUpdate: () => {
              if (tag.active) tag.setText(\`+\${Math.round(counter.value)}\`);
            },
            onComplete: () => {
              if (tag.active) tag.setText(\`+\${pending.chips.overchargeBonus}\`);
            },`;

if (source.includes(after)) {
  console.log('Overcharge counter lifecycle guard already applied.');
  process.exit(0);
}

if (!source.includes(before)) {
  throw new Error('Expected Overcharge bonus count-up block not found.');
}

await fs.writeFile(path, source.replace(before, after));
console.log('Applied Overcharge reward-tag lifecycle guard.');
