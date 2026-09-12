import type { AdsAdapter } from './ads';
import type { AnalyticsAdapter, AnalyticsParams } from './analytics';

export interface ResultInterstitialPolicyConfig {
  initialGraceMs: number;
  minIntervalMs: number;
  minResultsBetweenRequests: number;
}

// Yandex controls the final interstitial impression frequency itself. These
// client-side gates are intentionally more conservative: they protect the first
// minutes of play and prevent us from requesting an ad on every collectible.
// The timer is eligibility-only; the ad is still requested synchronously from
// the player's result-collect action, never from a background timer.
export const DEFAULT_RESULT_INTERSTITIAL_POLICY: Readonly<ResultInterstitialPolicyConfig> = {
  initialGraceMs: 180_000,
  minIntervalMs: 180_000,
  minResultsBetweenRequests: 4,
};

export class ResultInterstitialPolicy {
  private nextEligibleAtMs: number | null = null;
  private resultsSinceRequest = 0;

  public constructor(
    private readonly now: () => number = () => performance.now(),
    private readonly config: Readonly<ResultInterstitialPolicyConfig> = DEFAULT_RESULT_INTERSTITIAL_POLICY,
  ) {}

  public markGameReady(): void {
    if (this.nextEligibleAtMs !== null) return;
    this.nextEligibleAtMs = this.now() + this.config.initialGraceMs;
  }

  public recordResultCollected(): boolean {
    this.resultsSinceRequest += 1;
    const now = this.now();
    if (this.nextEligibleAtMs === null) {
      // Defensive fallback for non-standard runtimes/tests. Production arms the
      // grace period from the platform_ready event (after Game Ready).
      this.nextEligibleAtMs = now + this.config.initialGraceMs;
    }

    if (this.resultsSinceRequest < this.config.minResultsBetweenRequests) {
      return false;
    }
    if (now < this.nextEligibleAtMs) {
      return false;
    }

    // Count the request, not only successful impressions. If Yandex throttles,
    // returns no-fill, or reports an error, do not hammer the SDK on every next
    // collectible; wait for the full local cooldown again.
    this.resultsSinceRequest = 0;
    this.nextEligibleAtMs = now + this.config.minIntervalMs;
    return true;
  }
}

const errorMessage = (error: unknown): string => (error instanceof Error ? error.message : String(error));

export class MonetizedAnalyticsAdapter implements AnalyticsAdapter {
  public constructor(
    private readonly base: AnalyticsAdapter,
    private readonly ads: AdsAdapter,
    private readonly interstitialPolicy = new ResultInterstitialPolicy(),
  ) {}

  public track(event: string, params?: AnalyticsParams): void {
    this.base.track(event, params);

    if (event === 'platform_ready') {
      this.interstitialPolicy.markGameReady();
      return;
    }
    if (event !== 'result_collected' || !this.interstitialPolicy.recordResultCollected()) {
      return;
    }

    // `result_collected` is emitted directly from the user's collect tap. Call
    // the SDK in the same turn so the trigger-to-ad delay stays inside Yandex's
    // 0.33 s moderation limit. The AdsAdapter synchronously blocks gameplay and
    // audio before invoking showFullscreenAdv().
    try {
      void this.ads.showInterstitial().catch((error: unknown) => {
        this.base.track('ad_interstitial_policy_error', { error: errorMessage(error) });
      });
    } catch (error: unknown) {
      this.base.track('ad_interstitial_policy_error', { error: errorMessage(error) });
    }
  }
}