import type {
  ChipsCacheTierId,
  ChipsRange,
  LiteBalanceConfig,
  PouchProfile,
  PouchType,
} from '../data/balance';
import {
  STANDARD_RARITIES,
  type ContentRegistry,
  type LootPoolId,
  type StandardCollectibleRecord,
  type StandardRarity,
} from '../data/collectibles';
import { resolveOverchargeTransition, type OverchargeTransition } from './overcharge';
import { nextUnit, pickWeighted, type RandomSource, type WeightedEntry } from './random';

export interface LiteRewardState {
  chips: number;
  signal: number;
  overchargeHundredths: number;
  totalOpens: number;
  activeLootPoolId: LootPoolId;
  discoveredStandard: readonly string[];
  discoveredSecrets: readonly string[];
}

export interface LiteStandardReward {
  collectibleId: string;
  familyId: string;
  rarity: StandardRarity;
  isNew: boolean;
}

export interface LiteHiddenPocketReward {
  collectibleId: string;
  familyId: string;
  isNew: boolean;
  /** Persisted jackpot payout for this exact Hidden Pocket transaction. */
  bonusChips: number;
}

export interface LiteChipsReward {
  before: number;
  cost: number;
  base: number;
  cacheTier: ChipsCacheTierId;
  cacheBonus: number;
  recycle: number;
  rawEarned: number;
  overchargeBonus: number;
  secretBonus: number;
  totalEarned: number;
  after: number;
}

export interface LiteSignalReward {
  before: number;
  after: number;
  gain: number;
  lockArmedBefore: boolean;
  lockConsumed: boolean;
  lockReached: boolean;
  lockRetained: boolean;
}

export type LiteOverchargeReward = OverchargeTransition;

export interface LiteRewardDraft {
  pouchType: PouchType;
  lootPoolId: LootPoolId;
  openingNumber: number;
  standard: LiteStandardReward;
  chips: LiteChipsReward;
  signal: LiteSignalReward;
  overcharge: LiteOverchargeReward;
  hiddenPocket: LiteHiddenPocketReward | null;
}

export interface ResolveLiteRewardInput {
  state: LiteRewardState;
  pouchType: PouchType;
  registry: ContentRegistry;
  balance: LiteBalanceConfig;
  random: RandomSource;
}

export interface PouchEconomyAnalysis {
  pouchType: PouchType;
  cost: number;
  expectedBaseChips: number;
  expectedCacheBonus: number;
  expectedRecycleIfAllDuplicate: number;
  expectedSecretBonus: number;
  expectedReturnIfAllDuplicate: number;
  expectedNetIfAllDuplicate: number;
}

const familyWeight = (balance: LiteBalanceConfig, familyId: string): number => balance.familyWeights[familyId] ?? 1;

const ensureWholeRange = (range: ChipsRange): void => {
  if (
    !Number.isInteger(range.min) ||
    !Number.isInteger(range.max) ||
    range.min < 0 ||
    range.max < range.min
  ) {
    throw new Error(`Invalid CHIPS range: ${range.min}..${range.max}`);
  }
};

const rollRange = (range: ChipsRange, random: RandomSource): number => {
  ensureWholeRange(range);
  if (range.min === range.max) {
    return range.min;
  }
  return range.min + Math.floor(nextUnit(random) * (range.max - range.min + 1));
};

const getPoolFamilies = (registry: ContentRegistry, lootPoolId: LootPoolId) => {
  const pool = registry.lootPoolById.get(lootPoolId);
  if (!pool) {
    throw new Error(`Unknown loot pool: ${lootPoolId}`);
  }

  return pool.familyIds.map((familyId) => {
    const family = registry.familyById.get(familyId);
    if (!family) {
      throw new Error(`Loot pool ${lootPoolId} references unknown family ${familyId}`);
    }
    return family;
  });
};

