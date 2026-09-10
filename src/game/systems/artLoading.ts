import Phaser from 'phaser';

import { getRuntimeCollectibleArtForLootPool } from '../data/artAssets';
import type { ContentRegistry, LootPoolId } from '../data/collectibles';

/**
 * Loads only collectible textures belonging to one Drop and skips textures that
 * already exist in Phaser's global texture manager. A rejected load is safe to
 * recover from: callers can keep using procedural collectible fallbacks and a
 * later visit will retry only the still-missing textures.
 */
export const ensureLootPoolCollectibleArt = async (
  scene: Phaser.Scene,
  registry: ContentRegistry,
  lootPoolId: LootPoolId,
): Promise<void> => {
  const missing = getRuntimeCollectibleArtForLootPool(registry, lootPoolId).filter(
    ({ textureKey }) => !scene.textures.exists(textureKey),
  );
  if (missing.length === 0) return;

  await new Promise<void>((resolve, reject) => {
    const pendingKeys = new Set(missing.map(({ textureKey }) => textureKey));
    const failedKeys = new Set<string>();

    const cleanup = (): void => {
      scene.load.off(Phaser.Loader.Events.LOAD_ERROR, onLoadError);
      scene.load.off(Phaser.Loader.Events.COMPLETE, onComplete);
    };
    const onLoadError = (file: Phaser.Loader.File): void => {
      const key = String(file.key);
      if (pendingKeys.has(key)) failedKeys.add(key);
    };
    const onComplete = (): void => {
      cleanup();
      if (failedKeys.size > 0) {
        reject(new Error(`Failed to load collectible art: ${[...failedKeys].join(', ')}`));
        return;
      }
      resolve();
    };

    scene.load.on(Phaser.Loader.Events.LOAD_ERROR, onLoadError);
    scene.load.once(Phaser.Loader.Events.COMPLETE, onComplete);
    missing.forEach(({ textureKey, assetPath }) => scene.load.image(textureKey, assetPath));
    scene.load.start();
  });
};
