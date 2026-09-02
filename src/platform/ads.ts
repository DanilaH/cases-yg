import type { SDK } from 'ysdk';

import type { GameplayActivityCoordinator } from './activity';

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

const AD_ALREADY_IN_PROGRESS = 'AD_ALREADY_IN_PROGRESS';

export class MockAdsAdapter implements AdsAdapter {
  private fullscreenInFlight = false;

  public constructor(private readonly activity: GameplayActivityCoordinator) {}

  public async showInterstitial(): Promise<InterstitialResult> {
    if (!this.beginFullscreen()) {
      return { status: 'error', wasShown: false, error: AD_ALREADY_IN_PROGRESS };
    }

    try {
      await new Promise((resolve) => window.setTimeout(resolve, 250));
      return { status: 'closed', wasShown: true };
    } finally {
      this.endFullscreen();
    }
  }

  public async showRewarded(request: RewardedRequest): Promise<RewardedResult> {
    if (!this.beginFullscreen()) {
      return { status: 'error', rewardEarned: false, error: AD_ALREADY_IN_PROGRESS };
    }

    try {
      await new Promise((resolve) => window.setTimeout(resolve, 300));
      await request.onReward();
      return { status: 'closed', rewardEarned: true };
    } finally {
      this.endFullscreen();
    }
  }

  public async setStickyBannerVisible(visible: boolean): Promise<StickyBannerResult> {
    return { isShowing: visible };
  }

  private beginFullscreen(): boolean {
    if (this.fullscreenInFlight) return false;
    this.fullscreenInFlight = true;
    this.activity.setBlocked('ad', true);
    return true;
  }

  private endFullscreen(): void {
    this.fullscreenInFlight = false;
    this.activity.setBlocked('ad', false);
  }
}

export class YandexAdsAdapter implements AdsAdapter {
  private fullscreenInFlight = false;

  public constructor(
    private readonly sdk: SDK,
    private readonly activity: GameplayActivityCoordinator,
  ) {}

  public showInterstitial(): Promise<InterstitialResult> {
    if (!this.beginFullscreen()) {
      return Promise.resolve({ status: 'error', wasShown: false, error: AD_ALREADY_IN_PROGRESS });
    }

    return new Promise((resolve) => {
      let settled = false;
      const settle = (result: InterstitialResult): void => {
        if (settled) return;
        settled = true;
        this.endFullscreen();
        resolve(result);
      };

      try {
        this.sdk.adv.showFullscreenAdv({
          callbacks: {
            onClose: (wasShown) => settle({ status: 'closed', wasShown }),
            onError: (error) => settle({ status: 'error', wasShown: false, error: error.message }),
            onOffline: () => settle({ status: 'offline', wasShown: false }),
          },
        });
      } catch (error) {
        settle({
          status: 'error',
          wasShown: false,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    });
  }

  public showRewarded(request: RewardedRequest): Promise<RewardedResult> {
    if (!this.beginFullscreen()) {
      return Promise.resolve({ status: 'error', rewardEarned: false, error: AD_ALREADY_IN_PROGRESS });
    }

    return new Promise((resolve) => {
      let settled = false;
      let rewardEarned = false;
      let rewardError: string | undefined;
      let rewardTask: Promise<void> = Promise.resolve();

      const grantOnce = (): void => {
        if (rewardEarned) return;
        rewardEarned = true;
        rewardTask = Promise.resolve()
          .then(() => request.onReward())
          .catch((error: unknown) => {
            rewardError = error instanceof Error ? error.message : String(error);
            console.error(`[ads] failed to persist rewarded grant ${request.rewardId}`, error);
          });
      };

      const settle = (result: RewardedResult): void => {
        if (settled) return;
        settled = true;
        void rewardTask.finally(() => {
          this.endFullscreen();
          resolve(rewardError ? { ...result, error: rewardError } : result);
        });
      };

      try {
        this.sdk.adv.showRewardedVideo({
          callbacks: {
            onRewarded: grantOnce,
            onClose: () => settle({ status: 'closed', rewardEarned }),
            onError: (error) => settle({ status: 'error', rewardEarned, error: error.message }),
          },
        });
      } catch (error) {
        settle({
          status: 'error',
          rewardEarned,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    });
  }

  public async setStickyBannerVisible(visible: boolean): Promise<StickyBannerResult> {
    try {
      if (visible) {
        const result = await this.sdk.adv.showBannerAdv();
        const status = await this.sdk.adv.getBannerAdvStatus();
        return { isShowing: status.stickyAdvIsShowing, ...(result.reason ? { reason: result.reason } : {}) };
      }

      const result = await this.sdk.adv.hideBannerAdv();
      return { isShowing: result.stickyAdvIsShowing };
    } catch (error) {
      return {
        isShowing: false,
        reason: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private beginFullscreen(): boolean {
    if (this.fullscreenInFlight) return false;
    this.fullscreenInFlight = true;
    this.activity.setBlocked('ad', true);
    return true;
  }

  private endFullscreen(): void {
    this.fullscreenInFlight = false;
    this.activity.setBlocked('ad', false);
  }
}
