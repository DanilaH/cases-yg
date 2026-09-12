import { describe, expect, it, vi } from 'vitest';

import type { AdsAdapter } from '../src/platform/ads';
import type { AnalyticsAdapter } from '../src/platform/analytics';
import {
  MonetizedAnalyticsAdapter,
  ResultInterstitialPolicy,
  type ResultInterstitialPolicyConfig,
} from '../src/platform/monetization';

const TEST_POLICY: ResultInterstitialPolicyConfig = {
  initialGraceMs: 180_000,
  minIntervalMs: 180_000,
  minResultsBetweenRequests: 4,
};

describe('ResultInterstitialPolicy', () => {
  it('requires both the initial grace period and enough collected results', () => {
    let now = 0;
    const policy = new ResultInterstitialPolicy(() => now, TEST_POLICY);

    expect(policy.recordResultCollected()).toBe(false);
    expect(policy.recordResultCollected()).toBe(false);
    expect(policy.recordResultCollected()).toBe(false);
    expect(policy.recordResultCollected()).toBe(false);

    now = 179_999;
    expect(policy.recordResultCollected()).toBe(false);

    now = 180_000;
    expect(policy.recordResultCollected()).toBe(true);
  });

  it('waits for the full local cooldown and another result batch after a request', () => {
    let now = 180_000;
    const policy = new ResultInterstitialPolicy(() => now, {
      ...TEST_POLICY,
      initialGraceMs: 0,
    });

    expect(policy.recordResultCollected()).toBe(false);
    expect(policy.recordResultCollected()).toBe(false);
    expect(policy.recordResultCollected()).toBe(false);
    expect(policy.recordResultCollected()).toBe(true);

    now += 180_000;
    expect(policy.recordResultCollected()).toBe(false);
    expect(policy.recordResultCollected()).toBe(false);
    expect(policy.recordResultCollected()).toBe(false);
    expect(policy.recordResultCollected()).toBe(true);
  });

  it('does not request early just because many results were collected quickly', () => {
    let now = 0;
    const policy = new ResultInterstitialPolicy(() => now, TEST_POLICY);

    for (let index = 0; index < 12; index += 1) {
      expect(policy.recordResultCollected()).toBe(false);
    }

    now = 180_000;
    expect(policy.recordResultCollected()).toBe(true);
  });
});

describe('MonetizedAnalyticsAdapter', () => {
  it('requests an interstitial synchronously from the eligible result-collected event', () => {
    let now = 0;
    const base: AnalyticsAdapter = { track: vi.fn() };
    const showInterstitial = vi.fn(() => Promise.resolve({ status: 'closed' as const, wasShown: true }));
    const ads: AdsAdapter = {
      showInterstitial,
      showRewarded: vi.fn(),
      setStickyBannerVisible: vi.fn(),
    };
    const policy = new ResultInterstitialPolicy(() => now, {
      initialGraceMs: 0,
      minIntervalMs: 180_000,
      minResultsBetweenRequests: 2,
    });
    const analytics = new MonetizedAnalyticsAdapter(base, ads, policy);

    analytics.track('result_collected', { openingNumber: 1 });
    expect(showInterstitial).not.toHaveBeenCalled();

    analytics.track('result_collected', { openingNumber: 2 });
    expect(showInterstitial).toHaveBeenCalledTimes(1);

    analytics.track('collection_open');
    expect(showInterstitial).toHaveBeenCalledTimes(1);
    expect(base.track).toHaveBeenCalledTimes(3);
  });
});
