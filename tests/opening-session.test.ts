import { describe, expect, it } from 'vitest';

import { LITE_V2_BALANCE } from '../src/game/data/balance';
import { SLICE_REGISTRY } from '../src/game/data/collectibles';
import { OpeningSession } from '../src/game/systems/openingSession';
import { SaveRepository } from '../src/game/systems/save';
import type { StorageAdapter } from '../src/platform/storage';
import { MemoryStorageAdapter, SequenceRandom } from './helpers';

class WriteThenThrowStorage implements StorageAdapter {
  private readonly values = new Map<string, string>();
  private writes = 0;

  public constructor(private readonly throwOnWrite: number) {}

  public async getItem(key: string): Promise<string | null> {
    return this.values.get(key) ?? null;
  }

  public async setItem(key: string, value: string): Promise<void> {
    this.writes += 1;
    this.values.set(key, value);
    if (this.writes === this.throwOnWrite) {
      throw new Error(`ambiguous write ${this.writes}`);
    }
  }

  public async removeItem(key: string): Promise<void> {
    this.values.delete(key);
  }
}

const createSession = (
  storage: StorageAdapter,
  ids: string[] = ['tx-1', 'tx-2'],
  random = new SequenceRandom([0, 0, 0, 0, 0.999]),
): OpeningSession => {
  let idIndex = 0;
  return new OpeningSession({
    repository: new SaveRepository(storage),
    registry: SLICE_REGISTRY,
    balance: LITE_V2_BALANCE,
    random,
    createTransactionId: () => ids[idIndex++] ?? `tx-${idIndex}`,
  });
};

describe('OpeningSession', () => {
  it('persists the full pending transaction before returning a newly prepared reward', async () => {
    const storage = new MemoryStorageAdapter();
    const session = createSession(storage);
    await session.load();

    const pending = await session.prepareReveal();
    const persisted = await new SaveRepository(storage).load();

    expect(pending.id).toBe('tx-1');
    expect(pending.pouchType).toBe('basic');
    expect(pending.chips.before).toBe(0);
    expect(pending.chips.after).toBeGreaterThan(0);
    expect(session.getPendingReveal()).toEqual(pending);
    expect(persisted.pendingReveal).toEqual(pending);
    expect(persisted.totalOpens).toBe(0);
    expect(persisted.chips).toBe(0);
  });

  it('reuses a recovered pending reward without rerolling or minting a new transaction id', async () => {
    const storage = new MemoryStorageAdapter();
    const first = createSession(storage, ['stable-id']);
    await first.load();
    const original = await first.prepareReveal();

    let idCalls = 0;
    const recovered = new OpeningSession({
      repository: new SaveRepository(storage),
      registry: SLICE_REGISTRY,
      balance: LITE_V2_BALANCE,
      random: new SequenceRandom([0.99, 0.99, 0.99]),
      createTransactionId: () => {
        idCalls += 1;
        return 'should-not-be-used';
      },
    });
    await recovered.load();
    const pending = await recovered.prepareReveal('charged');

    expect(pending).toEqual(original);
    expect(pending.pouchType).toBe('basic');
    expect(idCalls).toBe(0);
  });

  it('commits the pending reward exactly once including CHIPS and advances opening count', async () => {
    const storage = new MemoryStorageAdapter();
    const session = createSession(storage);
    await session.load();
    const pending = await session.prepareReveal();

    const committed = await session.commitReveal();
    const committedAgain = await session.commitReveal();
    const persisted = await new SaveRepository(storage).load();

    expect(committed.pendingReveal).toBeNull();
    expect(committed.totalOpens).toBe(pending.openingNumber);
    expect(committed.chips).toBe(pending.chips.after);
    expect(committed.signal).toBe(pending.signal.after);
    expect(committedAgain).toEqual(committed);
    expect(persisted).toEqual(committed);
  });

  it('stages Charged cost and reward atomically without mutating the wallet before commit', async () => {
    const storage = new MemoryStorageAdapter();
    const repository = new SaveRepository(storage);
    const initial = await repository.load();
    const cost = LITE_V2_BALANCE.pouchProfiles.charged.chipsCost;
    await repository.write({ ...initial, chips: cost });

    const session = createSession(storage, ['charged'], new SequenceRandom([0, 0.99, 0, 0, 0.999]));
    await session.load();
    const pending = await session.prepareReveal('charged');
    const staged = await repository.load();

    expect(pending.pouchType).toBe('charged');
    expect(pending.chips.before).toBe(cost);
    expect(pending.chips.cost).toBe(cost);
    expect(staged.chips).toBe(cost);
    expect(staged.pendingReveal?.chips.after).toBe(pending.chips.after);

    const committed = await session.commitReveal();
    expect(committed.chips).toBe(pending.chips.after);
  });

  it('rejects an unaffordable Charged opening without staging or spending anything', async () => {
    const storage = new MemoryStorageAdapter();
    const session = createSession(storage);
    const loaded = await session.load();

    await expect(session.prepareReveal('charged')).rejects.toThrow('Insufficient CHIPS');
    expect(session.getState()).toEqual(loaded);
    expect((await new SaveRepository(storage).load()).pendingReveal).toBeNull();
  });

  it('accepts an ambiguous begin write when reload proves pendingReveal is durable', async () => {
    const storage = new WriteThenThrowStorage(1);
    const session = createSession(storage);
    await session.load();

    const pending = await session.prepareReveal();

    expect(pending.id).toBe('tx-1');
    expect(session.getPendingReveal()).toEqual(pending);
  });

  it('accepts an ambiguous commit write when reload proves the complete transaction is committed', async () => {
    const storage = new WriteThenThrowStorage(2);
    const session = createSession(storage);
    await session.load();
    const pending = await session.prepareReveal();

    const committed = await session.commitReveal();

    expect(committed.pendingReveal).toBeNull();
    expect(committed.totalOpens).toBe(pending.openingNumber);
    expect(committed.chips).toBe(pending.chips.after);
    expect(committed.discoveredStandard).toContain(pending.standard.collectibleId);
  });
});
