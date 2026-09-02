import { describe, expect, it } from 'vitest';

import { SLICE_BALANCE } from '../src/game/data/balance';
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
): OpeningSession => {
  let idIndex = 0;
  return new OpeningSession({
    repository: new SaveRepository(storage),
    registry: SLICE_REGISTRY,
    balance: SLICE_BALANCE,
    random: new SequenceRandom([0, 0, 0, 0]),
    createTransactionId: () => ids[idIndex++] ?? `tx-${idIndex}`,
  });
};

describe('OpeningSession', () => {
  it('persists pendingReveal before returning a newly prepared reward', async () => {
    const storage = new MemoryStorageAdapter();
    const session = createSession(storage);
    await session.load();

    const pending = await session.prepareReveal();
    const persisted = await new SaveRepository(storage).load();

    expect(pending.id).toBe('tx-1');
    expect(session.getPendingReveal()).toEqual(pending);
    expect(persisted.pendingReveal).toEqual(pending);
    expect(persisted.totalOpens).toBe(0);
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
      balance: SLICE_BALANCE,
      random: new SequenceRandom([0.99, 0.99, 0.99]),
      createTransactionId: () => {
        idCalls += 1;
        return 'should-not-be-used';
      },
    });
    await recovered.load();
    const pending = await recovered.prepareReveal();

    expect(pending).toEqual(original);
    expect(idCalls).toBe(0);
  });

  it('commits the pending reward exactly once and advances the persisted opening count', async () => {
    const storage = new MemoryStorageAdapter();
    const session = createSession(storage);
    await session.load();
    const pending = await session.prepareReveal();

    const committed = await session.commitReveal();
    const committedAgain = await session.commitReveal();
    const persisted = await new SaveRepository(storage).load();

    expect(committed.pendingReveal).toBeNull();
    expect(committed.totalOpens).toBe(pending.openingNumber);
    expect(committedAgain).toEqual(committed);
    expect(persisted).toEqual(committed);
  });

  it('accepts an ambiguous begin write when reload proves pendingReveal is durable', async () => {
    const storage = new WriteThenThrowStorage(1);
    const session = createSession(storage);
    await session.load();

    const pending = await session.prepareReveal();

    expect(pending.id).toBe('tx-1');
    expect(session.getPendingReveal()).toEqual(pending);
  });

  it('accepts an ambiguous commit write when reload proves the transaction is already committed', async () => {
    const storage = new WriteThenThrowStorage(2);
    const session = createSession(storage);
    await session.load();
    const pending = await session.prepareReveal();

    const committed = await session.commitReveal();

    expect(committed.pendingReveal).toBeNull();
    expect(committed.totalOpens).toBe(pending.openingNumber);
    expect(committed.discoveredStandard).toContain(pending.standard.collectibleId);
  });
});
