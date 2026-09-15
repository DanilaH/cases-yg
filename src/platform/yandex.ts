import type { SDK } from 'ysdk';

import { GameplayActivityCoordinator } from './activity';
import { ConsoleAnalyticsAdapter, createYandexAnalyticsAdapter, type AnalyticsAdapter } from './analytics';
import { MockAdsAdapter, YandexAdsAdapter, type AdsAdapter } from './ads';
import { MonetizedAnalyticsAdapter } from './monetization';
import {
  WebStorageAdapter,
  YandexCloudSaveStorageAdapter,
  type StorageAdapter,
} from './storage';

export type AppLanguage = 'en' | 'ru';

export interface PlatformRuntime {
  kind: 'mock' | 'yandex';
  language: AppLanguage;
  storage: StorageAdapter;
  analytics: AnalyticsAdapter;
  ads: AdsAdapter;
  activity: GameplayActivityCoordinator;
  markReady(): void;
  destroy(): void;
}

const DEBUG_LANGUAGE_KEY = 'mystery-pocket-tech.debug-language';

const debugToolsEnabled = (): boolean =>
  import.meta.env.DEV || import.meta.env.VITE_DEBUG_PANEL === 'true';

const normalizeLanguage = (language: string | undefined): AppLanguage => (language === 'ru' ? 'ru' : 'en');

const readDebugLanguageOverride = (): AppLanguage | null => {
  if (!debugToolsEnabled()) return null;
  try {
    const value = window.sessionStorage.getItem(DEBUG_LANGUAGE_KEY);
    return value === 'ru' || value === 'en' ? value : null;
  } catch {
    return null;
  }
};

export const setDebugLanguageOverride = (language: AppLanguage): void => {
  if (!debugToolsEnabled()) return;
  try {
    window.sessionStorage.setItem(DEBUG_LANGUAGE_KEY, language);
  } catch {
    // Debug convenience only; storage restrictions must never affect the game.
  }
};

const resolveLanguage = (detectedLanguage: string | undefined): AppLanguage =>
  readDebugLanguageOverride() ?? normalizeLanguage(detectedLanguage);

const installVisibilityBridge = (activity: GameplayActivityCoordinator): (() => void) => {
  const handleVisibility = (): void => activity.setBlocked('visibility', document.hidden);
  document.addEventListener('visibilitychange', handleVisibility);
  handleVisibility();
  return () => document.removeEventListener('visibilitychange', handleVisibility);
};

const createMockPlatform = (): PlatformRuntime => {
  const activity = new GameplayActivityCoordinator(() => undefined, () => undefined);
  const baseAnalytics = new ConsoleAnalyticsAdapter();
  const ads = new MockAdsAdapter(activity, { analytics: baseAnalytics });
  const analytics = new MonetizedAnalyticsAdapter(baseAnalytics, ads);
  const removeVisibilityBridge = installVisibilityBridge(activity);
  let readySent = false;

  return {
    kind: 'mock',
    language: resolveLanguage(navigator.language.split('-')[0]),
    storage: new WebStorageAdapter(window.localStorage),
    analytics,
    ads,
    activity,
    markReady: () => {
      if (readySent) return;
      readySent = true;
      analytics.track('platform_ready', { platform: 'mock' });
    },
    destroy: removeVisibilityBridge,
  };
};

const loadYandexSdk = async (): Promise<void> => {
  if (typeof YaGames !== 'undefined') {
    return;
  }

  const sdkUrl = import.meta.env.VITE_YANDEX_SDK_URL || '/sdk.js';
  await new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = sdkUrl;
    script.async = true;
    script.addEventListener('load', () => resolve(), { once: true });
    script.addEventListener('error', () => reject(new Error(`Failed to load Yandex Games SDK: ${sdkUrl}`)), {
      once: true,
    });
    document.head.append(script);
  });
};

type YandexStorageSdk = Pick<SDK, 'getStorage' | 'getPlayer'>;

type PlayerResult =
  | { ok: true; player: Awaited<ReturnType<YandexStorageSdk['getPlayer']>> }
  | { ok: false; error: unknown };

/**
 * Resolve mandatory safeStorage and optional Player Data in parallel after SDK init.
 * Player rejection is captured immediately so it can never become an unhandled
 * rejection while safeStorage is still pending.
 */
export const createYandexStorageAdapter = async (sdk: YandexStorageSdk): Promise<StorageAdapter> => {
  const safeStoragePromise = sdk.getStorage();
  const playerResultPromise: Promise<PlayerResult> = sdk.getPlayer().then(
    (player) => ({ ok: true, player }),
    (error: unknown) => ({ ok: false, error }),
  );

  const safeStorage = await safeStoragePromise;
  const localStorage = new WebStorageAdapter(safeStorage);
  const playerResult = await playerResultPromise;

  if (!playerResult.ok) {
    // Player data is an enhancement over safeStorage. Never block game startup
    // if Yandex account/cloud data is temporarily unavailable.
    console.warn('[cloud-save] Yandex Player unavailable; continuing with safeStorage only', playerResult.error);
    return localStorage;
  }

  return new YandexCloudSaveStorageAdapter(localStorage, playerResult.player, {
    syncKey: 'mystery-pocket-tech.save',
    cloudField: 'mysteryPocketTechSave',
  });
};

const createYandexPlatform = async (): Promise<PlatformRuntime> => {
  await loadYandexSdk();
  const sdk: SDK = await YaGames.init();
  const baseAnalytics = createYandexAnalyticsAdapter();
  const activity = new GameplayActivityCoordinator(
    () => sdk.features.GameplayAPI?.start(),
    () => sdk.features.GameplayAPI?.stop(),
  );
  const ads = new YandexAdsAdapter(sdk, activity, { analytics: baseAnalytics });
  const analytics = new MonetizedAnalyticsAdapter(baseAnalytics, ads);

  const removeVisibilityBridge = installVisibilityBridge(activity);
  const handlePause = (): void => {
    analytics.track('platform_pause', { platform: 'yandex' });
    activity.setBlocked('platform', true);
  };
  const handleResume = (): void => {
    analytics.track('platform_resume', { platform: 'yandex' });
    activity.setBlocked('platform', false);
  };

  // Subscribe immediately after YaGames.init(). A startup ad/pause can happen
  // while storage/player initialization is still pending; the coordinator replays
  // that state when the Phaser runtime later subscribes to blocked changes.
  sdk.on('game_api_pause', handlePause);
  sdk.on('game_api_resume', handleResume);

  try {
    const storage = await createYandexStorageAdapter(sdk);
    let readySent = false;

    return {
      kind: 'yandex',
      language: resolveLanguage(sdk.environment.i18n.lang),
      storage,
      analytics,
      ads,
      activity,
      markReady: () => {
        if (readySent) return;
        readySent = true;
        sdk.features.LoadingAPI?.ready();
        analytics.track('platform_ready', { platform: 'yandex' });
      },
      destroy: () => {
        removeVisibilityBridge();
        sdk.off('game_api_pause', handlePause);
        sdk.off('game_api_resume', handleResume);
      },
    };
  } catch (error: unknown) {
    removeVisibilityBridge();
    sdk.off('game_api_pause', handlePause);
    sdk.off('game_api_resume', handleResume);
    throw error;
  }
};

const shouldUseMockPlatform = (): boolean =>
  import.meta.env.DEV || import.meta.env.VITE_PLATFORM_RUNTIME === 'mock';

export const bootstrapPlatform = async (): Promise<PlatformRuntime> =>
  shouldUseMockPlatform() ? createMockPlatform() : createYandexPlatform();
