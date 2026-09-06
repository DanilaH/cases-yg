import type { StandardRarity } from './collectibles';

export interface BalanceConfig {
  standardRarityWeights: Readonly<Record<StandardRarity, number>>;
  familyWeights: Readonly<Record<string, number>>;
  onboarding: {
    protectedOpenings: number;
    secondOpeningDifferentFamily: boolean;
  };
  signal: {
    threshold: number;
    duplicateGains: Readonly<Record<StandardRarity, number>>;
    lateLockRarityWeights: Readonly<Record<StandardRarity, number>>;
  };
  hiddenPocket: {
    startOpening: number;
    chance: number;
  };
}

export const SLICE_BALANCE: BalanceConfig = {
  standardRarityWeights: {
    common: 60,
    rare: 28,
    epic: 10,
    legendary: 2,
  },
  familyWeights: {
    camera: 1,
    'flip-phone': 1,
  },
  onboarding: {
    protectedOpenings: 3,
    secondOpeningDifferentFamily: true,
  },
  signal: {
    threshold: 100,
    duplicateGains: {
      common: 25,
      rare: 20,
      epic: 15,
      legendary: 10,
    },
    lateLockRarityWeights: {
      common: 0,
      rare: 60,
      epic: 30,
      legendary: 10,
    },
  },
  hiddenPocket: {
    startOpening: 4,
    chance: 0.03,
  },
};

export const POUCH_TYPES = ['basic', 'charged'] as const;
export type PouchType = (typeof POUCH_TYPES)[number];

export const CHIPS_CACHE_TIER_IDS = ['none', 'cache', 'big', 'mega'] as const;
export type ChipsCacheTierId = (typeof CHIPS_CACHE_TIER_IDS)[number];

export interface ChipsRange {
  min: number;
  max: number;
}

export interface ChipsCacheTier {
  id: ChipsCacheTierId;
  weight: number;
  reward: ChipsRange;
}

export interface PouchProfile {
  chipsCost: number;
  baseChipsReward: ChipsRange;
  cacheTiers: readonly ChipsCacheTier[];
  rarityWeights: Readonly<Record<StandardRarity, number>>;
  hiddenPocketChance: number;
}

export interface LiteBalanceConfig {
  familyWeights: Readonly<Record<string, number>>;
  onboarding: {
    protectedOpenings: number;
    secondOpeningDifferentFamily: boolean;
  };
  signalThreshold: number;
  hiddenPocketStartOpening: number;
  duplicateRecycleChips: Readonly<Record<StandardRarity, number>>;
  pouchProfiles: Readonly<Record<PouchType, PouchProfile>>;
}

/**
 * First implementation-pass tuning. These numbers are intentionally centralized and
 * provisional: simulation + repeated hands-on should change them without changing
 * the Lite V2 mechanics or transaction shape.
 */
export const LITE_V2_BALANCE: LiteBalanceConfig = {
  familyWeights: {
    camera: 1,
    'flip-phone': 1,
  },
  onboarding: {
    protectedOpenings: 3,
    secondOpeningDifferentFamily: true,
  },
  signalThreshold: 4,
  hiddenPocketStartOpening: 4,
  duplicateRecycleChips: {
    common: 2,
    rare: 4,
    epic: 8,
    legendary: 15,
  },
  pouchProfiles: {
    basic: {
      chipsCost: 0,
      baseChipsReward: { min: 6, max: 10 },
      cacheTiers: [
        { id: 'none', weight: 90, reward: { min: 0, max: 0 } },
        { id: 'cache', weight: 7, reward: { min: 20, max: 35 } },
        { id: 'big', weight: 2.5, reward: { min: 45, max: 75 } },
        { id: 'mega', weight: 0.5, reward: { min: 120, max: 180 } },
      ],
      rarityWeights: {
        common: 72,
        rare: 25,
        epic: 3,
        legendary: 0,
      },
      hiddenPocketChance: 0.015,
    },
    charged: {
      chipsCost: 60,
      baseChipsReward: { min: 18, max: 24 },
      cacheTiers: [
        { id: 'none', weight: 78, reward: { min: 0, max: 0 } },
        { id: 'cache', weight: 15, reward: { min: 20, max: 35 } },
        { id: 'big', weight: 5.5, reward: { min: 45, max: 75 } },
        { id: 'mega', weight: 1.5, reward: { min: 120, max: 180 } },
      ],
      rarityWeights: {
        common: 35,
        rare: 40,
        epic: 20,
        legendary: 5,
      },
      hiddenPocketChance: 0.06,
    },
  },
};
