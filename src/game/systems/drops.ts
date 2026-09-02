import type { BalanceConfig } from '../data/balance';
import {
  STANDARD_RARITIES,
  type ContentRegistry,
  type GadgetFamilyDefinition,
  type StandardCollectibleRecord,
  type StandardRarity,
} from '../data/collectibles';
import { nextUnit, pickWeighted, type RandomSource, type WeightedEntry } from './random';
import type { ProgressSnapshot, SaveState } from './save';
import { isSignalLockArmed, isStandardCollectionComplete, resolveSignal } from './signal';

export interface StandardRevealResult {
  collectibleId: string;
  familyId: string;
  rarity: StandardRarity;
  isNew: boolean;
}

export interface HiddenPocketResult {
  collectibleId: string;
  familyId: string;
}

export interface PendingReveal {
  id: string;
  baseTotalOpens: number;
  openingNumber: number;
  standard: StandardRevealResult;
  signal: {
    before: number;
    after: number;
    gain: number;
    lockConsumed: boolean;
    lockReached: boolean;
  };
  hiddenPocket: HiddenPocketResult | null;
  commit: ProgressSnapshot;
}

export interface CreatePendingRevealInput {
  state: SaveState;
  registry: ContentRegistry;
  balance: BalanceConfig;
  random: RandomSource;
  transactionId: string;
}

const familyWeight = (balance: BalanceConfig, familyId: string): number => balance.familyWeights[familyId] ?? 1;

const standardWeight = (
  balance: BalanceConfig,
  candidate: Pick<StandardCollectibleRecord, 'familyId' | 'rarity'>,
): number => familyWeight(balance, candidate.familyId) * balance.standardRarityWeights[candidate.rarity];

const chooseFromStandardCandidates = (
  candidates: readonly StandardCollectibleRecord[],
  balance: BalanceConfig,
  random: RandomSource,
): StandardCollectibleRecord =>
  pickWeighted(
    candidates.map((candidate) => ({ value: candidate, weight: standardWeight(balance, candidate) })),
    random,
  );

const chooseFamily = (
  families: readonly GadgetFamilyDefinition[],
  balance: BalanceConfig,
  random: RandomSource,
): GadgetFamilyDefinition =>
  pickWeighted(
    families.map((family) => ({ value: family, weight: familyWeight(balance, family.id) })),
    random,
  );

const chooseRarity = (
  weights: Readonly<Record<StandardRarity, number>>,
  random: RandomSource,
): StandardRarity =>
  pickWeighted(
    STANDARD_RARITIES.map((rarity): WeightedEntry<StandardRarity> => ({ value: rarity, weight: weights[rarity] })),
    random,
  );

const findFirstOpenedFamily = (state: SaveState, registry: ContentRegistry): string | null => {
  const firstCollectibleId = state.discoveredStandard[0];
  return firstCollectibleId ? registry.collectibleFamilyById.get(firstCollectibleId) ?? null : null;
};

const chooseProtectedStandard = (
  state: SaveState,
  registry: ContentRegistry,
  balance: BalanceConfig,
  openingNumber: number,
  random: RandomSource,
): StandardCollectibleRecord => {
  const discovered = new Set(state.discoveredStandard);
  let missing = registry.standardItems.filter(({ collectible }) => !discovered.has(collectible.id));

  if (openingNumber === 2 && balance.onboarding.secondOpeningDifferentFamily) {
    const firstFamilyId = findFirstOpenedFamily(state, registry);
    const otherFamilyMissing = firstFamilyId ? missing.filter(({ familyId }) => familyId !== firstFamilyId) : missing;
    if (otherFamilyMissing.length > 0) {
      missing = otherFamilyMissing;
    }
  }

  if (missing.length === 0) {
    throw new Error('Protected opening has no undiscovered standard collectible to choose');
  }

  return chooseFromStandardCandidates(missing, balance, random);
};

const chooseNormalStandard = (
  registry: ContentRegistry,
  balance: BalanceConfig,
  random: RandomSource,
): StandardCollectibleRecord => {
  const family = chooseFamily(registry.families, balance, random);
  const rarity = chooseRarity(balance.standardRarityWeights, random);
  const collectible = family.standard[rarity];
  return { familyId: family.id, rarity, collectible };
};

