from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    p = Path(path)
    text = p.read_text(encoding='utf-8')
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{path}: expected 1 match, got {count}: {old[:100]!r}')
    p.write_text(text.replace(old, new, 1), encoding='utf-8')


def append_before(path: str, marker: str, addition: str) -> None:
    p = Path(path)
    text = p.read_text(encoding='utf-8')
    if addition.strip() in text:
        return
    if marker not in text:
        raise SystemExit(f'{path}: missing marker {marker!r}')
    p.write_text(text.replace(marker, addition + marker, 1), encoding='utf-8')

# balance.ts
replace_once(
    'src/game/data/balance.ts',
    "export const POUCH_TYPES = ['basic', 'charged'] as const;",
    "export const OVERCHARGE_BASE_HUNDREDTHS = 100;\n\nexport const POUCH_TYPES = ['basic', 'charged'] as const;",
)
replace_once(
    'src/game/data/balance.ts',
    '  hiddenPocketChance: number;\n}',
    '  hiddenPocketChance: number;\n  /** Hundredths of multiplier added after a retained armed Signal opening: 10 = +0.10. */\n  overchargeGainHundredths: number;\n}',
)
replace_once(
    'src/game/data/balance.ts',
    '  signalThreshold: number;\n  hiddenPocketStartOpening: number;',
    '  signalThreshold: number;\n  /** Stored multiplier uses hundredths: 100 = x1.00, 150 = x1.50. */\n  overchargeCapHundredths: number;\n  hiddenPocketStartOpening: number;',
)
replace_once(
    'src/game/data/balance.ts',
    '  signalThreshold: 4,\n  hiddenPocketStartOpening: 4,',
    '  signalThreshold: 4,\n  // Phase 2.6 provisional tuning, selected after the first EV sanity pass.\n  overchargeCapHundredths: 150,\n  hiddenPocketStartOpening: 4,',
)
replace_once(
    'src/game/data/balance.ts',
    '      hiddenPocketChance: 0.015,\n    },',
    '      hiddenPocketChance: 0.015,\n      overchargeGainHundredths: 10,\n    },',
)
replace_once(
    'src/game/data/balance.ts',
    '      hiddenPocketChance: 0.06,\n    },',
    '      hiddenPocketChance: 0.06,\n      overchargeGainHundredths: 50,\n    },',
)

