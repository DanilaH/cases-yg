import { describe, expect, it } from 'vitest';

import { LITE_V2_BALANCE, type PouchType } from '../src/game/data/balance';
import { GAME_LOOT_POOL_IDS, GAME_REGISTRY, type LootPoolId } from '../src/game/data/collectibles';
import { createPendingReveal } from '../src/game/systems/drops';
import { analyzePouchEconomy } from '../src/game/systems/pouches';
import type { RandomSource } from '../src/game/systems/random';
import {
  commitPendingRevealState,
  createInitialSaveState,
  stagePendingReveal,
  type SaveState,
} from '../src/game/systems/save';

class Mulberry32 implements RandomSource {
  public constructor(private seed: number) {}

  public next(): number {
    this.seed = (this.seed + 0x6d2b79f5) >>> 0;
    let value = this.seed;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  }
}

type StrategyName =
  | 'sequential-full-eager'
  | 'standards-first-eager'
  | 'signal-frugal'
  | 'protection-hop';

type MilestoneKey =
  | 'first60Chips'
  | 'firstChargedOpen'
  | 'firstDropStandards'
  | 'firstDropSecrets'
  | 'firstDropFull'
  | 'allStandards'
  | 'allSecrets'
  | 'fullCollection';

interface TrialResult extends Record<MilestoneKey, number | null> {
  totalOpens: number;
  basicOpens: number;
  chargedOpens: number;
  duplicates: number;
  hiddenPockets: number;
  finalWallet: number;
  overchargeBonusChips: number;
  signalLockConsumes: number;
  signalLockRetains: number;
}

const poolStandardIds = new Map<LootPoolId, readonly string[]>(
  GAME_LOOT_POOL_IDS.map((poolId) => [
    poolId,
    GAME_REGISTRY.standardItems
      .filter(({ lootPoolId }) => lootPoolId === poolId)
      .map(({ collectible }) => collectible.id),
  ]),
);

const poolSecretIds = new Map<LootPoolId, readonly string[]>(
  GAME_LOOT_POOL_IDS.map((poolId) => [
    poolId,
    GAME_REGISTRY.secrets
      .filter(({ lootPoolId }) => lootPoolId === poolId)
      .map(({ collectible }) => collectible.id),
  ]),
);

const ownedCount = (owned: readonly string[], ids: readonly string[]): number => {
  const set = new Set(owned);
  return ids.reduce((count, id) => count + (set.has(id) ? 1 : 0), 0);
};

const poolCounts = (state: SaveState, poolId: LootPoolId) => ({
  standards: ownedCount(state.discoveredStandard, poolStandardIds.get(poolId) ?? []),
  secrets: ownedCount(state.discoveredSecrets, poolSecretIds.get(poolId) ?? []),
});

const missingBasicEligible = (state: SaveState, poolId: LootPoolId): number => {
  const discovered = new Set(state.discoveredStandard);
  return GAME_REGISTRY.standardItems.filter(
    ({ lootPoolId, rarity, collectible }) =>
      lootPoolId === poolId &&
      LITE_V2_BALANCE.pouchProfiles.basic.rarityWeights[rarity] > 0 &&
      !discovered.has(collectible.id),
  ).length;
};

const firstIncompleteStandardPool = (state: SaveState): LootPoolId | null =>
  GAME_LOOT_POOL_IDS.find((poolId) => poolCounts(state, poolId).standards < 8) ?? null;

const firstIncompleteSecretPool = (state: SaveState): LootPoolId | null =>
  GAME_LOOT_POOL_IDS.find((poolId) => poolCounts(state, poolId).secrets < 2) ?? null;

const firstIncompleteFullPool = (state: SaveState): LootPoolId | null =>
  GAME_LOOT_POOL_IDS.find((poolId) => {
    const counts = poolCounts(state, poolId);
    return counts.standards < 8 || counts.secrets < 2;
  }) ?? null;

const eagerPouch = (state: SaveState): PouchType =>
  state.chips >= LITE_V2_BALANCE.pouchProfiles.charged.chipsCost ? 'charged' : 'basic';

