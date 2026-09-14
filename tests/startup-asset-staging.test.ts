import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import {
  getRuntimeBootStaticArt,
  getRuntimeCollectibleArt,
  getRuntimeCollectionStaticArt,
  getRuntimeStaticArt,
} from '../src/game/data/artAssets';
import { GAME_REGISTRY } from '../src/game/data/collectibles';
import {
  createAssetPrefetchBatches,
  getBackgroundWarmupAssetPaths,
} from '../src/game/systems/backgroundAssetWarmup';

describe('startup asset staging', () => {
  it('warms the complete reviewed image catalog without duplicate requests', () => {
    const expected = new Set([
      ...getRuntimeCollectibleArt(GAME_REGISTRY).map(({ assetPath }) => assetPath),
      ...getRuntimeStaticArt().map(({ assetPath }) => assetPath),
    ]);
    const paths = getBackgroundWarmupAssetPaths();

    expect(paths).toHaveLength(expected.size);
    expect(new Set(paths)).toEqual(expected);
    expect(paths.slice(0, 2)).toEqual(
      getRuntimeCollectionStaticArt().map(({ assetPath }) => assetPath),
    );
  });

  it('batches speculative prefetch work instead of emitting one unbounded burst', () => {
    expect(createAssetPrefetchBatches(['a', 'b', 'a', 'c', 'd', 'e'], 2)).toEqual([
      ['a', 'b'],
      ['c', 'd'],
      ['e'],
    ]);
  });

  it('keeps only first-frame shared art in Boot and defers Collection layers', () => {
    expect(getRuntimeBootStaticArt().map(({ id }) => id)).toEqual(['opening-bg']);
    expect(getRuntimeCollectionStaticArt().map(({ id }) => id)).toEqual([
      'collection-bg',
      'collection-foreground',
    ]);
  });

  it('loads durable save state before awaiting only the active Drop handoff art', () => {
    const source = readFileSync('src/game/scenes/BootScene.ts', 'utf8');
    const saveLoad = source.indexOf('new SaveRepository(getPlatformRuntime().storage).load()');
    const activeDropLoad = source.indexOf('await ensureLootPoolArt(this, GAME_REGISTRY, activeLootPoolId)');

    expect(source).not.toContain('GAME_LOOT_POOL_IDS');
    expect(source).not.toContain('getRuntimeCollectibleArtForLootPool');
    expect(source).not.toContain('getRuntimePouchArtForLootPool');
    expect(source).toContain('getRuntimeBootStaticArt()');
    expect(source).not.toContain("art.id === 'collection-bg'");
    expect(saveLoad).toBeGreaterThanOrEqual(0);
    expect(activeDropLoad).toBeGreaterThan(saveLoad);
  });

  it('requires authored Collection layers before its first render', () => {
    const source = readFileSync('src/game/scenes/CollectionScene.ts', 'utf8');
    const ensureArt = source.indexOf('await ensureCollectionArt(this, GAME_REGISTRY, this.selectedLootPoolId())');
    const firstRender = source.indexOf('this.render();');

    expect(ensureArt).toBeGreaterThanOrEqual(0);
    expect(firstRender).toBeGreaterThan(ensureArt);
  });

  it('keeps missing dynamic art behind the authored preload surface until Phaser rebuilds the scene', () => {
    const artLoadingSource = readFileSync('src/game/systems/artLoading.ts', 'utf8');
    const overlaySource = readFileSync('src/app/runtimeLoadOverlay.ts', 'utf8');
    const overlayShown = artLoadingSource.indexOf('const releaseOverlay = beginRuntimeLoadOverlay()');
    const loaderWait = artLoadingSource.indexOf('await new Promise<void>');
    const refresh = artLoadingSource.indexOf('scene.scale.refresh()');
    const release = artLoadingSource.indexOf('releaseOverlay()');

    expect(artLoadingSource).not.toContain('runtime-art-gate');
    expect(overlaySource).toContain("#startup-preload");
    expect(overlaySource).toContain("#startup-preload-progress-fill");
    expect(overlayShown).toBeGreaterThanOrEqual(0);
    expect(loaderWait).toBeGreaterThan(overlayShown);
    expect(refresh).toBeGreaterThan(loaderWait);
    expect(release).toBeGreaterThan(refresh);
  });
});
