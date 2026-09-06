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

export const SLICE_LOOT_POOL_ID = 'y2k-essentials';

export const SLICE_FAMILIES: readonly GadgetFamilyDefinition[] = [
  {
    id: 'camera',
    dropId: SLICE_LOOT_POOL_ID,
    name: { en: 'Digital Camera', ru: 'Цифровая камера' },
    standard: {
      common: standard('camera', 'common'),
      rare: standard('camera', 'rare'),
      epic: standard('camera', 'epic'),
      legendary: standard('camera', 'legendary'),
    },
    secrets: [
      {
        id: 'camera-secret-cosmic',
        assetPath: 'assets/collectibles/camera-secret-cosmic.webp',
        secret: true,
      },
    ],
  },
  {
    id: 'flip-phone',
    dropId: SLICE_LOOT_POOL_ID,
    name: { en: 'Flip Phone', ru: 'Раскладушка' },
    standard: {
      common: standard('flip-phone', 'common'),
      rare: standard('flip-phone', 'rare'),
      epic: standard('flip-phone', 'epic'),
      legendary: standard('flip-phone', 'legendary'),
    },
    secrets: [
      {
        id: 'flip-phone-secret-noir',
        assetPath: 'assets/collectibles/flip-phone-secret-noir.webp',
        secret: true,
      },
    ],
  },
] as const;

export const SLICE_REGISTRY = createContentRegistry(SLICE_FAMILIES);