# New pure Overcharge helper.
Path('src/game/systems/overcharge.ts').write_text(r'''import { OVERCHARGE_BASE_HUNDREDTHS } from '../data/balance';

export interface ResolveOverchargeInput {
  beforeHundredths: number;
  rawEarnedChips: number;
  lockArmedBefore: boolean;
  lockConsumed: boolean;
  lockRetained: boolean;
  pouchGainHundredths: number;
  capHundredths: number;
}

export interface OverchargeTransition {
  beforeHundredths: number;
  afterHundredths: number;
  appliedGainHundredths: number;
  bonusChips: number;
}

const assertWhole = (value: number, label: string): void => {
  if (!Number.isInteger(value)) {
    throw new Error(`Invalid ${label}: ${value}`);
  }
};

export const calculateOverchargeBonus = (rawEarnedChips: number, multiplierHundredths: number): number => {
  assertWhole(rawEarnedChips, 'raw Overcharge CHIPS');
  assertWhole(multiplierHundredths, 'Overcharge multiplier');
  if (rawEarnedChips < 0 || multiplierHundredths < OVERCHARGE_BASE_HUNDREDTHS) {
    throw new Error('Invalid Overcharge bonus input');
  }
  return Math.round((rawEarnedChips * (multiplierHundredths - OVERCHARGE_BASE_HUNDREDTHS)) / 100);
};

export const resolveOverchargeTransition = (input: ResolveOverchargeInput): OverchargeTransition => {
  const {
    beforeHundredths,
    rawEarnedChips,
    lockArmedBefore,
    lockConsumed,
    lockRetained,
    pouchGainHundredths,
    capHundredths,
  } = input;

  for (const [value, label] of [
    [beforeHundredths, 'Overcharge multiplier'],
    [pouchGainHundredths, 'Overcharge pouch gain'],
    [capHundredths, 'Overcharge cap'],
  ] as const) {
    assertWhole(value, label);
  }
  if (
    beforeHundredths < OVERCHARGE_BASE_HUNDREDTHS ||
    pouchGainHundredths < 0 ||
    capHundredths < OVERCHARGE_BASE_HUNDREDTHS ||
    beforeHundredths > capHundredths
  ) {
    throw new Error('Invalid Overcharge state');
  }
  if (!lockArmedBefore && beforeHundredths !== OVERCHARGE_BASE_HUNDREDTHS) {
    throw new Error('Overcharge cannot remain active without an armed Signal lock');
  }
  if (lockConsumed && lockRetained) {
    throw new Error('Signal lock cannot be consumed and retained together');
  }

  const bonusChips = calculateOverchargeBonus(rawEarnedChips, beforeHundredths);
  if (lockConsumed) {
    return {
      beforeHundredths,
      afterHundredths: OVERCHARGE_BASE_HUNDREDTHS,
      appliedGainHundredths: 0,
      bonusChips,
    };
  }
  if (lockRetained) {
    const afterHundredths = Math.min(capHundredths, beforeHundredths + pouchGainHundredths);
    return {
      beforeHundredths,
      afterHundredths,
      appliedGainHundredths: afterHundredths - beforeHundredths,
      bonusChips,
    };
  }
  return {
    beforeHundredths,
    afterHundredths: beforeHundredths,
    appliedGainHundredths: 0,
    bonusChips,
  };
};

export const formatOverchargeMultiplier = (hundredths: number): string => {
  assertWhole(hundredths, 'Overcharge multiplier');
  return `x${(hundredths / 100).toFixed(2)}`;
};
''', encoding='utf-8')

# pouches.ts
replace_once(
    'src/game/systems/pouches.ts',
    "import { nextUnit, pickWeighted, type RandomSource, type WeightedEntry } from './random';",
    "import { resolveOverchargeTransition, type OverchargeTransition } from './overcharge';\nimport { nextUnit, pickWeighted, type RandomSource, type WeightedEntry } from './random';",
)
replace_once(
    'src/game/systems/pouches.ts',
    '  signal: number;\n  totalOpens: number;',
    '  signal: number;\n  overchargeHundredths: number;\n  totalOpens: number;',
)
replace_once(
    'src/game/systems/pouches.ts',
    '  recycle: number;\n  totalEarned: number;',
    '  recycle: number;\n  rawEarned: number;\n  overchargeBonus: number;\n  totalEarned: number;',
)
replace_once(
    'src/game/systems/pouches.ts',
    'export interface LiteRewardDraft {\n',
    'export type LiteOverchargeReward = OverchargeTransition;\n\nexport interface LiteRewardDraft {\n',
)
replace_once(
    'src/game/systems/pouches.ts',
    '  chips: LiteChipsReward;\n  signal: LiteSignalReward;\n  hiddenPocket:',
    '  chips: LiteChipsReward;\n  signal: LiteSignalReward;\n  overcharge: LiteOverchargeReward;\n  hiddenPocket:',
)
replace_once(
    'src/game/systems/pouches.ts',
    "  if (state.chips < profile.chipsCost) {\n    throw new Error(`Insufficient CHIPS for ${pouchType} pouch`);\n  }",
    "  if (state.chips < profile.chipsCost) {\n    throw new Error(`Insufficient CHIPS for ${pouchType} pouch`);\n  }\n  if (\n    !Number.isInteger(state.overchargeHundredths) ||\n    state.overchargeHundredths < 100 ||\n    state.overchargeHundredths > balance.overchargeCapHundredths ||\n    (state.signal < balance.signalThreshold && state.overchargeHundredths !== 100)\n  ) {\n    throw new Error(`Invalid Overcharge state: ${state.overchargeHundredths}`);\n  }",
)
replace_once(
    'src/game/systems/pouches.ts',
    '  const recycle = isNew ? 0 : balance.duplicateRecycleChips[selected.rarity];\n  const totalEarned = base + cache.reward + recycle;\n  const chips: LiteChipsReward = {\n    before: state.chips,\n    cost: profile.chipsCost,\n    base,\n    cacheTier: cache.tier,\n    cacheBonus: cache.reward,\n    recycle,\n    totalEarned,\n    after: state.chips - profile.chipsCost + totalEarned,\n  };',
    '  const recycle = isNew ? 0 : balance.duplicateRecycleChips[selected.rarity];\n  const rawEarned = base + cache.reward + recycle;\n  const overcharge = resolveOverchargeTransition({\n    beforeHundredths: state.overchargeHundredths,\n    rawEarnedChips: rawEarned,\n    lockArmedBefore: signal.lockArmedBefore,\n    lockConsumed: signal.lockConsumed,\n    lockRetained: signal.lockRetained,\n    pouchGainHundredths: profile.overchargeGainHundredths,\n    capHundredths: balance.overchargeCapHundredths,\n  });\n  const totalEarned = rawEarned + overcharge.bonusChips;\n  const chips: LiteChipsReward = {\n    before: state.chips,\n    cost: profile.chipsCost,\n    base,\n    cacheTier: cache.tier,\n    cacheBonus: cache.reward,\n    recycle,\n    rawEarned,\n    overchargeBonus: overcharge.bonusChips,\n    totalEarned,\n    after: state.chips - profile.chipsCost + totalEarned,\n  };',
)
replace_once(
    'src/game/systems/pouches.ts',
    '    chips,\n    signal,\n    hiddenPocket,',
    '    chips,\n    signal,\n    overcharge,\n    hiddenPocket,',
)

