import type { SDK } from 'ysdk';

import type { GameplayActivityCoordinator } from './activity';
import type { AnalyticsAdapter } from './analytics';

export interface InterstitialResult {
  status: 'closed' | 'error' | 'offline';
  wasShown: boolean;
  error?: string;
}

export interface RewardedRequest {
  rewardId: string;
  onReward: () => Promise<void> | void;
}

export interface RewardedResult {
  status: 'closed' | 'error';
  rewardEarned: boolean;
  error?: string;
}

export interface StickyBannerResult {
  isShowing: boolean;
  reason?: string;
}

export interface AdsAdapter {
  showInterstitial(): Promise<InterstitialResult>;
  showRewarded(request: RewardedRequest): Promise<RewardedResult>;
  setStickyBannerVisible(visible: boolean): Promise<StickyBannerResult>;
}

export interface AdsAdapterOptions {
  analytics?: AnalyticsAdapter;
  fullscreenTimeoutMs?: number;
}

export const AD_ALREADY_IN_PROGRESS = 'AD_ALREADY_IN_PROGRESS';
export const AD_CALLBACK_TIMEOUT = 'AD_CALLBACK_TIMEOUT';

const DEFAULT_FULLSCREEN_TIMEOUT_MS = 120_000;

const errorMessage = (error: unknown): string => (error instanceof Error ? error.message : String(error));

abstract class BaseAdsAdapter {
  protected fullscreenInFlight = false;
  protected readonly fullscreenTimeoutMs: number;

  protected constructor(
    protected readonly activity: GameplayActivityCoordinator,
    protected readonly options: AdsAdapterOptions = {},
  ) {
    this.fullscreenTimeoutMs = options.fullscreenTimeoutMs ?? DEFAULT_FULLSCREEN_TIMEOUT_MS;
  }

  protected beginFullscreen(): boolean {
    if (this.fullscreenInFlight) return false;
    this.fullscreenInFlight = true;
    this.activity.setBlocked('ad', true);
    return true;
  }

  protected releaseFullscreenActivity(): void {
    this.activity.setBlocked('ad', false);
  }

  protected finishFullscreen(): void {
    if (!this.fullscreenInFlight) return;
    this.fullscreenInFlight = false;
    this.releaseFullscreenActivity();
  }

  protected track(event: string, params?: Readonly<Record<string, boolean | number | string>>): void {
    this.options.analytics?.track(event, params);
  }
}

export class MockAdsAdapter extends BaseAdsAdapter implements AdsAdapter {
  public constructor(activity: GameplayActivityCoordinator, options: AdsAdapterOptions = {}) {
    super(activity, options);
  }

  public async showInterstitial(): Promise<InterstitialResult> {
    if (!this.beginFullscreen()) {
      return { status: 'error', wasShown: false, error: AD_ALREADY_IN_PROGRESS };
    }

    this.track('ad_interstitial_request', { platform: 'mock' });
    try {
      await new Promise((resolve) => globalThis.setTimeout(resolve, 250));
      this.track('ad_interstitial_close', { platform: 'mock', wasShown: true });
      return { status: 'closed', wasShown: true };
    } finally {
      this.finishFullscreen();
    }
  }

  public async showRewarded(request: RewardedRequest): Promise<RewardedResult> {
    if (!this.beginFullscreen()) {
      return { status: 'error', rewardEarned: false, error: AD_ALREADY_IN_PROGRESS };
    }

    this.track('ad_rewarded_request', { platform: 'mock', rewardId: request.rewardId });
    try {
      await new Promise((resolve) => globalThis.setTimeout(resolve, 300));
      await request.onReward();
      this.track('ad_rewarded_grant', { platform: 'mock', rewardId: request.rewardId });
      this.track('ad_rewarded_close', { platform: 'mock', rewardId: request.rewardId, rewardEarned: true });
      return { status: 'closed', rewardEarned: true };
    } catch (error: unknown) {
      const message = errorMessage(error);
      this.track('ad_rewarded_error', { platform: 'mock', rewardId: request.rewardId, error: message });
      return { status: 'error', rewardEarned: false, error: message };
    } finally {
      this.finishFullscreen();
    }
  }

  public async setStickyBannerVisible(visible: boolean): Promise<StickyBannerResult> {
    this.track('ad_sticky_change', { platform: 'mock', requestedVisible: visible, isShowing: visible });
    return { isShowing: visible };
  }
}

export class YandexAdsAdapter extends BaseAdsAdapter implements AdsAdapter {
  public constructor(
    private readonly sdk: SDK,
    activity: GameplayActivityCoordinator,
    options: AdsAdapterOptions = {},
  ) {
    super(activity, options);
  }

