import type { StorageAdapter } from '../../platform/storage';
import { CHIPS_CACHE_TIER_IDS, POUCH_TYPES, type ChipsCacheTierId, type PouchType } from '../data/balance';
import { DEFAULT_LOOT_POOL_ID as GAME_DEFAULT_LOOT_POOL_ID, STANDARD_RARITIES, type StandardRarity } from '../data/collectibles';
import type { PendingReveal } from './drops';
import { LITE_SIGNAL_THRESHOLD, migrateLegacySignal } from './signal';

export const SAVE_VERSION = 5;
export const DEFAULT_SAVE_KEY = 'mystery-pocket-tech.save';
const SAVE_RECOVERY_SUFFIX = '.recovery';
export const DEFAULT_CHIPS = 0;
export const DEFAULT_OVERCHARGE_HUNDREDTHS = 100;
export const DEFAULT_LOOT_POOL_ID = GAME_DEFAULT_LOOT_POOL_ID;

export interface ProgressStats {
  duplicates: number;
  hiddenPockets: number;
}

export interface ProgressSnapshot {
  discoveredStandard: readonly string[];
  discoveredSecrets: readonly string[];
  chips: number;
  signal: number;
  overchargeHundredths: number;
  activeLootPoolId: string;
  totalOpens: number;
  stats: ProgressStats;
}

export interface PrimaryOnboardingState {
  primaryCompleted: boolean;
  firstRevealReceipt: PendingReveal | null;
}

export interface SaveState extends ProgressSnapshot {
  version: typeof SAVE_VERSION;
  pendingReveal: PendingReveal | null;
  onboarding: PrimaryOnboardingState;
  /** @deprecated compatibility only; runtime mute lives in the separate settings key. */
  muted: boolean;
}

interface LegacyProgressSnapshot {
  discoveredStandard: readonly string[];
  discoveredSecrets: readonly string[];
  signal: number;
  totalOpens: number;
  stats: ProgressStats;
}

interface LegacyPendingReveal {
  id: string;
  baseTotalOpens: number;
  openingNumber: number;
  standard: {
    collectibleId: string;
    familyId: string;
    rarity: StandardRarity;
    isNew: boolean;
  };
  signal: {
    before: number;
    after: number;
    gain: number;
    lockConsumed: boolean;
    lockReached: boolean;
  };
  hiddenPocket: { collectibleId: string; familyId: string } | null;
  commit: LegacyProgressSnapshot;
}

interface LegacySaveState extends LegacyProgressSnapshot {
  version: 1;
  pendingReveal: LegacyPendingReveal | null;
  muted: boolean;
}

export const createInitialSaveState = (): SaveState => ({
  version: SAVE_VERSION,
  discoveredStandard: [],
  discoveredSecrets: [],
  chips: DEFAULT_CHIPS,
  signal: 0,
  overchargeHundredths: DEFAULT_OVERCHARGE_HUNDREDTHS,
  activeLootPoolId: DEFAULT_LOOT_POOL_ID,
  totalOpens: 0,
  pendingReveal: null,
  onboarding: {
    primaryCompleted: false,
    firstRevealReceipt: null,
  },
  muted: false,
  stats: {
    duplicates: 0,
    hiddenPockets: 0,
  },
});

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isNonNegativeInteger = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value >= 0;

const isNonNegativeFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0;

const isUniqueStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) &&
  value.every((entry) => typeof entry === 'string') &&
  new Set(value).size === value.length;

const sameStrings = (left: readonly string[], right: readonly string[]): boolean =>
  left.length === right.length && left.every((value, index) => value === right[index]);

const isStats = (value: unknown): value is ProgressStats =>
  isRecord(value) && isNonNegativeInteger(value.duplicates) && isNonNegativeInteger(value.hiddenPockets);

const isStandardRarity = (value: unknown): value is StandardRarity =>
  typeof value === 'string' && STANDARD_RARITIES.includes(value as StandardRarity);

const isPouchType = (value: unknown): value is PouchType =>
  typeof value === 'string' && POUCH_TYPES.includes(value as PouchType);

const isCacheTier = (value: unknown): value is ChipsCacheTierId =>
  typeof value === 'string' && CHIPS_CACHE_TIER_IDS.includes(value as ChipsCacheTierId);