# drops.ts
replace_once(
    'src/game/systems/drops.ts',
    '  type LiteHiddenPocketReward,\n  type LiteSignalReward,',
    '  type LiteHiddenPocketReward,\n  type LiteOverchargeReward,\n  type LiteSignalReward,',
)
replace_once(
    'src/game/systems/drops.ts',
    '  signal: LiteSignalReward;\n  hiddenPocket:',
    '  signal: LiteSignalReward;\n  overcharge: LiteOverchargeReward;\n  hiddenPocket:',
)
replace_once(
    'src/game/systems/drops.ts',
    '      signal: state.signal,\n      totalOpens:',
    '      signal: state.signal,\n      overchargeHundredths: state.overchargeHundredths,\n      totalOpens:',
)
replace_once(
    'src/game/systems/drops.ts',
    '    signal: resolved.signal.after,\n    activeLootPoolId:',
    '    signal: resolved.signal.after,\n    overchargeHundredths: resolved.overcharge.afterHundredths,\n    activeLootPoolId:',
)
replace_once(
    'src/game/systems/drops.ts',
    '    signal: resolved.signal,\n    hiddenPocket:',
    '    signal: resolved.signal,\n    overcharge: resolved.overcharge,\n    hiddenPocket:',
)

# openingSession.ts
replace_once(
    'src/game/systems/openingSession.ts',
    '  state.signal === pending.commit.signal &&\n  state.activeLootPoolId',
    '  state.signal === pending.commit.signal &&\n  state.overchargeHundredths === pending.commit.overchargeHundredths &&\n  state.activeLootPoolId',
)

