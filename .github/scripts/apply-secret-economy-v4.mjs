import fs from 'node:fs';

const replaceOnce = (path, from, to) => {
  const source = fs.readFileSync(path, 'utf8');
  if (source.includes(to)) return;
  if (!source.includes(from)) throw new Error(`Expected source not found in ${path}: ${from.slice(0, 160)}`);
  fs.writeFileSync(path, source.replace(from, to));
};

const replaceRegex = (path, regex, to, label) => {
  const source = fs.readFileSync(path, 'utf8');
  if (source.includes(to)) return;
  if (!regex.test(source)) throw new Error(`Expected ${label} not found in ${path}`);
  fs.writeFileSync(path, source.replace(regex, to));
};

// Balance: the Secret jackpot is a centralized, explicit tuning value.
replaceOnce(
  'src/game/data/balance.ts',
  '  hiddenPocketStartOpening: number;\n  duplicateRecycleChips: Readonly<Record<StandardRarity, number>>;',
  '  hiddenPocketStartOpening: number;\n  secretBonusChips: number;\n  duplicateRecycleChips: Readonly<Record<StandardRarity, number>>;',
);
replaceOnce(
  'src/game/data/balance.ts',
  '  hiddenPocketStartOpening: 4,\n  duplicateRecycleChips: {',
  '  hiddenPocketStartOpening: 4,\n  secretBonusChips: 40,\n  duplicateRecycleChips: {',
);

// Resolver data shape.
replaceOnce(
  'src/game/systems/pouches.ts',
  `export interface LiteHiddenPocketReward {\n  collectibleId: string;\n  familyId: string;\n}`,
  `export interface LiteHiddenPocketReward {\n  collectibleId: string;\n  familyId: string;\n  isNew: boolean;\n}`,
);
replaceOnce(
  'src/game/systems/pouches.ts',
  `  overchargeBonus: number;\n  totalEarned: number;`,
  `  overchargeBonus: number;\n  secretBonus: number;\n  totalEarned: number;`,
);
replaceOnce(
  'src/game/systems/pouches.ts',
  `  expectedRecycleIfAllDuplicate: number;\n  expectedReturnIfAllDuplicate: number;`,
  `  expectedRecycleIfAllDuplicate: number;\n  expectedSecretBonus: number;\n  expectedReturnIfAllDuplicate: number;`,
);

replaceRegex(
  'src/game/systems/pouches.ts',
  /const chooseHiddenPocket = \([\s\S]*?\n};\n\nexport const resolveLitePouchReward/,
  `const chooseHiddenPocket = (\n  state: LiteRewardState,\n  registry: ContentRegistry,\n  balance: LiteBalanceConfig,\n  profile: PouchProfile,\n  openingNumber: number,\n  random: RandomSource,\n): LiteHiddenPocketReward | null => {\n  if (openingNumber < balance.hiddenPocketStartOpening) {\n    return null;\n  }\n\n  const available = registry.secrets.filter(({ lootPoolId }) => lootPoolId === state.activeLootPoolId);\n  if (available.length === 0 || nextUnit(random) >= profile.hiddenPocketChance) {\n    return null;\n  }\n\n  const discovered = new Set(state.discoveredSecrets);\n  const missing = available.filter(({ collectible }) => !discovered.has(collectible.id));\n  const candidates = missing.length > 0 ? missing : available;\n  const selected = pickWeighted(\n    candidates.map((candidate) => ({ value: candidate, weight: 1 })),\n    random,\n  );\n  return {\n    collectibleId: selected.collectible.id,\n    familyId: selected.familyId,\n    isNew: !discovered.has(selected.collectible.id),\n  };\n};\n\nexport const resolveLitePouchReward`,
  'Hidden Pocket selector',
);

