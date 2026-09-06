import { describe, expect, it } from 'vitest';

import { LITE_V2_BALANCE } from '../src/game/data/balance';
import {
  createContentRegistry,
  SLICE_FAMILIES,
  SLICE_LOOT_POOL_ID,
  SLICE_REGISTRY,
  type GadgetFamilyDefinition,
} from '../src/game/data/collectibles';
import { buildCollectionSnapshot, getShelfFeaturedOwned } from '../src/game/systems/collection';
import { createPendingReveal } from '../src/game/systems/drops';
import {
  commitPendingRevealState,
  createInitialSaveState,
  SaveRepository,
  stagePendingReveal,
  type SaveState,
} from '../src/game/systems/save';
import { MemoryStorageAdapter, SequenceRandom } from './helpers';

const createPending = (
  state: SaveState,
  transactionId: string,
  randomValues: readonly number[],
  pouchType: 'basic' | 'charged' = 'basic',
) =>
  createPendingReveal({
    state,
    registry: SLICE_REGISTRY,
    balance: LITE_V2_BALANCE,
    random: new SequenceRandom(randomValues),
    transactionId,
    pouchType,
  });

const commit = (state: SaveState, transactionId: string, randomValues: readonly number[]): SaveState =>
  commitPendingRevealState(stagePendingReveal(state, createPending(state, transactionId, randomValues)));

const allStandardIdsExcept = (...excluded: readonly string[]): string[] => {
  const omitted = new Set(excluded);
  return SLICE_REGISTRY.standardItems
    .map(({ collectible }) => collectible.id)
    .filter((collectibleId) => !omitted.has(collectibleId));
};

