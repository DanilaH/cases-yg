import type { ContentRegistry } from '../data/collectibles';
import type { PendingReveal } from './drops';
import type { SaveState } from './save';

export type CollectionMilestoneKind =
  | 'standards-half'
  | 'standards-complete'
  | 'first-secret'
  | 'secrets-complete';

export interface CollectionMilestone {
  kind: CollectionMilestoneKind;
  current: number;
  total: number;
}

const countOwned = (owned: readonly string[], validIds: ReadonlySet<string>): number =>
  owned.reduce((count, id) => count + (validIds.has(id) ? 1 : 0), 0);

export const resolveCollectionMilestone = (
  registry: ContentRegistry,
  pending: PendingReveal,
  committed: SaveState,
): CollectionMilestone | null => {
  if (!registry.lootPoolById.has(pending.lootPoolId)) {
    throw new Error(`Unknown loot pool: ${pending.lootPoolId}`);
  }
  const standardIds = new Set(
    registry.standardItems
      .filter(({ lootPoolId }) => lootPoolId === pending.lootPoolId)
      .map(({ collectible }) => collectible.id),
  );
  const secretIds = new Set(
    registry.secrets
      .filter(({ lootPoolId }) => lootPoolId === pending.lootPoolId)
      .map(({ collectible }) => collectible.id),
  );
  const totalStandards = standardIds.size;
  const totalSecrets = secretIds.size;
  const afterStandards = countOwned(committed.discoveredStandard, standardIds);
  const afterSecrets = countOwned(committed.discoveredSecrets, secretIds);

  const beforeStandardOwned = pending.standard.isNew
    ? committed.discoveredStandard.filter((id) => id !== pending.standard.collectibleId)
    : committed.discoveredStandard;
  const beforeSecretOwned = pending.hiddenPocket?.isNew
    ? committed.discoveredSecrets.filter((id) => id !== pending.hiddenPocket?.collectibleId)
    : committed.discoveredSecrets;
  const beforeStandards = countOwned(beforeStandardOwned, standardIds);
  const beforeSecrets = countOwned(beforeSecretOwned, secretIds);
  const halfStandards = Math.ceil(totalStandards / 2);

  // At most one celebration per opening. Completion outranks first/halfway beats.
  if (totalSecrets > 0 && beforeSecrets < totalSecrets && afterSecrets >= totalSecrets) {
    return { kind: 'secrets-complete', current: totalSecrets, total: totalSecrets };
  }
  if (totalStandards > 0 && beforeStandards < totalStandards && afterStandards >= totalStandards) {
    return { kind: 'standards-complete', current: totalStandards, total: totalStandards };
  }
  if (totalSecrets > 0 && beforeSecrets === 0 && afterSecrets >= 1) {
    return { kind: 'first-secret', current: 1, total: totalSecrets };
  }
  if (
    totalStandards > 0 &&
    halfStandards < totalStandards &&
    beforeStandards < halfStandards &&
    afterStandards >= halfStandards
  ) {
    return { kind: 'standards-half', current: halfStandards, total: totalStandards };
  }
  return null;
};
