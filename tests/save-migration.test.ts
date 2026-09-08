import { describe, expect, it } from 'vitest';

import { LITE_V2_BALANCE } from '../src/game/data/balance';
import { SLICE_REGISTRY } from '../src/game/data/collectibles';
import { createPendingReveal } from '../src/game/systems/drops';
import {
  DEFAULT_SAVE_KEY,
  SAVE_VERSION,
  SaveRepository,
  createInitialSaveState,
  parseSaveState,
  stagePendingReveal,
} from '../src/game/systems/save';
import { migrateLegacySignal } from '../src/game/systems/signal';
import { MemoryStorageAdapter, SequenceRandom } from './helpers';

const legacyState = (signal: number) => ({
  version: 1,
  discoveredStandard: ['camera-common'],
  discoveredSecrets: [],
  signal,
  totalOpens: 7,
  pendingReveal: null,
  muted: false,
  stats: {
    duplicates: 2,
    hiddenPockets: 0,
  },
});

const currentPendingState = () => {
  const base = {
    ...createInitialSaveState(),
    totalOpens: 3,
  };
  const pending = createPendingReveal({
    state: base,
    registry: SLICE_REGISTRY,
    balance: LITE_V2_BALANCE,
    random: new SequenceRandom([0, 0, 0, 0, 0.999]),
    transactionId: 'validation-pending',
  });
  return stagePendingReveal(base, pending);
};

