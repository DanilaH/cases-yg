import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  AVAILABLE_COLLECTIBLE_ART_IDS,
  AVAILABLE_STATIC_ART_IDS,
  collectibleTextureKey,
  getRuntimeCollectibleArt,
  getRuntimeStaticArt,
  staticTextureKey,
} from '../src/game/data/artAssets';
import { AVAILABLE_SFX_CUES, getRuntimeSfxAssets } from '../src/game/data/audioAssets';
import { SLICE_REGISTRY } from '../src/game/data/collectibles';

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
  it('exposes reviewed collectible art using registry paths and stable texture keys', () => {
    AVAILABLE_COLLECTIBLE_ART_IDS.add('camera-common');

    expect(getRuntimeCollectibleArt(SLICE_REGISTRY)).toEqual([
      {
        collectibleId: 'camera-common',
        textureKey: collectibleTextureKey('camera-common'),
        assetPath: 'assets/collectibles/camera-common.webp',
      },
    ]);
  });

  it('keeps unreviewed collectible art out of preload', () => {
    expect(getRuntimeCollectibleArt(SLICE_REGISTRY)).toEqual([]);
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
