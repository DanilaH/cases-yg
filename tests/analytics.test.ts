import { afterEach, describe, expect, it, vi } from 'vitest';

import { MetricaAnalyticsAdapter } from '../src/platform/analytics';

describe('MetricaAnalyticsAdapter', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('forwards gameplay events and params to Yandex Metrica reachGoal', () => {
    const ym = vi.fn();
    const fallback = { track: vi.fn() };
    vi.stubGlobal('window', { ym });

    const adapter = new MetricaAnalyticsAdapter(123456, fallback);
    const params = { openingNumber: 7, pouchType: 'charged', isNew: true };

    adapter.track('opening_started', params);

    expect(fallback.track).toHaveBeenCalledWith('opening_started', params);
    expect(ym).toHaveBeenCalledWith(123456, 'reachGoal', 'opening_started', params);
  });

  it('keeps the fallback path working when Metrica is unavailable', () => {
    const fallback = { track: vi.fn() };
    vi.stubGlobal('window', {});

    const adapter = new MetricaAnalyticsAdapter(123456, fallback);
    adapter.track('result_collected', { openingNumber: 3 });

    expect(fallback.track).toHaveBeenCalledWith('result_collected', { openingNumber: 3 });
  });
});
