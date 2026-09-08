import fs from 'node:fs';

const replaceOnce = (path, from, to) => {
  const source = fs.readFileSync(path, 'utf8');
  if (source.includes(to)) return;
  if (!source.includes(from)) throw new Error(`Expected compatibility source not found in ${path}: ${from.slice(0, 160)}`);
  fs.writeFileSync(path, source.replace(from, to));
};

replaceOnce(
  'src/game/systems/pouches.ts',
  `export interface LiteHiddenPocketReward {\n  collectibleId: string;\n  familyId: string;\n  isNew: boolean;\n}`,
  `export interface LiteHiddenPocketReward {\n  collectibleId: string;\n  familyId: string;\n  isNew: boolean;\n  /** Persisted jackpot payout for this exact Hidden Pocket transaction. */\n  bonusChips: number;\n}`,
);
replaceOnce(
  'src/game/systems/pouches.ts',
  `    familyId: selected.familyId,\n    isNew: !discovered.has(selected.collectible.id),\n  };`,
  `    familyId: selected.familyId,\n    isNew: !discovered.has(selected.collectible.id),\n    bonusChips: balance.secretBonusChips,\n  };`,
);
replaceOnce(
  'src/game/systems/pouches.ts',
  '  const secretBonus = hiddenPocket ? balance.secretBonusChips : 0;',
  '  const secretBonus = hiddenPocket?.bonusChips ?? 0;',
);

replaceOnce(
  'src/game/systems/save.ts',
  `    typeof value.familyId === 'string' &&\n    typeof value.isNew === 'boolean');`,
  `    typeof value.familyId === 'string' &&\n    typeof value.isNew === 'boolean' &&\n    isNonNegativeInteger(value.bonusChips));`,
);
replaceOnce(
  'src/game/systems/save.ts',
  `    chips.secretBonus === (value.hiddenPocket ? 40 : 0) &&`,
  `    chips.secretBonus === (value.hiddenPocket ? Number(value.hiddenPocket.bonusChips) : 0) &&`,
);
replaceOnce(
  'src/game/systems/save.ts',
  '    hiddenPocket: legacy.hiddenPocket ? { ...legacy.hiddenPocket, isNew: true } : null,',
  '    hiddenPocket: legacy.hiddenPocket ? { ...legacy.hiddenPocket, isNew: true, bonusChips: 0 } : null,',
);
replaceOnce(
  'src/game/systems/save.ts',
  `      hiddenPocket: hiddenPocket ? { ...hiddenPocket, isNew: true } : null,`,
  `      hiddenPocket: hiddenPocket ? { ...hiddenPocket, isNew: true, bonusChips: 0 } : null,`,
);
