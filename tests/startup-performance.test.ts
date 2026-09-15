import { describe, expect, it } from 'vitest';

import {
  getStartupPerformanceSnapshot,
  markStartupPhase,
  reportStartupPerformance,
} from '../src/app/startupPerformance';
import type { AnalyticsAdapter, AnalyticsParams } from '../src/platform/analytics';

class CaptureAnalytics implements AnalyticsAdapter {
  public readonly events: Array<{ event: string; params?: AnalyticsParams }> = [];

  public track(event: string, params?: AnalyticsParams): void {
    this.events.push({ event, params });
  }
}

describe('startup performance diagnostics', () => {
  it('records bounded phase durations and reports them once at semantic Game Ready', () => {
    markStartupPhase('platformBootstrapStart');
    markStartupPhase('platformBootstrapReady');
    markStartupPhase('bootSaveSettled');
    markStartupPhase('bootArtSettled');

    const analytics = new CaptureAnalytics();
    reportStartupPerformance(analytics, 'mock');
    reportStartupPerformance(analytics, 'mock');

    expect(analytics.events).toHaveLength(1);
    expect(analytics.events[0]?.event).toBe('startup_performance');
    expect(analytics.events[0]?.params?.platform).toBe('mock');

    const snapshot = getStartupPerformanceSnapshot();
    expect(snapshot.moduleToReadyMs).toBeTypeOf('number');
    expect(snapshot.moduleToReadyMs).toBeGreaterThanOrEqual(0);
    expect(snapshot.platformToSaveMs).toBeGreaterThanOrEqual(0);
    expect(snapshot.saveToArtMs).toBeGreaterThanOrEqual(0);
    expect(snapshot.artToReadyMs).toBeGreaterThanOrEqual(0);
  });
});
