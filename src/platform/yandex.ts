import type { SDK } from 'ysdk';

import { GameplayActivityCoordinator } from './activity';
import { ConsoleAnalyticsAdapter, createYandexAnalyticsAdapter, type AnalyticsAdapter } from './analytics';
import { MockAdsAdapter, YandexAdsAdapter, type AdsAdapter } from './ads';
import { WebStorageAdapter, type StorageAdapter } from './storage';

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

const normalizeLanguage = (language: string | undefined): AppLanguage => (language === 'ru' ? 'ru' : 'en');

const installVisibilityBridge = (activity: GameplayActivityCoordinator): (() => void) => {
  const handleVisibility = (): void => activity.setBlocked('visibility', document.hidden);
  document.addEventListener('visibilitychange', handleVisibility);
  handleVisibility();
  return () => document.removeEventListener('visibilitychange', handleVisibility);
};

const createMockPlatform = (): PlatformRuntime => {
  const activity = new GameplayActivityCoordinator(() => undefined, () => undefined);
  const analytics = new ConsoleAnalyticsAdapter();
  const removeVisibilityBridge = installVisibilityBridge(activity);

  return {
    kind: 'mock',
    language: normalizeLanguage(navigator.language.split('-')[0]),
    storage: new WebStorageAdapter(window.localStorage),
    analytics,
    ads: new MockAdsAdapter(activity, { analytics }),
    activity,
    markReady: () => analytics.track('platform_ready', { platform: 'mock' }),
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

const createYandexPlatform = async (): Promise<PlatformRuntime> => {
  await loadYandexSdk();
  const sdk: SDK = await YaGames.init();
  const analytics = createYandexAnalyticsAdapter();
  const activity = new GameplayActivityCoordinator(
    () => sdk.features.GameplayAPI?.start(),
    () => sdk.features.GameplayAPI?.stop(),
  );

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
  // while getStorage() is still pending; the coordinator replays that state when
  // the Phaser runtime later subscribes to blocked changes.
  sdk.on('game_api_pause', handlePause);
  sdk.on('game_api_resume', handleResume);

  try {
    const storage = await sdk.getStorage();
    let readySent = false;

    return {
      kind: 'yandex',
      language: normalizeLanguage(sdk.environment.i18n.lang),
      storage: new WebStorageAdapter(storage),
      analytics,
      ads: new YandexAdsAdapter(sdk, activity, { analytics }),
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

export const bootstrapPlatform = async (): Promise<PlatformRuntime> => {
  const params = new URLSearchParams(window.location.search);
  const forceMock = import.meta.env.DEV || params.get('platform') === 'mock';
  return forceMock ? createMockPlatform() : createYandexPlatform();
};
