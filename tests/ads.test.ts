import type { SDK } from 'ysdk';
import { describe, expect, it, vi } from 'vitest';

import { GameplayActivityCoordinator } from '../src/platform/activity';
import { AD_CALLBACK_TIMEOUT, YandexAdsAdapter, type AdsAdapterOptions } from '../src/platform/ads';

interface RewardedCallbacks {
  onOpen?: () => void;
  onRewarded?: () => void;
  onClose?: (wasShown?: boolean) => void;
  onError?: (error: Error) => void;
}

interface InterstitialCallbacks {
  onOpen?: () => void;
  onClose?: (wasShown: boolean) => void;
  onError?: (error: Error) => void;
  onOffline?: () => void;
}

const createActivity = () => {
  const gameplayStart = vi.fn();
  const gameplayStop = vi.fn();
  const activity = new GameplayActivityCoordinator(gameplayStart, gameplayStop);
  const blocked: boolean[] = [];
  activity.onBlockedChange((value) => blocked.push(value));
  return { activity, blocked };
};

const createSdk = (handlers: {
  rewarded?: (callbacks: RewardedCallbacks) => void;
  interstitial?: (callbacks: InterstitialCallbacks) => void;
}): SDK =>
  ({
    adv: {
      showRewardedVideo: ({ callbacks }: { callbacks: RewardedCallbacks }) => handlers.rewarded?.(callbacks),
      showFullscreenAdv: ({ callbacks }: { callbacks: InterstitialCallbacks }) => handlers.interstitial?.(callbacks),
      showBannerAdv: async () => ({ stickyAdvIsShowing: true }),
      hideBannerAdv: async () => ({ stickyAdvIsShowing: false }),
      getBannerAdvStatus: async () => ({ stickyAdvIsShowing: true }),
    },
  }) as unknown as SDK;

const options: AdsAdapterOptions = {
  fullscreenTimeoutMs: 30,
};

describe('YandexAdsAdapter', () => {
  it('grants a rewarded callback exactly once even if the SDK repeats onRewarded', async () => {
    const { activity, blocked } = createActivity();
    const sdk = createSdk({
      rewarded: (callbacks) => {
        callbacks.onOpen?.();
        callbacks.onRewarded?.();
        callbacks.onRewarded?.();
        callbacks.onClose?.(true);
      },
    });
    const adapter = new YandexAdsAdapter(sdk, activity, options);
    const onReward = vi.fn(async () => undefined);

    const result = await adapter.showRewarded({ rewardId: 'reward-1', onReward });

    expect(onReward).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ status: 'closed', rewardEarned: true });
    expect(blocked).toEqual([true, false]);
  });

  it('ignores a late reward callback after the ad already closed', async () => {
    const { activity, blocked } = createActivity();
    const sdk = createSdk({
      rewarded: (callbacks) => {
        callbacks.onClose?.(true);
        callbacks.onRewarded?.();
      },
    });
    const adapter = new YandexAdsAdapter(sdk, activity, options);
    const onReward = vi.fn(async () => undefined);

    const result = await adapter.showRewarded({ rewardId: 'late-reward', onReward });

    expect(onReward).not.toHaveBeenCalled();
    expect(result).toEqual({ status: 'closed', rewardEarned: false });
    expect(blocked).toEqual([true, false]);
  });

  it('returns an error and unblocks gameplay when reward persistence fails', async () => {
    const { activity, blocked } = createActivity();
    const sdk = createSdk({
      rewarded: (callbacks) => {
        callbacks.onRewarded?.();
        callbacks.onClose?.(true);
      },
    });
    const adapter = new YandexAdsAdapter(sdk, activity, options);

    const result = await adapter.showRewarded({
      rewardId: 'failed-save',
      onReward: async () => {
        throw new Error('storage failed');
      },
    });

    expect(result).toEqual({ status: 'error', rewardEarned: false, error: 'storage failed' });
    expect(blocked).toEqual([true, false]);
  });

  it('releases gameplay/audio as soon as the ad closes while reward persistence finishes safely', async () => {
    const { activity, blocked } = createActivity();
    let resolveReward: (() => void) | undefined;
    const rewardGate = new Promise<void>((resolve) => {
      resolveReward = resolve;
    });
    const sdk = createSdk({
      rewarded: (callbacks) => {
        callbacks.onRewarded?.();
        callbacks.onClose?.(true);
      },
    });
    const adapter = new YandexAdsAdapter(sdk, activity, options);

    const resultPromise = adapter.showRewarded({
      rewardId: 'slow-save',
      onReward: () => rewardGate,
    });

    expect(blocked).toEqual([true, false]);
    resolveReward?.();
    const result = await resultPromise;

    expect(result).toEqual({ status: 'closed', rewardEarned: true });
  });

  it('times out a missing SDK callback instead of deadlocking the game', async () => {
    const { activity, blocked } = createActivity();
    const sdk = createSdk({ rewarded: () => undefined });
    const adapter = new YandexAdsAdapter(sdk, activity, { ...options, fullscreenTimeoutMs: 10 });

    const result = await adapter.showRewarded({ rewardId: 'no-callback', onReward: vi.fn() });

    expect(result).toEqual({ status: 'error', rewardEarned: false, error: AD_CALLBACK_TIMEOUT });
    expect(blocked).toEqual([true, false]);
  });

  it('unblocks an interstitial after an SDK error', async () => {
    const { activity, blocked } = createActivity();
    const sdk = createSdk({
      interstitial: (callbacks) => callbacks.onError?.(new Error('ad failed')),
    });
    const adapter = new YandexAdsAdapter(sdk, activity, options);

    const result = await adapter.showInterstitial();

    expect(result).toEqual({ status: 'error', wasShown: false, error: 'ad failed' });
    expect(blocked).toEqual([true, false]);
  });
});
