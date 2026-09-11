import Phaser from 'phaser';

import {
  getRuntimeCollectibleArtForLootPool,
  getRuntimePouchArt,
  getRuntimePouchArtForLootPool,
  type PouchArtVariant,
  type RuntimeCollectibleArt,
  type RuntimeStaticArt,
} from '../data/artAssets';
import type { ContentRegistry, LootPoolId } from '../data/collectibles';

type RuntimeImageArt = Pick<RuntimeCollectibleArt | RuntimeStaticArt, 'textureKey' | 'assetPath'>;

/**
 * Loads only missing reviewed image textures for the current Scene activation.
 * Shutdown settles the Promise and detaches listeners so stale async work never
 * retains a dead Scene. Failed files stay absent from the texture manager and
 * are therefore eligible for retry on the next visit.
 */
const ensureRuntimeImageArt = async (
  scene: Phaser.Scene,
  art: readonly RuntimeImageArt[],
  failureLabel: string,
): Promise<void> => {
  if (!scene.sys.isActive()) return;

  const missing = art.filter(({ textureKey }) => !scene.textures.exists(textureKey));
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
        finish(new Error(`Failed to load ${failureLabel}: ${[...failedKeys].join(', ')}`));
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

export const ensureLootPoolCollectibleArt = (
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

export const ensurePouchArt = (scene: Phaser.Scene, variant: PouchArtVariant): Promise<void> =>
  ensureRuntimeImageArt(scene, getRuntimePouchArt(variant), `${variant} pouch art`);
