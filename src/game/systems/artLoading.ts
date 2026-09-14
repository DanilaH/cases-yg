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

let runtimeArtGateDepth = 0;

const getRuntimeArtGate = (): HTMLElement | null => {
  if (typeof document === 'undefined') return null;
  const existing = document.querySelector<HTMLElement>('#runtime-art-gate');
  if (existing) return existing;

  const gate = document.createElement('div');
  gate.id = 'runtime-art-gate';
  gate.setAttribute('aria-hidden', 'true');
  Object.assign(gate.style, {
    position: 'absolute',
    inset: '0',
    zIndex: '850',
    display: 'grid',
    placeItems: 'center',
    background: 'rgba(23, 20, 33, 0.82)',
    opacity: '0',
    visibility: 'hidden',
    pointerEvents: 'auto',
    transition: 'opacity 100ms ease',
  });

  const marker = document.createElement('div');
  marker.textContent = '◈';
  Object.assign(marker.style, {
    color: '#8df8ff',
    fontFamily: '"Press Start 2P", ui-monospace, monospace',
    fontSize: '28px',
    textShadow: '0 0 18px rgba(141, 248, 255, 0.55), 0 0 34px rgba(211, 169, 255, 0.28)',
  });
  gate.append(marker);
  document.querySelector('#game-shell')?.append(gate);
  return gate;
};

const showRuntimeArtGate = (): (() => void) => {
  const gate = getRuntimeArtGate();
  if (!gate) return () => undefined;
  runtimeArtGateDepth += 1;
  gate.style.visibility = 'visible';
  gate.style.opacity = '1';

  let released = false;
  return () => {
    if (released) return;
    released = true;
    runtimeArtGateDepth = Math.max(0, runtimeArtGateDepth - 1);
    if (runtimeArtGateDepth > 0) return;
    gate.style.opacity = '0';
    gate.style.visibility = 'hidden';
  };
};

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

  // Some Opening transitions intentionally preview the user's target before the
  // async loader begins. Cover that transient tree immediately so a slow request
  // can never expose procedural fallback as if it were final authored art.
  const releaseGate = showRuntimeArtGate();
  try {
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

    if (scene.sys.isActive()) {
      // Existing Opening/Collection resize handlers rebuild presentation from the
      // now-authored texture set. This is especially important for an immediate
      // Drop preview that existed before the target textures finished loading.
      scene.scale.refresh();
    }
  } finally {
    releaseGate();
  }
};

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
