import { describe, expect, it } from 'vitest';

import { createLayoutMetrics } from '../src/game/systems/layout';
import {
  getDropSelectorWidth,
  getOpeningChromeSizing,
  getPouchSelectorGeometry,
} from '../src/game/systems/openingChromeLayout';

const ZERO_INSETS = { left: 0, right: 0, top: 0, bottom: 0 };

describe('opening chrome geometry', () => {
  it('keeps compact pouch cards and odds panel on one shared geometry source', () => {
    const metrics = createLayoutMetrics(1830, 824, ZERO_INSETS, 2);
    const geometry = getPouchSelectorGeometry(metrics);

    expect(metrics.compactChrome).toBe(true);
    expect(geometry.basic.width).toBe(286);
    expect(geometry.basic.height).toBe(70);
    expect(geometry.charged.x).toBe(geometry.basic.x);
    expect(geometry.charged.y).toBe(geometry.basic.y + geometry.basic.height + geometry.chrome.railGap);
    expect(geometry.odds.y).toBe(geometry.charged.y + geometry.charged.height + geometry.chrome.oddsTopGap);
    expect(geometry.odds.height).toBe(164);
  });

  it('gives compact Drop navigation enough horizontal room for external arrows', () => {
    const metrics = createLayoutMetrics(1830, 824, ZERO_INSETS, 2);
    const chrome = getOpeningChromeSizing(true);
    const width = getDropSelectorWidth(metrics);

    expect(width).toBeGreaterThanOrEqual(440);
    expect(width).toBeLessThanOrEqual(540);
    expect(chrome.dropSelectorArrowGap).toBeGreaterThan(0);
    expect(chrome.dropSelectorHeight).toBe(112);
  });

  it('preserves the existing desktop chrome dimensions', () => {
    const desktop = getOpeningChromeSizing(false);

    expect(desktop.chipsHudWidth).toBe(216);
    expect(desktop.railCardWidth).toBe(216);
    expect(desktop.railCardHeight).toBe(58);
    expect(desktop.dropSelectorHeight).toBe(84);
  });
});