const isLegacyProgressSnapshot = (value: unknown): value is LegacyProgressSnapshot => {
  if (!isRecord(value) || !isStats(value.stats)) return false;
  return (
    isUniqueStringArray(value.discoveredStandard) &&
    isUniqueStringArray(value.discoveredSecrets) &&
    isNonNegativeFiniteNumber(value.signal) &&
    isNonNegativeInteger(value.totalOpens)
  );
};

const isProgressSnapshot = (value: unknown): value is ProgressSnapshot => {
  if (!isRecord(value) || !isStats(value.stats)) return false;
  return (
    isUniqueStringArray(value.discoveredStandard) &&
    isUniqueStringArray(value.discoveredSecrets) &&
    isNonNegativeInteger(value.chips) &&
    isNonNegativeInteger(value.signal) &&
    value.signal <= LITE_SIGNAL_THRESHOLD &&
    isNonNegativeInteger(value.overchargeHundredths) &&
    value.overchargeHundredths >= DEFAULT_OVERCHARGE_HUNDREDTHS &&
    (value.signal >= LITE_SIGNAL_THRESHOLD || value.overchargeHundredths === DEFAULT_OVERCHARGE_HUNDREDTHS) &&
    typeof value.activeLootPoolId === 'string' &&
    value.activeLootPoolId.length > 0 &&
    isNonNegativeInteger(value.totalOpens)
  );
};

const isRevealStandard = (value: unknown): value is PendingReveal['standard'] =>
  isRecord(value) &&
  typeof value.collectibleId === 'string' &&
  typeof value.familyId === 'string' &&
  isStandardRarity(value.rarity) &&
  typeof value.isNew === 'boolean';

const isLegacyHiddenPocket = (value: unknown): value is LegacyPendingReveal['hiddenPocket'] =>
  value === null ||
  (isRecord(value) && typeof value.collectibleId === 'string' && typeof value.familyId === 'string');

const isHiddenPocket = (value: unknown): value is PendingReveal['hiddenPocket'] =>
  value === null ||
  (isRecord(value) &&
    typeof value.collectibleId === 'string' &&
    typeof value.familyId === 'string' &&
    typeof value.isNew === 'boolean' &&
    isNonNegativeInteger(value.bonusChips));

const isLegacyPendingReveal = (value: unknown): value is LegacyPendingReveal => {
  if (!isRecord(value) || !isRecord(value.signal)) return false;
  return (
    typeof value.id === 'string' &&
    value.id.length > 0 &&
    isNonNegativeInteger(value.baseTotalOpens) &&
    isNonNegativeInteger(value.openingNumber) &&
    value.openingNumber === value.baseTotalOpens + 1 &&
    isRevealStandard(value.standard) &&
    isNonNegativeFiniteNumber(value.signal.before) &&
    isNonNegativeFiniteNumber(value.signal.after) &&
    isNonNegativeFiniteNumber(value.signal.gain) &&
    typeof value.signal.lockConsumed === 'boolean' &&
    typeof value.signal.lockReached === 'boolean' &&
    isLegacyHiddenPocket(value.hiddenPocket) &&
    isLegacyProgressSnapshot(value.commit) &&
    value.commit.totalOpens === value.openingNumber
  );
};

const isSignalTransitionConsistent = (
  signal: PendingReveal['signal'],
  standardIsNew: boolean,
): boolean => {
  const lockArmedBefore = signal.before >= LITE_SIGNAL_THRESHOLD;
  if (signal.lockArmedBefore !== lockArmedBefore) return false;

  if (signal.lockConsumed) {
    return (
      lockArmedBefore &&
      signal.after === 0 &&
      signal.gain === 0 &&
      !signal.lockReached &&
      !signal.lockRetained
    );
  }

  if (signal.lockRetained) {
    return (
      lockArmedBefore &&
      signal.after === signal.before &&
      signal.gain === 0 &&
      !signal.lockReached
    );
  }

  if (lockArmedBefore) return false;
  if (signal.after < signal.before || signal.after > Math.min(LITE_SIGNAL_THRESHOLD, signal.before + 1)) {
    return false;
  }
  if (signal.gain !== signal.after - signal.before) return false;
  if (standardIsNew && signal.gain !== 0) return false;

  const lockReached = signal.before < LITE_SIGNAL_THRESHOLD && signal.after >= LITE_SIGNAL_THRESHOLD;
  return signal.lockReached === lockReached;
};

