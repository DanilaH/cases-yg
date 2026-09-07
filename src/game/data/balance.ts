import type { StandardRarity } from './collectibles';

export const OVERCHARGE_BASE_HUNDREDTHS = 100;

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
  /** Hundredths of multiplier added after a retained armed Signal opening: 10 = +0.10. */
  overchargeGainHundredths: number;
}

export interface LiteBalanceConfig {
  familyWeights: Readonly<Record<string, number>>;
  onboarding: {
    protectedOpenings: number;
    secondOpeningDifferentFamily: boolean;
  };
  signalThreshold: number;
  /** Stored multiplier uses hundredths: 100 = x1.00, 150 = x1.50. */
  overchargeCapHundredths: number;
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
  // Phase 2.6 provisional tuning, selected after the first EV sanity pass.
  overchargeCapHundredths: 150,
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
      overchargeGainHundredths: 10,
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
      overchargeGainHundredths: 50,
    },
  },
};

/**
 * Compatibility aliases for older call sites that still read the Basic profile through
 * the pre-Lite `SLICE_BALANCE` shape. All values resolve from the active Lite V2 config.
 */
export const SLICE_BALANCE = {
  ...LITE_V2_BALANCE,
  standardRarityWeights: LITE_V2_BALANCE.pouchProfiles.basic.rarityWeights,
  signal: {
    threshold: LITE_V2_BALANCE.signalThreshold,
  },
  hiddenPocket: {
    startOpening: LITE_V2_BALANCE.hiddenPocketStartOpening,
    chance: LITE_V2_BALANCE.pouchProfiles.basic.hiddenPocketChance,
  },
} as const;