const chooseSignalLockedStandard = (
  state: SaveState,
  registry: ContentRegistry,
  balance: BalanceConfig,
  random: RandomSource,
): StandardCollectibleRecord => {
  const discovered = new Set(state.discoveredStandard);
  const missingNonLegendary = registry.standardItems.filter(
    ({ collectible, rarity }) => rarity !== 'legendary' && !discovered.has(collectible.id),
  );

  if (missingNonLegendary.length > 0) {
    return chooseFromStandardCandidates(missingNonLegendary, balance, random);
  }

  const rarity = chooseRarity(balance.signal.lateLockRarityWeights, random);
  const family = chooseFamily(registry.families, balance, random);
  return { familyId: family.id, rarity, collectible: family.standard[rarity] };
};

const chooseHiddenPocket = (
  state: SaveState,
  registry: ContentRegistry,
  balance: BalanceConfig,
  openingNumber: number,
  random: RandomSource,
): HiddenPocketResult | null => {
  if (openingNumber < balance.hiddenPocket.startOpening) {
    return null;
  }

  const discovered = new Set(state.discoveredSecrets);
  const missing = registry.secrets.filter(({ collectible }) => !discovered.has(collectible.id));
  if (missing.length === 0 || nextUnit(random) >= balance.hiddenPocket.chance) {
    return null;
  }

  const selected = pickWeighted(
    missing.map((secret) => ({ value: secret, weight: 1 })),
    random,
  );
  return {
    collectibleId: selected.collectible.id,
    familyId: selected.familyId,
  };
};

export const createPendingReveal = (input: CreatePendingRevealInput): PendingReveal => {
  const { state, registry, balance, random, transactionId } = input;
  if (state.pendingReveal) {
    throw new Error('Cannot roll a new reward while a reveal is pending');
  }
  if (!transactionId) {
    throw new Error('Reveal transaction id is required');
  }

  const openingNumber = state.totalOpens + 1;
  const standardCompleteBefore = isStandardCollectionComplete(registry, state.discoveredStandard);
  const lockArmed = isSignalLockArmed(state.signal, registry, state.discoveredStandard, balance);
  const onboardingProtected = openingNumber <= balance.onboarding.protectedOpenings;

  const selected = onboardingProtected
    ? chooseProtectedStandard(state, registry, balance, openingNumber, random)
    : lockArmed
      ? chooseSignalLockedStandard(state, registry, balance, random)
      : chooseNormalStandard(registry, balance, random);

  const isNew = !state.discoveredStandard.includes(selected.collectible.id);
  const standard: StandardRevealResult = {
    collectibleId: selected.collectible.id,
    familyId: selected.familyId,
    rarity: selected.rarity,
    isNew,
  };

  const signal = resolveSignal({
    before: state.signal,
    rarity: selected.rarity,
    isDuplicate: !isNew,
    lockConsumed: lockArmed,
    standardCompleteBefore,
    balance,
  });

  const hiddenPocket = chooseHiddenPocket(state, registry, balance, openingNumber, random);
  const discoveredStandard = isNew
    ? [...state.discoveredStandard, selected.collectible.id]
    : [...state.discoveredStandard];
  const discoveredSecrets = hiddenPocket
    ? [...state.discoveredSecrets, hiddenPocket.collectibleId]
    : [...state.discoveredSecrets];

  const commit: ProgressSnapshot = {
    discoveredStandard,
    discoveredSecrets,
    signal: signal.after,
    totalOpens: openingNumber,
    stats: {
      duplicates: state.stats.duplicates + (isNew ? 0 : 1),
      hiddenPockets: state.stats.hiddenPockets + (hiddenPocket ? 1 : 0),
    },
  };

  return {
    id: transactionId,
    baseTotalOpens: state.totalOpens,
    openingNumber,
    standard,
    signal: {
      before: signal.before,
      after: signal.after,
      gain: signal.gain,
      lockConsumed: lockArmed,
      lockReached: signal.lockReached,
    },
    hiddenPocket,
    commit,
  };
};
