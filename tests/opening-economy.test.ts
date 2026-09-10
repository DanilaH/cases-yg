import { describe, expect, it } from 'vitest';

import { LITE_V2_BALANCE } from '../src/game/data/balance';
import { SLICE_LOOT_POOL_ID, SLICE_REGISTRY } from '../src/game/data/collectibles';
import { createPendingReveal } from '../src/game/systems/drops';
import {
  canAffordPouch,
  crossedChargedReadyThreshold,
  getPreludeChipsAfter,
  isSignalWaitingForCharged,
} from '../src/game/systems/openingEconomy';
import { createInitialSaveState } from '../src/game/systems/save';
import { SequenceRandom } from './helpers';

const baseState = () => ({
  chips: 0,
  signal: 0,
  activeLootPoolId: SLICE_LOOT_POOL_ID,
  discoveredStandard: [] as string[],
});

describe('Opening economy presentation state', () => {
  it('keeps Charged unavailable below its cost and available at the threshold', () => {
    expect(canAffordPouch({ chips: 59 }, 'charged', LITE_V2_BALANCE)).toBe(false);
    expect(canAffordPouch({ chips: 60 }, 'charged', LITE_V2_BALANCE)).toBe(true);
    expect(canAffordPouch({ chips: 0 }, 'basic', LITE_V2_BALANCE)).toBe(true);
  });

  it('shows SIGNAL LOCK · CHARGED only when Basic has no eligible NEW but Charged does', () => {
    const allExceptLegendary = SLICE_REGISTRY.standardItems
      .filter(({ rarity }) => rarity !== 'legendary')
      .map(({ collectible }) => collectible.id);
    const waiting = {
      ...baseState(),
      signal: 4,
      discoveredStandard: allExceptLegendary,
    };
    const complete = {
      ...waiting,
      discoveredStandard: SLICE_REGISTRY.standardItems.map(({ collectible }) => collectible.id),
    };

    expect(isSignalWaitingForCharged(waiting, SLICE_REGISTRY, LITE_V2_BALANCE)).toBe(true);
    expect(isSignalWaitingForCharged({ ...waiting, signal: 3 }, SLICE_REGISTRY, LITE_V2_BALANCE)).toBe(false);
    expect(isSignalWaitingForCharged(complete, SLICE_REGISTRY, LITE_V2_BALANCE)).toBe(false);
  });

  it('separates prelude CHIPS from duplicate recycle and detects a Basic threshold crossing', () => {
    const state = {
      ...createInitialSaveState(),
      chips: 55,
      totalOpens: 3,
      discoveredStandard: ['flip-phone-common', 'flip-phone-rare', 'flip-phone-legendary', 'camera-common'],
    };
    const pending = createPendingReveal({
      state,
      registry: SLICE_REGISTRY,
      balance: LITE_V2_BALANCE,
      random: new SequenceRandom([0, 0, 0, 0, 0.999]),
      transactionId: 'opening-economy',
    });

    expect(pending.standard.isNew).toBe(false);
    expect(pending.chips.recycle).toBe(2);
    expect(getPreludeChipsAfter(pending)).toBe(61);
    expect(pending.chips.after).toBe(63);
    expect(crossedChargedReadyThreshold(pending, LITE_V2_BALANCE)).toBe(true);
  });
});