const chooseAction = (strategy: StrategyName, state: SaveState): { poolId: LootPoolId; pouchType: PouchType } => {
  const current = state.activeLootPoolId;

  if (strategy === 'sequential-full-eager') {
    const counts = poolCounts(state, current);
    const poolId = counts.standards === 8 && counts.secrets === 2
      ? (firstIncompleteFullPool(state) ?? current)
      : current;
    return { poolId, pouchType: eagerPouch(state) };
  }

  if (strategy === 'protection-hop') {
    const protectedPool = GAME_LOOT_POOL_IDS.find((poolId) => poolCounts(state, poolId).standards < 3);
    if (protectedPool) {
      return { poolId: protectedPool, pouchType: 'basic' };
    }
  }

  const incompleteStandards = firstIncompleteStandardPool(state);
  if (incompleteStandards) {
    const currentCounts = poolCounts(state, current);
    const poolId = currentCounts.standards < 8 ? current : incompleteStandards;

    if (strategy === 'standards-first-eager') {
      return { poolId, pouchType: eagerPouch(state) };
    }

    const shouldSpendCharged =
      state.chips >= LITE_V2_BALANCE.pouchProfiles.charged.chipsCost &&
      (state.signal >= LITE_V2_BALANCE.signalThreshold || missingBasicEligible(state, poolId) === 0);
    return { poolId, pouchType: shouldSpendCharged ? 'charged' : 'basic' };
  }

  const poolId = firstIncompleteSecretPool(state) ?? current;
  return { poolId, pouchType: eagerPouch(state) };
};

const updateMilestones = (state: SaveState, result: TrialResult): void => {
  const anyStandards = GAME_LOOT_POOL_IDS.some((poolId) => poolCounts(state, poolId).standards === 8);
  const anySecrets = GAME_LOOT_POOL_IDS.some((poolId) => poolCounts(state, poolId).secrets === 2);
  const anyFull = GAME_LOOT_POOL_IDS.some((poolId) => {
    const counts = poolCounts(state, poolId);
    return counts.standards === 8 && counts.secrets === 2;
  });

  if (result.first60Chips === null && state.chips >= LITE_V2_BALANCE.pouchProfiles.charged.chipsCost) {
    result.first60Chips = state.totalOpens;
  }
  if (result.firstDropStandards === null && anyStandards) result.firstDropStandards = state.totalOpens;
  if (result.firstDropSecrets === null && anySecrets) result.firstDropSecrets = state.totalOpens;
  if (result.firstDropFull === null && anyFull) result.firstDropFull = state.totalOpens;
  if (result.allStandards === null && state.discoveredStandard.length === 48) result.allStandards = state.totalOpens;
  if (result.allSecrets === null && state.discoveredSecrets.length === 12) result.allSecrets = state.totalOpens;
  if (
    result.fullCollection === null &&
    state.discoveredStandard.length === 48 &&
    state.discoveredSecrets.length === 12
  ) {
    result.fullCollection = state.totalOpens;
  }
};

const runTrial = (strategy: StrategyName, seed: number, maxOpens = 2000): TrialResult => {
  const random = new Mulberry32(seed);
  let state = createInitialSaveState();
  const result: TrialResult = {
    first60Chips: null,
    firstChargedOpen: null,
    firstDropStandards: null,
    firstDropSecrets: null,
    firstDropFull: null,
    allStandards: null,
    allSecrets: null,
    fullCollection: null,
    totalOpens: 0,
    basicOpens: 0,
    chargedOpens: 0,
    duplicates: 0,
    hiddenPockets: 0,
    finalWallet: 0,
    overchargeBonusChips: 0,
    signalLockConsumes: 0,
    signalLockRetains: 0,
  };

  while (state.totalOpens < maxOpens && result.fullCollection === null) {
    const action = chooseAction(strategy, state);
    state = { ...state, activeLootPoolId: action.poolId };

    if (action.pouchType === 'charged' && result.firstChargedOpen === null) {
      result.firstChargedOpen = state.totalOpens + 1;
    }

    const pending = createPendingReveal({
      state,
      registry: GAME_REGISTRY,
      balance: LITE_V2_BALANCE,
      random,
      transactionId: `${strategy}-${seed}-${state.totalOpens + 1}`,
      pouchType: action.pouchType,
    });

    result.basicOpens += action.pouchType === 'basic' ? 1 : 0;
    result.chargedOpens += action.pouchType === 'charged' ? 1 : 0;
    result.overchargeBonusChips += pending.chips.overchargeBonus;
    result.signalLockConsumes += pending.signal.lockConsumed ? 1 : 0;
    result.signalLockRetains += pending.signal.lockRetained ? 1 : 0;

    state = commitPendingRevealState(stagePendingReveal(state, pending));
    updateMilestones(state, result);
  }

  result.totalOpens = state.totalOpens;
  result.duplicates = state.stats.duplicates;
  result.hiddenPockets = state.stats.hiddenPockets;
  result.finalWallet = state.chips;
  return result;
};

