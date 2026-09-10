import { describe, expect, it } from 'vitest';

import { seedDebugCollection, stageDebugReveal } from '../src/debug/debugScenarios';
import { LITE_V2_BALANCE } from '../src/game/data/balance';
import { SaveRepository, createInitialSaveState } from '../src/game/systems/save';
import { MemoryStorageAdapter } from './helpers';

const createRepository = (): SaveRepository => new SaveRepository(new MemoryStorageAdapter());

describe('debug reveal scenarios', () => {
  it.each(['common', 'rare', 'epic'] as const)('forces %s as a new Basic camera reveal', async (rarity) => {
    const pending = await stageDebugReveal(createRepository(), rarity);

    expect(pending.pouchType).toBe('basic');
    expect(pending.standard.familyId).toBe('camera');
    expect(pending.standard.rarity).toBe(rarity);
    expect(pending.standard.isNew).toBe(true);
    expect(pending.hiddenPocket).toBeNull();
    expect(pending.commit.discoveredStandard).toEqual([pending.standard.collectibleId]);
  });

  it('forces Legendary through Charged rather than bypassing the Basic gate', async () => {
    const pending = await stageDebugReveal(createRepository(), 'legendary');

    expect(pending.pouchType).toBe('charged');
    expect(pending.standard.familyId).toBe('camera');
    expect(pending.standard.rarity).toBe('legendary');
    expect(pending.standard.isNew).toBe(true);
    expect(pending.chips.cost).toBe(LITE_V2_BALANCE.pouchProfiles.charged.chipsCost);
  });

  it('forces an Epic Flip Phone for presentation review', async () => {
    const pending = await stageDebugReveal(createRepository(), 'epic-phone');

    expect(pending.standard.familyId).toBe('flip-phone');
    expect(pending.standard.rarity).toBe('epic');
    expect(pending.standard.collectibleId).toBe('flip-phone-epic');
    expect(pending.standard.isNew).toBe(true);
    expect(pending.hiddenPocket).toBeNull();
  });

  it('forces an ordinary duplicate with recycle CHIPS and +1 Signal', async () => {
    const pending = await stageDebugReveal(createRepository(), 'duplicate');

    expect(pending.standard.collectibleId).toBe('camera-common');
    expect(pending.standard.isNew).toBe(false);
    expect(pending.chips.recycle).toBe(LITE_V2_BALANCE.duplicateRecycleChips.common);
    expect(pending.signal.gain).toBe(1);
  });

  it('forces the duplicate that reaches SIGNAL LOCK', async () => {
    const pending = await stageDebugReveal(createRepository(), 'signal-lock-reached');

    expect(pending.standard.isNew).toBe(false);
    expect(pending.signal.lockReached).toBe(true);
    expect(pending.signal.after).toBe(LITE_V2_BALANCE.signalThreshold);
  });

  it('forces consumption of an armed lock on a Basic-eligible NEW', async () => {
    const pending = await stageDebugReveal(createRepository(), 'signal-lock-consumed');

    expect(pending.pouchType).toBe('basic');
    expect(pending.signal.lockConsumed).toBe(true);
    expect(pending.signal.after).toBe(0);
    expect(pending.standard.collectibleId).toBe('camera-epic');
    expect(pending.standard.isNew).toBe(true);
  });

  it('forces the strict waiting state when Basic has no eligible NEW', async () => {
    const pending = await stageDebugReveal(createRepository(), 'signal-lock-waiting');

    expect(pending.pouchType).toBe('basic');
    expect(pending.standard.isNew).toBe(false);
    expect(pending.standard.rarity).not.toBe('legendary');
    expect(pending.signal).toMatchObject({
      before: LITE_V2_BALANCE.signalThreshold,
      after: LITE_V2_BALANCE.signalThreshold,
      lockConsumed: false,
      lockRetained: true,
    });
  });

  it('forces Hidden Pocket with a Secret', async () => {
    const pending = await stageDebugReveal(createRepository(), 'hidden-pocket');

    expect(pending.openingNumber).toBeGreaterThanOrEqual(LITE_V2_BALANCE.hiddenPocketStartOpening);
    expect(pending.hiddenPocket).not.toBeNull();
    expect(pending.hiddenPocket?.collectibleId).toBe('camera-secret-cosmic');
  });

  it.each([
    'common',
    'rare',
    'epic',
    'epic-phone',
    'legendary',
    'duplicate',
    'signal-lock-reached',
    'signal-lock-consumed',
    'signal-lock-waiting',
    'hidden-pocket',
    'hidden-pocket-duplicate',
  ] as const)('stages %s from an active MAX Overcharge save without invalid payloads', async (scenario) => {
    const repository = createRepository();
    await repository.write({
      ...createInitialSaveState(),
      chips: 500,
      signal: LITE_V2_BALANCE.signalThreshold,
      overchargeHundredths: LITE_V2_BALANCE.overchargeCapHundredths,
    });

    const pending = await stageDebugReveal(repository, scenario);

    expect(pending).toBeTruthy();
    expect(await repository.load()).toMatchObject({ pendingReveal: { id: pending.id } });
  });

  it('seeds a collection that is immediately reachable from Opening', async () => {
    const state = await seedDebugCollection(createRepository(), 'all');

    expect(state.totalOpens).toBeGreaterThan(0);
    expect(state.discoveredStandard).toHaveLength(8);
    expect(state.discoveredSecrets).toHaveLength(2);
  });
});
