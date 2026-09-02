export type StandardRarity = 'common' | 'rare' | 'epic' | 'legendary';

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

const standard = (familyId: string, rarity: StandardRarity): CollectibleDefinition => ({
  id: `${familyId}-${rarity}`,
  assetPath: `assets/collectibles/${familyId}-${rarity}.webp`,
  rarity,
  secret: false,
});

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
        id: 'flip-phone-secret-music',
        assetPath: 'assets/collectibles/flip-phone-secret-music.webp',
        secret: true,
      },
    ],
  },
] as const;