const quantile = (values: readonly number[], q: number): number => {
  const sorted = [...values].sort((left, right) => left - right);
  if (sorted.length === 0) return Number.NaN;
  const index = (sorted.length - 1) * q;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sorted[lower]!;
  const fraction = index - lower;
  return sorted[lower]! * (1 - fraction) + sorted[upper]! * fraction;
};

const summarize = (trials: readonly TrialResult[]) => {
  const milestone = (key: MilestoneKey) => {
    const values = trials.map((trial) => trial[key]).filter((value): value is number => value !== null);
    return {
      completed: values.length,
      p10: Math.round(quantile(values, 0.1) * 10) / 10,
      p50: Math.round(quantile(values, 0.5) * 10) / 10,
      p90: Math.round(quantile(values, 0.9) * 10) / 10,
      max: Math.max(...values),
    };
  };
  const numeric = (value: (trial: TrialResult) => number) => {
    const values = trials.map(value);
    return {
      p50: Math.round(quantile(values, 0.5) * 10) / 10,
      p90: Math.round(quantile(values, 0.9) * 10) / 10,
      mean: Math.round((values.reduce((sum, current) => sum + current, 0) / values.length) * 100) / 100,
    };
  };

  return {
    milestones: {
      first60Chips: milestone('first60Chips'),
      firstChargedOpen: milestone('firstChargedOpen'),
      firstDropStandards: milestone('firstDropStandards'),
      firstDropSecrets: milestone('firstDropSecrets'),
      firstDropFull: milestone('firstDropFull'),
      allStandards: milestone('allStandards'),
      allSecrets: milestone('allSecrets'),
      fullCollection: milestone('fullCollection'),
    },
    chargedOpens: numeric((trial) => trial.chargedOpens),
    chargedRatio: numeric((trial) => trial.chargedOpens / trial.totalOpens),
    duplicates: numeric((trial) => trial.duplicates),
    hiddenPockets: numeric((trial) => trial.hiddenPockets),
    finalWallet: numeric((trial) => trial.finalWallet),
    overchargeBonusChips: numeric((trial) => trial.overchargeBonusChips),
    signalLockConsumes: numeric((trial) => trial.signalLockConsumes),
    signalLockRetains: numeric((trial) => trial.signalLockRetains),
  };
};

describe('full-game economy audit', () => {
  it('simulates production resolver/transaction semantics across four player strategies', () => {
    const strategies: readonly StrategyName[] = [
      'sequential-full-eager',
      'standards-first-eager',
      'signal-frugal',
      'protection-hop',
    ];
    const trialCount = 3000;
    const report: Record<string, unknown> = {
      trialCount,
      content: {
        drops: GAME_LOOT_POOL_IDS.length,
        standards: GAME_REGISTRY.standardItems.length,
        secrets: GAME_REGISTRY.secrets.length,
      },
      pouchEconomy: {
        basic: analyzePouchEconomy(LITE_V2_BALANCE, 'basic'),
        charged: analyzePouchEconomy(LITE_V2_BALANCE, 'charged'),
      },
      strategies: {},
    };

    for (const [strategyIndex, strategy] of strategies.entries()) {
      const trials = Array.from({ length: trialCount }, (_, index) =>
        runTrial(strategy, (0xc0ffee + strategyIndex * 0x9e3779b9 + index * 7919) >>> 0),
      );
      const completed = trials.filter((trial) => trial.fullCollection !== null).length;
      expect(completed).toBe(trialCount);
      (report.strategies as Record<string, unknown>)[strategy] = summarize(trials);
    }

    console.log(`__ECONOMY_AUDIT_JSON__${JSON.stringify(report)}`);
  }, 120_000);
});
