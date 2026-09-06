import type { StorageAdapter } from '../../platform/storage';
import { CHIPS_CACHE_TIER_IDS, POUCH_TYPES, type ChipsCacheTierId, type PouchType } from '../data/balance';
import { SLICE_LOOT_POOL_ID, STANDARD_RARITIES, type StandardRarity } from '../data/collectibles';
import type { PendingReveal } from './drops';
import { LITE_SIGNAL_THRESHOLD, migrateLegacySignal } from './signal';

export const SAVE_VERSION = 2;
export const DEFAULT_SAVE_KEY = 'mystery-pocket-tech.save';
export const DEFAULT_CHIPS = 0;
export const DEFAULT_LOOT_POOL_ID = SLICE_LOOT_POOL_ID;

export interface ProgressStats {
  duplicates: number;
  hiddenPockets: number;
}

export interface ProgressSnapshot {
  discoveredStandard: readonly string[];
  discoveredSecrets: readonly string[];
  chips: number;
  signal: number;
  activeLootPoolId: string;
  totalOpens: number;
  stats: ProgressStats;
}

export interface SaveState extends ProgressSnapshot {
  version: typeof SAVE_VERSION;
  pendingReveal: PendingReveal | null;
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
  activeLootPoolId: DEFAULT_LOOT_POOL_ID,
  totalOpens: 0,
  pendingReveal: null,
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

const isHiddenPocket = (value: unknown): value is PendingReveal['hiddenPocket'] =>
  value === null ||
  (isRecord(value) && typeof value.collectibleId === 'string' && typeof value.familyId === 'string');

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
    isHiddenPocket(value.hiddenPocket) &&
    isLegacyProgressSnapshot(value.commit) &&
    value.commit.totalOpens === value.openingNumber
  );
};

const isPendingReveal = (value: unknown): value is PendingReveal => {
  if (!isRecord(value) || !isRecord(value.chips) || !isRecord(value.signal)) return false;
  if (
    typeof value.id !== 'string' ||
    value.id.length === 0 ||
    !isNonNegativeInteger(value.baseTotalOpens) ||
    !isNonNegativeInteger(value.openingNumber) ||
    value.openingNumber !== value.baseTotalOpens + 1 ||
    !isPouchType(value.pouchType) ||
    typeof value.lootPoolId !== 'string' ||
    value.lootPoolId.length === 0 ||
    !isRevealStandard(value.standard) ||
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
    isNonNegativeInteger(chips.totalEarned) &&
    isNonNegativeInteger(chips.after) &&
    chips.before >= chips.cost &&
    chips.totalEarned === chips.base + chips.cacheBonus + chips.recycle &&
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

  return (
    chipsValid &&
    signalValid &&
    value.commit.totalOpens === value.openingNumber &&
    value.commit.chips === chips.after &&
    value.commit.signal === signal.after &&
    value.commit.activeLootPoolId === value.lootPoolId
  );
};

const migrateLegacyProgress = (legacy: LegacyProgressSnapshot): ProgressSnapshot => ({
  discoveredStandard: [...legacy.discoveredStandard],
  discoveredSecrets: [...legacy.discoveredSecrets],
  chips: DEFAULT_CHIPS,
  signal: migrateLegacySignal(legacy.signal),
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
    hiddenPocket: legacy.hiddenPocket ? { ...legacy.hiddenPocket } : null,
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
  return {
    version: SAVE_VERSION,
    ...progress,
    pendingReveal: legacy.pendingReveal ? migrateLegacyPending(legacy.pendingReveal, progress) : null,
    muted: legacy.muted,
  };
};

const parseCurrentSave = (value: Record<string, unknown>): SaveState => {
  if (
    value.version !== SAVE_VERSION ||
    !isProgressSnapshot(value) ||
    (value.pendingReveal !== null && !isPendingReveal(value.pendingReveal)) ||
    typeof value.muted !== 'boolean'
  ) {
    throw new Error('Invalid save payload');
  }

  const state = value as unknown as SaveState;
  if (state.pendingReveal) {
    const pending = state.pendingReveal;
    if (
      pending.baseTotalOpens !== state.totalOpens ||
      pending.chips.before !== state.chips ||
      pending.signal.before !== state.signal ||
      pending.lootPoolId !== state.activeLootPoolId
    ) {
      throw new Error('Pending reveal does not match its base save state');
    }
  }
  return state;
};

export const parseSaveState = (raw: string): SaveState => {
  const value: unknown = JSON.parse(raw);
  if (!isRecord(value)) {
    throw new Error('Invalid save payload');
  }
  if (value.version === 1) {
    return parseLegacySave(value);
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
  if (pendingReveal.baseTotalOpens !== state.totalOpens) {
    throw new Error('Pending reveal was generated from a stale save state');
  }
  if (
    pendingReveal.chips.before !== state.chips ||
    pendingReveal.signal.before !== state.signal ||
    pendingReveal.lootPoolId !== state.activeLootPoolId
  ) {
    throw new Error('Pending reveal economy base does not match save state');
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
  if (
    pending.baseTotalOpens !== state.totalOpens ||
    pending.chips.before !== state.chips ||
    pending.signal.before !== state.signal ||
    pending.lootPoolId !== state.activeLootPoolId
  ) {
    throw new Error('Pending reveal cannot be committed against a different save state');
  }

  return {
    version: SAVE_VERSION,
    ...pending.commit,
    pendingReveal: null,
    muted: state.muted,
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

    const parsed = parseSaveState(raw);
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
