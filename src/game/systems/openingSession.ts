import type { BalanceConfig } from '../data/balance';
import type { ContentRegistry } from '../data/collectibles';
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
  balance: BalanceConfig;
  random: RandomSource;
  createTransactionId?: TransactionIdFactory;
}

const sameStrings = (left: readonly string[], right: readonly string[]): boolean =>
  left.length === right.length && left.every((value, index) => value === right[index]);

const matchesCommittedPending = (state: SaveState, pending: PendingReveal): boolean =>
  state.pendingReveal === null &&
  state.totalOpens === pending.commit.totalOpens &&
  state.signal === pending.commit.signal &&
  state.stats.duplicates === pending.commit.stats.duplicates &&
  state.stats.hiddenPockets === pending.commit.stats.hiddenPockets &&
  sameStrings(state.discoveredStandard, pending.commit.discoveredStandard) &&
  sameStrings(state.discoveredSecrets, pending.commit.discoveredSecrets);

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

  public async prepareReveal(): Promise<PendingReveal> {
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
