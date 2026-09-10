import { DEFAULT_DROP_REGISTRY } from './defaultDropFixture';
import { describe, expect, it } from 'vitest';


import { getStandardNearCompletion } from '../src/game/systems/collection';

const standards = DEFAULT_DROP_REGISTRY.standardItems;
const ids = standards.map(({ collectible }) => collectible.id);
const last = standards.at(-1);
if (!last) throw new Error('Slice requires at least one standard collectible');

describe('standard near-completion presentation state', () => {
  it('identifies the one missing standard at 7/8', () => {
    expect(getStandardNearCompletion(DEFAULT_DROP_REGISTRY, { discoveredStandard: ids.slice(0, -1) })).toEqual({
      current: 7,
      total: 8,
      missingCollectibleId: last.collectible.id,
      familyId: last.familyId,
      rarity: last.rarity,
    });
  });

  it('stays off before 7/8 and after completion', () => {
    expect(getStandardNearCompletion(DEFAULT_DROP_REGISTRY, { discoveredStandard: ids.slice(0, 6) })).toBeNull();
    expect(getStandardNearCompletion(DEFAULT_DROP_REGISTRY, { discoveredStandard: ids })).toBeNull();
  });

  it('ignores unknown ids instead of treating them as collection progress', () => {
    expect(getStandardNearCompletion(DEFAULT_DROP_REGISTRY, {
      discoveredStandard: [...ids.slice(0, 6), 'unknown-standard'],
    })).toBeNull();
    expect(getStandardNearCompletion(DEFAULT_DROP_REGISTRY, {
      discoveredStandard: [...ids.slice(0, -1), 'unknown-standard'],
    })?.missingCollectibleId).toBe(last.collectible.id);
  });
});