# save.ts schema + validation + migrations.
replace_once('src/game/systems/save.ts', 'export const SAVE_VERSION = 2;', 'export const SAVE_VERSION = 3;')
replace_once(
    'src/game/systems/save.ts',
    "export const DEFAULT_CHIPS = 0;\nexport const DEFAULT_LOOT_POOL_ID",
    "export const DEFAULT_CHIPS = 0;\nexport const DEFAULT_OVERCHARGE_HUNDREDTHS = 100;\nexport const DEFAULT_LOOT_POOL_ID",
)
replace_once(
    'src/game/systems/save.ts',
    '  signal: number;\n  activeLootPoolId:',
    '  signal: number;\n  overchargeHundredths: number;\n  activeLootPoolId:',
)
replace_once(
    'src/game/systems/save.ts',
    '  signal: 0,\n  activeLootPoolId:',
    '  signal: 0,\n  overchargeHundredths: DEFAULT_OVERCHARGE_HUNDREDTHS,\n  activeLootPoolId:',
)
replace_once(
    'src/game/systems/save.ts',
    '    value.signal <= LITE_SIGNAL_THRESHOLD &&\n    typeof value.activeLootPoolId',
    '    value.signal <= LITE_SIGNAL_THRESHOLD &&\n    isNonNegativeInteger(value.overchargeHundredths) &&\n    value.overchargeHundredths >= DEFAULT_OVERCHARGE_HUNDREDTHS &&\n    (value.signal >= LITE_SIGNAL_THRESHOLD || value.overchargeHundredths === DEFAULT_OVERCHARGE_HUNDREDTHS) &&\n    typeof value.activeLootPoolId',
)
replace_once(
    'src/game/systems/save.ts',
    'const isPendingReveal = (value: unknown): value is PendingReveal => {\n  if (!isRecord(value) || !isRecord(value.chips) || !isRecord(value.signal)) return false;',
    'const isPendingReveal = (value: unknown): value is PendingReveal => {\n  if (!isRecord(value) || !isRecord(value.chips) || !isRecord(value.signal) || !isRecord(value.overcharge)) return false;',
)
replace_once(
    'src/game/systems/save.ts',
    '    isNonNegativeInteger(chips.recycle) &&\n    isNonNegativeInteger(chips.totalEarned) &&\n    isNonNegativeInteger(chips.after) &&\n    chips.before >= chips.cost &&\n    chips.totalEarned === chips.base + chips.cacheBonus + chips.recycle &&\n    chips.after === chips.before - chips.cost + chips.totalEarned;',
    '    isNonNegativeInteger(chips.recycle) &&\n    isNonNegativeInteger(chips.rawEarned) &&\n    isNonNegativeInteger(chips.overchargeBonus) &&\n    isNonNegativeInteger(chips.totalEarned) &&\n    isNonNegativeInteger(chips.after) &&\n    chips.before >= chips.cost &&\n    chips.rawEarned === chips.base + chips.cacheBonus + chips.recycle &&\n    chips.overchargeBonus === Math.round((chips.rawEarned * (value.overcharge.beforeHundredths - DEFAULT_OVERCHARGE_HUNDREDTHS)) / 100) &&\n    chips.totalEarned === chips.rawEarned + chips.overchargeBonus &&\n    chips.after === chips.before - chips.cost + chips.totalEarned;',
)
replace_once(
    'src/game/systems/save.ts',
    '  if (!chipsValid || !signalValid) return false;\n  const typedSignal = signal as unknown as PendingReveal[\'signal\'];\n  if (!isSignalTransitionConsistent(typedSignal, standard.isNew)) return false;\n\n  return (',
    '  const overcharge = value.overcharge;\n  const overchargeValid =\n    isNonNegativeInteger(overcharge.beforeHundredths) &&\n    overcharge.beforeHundredths >= DEFAULT_OVERCHARGE_HUNDREDTHS &&\n    isNonNegativeInteger(overcharge.afterHundredths) &&\n    overcharge.afterHundredths >= DEFAULT_OVERCHARGE_HUNDREDTHS &&\n    isNonNegativeInteger(overcharge.appliedGainHundredths);\n\n  if (!chipsValid || !signalValid || !overchargeValid) return false;\n  const typedSignal = signal as unknown as PendingReveal[\'signal\'];\n  if (!isSignalTransitionConsistent(typedSignal, standard.isNew)) return false;\n  if (typedSignal.lockArmedBefore === false && overcharge.beforeHundredths !== DEFAULT_OVERCHARGE_HUNDREDTHS) return false;\n  if (typedSignal.lockConsumed) {\n    if (overcharge.afterHundredths !== DEFAULT_OVERCHARGE_HUNDREDTHS || overcharge.appliedGainHundredths !== 0) return false;\n  } else if (typedSignal.lockRetained) {\n    if (overcharge.afterHundredths < overcharge.beforeHundredths || overcharge.appliedGainHundredths !== overcharge.afterHundredths - overcharge.beforeHundredths) return false;\n  } else if (overcharge.afterHundredths !== overcharge.beforeHundredths || overcharge.appliedGainHundredths !== 0) {\n    return false;\n  }\n\n  return (',
)
replace_once(
    'src/game/systems/save.ts',
    '    value.commit.signal === signal.after &&\n    value.commit.activeLootPoolId',
    '    value.commit.signal === signal.after &&\n    value.commit.overchargeHundredths === value.overcharge.afterHundredths &&\n    value.commit.activeLootPoolId',
)
replace_once(
    'src/game/systems/save.ts',
    '    pending.signal.before !== state.signal ||\n    pending.lootPoolId',
    '    pending.signal.before !== state.signal ||\n    pending.overcharge.beforeHundredths !== state.overchargeHundredths ||\n    pending.lootPoolId',
)
replace_once(
    'src/game/systems/save.ts',
    '    pending.commit.signal === pending.signal.after &&\n    pending.commit.activeLootPoolId',
    '    pending.commit.signal === pending.signal.after &&\n    pending.commit.overchargeHundredths === pending.overcharge.afterHundredths &&\n    pending.commit.activeLootPoolId',
)
replace_once(
    'src/game/systems/save.ts',
    '  signal: migrateLegacySignal(legacy.signal),\n  activeLootPoolId:',
    '  signal: migrateLegacySignal(legacy.signal),\n  overchargeHundredths: DEFAULT_OVERCHARGE_HUNDREDTHS,\n  activeLootPoolId:',
)
replace_once(
    'src/game/systems/save.ts',
    "      recycle: 0,\n      totalEarned: 0,",
    "      recycle: 0,\n      rawEarned: 0,\n      overchargeBonus: 0,\n      totalEarned: 0,",
)
replace_once(
    'src/game/systems/save.ts',
    '    signal: {\n      before: signalBefore,',
    '    signal: {\n      before: signalBefore,',
)
replace_once(
    'src/game/systems/save.ts',
    '    hiddenPocket: legacy.hiddenPocket ? { ...legacy.hiddenPocket } : null,',
    '    overcharge: {\n      beforeHundredths: DEFAULT_OVERCHARGE_HUNDREDTHS,\n      afterHundredths: DEFAULT_OVERCHARGE_HUNDREDTHS,\n      appliedGainHundredths: 0,\n    },\n    hiddenPocket: legacy.hiddenPocket ? { ...legacy.hiddenPocket } : null,',
)
# Add v2 neutral migration before parseCurrentSave.
append_before(
    'src/game/systems/save.ts',
    'const parseCurrentSave = (value: Record<string, unknown>): SaveState => {',
    r'''const migrateV2Save = (value: Record<string, unknown>): SaveState => {
  if (value.version !== 2) {
    throw new Error('Invalid V2 save payload');
  }

  let pendingReveal: unknown = value.pendingReveal;
  if (pendingReveal !== null) {
    if (!isRecord(pendingReveal) || !isRecord(pendingReveal.chips) || !isRecord(pendingReveal.commit)) {
      throw new Error('Invalid V2 pending reveal');
    }
    pendingReveal = {
      ...pendingReveal,
      chips: {
        ...pendingReveal.chips,
        rawEarned: pendingReveal.chips.totalEarned,
        overchargeBonus: 0,
      },
      overcharge: {
        beforeHundredths: DEFAULT_OVERCHARGE_HUNDREDTHS,
        afterHundredths: DEFAULT_OVERCHARGE_HUNDREDTHS,
        appliedGainHundredths: 0,
      },
      commit: {
        ...pendingReveal.commit,
        overchargeHundredths: DEFAULT_OVERCHARGE_HUNDREDTHS,
      },
    };
  }

  return parseCurrentSave({
    ...value,
    version: SAVE_VERSION,
    overchargeHundredths: DEFAULT_OVERCHARGE_HUNDREDTHS,
    pendingReveal,
  });
};

''',
)
replace_once(
    'src/game/systems/save.ts',
    '  if (value.version === 1) {\n    return parseLegacySave(value);\n  }\n  if (value.version === SAVE_VERSION) {',
    '  if (value.version === 1) {\n    return parseLegacySave(value);\n  }\n  if (value.version === 2) {\n    return migrateV2Save(value);\n  }\n  if (value.version === SAVE_VERSION) {',
)

