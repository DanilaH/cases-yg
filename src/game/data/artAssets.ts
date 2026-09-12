import type { ContentRegistry, GameLootPoolId, LootPoolId } from './collectibles';
import { DEFAULT_LOOT_POOL_ID } from './collectibles';

const COLLECTIBLE_TEXTURE_PREFIX = 'art:collectible:';
const STATIC_TEXTURE_PREFIX = 'art:static:';

const STATIC_ART_PATHS = {
  'pouch-body': 'assets/package/pouch-body.webp',
  'pouch-tear-strip': 'assets/package/pouch-tear-strip-compact.webp',
  'pouch-star-tab': 'assets/package/pouch-star-tab.webp',
  'charged-pouch-body': 'assets/package/charged-pouch-body.webp',
  'charged-pouch-tear-strip': 'assets/package/charged-pouch-tear-strip-compact.webp',
  'charged-pouch-star-tab': 'assets/package/charged-pouch-star-tab.webp',
  'video-link-basic-pouch-body': 'assets/package/video-link-basic-pouch-body.webp',
  'video-link-basic-pouch-tear-strip': 'assets/package/video-link-basic-pouch-tear-strip-compact.webp',
  'video-link-basic-pouch-star-tab': 'assets/package/video-link-basic-pouch-star-tab.webp',
  'video-link-charged-pouch-body': 'assets/package/video-link-charged-pouch-body.webp',
  'video-link-charged-pouch-tear-strip': 'assets/package/video-link-charged-pouch-tear-strip-compact.webp',
  'video-link-charged-pouch-star-tab': 'assets/package/video-link-charged-pouch-star-tab.webp',
  'pocket-office-basic-pouch-body': 'assets/package/pocket-office-basic-pouch-body.webp',
  'pocket-office-basic-pouch-tear-strip': 'assets/package/pocket-office-basic-pouch-tear-strip-compact.webp',
  'pocket-office-basic-pouch-star-tab': 'assets/package/pocket-office-basic-pouch-star-tab.webp',
  'pocket-office-charged-pouch-body': 'assets/package/pocket-office-charged-pouch-body.webp',
  'pocket-office-charged-pouch-tear-strip': 'assets/package/pocket-office-charged-pouch-tear-strip-compact.webp',
  'pocket-office-charged-pouch-star-tab': 'assets/package/pocket-office-charged-pouch-star-tab.webp',
  'pocket-audio-basic-pouch-body': 'assets/package/pocket-audio-basic-pouch-body.webp',
  'pocket-audio-basic-pouch-tear-strip': 'assets/package/pocket-audio-basic-pouch-tear-strip-compact.webp',
  'pocket-audio-basic-pouch-star-tab': 'assets/package/pocket-audio-basic-pouch-star-tab.webp',
  'pocket-audio-charged-pouch-body': 'assets/package/pocket-audio-charged-pouch-body.webp',
  'pocket-audio-charged-pouch-tear-strip': 'assets/package/pocket-audio-charged-pouch-tear-strip-compact.webp',
  'pocket-audio-charged-pouch-star-tab': 'assets/package/pocket-audio-charged-pouch-star-tab.webp',
  'game-zone-basic-pouch-body': 'assets/package/game-zone-basic-pouch-body.webp',
  'game-zone-basic-pouch-tear-strip': 'assets/package/game-zone-basic-pouch-tear-strip-compact.webp',
  'game-zone-basic-pouch-star-tab': 'assets/package/game-zone-basic-pouch-star-tab.webp',
  'game-zone-charged-pouch-body': 'assets/package/game-zone-charged-pouch-body.webp',
  'game-zone-charged-pouch-tear-strip': 'assets/package/game-zone-charged-pouch-tear-strip-compact.webp',
  'game-zone-charged-pouch-star-tab': 'assets/package/game-zone-charged-pouch-star-tab.webp',
  'analog-nights-basic-pouch-body': 'assets/package/analog-nights-basic-pouch-body.webp',
  'analog-nights-basic-pouch-tear-strip': 'assets/package/analog-nights-basic-pouch-tear-strip-compact.webp',
  'analog-nights-basic-pouch-star-tab': 'assets/package/analog-nights-basic-pouch-star-tab.webp',
  'analog-nights-charged-pouch-body': 'assets/package/analog-nights-charged-pouch-body.webp',
  'analog-nights-charged-pouch-tear-strip': 'assets/package/analog-nights-charged-pouch-tear-strip-compact.webp',
  'analog-nights-charged-pouch-star-tab': 'assets/package/analog-nights-charged-pouch-star-tab.webp',
  'airwaves-basic-pouch-body': 'assets/package/airwaves-basic-pouch-body.webp',
  'airwaves-basic-pouch-tear-strip': 'assets/package/airwaves-basic-pouch-tear-strip-compact.webp',
  'airwaves-basic-pouch-star-tab': 'assets/package/airwaves-basic-pouch-star-tab.webp',
  'airwaves-charged-pouch-body': 'assets/package/airwaves-charged-pouch-body.webp',
  'airwaves-charged-pouch-tear-strip': 'assets/package/airwaves-charged-pouch-tear-strip-compact.webp',
  'airwaves-charged-pouch-star-tab': 'assets/package/airwaves-charged-pouch-star-tab.webp',
  'opening-bg': 'assets/backgrounds/opening-bg.webp',
  'collection-bg': 'assets/backgrounds/collection-bg.webp',
  'collection-foreground': 'assets/backgrounds/collection-foreground.webp',
} as const;

