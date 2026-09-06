import type { LiteBalanceConfig, PouchType } from '../data/balance';
import type { ContentRegistry, StandardRarity } from '../data/collectibles';
import {
  resolveLitePouchReward,
  type LiteChipsReward,
  type LiteHiddenPocketReward,
  type LiteSignalReward,
} from './pouches';
import type { RandomSource } from './random';
import type { ProgressSnapshot, SaveState } from './save';

export interface StandardRevealResult {
  collectibleId: string;
  familyId: string;
  rarity: StandardRarity;
  isNew: boolean;
}

export type HiddenPocketResult = LiteHiddenPocketReward;

export interface PendingReveal {
  id: string;
  baseTotalOpens: number;
  pouchType: PouchType;
  lootPoolId: string;
  openingNumber: number;
  standard: StandardRevealResult;
  chips: LiteChipsReward;
  signal: LiteSignalReward;
  hiddenPocket: HiddenPocketResult | null;
  commit: ProgressSnapshot;
}

export interface CreatePendingRevealInput {
  state: SaveState;
  registry: ContentRegistry;
  balance: LiteBalanceConfig;
  random: RandomSource;
  transactionId: string;
  pouchType?: PouchType;
}

export const createPendingReveal = (input: CreatePendingRevealInput): PendingReveal => {
  const { state, registry, balance, random, transactionId, pouchType = 'basic' } = input;
  if (state.pendingReveal) {
    throw new Error('Cannot roll a new reward while a reveal is pending');
  }
  if (!transactionId) {
    throw new Error('Reveal transaction id is required');
  }

  const resolved = resolveLitePouchReward({
    state: {
      chips: state.chips,
      signal: state.signal,
      totalOpens: state.totalOpens,
      activeLootPoolId: state.activeLootPoolId,
      discoveredStandard: state.discoveredStandard,
      discoveredSecrets: state.discoveredSecrets,
    },
    pouchType,
    registry,
    balance,
    random,
  });

  const discoveredStandard = resolved.standard.isNew
    ? [...state.discoveredStandard, resolved.standard.collectibleId]
    : [...state.discoveredStandard];
  const discoveredSecrets = resolved.hiddenPocket
    ? [...state.discoveredSecrets, resolved.hiddenPocket.collectibleId]
    : [...state.discoveredSecrets];

  const commit: ProgressSnapshot = {
    discoveredStandard,
    discoveredSecrets,
    chips: resolved.chips.after,
    signal: resolved.signal.after,
    activeLootPoolId: resolved.lootPoolId,
    totalOpens: resolved.openingNumber,
    stats: {
      duplicates: state.stats.duplicates + (resolved.standard.isNew ? 0 : 1),
      hiddenPockets: state.stats.hiddenPockets + (resolved.hiddenPocket ? 1 : 0),
    },
  };

  return {
    id: transactionId,
    baseTotalOpens: state.totalOpens,
    pouchType,
    lootPoolId: resolved.lootPoolId,
    openingNumber: resolved.openingNumber,
    standard: resolved.standard,
    chips: resolved.chips,
    signal: resolved.signal,
    hiddenPocket: resolved.hiddenPocket,
    commit,
  };
};
