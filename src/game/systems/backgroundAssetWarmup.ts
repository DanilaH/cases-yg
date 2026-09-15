import type { PlatformRuntime } from '../../platform/yandex';
import {
  getRuntimeCollectibleArtForLootPool,
  getRuntimeCollectionStaticArt,
  getRuntimePouchArtForLootPool,
} from '../data/artAssets';
import { DEFAULT_LOOT_POOL_ID, GAME_REGISTRY, type LootPoolId } from '../data/collectibles';

const DEFAULT_DELAY_MS = 1500;
const BATCH_SIZE = 4;
const BATCH_GAP_MS = 450;

/**
 * Warm only near-future art after Game Ready. Runtime loading remains the
 * correctness path for every other Drop, so speculative network work never
 * needs to download the entire catalog for a player who may not browse it.
 */
export const getBackgroundWarmupAssetPaths = (
  activeLootPoolId: LootPoolId = DEFAULT_LOOT_POOL_ID,
): readonly string[] =>
  [...new Set([
    ...getRuntimeCollectionStaticArt().map(({ assetPath }) => assetPath),
    ...getRuntimeCollectibleArtForLootPool(GAME_REGISTRY, activeLootPoolId).map(({ assetPath }) => assetPath),
    ...getRuntimePouchArtForLootPool(activeLootPoolId).map(({ assetPath }) => assetPath),
  ])];

export const createAssetPrefetchBatches = (
  assetPaths: readonly string[],
  batchSize = BATCH_SIZE,
): readonly (readonly string[])[] => {
  const uniquePaths = [...new Set(assetPaths)];
  const safeBatchSize = Math.max(1, Math.floor(batchSize));
  const batches: string[][] = [];
  for (let index = 0; index < uniquePaths.length; index += safeBatchSize) {
    batches.push(uniquePaths.slice(index, index + safeBatchSize));
  }
  return batches;
};

let installed = false;

export const installBackgroundAssetWarmup = (
  platform: PlatformRuntime,
  activeLootPoolId: LootPoolId = DEFAULT_LOOT_POOL_ID,
  delayMs = DEFAULT_DELAY_MS,
): void => {
  if (installed || typeof window === 'undefined' || typeof document === 'undefined') return;
  installed = true;

  const previousMarkReady = platform.markReady.bind(platform);
  const timers = new Set<number>();
  let scheduled = false;

  const appendPrefetch = (assetPath: string): void => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.as = 'image';
    link.href = assetPath;
    link.dataset.signalAssetWarmup = 'true';
    document.head.append(link);
  };

  const scheduleBatches = (): void => {
    const batches = createAssetPrefetchBatches(getBackgroundWarmupAssetPaths(activeLootPoolId));
    batches.forEach((batch, batchIndex) => {
      const timer = window.setTimeout(() => {
        timers.delete(timer);
        batch.forEach(appendPrefetch);
      }, batchIndex * BATCH_GAP_MS);
      timers.add(timer);
    });
  };

  platform.markReady = () => {
    previousMarkReady();
    if (scheduled) return;
    scheduled = true;
    const timer = window.setTimeout(() => {
      timers.delete(timer);
      scheduleBatches();
    }, Math.max(0, delayMs));
    timers.add(timer);
  };

  window.addEventListener(
    'beforeunload',
    () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      timers.clear();
    },
    { once: true },
  );
};