# Tests: default pure reward state + new Overcharge cases.
replace_once(
    'tests/lite-pouches.test.ts',
    '  signal: 0,\n  totalOpens: 3,',
    '  signal: 0,\n  overchargeHundredths: 100,\n  totalOpens: 3,',
)
append_before(
    'tests/lite-pouches.test.ts',
    "  it('preserves onboarding protection and makes opening two use another family when possible', () => {",
    r'''  it('does not start Overcharge on the same opening that first reaches 4/4', () => {
    const result = resolveLitePouchReward({
      state: makeState({ signal: 3, discoveredStandard: ['camera-common'] }),
      pouchType: 'basic',
      registry: SLICE_REGISTRY,
      balance: LITE_V2_BALANCE,
      random: new SequenceRandom([0, 0, 0, 0, 0.999]),
    });

    expect(result.signal.lockReached).toBe(true);
    expect(result.overcharge).toEqual({
      beforeHundredths: 100,
      afterHundredths: 100,
      appliedGainHundredths: 0,
      bonusChips: 0,
    });
  });

  it('applies the existing multiplier first and only then gains from a retained Basic lock', () => {
    const state = makeState({
      signal: 4,
      overchargeHundredths: 110,
      discoveredStandard: allStandardIdsExcept('flip-phone-legendary'),
    });
    const result = resolveLitePouchReward({
      state,
      pouchType: 'basic',
      registry: SLICE_REGISTRY,
      balance: LITE_V2_BALANCE,
      random: new SequenceRandom([0, 0, 0, 0, 0.999]),
    });

    expect(result.signal.lockRetained).toBe(true);
    expect(result.chips.rawEarned).toBe(8);
    expect(result.chips.overchargeBonus).toBe(1);
    expect(result.chips.totalEarned).toBe(9);
    expect(result.overcharge).toMatchObject({
      beforeHundredths: 110,
      afterHundredths: 120,
      appliedGainHundredths: 10,
      bonusChips: 1,
    });
  });

  it('cashes out the current multiplier before a consuming lock resets Overcharge', () => {
    const result = resolveLitePouchReward({
      state: makeState({
        chips: 60,
        signal: 4,
        overchargeHundredths: 130,
        discoveredStandard: allStandardIdsExcept('flip-phone-legendary'),
      }),
      pouchType: 'charged',
      registry: SLICE_REGISTRY,
      balance: LITE_V2_BALANCE,
      random: new SequenceRandom([0, 0, 0, 0.999]),
    });

    expect(result.signal.lockConsumed).toBe(true);
    expect(result.chips.rawEarned).toBe(18);
    expect(result.chips.overchargeBonus).toBe(5);
    expect(result.overcharge).toMatchObject({
      beforeHundredths: 130,
      afterHundredths: 100,
      appliedGainHundredths: 0,
      bonusChips: 5,
    });
  });

  it('clamps a retained pouch gain to the actual remaining cap headroom', () => {
    const result = resolveLitePouchReward({
      state: makeState({
        chips: 60,
        signal: 4,
        overchargeHundredths: 140,
        discoveredStandard: allStandardIdsExcept(),
      }),
      pouchType: 'charged',
      registry: SLICE_REGISTRY,
      balance: LITE_V2_BALANCE,
      random: new SequenceRandom([0, 0, 0, 0, 0.999]),
    });

    expect(result.signal.lockRetained).toBe(true);
    expect(result.overcharge.afterHundredths).toBe(150);
    expect(result.overcharge.appliedGainHundredths).toBe(10);
  });

  it('keeps applying a MAX multiplier without inventing another gain', () => {
    const result = resolveLitePouchReward({
      state: makeState({
        signal: 4,
        overchargeHundredths: 150,
        discoveredStandard: allStandardIdsExcept(),
      }),
      pouchType: 'basic',
      registry: SLICE_REGISTRY,
      balance: LITE_V2_BALANCE,
      random: new SequenceRandom([0, 0, 0, 0, 0.999]),
    });

    expect(result.chips.rawEarned).toBe(8);
    expect(result.chips.overchargeBonus).toBe(4);
    expect(result.overcharge).toMatchObject({
      beforeHundredths: 150,
      afterHundredths: 150,
      appliedGainHundredths: 0,
      bonusChips: 4,
    });
  });

''',
)

