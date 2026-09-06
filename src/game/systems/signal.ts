import type { ContentRegistry, LootPoolId } from '../data/collectibles';

export const LEGACY_SIGNAL_STEP = 25;
export const LITE_SIGNAL_THRESHOLD = 4;

export const migrateLegacySignal = (signal: number): number => {
  if (!Number.isFinite(signal) || signal < 0) {
    throw new Error(`Invalid legacy Signal value: ${signal}`);
  }
  return Math.min(LITE_SIGNAL_THRESHOLD, Math.floor(signal / LEGACY_SIGNAL_STEP));
};

export const clampLiteSignal = (signal: number, threshold = LITE_SIGNAL_THRESHOLD): number => {
  if (!Number.isFinite(signal) || signal < 0 || !Number.isInteger(threshold) || threshold <= 0) {
    throw new Error('Invalid Lite Signal state');
  }
  return Math.min(threshold, Math.floor(signal));
};

export const isStandardCollectionComplete = (
  registry: ContentRegistry,
  discoveredStandard: readonly string[],
): boolean => {
  const discovered = new Set(discoveredStandard);
  return registry.standardItems.every(({ collectible }) => discovered.has(collectible.id));
};

export const isStandardLootPoolComplete = (
  registry: ContentRegistry,
  lootPoolId: LootPoolId,
  discoveredStandard: readonly string[],
): boolean => {
  const discovered = new Set(discoveredStandard);
  const poolItems = registry.standardItems.filter((item) => item.lootPoolId === lootPoolId);
  if (poolItems.length === 0) {
    throw new Error(`Unknown or empty loot pool: ${lootPoolId}`);
  }
  return poolItems.every(({ collectible }) => discovered.has(collectible.id));
};
