import Phaser from 'phaser';

import {
  getRuntimeCollectibleArtForLootPool,
  getRuntimeCollectionStaticArt,
  getRuntimePouchArt,
  getRuntimePouchArtForLootPool,
  type PouchArtVariant,
  type RuntimeCollectibleArt,
  type RuntimeStaticArt,
} from '../data/artAssets';
import type { ContentRegistry, LootPoolId } from '../data/collectibles';

type RuntimeImageArt = Pick<RuntimeCollectibleArt | RuntimeStaticArt, 'textureKey' | 'assetPath'>;

/**
 * Runtime art readiness is an invariant, not a loading path.
 *
 * BootScene preloads every reviewed session-critical image before semantic Game
 * Ready. These helpers intentionally never enqueue or start Phaser Loader work;
 * they only make missing startup art explicit so the existing confirmed-failure
 * fallback paths can degrade without introducing an in-game loading state.
 */
const ensureRuntimeImageArt = async (
  scene: Phaser.Scene,
  art: readonly RuntimeImageArt[],
  failureLabel: string,
): Promise<void> => {
  if (!scene.sys.isActive()) return;

  const missingKeys = art
    .filter(({ textureKey }) => !scene.textures.exists(textureKey))
    .map(({ textureKey }) => textureKey);

  if (missingKeys.length > 0) {
    throw new Error(`Missing preloaded ${failureLabel}: ${missingKeys.join(', ')}`);
  }
};

export const ensureCollectionArt = (
  scene: Phaser.Scene,
  registry: ContentRegistry,
  lootPoolId: LootPoolId,
): Promise<void> =>
  ensureRuntimeImageArt(
    scene,
    [
      ...getRuntimeCollectionStaticArt(),
      ...getRuntimeCollectibleArtForLootPool(registry, lootPoolId),
    ],
    'Collection art',
  );

export const ensureLootPoolCollectibleArt = (
  scene: Phaser.Scene,
  registry: ContentRegistry,
  lootPoolId: LootPoolId,
): Promise<void> =>
  ensureRuntimeImageArt(scene, getRuntimeCollectibleArtForLootPool(registry, lootPoolId), 'collectible art');

export const ensureLootPoolArt = (
  scene: Phaser.Scene,
  registry: ContentRegistry,
  lootPoolId: LootPoolId,
): Promise<void> =>
  ensureRuntimeImageArt(
    scene,
    [
      ...getRuntimeCollectibleArtForLootPool(registry, lootPoolId),
      ...getRuntimePouchArtForLootPool(lootPoolId),
    ],
    'Drop art',
  );

export const ensurePouchArt = (
  scene: Phaser.Scene,
  variant: PouchArtVariant,
  lootPoolId: LootPoolId,
): Promise<void> =>
  ensureRuntimeImageArt(scene, getRuntimePouchArt(variant, lootPoolId), `${variant} pouch art`);
