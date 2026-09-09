import { describe, expect, it } from 'vitest';

import type { PendingReveal } from '../src/game/systems/drops';
import { createRewardBankingPlan } from '../src/game/systems/rewardBanking';

const makePending = (hiddenPocket: PendingReveal['hiddenPocket']): PendingReveal => ({
  id: 'reward-banking-test',
  baseTotalOpens: 8,
  openingNumber: 9,
  pouchType: 'charged',
  lootPoolId: 'test',
  standard: {
    collectibleId: 'camera-1',
    familyId: 'digital-camera',
    rarity: 'epic',
    isNew: false,
  },
  hiddenPocket,
  chips: {
    before: 100,
    cost: 20,
    base: 10,
    cacheTier: 'cache',
    cacheBonus: 4,
    recycle: 3,
    rawEarned: 17,
    overchargeBonus: 3,
    secretBonus: hiddenPocket ? 40 : 0,
    totalEarned: hiddenPocket ? 60 : 20,
    after: hiddenPocket ? 140 : 100,
  },
  signal: {
    before: 2,
    after: 3,
    gain: 1,
    lockArmedBefore: false,
    lockReached: false,
    lockConsumed: false,
    lockRetained: false,
  },
  overcharge: {
    beforeHundredths: 100,
    afterHundredths: 100,
    appliedGainHundredths: 0,
    bonusChips: 3,
  },
  commit: {
    chips: hiddenPocket ? 140 : 100,
    signal: 3,
    overchargeHundredths: 100,
    activeLootPoolId: 'test',
    totalOpens: 9,
    discoveredStandard: [],
    discoveredSecrets: hiddenPocket ? [hiddenPocket.collectibleId] : [],
    stats: {
      duplicates: 1,
      hiddenPockets: hiddenPocket ? 1 : 0,
    },
  },
});

describe('reward banking ownership', () => {
  it('keeps ordinary openings on one standard-owned page', () => {
    const plan = createRewardBankingPlan(makePending(null), 0);
    expect(plan.pages.map((page) => page.owner)).toEqual(['standard']);
    expect(plan.pages[0]?.legs.map((leg) => leg.kind)).toEqual(['base', 'cache', 'recycle', 'overcharge']);
    expect(plan.totalAmount).toBe(20);
  });

  it('banks standard then Secret when the standard page is active', () => {
    const pending = makePending({
      collectibleId: 'camera-secret',
      familyId: 'digital-camera',
      isNew: true,
      bonusChips: 40,
    });
    const plan = createRewardBankingPlan(pending, 0);
    expect(plan.pages.map((page) => page.owner)).toEqual(['standard', 'secret']);
    expect(plan.pages[0]?.totalAmount).toBe(20);
    expect(plan.pages[1]?.legs).toEqual([{ kind: 'secret', amount: 40 }]);
    expect(plan.totalAmount).toBe(60);
    expect(plan.totalAmount).toBe(pending.chips.totalEarned);
  });

  it('banks Secret then standard when the Secret page is active without changing totals', () => {
    const pending = makePending({
      collectibleId: 'camera-secret',
      familyId: 'digital-camera',
      isNew: false,
      bonusChips: 40,
    });
    const plan = createRewardBankingPlan(pending, 1);
    expect(plan.pages.map((page) => page.owner)).toEqual(['secret', 'standard']);
    expect(plan.pages[0]?.totalAmount).toBe(40);
    expect(plan.pages[1]?.totalAmount).toBe(20);
    expect(plan.totalAmount).toBe(60);
    expect(plan.totalAmount).toBe(pending.chips.totalEarned);
    expect(plan.pages.flatMap((page) => page.legs).reduce((sum, leg) => sum + leg.amount, 0)).toBe(60);
  });

  it('filters zero-value legs without transferring ownership', () => {
    const pending = makePending(null);
    pending.chips.cacheBonus = 0;
    pending.chips.recycle = 0;
    pending.chips.overchargeBonus = 0;
    pending.chips.rawEarned = pending.chips.base;
    pending.chips.totalEarned = pending.chips.base;
    pending.chips.after = pending.chips.before - pending.chips.cost + pending.chips.base;
    const plan = createRewardBankingPlan(pending, 0);
    expect(plan.pages[0]?.legs).toEqual([{ kind: 'base', amount: 10 }]);
    expect(plan.totalAmount).toBe(pending.chips.totalEarned);
  });
});
