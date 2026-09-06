import type { LiteBalanceConfig, PouchType } from '../data/balance';
import type { ContentRegistry, LootPoolId } from '../data/collectibles';
import type { PendingReveal } from './drops';

export interface OpeningEconomyState {
  chips: number;
  signal: number;
  activeLootPoolId: LootPoolId;
  discoveredStandard: readonly string[];
}

export const getChargedCost = (balance: LiteBalanceConfig): number =>
  balance.pouchProfiles.charged.chipsCost;

export const canAffordPouch = (
  state: Pick<OpeningEconomyState, 'chips'>,
  pouchType: PouchType,
  balance: LiteBalanceConfig,
): boolean => state.chips >= balance.pouchProfiles[pouchType].chipsCost;

export const hasEligibleUndiscoveredStandard = (
  state: Pick<OpeningEconomyState, 'activeLootPoolId' | 'discoveredStandard'>,
  pouchType: PouchType,
  registry: ContentRegistry,
  balance: LiteBalanceConfig,
): boolean => {
  const discovered = new Set(state.discoveredStandard);
  const profile = balance.pouchProfiles[pouchType];
  return registry.standardItems.some(
    ({ lootPoolId, rarity, collectible }) =>
      lootPoolId === state.activeLootPoolId &&
      profile.rarityWeights[rarity] > 0 &&
      !discovered.has(collectible.id),
  );
};

export const isSignalWaitingForCharged = (
  state: OpeningEconomyState,
  registry: ContentRegistry,
  balance: LiteBalanceConfig,
): boolean =>
  state.signal >= balance.signalThreshold &&
  !hasEligibleUndiscoveredStandard(state, 'basic', registry, balance) &&
  hasEligibleUndiscoveredStandard(state, 'charged', registry, balance);

export const getPreludeChipsAfter = (pending: PendingReveal): number =>
  pending.chips.before - pending.chips.cost + pending.chips.base + pending.chips.cacheBonus;

export const crossedChargedReadyThreshold = (
  pending: PendingReveal,
  balance: LiteBalanceConfig,
): boolean => {
  const cost = getChargedCost(balance);
  return pending.pouchType === 'basic' && pending.chips.before < cost && pending.chips.after >= cost;
};
