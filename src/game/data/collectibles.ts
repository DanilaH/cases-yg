export const STANDARD_RARITIES = ['common', 'rare', 'epic', 'legendary'] as const;
export type StandardRarity = (typeof STANDARD_RARITIES)[number];

export interface CollectibleDefinition {
  id: string;
  assetPath: string;
  rarity?: StandardRarity;
  secret: boolean;
}

export interface GadgetFamilyDefinition {
  id: string;
  name: Readonly<Record<'en' | 'ru', string>>;
  groupId?: string;
  standard: Readonly<Record<StandardRarity, CollectibleDefinition>>;
  secrets: readonly CollectibleDefinition[];
}

export interface StandardCollectibleRecord {
  familyId: string;
  rarity: StandardRarity;
  collectible: CollectibleDefinition;
}

export interface SecretCollectibleRecord {
  familyId: string;
  collectible: CollectibleDefinition;
}

export interface ContentRegistry {
  families: readonly GadgetFamilyDefinition[];
  familyById: ReadonlyMap<string, GadgetFamilyDefinition>;
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
    familyById.set(family.id, family);

    for (const rarity of STANDARD_RARITIES) {
      const collectible = family.standard[rarity];
      if (collectible.secret || collectible.rarity !== rarity) {
        throw new Error(`Invalid ${family.id}/${rarity} standard collectible definition`);
      }
      registerCollectible(collectible.id, family.id);
      standardItems.push({ familyId: family.id, rarity, collectible });
    }

    for (const collectible of family.secrets) {
      if (!collectible.secret) {
        throw new Error(`Secret collectible ${collectible.id} is not marked secret`);
      }
      registerCollectible(collectible.id, family.id);
      secrets.push({ familyId: family.id, collectible });
    }
  }

  if (families.length === 0) {
    throw new Error('Content registry requires at least one gadget family');
  }

  return {
    families: [...families],
    familyById,
    standardItems,
    secrets,
    collectibleFamilyById,
  };
};

export const SLICE_FAMILIES: readonly GadgetFamilyDefinition[] = [
  {
    id: 'camera',
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