const chooseFromMissingCandidates = (
  candidates: readonly StandardCollectibleRecord[],
  balance: LiteBalanceConfig,
  profile: PouchProfile,
  random: RandomSource,
): StandardCollectibleRecord => {
  const availableRarities = STANDARD_RARITIES.filter(
    (rarity) => profile.rarityWeights[rarity] > 0 && candidates.some((candidate) => candidate.rarity === rarity),
  );
  const rarity = pickWeighted(
    availableRarities.map(
      (candidateRarity): WeightedEntry<StandardRarity> => ({
        value: candidateRarity,
        weight: profile.rarityWeights[candidateRarity],
      }),
    ),
    random,
  );
  const rarityCandidates = candidates.filter((candidate) => candidate.rarity === rarity);
  return pickWeighted(
    rarityCandidates.map((candidate) => ({
      value: candidate,
      weight: familyWeight(balance, candidate.familyId),
    })),
    random,
  );
};

const chooseRarity = (profile: PouchProfile, random: RandomSource): StandardRarity =>
  pickWeighted(
    STANDARD_RARITIES.map(
      (rarity): WeightedEntry<StandardRarity> => ({ value: rarity, weight: profile.rarityWeights[rarity] }),
    ),
    random,
  );

const chooseNormalStandard = (
  registry: ContentRegistry,
  lootPoolId: LootPoolId,
  balance: LiteBalanceConfig,
  profile: PouchProfile,
  random: RandomSource,
): StandardCollectibleRecord => {
  const family = pickWeighted(
    getPoolFamilies(registry, lootPoolId).map((candidate) => ({
      value: candidate,
      weight: familyWeight(balance, candidate.id),
    })),
    random,
  );
  const rarity = chooseRarity(profile, random);
  return {
    familyId: family.id,
    lootPoolId,
    rarity,
    collectible: family.standard[rarity],
  };
};

const findFirstOpenedFamilyInPool = (
  state: LiteRewardState,
  registry: ContentRegistry,
  lootPoolId: LootPoolId,
): string | null => {
  for (const collectibleId of state.discoveredStandard) {
    const familyId = registry.collectibleFamilyById.get(collectibleId);
    if (!familyId) continue;
    const family = registry.familyById.get(familyId);
    if (family?.dropId === lootPoolId) {
      return familyId;
    }
  }
  return null;
};

const getMissingEligibleStandard = (
  state: LiteRewardState,
  registry: ContentRegistry,
  profile: PouchProfile,
): StandardCollectibleRecord[] => {
  const discovered = new Set(state.discoveredStandard);
  return registry.standardItems.filter(
    ({ lootPoolId, rarity, collectible }) =>
      lootPoolId === state.activeLootPoolId &&
      profile.rarityWeights[rarity] > 0 &&
      !discovered.has(collectible.id),
  );
};

const chooseProtectedStandard = (
  state: LiteRewardState,
  registry: ContentRegistry,
  balance: LiteBalanceConfig,
  profile: PouchProfile,
  ownedInPool: number,
  random: RandomSource,
): StandardCollectibleRecord | null => {
  let missing = getMissingEligibleStandard(state, registry, profile);

  if (ownedInPool === 1 && balance.onboarding.secondOpeningDifferentFamily) {
    const firstFamilyId = findFirstOpenedFamilyInPool(state, registry, state.activeLootPoolId);
    const otherFamilyMissing = firstFamilyId ? missing.filter(({ familyId }) => familyId !== firstFamilyId) : missing;
    if (otherFamilyMissing.length > 0) {
      missing = otherFamilyMissing;
    }
  }

  if (missing.length === 0) {
    return null;
  }

  return chooseFromMissingCandidates(missing, balance, profile, random);
};

