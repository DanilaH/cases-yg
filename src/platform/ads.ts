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

export class MockAdsAdapter implements AdsAdapter {
  public constructor(private readonly activity: GameplayActivityCoordinator) {}

  public async showInterstitial(): Promise<InterstitialResult> {
    this.activity.setBlocked('ad', true);
    try {
      await new Promise((resolve) => window.setTimeout(resolve, 250));
      return { status: 'closed', wasShown: true };
    } finally {
      this.activity.setBlocked('ad', false);
    }
  }

  public async showRewarded(request: RewardedRequest): Promise<RewardedResult> {
    this.activity.setBlocked('ad', true);
    try {
      await new Promise((resolve) => window.setTimeout(resolve, 300));
      await request.onReward();
      return { status: 'closed', rewardEarned: true };
    } finally {
      this.activity.setBlocked('ad', false);
    }
  }

  public async setStickyBannerVisible(visible: boolean): Promise<StickyBannerResult> {
    return { isShowing: visible };
  }
}

export class YandexAdsAdapter implements AdsAdapter {
  public constructor(
    private readonly sdk: SDK,
    private readonly activity: GameplayActivityCoordinator,
  ) {}

  public showInterstitial(): Promise<InterstitialResult> {
    this.activity.setBlocked('ad', true);

    return new Promise((resolve) => {
      let settled = false;
      const settle = (result: InterstitialResult): void => {
        if (settled) return;
        settled = true;
        this.activity.setBlocked('ad', false);
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
    this.activity.setBlocked('ad', true);

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
          this.activity.setBlocked('ad', false);
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
}