  public showInterstitial(): Promise<InterstitialResult> {
    if (!this.beginFullscreen()) {
      return Promise.resolve({ status: 'error', wasShown: false, error: AD_ALREADY_IN_PROGRESS });
    }

    this.track('ad_interstitial_request', { platform: 'yandex' });
    return new Promise((resolve) => {
      let settled = false;
      const watchdog = globalThis.setTimeout(
        () => settle({ status: 'error', wasShown: false, error: AD_CALLBACK_TIMEOUT }),
        this.fullscreenTimeoutMs,
      );
      const settle = (result: InterstitialResult): void => {
        if (settled) return;
        settled = true;
        globalThis.clearTimeout(watchdog);
        this.finishFullscreen();
        if (result.status === 'closed') {
          this.track('ad_interstitial_close', { platform: 'yandex', wasShown: result.wasShown });
        } else {
          this.track('ad_interstitial_error', {
            platform: 'yandex',
            status: result.status,
            error: result.error ?? result.status,
          });
        }
        resolve(result);
      };

      try {
        this.sdk.adv.showFullscreenAdv({
          callbacks: {
            onOpen: () => this.track('ad_interstitial_open', { platform: 'yandex' }),
            onClose: (wasShown) => settle({ status: 'closed', wasShown }),
            onError: (error) => settle({ status: 'error', wasShown: false, error: error.message }),
            onOffline: () => settle({ status: 'offline', wasShown: false }),
          },
        });
      } catch (error: unknown) {
        settle({ status: 'error', wasShown: false, error: errorMessage(error) });
      }
    });
  }

  public showRewarded(request: RewardedRequest): Promise<RewardedResult> {
    if (!this.beginFullscreen()) {
      return Promise.resolve({ status: 'error', rewardEarned: false, error: AD_ALREADY_IN_PROGRESS });
    }

    this.track('ad_rewarded_request', { platform: 'yandex', rewardId: request.rewardId });
    return new Promise((resolve) => {
      let settled = false;
      let rewardCallbackSeen = false;
      let rewardEarned = false;
      let rewardError: string | undefined;
      let rewardTask: Promise<void> = Promise.resolve();

      const watchdog = globalThis.setTimeout(
        () => settle('error', AD_CALLBACK_TIMEOUT),
        this.fullscreenTimeoutMs,
      );

      const grantOnce = (): void => {
        if (settled || rewardCallbackSeen) return;
        rewardCallbackSeen = true;
        rewardTask = Promise.resolve()
          .then(() => request.onReward())
          .then(() => {
            rewardEarned = true;
            this.track('ad_rewarded_grant', { platform: 'yandex', rewardId: request.rewardId });
          })
          .catch((error: unknown) => {
            rewardError = errorMessage(error);
            console.error(`[ads] failed to persist rewarded grant ${request.rewardId}`, error);
          });
      };

      const settle = (status: RewardedResult['status'], sdkError?: string): void => {
        if (settled) return;
        settled = true;
        globalThis.clearTimeout(watchdog);

        // The fullscreen surface is already gone once close/error/timeout settles.
        // Resume gameplay/audio immediately, but keep fullscreenInFlight reserved
        // until reward persistence finishes so a second rewarded write cannot race it.
        this.releaseFullscreenActivity();

        void rewardTask.finally(() => {
          this.fullscreenInFlight = false;
          const error = rewardError ?? sdkError;
          const result: RewardedResult = {
            status: error ? 'error' : status,
            rewardEarned,
            ...(error ? { error } : {}),
          };
          if (result.status === 'closed') {
            this.track('ad_rewarded_close', {
              platform: 'yandex',
              rewardId: request.rewardId,
              rewardEarned: result.rewardEarned,
            });
          } else {
            this.track('ad_rewarded_error', {
              platform: 'yandex',
              rewardId: request.rewardId,
              rewardEarned: result.rewardEarned,
              error: result.error ?? 'unknown',
            });
          }
          resolve(result);
        });
      };

      try {
        this.sdk.adv.showRewardedVideo({
          callbacks: {
            onOpen: () => this.track('ad_rewarded_open', { platform: 'yandex', rewardId: request.rewardId }),
            onRewarded: grantOnce,
            onClose: () => settle('closed'),
            onError: (error) => settle('error', error.message),
          },
        });
      } catch (error: unknown) {
        settle('error', errorMessage(error));
      }
    });
  }

  public async setStickyBannerVisible(visible: boolean): Promise<StickyBannerResult> {
    try {
      if (visible) {
        const result = await this.sdk.adv.showBannerAdv();
        const status = await this.sdk.adv.getBannerAdvStatus();
        const response = { isShowing: status.stickyAdvIsShowing, ...(result.reason ? { reason: result.reason } : {}) };
        this.track('ad_sticky_change', {
          platform: 'yandex',
          requestedVisible: true,
          isShowing: response.isShowing,
          ...(response.reason ? { reason: response.reason } : {}),
        });
        return response;
      }

      const result = await this.sdk.adv.hideBannerAdv();
      const response = { isShowing: result.stickyAdvIsShowing };
      this.track('ad_sticky_change', { platform: 'yandex', requestedVisible: false, isShowing: response.isShowing });
      return response;
    } catch (error: unknown) {
      const reason = errorMessage(error);
      this.track('ad_sticky_change', {
        platform: 'yandex',
        requestedVisible: visible,
        isShowing: false,
        reason,
      });
      return { isShowing: false, reason };
    }
  }
}