const resolveStandard = (
  state: LiteRewardState,
  registry: ContentRegistry,
  balance: LiteBalanceConfig,
  profile: PouchProfile,
  random: RandomSource,
): { selected: StandardCollectibleRecord; signalLockConsumed: boolean } => {
  const lockArmed = state.signal >= balance.signalThreshold;
  if (lockArmed) {
    const missingEligible = getMissingEligibleStandard(state, registry, profile);
    if (missingEligible.length > 0) {
      return {
        selected: chooseFromMissingCandidates(missingEligible, balance, profile, random),
        signalLockConsumed: true,
      };
    }
  }

  const discovered = new Set(state.discoveredStandard);
  const ownedInPool = registry.standardItems.reduce(
    (count, item) => count + (item.lootPoolId === state.activeLootPoolId && discovered.has(item.collectible.id) ? 1 : 0),
    0,
  );
  if (ownedInPool < balance.onboarding.protectedOpenings) {
    const protectedResult = chooseProtectedStandard(state, registry, balance, profile, ownedInPool, random);
    if (protectedResult) {
      return { selected: protectedResult, signalLockConsumed: false };
    }
  }

  return {
    selected: chooseNormalStandard(registry, state.activeLootPoolId, balance, profile, random),
    signalLockConsumed: false,
  };
};

const resolveSignal = (
  state: LiteRewardState,
  balance: LiteBalanceConfig,
  isDuplicate: boolean,
  lockConsumed: boolean,
): LiteSignalReward => {
  const before = Math.max(0, Math.min(Math.floor(state.signal), balance.signalThreshold));
  const lockArmedBefore = before >= balance.signalThreshold;

  if (lockConsumed) {
    return {
      before,
      after: 0,
      gain: 0,
      lockArmedBefore,
      lockConsumed: true,
      lockReached: false,
      lockRetained: false,
    };
  }

  if (!isDuplicate || lockArmedBefore) {
    return {
      before,
      after: before,
      gain: 0,
      lockArmedBefore,
      lockConsumed: false,
      lockReached: false,
      lockRetained: lockArmedBefore,
    };
  }

  const after = Math.min(balance.signalThreshold, before + 1);
  return {
    before,
    after,
    gain: after - before,
    lockArmedBefore,
    lockConsumed: false,
    lockReached: before < balance.signalThreshold && after >= balance.signalThreshold,
    lockRetained: false,
  };
};

const chooseCache = (
  profile: PouchProfile,
  random: RandomSource,
): { tier: ChipsCacheTierId; reward: number } => {
  const selected = pickWeighted(
    profile.cacheTiers.map((tier) => ({ value: tier, weight: tier.weight })),
    random,
  );
  return {
    tier: selected.id,
    reward: rollRange(selected.reward, random),
  };
};

const chooseHiddenPocket = (
  state: LiteRewardState,
  registry: ContentRegistry,
  balance: LiteBalanceConfig,
  profile: PouchProfile,
  openingNumber: number,
  random: RandomSource,
): LiteHiddenPocketReward | null => {
  if (openingNumber < balance.hiddenPocketStartOpening) {
    return null;
  }

  const available = registry.secrets.filter(({ lootPoolId }) => lootPoolId === state.activeLootPoolId);
  if (available.length === 0 || nextUnit(random) >= profile.hiddenPocketChance) {
    return null;
  }

  const discovered = new Set(state.discoveredSecrets);
  const missing = available.filter(({ collectible }) => !discovered.has(collectible.id));
  const candidates = missing.length > 0 ? missing : available;
  const selected = pickWeighted(
    candidates.map((candidate) => ({ value: candidate, weight: 1 })),
    random,
  );
  return {
    collectibleId: selected.collectible.id,
    familyId: selected.familyId,
    isNew: !discovered.has(selected.collectible.id),
    bonusChips: balance.secretBonusChips,
  };
};

