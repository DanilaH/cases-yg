import type { StorageAdapter } from '../../platform/storage';
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

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((entry) => typeof entry === 'string');

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const parseSaveState = (raw: string): SaveState => {
  const value: unknown = JSON.parse(raw);
  if (!isRecord(value) || value.version !== SAVE_VERSION) {
    throw new Error('Unsupported or invalid save version');
  }

  if (
    !isStringArray(value.discoveredStandard) ||
    !isStringArray(value.discoveredSecrets) ||
    typeof value.signal !== 'number' ||
    !Number.isInteger(value.totalOpens) ||
    (value.pendingReveal !== null && !isRecord(value.pendingReveal)) ||
    typeof value.muted !== 'boolean' ||
    !isRecord(value.stats) ||
    !Number.isInteger(value.stats.duplicates) ||
    !Number.isInteger(value.stats.hiddenPockets)
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
