import { describe, expect, it } from 'vitest';

import { LITE_V2_BALANCE } from '../src/game/data/balance';
import { createPendingReveal } from '../src/game/systems/drops';
import {
  DEFAULT_SAVE_KEY,
  SaveRepository,
  createInitialSaveState,
  parseSaveState,
  stagePendingReveal,
} from '../src/game/systems/save';
import { DEFAULT_DROP_REGISTRY } from './defaultDropFixture';
import { MemoryStorageAdapter, SequenceRandom } from './helpers';

const recoveryKey = `${DEFAULT_SAVE_KEY}.recovery`;

describe('current save self-heal', () => {
  it('repairs missing onboarding metadata without losing durable progression', async () => {
    const storage = new MemoryStorageAdapter();
    const rawState = {
      ...createInitialSaveState(),
      totalOpens: 4,
      chips: 64,
      discoveredStandard: ['camera-common'],
    } as Record<string, unknown>;
    delete rawState.onboarding;
    const raw = JSON.stringify(rawState);
    await storage.setItem(DEFAULT_SAVE_KEY, raw);

    const loaded = await new SaveRepository(storage).load();

    expect(loaded).toMatchObject({
      totalOpens: 4,
      chips: 64,
      discoveredStandard: ['camera-common'],
      pendingReveal: null,
      onboarding: { primaryCompleted: true, firstRevealReceipt: null },
    });
    expect(await storage.getItem(recoveryKey)).toBe(raw);
    expect(parseSaveState((await storage.getItem(DEFAULT_SAVE_KEY))!)).toEqual(loaded);
  });

  it('drops an irreconcilable staged reveal but preserves its durable base state', async () => {
    const storage = new MemoryStorageAdapter();
    const base = { ...createInitialSaveState(), totalOpens: 3, chips: 41 };
    const pending = createPendingReveal({
      state: base,
      registry: DEFAULT_DROP_REGISTRY,
      balance: LITE_V2_BALANCE,
      random: new SequenceRandom([0, 0, 0, 0, 0.999]),
      transactionId: 'broken-pending',
    });
    const staged = stagePendingReveal(base, pending);
    const corrupted = {
      ...staged,
      pendingReveal: {
        ...pending,
        commit: { ...pending.commit, discoveredStandard: [] },
      },
    };
    const raw = JSON.stringify(corrupted);
    await storage.setItem(DEFAULT_SAVE_KEY, raw);

    const loaded = await new SaveRepository(storage).load();

    expect(loaded.pendingReveal).toBeNull();
    expect(loaded.totalOpens).toBe(base.totalOpens);
    expect(loaded.chips).toBe(base.chips);
    expect(loaded.discoveredStandard).toEqual(base.discoveredStandard);
    expect(loaded.onboarding).toEqual({ primaryCompleted: true, firstRevealReceipt: null });
    expect(await storage.getItem(recoveryKey)).toBe(raw);
  });

  it('repairs a fresh current save conservatively back into unfinished onboarding', async () => {
    const storage = new MemoryStorageAdapter();
    const rawState = { ...createInitialSaveState() } as Record<string, unknown>;
    rawState.onboarding = { primaryCompleted: true, firstRevealReceipt: { invalid: true } };
    await storage.setItem(DEFAULT_SAVE_KEY, JSON.stringify(rawState));

    const loaded = await new SaveRepository(storage).load();

    expect(loaded.totalOpens).toBe(0);
    expect(loaded.onboarding).toEqual({ primaryCompleted: false, firstRevealReceipt: null });
  });

  it('still rejects an invalid durable progression snapshot instead of guessing', async () => {
    const storage = new MemoryStorageAdapter();
    const corrupted = { ...createInitialSaveState(), chips: -1 };
    await storage.setItem(DEFAULT_SAVE_KEY, JSON.stringify(corrupted));

    await expect(new SaveRepository(storage).load()).rejects.toThrow('Invalid save payload');
    expect(await storage.getItem(recoveryKey)).toBeNull();
  });
});