const isPendingReveal = (value: unknown): value is PendingReveal => {
  if (!isRecord(value) || !isRecord(value.chips) || !isRecord(value.signal) || !isRecord(value.overcharge)) return false;
  const standard = value.standard;
  if (
    typeof value.id !== 'string' ||
    value.id.length === 0 ||
    !isNonNegativeInteger(value.baseTotalOpens) ||
    !isNonNegativeInteger(value.openingNumber) ||
    value.openingNumber !== value.baseTotalOpens + 1 ||
    !isPouchType(value.pouchType) ||
    typeof value.lootPoolId !== 'string' ||
    value.lootPoolId.length === 0 ||
    !isRevealStandard(standard) ||
    !isHiddenPocket(value.hiddenPocket) ||
    !isProgressSnapshot(value.commit)
  ) {
    return false;
  }

  const chips = value.chips;
  const signal = value.signal;
  const chipsValid =
    isNonNegativeInteger(chips.before) &&
    isNonNegativeInteger(chips.cost) &&
    isNonNegativeInteger(chips.base) &&
    isCacheTier(chips.cacheTier) &&
    isNonNegativeInteger(chips.cacheBonus) &&
    isNonNegativeInteger(chips.recycle) &&
    isNonNegativeInteger(chips.rawEarned) &&
    isNonNegativeInteger(chips.overchargeBonus) &&
    isNonNegativeInteger(chips.secretBonus) &&
    isNonNegativeInteger(chips.totalEarned) &&
    isNonNegativeInteger(chips.after) &&
    chips.before >= chips.cost &&
    chips.rawEarned === chips.base + chips.cacheBonus + chips.recycle &&
    chips.overchargeBonus === Math.round((chips.rawEarned * (Number(value.overcharge.beforeHundredths) - DEFAULT_OVERCHARGE_HUNDREDTHS)) / 100) &&
    chips.secretBonus === (value.hiddenPocket ? Number(value.hiddenPocket.bonusChips) : 0) &&
    chips.totalEarned === chips.rawEarned + chips.overchargeBonus + chips.secretBonus &&
    chips.after === chips.before - chips.cost + chips.totalEarned;
  const signalValid =
    isNonNegativeInteger(signal.before) &&
    signal.before <= LITE_SIGNAL_THRESHOLD &&
    isNonNegativeInteger(signal.after) &&
    signal.after <= LITE_SIGNAL_THRESHOLD &&
    isNonNegativeInteger(signal.gain) &&
    typeof signal.lockArmedBefore === 'boolean' &&
    typeof signal.lockConsumed === 'boolean' &&
    typeof signal.lockReached === 'boolean' &&
    typeof signal.lockRetained === 'boolean';

  const overcharge = value.overcharge;
  const overchargeValid =
    isNonNegativeInteger(overcharge.beforeHundredths) &&
    overcharge.beforeHundredths >= DEFAULT_OVERCHARGE_HUNDREDTHS &&
    isNonNegativeInteger(overcharge.afterHundredths) &&
    overcharge.afterHundredths >= DEFAULT_OVERCHARGE_HUNDREDTHS &&
    isNonNegativeInteger(overcharge.appliedGainHundredths) &&
    isNonNegativeInteger(overcharge.bonusChips);

  if (!chipsValid || !signalValid || !overchargeValid) return false;
  const typedSignal = signal as unknown as PendingReveal['signal'];
  const typedOvercharge = overcharge as unknown as PendingReveal['overcharge'];
  if (!isSignalTransitionConsistent(typedSignal, standard.isNew)) return false;
  if (typedOvercharge.bonusChips !== chips.overchargeBonus) return false;
  if (typedSignal.lockArmedBefore === false && typedOvercharge.beforeHundredths !== DEFAULT_OVERCHARGE_HUNDREDTHS) return false;
  if (typedSignal.lockConsumed) {
    if (typedOvercharge.afterHundredths !== DEFAULT_OVERCHARGE_HUNDREDTHS || typedOvercharge.appliedGainHundredths !== 0) return false;
  } else if (typedSignal.lockRetained) {
    if (typedOvercharge.afterHundredths < typedOvercharge.beforeHundredths || typedOvercharge.appliedGainHundredths !== typedOvercharge.afterHundredths - typedOvercharge.beforeHundredths) return false;
  } else if (typedOvercharge.afterHundredths !== typedOvercharge.beforeHundredths || typedOvercharge.appliedGainHundredths !== 0) {
    return false;
  }

  return (
    value.commit.totalOpens === value.openingNumber &&
    value.commit.chips === chips.after &&
    value.commit.signal === signal.after &&
    value.commit.overchargeHundredths === value.overcharge.afterHundredths &&
    value.commit.activeLootPoolId === value.lootPoolId
  );
};