replaceOnce(
  'src/game/systems/pouches.ts',
  `  const totalEarned = rawEarned + overcharge.bonusChips;\n  const chips: LiteChipsReward = {\n    before: state.chips,\n    cost: profile.chipsCost,\n    base,\n    cacheTier: cache.tier,\n    cacheBonus: cache.reward,\n    recycle,\n    rawEarned,\n    overchargeBonus: overcharge.bonusChips,\n    totalEarned,\n    after: state.chips - profile.chipsCost + totalEarned,\n  };\n\n  const hiddenPocket = chooseHiddenPocket(state, registry, balance, profile, openingNumber, random);`,
  `  const hiddenPocket = chooseHiddenPocket(state, registry, balance, profile, openingNumber, random);\n  const secretBonus = hiddenPocket ? balance.secretBonusChips : 0;\n  const totalEarned = rawEarned + overcharge.bonusChips + secretBonus;\n  const chips: LiteChipsReward = {\n    before: state.chips,\n    cost: profile.chipsCost,\n    base,\n    cacheTier: cache.tier,\n    cacheBonus: cache.reward,\n    recycle,\n    rawEarned,\n    overchargeBonus: overcharge.bonusChips,\n    secretBonus,\n    totalEarned,\n    after: state.chips - profile.chipsCost + totalEarned,\n  };`,
);

replaceOnce(
  'src/game/systems/pouches.ts',
  `  const expectedReturnIfAllDuplicate = expectedBaseChips + expectedCacheBonus + expectedRecycleIfAllDuplicate;\n\n  return {\n    pouchType,\n    cost: profile.chipsCost,\n    expectedBaseChips,\n    expectedCacheBonus,\n    expectedRecycleIfAllDuplicate,\n    expectedReturnIfAllDuplicate,`,
  `  const expectedSecretBonus = profile.hiddenPocketChance * balance.secretBonusChips;\n  const expectedReturnIfAllDuplicate =\n    expectedBaseChips + expectedCacheBonus + expectedRecycleIfAllDuplicate + expectedSecretBonus;\n\n  return {\n    pouchType,\n    cost: profile.chipsCost,\n    expectedBaseChips,\n    expectedCacheBonus,\n    expectedRecycleIfAllDuplicate,\n    expectedSecretBonus,\n    expectedReturnIfAllDuplicate,`,
);

// A Secret duplicate is a real Hidden Pocket but must not duplicate collection IDs.
replaceOnce(
  'src/game/systems/drops.ts',
  `  const discoveredSecrets = resolved.hiddenPocket\n    ? [...state.discoveredSecrets, resolved.hiddenPocket.collectibleId]\n    : [...state.discoveredSecrets];`,
  `  const discoveredSecrets = resolved.hiddenPocket?.isNew\n    ? [...state.discoveredSecrets, resolved.hiddenPocket.collectibleId]\n    : [...state.discoveredSecrets];`,
);

