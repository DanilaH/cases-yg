import { existsSync } from 'node:fs';

import { DEFAULT_DROP_REGISTRY } from './defaultDropFixture';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  AVAILABLE_COLLECTIBLE_ART_IDS,
  AVAILABLE_STATIC_ART_IDS,
  collectibleTextureKey,
  getRuntimeCollectibleArt,
  getRuntimeBootStaticArt,
  getRuntimeCollectibleArtForLootPool,
  getRuntimePouchArt,
  getRuntimePouchArtForLootPool,
  getRuntimeStaticArt,
  pouchStaticArtId,
  staticTextureKey,
} from '../src/game/data/artAssets';
import { AVAILABLE_SFX_CUES, getRuntimeSfxAssets } from '../src/game/data/audioAssets';
import {
  GAME_LOOT_POOL_IDS,
  GAME_REGISTRY,
} from '../src/game/data/collectibles';

const defaultCollectibleArtIds = [...AVAILABLE_COLLECTIBLE_ART_IDS];
const defaultStaticArtIds = [...AVAILABLE_STATIC_ART_IDS];
const defaultSfxCues = [...AVAILABLE_SFX_CUES];

const replaceSetContents = <T>(target: Set<T>, values: readonly T[]): void => {
  target.clear();
  values.forEach((value) => target.add(value));
};

beforeEach(() => {
  AVAILABLE_COLLECTIBLE_ART_IDS.clear();
  AVAILABLE_STATIC_ART_IDS.clear();
  AVAILABLE_SFX_CUES.clear();
});

afterEach(() => {
  replaceSetContents(AVAILABLE_COLLECTIBLE_ART_IDS, defaultCollectibleArtIds);
  replaceSetContents(AVAILABLE_STATIC_ART_IDS, defaultStaticArtIds);
  replaceSetContents(AVAILABLE_SFX_CUES, defaultSfxCues);
});

