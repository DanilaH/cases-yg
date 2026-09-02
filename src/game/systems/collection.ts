import type { ContentRegistry, StandardRarity } from '../data/collectibles';
import type { SaveState } from './save';

export interface FamilyCollectionSnapshot {
  familyId: string;
  standardOwned: Readonly<Record<StandardRarity, boolean>>;
  standardCount: number;
  standardTotal: number;
  secretOwned: readonly string[];
  secretTotal: number;
}

export interface CollectionSnapshot {
  families: readonly FamilyCollectionSnapshot[];
  standardCount: number;
  standardTotal: number;
  secretCount: number;
  secretTotal: number;
}

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
