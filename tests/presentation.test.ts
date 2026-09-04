import { describe, expect, it } from 'vitest';

import {
  AMBIENT_PRESENTATION,
  COLLECTIBLE_PRESENTATION,
  getCarouselVisualState,
  getCollectiblePresentation,
  MOTION_PRESENTATION,
  POUCH_PRESENTATION,
  REVEAL_FX_PRESETS,
  REVEAL_MOTION_PRESENTATION,
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

  it('uses a compact production tear strip with independent pull-tab geometry', () => {
    expect(POUCH_PRESENTATION.strip.displayWidth).toBeLessThanOrEqual(POUCH_PRESENTATION.body.displayWidth * 0.9);
    expect(POUCH_PRESENTATION.tab.displayWidth).toBeLessThan(POUCH_PRESENTATION.strip.displayWidth);
    expect(POUCH_PRESENTATION.body.y).toBeGreaterThan(POUCH_PRESENTATION.strip.y);
    expect(POUCH_PRESENTATION.tabTravel).toBeGreaterThan(300);
    expect(POUCH_PRESENTATION.dragThreshold).toBeLessThan(POUCH_PRESENTATION.tabTravel);
    expect(MOTION_PRESENTATION.tearHintY).toBeGreaterThan(POUCH_PRESENTATION.groupY + POUCH_PRESENTATION.shadowY);
  });

  it('keeps the pouch visual center near the reward reveal center', () => {
    const pouchVisualCenterY = POUCH_PRESENTATION.groupY + POUCH_PRESENTATION.body.y;
    expect(Math.abs(pouchVisualCenterY - getCollectiblePresentation('camera').revealY)).toBeLessThan(50);
    expect(Math.abs(pouchVisualCenterY - getCollectiblePresentation('flip-phone').revealY)).toBeLessThan(50);
  });

  it('keeps idle vertical rhythm away from both the title and bottom edge', () => {
    expect(POUCH_PRESENTATION.groupY).toBeGreaterThanOrEqual(260);
    expect(MOTION_PRESENTATION.tearHintY - (POUCH_PRESENTATION.groupY + POUCH_PRESENTATION.shadowY)).toBeGreaterThan(60);
    expect(MOTION_PRESENTATION.tearHintY).toBeLessThanOrEqual(640);
    expect(RESULT_PRESENTATION.panelY).toBeGreaterThan(560);
  });

  it('keeps reveal emergence on one stable z-order path', () => {
    expect(REVEAL_MOTION_PRESENTATION.emergeOffsetY).toBeGreaterThan(100);
    expect(REVEAL_MOTION_PRESENTATION.pouchExitOffsetY).toBeGreaterThan(80);
    expect(REVEAL_MOTION_PRESENTATION.pouchExitScale).toBeLessThan(1);
    expect(REVEAL_MOTION_PRESENTATION.pouchExitDelay).toBeLessThan(150);
    expect(REVEAL_MOTION_PRESENTATION.pouchExitDuration).toBeGreaterThanOrEqual(280);
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
    expect(REVEAL_FX_PRESETS.epic.backdropAlpha).toBeGreaterThan(REVEAL_FX_PRESETS.rare.backdropAlpha);
    expect(REVEAL_FX_PRESETS.secret.sparkleScale).toBeGreaterThan(REVEAL_FX_PRESETS.legendary.sparkleScale);
    expect(REVEAL_FX_PRESETS.epic.backdropAlpha).toBeGreaterThanOrEqual(0.28);
    expect(REVEAL_FX_PRESETS.legendary.flashAlpha).toBeGreaterThanOrEqual(0.7);
    expect(REVEAL_FX_PRESETS.secret.particleDuration).toBeGreaterThanOrEqual(800);
  });

  it('keeps ambient and idle motion subtle and bounded', () => {
    expect(AMBIENT_PRESENTATION.count).toBeLessThanOrEqual(20);
    expect(AMBIENT_PRESENTATION.maxAlpha).toBeLessThanOrEqual(0.2);
    expect(MOTION_PRESENTATION.starPulseScale).toBeGreaterThanOrEqual(1.06);
    expect(MOTION_PRESENTATION.starPulseScale).toBeLessThanOrEqual(1.08);
    expect(MOTION_PRESENTATION.resultPulseScale).toBeGreaterThanOrEqual(1.035);
    expect(MOTION_PRESENTATION.resultPulseScale).toBeLessThan(1.05);
    expect(MOTION_PRESENTATION.resultPulseDuration).toBeLessThan(250);
    expect(MOTION_PRESENTATION.resultPulseRepeatDelay).toBeGreaterThan(400);
    expect(MOTION_PRESENTATION.rewardBreathScale).toBeLessThan(1.05);
  });
});
