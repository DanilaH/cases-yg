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
    if (!current.pendingReveal) {
      return current;
    }

    try {
      this.state = await this.options.repository.commitPending(current);
      return this.state;
    } catch (error: unknown) {
      // As with beginPending, a failed promise does not prove the write failed.
      // Reload and accept a durable committed state if it is already there.
      try {
        const reloaded = await this.options.repository.load();
        this.state = reloaded;
        if (!reloaded.pendingReveal && reloaded.totalOpens >= current.pendingReveal.openingNumber) {
          return reloaded;
        }
      } catch {
        // Preserve the original commit error.
      }
      throw error;
    }
  }
}
