import type { BalanceConfig } from '../data/balance';
import type { ContentRegistry, StandardRarity } from '../data/collectibles';

export interface SignalResolution {
  before: number;
  after: number;
  gain: number;
  lockReached: boolean;
}

export const isStandardCollectionComplete = (
  registry: ContentRegistry,
  discoveredStandard: readonly string[],
): boolean => new Set(discoveredStandard).size >= registry.standardItems.length;

export const isSignalLockArmed = (
  signal: number,
  registry: ContentRegistry,
  discoveredStandard: readonly string[],
  balance: BalanceConfig,
): boolean =>
  !isStandardCollectionComplete(registry, discoveredStandard) && signal >= balance.signal.threshold;

export const resolveSignal = (input: {
  before: number;
  rarity: StandardRarity;
  isDuplicate: boolean;
  lockConsumed: boolean;
  standardCompleteBefore: boolean;
  balance: BalanceConfig;
}): SignalResolution => {
  const before = Math.max(0, Math.min(input.before, input.balance.signal.threshold));

  if (input.lockConsumed) {
    return { before, after: 0, gain: 0, lockReached: false };
  }

  if (!input.isDuplicate || input.standardCompleteBefore) {
    return { before, after: before, gain: 0, lockReached: false };
  }

  const after = Math.min(
    input.balance.signal.threshold,
    before + input.balance.signal.duplicateGains[input.rarity],
  );
  const gain = after - before;

  return {
    before,
    after,
    gain,
    lockReached: before < input.balance.signal.threshold && after >= input.balance.signal.threshold,
  };
};
