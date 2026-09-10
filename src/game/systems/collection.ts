import type { ContentRegistry, GadgetFamilyDefinition, LootPoolId, StandardRarity } from '../data/collectibles';
import type { SaveState } from './save';

export interface FamilyCollectionSnapshot {
  familyId: string;
  standardOwned: Readonly<Record<StandardRarity, boolean>>;
  standardCount: number;
  standardTotal: number;
  secretOwned: readonly string[];
  secretTotal: number;
}

export interface ShelfFeaturedOwnedCollectible {
  collectibleId: string;
  rarity: StandardRarity | 'secret';
}

const SHELF_STANDARD_PRIORITY: readonly StandardRarity[] = ['legendary', 'epic', 'rare', 'common'];

export const getShelfFeaturedOwned = (
  family: GadgetFamilyDefinition,
  snapshot: FamilyCollectionSnapshot,
): ShelfFeaturedOwnedCollectible | null => {
  const ownedSecret = family.secrets.find((secret) => snapshot.secretOwned.includes(secret.id));
  if (ownedSecret) {
    return { collectibleId: ownedSecret.id, rarity: 'secret' };
  }

  for (const rarity of SHELF_STANDARD_PRIORITY) {
    if (snapshot.standardOwned[rarity]) {
      return { collectibleId: family.standard[rarity].id, rarity };
    }
  }

  return null;
};

export interface CollectionSnapshot {
  families: readonly FamilyCollectionSnapshot[];
  standardCount: number;
  standardTotal: number;
  secretCount: number;
  secretTotal: number;
}

export interface StandardNearCompletion {
  current: number;
  total: number;
  missingCollectibleId: string;
  familyId: string;
  rarity: StandardRarity;
}

const getNearCompletionFromItems = (
  items: ContentRegistry['standardItems'],
  state: Pick<SaveState, 'discoveredStandard'>,
): StandardNearCompletion | null => {
  const total = items.length;
  if (total < 2) return null;

  const owned = new Set(state.discoveredStandard);
  const missing = items.filter(({ collectible }) => !owned.has(collectible.id));
  if (missing.length !== 1) return null;

  const last = missing[0];
  if (!last) return null;
  return {
    current: total - 1,
    total,
    missingCollectibleId: last.collectible.id,
    familyId: last.familyId,
    rarity: last.rarity,
  };
};

export const getStandardNearCompletion = (
  registry: ContentRegistry,
  state: Pick<SaveState, 'discoveredStandard'>,
): StandardNearCompletion | null => getNearCompletionFromItems(registry.standardItems, state);

export const getStandardLootPoolNearCompletion = (
  registry: ContentRegistry,
  lootPoolId: LootPoolId,
  state: Pick<SaveState, 'discoveredStandard'>,
): StandardNearCompletion | null => {
  if (!registry.lootPoolById.has(lootPoolId)) {
    throw new Error(`Unknown loot pool: ${lootPoolId}`);
  }
  return getNearCompletionFromItems(
    registry.standardItems.filter((item) => item.lootPoolId === lootPoolId),
    state,
  );
};

export const buildCollectionSnapshot = (
  registry: ContentRegistry,
  state: Pick<SaveState, 'discoveredStandard' | 'discoveredSecrets'>,
): CollectionSnapshot => {
  const standardOwned = new Set(state.discoveredStandard);
  const secretOwned = new Set(state.discoveredSecrets);

  const families = registry.families.map((family): FamilyCollectionSnapshot => {
    const standard = {
      common: standardOwned.has(family.standard.common.id),
      rare: standardOwned.has(family.standard.rare.id),
      epic: standardOwned.has(family.standard.epic.id),
      legendary: standardOwned.has(family.standard.legendary.id),
    };
    const ownedSecrets = family.secrets
      .filter((collectible) => secretOwned.has(collectible.id))
      .map((collectible) => collectible.id);

    return {
      familyId: family.id,
      standardOwned: standard,
      standardCount: Object.values(standard).filter(Boolean).length,
      standardTotal: 4,
      secretOwned: ownedSecrets,
      secretTotal: family.secrets.length,
    };
  });

  return {
    families,
    standardCount: registry.standardItems.filter(({ collectible }) => standardOwned.has(collectible.id)).length,
    standardTotal: registry.standardItems.length,
    secretCount: registry.secrets.filter(({ collectible }) => secretOwned.has(collectible.id)).length,
    secretTotal: registry.secrets.length,
  };
};
