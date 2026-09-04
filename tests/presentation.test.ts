import { describe, expect, it } from 'vitest';

import {
  COLLECTIBLE_PRESENTATION,
  getCarouselVisualState,
  getCollectiblePresentation,
  POUCH_PRESENTATION,
  REVEAL_FX_PRESETS,
  RESULT_PRESENTATION,
  resolveCarouselIndex,
} from '../src/game/data/presentation';

describe('reveal presentation', () => {
  it('defines explicit presentation for every production family in the slice', () => {
    expect(COLLECTIBLE_PRESENTATION.camera).toBeDefined();
    expect(COLLECTIBLE_PRESENTATION['flip-phone']).toBeDefined();
    expect(getCollectiblePresentation('camera').revealScale).toBeGreaterThan(1);
    expect(getCollectiblePresentation('flip-phone').revealScale).toBeGreaterThan(1);
  });

  it('does not retain the old over-corrected phone pivot', () => {
    expect(getCollectiblePresentation('flip-phone').artOffsetX).not.toBe(-24);
    expect(Math.abs(getCollectiblePresentation('flip-phone').artOffsetX)).toBeLessThan(12);
  });

  it('uses independent measured pouch layer transforms', () => {
    expect(POUCH_PRESENTATION.body.displayWidth).not.toBe(POUCH_PRESENTATION.strip.displayWidth);
    expect(POUCH_PRESENTATION.body.y).toBeGreaterThan(POUCH_PRESENTATION.strip.y);
    expect(POUCH_PRESENTATION.tabTravel).toBeGreaterThan(260);
  });

  it('keeps a sub-threshold carousel drag on the current page', () => {
    expect(resolveCarouselIndex(1, 2, RESULT_PRESENTATION.swipeThreshold - 1)).toBe(1);
    expect(resolveCarouselIndex(1, 2, -(RESULT_PRESENTATION.swipeThreshold - 1))).toBe(1);
  });

  it('moves exactly one page when the swipe threshold is crossed and clamps at the ends', () => {
    expect(resolveCarouselIndex(0, 2, -RESULT_PRESENTATION.swipeThreshold)).toBe(1);
    expect(resolveCarouselIndex(1, 2, RESULT_PRESENTATION.swipeThreshold)).toBe(0);
    expect(resolveCarouselIndex(0, 2, RESULT_PRESENTATION.swipeThreshold)).toBe(0);
    expect(resolveCarouselIndex(1, 2, -RESULT_PRESENTATION.swipeThreshold)).toBe(1);
  });

  it('interpolates scale and alpha continuously between active and side states', () => {
    const spacing = 300;
    const sideScale = 0.72;
    const active = getCarouselVisualState(0, 0, 0, spacing, sideScale);
    const midpoint = getCarouselVisualState(0, 0, spacing / 2, spacing, sideScale);
    const side = getCarouselVisualState(0, 0, spacing, spacing, sideScale);

    expect(active.scaleMultiplier).toBe(1);
    expect(active.alpha).toBe(1);
    expect(midpoint.scaleMultiplier).toBeLessThan(1);
    expect(midpoint.scaleMultiplier).toBeGreaterThan(sideScale);
    expect(midpoint.alpha).toBeLessThan(1);
    expect(midpoint.alpha).toBeGreaterThan(RESULT_PRESENTATION.sideAlpha);
    expect(side.scaleMultiplier).toBeCloseTo(sideScale);
    expect(side.alpha).toBeCloseTo(RESULT_PRESENTATION.sideAlpha);
  });

  it('increases FX intensity across the rarity ladder', () => {
    expect(REVEAL_FX_PRESETS.epic.particleCount).toBeGreaterThan(REVEAL_FX_PRESETS.common.particleCount);
    expect(REVEAL_FX_PRESETS.legendary.particleDistance).toBeGreaterThan(REVEAL_FX_PRESETS.epic.particleDistance);
    expect(REVEAL_FX_PRESETS.secret.particleCount).toBeGreaterThan(REVEAL_FX_PRESETS.legendary.particleCount);
    expect(REVEAL_FX_PRESETS.secret.glowAlpha).toBeGreaterThan(REVEAL_FX_PRESETS.legendary.glowAlpha);
  });
});
