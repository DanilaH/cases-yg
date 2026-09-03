import type { StorageAdapter } from '../../platform/storage';
import { STANDARD_RARITIES } from '../data/collectibles';
import type { PendingReveal } from './drops';

export const SAVE_VERSION = 1;
export const DEFAULT_SAVE_KEY = 'mystery-pocket-tech.save';

export interface ProgressStats {
  duplicates: number;
  hiddenPockets: number;
}

export interface ProgressSnapshot {
  discoveredStandard: readonly string[];
  discoveredSecrets: readonly string[];
  signal: number;
  totalOpens: number;
  stats: ProgressStats;
}

export interface SaveState extends ProgressSnapshot {
  version: typeof SAVE_VERSION;
  pendingReveal: PendingReveal | null;
  /** @deprecated v1 compatibility only; runtime mute lives in the separate settings key. */
  muted: boolean;
}

export const createInitialSaveState = (): SaveState => ({
  version: SAVE_VERSION,
  discoveredStandard: [],
  discoveredSecrets: [],
  signal: 0,
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

const isProgressSnapshot = (value: unknown): value is ProgressSnapshot => {
  if (!isRecord(value) || !isRecord(value.stats)) return false;
  return (
    isUniqueStringArray(value.discoveredStandard) &&
    isUniqueStringArray(value.discoveredSecrets) &&
    isNonNegativeFiniteNumber(value.signal) &&
    isNonNegativeInteger(value.totalOpens) &&
    isNonNegativeInteger(value.stats.duplicates) &&
    isNonNegativeInteger(value.stats.hiddenPockets)
  );
};

const isPendingReveal = (value: unknown): value is PendingReveal => {
  if (!isRecord(value) || !isRecord(value.standard) || !isRecord(value.signal)) return false;
  const hiddenPocket = value.hiddenPocket;
  const hiddenPocketValid =
    hiddenPocket === null ||
    (isRecord(hiddenPocket) &&
      typeof hiddenPocket.collectibleId === 'string' &&
      typeof hiddenPocket.familyId === 'string');
  const rarityValid =
    typeof value.standard.rarity === 'string' && STANDARD_RARITIES.includes(value.standard.rarity as never);

  return (
    typeof value.id === 'string' &&
    value.id.length > 0 &&
    isNonNegativeInteger(value.baseTotalOpens) &&
    isNonNegativeInteger(value.openingNumber) &&
    value.openingNumber === value.baseTotalOpens + 1 &&
    typeof value.standard.collectibleId === 'string' &&
    typeof value.standard.familyId === 'string' &&
    rarityValid &&
    typeof value.standard.isNew === 'boolean' &&
    isNonNegativeFiniteNumber(value.signal.before) &&
    isNonNegativeFiniteNumber(value.signal.after) &&
    isNonNegativeFiniteNumber(value.signal.gain) &&
    typeof value.signal.lockConsumed === 'boolean' &&
    typeof value.signal.lockReached === 'boolean' &&
    hiddenPocketValid &&
    isProgressSnapshot(value.commit) &&
    value.commit.totalOpens === value.openingNumber
  );
};

export const parseSaveState = (raw: string): SaveState => {
  const value: unknown = JSON.parse(raw);
  if (!isRecord(value) || value.version !== SAVE_VERSION) {
    throw new Error('Unsupported or invalid save version');
  }

  if (
    !isProgressSnapshot(value) ||
    (value.pendingReveal !== null && !isPendingReveal(value.pendingReveal)) ||
    typeof value.muted !== 'boolean'
  ) {
    throw new Error('Invalid save payload');
  }

  return value as unknown as SaveState;
};

export const stagePendingReveal = (state: SaveState, pendingReveal: PendingReveal): SaveState => {
  if (state.pendingReveal) {
    throw new Error('Cannot create a new reveal while another reveal is pending');
  }
  if (pendingReveal.baseTotalOpens !== state.totalOpens) {
    throw new Error('Pending reveal was generated from a stale save state');
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
  if (pending.baseTotalOpens !== state.totalOpens) {
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
    return raw === null ? createInitialSaveState() : parseSaveState(raw);
  }

  public async write(state: SaveState): Promise<void> {
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
