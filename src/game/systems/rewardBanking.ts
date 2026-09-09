import type { PendingReveal } from './drops';

export type RewardBankingOwner = 'standard' | 'secret';
export type RewardBankingLegKind = 'base' | 'cache' | 'recycle' | 'overcharge' | 'secret';

export interface RewardBankingLeg {
  kind: RewardBankingLegKind;
  amount: number;
}

export interface RewardBankingPagePlan {
  owner: RewardBankingOwner;
  legs: readonly RewardBankingLeg[];
  totalAmount: number;
}

export interface RewardBankingPlan {
  pages: readonly RewardBankingPagePlan[];
  totalAmount: number;
}

const makePage = (owner: RewardBankingOwner, legs: readonly RewardBankingLeg[]): RewardBankingPagePlan => {
  const positiveLegs = legs.filter((leg) => leg.amount > 0);
  return {
    owner,
    legs: positiveLegs,
    totalAmount: positiveLegs.reduce((sum, leg) => sum + leg.amount, 0),
  };
};

export const createRewardBankingPlan = (
  pending: PendingReveal,
  activeCarouselIndex: number,
): RewardBankingPlan => {
  const standard = makePage('standard', [
    { kind: 'base', amount: pending.chips.base },
    { kind: 'cache', amount: pending.chips.cacheBonus },
    { kind: 'recycle', amount: pending.chips.recycle },
    { kind: 'overcharge', amount: pending.chips.overchargeBonus },
  ]);

  if (!pending.hiddenPocket) {
    return { pages: [standard], totalAmount: standard.totalAmount };
  }

  const secret = makePage('secret', [
    { kind: 'secret', amount: pending.chips.secretBonus },
  ]);
  const pages = activeCarouselIndex === 1 ? [secret, standard] : [standard, secret];
  return {
    pages,
    totalAmount: standard.totalAmount + secret.totalAmount,
  };
};
