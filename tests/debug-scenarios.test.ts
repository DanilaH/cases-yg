import { describe, expect, it } from 'vitest';

import { seedDebugCollection, stageDebugReveal } from '../src/debug/debugScenarios';
import { SLICE_BALANCE } from '../src/game/data/balance';
import { SaveRepository } from '../src/game/systems/save';
import { MemoryStorageAdapter } from './helpers';

const createRepository = (): SaveRepository => new SaveRepository(new MemoryStorageAdapter());

describe('debug reveal scenarios', () => {
  it.each(['common', 'rare', 'epic', 'legendary'] as const)('forces %s as a new camera reveal', async (rarity) => {
    const pending = await stageDebugReveal(createRepository(), rarity);

    expect(pending.standard.familyId).toBe('camera');
    expect(pending.standard.rarity).toBe(rarity);
    expect(pending.standard.isNew).toBe(true);
    expect(pending.hiddenPocket).toBeNull();
  });

  it('forces an Epic Flip Phone for presentation review', async () => {
    const pending = await stageDebugReveal(createRepository(), 'epic-phone');

    expect(pending.standard.familyId).toBe('flip-phone');
    expect(pending.standard.rarity).toBe('epic');
    expect(pending.standard.collectibleId).toBe('flip-phone-epic');
    expect(pending.standard.isNew).toBe(true);
    expect(pending.hiddenPocket).toBeNull();
  });

  it('forces an ordinary duplicate', async () => {
    const pending = await stageDebugReveal(createRepository(), 'duplicate');

    expect(pending.standard.collectibleId).toBe('camera-common');
    expect(pending.standard.isNew).toBe(false);
    expect(pending.signal.gain).toBe(SLICE_BALANCE.signal.duplicateGains.common);
  });

  it('forces the duplicate that reaches SIGNAL LOCK', async () => {
    const pending = await stageDebugReveal(createRepository(), 'signal-lock-reached');

    expect(pending.standard.isNew).toBe(false);
    expect(pending.signal.lockReached).toBe(true);
    expect(pending.signal.after).toBe(SLICE_BALANCE.signal.threshold);
  });

  it('forces consumption of an already armed SIGNAL LOCK', async () => {
    const pending = await stageDebugReveal(createRepository(), 'signal-lock-consumed');

    expect(pending.signal.lockConsumed).toBe(true);
    expect(pending.signal.after).toBe(0);
    expect(pending.standard.rarity).toBe('legendary');
  });

  it('forces Hidden Pocket with a Secret', async () => {
    const pending = await stageDebugReveal(createRepository(), 'hidden-pocket');

    expect(pending.openingNumber).toBeGreaterThanOrEqual(SLICE_BALANCE.hiddenPocket.startOpening);
    expect(pending.hiddenPocket).not.toBeNull();
    expect(pending.hiddenPocket?.collectibleId).toBe('camera-secret-cosmic');
  });

  it('seeds a collection that is immediately reachable from Opening', async () => {
    const state = await seedDebugCollection(createRepository(), 'all');

    expect(state.totalOpens).toBeGreaterThan(0);
    expect(state.discoveredStandard).toHaveLength(8);
    expect(state.discoveredSecrets).toHaveLength(2);
  });
});