import { LITE_V2_BALANCE, type PouchType } from '../game/data/balance';
import {
  SLICE_LOOT_POOL_ID,
  SLICE_REGISTRY,
  STANDARD_RARITIES,
  type StandardRarity,
} from '../game/data/collectibles';
import { createPendingReveal, type PendingReveal } from '../game/systems/drops';
import type { RandomSource } from '../game/systems/random';
import { SaveRepository, createInitialSaveState, type SaveState } from '../game/systems/save';

export type DebugRevealScenario =
  | StandardRarity
  | 'epic-phone'
  | 'duplicate'
  | 'signal-lock-reached'
  | 'signal-lock-consumed'
  | 'signal-lock-waiting'
  | 'hidden-pocket';

class SequenceRandomSource implements RandomSource {
  private index = 0;

  public constructor(private readonly values: readonly number[], private readonly fallback = 0.99) {}

  public next(): number {
    return this.values[this.index++] ?? this.fallback;
  }
}

const basicRaritySample: Readonly<Record<Exclude<StandardRarity, 'legendary'>, number>> = {
  common: 0.1,
  rare: 0.8,
  epic: 0.99,
};

const cameraItemId = (rarity: StandardRarity): string => `camera-${rarity}`;
const phoneItemId = (rarity: StandardRarity): string => `flip-phone-${rarity}`;

const unique = (values: readonly string[]): string[] => [...new Set(values)];

const without = (values: readonly string[], removed: readonly string[]): string[] => {
  const blocked = new Set(removed);
  return values.filter((value) => !blocked.has(value));
};

const baseDebugState = (state: SaveState): SaveState => ({
  ...state,
  activeLootPoolId: SLICE_LOOT_POOL_ID,
  totalOpens: Math.max(3, state.totalOpens),
  pendingReveal: null,
});

const allBasicEligibleIds = (): string[] =>
  SLICE_REGISTRY.standardItems
    .filter(({ rarity }) => LITE_V2_BALANCE.pouchProfiles.basic.rarityWeights[rarity] > 0)
    .map(({ collectible }) => collectible.id);

const prepareScenario = (
  state: SaveState,
  scenario: DebugRevealScenario,
): { state: SaveState; random: RandomSource; pouchType: PouchType } => {
  const base = baseDebugState(state);

  if (scenario === 'epic-phone') {
    return {
      state: {
        ...base,
        signal: 0,
        discoveredStandard: without(base.discoveredStandard, [phoneItemId('epic')]),
      },
      random: new SequenceRandomSource([0.9, basicRaritySample.epic, 0, 0, 0.99]),
      pouchType: 'basic',
    };
  }

  if (scenario === 'legendary') {
    return {
      state: {
        ...base,
        chips: Math.max(base.chips, LITE_V2_BALANCE.pouchProfiles.charged.chipsCost),
        signal: 0,
        discoveredStandard: without(base.discoveredStandard, [cameraItemId('legendary')]),
      },
      random: new SequenceRandomSource([0.1, 0.99, 0, 0, 0.99]),
      pouchType: 'charged',
    };
  }

  if (STANDARD_RARITIES.includes(scenario as StandardRarity)) {
    const rarity = scenario as Exclude<StandardRarity, 'legendary'>;
    return {
      state: {
        ...base,
        signal: 0,
        discoveredStandard: without(base.discoveredStandard, [cameraItemId(rarity)]),
      },
      random: new SequenceRandomSource([0.1, basicRaritySample[rarity], 0, 0, 0.99]),
      pouchType: 'basic',
    };
  }

  if (scenario === 'duplicate') {
    return {
      state: {
        ...base,
        signal: 0,
        discoveredStandard: unique([...base.discoveredStandard, cameraItemId('common')]),
      },
      random: new SequenceRandomSource([0.1, basicRaritySample.common, 0, 0, 0.99]),
      pouchType: 'basic',
    };
  }

  if (scenario === 'signal-lock-reached') {
    return {
      state: {
        ...base,
        signal: LITE_V2_BALANCE.signalThreshold - 1,
        discoveredStandard: unique([...base.discoveredStandard, cameraItemId('common')]),
      },
      random: new SequenceRandomSource([0.1, basicRaritySample.common, 0, 0, 0.99]),
      pouchType: 'basic',
    };
  }

  if (scenario === 'signal-lock-consumed') {
    const keepMissing = cameraItemId('epic');
    return {
      state: {
        ...base,
        signal: LITE_V2_BALANCE.signalThreshold,
        discoveredStandard: unique([
          ...base.discoveredStandard,
          ...allBasicEligibleIds().filter((collectibleId) => collectibleId !== keepMissing),
        ]),
      },
      random: new SequenceRandomSource([0, 0, 0, 0, 0.99]),
      pouchType: 'basic',
    };
  }

  if (scenario === 'signal-lock-waiting') {
    return {
      state: {
        ...base,
        signal: LITE_V2_BALANCE.signalThreshold,
        discoveredStandard: unique([...base.discoveredStandard, ...allBasicEligibleIds()]),
      },
      random: new SequenceRandomSource([0.1, basicRaritySample.common, 0, 0, 0.99]),
      pouchType: 'basic',
    };
  }

  return {
    state: {
      ...base,
      signal: 0,
      discoveredSecrets: [],
    },
    // Normal standard: camera/common, base CHIPS, no cache, Hidden Pocket trigger, first Secret.
    random: new SequenceRandomSource([0.1, basicRaritySample.common, 0, 0, 0, 0.1]),
    pouchType: 'basic',
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
    balance: LITE_V2_BALANCE,
    random: prepared.random,
    transactionId: `debug-${scenario}-${Date.now()}`,
    pouchType: prepared.pouchType,
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