describe('Lite V2 save migration', () => {
  it.each([
    [0, 0],
    [24, 0],
    [25, 1],
    [49, 1],
    [50, 2],
    [74, 2],
    [75, 3],
    [99, 3],
    [100, 4],
    [140, 4],
  ])('maps legacy Signal %i to %i segments exactly', (legacy, expected) => {
    expect(migrateLegacySignal(legacy)).toBe(expected);
    expect(parseSaveState(JSON.stringify(legacyState(legacy))).signal).toBe(expected);
  });

  it('adds deterministic CHIPS and active Drop fields without losing collection or stats', () => {
    const migrated = parseSaveState(JSON.stringify(legacyState(75)));

    expect(migrated).toMatchObject({
      version: SAVE_VERSION,
      discoveredStandard: ['camera-common'],
      discoveredSecrets: [],
      chips: 0,
      signal: 3,
      overchargeHundredths: 100,
      activeLootPoolId: 'y2k-essentials',
      totalOpens: 7,
      pendingReveal: null,
      stats: { duplicates: 2, hiddenPockets: 0 },
    });
  });

  it('persists the migrated v2 state during repository load so migration is idempotent', async () => {
    const storage = new MemoryStorageAdapter();
    await storage.setItem(DEFAULT_SAVE_KEY, JSON.stringify(legacyState(50)));
    const repository = new SaveRepository(storage);

    const first = await repository.load();
    const persistedRaw = await storage.getItem(DEFAULT_SAVE_KEY);
    const second = await repository.load();

    expect(first.version).toBe(SAVE_VERSION);
    expect(first.signal).toBe(2);
    expect(JSON.parse(persistedRaw!).version).toBe(SAVE_VERSION);
    expect(second).toEqual(first);
  });

  it('migrates an interrupted legacy reveal without rerolling it or inventing Lite cache rewards', () => {
    const raw = {
      version: 1,
      discoveredStandard: ['camera-common', 'camera-rare'],
      discoveredSecrets: [],
      signal: 100,
      totalOpens: 3,
      muted: false,
      stats: { duplicates: 1, hiddenPockets: 0 },
      pendingReveal: {
        id: 'legacy-pending',
        baseTotalOpens: 3,
        openingNumber: 4,
        standard: {
          collectibleId: 'camera-epic',
          familyId: 'camera',
          rarity: 'epic',
          isNew: true,
        },
        signal: {
          before: 100,
          after: 0,
          gain: 0,
          lockConsumed: true,
          lockReached: false,
        },
        hiddenPocket: null,
        commit: {
          discoveredStandard: ['camera-common', 'camera-rare', 'camera-epic'],
          discoveredSecrets: [],
          signal: 0,
          totalOpens: 4,
          stats: { duplicates: 1, hiddenPockets: 0 },
        },
      },
    };

    const migrated = parseSaveState(JSON.stringify(raw));
    const pending = migrated.pendingReveal!;

    expect(pending.id).toBe('legacy-pending');
    expect(pending.pouchType).toBe('basic');
    expect(pending.lootPoolId).toBe('y2k-essentials');
    expect(pending.standard.collectibleId).toBe('camera-epic');
    expect(pending.chips).toEqual({
      before: 0,
      cost: 0,
      base: 0,
      cacheTier: 'none',
      cacheBonus: 0,
      recycle: 0,
      rawEarned: 0,
      overchargeBonus: 0,
      secretBonus: 0,
      totalEarned: 0,
      after: 0,
    });
    expect(pending.overcharge).toEqual({
      beforeHundredths: 100,
      afterHundredths: 100,
      appliedGainHundredths: 0,
      bonusChips: 0,
    });
    expect(pending.signal).toMatchObject({
      before: 4,
      after: 0,
      lockArmedBefore: true,
      lockConsumed: true,
      lockRetained: false,
    });
    expect(pending.commit.discoveredStandard).toContain('camera-epic');
  });

  it('preserves a legacy armed-but-unconsumed lock as an armed Lite pending state', () => {
    const raw = {
      ...legacyState(100),
      pendingReveal: {
        id: 'legacy-retained',
        baseTotalOpens: 7,
        openingNumber: 8,
        standard: {
          collectibleId: 'camera-common',
          familyId: 'camera',
          rarity: 'common',
          isNew: false,
        },
        signal: {
          before: 100,
          after: 100,
          gain: 0,
          lockConsumed: false,
          lockReached: false,
        },
        hiddenPocket: null,
        commit: {
          discoveredStandard: ['camera-common'],
          discoveredSecrets: [],
          signal: 100,
          totalOpens: 8,
          stats: { duplicates: 3, hiddenPockets: 0 },
        },
      },
    };

    const migrated = parseSaveState(JSON.stringify(raw));
    expect(migrated.pendingReveal?.signal).toMatchObject({
      before: 4,
      after: 4,
      lockConsumed: false,
      lockRetained: true,
    });
  });

  it('migrates an interrupted V2 pending reveal into neutral Overcharge without changing its reward', () => {
    const current = currentPendingState();
    const pending = current.pendingReveal!;
    const v2 = {
      ...current,
      version: 2,
      overchargeHundredths: undefined,
      pendingReveal: {
        ...pending,
        chips: {
          before: pending.chips.before,
          cost: pending.chips.cost,
          base: pending.chips.base,
          cacheTier: pending.chips.cacheTier,
          cacheBonus: pending.chips.cacheBonus,
          recycle: pending.chips.recycle,
          totalEarned: pending.chips.rawEarned,
          after: pending.chips.before - pending.chips.cost + pending.chips.rawEarned,
        },
        overcharge: undefined,
        commit: {
          ...pending.commit,
          chips: pending.chips.before - pending.chips.cost + pending.chips.rawEarned,
          overchargeHundredths: undefined,
        },
      },
    };
    delete (v2 as Record<string, unknown>).overchargeHundredths;
    delete (v2.pendingReveal as Record<string, unknown>).overcharge;
    delete (v2.pendingReveal.commit as Record<string, unknown>).overchargeHundredths;

    const migrated = parseSaveState(JSON.stringify(v2));
    expect(migrated.version).toBe(SAVE_VERSION);
    expect(migrated.overchargeHundredths).toBe(100);
    expect(migrated.pendingReveal?.chips.overchargeBonus).toBe(0);
    expect(migrated.pendingReveal?.overcharge).toEqual({
      beforeHundredths: 100,
      afterHundredths: 100,
      appliedGainHundredths: 0,
      bonusChips: 0,
    });
  });

  it('rejects a current pending transaction whose commit no longer matches its base collection', () => {
    const state = currentPendingState();
    const corrupted = {
      ...state,
      pendingReveal: {
        ...state.pendingReveal!,
        commit: {
          ...state.pendingReveal!.commit,
          discoveredStandard: [],
        },
      },
    };

    expect(() => parseSaveState(JSON.stringify(corrupted))).toThrow('Pending reveal does not match its base save state');
  });

  it('rejects impossible Signal flags in a current pending transaction', () => {
    const state = currentPendingState();
    const corrupted = {
      ...state,
      pendingReveal: {
        ...state.pendingReveal!,
        signal: {
          ...state.pendingReveal!.signal,
          lockArmedBefore: true,
        },
      },
    };

    expect(() => parseSaveState(JSON.stringify(corrupted))).toThrow('Invalid save payload');
  });

  it('rejects a legacy pending transaction whose migrated base Signal disagrees with the outer save', () => {
    const raw = {
      ...legacyState(50),
      pendingReveal: {
        id: 'legacy-mismatch',
        baseTotalOpens: 7,
        openingNumber: 8,
        standard: {
          collectibleId: 'camera-common',
          familyId: 'camera',
          rarity: 'common',
          isNew: false,
        },
        signal: {
          before: 100,
          after: 100,
          gain: 0,
          lockConsumed: false,
          lockReached: false,
        },
        hiddenPocket: null,
        commit: {
          discoveredStandard: ['camera-common'],
          discoveredSecrets: [],
          signal: 100,
          totalOpens: 8,
          stats: { duplicates: 3, hiddenPockets: 0 },
        },
      },
    };

    expect(() => parseSaveState(JSON.stringify(raw))).toThrow('Pending reveal does not match its base save state');
  });
});
