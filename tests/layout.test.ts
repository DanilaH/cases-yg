import { describe, expect, it } from 'vitest';

import { createLayoutMetrics } from '../src/game/systems/layout';

describe('createLayoutMetrics', () => {
  it('caps ultra-wide logical content to the Yandex 2:1 desktop limit', () => {
    const metrics = createLayoutMetrics(3440, 1440);

    expect(metrics.logicalHeight).toBe(720);
    expect(metrics.logicalWidth).toBe(1440);
    expect(metrics.logicalWidth / metrics.logicalHeight).toBeLessThanOrEqual(2);
  });

  it('keeps ordinary landscape viewports proportional', () => {
    const metrics = createLayoutMetrics(1920, 1080);

    expect(metrics.logicalWidth).toBe(1280);
    expect(metrics.offsetX).toBeCloseTo(0, 5);
  });
});
