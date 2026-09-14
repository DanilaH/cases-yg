import { describe, expect, it } from 'vitest';

import { LITE_V2_BALANCE } from '../src/game/data/balance';
import { createPendingReveal } from '../src/game/systems/drops';
import {
  DEFAULT_SAVE_KEY,
  SaveRepository,
  createInitialSaveState,
  stagePendingReveal,
} from '../src/game/systems/save';
import { DEFAULT_DROP_REGISTRY } from './defaultDropFixture';
import { MemoryStorageAdapter, SequenceRandom } from './helpers';

describe('current save self-heal pending transaction safety', () => {
  it('preserves the exact valid pending reveal when only onboarding metadata is invalid', async () => {
    const storage = new MemoryStorageAdapter();
    const base = createInitialSaveState();
    const pending = createPendingReveal({
      state: base,
      registry: DEFAULT_DROP_REGISTRY,
      balance: LITE_V2_BALANCE,
      random: new SequenceRandom([0, 0, 0, 0, 0.999]),
      transactionId: 'keep-this-pending',
    });
    const staged = stagePendingReveal(base, pending);
    const corrupted = {
      ...staged,
      onboarding: { primaryCompleted: false, firstRevealReceipt: { invalid: true } },
    };
    const raw = JSON.stringify(corrupted);
    await storage.setItem(DEFAULT_SAVE_KEY, raw);

    const loaded = await new SaveRepository(storage).load();

    expect(loaded.pendingReveal).toEqual(pending);
    expect(loaded.pendingReveal?.id).toBe('keep-this-pending');
    expect(loaded.totalOpens).toBe(base.totalOpens);
    expect(loaded.chips).toBe(base.chips);
    expect(loaded.onboarding).toEqual({ primaryCompleted: false, firstRevealReceipt: null });
    expect(await storage.getItem(`${DEFAULT_SAVE_KEY}.recovery`)).toBe(raw);
  });
});
