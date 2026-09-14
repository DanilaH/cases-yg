import { describe, expect, it } from 'vitest';

import { createLayoutMetrics } from '../src/game/systems/layout';

const ZERO_INSETS = { left: 0, right: 0, top: 0, bottom: 0 };

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
    expect(metrics.compactChrome).toBe(false);
  });

  it('classifies a HiDPI short landscape phone by CSS height rather than backing-store height', () => {
    const metrics = createLayoutMetrics(1830, 824, ZERO_INSETS, 2);

    expect(metrics.cssViewportWidth).toBe(915);
    expect(metrics.cssViewportHeight).toBe(412);
    expect(metrics.compactChrome).toBe(true);
  });

  it('does not classify a high-DPI desktop as compact chrome', () => {
    const metrics = createLayoutMetrics(3840, 2160, ZERO_INSETS, 2);

    expect(metrics.cssViewportWidth).toBe(1920);
    expect(metrics.cssViewportHeight).toBe(1080);
    expect(metrics.compactChrome).toBe(false);
  });
});
