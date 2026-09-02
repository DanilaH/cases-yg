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
