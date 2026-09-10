import { describe, expect, it } from 'vitest';

import { LITE_V2_BALANCE, type LiteBalanceConfig, type PouchType } from '../src/game/data/balance';
import { DEFAULT_LOOT_POOL_ID, GAME_LOOT_POOL_IDS, GAME_REGISTRY, type LootPoolId } from '../src/game/data/collectibles';
import { createPendingReveal } from '../src/game/systems/drops';
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

const open = (
  state: SaveState,
  poolId: LootPoolId,
  pouchType: PouchType,
  random: RandomSource,
  balance: LiteBalanceConfig = LITE_V2_BALANCE,
): { state: SaveState; overchargeBonus: number } => {
  const base = { ...state, activeLootPoolId: poolId };
  const pending = createPendingReveal({
    state: base,
    registry: GAME_REGISTRY,
    balance,
    random,
    transactionId: `stress-${state.totalOpens + 1}-${poolId}-${pouchType}`,
    pouchType,
  });
  return {
    state: commitPendingRevealState(stagePendingReveal(base, pending)),
    overchargeBonus: pending.chips.overchargeBonus,
  };
};

const standardIdsFor = (poolId: LootPoolId) =>
  GAME_REGISTRY.standardItems.filter(({ lootPoolId }) => lootPoolId === poolId).map(({ collectible }) => collectible.id);

const secretIdsFor = (poolId: LootPoolId) =>
  GAME_REGISTRY.secrets.filter(({ lootPoolId }) => lootPoolId === poolId).map(({ collectible }) => collectible.id);

const percentile = (values: readonly number[], q: number): number => {
  const sorted = [...values].sort((a, b) => a - b);
  const index = (sorted.length - 1) * q;
  const lo = Math.floor(index);
  const hi = Math.ceil(index);
  if (lo === hi) return sorted[lo]!;
  return sorted[lo]! * (hi - index) + sorted[hi]! * (index - lo);
};

const summarize = (values: readonly number[]) => ({
  p50: Math.round(percentile(values, 0.5) * 1000) / 1000,
  p90: Math.round(percentile(values, 0.9) * 1000) / 1000,
  mean: Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 1000) / 1000,
});

const cap130Balance: LiteBalanceConfig = {
  ...LITE_V2_BALANCE,
  overchargeCapHundredths: 130,
};

const fullCollectionState = (cap: number): SaveState => ({
  ...createInitialSaveState(),
  discoveredStandard: GAME_REGISTRY.standardItems.map(({ collectible }) => collectible.id),
  discoveredSecrets: GAME_REGISTRY.secrets.map(({ collectible }) => collectible.id),
  chips: 60,
  signal: LITE_V2_BALANCE.signalThreshold,
  overchargeHundredths: cap,
  totalOpens: 1000,
});

const runEndgameThresholdPolicy = (balance: LiteBalanceConfig, seed: number, openings: number) => {
  const random = new Mulberry32(seed);
  let state = fullCollectionState(balance.overchargeCapHundredths);
  let charged = 0;
  let basic = 0;
  let totalOverchargeBonus = 0;
  let walletSum = 0;
  for (let index = 0; index < openings; index += 1) {
    const pouchType: PouchType = state.chips >= balance.pouchProfiles.charged.chipsCost ? 'charged' : 'basic';
    const result = open(state, DEFAULT_LOOT_POOL_ID, pouchType, random, balance);
    state = result.state;
    totalOverchargeBonus += result.overchargeBonus;
    walletSum += state.chips;
    charged += pouchType === 'charged' ? 1 : 0;
    basic += pouchType === 'basic' ? 1 : 0;
  }
  return {
    chargedRatio: charged / (charged + basic),
    finalWallet: state.chips,
    averageWallet: walletSum / openings,
    overchargePerOpen: totalOverchargeBonus / openings,
  };
};

describe('full-game economy stress', () => {
  it('quantifies completed-Drop lock banking and max-Overcharge endgame', () => {
    const bankPool = GAME_LOOT_POOL_IDS[0]!;
    const targetPool = GAME_LOOT_POOL_IDS[1]!;
    const targetItems = GAME_REGISTRY.standardItems.filter(({ lootPoolId }) => lootPoolId === targetPool);
    const missingLegendary = targetItems.find(({ rarity }) => rarity === 'legendary');
    if (!missingLegendary) throw new Error('stress target requires a Legendary');

    const bankCycleOpens: number[] = [];
    for (let trial = 0; trial < 1000; trial += 1) {
      const random = new Mulberry32((0x51a7e + trial * 3571) >>> 0);
      let state: SaveState = {
        ...createInitialSaveState(),
        discoveredStandard: [
          ...standardIdsFor(bankPool),
          ...targetItems
            .filter(({ collectible }) => collectible.id !== missingLegendary.collectible.id)
            .map(({ collectible }) => collectible.id),
        ],
        totalOpens: 50,
      };
      const start = state.totalOpens;

      while (
        state.signal < LITE_V2_BALANCE.signalThreshold ||
        state.overchargeHundredths < LITE_V2_BALANCE.overchargeCapHundredths ||
        state.chips < LITE_V2_BALANCE.pouchProfiles.charged.chipsCost
      ) {
        state = open(state, bankPool, 'basic', random).state;
      }

      const beforeCashout = state;
      state = open(state, targetPool, 'charged', random).state;
      expect(state.discoveredStandard).toContain(missingLegendary.collectible.id);
      expect(state.signal).toBe(0);
      expect(state.overchargeHundredths).toBe(100);
      expect(beforeCashout.signal).toBe(4);
      expect(beforeCashout.overchargeHundredths).toBe(150);
      bankCycleOpens.push(state.totalOpens - start);
    }

    const currentRuns = Array.from({ length: 80 }, (_, index) =>
      runEndgameThresholdPolicy(LITE_V2_BALANCE, (0xa11ce + index * 7919) >>> 0, 5000),
    );
    const cap130Runs = Array.from({ length: 80 }, (_, index) =>
      runEndgameThresholdPolicy(cap130Balance, (0xbadc0de + index * 7919) >>> 0, 5000),
    );

    const report = {
      bankedGuaranteedLegendaryCycleOpens: summarize(bankCycleOpens),
      maxOverchargeEndgame: {
        cap150: {
          chargedRatio: summarize(currentRuns.map(({ chargedRatio }) => chargedRatio)),
          finalWallet: summarize(currentRuns.map(({ finalWallet }) => finalWallet)),
          averageWallet: summarize(currentRuns.map(({ averageWallet }) => averageWallet)),
          overchargePerOpen: summarize(currentRuns.map(({ overchargePerOpen }) => overchargePerOpen)),
        },
        cap130: {
          chargedRatio: summarize(cap130Runs.map(({ chargedRatio }) => chargedRatio)),
          finalWallet: summarize(cap130Runs.map(({ finalWallet }) => finalWallet)),
          averageWallet: summarize(cap130Runs.map(({ averageWallet }) => averageWallet)),
          overchargePerOpen: summarize(cap130Runs.map(({ overchargePerOpen }) => overchargePerOpen)),
        },
      },
    };

    console.log(`__ECONOMY_STRESS_JSON__${JSON.stringify(report)}`);
    expect(percentile(bankCycleOpens, 0.5)).toBeGreaterThanOrEqual(10);
    expect(summarize(currentRuns.map(({ chargedRatio }) => chargedRatio)).mean).toBeLessThan(1);
  }, 120_000);
});