const isPrimaryOnboardingState = (value: unknown): value is PrimaryOnboardingState =>
  isRecord(value) &&
  typeof value.primaryCompleted === 'boolean' &&
  (value.firstRevealReceipt === null || isPendingReveal(value.firstRevealReceipt));

const revealCommitMatchesState = (state: SaveState, receipt: PendingReveal): boolean =>
  state.pendingReveal === null &&
  state.totalOpens === receipt.commit.totalOpens &&
  state.chips === receipt.commit.chips &&
  state.signal === receipt.commit.signal &&
  state.overchargeHundredths === receipt.commit.overchargeHundredths &&
  state.activeLootPoolId === receipt.commit.activeLootPoolId &&
  state.stats.duplicates === receipt.commit.stats.duplicates &&
  state.stats.hiddenPockets === receipt.commit.stats.hiddenPockets &&
  sameStrings(state.discoveredStandard, receipt.commit.discoveredStandard) &&
  sameStrings(state.discoveredSecrets, receipt.commit.discoveredSecrets);

const pendingMatchesBaseState = (state: SaveState, pending: PendingReveal): boolean => {
  if (
    pending.baseTotalOpens !== state.totalOpens ||
    pending.openingNumber !== state.totalOpens + 1 ||
    pending.chips.before !== state.chips ||
    pending.signal.before !== state.signal ||
    pending.overcharge.beforeHundredths !== state.overchargeHundredths ||
    pending.lootPoolId !== state.activeLootPoolId
  ) {
    return false;
  }

  const standardAlreadyOwned = state.discoveredStandard.includes(pending.standard.collectibleId);
  if (pending.standard.isNew === standardAlreadyOwned) return false;
  const expectedStandard = pending.standard.isNew
    ? [...state.discoveredStandard, pending.standard.collectibleId]
    : [...state.discoveredStandard];

  const hiddenAlreadyOwned = pending.hiddenPocket
    ? state.discoveredSecrets.includes(pending.hiddenPocket.collectibleId)
    : false;
  if (pending.hiddenPocket && pending.hiddenPocket.isNew === hiddenAlreadyOwned) return false;
  const expectedSecrets = pending.hiddenPocket?.isNew
    ? [...state.discoveredSecrets, pending.hiddenPocket.collectibleId]
    : [...state.discoveredSecrets];

  return (
    sameStrings(pending.commit.discoveredStandard, expectedStandard) &&
    sameStrings(pending.commit.discoveredSecrets, expectedSecrets) &&
    pending.commit.chips === pending.chips.after &&
    pending.commit.signal === pending.signal.after &&
    pending.commit.overchargeHundredths === pending.overcharge.afterHundredths &&
    pending.commit.activeLootPoolId === pending.lootPoolId &&
    pending.commit.totalOpens === pending.openingNumber &&
    pending.commit.stats.duplicates === state.stats.duplicates + (pending.standard.isNew ? 0 : 1) &&
    pending.commit.stats.hiddenPockets === state.stats.hiddenPockets + (pending.hiddenPocket ? 1 : 0)
  );
};

const validateSaveState = (state: SaveState): SaveState => {
  if (state.pendingReveal && !pendingMatchesBaseState(state, state.pendingReveal)) {
    throw new Error('Pending reveal does not match its base save state');
  }

  const onboarding = state.onboarding;
  if (onboarding.primaryCompleted && onboarding.firstRevealReceipt !== null) {
    throw new Error('Completed onboarding cannot retain a first reveal receipt');
  }
  if (onboarding.firstRevealReceipt) {
    const receipt = onboarding.firstRevealReceipt;
    if (receipt.openingNumber !== 1 || receipt.baseTotalOpens !== 0 || !revealCommitMatchesState(state, receipt)) {
      throw new Error('Primary onboarding receipt does not match committed save state');
    }
  }
  return state;
};