# Save migration expectations.
replace_once(
    'tests/save-migration.test.ts',
    "      signal: 3,\n      activeLootPoolId:",
    "      signal: 3,\n      overchargeHundredths: 100,\n      activeLootPoolId:",
)
replace_once(
    'tests/save-migration.test.ts',
    "      recycle: 0,\n      totalEarned: 0,",
    "      recycle: 0,\n      rawEarned: 0,\n      overchargeBonus: 0,\n      totalEarned: 0,",
)
replace_once(
    'tests/save-migration.test.ts',
    "    expect(pending.signal).toMatchObject({",
    "    expect(pending.overcharge).toEqual({\n      beforeHundredths: 100,\n      afterHundredths: 100,\n      appliedGainHundredths: 0,\n    });\n    expect(pending.signal).toMatchObject({",
)
append_before(
    'tests/save-migration.test.ts',
    "  it('rejects a current pending transaction whose commit no longer matches its base collection', () => {",
    r'''  it('migrates an interrupted V2 pending reveal into neutral Overcharge without changing its reward', () => {
    const current = currentPendingState();
    const pending = current.pendingReveal!;
    const v2 = {
      ...current,
      version: 2,
      overchargeHundredths: undefined,
      pendingReveal: {
        ...pending,
        chips: {
          before: pending.chips.before,
          cost: pending.chips.cost,
          base: pending.chips.base,
          cacheTier: pending.chips.cacheTier,
          cacheBonus: pending.chips.cacheBonus,
          recycle: pending.chips.recycle,
          totalEarned: pending.chips.rawEarned,
          after: pending.chips.before - pending.chips.cost + pending.chips.rawEarned,
        },
        overcharge: undefined,
        commit: {
          ...pending.commit,
          chips: pending.chips.before - pending.chips.cost + pending.chips.rawEarned,
          overchargeHundredths: undefined,
        },
      },
    };
    delete (v2 as Record<string, unknown>).overchargeHundredths;
    delete (v2.pendingReveal as Record<string, unknown>).overcharge;
    delete (v2.pendingReveal.commit as Record<string, unknown>).overchargeHundredths;

    const migrated = parseSaveState(JSON.stringify(v2));
    expect(migrated.version).toBe(SAVE_VERSION);
    expect(migrated.overchargeHundredths).toBe(100);
    expect(migrated.pendingReveal?.chips.overchargeBonus).toBe(0);
    expect(migrated.pendingReveal?.overcharge).toEqual({
      beforeHundredths: 100,
      afterHundredths: 100,
      appliedGainHundredths: 0,
    });
  });

''',
)

# Session asserts durable multiplier too.
replace_once(
    'tests/opening-session.test.ts',
    '    expect(committed.signal).toBe(pending.signal.after);',
    '    expect(committed.signal).toBe(pending.signal.after);\n    expect(committed.overchargeHundredths).toBe(pending.overcharge.afterHundredths);',
)