// Save V4: persist Secret new/duplicate + bonus explicitly while migrating V3 staged reveals neutrally.
replaceOnce('src/game/systems/save.ts', 'export const SAVE_VERSION = 3;', 'export const SAVE_VERSION = 4;');
replaceOnce(
  'src/game/systems/save.ts',
  `const isHiddenPocket = (value: unknown): value is PendingReveal['hiddenPocket'] =>\n  value === null ||\n  (isRecord(value) && typeof value.collectibleId === 'string' && typeof value.familyId === 'string');`,
  `const isLegacyHiddenPocket = (value: unknown): value is LegacyPendingReveal['hiddenPocket'] =>\n  value === null ||\n  (isRecord(value) && typeof value.collectibleId === 'string' && typeof value.familyId === 'string');\n\nconst isHiddenPocket = (value: unknown): value is PendingReveal['hiddenPocket'] =>\n  value === null ||\n  (isRecord(value) &&\n    typeof value.collectibleId === 'string' &&\n    typeof value.familyId === 'string' &&\n    typeof value.isNew === 'boolean');`,
);
replaceOnce(
  'src/game/systems/save.ts',
  '    isHiddenPocket(value.hiddenPocket) &&\n    isLegacyProgressSnapshot(value.commit)',
  '    isLegacyHiddenPocket(value.hiddenPocket) &&\n    isLegacyProgressSnapshot(value.commit)',
);
replaceOnce(
  'src/game/systems/save.ts',
  `    isNonNegativeInteger(chips.overchargeBonus) &&\n    isNonNegativeInteger(chips.totalEarned) &&`,
  `    isNonNegativeInteger(chips.overchargeBonus) &&\n    isNonNegativeInteger(chips.secretBonus) &&\n    isNonNegativeInteger(chips.totalEarned) &&`,
);
replaceOnce(
  'src/game/systems/save.ts',
  `    chips.totalEarned === chips.rawEarned + chips.overchargeBonus &&\n    chips.after === chips.before - chips.cost + chips.totalEarned;`,
  `    chips.secretBonus === (value.hiddenPocket ? 40 : 0) &&\n    chips.totalEarned === chips.rawEarned + chips.overchargeBonus + chips.secretBonus &&\n    chips.after === chips.before - chips.cost + chips.totalEarned;`,
);
replaceOnce(
  'src/game/systems/save.ts',
  `  const hiddenAlreadyOwned = pending.hiddenPocket\n    ? state.discoveredSecrets.includes(pending.hiddenPocket.collectibleId)\n    : false;\n  if (hiddenAlreadyOwned) return false;\n  const expectedSecrets = pending.hiddenPocket\n    ? [...state.discoveredSecrets, pending.hiddenPocket.collectibleId]\n    : [...state.discoveredSecrets];`,
  `  const hiddenAlreadyOwned = pending.hiddenPocket\n    ? state.discoveredSecrets.includes(pending.hiddenPocket.collectibleId)\n    : false;\n  if (pending.hiddenPocket && pending.hiddenPocket.isNew === hiddenAlreadyOwned) return false;\n  const expectedSecrets = pending.hiddenPocket?.isNew\n    ? [...state.discoveredSecrets, pending.hiddenPocket.collectibleId]\n    : [...state.discoveredSecrets];`,
);
replaceOnce(
  'src/game/systems/save.ts',
  `      rawEarned: 0,\n      overchargeBonus: 0,\n      totalEarned: 0,`,
  `      rawEarned: 0,\n      overchargeBonus: 0,\n      secretBonus: 0,\n      totalEarned: 0,`,
);
replaceOnce(
  'src/game/systems/save.ts',
  '    hiddenPocket: legacy.hiddenPocket ? { ...legacy.hiddenPocket } : null,',
  '    hiddenPocket: legacy.hiddenPocket ? { ...legacy.hiddenPocket, isNew: true } : null,',
);

replaceOnce(
  'src/game/systems/save.ts',
  `  return parseCurrentSave({\n    ...value,\n    version: SAVE_VERSION,\n    overchargeHundredths: DEFAULT_OVERCHARGE_HUNDREDTHS,\n    pendingReveal,\n  });\n};\n\nconst parseCurrentSave`,
  `  return migrateV3Save({\n    ...value,\n    version: 3,\n    overchargeHundredths: DEFAULT_OVERCHARGE_HUNDREDTHS,\n    pendingReveal,\n  });\n};\n\nconst migrateV3Save = (value: Record<string, unknown>): SaveState => {\n  if (value.version !== 3) {\n    throw new Error('Invalid V3 save payload');\n  }\n\n  let pendingReveal: unknown = value.pendingReveal;\n  if (pendingReveal !== null) {\n    if (!isRecord(pendingReveal) || !isRecord(pendingReveal.chips)) {\n      throw new Error('Invalid V3 pending reveal');\n    }\n    const hiddenPocket = pendingReveal.hiddenPocket;\n    if (hiddenPocket !== null && !isLegacyHiddenPocket(hiddenPocket)) {\n      throw new Error('Invalid V3 Hidden Pocket');\n    }\n    pendingReveal = {\n      ...pendingReveal,\n      chips: {\n        ...pendingReveal.chips,\n        // Pre-correction staged reveals keep their exact old wallet outcome.\n        secretBonus: 0,\n      },\n      hiddenPocket: hiddenPocket ? { ...hiddenPocket, isNew: true } : null,\n    };\n  }\n\n  return parseCurrentSave({\n    ...value,\n    version: SAVE_VERSION,\n    pendingReveal,\n  });\n};\n\nconst parseCurrentSave`,
);
replaceOnce(
  'src/game/systems/save.ts',
  `  if (value.version === 2) {\n    return migrateV2Save(value);\n  }\n  if (value.version === SAVE_VERSION) {`,
  `  if (value.version === 2) {\n    return migrateV2Save(value);\n  }\n  if (value.version === 3) {\n    return migrateV3Save(value);\n  }\n  if (value.version === SAVE_VERSION) {`,
);

