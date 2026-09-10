import { DEFAULT_DROP_REGISTRY } from './defaultDropFixture';
import { describe, expect, it } from 'vitest';


import { resolveCollectionMilestone } from '../src/game/systems/collectionMilestones';
import type { PendingReveal } from '../src/game/systems/drops';
import { createInitialSaveState, type SaveState } from '../src/game/systems/save';

const standardIds = DEFAULT_DROP_REGISTRY.standardItems.map(({ collectible }) => collectible.id);
const secretIds = DEFAULT_DROP_REGISTRY.secrets.map(({ collectible }) => collectible.id);

const itemAt = (items: readonly string[], index: number): string => {
  const item = items[index];
  if (!item) throw new Error(`Missing test fixture item at ${index}`);
  return item;
};

const makeCommitted = (standards: readonly string[], secrets: readonly string[]): SaveState => ({
  ...createInitialSaveState(),
  discoveredStandard: [...standards],
  discoveredSecrets: [...secrets],
  totalOpens: 10,
});

const makePending = ({
  standardId,
  standardIsNew = true,
  secretId = null,
  secretIsNew = false,
}: {
  standardId: string;
  standardIsNew?: boolean;
  secretId?: string | null;
  secretIsNew?: boolean;
}): PendingReveal => {
  const familyId = DEFAULT_DROP_REGISTRY.collectibleFamilyById.get(standardId) ?? 'camera';
  return {
    id: 'milestone-test',
    baseTotalOpens: 9,
    openingNumber: 10,
    pouchType: 'basic',
    lootPoolId: 'y2k-essentials',
    standard: {
      collectibleId: standardId,
      familyId,
      rarity: 'common',
      isNew: standardIsNew,
    },
    signal: {
      before: 0,
      after: 0,
      gain: 0,
      lockArmedBefore: false,
      lockConsumed: false,
      lockReached: false,
      lockRetained: false,
    },
    overcharge: {
      beforeHundredths: 100,
      appliedGainHundredths: 0,
      afterHundredths: 100,
        bonusChips: 0,
    },
    chips: {
      before: 0,
      cost: 0,
      base: 0,
      cacheTier: 'none',
      cacheBonus: 0,
      recycle: 0,
      rawEarned: 0,

      overchargeBonus: 0,
      secretBonus: secretId ? 40 : 0,
      totalEarned: secretId ? 40 : 0,
      after: secretId ? 40 : 0,
    },
    hiddenPocket: secretId
      ? {
          collectibleId: secretId,
          familyId: DEFAULT_DROP_REGISTRY.collectibleFamilyById.get(secretId) ?? 'camera',
          isNew: secretIsNew,
          bonusChips: 40,
        }
      : null,
    commit: makeCommitted([], []),
  };
};

describe('collection milestones', () => {
  it('fires the halfway standard beat exactly on 3→4', () => {
    const committed = makeCommitted(standardIds.slice(0, 4), []);
    const pending = makePending({ standardId: itemAt(standardIds, 3) });
    expect(resolveCollectionMilestone(DEFAULT_DROP_REGISTRY, pending, committed)).toEqual({
      kind: 'standards-half', current: 4, total: 8,
    });
  });

  it('does not replay halfway on later standard discoveries or duplicates', () => {
    const five = makeCommitted(standardIds.slice(0, 5), []);
    expect(resolveCollectionMilestone(
      DEFAULT_DROP_REGISTRY,
      makePending({ standardId: itemAt(standardIds, 4) }),
      five,
    )).toBeNull();
    expect(resolveCollectionMilestone(
      DEFAULT_DROP_REGISTRY,
      makePending({ standardId: itemAt(standardIds, 0), standardIsNew: false }),
      five,
    )).toBeNull();
  });

  it('fires standards complete exactly on 7→8 and outranks a first Secret on the same opening', () => {
    const committed = makeCommitted(standardIds, [itemAt(secretIds, 0)]);
    const pending = makePending({
      standardId: itemAt(standardIds, 7),
      secretId: itemAt(secretIds, 0),
      secretIsNew: true,
    });
    expect(resolveCollectionMilestone(DEFAULT_DROP_REGISTRY, pending, committed)).toEqual({
      kind: 'standards-complete', current: 8, total: 8,
    });
  });

  it('fires first Secret only on the first new Secret', () => {
    const committed = makeCommitted([itemAt(standardIds, 0)], [itemAt(secretIds, 0)]);
    const pending = makePending({
      standardId: itemAt(standardIds, 0),
      standardIsNew: false,
      secretId: itemAt(secretIds, 0),
      secretIsNew: true,
    });
    expect(resolveCollectionMilestone(DEFAULT_DROP_REGISTRY, pending, committed)).toEqual({
      kind: 'first-secret', current: 1, total: 2,
    });
  });

  it('fires 2/2 Secrets completion and gives it top priority', () => {
    const committed = makeCommitted(standardIds, secretIds);
    const pending = makePending({
      standardId: itemAt(standardIds, 7),
      secretId: itemAt(secretIds, 1),
      secretIsNew: true,
    });
    expect(resolveCollectionMilestone(DEFAULT_DROP_REGISTRY, pending, committed)).toEqual({
      kind: 'secrets-complete', current: 2, total: 2,
    });
  });

  it('ignores unknown ids and already-complete collections', () => {
    const committed = makeCommitted([...standardIds, 'unknown-standard'], [...secretIds, 'unknown-secret']);
    const pending = makePending({ standardId: itemAt(standardIds, 0), standardIsNew: false });
    expect(resolveCollectionMilestone(DEFAULT_DROP_REGISTRY, pending, committed)).toBeNull();
  });
});
