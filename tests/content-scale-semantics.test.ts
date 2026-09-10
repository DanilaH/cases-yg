import { describe, expect, it } from 'vitest';

import { LITE_V2_BALANCE } from '../src/game/data/balance';
import { GAME_LOOT_POOL_IDS, GAME_REGISTRY } from '../src/game/data/collectibles';
import { getStandardLootPoolNearCompletion } from '../src/game/systems/collection';
import { resolveCollectionMilestone } from '../src/game/systems/collectionMilestones';
import { createPendingReveal } from '../src/game/systems/drops';
import { resolveLitePouchReward, type LiteRewardState } from '../src/game/systems/pouches';
import { createInitialSaveState } from '../src/game/systems/save';
import { SequenceRandom } from './helpers';

const poolItems = (poolId: string) => GAME_REGISTRY.standardItems.filter((item) => item.lootPoolId === poolId);
const poolSecrets = (poolId: string) => GAME_REGISTRY.secrets.filter((item) => item.lootPoolId === poolId);

const rewardState = (poolId: string, overrides: Partial<LiteRewardState> = {}): LiteRewardState => ({
  chips: 0,
  signal: 0,
  overchargeHundredths: 100,
  totalOpens: 50,
  activeLootPoolId: poolId,
  discoveredStandard: [],
  discoveredSecrets: [],
  ...overrides,
});

describe('production content registry and Drop semantics', () => {
  it('contains exactly 6 Drops, 12 families, 48 standards and 12 Secrets', () => {
    expect(GAME_REGISTRY.lootPools.map(({ id }) => id)).toEqual([...GAME_LOOT_POOL_IDS]);
    expect(GAME_REGISTRY.families).toHaveLength(12);
    expect(GAME_REGISTRY.standardItems).toHaveLength(48);
    expect(GAME_REGISTRY.secrets).toHaveLength(12);
    expect(GAME_REGISTRY.collectibleFamilyById.size).toBe(60);

    for (const poolId of GAME_LOOT_POOL_IDS) {
      expect(GAME_REGISTRY.lootPoolById.get(poolId)?.familyIds).toHaveLength(2);
      expect(poolItems(poolId)).toHaveLength(8);
      expect(poolSecrets(poolId)).toHaveLength(2);
    }
  });

  it('keeps starter protection local to a Drop even after many global openings', () => {
    const poolId = 'video-link';
    const first = resolveLitePouchReward({
      state: rewardState(poolId),
      pouchType: 'basic',
      registry: GAME_REGISTRY,
      balance: LITE_V2_BALANCE,
      random: new SequenceRandom([0, 0, 0, 0, 0, 0]),
    });
    expect(first.standard.isNew).toBe(true);
    expect(GAME_REGISTRY.familyById.get(first.standard.familyId)?.dropId).toBe(poolId);

    const second = resolveLitePouchReward({
      state: rewardState(poolId, {
        totalOpens: 51,
        discoveredStandard: [first.standard.collectibleId],
      }),
      pouchType: 'basic',
      registry: GAME_REGISTRY,
      balance: LITE_V2_BALANCE,
      random: new SequenceRandom([0, 0, 0, 0, 0, 0]),
    });
    expect(second.standard.isNew).toBe(true);
    expect(second.standard.familyId).not.toBe(first.standard.familyId);
  });

  it('computes near-completion inside one Drop and ignores progress in others', () => {
    const poolId = 'pocket-audio';
    const items = poolItems(poolId);
    const missing = items.at(-1);
    if (!missing) throw new Error('Pocket Audio requires standards');
    const unrelated = poolItems('y2k-essentials').map(({ collectible }) => collectible.id);

    expect(getStandardLootPoolNearCompletion(GAME_REGISTRY, poolId, {
      discoveredStandard: [...unrelated, ...items.slice(0, -1).map(({ collectible }) => collectible.id)],
    })).toEqual({
      current: 7,
      total: 8,
      missingCollectibleId: missing.collectible.id,
      familyId: missing.familyId,
      rarity: missing.rarity,
    });
  });

  it('emits standard completion for the reveal Drop without requiring 48/48 globally', () => {
    const poolId = 'pocket-office';
    const items = poolItems(poolId);
    const missing = items.find(({ rarity }) => rarity === 'common');
    if (!missing) throw new Error('Pocket Office requires a Common');
    const ownedInPool = items.filter((item) => item.collectible.id !== missing.collectible.id).map(({ collectible }) => collectible.id);
    const unrelated = poolItems('y2k-essentials').map(({ collectible }) => collectible.id);
    const initial = createInitialSaveState();
    const state = {
      ...initial,
      totalOpens: 60,
      signal: 4,
      activeLootPoolId: poolId,
      discoveredStandard: [...unrelated, ...ownedInPool],
    };
    const pending = createPendingReveal({
      state,
      registry: GAME_REGISTRY,
      balance: LITE_V2_BALANCE,
      random: new SequenceRandom([0, 0, 0, 0, 0, 0]),
      transactionId: 'pool-complete',
      pouchType: 'basic',
    });

    expect(pending.standard.collectibleId).toBe(missing.collectible.id);
    expect(resolveCollectionMilestone(GAME_REGISTRY, pending, { ...state, ...pending.commit, pendingReveal: null })).toEqual({
      kind: 'standards-complete',
      current: 8,
      total: 8,
    });
  });
});
