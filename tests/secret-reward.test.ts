import { describe, expect, it } from 'vitest';

import { LITE_V2_BALANCE } from '../src/game/data/balance';
import { SLICE_REGISTRY } from '../src/game/data/collectibles';
import { createPendingReveal } from '../src/game/systems/drops';
import { resolveLitePouchReward, type LiteRewardState } from '../src/game/systems/pouches';
import { SAVE_VERSION, createInitialSaveState, parseSaveState, stagePendingReveal } from '../src/game/systems/save';
import { SequenceRandom } from './helpers';

const allStandardIds = SLICE_REGISTRY.standardItems.map(({ collectible }) => collectible.id);
const allSecretIds = SLICE_REGISTRY.secrets.map(({ collectible }) => collectible.id);

const makeState = (overrides: Partial<LiteRewardState> = {}): LiteRewardState => ({
  chips: 0,
  signal: 0,
  overchargeHundredths: 100,
  totalOpens: 3,
  activeLootPoolId: 'y2k-essentials',
  discoveredStandard: [],
  discoveredSecrets: [],
  ...overrides,
});

const hiddenRandom = () => new SequenceRandom([0, 0, 0, 0, 0, 0]);

describe('Secret reward correction economy', () => {
  it('guarantees an undiscovered Secret on a successful Hidden Pocket and pays +40 CHIPS', () => {
    const result = resolveLitePouchReward({
      state: makeState(),
      pouchType: 'basic',
      registry: SLICE_REGISTRY,
      balance: LITE_V2_BALANCE,
      random: hiddenRandom(),
    });

    expect(result.hiddenPocket).toMatchObject({ isNew: true });
    expect(result.chips.secretBonus).toBe(40);
    expect(result.chips.totalEarned).toBe(result.chips.rawEarned + result.chips.overchargeBonus + 40);
  });

  it('keeps Hidden Pocket alive after Secret completion and returns a duplicate +40 reward', () => {
    const result = resolveLitePouchReward({
      state: makeState({ discoveredSecrets: allSecretIds }),
      pouchType: 'basic',
      registry: SLICE_REGISTRY,
      balance: LITE_V2_BALANCE,
      random: hiddenRandom(),
    });

    expect(result.hiddenPocket).toMatchObject({ isNew: false });
    expect(allSecretIds).toContain(result.hiddenPocket?.collectibleId);
    expect(result.chips.secretBonus).toBe(40);
  });

  it('does not multiply the Secret jackpot with Overcharge', () => {
    const result = resolveLitePouchReward({
      state: makeState({
        signal: 4,
        overchargeHundredths: 150,
        discoveredStandard: allStandardIds,
        discoveredSecrets: allSecretIds,
      }),
      pouchType: 'basic',
      registry: SLICE_REGISTRY,
      balance: LITE_V2_BALANCE,
      random: hiddenRandom(),
    });

    expect(result.chips.rawEarned).toBe(8);
    expect(result.chips.overchargeBonus).toBe(4);
    expect(result.chips.secretBonus).toBe(40);
    expect(result.chips.totalEarned).toBe(52);
  });

  it('does not duplicate collection IDs when the Secret reward is a duplicate', () => {
    const base = {
      ...createInitialSaveState(),
      totalOpens: 3,
      discoveredSecrets: allSecretIds,
    };
    const pending = createPendingReveal({
      state: base,
      registry: SLICE_REGISTRY,
      balance: LITE_V2_BALANCE,
      random: hiddenRandom(),
      transactionId: 'secret-duplicate',
    });

    expect(pending.hiddenPocket?.isNew).toBe(false);
    expect(pending.commit.discoveredSecrets).toEqual(allSecretIds);
    expect(pending.commit.stats.hiddenPockets).toBe(base.stats.hiddenPockets + 1);
  });

  it('migrates a staged V3 Hidden Pocket without retroactively granting the new bonus', () => {
    const base = { ...createInitialSaveState(), totalOpens: 3 };
    const pending = createPendingReveal({
      state: base,
      registry: SLICE_REGISTRY,
      balance: LITE_V2_BALANCE,
      random: hiddenRandom(),
      transactionId: 'v3-hidden-pocket',
    });
    const staged = stagePendingReveal(base, pending);
    const oldTotal = pending.chips.totalEarned - pending.chips.secretBonus;
    const oldAfter = pending.chips.before - pending.chips.cost + oldTotal;
    const v3 = {
      ...staged,
      version: 3,
      pendingReveal: {
        ...pending,
        chips: { ...pending.chips, totalEarned: oldTotal, after: oldAfter },
        hiddenPocket: pending.hiddenPocket
          ? { collectibleId: pending.hiddenPocket.collectibleId, familyId: pending.hiddenPocket.familyId }
          : null,
        commit: { ...pending.commit, chips: oldAfter },
      },
    } as Record<string, any>;
    delete v3.pendingReveal.chips.secretBonus;

    const migrated = parseSaveState(JSON.stringify(v3));

    expect(migrated.version).toBe(SAVE_VERSION);
    expect(migrated.pendingReveal?.chips.secretBonus).toBe(0);
    expect(migrated.pendingReveal?.chips.totalEarned).toBe(oldTotal);
    expect(migrated.pendingReveal?.chips.after).toBe(oldAfter);
    expect(migrated.pendingReveal?.hiddenPocket?.isNew).toBe(true);
  });
});