describe('slice reward transaction integration', () => {
  it('keeps the first three openings undiscovered and opening two on another family', () => {
    let state = createInitialSaveState();
    state = commit(state, 'tx-1', [0, 0, 0, 0]);
    const firstId = state.discoveredStandard[0]!;
    const firstFamily = SLICE_REGISTRY.collectibleFamilyById.get(firstId);

    state = commit(state, 'tx-2', [0, 0, 0, 0]);
    const secondId = state.discoveredStandard[1]!;
    const secondFamily = SLICE_REGISTRY.collectibleFamilyById.get(secondId);

    state = commit(state, 'tx-3', [0, 0, 0, 0]);

    expect(firstFamily).toBeTruthy();
    expect(secondFamily).toBeTruthy();
    expect(secondFamily).not.toBe(firstFamily);
    expect(new Set(state.discoveredStandard).size).toBe(3);
    expect(state.stats.duplicates).toBe(0);
  });

  it('stages Charged cost and reward into one atomic commit snapshot', () => {
    const state: SaveState = {
      ...createInitialSaveState(),
      chips: 60,
      totalOpens: 3,
    };
    const pending = createPending(state, 'charged-atomic', [0, 0, 0, 0, 0.999], 'charged');

    expect(pending.pouchType).toBe('charged');
    expect(pending.lootPoolId).toBe(SLICE_LOOT_POOL_ID);
    expect(pending.chips.before).toBe(60);
    expect(pending.chips.cost).toBe(60);
    expect(pending.chips.base).toBe(18);
    expect(pending.chips.cacheTier).toBe('none');
    expect(pending.chips.after).toBe(18);
    expect(pending.commit.chips).toBe(pending.chips.after);
    expect(pending.commit.signal).toBe(pending.signal.after);
    expect(pending.commit.activeLootPoolId).toBe(pending.lootPoolId);
    expect(state.chips).toBe(60);
  });

  it('commits duplicate recycle CHIPS, one Signal segment and duplicate stats together', () => {
    const state: SaveState = {
      ...createInitialSaveState(),
      totalOpens: 3,
      discoveredStandard: ['camera-common'],
    };
    const pending = createPending(state, 'duplicate', [0, 0, 0, 0, 0.999]);

    expect(pending.standard.collectibleId).toBe('camera-common');
    expect(pending.standard.isNew).toBe(false);
    expect(pending.chips).toMatchObject({ before: 0, base: 6, recycle: 2, totalEarned: 8, after: 8 });
    expect(pending.signal).toMatchObject({ before: 0, after: 1, gain: 1, lockReached: false });
    expect(pending.commit.stats.duplicates).toBe(1);
    expect(pending.commit.chips).toBe(8);
    expect(pending.commit.signal).toBe(1);
  });

  it('retains an armed Signal lock when Basic cannot reach the only missing Legendary', () => {
    const state: SaveState = {
      ...createInitialSaveState(),
      totalOpens: 20,
      signal: LITE_V2_BALANCE.signalThreshold,
      discoveredStandard: allStandardIdsExcept('flip-phone-legendary'),
    };
    const pending = createPending(state, 'lock-waits', [0, 0, 0, 0, 0.999]);

    expect(pending.standard.isNew).toBe(false);
    expect(pending.standard.rarity).not.toBe('legendary');
    expect(pending.signal).toMatchObject({
      before: 4,
      after: 4,
      gain: 0,
      lockArmedBefore: true,
      lockConsumed: false,
      lockRetained: true,
    });
    expect(pending.commit.signal).toBe(4);
  });

  it('triggers Hidden Pocket only from opening four and never duplicates a Secret', () => {
    let state: SaveState = {
      ...createInitialSaveState(),
      totalOpens: 2,
      discoveredStandard: ['camera-common', 'flip-phone-common'],
    };

    const third = createPending(state, 'third', [0, 0, 0, 0]);
    expect(third.hiddenPocket).toBeNull();
    state = commitPendingRevealState(stagePendingReveal(state, third));

    const fourth = createPending(state, 'fourth', [0, 0, 0, 0, 0, 0]);
    expect(fourth.hiddenPocket?.collectibleId).toBe('camera-secret-cosmic');
    state = commitPendingRevealState(stagePendingReveal(state, fourth));

    const fifth = createPending(state, 'fifth', [0, 0, 0, 0, 0, 0]);
    expect(fifth.hiddenPocket?.collectibleId).toBe('flip-phone-secret-noir');
    state = commitPendingRevealState(stagePendingReveal(state, fifth));

    const sixth = createPending(state, 'sixth', [0, 0, 0, 0]);
    expect(sixth.hiddenPocket).toBeNull();
    expect(new Set(state.discoveredSecrets).size).toBe(2);
  });

  it('persists a full pending transaction and commits it idempotently after recovery', async () => {
    const storage = new MemoryStorageAdapter();
    const repository = new SaveRepository(storage);
    const initial = createInitialSaveState();
    await repository.write(initial);

    const pending = createPending(initial, 'recoverable', [0, 0, 0, 0]);
    await repository.beginPending(initial, pending);

    const recovered = await new SaveRepository(storage).load();
    expect(recovered.pendingReveal).toEqual(pending);

    const committed = await repository.commitPending(recovered);
    const committedAgain = await repository.commitPending(committed);
    const reloaded = await repository.load();

    expect(committedAgain).toEqual(committed);
    expect(reloaded.pendingReveal).toBeNull();
    expect(reloaded.totalOpens).toBe(1);
    expect(reloaded.discoveredStandard).toEqual([pending.standard.collectibleId]);
    expect(reloaded.chips).toBe(pending.chips.after);
    expect(reloaded.signal).toBe(pending.signal.after);
  });

  it('does not treat unknown saved IDs as completed active-Drop content', () => {
    const state: SaveState = {
      ...createInitialSaveState(),
      totalOpens: 50,
      signal: LITE_V2_BALANCE.signalThreshold,
      discoveredStandard: Array.from({ length: 8 }, (_, index) => `legacy-unknown-${index}`),
    };
    const pending = createPending(state, 'unknown-ids', [0, 0, 0, 0, 0.999]);

    expect(pending.signal.lockConsumed).toBe(true);
    expect(pending.standard.isNew).toBe(true);
    expect(SLICE_REGISTRY.collectibleFamilyById.has(pending.standard.collectibleId)).toBe(true);
  });

  it('supports another family in the active Drop without special-case transaction or Collection code', () => {
    const mp3: GadgetFamilyDefinition = {
      id: 'mp3-player',
      dropId: SLICE_LOOT_POOL_ID,
      name: { en: 'MP3 Player', ru: 'MP3-плеер' },
      standard: {
        common: { id: 'mp3-player-common', assetPath: 'mp3-common.webp', rarity: 'common', secret: false },
        rare: { id: 'mp3-player-rare', assetPath: 'mp3-rare.webp', rarity: 'rare', secret: false },
        epic: { id: 'mp3-player-epic', assetPath: 'mp3-epic.webp', rarity: 'epic', secret: false },
        legendary: {
          id: 'mp3-player-legendary',
          assetPath: 'mp3-legendary.webp',
          rarity: 'legendary',
          secret: false,
        },
      },
      secrets: [],
    };
    const registry = createContentRegistry([...SLICE_FAMILIES, mp3]);
    const state: SaveState = {
      ...createInitialSaveState(),
      totalOpens: 3,
    };
    const pending = createPendingReveal({
      state,
      registry,
      balance: LITE_V2_BALANCE,
      random: new SequenceRandom([0.9, 0, 0, 0, 0.999]),
      transactionId: 'third-family',
    });
    const snapshot = buildCollectionSnapshot(registry, state);

    expect(pending.standard.collectibleId).toBe('mp3-player-common');
    expect(registry.standardItems).toHaveLength(12);
    expect(snapshot.families.map(({ familyId }) => familyId)).toContain('mp3-player');
    expect(snapshot.standardTotal).toBe(12);
  });

  it('features an owned Secret on the shelf ahead of Legendary', () => {
    const family = SLICE_REGISTRY.families[0]!;
    const state: SaveState = {
      ...createInitialSaveState(),
      discoveredStandard: [family.standard.legendary.id],
      discoveredSecrets: [family.secrets[0]!.id],
    };
    const snapshot = buildCollectionSnapshot(SLICE_REGISTRY, state);
    const familySnapshot = snapshot.families.find(({ familyId }) => familyId === family.id)!;

    expect(getShelfFeaturedOwned(family, familySnapshot)).toEqual({
      collectibleId: family.secrets[0]!.id,
      rarity: 'secret',
    });
  });
});
