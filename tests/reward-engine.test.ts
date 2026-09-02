import { describe, expect, it } from 'vitest';

import { SLICE_BALANCE } from '../src/game/data/balance';
import {
  createContentRegistry,
  SLICE_FAMILIES,
  SLICE_REGISTRY,
  type GadgetFamilyDefinition,
  type StandardRarity,
} from '../src/game/data/collectibles';
import { buildCollectionSnapshot } from '../src/game/systems/collection';
import { createPendingReveal } from '../src/game/systems/drops';
import {
  commitPendingRevealState,
  createInitialSaveState,
  SaveRepository,
  stagePendingReveal,
  type SaveState,
} from '../src/game/systems/save';
import { MemoryStorageAdapter, SequenceRandom } from './helpers';

const commit = (state: SaveState, transactionId: string, random: SequenceRandom): SaveState => {
  const pending = createPendingReveal({
    state,
    registry: SLICE_REGISTRY,
    balance: SLICE_BALANCE,
    random,
    transactionId,
  });
  return commitPendingRevealState(stagePendingReveal(state, pending));
};

const standardIds = (filter?: (rarity: StandardRarity, id: string) => boolean): string[] =>
  SLICE_REGISTRY.standardItems
    .filter(({ rarity, collectible }) => filter?.(rarity, collectible.id) ?? true)
    .map(({ collectible }) => collectible.id);

