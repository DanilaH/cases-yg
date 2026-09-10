export const STANDARD_RARITIES = ['common', 'rare', 'epic', 'legendary'] as const;
export type StandardRarity = (typeof STANDARD_RARITIES)[number];
export type LootPoolId = string;

export interface CollectibleDefinition {
  id: string;
  assetPath: string;
  rarity?: StandardRarity;
  secret: boolean;
}

export interface GadgetFamilyDefinition {
  id: string;
  dropId: LootPoolId;
  name: Readonly<Record<'en' | 'ru', string>>;
  groupId?: string;
  standard: Readonly<Record<StandardRarity, CollectibleDefinition>>;
  secrets: readonly CollectibleDefinition[];
}

export interface LootPoolDefinition {
  id: LootPoolId;
  familyIds: readonly string[];
}

export interface StandardCollectibleRecord {
  familyId: string;
  lootPoolId: LootPoolId;
  rarity: StandardRarity;
  collectible: CollectibleDefinition;
}

export interface SecretCollectibleRecord {
  familyId: string;
  lootPoolId: LootPoolId;
  collectible: CollectibleDefinition;
}

export interface ContentRegistry {
  families: readonly GadgetFamilyDefinition[];
  familyById: ReadonlyMap<string, GadgetFamilyDefinition>;
  lootPools: readonly LootPoolDefinition[];
  lootPoolById: ReadonlyMap<LootPoolId, LootPoolDefinition>;
  standardItems: readonly StandardCollectibleRecord[];
  secrets: readonly SecretCollectibleRecord[];
  collectibleFamilyById: ReadonlyMap<string, string>;
}

const standard = (familyId: string, rarity: StandardRarity): CollectibleDefinition => ({
  id: `${familyId}-${rarity}`,
  assetPath: `assets/collectibles/${familyId}-${rarity}.webp`,
  rarity,
  secret: false,
});

export const createContentRegistry = (families: readonly GadgetFamilyDefinition[]): ContentRegistry => {
  const familyById = new Map<string, GadgetFamilyDefinition>();
  const collectibleFamilyById = new Map<string, string>();
  const standardItems: StandardCollectibleRecord[] = [];
  const secrets: SecretCollectibleRecord[] = [];
  const familyIdsByLootPool = new Map<LootPoolId, string[]>();

  const registerCollectible = (collectibleId: string, familyId: string): void => {
    if (collectibleFamilyById.has(collectibleId)) {
      throw new Error(`Duplicate collectible id: ${collectibleId}`);
    }
    collectibleFamilyById.set(collectibleId, familyId);
  };

  for (const family of families) {
    if (familyById.has(family.id)) {
      throw new Error(`Duplicate gadget family id: ${family.id}`);
    }
    if (!family.dropId.trim()) {
      throw new Error(`Gadget family ${family.id} requires a non-empty dropId`);
    }
    familyById.set(family.id, family);

    const poolFamilyIds = familyIdsByLootPool.get(family.dropId) ?? [];
    poolFamilyIds.push(family.id);
    familyIdsByLootPool.set(family.dropId, poolFamilyIds);

    for (const rarity of STANDARD_RARITIES) {
      const collectible = family.standard[rarity];
      if (collectible.secret || collectible.rarity !== rarity) {
        throw new Error(`Invalid ${family.id}/${rarity} standard collectible definition`);
      }
      registerCollectible(collectible.id, family.id);
      standardItems.push({ familyId: family.id, lootPoolId: family.dropId, rarity, collectible });
    }

    for (const collectible of family.secrets) {
      if (!collectible.secret) {
        throw new Error(`Secret collectible ${collectible.id} is not marked secret`);
      }
      registerCollectible(collectible.id, family.id);
      secrets.push({ familyId: family.id, lootPoolId: family.dropId, collectible });
    }
  }

  if (families.length === 0) {
    throw new Error('Content registry requires at least one gadget family');
  }

  const lootPools: LootPoolDefinition[] = [...familyIdsByLootPool.entries()].map(([id, familyIds]) => ({
    id,
    familyIds: [...familyIds],
  }));
  const lootPoolById = new Map(lootPools.map((pool) => [pool.id, pool] as const));

  return {
    families: [...families],
    familyById,
    lootPools,
    lootPoolById,
    standardItems,
    secrets,
    collectibleFamilyById,
  };
};

