import { describe, expect, it } from 'vitest';

import { LITE_V2_BALANCE } from '../src/game/data/balance';
import {
  createContentRegistry,
  SLICE_FAMILIES,
  SLICE_LOOT_POOL_ID,
  SLICE_REGISTRY,
  type GadgetFamilyDefinition,
} from '../src/game/data/collectibles';
import { analyzePouchEconomy, resolveLitePouchReward, type LiteRewardState } from '../src/game/systems/pouches';
import { SequenceRandom } from './helpers';

const makeState = (overrides: Partial<LiteRewardState> = {}): LiteRewardState => ({
  chips: 0,
  signal: 0,
  overchargeHundredths: 100,
  totalOpens: 3,
  activeLootPoolId: SLICE_LOOT_POOL_ID,
  discoveredStandard: [],
  discoveredSecrets: [],
  ...overrides,
});

const allStandardIdsExcept = (...excluded: readonly string[]): string[] => {
  const omitted = new Set(excluded);
  return SLICE_REGISTRY.standardItems
    .map(({ collectible }) => collectible.id)
    .filter((collectibleId) => !omitted.has(collectibleId));
};

const mp3Family: GadgetFamilyDefinition = {
  id: 'mp3-player',
  dropId: 'music-tech',
  name: { en: 'MP3 Player', ru: 'MP3-плеер' },
  standard: {
    common: { id: 'mp3-player-common', assetPath: 'mp3-common.webp', rarity: 'common', secret: false },
    rare: { id: 'mp3-player-rare', assetPath: 'mp3-rare.webp', rarity: 'rare', secret: false },
    epic: { id: 'mp3-player-epic', assetPath: 'mp3-epic.webp', rarity: 'epic', secret: false },
    legendary: {
      id: 'mp3-player-legendary',
      assetPath: 'mp3-legendary.webp',
      rarity: 'legendary',
      secret: false,
    },
  },
  secrets: [],
};

