import { SLICE_BALANCE } from '../game/data/balance';
import { SLICE_REGISTRY, STANDARD_RARITIES, type StandardRarity } from '../game/data/collectibles';
import { createPendingReveal, type PendingReveal } from '../game/systems/drops';
import type { RandomSource } from '../game/systems/random';
import { SaveRepository, createInitialSaveState, type SaveState } from '../game/systems/save';

export type DebugRevealScenario =
  | StandardRarity
  | 'duplicate'
  | 'signal-lock-reached'
  | 'signal-lock-consumed'
  | 'hidden-pocket';

class SequenceRandomSource implements RandomSource {
  private index = 0;

  public constructor(private readonly values: readonly number[], private readonly fallback = 0.99) {}

  public next(): number {
    return this.values[this.index++] ?? this.fallback;
  }
}

const raritySample: Readonly<Record<StandardRarity, number>> = {
  common: 0.3,
  rare: 0.7,
  epic: 0.93,
  legendary: 0.99,
};

const cameraItemId = (rarity: StandardRarity): string => `camera-${rarity}`;

const unique = (values: readonly string[]): string[] => [...new Set(values)];

const without = (values: readonly string[], removed: readonly string[]): string[] => {
  const blocked = new Set(removed);
  return values.filter((value) => !blocked.has(value));
};

const baseDebugState = (state: SaveState): SaveState => ({
  ...state,
  totalOpens: Math.max(3, state.totalOpens),
  pendingReveal: null,
});

const prepareScenario = (state: SaveState, scenario: DebugRevealScenario): { state: SaveState; random: RandomSource } => {
  const base = baseDebugState(state);

  if (STANDARD_RARITIES.includes(scenario as StandardRarity)) {
    const rarity = scenario as StandardRarity;
    return {
      state: {
        ...base,
        signal: 0,
        discoveredStandard: without(base.discoveredStandard, [cameraItemId(rarity)]),
      },
      random: new SequenceRandomSource([0.1, raritySample[rarity], 0.99]),
    };
  }

  if (scenario === 'duplicate') {
    return {
      state: {
        ...base,
        signal: 0,
        discoveredStandard: unique([...base.discoveredStandard, cameraItemId('common')]),
      },
      random: new SequenceRandomSource([0.1, raritySample.common, 0.99]),
    };
  }

  if (scenario === 'signal-lock-reached') {
    return {
      state: {
        ...base,
        signal: Math.max(0, SLICE_BALANCE.signal.threshold - SLICE_BALANCE.signal.duplicateGains.common),
        discoveredStandard: unique([...base.discoveredStandard, cameraItemId('common')]),
      },
      random: new SequenceRandomSource([0.1, raritySample.common, 0.99]),
    };
  }

  if (scenario === 'signal-lock-consumed') {
    const nonLegendary = SLICE_REGISTRY.standardItems
      .filter(({ rarity }) => rarity !== 'legendary')
      .map(({ collectible }) => collectible.id);
    const legendaryIds = SLICE_REGISTRY.standardItems
      .filter(({ rarity }) => rarity === 'legendary')
      .map(({ collectible }) => collectible.id);
    return {
      state: {
        ...base,
        signal: SLICE_BALANCE.signal.threshold,
        discoveredStandard: unique([...without(base.discoveredStandard, legendaryIds), ...nonLegendary]),
      },
      // Late lock chooses rarity first, then family, then Hidden Pocket chance.
      random: new SequenceRandomSource([0.99, 0.1, 0.99]),
    };
  }

  return {
    state: {
      ...base,
      signal: 0,
      discoveredSecrets: [],
    },
    // Normal standard: camera/common, then Hidden Pocket trigger + first missing Secret.
    random: new SequenceRandomSource([0.1, raritySample.common, 0, 0.1]),
  };
};

export const stageDebugReveal = async (
  repository: SaveRepository,
  scenario: DebugRevealScenario,
): Promise<PendingReveal> => {
  const current = await repository.load();
  const prepared = prepareScenario(current, scenario);
  await repository.write(prepared.state);

  const pending = createPendingReveal({
    state: prepared.state,
    registry: SLICE_REGISTRY,
    balance: SLICE_BALANCE,
    random: prepared.random,
    transactionId: `debug-${scenario}-${Date.now()}`,
  });
  await repository.beginPending(prepared.state, pending);
  return pending;
};

export const resetDebugSave = async (repository: SaveRepository): Promise<void> => {
  await repository.write(createInitialSaveState());
};

export const seedDebugCollection = async (
  repository: SaveRepository,
  mode: 'standard' | 'all',
): Promise<SaveState> => {
  const current = await repository.load();
  const next: SaveState = {
    ...current,
    totalOpens: Math.max(1, current.totalOpens),
    pendingReveal: null,
    discoveredStandard: SLICE_REGISTRY.standardItems.map(({ collectible }) => collectible.id),
    discoveredSecrets:
      mode === 'all' ? SLICE_REGISTRY.secrets.map(({ collectible }) => collectible.id) : current.discoveredSecrets,
  };
  await repository.write(next);
  return next;
};