export const DEFAULT_LOOT_POOL_ID = 'y2k-essentials';

export const GAME_LOOT_POOL_IDS = [
  DEFAULT_LOOT_POOL_ID,
  'video-link',
  'pocket-office',
  'pocket-audio',
  'game-zone',
  'analog-nights',
] as const;

const secret = (id: string): CollectibleDefinition => ({
  id,
  assetPath: `assets/collectibles/${id}.webp`,
  secret: true,
});

const family = (
  id: string,
  dropId: LootPoolId,
  name: Readonly<Record<'en' | 'ru', string>>,
  secretId: string,
): GadgetFamilyDefinition => ({
  id,
  dropId,
  name,
  standard: {
    common: standard(id, 'common'),
    rare: standard(id, 'rare'),
    epic: standard(id, 'epic'),
    legendary: standard(id, 'legendary'),
  },
  secrets: [secret(secretId)],
});

export const GAME_FAMILIES: readonly GadgetFamilyDefinition[] = [
  family('camera', DEFAULT_LOOT_POOL_ID, { en: 'Digital Camera', ru: 'Цифровая камера' }, 'camera-secret-cosmic'),
  family('flip-phone', DEFAULT_LOOT_POOL_ID, { en: 'Flip Phone', ru: 'Раскладушка' }, 'flip-phone-secret-noir'),
  family('mini-camcorder', 'video-link', { en: 'Mini Camcorder', ru: 'Мини-камкордер' }, 'mini-camcorder-secret-prototype'),
  family('webcam', 'video-link', { en: 'Webcam', ru: 'Веб-камера' }, 'webcam-secret-stereo'),
  family('pda', 'pocket-office', { en: 'PDA / Pocket Organizer', ru: 'КПК / Карманный органайзер' }, 'pda-secret-flip'),
  family('pager', 'pocket-office', { en: 'Pager / Pocket Communicator', ru: 'Пейджер / Карманный коммуникатор' }, 'pager-secret-flip'),
  family('mp3-player', 'pocket-audio', { en: 'MP3 Player', ru: 'MP3-плеер' }, 'mp3-player-secret-pearl'),
  family('portable-disc-player', 'pocket-audio', { en: 'Portable Disc Player', ru: 'Портативный дисковый плеер' }, 'portable-disc-player-secret-remote'),
  family('handheld-console', 'game-zone', { en: 'Handheld Console', ru: 'Портативная консоль' }, 'handheld-console-secret-phone'),
  family('home-console', 'game-zone', { en: 'Home Console', ru: 'Домашняя консоль' }, 'home-console-secret-noir'),
  family('cassette-player', 'analog-nights', { en: 'Cassette Player', ru: 'Кассетный плеер' }, 'cassette-player-secret-remote'),
  family('crt-tv', 'analog-nights', { en: 'Pocket CRT TV', ru: 'Карманный ЭЛТ-телевизор' }, 'crt-tv-secret-communicator'),
] as const;

export const GAME_REGISTRY = createContentRegistry(GAME_FAMILIES);

/** @deprecated Compatibility-only first-Drop slice. Production runtime uses GAME_REGISTRY. */
export const SLICE_LOOT_POOL_ID = DEFAULT_LOOT_POOL_ID;
/** @deprecated Compatibility-only first-Drop slice. Production runtime uses GAME_FAMILIES. */
export const SLICE_FAMILIES = GAME_FAMILIES.filter((familyDefinition) => familyDefinition.dropId === DEFAULT_LOOT_POOL_ID);
/** @deprecated Compatibility-only first-Drop slice. Production runtime uses GAME_REGISTRY. */
export const SLICE_REGISTRY = createContentRegistry(SLICE_FAMILIES);
