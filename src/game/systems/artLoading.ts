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
  if (!scene.sys.isActive()) return;

  const missing = getRuntimeCollectibleArtForLootPool(registry, lootPoolId).filter(
    ({ textureKey }) => !scene.textures.exists(textureKey),
  );
  if (missing.length === 0) return;

  await new Promise<void>((resolve, reject) => {
    const pendingKeys = new Set(missing.map(({ textureKey }) => textureKey));
    const failedKeys = new Set<string>();
    let settled = false;

    const cleanup = (): void => {
      scene.load.off('loaderror', onLoadError);
      scene.load.off(Phaser.Loader.Events.COMPLETE, onComplete);
      scene.events.off(Phaser.Scenes.Events.SHUTDOWN, onShutdown);
    };
    const finish = (error?: Error): void => {
      if (settled) return;
      settled = true;
      cleanup();
      if (error) reject(error);
      else resolve();
    };
    const onLoadError = (file: Phaser.Loader.File): void => {
      const key = String(file.key);
      if (pendingKeys.has(key)) failedKeys.add(key);
    };
    const onComplete = (): void => {
      if (failedKeys.size > 0) {
        finish(new Error(`Failed to load collectible art: ${[...failedKeys].join(', ')}`));
        return;
      }
      finish();
    };
    const onShutdown = (): void => finish();

    scene.load.on('loaderror', onLoadError);
    scene.load.once(Phaser.Loader.Events.COMPLETE, onComplete);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, onShutdown);
    missing.forEach(({ textureKey, assetPath }) => scene.load.image(textureKey, assetPath));
    scene.load.start();
  });
};