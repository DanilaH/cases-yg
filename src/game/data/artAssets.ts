import { GAME_REGISTRY, type ContentRegistry, type LootPoolId } from './collectibles';

const COLLECTIBLE_TEXTURE_PREFIX = 'art:collectible:';
const STATIC_TEXTURE_PREFIX = 'art:static:';

export type StaticArtId =
  | 'pouch-body'
  | 'pouch-tear-strip'
  | 'pouch-star-tab'
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
  'opening-bg': 'assets/backgrounds/opening-bg.webp',
  'collection-bg': 'assets/backgrounds/collection-bg.webp',
  'collection-foreground': 'assets/backgrounds/collection-foreground.webp',
};

/**
 * Add ids only after the matching export exists under public/ and has been
 * reviewed. Explicit availability prevents unfinished art from causing preload
 * 404s while allowing reviewed exports to replace procedural fallbacks without
 * changing scene code.
 */
export const AVAILABLE_COLLECTIBLE_ART_IDS = new Set<string>(
  [...GAME_REGISTRY.standardItems, ...GAME_REGISTRY.secrets].map(({ collectible }) => collectible.id),
);
export const AVAILABLE_STATIC_ART_IDS = new Set<StaticArtId>([
  'pouch-body',
  'pouch-tear-strip',
  'pouch-star-tab',
  'opening-bg',
  'collection-bg',
  'collection-foreground',
]);

export const collectibleTextureKey = (collectibleId: string): string =>
  `${COLLECTIBLE_TEXTURE_PREFIX}${collectibleId}`;

export const staticTextureKey = (id: StaticArtId): string => `${STATIC_TEXTURE_PREFIX}${id}`;

const toRuntimeCollectibleArt = (registry: ContentRegistry, lootPoolId?: LootPoolId): readonly RuntimeCollectibleArt[] => [
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

export const getRuntimeStaticArt = (): readonly RuntimeStaticArt[] =>
  (Object.keys(STATIC_ART_PATHS) as StaticArtId[])
    .filter((id) => AVAILABLE_STATIC_ART_IDS.has(id))
    .map((id) => ({
      id,
      textureKey: staticTextureKey(id),
      assetPath: STATIC_ART_PATHS[id],
    }));