const migrateLegacyProgress = (legacy: LegacyProgressSnapshot): ProgressSnapshot => ({
  discoveredStandard: [...legacy.discoveredStandard],
  discoveredSecrets: [...legacy.discoveredSecrets],
  chips: DEFAULT_CHIPS,
  signal: migrateLegacySignal(legacy.signal),
  overchargeHundredths: DEFAULT_OVERCHARGE_HUNDREDTHS,
  activeLootPoolId: DEFAULT_LOOT_POOL_ID,
  totalOpens: legacy.totalOpens,
  stats: { ...legacy.stats },
});

const migrateLegacyPending = (legacy: LegacyPendingReveal, outer: ProgressSnapshot): PendingReveal => {
  const commit = migrateLegacyProgress(legacy.commit);
  const signalBefore = migrateLegacySignal(legacy.signal.before);
  const signalAfter = migrateLegacySignal(legacy.signal.after);
  const lockConsumed = legacy.signal.lockConsumed;

  return {
    id: legacy.id,
    baseTotalOpens: legacy.baseTotalOpens,
    pouchType: 'basic',
    lootPoolId: DEFAULT_LOOT_POOL_ID,
    openingNumber: legacy.openingNumber,
    standard: { ...legacy.standard },
    chips: {
      before: outer.chips,
      cost: 0,
      base: 0,
      cacheTier: 'none',
      cacheBonus: 0,
      recycle: 0,
      rawEarned: 0,
      overchargeBonus: 0,
      secretBonus: 0,
      totalEarned: 0,
      after: outer.chips,
    },
    signal: {
      before: signalBefore,
      after: signalAfter,
      gain: lockConsumed ? 0 : Math.max(0, signalAfter - signalBefore),
      lockArmedBefore: signalBefore >= LITE_SIGNAL_THRESHOLD,
      lockConsumed,
      lockReached: !lockConsumed && signalBefore < LITE_SIGNAL_THRESHOLD && signalAfter >= LITE_SIGNAL_THRESHOLD,
      lockRetained: !lockConsumed && signalBefore >= LITE_SIGNAL_THRESHOLD && signalAfter >= LITE_SIGNAL_THRESHOLD,
    },
    overcharge: {
      beforeHundredths: DEFAULT_OVERCHARGE_HUNDREDTHS,
      afterHundredths: DEFAULT_OVERCHARGE_HUNDREDTHS,
      appliedGainHundredths: 0,
      bonusChips: 0,
    },
    hiddenPocket: legacy.hiddenPocket ? { ...legacy.hiddenPocket, isNew: true, bonusChips: 0 } : null,
    commit: {
      ...commit,
      chips: outer.chips,
      activeLootPoolId: DEFAULT_LOOT_POOL_ID,
    },
  };
};

const parseLegacySave = (value: Record<string, unknown>): SaveState => {
  if (
    value.version !== 1 ||
    !isLegacyProgressSnapshot(value) ||
    (value.pendingReveal !== null && !isLegacyPendingReveal(value.pendingReveal)) ||
    typeof value.muted !== 'boolean'
  ) {
    throw new Error('Invalid legacy save payload');
  }

  const legacy = value as unknown as LegacySaveState;
  const progress = migrateLegacyProgress(legacy);
  return validateSaveState({
    version: SAVE_VERSION,
    ...progress,
    pendingReveal: legacy.pendingReveal ? migrateLegacyPending(legacy.pendingReveal, progress) : null,
    onboarding: {
      primaryCompleted: progress.totalOpens > 0,
      firstRevealReceipt: null,
    },
    muted: legacy.muted,
  });
};

const migrateV2Save = (value: Record<string, unknown>): SaveState => {
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
        bonusChips: 0,
      },
      commit: {
        ...pendingReveal.commit,
        overchargeHundredths: DEFAULT_OVERCHARGE_HUNDREDTHS,
      },
    };
  }

  return migrateV3Save({
    ...value,
    version: 3,
    overchargeHundredths: DEFAULT_OVERCHARGE_HUNDREDTHS,
    pendingReveal,
  });
};