export const resolveLitePouchReward = (input: ResolveLiteRewardInput): LiteRewardDraft => {
  const { state, pouchType, registry, balance, random } = input;
  const profile = balance.pouchProfiles[pouchType];
  if (!registry.lootPoolById.has(state.activeLootPoolId)) {
    throw new Error(`Cannot open pouch for unknown loot pool: ${state.activeLootPoolId}`);
  }
  if (!Number.isInteger(state.chips) || state.chips < 0) {
    throw new Error(`Invalid CHIPS balance: ${state.chips}`);
  }
  if (state.chips < profile.chipsCost) {
    throw new Error(`Insufficient CHIPS for ${pouchType} pouch`);
  }
  if (
    !Number.isInteger(state.overchargeHundredths) ||
    state.overchargeHundredths < 100 ||
    state.overchargeHundredths > balance.overchargeCapHundredths ||
    (state.signal < balance.signalThreshold && state.overchargeHundredths !== 100)
  ) {
    throw new Error(`Invalid Overcharge state: ${state.overchargeHundredths}`);
  }

  const openingNumber = state.totalOpens + 1;
  const { selected, signalLockConsumed } = resolveStandard(
    state,
    registry,
    balance,
    profile,
    random,
  );
  const isNew = !state.discoveredStandard.includes(selected.collectible.id);
  const standard: LiteStandardReward = {
    collectibleId: selected.collectible.id,
    familyId: selected.familyId,
    rarity: selected.rarity,
    isNew,
  };

  const signal = resolveSignal(state, balance, !isNew, signalLockConsumed);
  const base = rollRange(profile.baseChipsReward, random);
  const cache = chooseCache(profile, random);
  const recycle = isNew ? 0 : balance.duplicateRecycleChips[selected.rarity];
  const rawEarned = base + cache.reward + recycle;
  const overcharge = resolveOverchargeTransition({
    beforeHundredths: state.overchargeHundredths,
    rawEarnedChips: rawEarned,
    lockArmedBefore: signal.lockArmedBefore,
    lockConsumed: signal.lockConsumed,
    lockRetained: signal.lockRetained,
    pouchGainHundredths: profile.overchargeGainHundredths,
    capHundredths: balance.overchargeCapHundredths,
  });
  const hiddenPocket = chooseHiddenPocket(state, registry, balance, profile, openingNumber, random);
  const secretBonus = hiddenPocket?.bonusChips ?? 0;
  const totalEarned = rawEarned + overcharge.bonusChips + secretBonus;
  const chips: LiteChipsReward = {
    before: state.chips,
    cost: profile.chipsCost,
    base,
    cacheTier: cache.tier,
    cacheBonus: cache.reward,
    recycle,
    rawEarned,
    overchargeBonus: overcharge.bonusChips,
    secretBonus,
    totalEarned,
    after: state.chips - profile.chipsCost + totalEarned,
  };

  return {
    pouchType,
    lootPoolId: state.activeLootPoolId,
    openingNumber,
    standard,
    chips,
    signal,
    overcharge,
    hiddenPocket,
  };
};

const expectedRange = (range: ChipsRange): number => {
  ensureWholeRange(range);
  return (range.min + range.max) / 2;
};

const weightedMean = <T>(entries: readonly T[], weight: (entry: T) => number, value: (entry: T) => number): number => {
  const totalWeight = entries.reduce((sum, entry) => sum + Math.max(0, weight(entry)), 0);
  if (totalWeight <= 0) {
    throw new Error('Cannot calculate expected value for a zero-weight distribution');
  }
  return entries.reduce((sum, entry) => sum + Math.max(0, weight(entry)) * value(entry), 0) / totalWeight;
};

export const analyzePouchEconomy = (
  balance: LiteBalanceConfig,
  pouchType: PouchType,
): PouchEconomyAnalysis => {
  const profile = balance.pouchProfiles[pouchType];
  const expectedBaseChips = expectedRange(profile.baseChipsReward);
  const expectedCacheBonus = weightedMean(
    profile.cacheTiers,
    (tier) => tier.weight,
    (tier) => expectedRange(tier.reward),
  );
  const expectedRecycleIfAllDuplicate = weightedMean(
    STANDARD_RARITIES,
    (rarity) => profile.rarityWeights[rarity],
    (rarity) => balance.duplicateRecycleChips[rarity],
  );
  const expectedSecretBonus = profile.hiddenPocketChance * balance.secretBonusChips;
  const expectedReturnIfAllDuplicate =
    expectedBaseChips + expectedCacheBonus + expectedRecycleIfAllDuplicate + expectedSecretBonus;

  return {
    pouchType,
    cost: profile.chipsCost,
    expectedBaseChips,
    expectedCacheBonus,
    expectedRecycleIfAllDuplicate,
    expectedSecretBonus,
    expectedReturnIfAllDuplicate,
    expectedNetIfAllDuplicate: expectedReturnIfAllDuplicate - profile.chipsCost,
  };
};
