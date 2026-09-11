import type { ContentRegistry, LootPoolId } from './collectibles';

const COLLECTIBLE_TEXTURE_PREFIX = 'art:collectible:';
const STATIC_TEXTURE_PREFIX = 'art:static:';

export type StaticArtId =
  | 'pouch-body'
  | 'pouch-tear-strip'
  | 'pouch-star-tab'
  | 'charged-pouch-body'
  | 'charged-pouch-tear-strip'
  | 'charged-pouch-star-tab'
  | 'opening-bg'
  | 'collection-bg'
  | 'collection-foreground';

export interface RuntimeCollectibleArt {
  collectibleId: string;
  textureKey: string;
  assetPath: string;
}

export interface RuntimeStaticArt {
  id: StaticArtId;
  textureKey: string;
  assetPath: string;
}

const STATIC_ART_PATHS: Readonly<Record<StaticArtId, string>> = {
  'pouch-body': 'assets/package/pouch-body.webp',
  'pouch-tear-strip': 'assets/package/pouch-tear-strip-compact.webp',
  'pouch-star-tab': 'assets/package/pouch-star-tab.webp',
  'charged-pouch-body': 'assets/package/charged-pouch-body.webp',
  'charged-pouch-tear-strip': 'assets/package/charged-pouch-tear-strip-compact.webp',
  'charged-pouch-star-tab': 'assets/package/charged-pouch-star-tab.webp',
  'opening-bg': 'assets/backgrounds/opening-bg.webp',
  'collection-bg': 'assets/backgrounds/collection-bg.webp',
  'collection-foreground': 'assets/backgrounds/collection-foreground.webp',
};

/**
 * Add ids only after the matching export exists under public/ and has been
 * reviewed. This manifest intentionally stays independent from the content
 * registry so adding gameplay content can never opt unfinished art into runtime
 * loading by accident.
 */
export const AVAILABLE_COLLECTIBLE_ART_IDS = new Set<string>([
  'camera-common',
  'camera-rare',
  'camera-epic',
  'camera-legendary',
  'camera-secret-cosmic',
  'flip-phone-common',
  'flip-phone-rare',
  'flip-phone-epic',
  'flip-phone-legendary',
  'flip-phone-secret-noir',
  'mini-camcorder-common',
  'mini-camcorder-rare',
  'mini-camcorder-epic',
  'mini-camcorder-legendary',
  'mini-camcorder-secret-prototype',
  'webcam-common',
  'webcam-rare',
  'webcam-epic',
  'webcam-legendary',
  'webcam-secret-stereo',
  'pda-common',
  'pda-rare',
  'pda-epic',
  'pda-legendary',
  'pda-secret-flip',
  'pager-common',
  'pager-rare',
  'pager-epic',
  'pager-legendary',
  'pager-secret-flip',
  'mp3-player-common',
  'mp3-player-rare',
  'mp3-player-epic',
  'mp3-player-legendary',
  'mp3-player-secret-pearl',
  'portable-disc-player-common',
  'portable-disc-player-rare',
  'portable-disc-player-epic',
  'portable-disc-player-legendary',
  'portable-disc-player-secret-remote',
  'handheld-console-common',
  'handheld-console-rare',
  'handheld-console-epic',
  'handheld-console-legendary',
  'handheld-console-secret-phone',
  'home-console-common',
  'home-console-rare',
  'home-console-epic',
  'home-console-legendary',
  'home-console-secret-noir',
  'cassette-player-common',
  'cassette-player-rare',
  'cassette-player-epic',
  'cassette-player-legendary',
  'cassette-player-secret-remote',
  'crt-tv-common',
  'crt-tv-rare',
  'crt-tv-epic',
  'crt-tv-legendary',
  'crt-tv-secret-communicator',
]);
export const AVAILABLE_STATIC_ART_IDS = new Set<StaticArtId>([
  'pouch-body',
  'pouch-tear-strip',
  'pouch-star-tab',
  'charged-pouch-body',
  'charged-pouch-tear-strip',
  'charged-pouch-star-tab',
  'opening-bg',
  'collection-bg',
  'collection-foreground',
]);

export const collectibleTextureKey = (collectibleId: string): string =>
  `${COLLECTIBLE_TEXTURE_PREFIX}${collectibleId}`;

export const staticTextureKey = (id: StaticArtId): string => `${STATIC_TEXTURE_PREFIX}${id}`;

export type PouchArtVariant = 'basic' | 'charged';
export type PouchArtLayer = 'body' | 'tear-strip' | 'star-tab';

const POUCH_STATIC_ART_IDS: Readonly<Record<PouchArtVariant, Readonly<Record<PouchArtLayer, StaticArtId>>>> = {
  basic: {
    body: 'pouch-body',
    'tear-strip': 'pouch-tear-strip',
    'star-tab': 'pouch-star-tab',
  },
  charged: {
    body: 'charged-pouch-body',
    'tear-strip': 'charged-pouch-tear-strip',
    'star-tab': 'charged-pouch-star-tab',
  },
};

const BOOT_STATIC_ART_IDS: readonly StaticArtId[] = [
  'pouch-body',
  'pouch-tear-strip',
  'pouch-star-tab',
  'charged-pouch-body',
  'charged-pouch-tear-strip',
  'charged-pouch-star-tab',
  'opening-bg',
  'collection-bg',
  'collection-foreground',
];

export const pouchStaticArtId = (variant: PouchArtVariant, layer: PouchArtLayer): StaticArtId =>
  POUCH_STATIC_ART_IDS[variant][layer];

const toRuntimeCollectibleArt = (
  registry: ContentRegistry,
  lootPoolId?: LootPoolId,
): readonly RuntimeCollectibleArt[] => [
  ...registry.standardItems,
  ...registry.secrets,
]
  .filter((record) => lootPoolId === undefined || record.lootPoolId === lootPoolId)
  .map(({ collectible }) => collectible)
  .filter(({ id }) => AVAILABLE_COLLECTIBLE_ART_IDS.has(id))
  .map((collectible) => ({
    collectibleId: collectible.id,
    textureKey: collectibleTextureKey(collectible.id),
    assetPath: collectible.assetPath,
  }));

export const getRuntimeCollectibleArt = (registry: ContentRegistry): readonly RuntimeCollectibleArt[] =>
  toRuntimeCollectibleArt(registry);

export const getRuntimeCollectibleArtForLootPool = (
  registry: ContentRegistry,
  lootPoolId: LootPoolId,
): readonly RuntimeCollectibleArt[] => {
  if (!registry.lootPoolById.has(lootPoolId)) {
    throw new Error(`Unknown loot pool: ${lootPoolId}`);
  }
  return toRuntimeCollectibleArt(registry, lootPoolId);
};

const toRuntimeStaticArt = (ids: readonly StaticArtId[]): readonly RuntimeStaticArt[] =>
  ids
    .filter((id) => AVAILABLE_STATIC_ART_IDS.has(id))
    .map((id) => ({
      id,
      textureKey: staticTextureKey(id),
      assetPath: STATIC_ART_PATHS[id],
    }));

export const getRuntimeStaticArt = (): readonly RuntimeStaticArt[] =>
  toRuntimeStaticArt(Object.keys(STATIC_ART_PATHS) as StaticArtId[]);

export const getRuntimeBootStaticArt = (): readonly RuntimeStaticArt[] =>
  toRuntimeStaticArt(BOOT_STATIC_ART_IDS);

export const getRuntimePouchArt = (variant: PouchArtVariant): readonly RuntimeStaticArt[] =>
  toRuntimeStaticArt(Object.values(POUCH_STATIC_ART_IDS[variant]));