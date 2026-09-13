import { describe, expect, it } from 'vitest';

import { LITE_V2_BALANCE } from '../src/game/data/balance';
import { createPendingReveal } from '../src/game/systems/drops';
import {
  ONBOARDING_FIRST_BASIC_CACHE_CHIPS,
  ONBOARDING_INITIAL_CHIPS,
  ensureInitialOnboardingChips,
  getOnboardingBalanceForReveal,
  hasCommittedStandardLegendary,
  shouldRunPrimaryOnboarding,
  shouldShowChargedOnboardingPointer,
} from '../src/game/systems/onboarding';
import { OpeningSession } from '../src/game/systems/openingSession';
import { SaveRepository, createInitialSaveState } from '../src/game/systems/save';
import { DEFAULT_DROP_REGISTRY } from './defaultDropFixture';
import { MemoryStorageAdapter, SequenceRandom } from './helpers';

const firstRareState = () => ({
  ...createInitialSaveState(),
  chips: ONBOARDING_INITIAL_CHIPS,
});

describe('Signal 2000 onboarding policy', () => {
  it('grants the 10-CHIPS starting wallet once before any first reveal is staged', async () => {
    const storage = new MemoryStorageAdapter();
    const repository = new SaveRepository(storage);
    const initial = await repository.load();

    expect(initial.chips).toBe(0);
    const granted = await ensureInitialOnboardingChips(repository, initial);
    const repeated = await ensureInitialOnboardingChips(repository, granted);

    expect(granted.chips).toBe(ONBOARDING_INITIAL_CHIPS);
    expect(repeated.chips).toBe(ONBOARDING_INITIAL_CHIPS);
    expect((await repository.load()).chips).toBe(ONBOARDING_INITIAL_CHIPS);
  });

  it('does not top up an existing or already-staged save', async () => {
    const storage = new MemoryStorageAdapter();
    const repository = new SaveRepository(storage);
    const existing = { ...createInitialSaveState(), chips: 4, totalOpens: 1 };
    await repository.write(existing);

    expect((await ensureInitialOnboardingChips(repository, existing)).chips).toBe(4);
  });

  it('forces opening one to a NEW Rare with exactly +20 cache while preserving the normal base payout', () => {
    const pending = createPendingReveal({
      state: firstRareState(),
      registry: DEFAULT_DROP_REGISTRY,
      balance: LITE_V2_BALANCE,
      random: new SequenceRandom([0, 0, 0, 0, 0]),
      transactionId: 'first-basic',
      pouchType: 'basic',
    });

    expect(pending.openingNumber).toBe(1);
    expect(pending.standard.rarity).toBe('rare');
    expect(pending.standard.isNew).toBe(true);
    expect(pending.chips.before).toBe(10);
    expect(pending.chips.base).toBe(6);
    expect(pending.chips.cacheTier).toBe('cache');
    expect(pending.chips.cacheBonus).toBe(ONBOARDING_FIRST_BASIC_CACHE_CHIPS);
    expect(pending.chips.after).toBe(36);
  });

  it('recovers the exact authored first Basic transaction after reload instead of rerolling it', async () => {
    const storage = new MemoryStorageAdapter();
    const repository = new SaveRepository(storage);
    const initial = await ensureInitialOnboardingChips(repository, await repository.load());
    expect(initial.chips).toBe(10);

    const firstSession = new OpeningSession({
      repository,
      registry: DEFAULT_DROP_REGISTRY,
      balance: LITE_V2_BALANCE,
      random: new SequenceRandom([0, 0, 0, 0, 0]),
      createTransactionId: () => 'first-authored',
    });
    await firstSession.load();
    const staged = await firstSession.prepareReveal('basic');

    const recoveredSession = new OpeningSession({
      repository,
      registry: DEFAULT_DROP_REGISTRY,
      balance: LITE_V2_BALANCE,
      random: new SequenceRandom([0.999, 0.999, 0.999, 0.999]),
      createTransactionId: () => 'must-not-be-used',
    });
    const reloaded = await recoveredSession.load();
    const recovered = await recoveredSession.prepareReveal('basic');

    expect(shouldRunPrimaryOnboarding(reloaded)).toBe(true);
    expect(recovered).toEqual(staged);
    expect(recovered.id).toBe('first-authored');
    expect(recovered.standard.rarity).toBe('rare');
    expect(recovered.chips.cacheBonus).toBe(20);
  });

  it('forces the first Charged standard to NEW Legendary and then returns to ordinary Charged weights', () => {
    const beforeFirstCharged = {
      ...createInitialSaveState(),
      chips: 60,
      totalOpens: 1,
      discoveredStandard: ['camera-rare'],
    };
    const firstCharged = createPendingReveal({
      state: beforeFirstCharged,
      registry: DEFAULT_DROP_REGISTRY,
      balance: LITE_V2_BALANCE,
      random: new SequenceRandom([0, 0, 0, 0, 0]),
      transactionId: 'first-charged',
      pouchType: 'charged',
    });

    expect(firstCharged.standard.rarity).toBe('legendary');
    expect(firstCharged.standard.isNew).toBe(true);
    expect(firstCharged.chips.cost).toBe(60);
    expect(hasCommittedStandardLegendary({ discoveredStandard: firstCharged.commit.discoveredStandard }, DEFAULT_DROP_REGISTRY)).toBe(true);

    const postMilestone = {
      ...beforeFirstCharged,
      discoveredStandard: firstCharged.commit.discoveredStandard,
    };
    expect(getOnboardingBalanceForReveal(postMilestone, 'charged', DEFAULT_DROP_REGISTRY, LITE_V2_BALANCE)).toBe(LITE_V2_BALANCE);
  });

  it('lets the authored first Charged Legendary satisfy an already armed Signal lock', () => {
    const pending = createPendingReveal({
      state: {
        ...createInitialSaveState(),
        chips: 60,
        signal: 4,
        totalOpens: 1,
        discoveredStandard: ['camera-rare'],
      },
      registry: DEFAULT_DROP_REGISTRY,
      balance: LITE_V2_BALANCE,
      random: new SequenceRandom([0, 0, 0, 0, 0]),
      transactionId: 'first-charged-signal',
      pouchType: 'charged',
    });

    expect(pending.standard.rarity).toBe('legendary');
    expect(pending.standard.isNew).toBe(true);
    expect(pending.signal).toMatchObject({
      before: 4,
      after: 0,
      lockConsumed: true,
      lockRetained: false,
    });
  });

  it('shows the Charged pointer only while the milestone is affordable, uncommitted, and Basic is selected', () => {
    const eligible = {
      ...createInitialSaveState(),
      chips: 60,
      totalOpens: 3,
      discoveredStandard: ['camera-rare'],
    };

    expect(shouldShowChargedOnboardingPointer(eligible, 'basic', DEFAULT_DROP_REGISTRY, LITE_V2_BALANCE)).toBe(true);
    expect(shouldShowChargedOnboardingPointer(eligible, 'charged', DEFAULT_DROP_REGISTRY, LITE_V2_BALANCE)).toBe(false);
    expect(
      shouldShowChargedOnboardingPointer(
        { ...eligible, discoveredStandard: ['camera-legendary'] },
        'basic',
        DEFAULT_DROP_REGISTRY,
        LITE_V2_BALANCE,
      ),
    ).toBe(false);
  });
});
