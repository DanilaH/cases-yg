import { existsSync, readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import {
  getRuntimeCollectibleArt,
  getRuntimeStaticArt,
} from '../src/game/data/artAssets';
import { GAME_REGISTRY } from '../src/game/data/collectibles';
import {
  RUNTIME_ART_BUNDLES,
  RUNTIME_ART_BUNDLE_TEXTURE_COUNT,
} from '../src/game/data/runtimeAssetBundles.generated';

describe('startup asset staging', () => {
  it('defines one complete deduplicated reviewed session image set', () => {
    const art = [
      ...getRuntimeStaticArt(),
      ...getRuntimeCollectibleArt(GAME_REGISTRY),
    ];
    const textureKeys = art.map(({ textureKey }) => textureKey);
    const assetPaths = art.map(({ assetPath }) => assetPath);

    expect(textureKeys.length).toBeGreaterThan(0);
    expect(new Set(textureKeys).size).toBe(textureKeys.length);
    expect(new Set(assetPaths).size).toBe(assetPaths.length);
    expect(RUNTIME_ART_BUNDLE_TEXTURE_COUNT).toBe(art.length);
    expect(RUNTIME_ART_BUNDLES).toHaveLength(6);
    expect(RUNTIME_ART_BUNDLES.reduce((sum, bundle) => sum + bundle.textureCount, 0)).toBe(art.length);
  });

  it('expands runtime bundles back into the complete reviewed art set inside Boot preload', () => {
    const source = readFileSync('src/game/scenes/BootScene.ts', 'utf8');

    expect(source).toContain('getRuntimeStaticArt()');
    expect(source).toContain('getRuntimeCollectibleArt(GAME_REGISTRY)');
    expect(source).toContain('this.load.binary(bundle.key, bundle.assetPath)');
    expect(source).toContain('parseRuntimeAssetBundle(data)');
    expect(source).toContain('this.load.image(entry.textureKey, objectUrl)');
    expect(source).toContain('this.textures.exists(textureKey)');
    expect(source).not.toContain('ensureLootPoolArt');
    expect(source).not.toContain('installBackgroundAssetWarmup');
  });

  it('starts save reconciliation before bundle/image work and captures rejection immediately', () => {
    const source = readFileSync('src/game/scenes/BootScene.ts', 'utf8');
    const saveStart = source.indexOf('this.initialSaveResult = new SaveRepository(platform.storage).load()');
    const bundleQueue = source.indexOf('for (const bundle of RUNTIME_ART_BUNDLES)');

    expect(saveStart).toBeGreaterThanOrEqual(0);
    expect(bundleQueue).toBeGreaterThan(saveStart);
    expect(source).toContain('(error: unknown) => {');
    expect(source).toContain("markStartupPhase('bootSaveSettled')");
    expect(source).toContain("markStartupPhase('bootArtSettled')");
  });

  it('keeps bundle transport startup-only and releases transient binary/blob state', () => {
    const source = readFileSync('src/game/scenes/BootScene.ts', 'utf8');

    expect(source).toContain('this.cache.binary.remove(key)');
    expect(source).toContain('URL.revokeObjectURL(objectUrl)');
    expect(source).toContain('Phaser.Loader.Events.COMPLETE');
  });

  it('keeps runtime art helpers assertion-only with no Phaser loader transaction', () => {
    const source = readFileSync('src/game/systems/artLoading.ts', 'utf8');

    expect(source).toContain('Missing preloaded');
    expect(source).toContain('scene.textures.exists(textureKey)');
    expect(source).not.toContain('scene.load.image');
    expect(source).not.toContain('scene.load.start');
    expect(source).not.toContain('Loader.Events');
    expect(source).not.toContain('beginRuntimeLoadOverlay');
  });

  it('ships no post-ready image warmup or in-game loading overlay implementation', () => {
    expect(existsSync('src/app/runtimeLoadOverlay.ts')).toBe(false);
    expect(existsSync('src/game/systems/backgroundAssetWarmup.ts')).toBe(false);
  });

  it('keeps scene-level readiness checks but never gives them network ownership', () => {
    const opening = readFileSync('src/game/scenes/OpeningScene.ts', 'utf8');
    const collection = readFileSync('src/game/scenes/CollectionScene.ts', 'utf8');

    expect(opening).toContain('await ensureLootPoolArt');
    expect(opening).toContain('await ensurePouchArt');
    expect(collection).toContain('await ensureCollectionArt');
    expect(collection).toContain('await ensureLootPoolCollectibleArt');
    expect(opening).not.toContain('scene.load.image');
    expect(collection).not.toContain('scene.load.image');
  });
});