export type StaticArtId = keyof typeof STATIC_ART_PATHS;

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
  'portable-radio-common',
  'portable-radio-rare',
  'portable-radio-epic',
  'portable-radio-legendary',
  'portable-radio-secret-shortwave',
  'walkie-talkie-common',
  'walkie-talkie-rare',
  'walkie-talkie-epic',
  'walkie-talkie-legendary',
  'walkie-talkie-secret-field-radio',
]);

export const AVAILABLE_STATIC_ART_IDS = new Set<StaticArtId>(
  Object.keys(STATIC_ART_PATHS) as StaticArtId[],
);

export const collectibleTextureKey = (collectibleId: string): string =>
  `${COLLECTIBLE_TEXTURE_PREFIX}${collectibleId}`;

export const staticTextureKey = (id: StaticArtId): string => `${STATIC_TEXTURE_PREFIX}${id}`;

export type PouchArtVariant = 'basic' | 'charged';
export type PouchArtLayer = 'body' | 'tear-strip' | 'star-tab';

type PouchLayerIds = Readonly<Record<PouchArtLayer, StaticArtId>>;
type PouchVariantIds = Readonly<Record<PouchArtVariant, PouchLayerIds>>;

const POUCH_STATIC_ART_IDS: PouchVariantIds = {
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

const themedPouchIds = (dropId: Exclude<GameLootPoolId, typeof DEFAULT_LOOT_POOL_ID>): PouchVariantIds => ({
  basic: {
    body: `${dropId}-basic-pouch-body` as StaticArtId,
    'tear-strip': `${dropId}-basic-pouch-tear-strip` as StaticArtId,
    'star-tab': `${dropId}-basic-pouch-star-tab` as StaticArtId,
  },
  charged: {
    body: `${dropId}-charged-pouch-body` as StaticArtId,
    'tear-strip': `${dropId}-charged-pouch-tear-strip` as StaticArtId,
    'star-tab': `${dropId}-charged-pouch-star-tab` as StaticArtId,
  },
});

const DROP_POUCH_STATIC_ART_IDS: Readonly<Partial<Record<GameLootPoolId, PouchVariantIds>>> = {
  'video-link': themedPouchIds('video-link'),
  'pocket-office': themedPouchIds('pocket-office'),
  'pocket-audio': themedPouchIds('pocket-audio'),
  'game-zone': themedPouchIds('game-zone'),
  'analog-nights': themedPouchIds('analog-nights'),
  airwaves: themedPouchIds('airwaves'),
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

const dropPouchIds = (lootPoolId: LootPoolId): PouchVariantIds =>
  DROP_POUCH_STATIC_ART_IDS[lootPoolId as GameLootPoolId] ?? POUCH_STATIC_ART_IDS;

export const pouchStaticArtId = (
  variant: PouchArtVariant,
  layer: PouchArtLayer,
  lootPoolId: LootPoolId = DEFAULT_LOOT_POOL_ID,
): StaticArtId => dropPouchIds(lootPoolId)[variant][layer];

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

export const getRuntimePouchArt = (
  variant: PouchArtVariant,
  lootPoolId: LootPoolId = DEFAULT_LOOT_POOL_ID,
): readonly RuntimeStaticArt[] =>
  toRuntimeStaticArt(Object.values(dropPouchIds(lootPoolId)[variant]));

export const getRuntimePouchArtForLootPool = (
  lootPoolId: LootPoolId,
): readonly RuntimeStaticArt[] => [
  ...getRuntimePouchArt('basic', lootPoolId),
  ...getRuntimePouchArt('charged', lootPoolId),
];
