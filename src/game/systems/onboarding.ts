import type { StorageAdapter } from '../../platform/storage';
import type { LiteBalanceConfig, PouchType } from '../data/balance';
import type { ContentRegistry } from '../data/collectibles';
import type { PendingReveal } from './drops';
import { SaveRepository, type SaveState } from './save';

export const ONBOARDING_INITIAL_CHIPS = 10;
export const ONBOARDING_FIRST_BASIC_CACHE_CHIPS = 20;

const ONBOARDING_HINTS_KEY = 'mystery-pocket-tech.onboarding-hints';

export interface OnboardingHintState {
  signalGainSeen: boolean;
  signalLockSeen: boolean;
}

const DEFAULT_HINT_STATE: OnboardingHintState = {
  signalGainSeen: false,
  signalLockSeen: false,
};

export const shouldRunPrimaryOnboarding = (
  state: Pick<SaveState, 'totalOpens' | 'pendingReveal'>,
): boolean => state.totalOpens === 0 && (state.pendingReveal === null || state.pendingReveal.openingNumber === 1);

/**
 * Grants the authored 10-CHIPS starting wallet exactly once for a truly untouched save.
 * Existing/migrated saves and already-staged first reveals are never topped up.
 */
export const ensureInitialOnboardingChips = async (
  repository: SaveRepository,
  state: SaveState,
): Promise<SaveState> => {
  if (state.totalOpens !== 0 || state.pendingReveal !== null || state.chips !== 0) return state;
  const next: SaveState = { ...state, chips: ONBOARDING_INITIAL_CHIPS };
  await repository.write(next);
  return next;
};

export const hasCommittedStandardLegendary = (
  state: Pick<SaveState, 'discoveredStandard'>,
  registry: ContentRegistry,
): boolean => {
  const owned = new Set(state.discoveredStandard);
  return registry.standardItems.some(({ rarity, collectible }) => rarity === 'legendary' && owned.has(collectible.id));
};

/**
 * Apply the two authored reward exceptions without changing the ordinary pouch tables.
 * The returned object is only used for this one transaction resolution.
 */
export const getOnboardingBalanceForReveal = (
  state: Pick<SaveState, 'totalOpens' | 'discoveredStandard'>,
  pouchType: PouchType,
  registry: ContentRegistry,
  balance: LiteBalanceConfig,
): LiteBalanceConfig => {
  if (state.totalOpens === 0 && pouchType === 'basic') {
    return {
      ...balance,
      pouchProfiles: {
        ...balance.pouchProfiles,
        basic: {
          ...balance.pouchProfiles.basic,
          rarityWeights: {
            common: 0,
            rare: 1,
            epic: 0,
            legendary: 0,
          },
          cacheTiers: [
            {
              id: 'cache',
              weight: 1,
              reward: {
                min: ONBOARDING_FIRST_BASIC_CACHE_CHIPS,
                max: ONBOARDING_FIRST_BASIC_CACHE_CHIPS,
              },
            },
          ],
        },
      },
    };
  }

  if (pouchType === 'charged' && !hasCommittedStandardLegendary(state, registry)) {
    return {
      ...balance,
      pouchProfiles: {
        ...balance.pouchProfiles,
        charged: {
          ...balance.pouchProfiles.charged,
          rarityWeights: {
            common: 0,
            rare: 0,
            epic: 0,
            legendary: 1,
          },
        },
      },
    };
  }

  return balance;
};

export const shouldShowChargedOnboardingPointer = (
  state: Pick<SaveState, 'chips' | 'discoveredStandard' | 'pendingReveal'>,
  selectedPouchType: PouchType,
  registry: ContentRegistry,
  balance: LiteBalanceConfig,
): boolean =>
  state.pendingReveal === null &&
  state.chips >= balance.pouchProfiles.charged.chipsCost &&
  !hasCommittedStandardLegendary(state, registry) &&
  selectedPouchType !== 'charged';

export const isFirstSignalGain = (
  state: Pick<SaveState, 'stats'>,
  pending: PendingReveal,
): boolean => state.stats.duplicates === 0 && pending.signal.gain > 0 && !pending.standard.isNew;

const parseHintState = (raw: string | null): OnboardingHintState => {
  if (raw === null) return { ...DEFAULT_HINT_STATE };
  try {
    const value: unknown = JSON.parse(raw);
    if (typeof value !== 'object' || value === null) return { ...DEFAULT_HINT_STATE };
    const record = value as Record<string, unknown>;
    return {
      signalGainSeen: record.signalGainSeen === true,
      signalLockSeen: record.signalLockSeen === true,
    };
  } catch {
    return { ...DEFAULT_HINT_STATE };
  }
};

export const loadOnboardingHintState = async (storage: StorageAdapter): Promise<OnboardingHintState> => {
  try {
    return parseHintState(await storage.getItem(ONBOARDING_HINTS_KEY));
  } catch {
    return { ...DEFAULT_HINT_STATE };
  }
};

export const saveOnboardingHintState = async (
  storage: StorageAdapter,
  state: OnboardingHintState,
): Promise<void> => {
  try {
    await storage.setItem(ONBOARDING_HINTS_KEY, JSON.stringify(state));
  } catch {
    // Cosmetic tutorial memory must never block gameplay.
  }
};
