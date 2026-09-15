import { existsSync, readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import {
  getRuntimeCollectibleArt,
  getRuntimeStaticArt,
} from '../src/game/data/artAssets';
import { GAME_REGISTRY } from '../src/game/data/collectibles';

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
  });

  it('queues the complete reviewed session art set in Boot before Game Ready', () => {
    const source = readFileSync('src/game/scenes/BootScene.ts', 'utf8');

    expect(source).toContain('getRuntimeStaticArt()');
    expect(source).toContain('getRuntimeCollectibleArt(GAME_REGISTRY)');
    expect(source).toContain('this.load.image(textureKey, assetPath)');
    expect(source).not.toContain('ensureLootPoolArt');
    expect(source).not.toContain('installBackgroundAssetWarmup');
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