const migrateV3Save = (value: Record<string, unknown>): SaveState => {
  if (value.version !== 3) {
    throw new Error('Invalid V3 save payload');
  }

  let pendingReveal: unknown = value.pendingReveal;
  if (pendingReveal !== null) {
    if (!isRecord(pendingReveal) || !isRecord(pendingReveal.chips)) {
      throw new Error('Invalid V3 pending reveal');
    }
    const hiddenPocket = pendingReveal.hiddenPocket;
    if (hiddenPocket !== null && !isLegacyHiddenPocket(hiddenPocket)) {
      throw new Error('Invalid V3 Hidden Pocket');
    }
    pendingReveal = {
      ...pendingReveal,
      chips: {
        ...pendingReveal.chips,
        // Pre-correction staged reveals keep their exact old wallet outcome.
        secretBonus: 0,
      },
      hiddenPocket: hiddenPocket ? { ...hiddenPocket, isNew: true, bonusChips: 0 } : null,
    };
  }

  return migrateV4Save({
    ...value,
    version: 4,
    pendingReveal,
  });
};

const migrateV4Save = (value: Record<string, unknown>): SaveState => {
  if (value.version !== 4) {
    throw new Error('Invalid V4 save payload');
  }

  const primaryCompleted = isNonNegativeInteger(value.totalOpens) && value.totalOpens > 0;
  return parseCurrentSave({
    ...value,
    version: SAVE_VERSION,
    onboarding: {
      primaryCompleted,
      firstRevealReceipt: null,
    },
  });
};

const parseCurrentSave = (value: Record<string, unknown>): SaveState => {
  if (
    value.version !== SAVE_VERSION ||
    !isProgressSnapshot(value) ||
    (value.pendingReveal !== null && !isPendingReveal(value.pendingReveal)) ||
    !isPrimaryOnboardingState(value.onboarding) ||
    typeof value.muted !== 'boolean'
  ) {
    throw new Error('Invalid save payload');
  }

  return validateSaveState(value as unknown as SaveState);
};

const createRepairableCurrentBase = (value: Record<string, unknown>): SaveState | null => {
  if (value.version !== SAVE_VERSION || !isProgressSnapshot(value) || typeof value.muted !== 'boolean') {
    return null;
  }

  return {
    version: SAVE_VERSION,
    discoveredStandard: [...value.discoveredStandard],
    discoveredSecrets: [...value.discoveredSecrets],
    chips: value.chips,
    signal: value.signal,
    overchargeHundredths: value.overchargeHundredths,
    activeLootPoolId: value.activeLootPoolId,
    totalOpens: value.totalOpens,
    pendingReveal: null,
    onboarding: {
      primaryCompleted: value.totalOpens > 0,
      firstRevealReceipt: null,
    },
    muted: value.muted,
    stats: { ...value.stats },
  };
};

/**
 * Salvages only current-version saves whose durable progression snapshot is
 * still valid. Transient transaction/tutorial evidence is retained only when it
 * independently validates against that snapshot; otherwise it is discarded.
 *
 * This deliberately does not repair malformed JSON, unknown versions, or an
 * invalid durable progression snapshot. Those cases remain hard failures because
 * guessing could duplicate or erase economy state.
 */
const repairCurrentSave = (value: Record<string, unknown>): SaveState | null => {
  const base = createRepairableCurrentBase(value);
  if (!base) return null;

  let pendingReveal: PendingReveal | null = null;
  if (value.pendingReveal !== null && value.pendingReveal !== undefined && isPendingReveal(value.pendingReveal)) {
    const pendingCandidate: SaveState = { ...base, pendingReveal: value.pendingReveal };
    try {
      validateSaveState(pendingCandidate);
      pendingReveal = value.pendingReveal;
    } catch {
      // The durable base snapshot wins over an irreconcilable staged transaction.
    }
  }

  const fallback: SaveState = { ...base, pendingReveal };
  if (isPrimaryOnboardingState(value.onboarding)) {
    const candidate: SaveState = { ...fallback, onboarding: value.onboarding };
    try {
      return validateSaveState(candidate);
    } catch {
      // Keep durable progression and fall back to conservative onboarding state.
    }
  }

  return validateSaveState(fallback);
};