describe('slice reward engine', () => {
  it('keeps the first three openings undiscovered and opening two on another family', () => {
    let state = createInitialSaveState();
    state = commit(state, 'tx-1', new SequenceRandom([0]));
    const firstId = state.discoveredStandard[0]!;
    const firstFamily = SLICE_REGISTRY.collectibleFamilyById.get(firstId);

    state = commit(state, 'tx-2', new SequenceRandom([0]));
    const secondId = state.discoveredStandard[1]!;
    const secondFamily = SLICE_REGISTRY.collectibleFamilyById.get(secondId);

    state = commit(state, 'tx-3', new SequenceRandom([0]));

    expect(firstFamily).toBeTruthy();
    expect(secondFamily).toBeTruthy();
    expect(secondFamily).not.toBe(firstFamily);
    expect(new Set(state.discoveredStandard).size).toBe(3);
    expect(state.stats.duplicates).toBe(0);
  });

  it('keeps the locked normal rarity table at 60/28/10/2', () => {
    expect(SLICE_BALANCE.standardRarityWeights).toEqual({
      common: 60,
      rare: 28,
      epic: 10,
      legendary: 2,
    });
    expect(Object.values(SLICE_BALANCE.standardRarityWeights).reduce((sum, value) => sum + value, 0)).toBe(100);
  });

  it.each([
    ['common', 0.1, 25],
    ['rare', 0.7, 20],
    ['epic', 0.9, 15],
    ['legendary', 0.99, 10],
  ] as const)('adds the configured Signal amount for a %s duplicate', (rarity, raritySample, expectedGain) => {
    const state: SaveState = {
      ...createInitialSaveState(),
      totalOpens: 3,
      discoveredStandard: [`camera-${rarity}`],
    };
    const pending = createPendingReveal({
      state,
      registry: SLICE_REGISTRY,
      balance: SLICE_BALANCE,
      random: new SequenceRandom([0, raritySample, 0.999]),
      transactionId: `signal-${rarity}`,
    });

    expect(pending.standard.collectibleId).toBe(`camera-${rarity}`);
    expect(pending.standard.isNew).toBe(false);
    expect(pending.signal.gain).toBe(expectedGain);
    expect(pending.signal.after).toBe(expectedGain);
  });

  it('forces the only missing non-Legendary variant when SIGNAL LOCK is armed', () => {
    const state: SaveState = {
      ...createInitialSaveState(),
      totalOpens: 20,
      signal: 100,
      discoveredStandard: standardIds((rarity, id) => rarity !== 'legendary' && id !== 'camera-epic'),
    };
    const pending = createPendingReveal({
      state,
      registry: SLICE_REGISTRY,
      balance: SLICE_BALANCE,
      random: new SequenceRandom([0.5, 0.999]),
      transactionId: 'early-lock',
    });

    expect(pending.standard.collectibleId).toBe('camera-epic');
    expect(pending.standard.isNew).toBe(true);
    expect(pending.signal.lockConsumed).toBe(true);
    expect(pending.signal.after).toBe(0);
  });

  it('uses the late lock table and does not rebuild Signal from the consumed duplicate', () => {
    const nonLegendary = standardIds((rarity) => rarity !== 'legendary');
    const state: SaveState = {
      ...createInitialSaveState(),
      totalOpens: 30,
      signal: 100,
      discoveredStandard: [...nonLegendary, 'camera-legendary'],
    };
    const pending = createPendingReveal({
      state,
      registry: SLICE_REGISTRY,
      balance: SLICE_BALANCE,
      random: new SequenceRandom([0.99, 0, 0.999]),
      transactionId: 'late-lock',
    });

    expect(pending.standard.collectibleId).toBe('camera-legendary');
    expect(pending.standard.isNew).toBe(false);
    expect(pending.signal.lockConsumed).toBe(true);
    expect(pending.signal.gain).toBe(0);
    expect(pending.signal.after).toBe(0);
  });

  it('triggers Hidden Pocket only from opening four and never duplicates a Secret', () => {
    let state: SaveState = {
      ...createInitialSaveState(),
      totalOpens: 2,
      discoveredStandard: ['camera-common', 'flip-phone-common'],
    };
    const third = createPendingReveal({
      state,
      registry: SLICE_REGISTRY,
      balance: SLICE_BALANCE,
      random: new SequenceRandom([0]),
      transactionId: 'third',
    });
    expect(third.hiddenPocket).toBeNull();
    state = commitPendingRevealState(stagePendingReveal(state, third));

    const fourth = createPendingReveal({
      state,
      registry: SLICE_REGISTRY,
      balance: SLICE_BALANCE,
      random: new SequenceRandom([0, 0, 0, 0]),
      transactionId: 'fourth',
    });
    expect(fourth.hiddenPocket?.collectibleId).toBe('camera-secret-cosmic');
    state = commitPendingRevealState(stagePendingReveal(state, fourth));

    const fifth = createPendingReveal({
      state,
      registry: SLICE_REGISTRY,
      balance: SLICE_BALANCE,
      random: new SequenceRandom([0, 0, 0, 0]),
      transactionId: 'fifth',
    });
    expect(fifth.hiddenPocket?.collectibleId).toBe('flip-phone-secret-music');
    state = commitPendingRevealState(stagePendingReveal(state, fifth));

    const sixth = createPendingReveal({
      state,
      registry: SLICE_REGISTRY,
      balance: SLICE_BALANCE,
      random: new SequenceRandom([0, 0, 0]),
      transactionId: 'sixth',
    });
    expect(sixth.hiddenPocket).toBeNull();
    expect(new Set(state.discoveredSecrets).size).toBe(2);
  });

  it('persists a pending transaction and commits it idempotently after recovery', async () => {
    const storage = new MemoryStorageAdapter();
    const repository = new SaveRepository(storage);
    const initial = createInitialSaveState();
    await repository.write(initial);

    const pending = createPendingReveal({
      state: initial,
      registry: SLICE_REGISTRY,
      balance: SLICE_BALANCE,
      random: new SequenceRandom([0]),
      transactionId: 'recoverable',
    });
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
  });

  it('stops Signal gain after the standard collection is complete', () => {
    const state: SaveState = {
      ...createInitialSaveState(),
      totalOpens: 100,
      signal: 40,
      discoveredStandard: standardIds(),
      discoveredSecrets: SLICE_REGISTRY.secrets.map(({ collectible }) => collectible.id),
    };
    const pending = createPendingReveal({
      state,
      registry: SLICE_REGISTRY,
      balance: SLICE_BALANCE,
      random: new SequenceRandom([0, 0]),
      transactionId: 'complete-duplicate',
    });

    expect(pending.standard.isNew).toBe(false);
    expect(pending.signal.lockConsumed).toBe(false);
    expect(pending.signal.gain).toBe(0);
    expect(pending.signal.after).toBe(40);
  });

  it('supports a third family through registry/config without special-case drop or Collection code', () => {
    const mp3: GadgetFamilyDefinition = {
      id: 'mp3-player',
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
      balance: SLICE_BALANCE,
      random: new SequenceRandom([0.9, 0, 0.999]),
      transactionId: 'third-family',
    });
    const snapshot = buildCollectionSnapshot(registry, state);

    expect(pending.standard.collectibleId).toBe('mp3-player-common');
    expect(registry.standardItems).toHaveLength(12);
    expect(snapshot.families.map(({ familyId }) => familyId)).toContain('mp3-player');
    expect(snapshot.standardTotal).toBe(12);
  });
});