describe('Gameplay Loop Lite V2 pure pouch resolver', () => {
  it('keeps Basic and Charged rarity access structurally distinct', () => {
    expect(LITE_V2_BALANCE.pouchProfiles.basic.rarityWeights).toEqual({
      common: 72,
      rare: 25,
      epic: 3,
      legendary: 0,
    });
    expect(LITE_V2_BALANCE.pouchProfiles.charged.rarityWeights).toEqual({
      common: 35,
      rare: 40,
      epic: 20,
      legendary: 5,
    });
    expect(Object.values(LITE_V2_BALANCE.pouchProfiles.basic.rarityWeights).reduce((sum, value) => sum + value, 0)).toBe(100);
    expect(Object.values(LITE_V2_BALANCE.pouchProfiles.charged.rarityWeights).reduce((sum, value) => sum + value, 0)).toBe(100);
  });

  it('never standard-rolls Legendary from Basic even at the top of its distribution', () => {
    const result = resolveLitePouchReward({
      state: makeState(),
      pouchType: 'basic',
      registry: SLICE_REGISTRY,
      balance: LITE_V2_BALANCE,
      random: new SequenceRandom([0, 0.999, 0, 0, 0.999]),
    });

    expect(result.standard.collectibleId).toBe('camera-epic');
    expect(result.standard.rarity).toBe('epic');
    expect(result.chips.cost).toBe(0);
  });

  it('can standard-roll Legendary from Charged', () => {
    const result = resolveLitePouchReward({
      state: makeState({ chips: 60 }),
      pouchType: 'charged',
      registry: SLICE_REGISTRY,
      balance: LITE_V2_BALANCE,
      random: new SequenceRandom([0, 0.999, 0, 0, 0.999]),
    });

    expect(result.standard.collectibleId).toBe('camera-legendary');
    expect(result.standard.rarity).toBe('legendary');
    expect(result.chips.cost).toBe(60);
  });

  it('resolves collectible rarity and CHIPS cache as independent luck axes', () => {
    const result = resolveLitePouchReward({
      state: makeState(),
      pouchType: 'basic',
      registry: SLICE_REGISTRY,
      balance: LITE_V2_BALANCE,
      random: new SequenceRandom([0, 0, 0, 0.999, 0.5, 0.999]),
    });

    expect(result.standard.rarity).toBe('common');
    expect(result.chips.base).toBe(6);
    expect(result.chips.cacheTier).toBe('mega');
    expect(result.chips.cacheBonus).toBe(150);
    expect(result.chips.totalEarned).toBe(156);
    expect(result.chips.after).toBe(156);
  });

  it('auto-recycles a duplicate into rarity-dependent CHIPS and one Signal segment', () => {
    const result = resolveLitePouchReward({
      state: makeState({ discoveredStandard: ['camera-common'] }),
      pouchType: 'basic',
      registry: SLICE_REGISTRY,
      balance: LITE_V2_BALANCE,
      random: new SequenceRandom([0, 0, 0, 0, 0.999]),
    });

    expect(result.standard.collectibleId).toBe('camera-common');
    expect(result.standard.isNew).toBe(false);
    expect(result.chips.recycle).toBe(2);
    expect(result.chips.totalEarned).toBe(8);
    expect(result.signal).toMatchObject({ before: 0, after: 1, gain: 1, lockReached: false });
  });

  it('arms Signal at 4/4 and does not overfill it', () => {
    const reachesLock = resolveLitePouchReward({
      state: makeState({ signal: 3, discoveredStandard: ['camera-common'] }),
      pouchType: 'basic',
      registry: SLICE_REGISTRY,
      balance: LITE_V2_BALANCE,
      random: new SequenceRandom([0, 0, 0, 0, 0.999]),
    });
    const staysLocked = resolveLitePouchReward({
      state: makeState({ signal: 4, discoveredStandard: allStandardIdsExcept('flip-phone-legendary') }),
      pouchType: 'basic',
      registry: SLICE_REGISTRY,
      balance: LITE_V2_BALANCE,
      random: new SequenceRandom([0, 0, 0, 0, 0.999]),
    });

    expect(reachesLock.signal).toMatchObject({ before: 3, after: 4, gain: 1, lockReached: true });
    expect(staysLocked.signal).toMatchObject({ before: 4, after: 4, gain: 0, lockRetained: true });
  });

  it('preserves pouch rarity weighting under Signal instead of multiplying weight by missing item count', () => {
    const result = resolveLitePouchReward({
      state: makeState({
        signal: 4,
        discoveredStandard: allStandardIdsExcept('camera-common', 'flip-phone-common', 'camera-epic'),
      }),
      pouchType: 'basic',
      registry: SLICE_REGISTRY,
      balance: LITE_V2_BALANCE,
      random: new SequenceRandom([0.97, 0, 0, 0, 0.999]),
    });

    expect(result.standard.collectibleId).toBe('camera-epic');
    expect(result.signal.lockConsumed).toBe(true);
    expect(result.signal.after).toBe(0);
  });

  it('keeps an armed Signal lock when only Legendary remains and Basic is opened', () => {
    const state = makeState({
      signal: 4,
      discoveredStandard: allStandardIdsExcept('flip-phone-legendary'),
    });
    const result = resolveLitePouchReward({
      state,
      pouchType: 'basic',
      registry: SLICE_REGISTRY,
      balance: LITE_V2_BALANCE,
      random: new SequenceRandom([0, 0, 0, 0, 0.999]),
    });

    expect(result.standard.rarity).toBe('common');
    expect(result.standard.isNew).toBe(false);
    expect(result.signal).toMatchObject({
      before: 4,
      after: 4,
      lockArmedBefore: true,
      lockConsumed: false,
      lockRetained: true,
    });
  });

  it('lets the following eligible Charged opening consume Signal on the missing Legendary', () => {
    const result = resolveLitePouchReward({
      state: makeState({
        chips: 60,
        signal: 4,
        discoveredStandard: allStandardIdsExcept('flip-phone-legendary'),
      }),
      pouchType: 'charged',
      registry: SLICE_REGISTRY,
      balance: LITE_V2_BALANCE,
      random: new SequenceRandom([0, 0, 0, 0.999]),
    });

    expect(result.standard.collectibleId).toBe('flip-phone-legendary');
    expect(result.standard.isNew).toBe(true);
    expect(result.signal).toMatchObject({ before: 4, after: 0, lockConsumed: true, lockRetained: false });
  });

  it('does not start Overcharge on the same opening that first reaches 4/4', () => {
    const result = resolveLitePouchReward({
      state: makeState({ signal: 3, discoveredStandard: ['camera-common'] }),
      pouchType: 'basic',
      registry: SLICE_REGISTRY,
      balance: LITE_V2_BALANCE,
      random: new SequenceRandom([0, 0, 0, 0, 0.999]),
    });

    expect(result.signal.lockReached).toBe(true);
    expect(result.overcharge).toEqual({
      beforeHundredths: 100,
      afterHundredths: 100,
      appliedGainHundredths: 0,
      bonusChips: 0,
    });
  });

  it('applies the existing multiplier first and only then gains from a retained Basic lock', () => {
    const state = makeState({
      signal: 4,
      overchargeHundredths: 110,
      discoveredStandard: allStandardIdsExcept('flip-phone-legendary'),
    });
    const result = resolveLitePouchReward({
      state,
      pouchType: 'basic',
      registry: SLICE_REGISTRY,
      balance: LITE_V2_BALANCE,
      random: new SequenceRandom([0, 0, 0, 0, 0.999]),
    });

    expect(result.signal.lockRetained).toBe(true);
    expect(result.chips.rawEarned).toBe(8);
    expect(result.chips.overchargeBonus).toBe(1);
    expect(result.chips.totalEarned).toBe(9);
    expect(result.overcharge).toMatchObject({
      beforeHundredths: 110,
      afterHundredths: 120,
      appliedGainHundredths: 10,
      bonusChips: 1,
    });
  });

  it('cashes out the current multiplier before a consuming lock resets Overcharge', () => {
    const result = resolveLitePouchReward({
      state: makeState({
        chips: 60,
        signal: 4,
        overchargeHundredths: 130,
        discoveredStandard: allStandardIdsExcept('flip-phone-legendary'),
      }),
      pouchType: 'charged',
      registry: SLICE_REGISTRY,
      balance: LITE_V2_BALANCE,
      random: new SequenceRandom([0, 0, 0, 0.999]),
    });

    expect(result.signal.lockConsumed).toBe(true);
    const expectedBonus = Math.round(result.chips.rawEarned * 0.3);
    expect(result.chips.overchargeBonus).toBe(expectedBonus);
    expect(result.overcharge).toMatchObject({
      beforeHundredths: 130,
      afterHundredths: 100,
      appliedGainHundredths: 0,
      bonusChips: expectedBonus,
    });
  });

  it('clamps a retained pouch gain to the actual remaining cap headroom', () => {
    const result = resolveLitePouchReward({
      state: makeState({
        chips: 60,
        signal: 4,
        overchargeHundredths: 140,
        discoveredStandard: allStandardIdsExcept(),
      }),
      pouchType: 'charged',
      registry: SLICE_REGISTRY,
      balance: LITE_V2_BALANCE,
      random: new SequenceRandom([0, 0, 0, 0, 0.999]),
    });

    expect(result.signal.lockRetained).toBe(true);
    expect(result.overcharge.afterHundredths).toBe(150);
    expect(result.overcharge.appliedGainHundredths).toBe(10);
  });

  it('keeps applying a MAX multiplier without inventing another gain', () => {
    const result = resolveLitePouchReward({
      state: makeState({
        signal: 4,
        overchargeHundredths: 150,
        discoveredStandard: allStandardIdsExcept(),
      }),
      pouchType: 'basic',
      registry: SLICE_REGISTRY,
      balance: LITE_V2_BALANCE,
      random: new SequenceRandom([0, 0, 0, 0, 0.999]),
    });

    expect(result.chips.rawEarned).toBe(8);
    expect(result.chips.overchargeBonus).toBe(4);
    expect(result.overcharge).toMatchObject({
      beforeHundredths: 150,
      afterHundredths: 150,
      appliedGainHundredths: 0,
      bonusChips: 4,
    });
  });

  it('preserves onboarding protection and makes opening two use another family when possible', () => {
    const result = resolveLitePouchReward({
      state: makeState({
        totalOpens: 1,
        discoveredStandard: ['camera-common'],
      }),
      pouchType: 'basic',
      registry: SLICE_REGISTRY,
      balance: LITE_V2_BALANCE,
      random: new SequenceRandom([0, 0, 0]),
    });

    expect(result.openingNumber).toBe(2);
    expect(result.standard.familyId).toBe('flip-phone');
    expect(result.standard.isNew).toBe(true);
  });

  it('scopes standard rewards to the active Drop without changing the resolver', () => {
    const registry = createContentRegistry([...SLICE_FAMILIES, mp3Family]);
    const result = resolveLitePouchReward({
      state: makeState({ activeLootPoolId: 'music-tech' }),
      pouchType: 'basic',
      registry,
      balance: LITE_V2_BALANCE,
      random: new SequenceRandom([0, 0, 0, 0, 0.999]),
    });

    expect(registry.lootPools.map(({ id }) => id)).toEqual([SLICE_LOOT_POOL_ID, 'music-tech']);
    expect(result.lootPoolId).toBe('music-tech');
    expect(result.standard.collectibleId).toBe('mp3-player-common');
  });

  it('rejects Charged before any reward is resolved when the wallet cannot afford it', () => {
    expect(() =>
      resolveLitePouchReward({
        state: makeState({ chips: 59 }),
        pouchType: 'charged',
        registry: SLICE_REGISTRY,
        balance: LITE_V2_BALANCE,
        random: new SequenceRandom([]),
      }),
    ).toThrow('Insufficient CHIPS');
  });

  it('keeps Charged a CHIPS sink even in the all-duplicate expected-value stress case', () => {
    const basic = analyzePouchEconomy(LITE_V2_BALANCE, 'basic');
    const charged = analyzePouchEconomy(LITE_V2_BALANCE, 'charged');
    const mega = LITE_V2_BALANCE.pouchProfiles.charged.cacheTiers.find(({ id }) => id === 'mega')!;

    expect(basic.expectedSecretBonus).toBeCloseTo(0.6, 3);
    expect(charged.expectedSecretBonus).toBeCloseTo(2.4, 3);
    expect(basic.expectedReturnIfAllDuplicate).toBeCloseTo(15.455, 3);
    expect(charged.expectedReturnIfAllDuplicate).toBeCloseTo(37.725, 3);
    expect(charged.expectedNetIfAllDuplicate).toBeLessThan(0);
    expect(mega.reward.min).toBeGreaterThanOrEqual(charged.cost * 2);
    expect(mega.reward.max).toBeGreaterThanOrEqual(charged.cost * 3);
  });
});