// Existing migration expectation now exposes neutral Secret bonus explicitly.
replaceOnce(
  'tests/save-migration.test.ts',
  `      rawEarned: 0,\n      overchargeBonus: 0,\n      totalEarned: 0,`,
  `      rawEarned: 0,\n      overchargeBonus: 0,\n      secretBonus: 0,\n      totalEarned: 0,`,
);

// Economy baselines now include the low-probability fixed Secret jackpot EV.
replaceOnce(
  'tests/lite-pouches.test.ts',
  `    expect(basic.expectedReturnIfAllDuplicate).toBeCloseTo(14.855, 3);\n    expect(charged.expectedReturnIfAllDuplicate).toBeCloseTo(35.325, 3);`,
  `    expect(basic.expectedSecretBonus).toBeCloseTo(0.6, 3);\n    expect(charged.expectedSecretBonus).toBeCloseTo(2.4, 3);\n    expect(basic.expectedReturnIfAllDuplicate).toBeCloseTo(15.455, 3);\n    expect(charged.expectedReturnIfAllDuplicate).toBeCloseTo(37.725, 3);`,
);

const secretTests = `import { describe, expect, it } from 'vitest';\n\nimport { LITE_V2_BALANCE } from '../src/game/data/balance';\nimport { SLICE_REGISTRY } from '../src/game/data/collectibles';\nimport { createPendingReveal } from '../src/game/systems/drops';\nimport { resolveLitePouchReward, type LiteRewardState } from '../src/game/systems/pouches';\nimport { SAVE_VERSION, createInitialSaveState, parseSaveState, stagePendingReveal } from '../src/game/systems/save';\nimport { SequenceRandom } from './helpers';\n\nconst allStandardIds = SLICE_REGISTRY.standardItems.map(({ collectible }) => collectible.id);\nconst allSecretIds = SLICE_REGISTRY.secrets.map(({ collectible }) => collectible.id);\n\nconst makeState = (overrides: Partial<LiteRewardState> = {}): LiteRewardState => ({\n  chips: 0,\n  signal: 0,\n  overchargeHundredths: 100,\n  totalOpens: 3,\n  activeLootPoolId: 'y2k-essentials',\n  discoveredStandard: [],\n  discoveredSecrets: [],\n  ...overrides,\n});\n\nconst hiddenRandom = () => new SequenceRandom([0, 0, 0, 0, 0, 0]);\n\ndescribe('Secret reward correction economy', () => {\n  it('guarantees an undiscovered Secret on a successful Hidden Pocket and pays +40 CHIPS', () => {\n    const result = resolveLitePouchReward({\n      state: makeState(),\n      pouchType: 'basic',\n      registry: SLICE_REGISTRY,\n      balance: LITE_V2_BALANCE,\n      random: hiddenRandom(),\n    });\n\n    expect(result.hiddenPocket).toMatchObject({ isNew: true });\n    expect(result.chips.secretBonus).toBe(40);\n    expect(result.chips.totalEarned).toBe(result.chips.rawEarned + result.chips.overchargeBonus + 40);\n  });\n\n  it('keeps Hidden Pocket alive after Secret completion and returns a duplicate +40 reward', () => {\n    const result = resolveLitePouchReward({\n      state: makeState({ discoveredSecrets: allSecretIds }),\n      pouchType: 'basic',\n      registry: SLICE_REGISTRY,\n      balance: LITE_V2_BALANCE,\n      random: hiddenRandom(),\n    });\n\n    expect(result.hiddenPocket).toMatchObject({ isNew: false });\n    expect(allSecretIds).toContain(result.hiddenPocket?.collectibleId);\n    expect(result.chips.secretBonus).toBe(40);\n  });\n\n  it('does not multiply the Secret jackpot with Overcharge', () => {\n    const result = resolveLitePouchReward({\n      state: makeState({\n        signal: 4,\n        overchargeHundredths: 150,\n        discoveredStandard: allStandardIds,\n        discoveredSecrets: allSecretIds,\n      }),\n      pouchType: 'basic',\n      registry: SLICE_REGISTRY,\n      balance: LITE_V2_BALANCE,\n      random: hiddenRandom(),\n    });\n\n    expect(result.chips.rawEarned).toBe(8);\n    expect(result.chips.overchargeBonus).toBe(4);\n    expect(result.chips.secretBonus).toBe(40);\n    expect(result.chips.totalEarned).toBe(52);\n  });\n\n  it('does not duplicate collection IDs when the Secret reward is a duplicate', () => {\n    const base = {\n      ...createInitialSaveState(),\n      totalOpens: 3,\n      discoveredSecrets: allSecretIds,\n    };\n    const pending = createPendingReveal({\n      state: base,\n      registry: SLICE_REGISTRY,\n      balance: LITE_V2_BALANCE,\n      random: hiddenRandom(),\n      transactionId: 'secret-duplicate',\n    });\n\n    expect(pending.hiddenPocket?.isNew).toBe(false);\n    expect(pending.commit.discoveredSecrets).toEqual(allSecretIds);\n    expect(pending.commit.stats.hiddenPockets).toBe(base.stats.hiddenPockets + 1);\n  });\n\n  it('migrates a staged V3 Hidden Pocket without retroactively granting the new bonus', () => {\n    const base = { ...createInitialSaveState(), totalOpens: 3 };\n    const pending = createPendingReveal({\n      state: base,\n      registry: SLICE_REGISTRY,\n      balance: LITE_V2_BALANCE,\n      random: hiddenRandom(),\n      transactionId: 'v3-hidden-pocket',\n    });\n    const staged = stagePendingReveal(base, pending);\n    const oldTotal = pending.chips.totalEarned - pending.chips.secretBonus;\n    const oldAfter = pending.chips.before - pending.chips.cost + oldTotal;\n    const v3 = {\n      ...staged,\n      version: 3,\n      pendingReveal: {\n        ...pending,\n        chips: { ...pending.chips, totalEarned: oldTotal, after: oldAfter },\n        hiddenPocket: pending.hiddenPocket\n          ? { collectibleId: pending.hiddenPocket.collectibleId, familyId: pending.hiddenPocket.familyId }\n          : null,\n        commit: { ...pending.commit, chips: oldAfter },\n      },\n    } as Record<string, any>;\n    delete v3.pendingReveal.chips.secretBonus;\n\n    const migrated = parseSaveState(JSON.stringify(v3));\n\n    expect(migrated.version).toBe(SAVE_VERSION);\n    expect(migrated.pendingReveal?.chips.secretBonus).toBe(0);\n    expect(migrated.pendingReveal?.chips.totalEarned).toBe(oldTotal);\n    expect(migrated.pendingReveal?.chips.after).toBe(oldAfter);\n    expect(migrated.pendingReveal?.hiddenPocket?.isNew).toBe(true);\n  });\n});\n`;
fs.writeFileSync('tests/secret-reward.test.ts', secretTests);