describe('runtime asset manifests', () => {
  it('covers all production collectible exports and slices them to 10 assets per Drop', () => {
    replaceSetContents(AVAILABLE_COLLECTIBLE_ART_IDS, defaultCollectibleArtIds);

    expect(getRuntimeCollectibleArt(GAME_REGISTRY)).toHaveLength(60);
    expect(AVAILABLE_COLLECTIBLE_ART_IDS.size).toBe(60);
    for (const lootPoolId of GAME_LOOT_POOL_IDS) {
      const art = getRuntimeCollectibleArtForLootPool(GAME_REGISTRY, lootPoolId);
      expect(art).toHaveLength(10);
      expect(new Set(art.map(({ collectibleId }) => collectibleId)).size).toBe(10);
    }
  });

  it('rejects an unknown Drop art request instead of silently returning an empty manifest', () => {
    replaceSetContents(AVAILABLE_COLLECTIBLE_ART_IDS, defaultCollectibleArtIds);
    expect(() => getRuntimeCollectibleArtForLootPool(GAME_REGISTRY, 'missing-drop')).toThrow('Unknown loot pool');
  });

  it('exposes reviewed collectible art using registry paths and stable texture keys', () => {
    AVAILABLE_COLLECTIBLE_ART_IDS.add('camera-common');

    expect(getRuntimeCollectibleArt(DEFAULT_DROP_REGISTRY)).toEqual([
      {
        collectibleId: 'camera-common',
        textureKey: collectibleTextureKey('camera-common'),
        assetPath: 'assets/collectibles/camera-common.webp',
      },
    ]);
  });

  it('keeps unreviewed collectible art out of preload', () => {
    expect(getRuntimeCollectibleArt(DEFAULT_DROP_REGISTRY)).toEqual([]);
  });

  it('preloads both pouch variants and maps all Charged layers', () => {
    replaceSetContents(AVAILABLE_STATIC_ART_IDS, defaultStaticArtIds);

    const bootIds = getRuntimeBootStaticArt().map(({ id }) => id);
    expect(bootIds).toContain('pouch-body');
    expect(bootIds).toContain('charged-pouch-body');
    expect(bootIds).toContain('charged-pouch-tear-strip');
    expect(bootIds).toContain('charged-pouch-star-tab');
    expect(getRuntimePouchArt('charged')).toEqual([
      {
        id: 'charged-pouch-body',
        textureKey: staticTextureKey('charged-pouch-body'),
        assetPath: 'assets/package/charged-pouch-body.webp',
      },
      {
        id: 'charged-pouch-tear-strip',
        textureKey: staticTextureKey('charged-pouch-tear-strip'),
        assetPath: 'assets/package/charged-pouch-tear-strip-compact.webp',
      },
      {
        id: 'charged-pouch-star-tab',
        textureKey: staticTextureKey('charged-pouch-star-tab'),
        assetPath: 'assets/package/charged-pouch-star-tab.webp',
      },
    ]);
    expect(pouchStaticArtId('basic', 'body')).toBe('pouch-body');
    expect(pouchStaticArtId('charged', 'body')).toBe('charged-pouch-body');
  });

  it('maps authored Basic and Charged pouch layers for every themed Drop', () => {
  replaceSetContents(AVAILABLE_STATIC_ART_IDS, defaultStaticArtIds);

  expect(getRuntimePouchArtForLootPool('y2k-essentials').map(({ id }) => id)).toEqual([
    'pouch-body',
    'pouch-tear-strip',
    'pouch-star-tab',
    'charged-pouch-body',
    'charged-pouch-tear-strip',
    'charged-pouch-star-tab',
  ]);

  for (const lootPoolId of GAME_LOOT_POOL_IDS.filter((id) => id !== 'y2k-essentials')) {
    expect(getRuntimePouchArtForLootPool(lootPoolId).map(({ id }) => id)).toEqual([
      `${lootPoolId}-basic-pouch-body`,
      `${lootPoolId}-basic-pouch-tear-strip`,
      `${lootPoolId}-basic-pouch-star-tab`,
      `${lootPoolId}-charged-pouch-body`,
      `${lootPoolId}-charged-pouch-tear-strip`,
      `${lootPoolId}-charged-pouch-star-tab`,
    ]);
  }

  expect(pouchStaticArtId('basic', 'body', 'game-zone')).toBe('game-zone-basic-pouch-body');
  expect(pouchStaticArtId('charged', 'star-tab', 'analog-nights')).toBe(
    'analog-nights-charged-pouch-star-tab',
  );
});

it('keeps every reviewed static-art path backed by a committed public asset', () => {
  replaceSetContents(AVAILABLE_STATIC_ART_IDS, defaultStaticArtIds);
  for (const { id, assetPath } of getRuntimeStaticArt()) {
    expect(existsSync(`public/${assetPath}`), `missing reviewed static art for ${id}: ${assetPath}`).toBe(true);
  }
});

  it('maps reviewed pouch/background layers without scene-specific file knowledge', () => {
    AVAILABLE_STATIC_ART_IDS.add('pouch-body');
    AVAILABLE_STATIC_ART_IDS.add('collection-foreground');

    expect(getRuntimeStaticArt()).toEqual([
      {
        id: 'pouch-body',
        textureKey: staticTextureKey('pouch-body'),
        assetPath: 'assets/package/pouch-body.webp',
      },
      {
        id: 'collection-foreground',
        textureKey: staticTextureKey('collection-foreground'),
        assetPath: 'assets/backgrounds/collection-foreground.webp',
      },
    ]);
  });

  it('maps reviewed SFX cues to final MP3 paths', () => {
    AVAILABLE_SFX_CUES.add('tear');
    AVAILABLE_SFX_CUES.add('legendary');

    expect(getRuntimeSfxAssets()).toEqual([
      { cue: 'tear', assetPath: 'assets/audio/tear.mp3' },
      { cue: 'legendary', assetPath: 'assets/audio/rarity-legendary.mp3' },
    ]);
  });
});