export const parseSaveState = (raw: string): SaveState => {
  const value: unknown = JSON.parse(raw);
  if (!isRecord(value)) {
    throw new Error('Invalid save payload');
  }
  if (value.version === 1) {
    return parseLegacySave(value);
  }
  if (value.version === 2) {
    return migrateV2Save(value);
  }
  if (value.version === 3) {
    return migrateV3Save(value);
  }
  if (value.version === 4) {
    return migrateV4Save(value);
  }
  if (value.version === SAVE_VERSION) {
    return parseCurrentSave(value);
  }
  throw new Error('Unsupported or invalid save version');
};

export const stagePendingReveal = (state: SaveState, pendingReveal: PendingReveal): SaveState => {
  if (state.pendingReveal) {
    throw new Error('Cannot create a new reveal while another reveal is pending');
  }
  if (!pendingMatchesBaseState(state, pendingReveal)) {
    throw new Error('Pending reveal transaction does not match save state');
  }

  return {
    ...state,
    pendingReveal,
  };
};

export const commitPendingRevealState = (state: SaveState): SaveState => {
  const pending = state.pendingReveal;
  if (!pending) {
    return state;
  }
  if (!pendingMatchesBaseState(state, pending)) {
    throw new Error('Pending reveal cannot be committed against a different save state');
  }

  const onboarding: PrimaryOnboardingState =
    !state.onboarding.primaryCompleted && pending.openingNumber === 1
      ? { primaryCompleted: false, firstRevealReceipt: pending }
      : state.onboarding;

  return {
    version: SAVE_VERSION,
    ...pending.commit,
    pendingReveal: null,
    onboarding,
    muted: state.muted,
  };
};

export const completePrimaryOnboardingState = (state: SaveState): SaveState => {
  if (state.onboarding.primaryCompleted) return state;
  const receipt = state.onboarding.firstRevealReceipt;
  if (!receipt || receipt.openingNumber !== 1 || !revealCommitMatchesState(state, receipt)) {
    throw new Error('Primary onboarding cannot complete without its committed first reveal receipt');
  }

  return {
    ...state,
    onboarding: {
      primaryCompleted: true,
      firstRevealReceipt: null,
    },
  };
};

export class SaveRepository {
  public constructor(
    private readonly storage: StorageAdapter,
    private readonly key = DEFAULT_SAVE_KEY,
  ) {}

  public async load(): Promise<SaveState> {
    const raw = await this.storage.getItem(this.key);
    if (raw === null) {
      return createInitialSaveState();
    }

    let parsed: SaveState;
    try {
      parsed = parseSaveState(raw);
    } catch (error: unknown) {
      let rawValue: unknown;
      try {
        rawValue = JSON.parse(raw);
      } catch {
        throw error;
      }

      const repaired = isRecord(rawValue) ? repairCurrentSave(rawValue) : null;
      if (!repaired) throw error;

      try {
        await this.storage.setItem(`${this.key}${SAVE_RECOVERY_SUFFIX}`, raw);
      } catch (backupError: unknown) {
        console.warn('[save] failed to preserve recovery backup', backupError);
      }

      await this.write(repaired);
      console.warn('[save] self-healed recoverable current save payload', error);
      return repaired;
    }

    const rawValue: unknown = JSON.parse(raw);
    if (isRecord(rawValue) && rawValue.version !== SAVE_VERSION) {
      await this.write(parsed);
    }
    return parsed;
  }

  public async write(state: SaveState): Promise<void> {
    parseCurrentSave(state as unknown as Record<string, unknown>);
    await this.storage.setItem(this.key, JSON.stringify(state));
  }

  public async beginPending(state: SaveState, pendingReveal: PendingReveal): Promise<SaveState> {
    const staged = stagePendingReveal(state, pendingReveal);
    await this.write(staged);
    return staged;
  }

  public async commitPending(state: SaveState): Promise<SaveState> {
    if (!state.pendingReveal) {
      return state;
    }
    const committed = commitPendingRevealState(state);
    await this.write(committed);
    return committed;
  }
}
