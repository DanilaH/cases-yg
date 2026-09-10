import type { LiteBalanceConfig, PouchType } from '../data/balance';
import type { ContentRegistry, LootPoolId } from '../data/collectibles';
import { createPendingReveal, type PendingReveal } from './drops';
import type { RandomSource } from './random';
import { SaveRepository, type SaveState } from './save';

export type TransactionIdFactory = () => string;

export const createRevealTransactionId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `reveal-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

export interface OpeningSessionOptions {
  repository: SaveRepository;
  registry: ContentRegistry;
  balance: LiteBalanceConfig;
  random: RandomSource;
  createTransactionId?: TransactionIdFactory;
}

const sameStrings = (left: readonly string[], right: readonly string[]): boolean =>
  left.length === right.length && left.every((value, index) => value === right[index]);

const matchesCommittedPending = (state: SaveState, pending: PendingReveal): boolean =>
  state.pendingReveal === null &&
  state.totalOpens === pending.commit.totalOpens &&
  state.chips === pending.commit.chips &&
  state.signal === pending.commit.signal &&
  state.overchargeHundredths === pending.commit.overchargeHundredths &&
  state.activeLootPoolId === pending.commit.activeLootPoolId &&
  state.stats.duplicates === pending.commit.stats.duplicates &&
  state.stats.hiddenPockets === pending.commit.stats.hiddenPockets &&
  sameStrings(state.discoveredStandard, pending.commit.discoveredStandard) &&
  sameStrings(state.discoveredSecrets, pending.commit.discoveredSecrets);

const matchesLootPoolSwitch = (before: SaveState, after: SaveState, lootPoolId: LootPoolId): boolean =>
  after.pendingReveal === null &&
  after.version === before.version &&
  after.muted === before.muted &&
  after.activeLootPoolId === lootPoolId &&
  after.totalOpens === before.totalOpens &&
  after.chips === before.chips &&
  after.signal === before.signal &&
  after.overchargeHundredths === before.overchargeHundredths &&
  after.stats.duplicates === before.stats.duplicates &&
  after.stats.hiddenPockets === before.stats.hiddenPockets &&
  sameStrings(after.discoveredStandard, before.discoveredStandard) &&
  sameStrings(after.discoveredSecrets, before.discoveredSecrets);

export class OpeningSession {
  private state: SaveState | null = null;
  private readonly createTransactionId: TransactionIdFactory;

  public constructor(private readonly options: OpeningSessionOptions) {
    this.createTransactionId = options.createTransactionId ?? createRevealTransactionId;
  }

  public async load(): Promise<SaveState> {
    this.state = await this.options.repository.load();
    return this.state;
  }

  public getState(): SaveState {
    if (!this.state) {
      throw new Error('Opening session accessed before load');
    }
    return this.state;
  }

  public getPendingReveal(): PendingReveal | null {
    return this.getState().pendingReveal;
  }

  public async selectLootPool(lootPoolId: LootPoolId): Promise<SaveState> {
    const current = this.getState();
    if (!this.options.registry.lootPoolById.has(lootPoolId)) {
      throw new Error(`Unknown loot pool: ${lootPoolId}`);
    }
    if (current.pendingReveal) {
      throw new Error('Cannot switch loot pool while a reveal is pending');
    }
    if (current.activeLootPoolId === lootPoolId) return current;

    const next: SaveState = { ...current, activeLootPoolId: lootPoolId };
    try {
      await this.options.repository.write(next);
      this.state = next;
      return next;
    } catch (error: unknown) {
      // A storage promise can reject after the write became durable. Reload and
      // accept only the exact pool-only transition we attempted.
      try {
        const reloaded = await this.options.repository.load();
        this.state = reloaded;
        if (matchesLootPoolSwitch(current, reloaded, lootPoolId)) return reloaded;
      } catch {
        // Preserve the original write error.
      }
      throw error;
    }
  }

  public async prepareReveal(pouchType: PouchType = 'basic'): Promise<PendingReveal> {
    const current = this.getState();
    if (current.pendingReveal) {
      return current.pendingReveal;
    }

    const pendingReveal = createPendingReveal({
      state: current,
      registry: this.options.registry,
      balance: this.options.balance,
      random: this.options.random,
      transactionId: this.createTransactionId(),
      pouchType,
    });

    try {
      this.state = await this.options.repository.beginPending(current, pendingReveal);
      return pendingReveal;
    } catch (error: unknown) {
      // Storage APIs can fail after the underlying write has already reached durable
      // storage. Reload before allowing a reroll so an ambiguous write can never
      // produce two different rewards for the same opening.
      try {
        const reloaded = await this.options.repository.load();
        this.state = reloaded;
        if (reloaded.pendingReveal) {
          return reloaded.pendingReveal;
        }
      } catch {
        // Preserve the original write error; callers can surface/retry it.
      }
      throw error;
    }
  }

  public async commitReveal(): Promise<SaveState> {
    const current = this.getState();
    const pending = current.pendingReveal;
    if (!pending) {
      return current;
    }

    try {
      this.state = await this.options.repository.commitPending(current);
      return this.state;
    } catch (error: unknown) {
      // As with beginPending, a failed promise does not prove the write failed.
      // Only accept a reloaded state when it exactly matches this transaction's
      // deterministic commit snapshot; a concurrent/stale write must never be
      // mistaken for success.
      try {
        const reloaded = await this.options.repository.load();
        this.state = reloaded;
        if (matchesCommittedPending(reloaded, pending)) {
          return reloaded;
        }
      } catch {
        // Preserve the original commit error.
      }
      throw error;
    }
  }
}
