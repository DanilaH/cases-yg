import { describe, expect, it } from 'vitest';

import {
  AMBIENT_PRESENTATION,
  COLLECTION_MILESTONE_PRESENTATION,
  COLLECTIBLE_PRESENTATION,
  getCarouselVisualState,
  getCollectiblePresentation,
  getRewardTrayHeight,
  getStandardResultPresence,
  MOTION_PRESENTATION,
  OPENING_FEEL_PRESENTATION,
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
    expect(POUCH_PRESENTATION.body.y).toBeGreaterThanOrEqual(96);
    expect(POUCH_PRESENTATION.body.y).toBeGreaterThan(POUCH_PRESENTATION.strip.y);
    expect(POUCH_PRESENTATION.tabTravel).toBeGreaterThan(300);
    expect(POUCH_PRESENTATION.dragThreshold).toBeLessThan(POUCH_PRESENTATION.tabTravel);
  });

  it('keeps the pouch visual center near the reward reveal center', () => {
    const pouchVisualCenterY = POUCH_PRESENTATION.groupY + POUCH_PRESENTATION.body.y;
    expect(Math.abs(pouchVisualCenterY - getCollectiblePresentation('camera').revealY)).toBeLessThan(50);
    expect(Math.abs(pouchVisualCenterY - getCollectiblePresentation('flip-phone').revealY)).toBeLessThan(50);
  });

  it('keeps the bottom action lane and result panel inside safe visual bounds', () => {
    expect(POUCH_PRESENTATION.groupY).toBeGreaterThanOrEqual(260);
    expect(OPENING_FEEL_PRESENTATION.bottomActionInset).toBeGreaterThanOrEqual(20);
    expect(OPENING_FEEL_PRESENTATION.bottomActionInset).toBeLessThanOrEqual(32);
    expect(RESULT_PRESENTATION.panelY).toBeGreaterThanOrEqual(600);
    expect(RESULT_PRESENTATION.panelY + RESULT_PRESENTATION.panelHeight / 2).toBeLessThanOrEqual(668);
  });

  it('keeps result and reward surfaces on the shared 8px grid', () => {
    expect(RESULT_PRESENTATION.panelMaxWidth).toBe(OPENING_FEEL_PRESENTATION.railCardWidth * 2);
    expect(OPENING_FEEL_PRESENTATION.rewardTrayWidth % 8).toBe(0);
    expect(OPENING_FEEL_PRESENTATION.rewardTrayContentInset % 8).toBe(0);
    expect(OPENING_FEEL_PRESENTATION.rewardTrayMinHeight % 8).toBe(0);
    expect(OPENING_FEEL_PRESENTATION.rewardTrayHeightStep).toBe(8);
    expect(getRewardTrayHeight(72)).toBe(72);
    expect(getRewardTrayHeight(85)).toBe(88);
    expect(getRewardTrayHeight(93)).toBe(96);
    expect(getRewardTrayHeight(103)).toBe(104);
    expect(getRewardTrayHeight(108)).toBe(112);
    expect(getRewardTrayHeight(116)).toBe(120);
  });

  it('keeps persistent standard rarity presence restrained and tiered', () => {
    const common = getStandardResultPresence('common');
    const rare = getStandardResultPresence('rare');
    const epic = getStandardResultPresence('epic');
    const legendary = getStandardResultPresence('legendary');

    expect(common.enabled).toBe(false);
    expect(rare.enabled).toBe(true);
    expect(rare.glowAlpha).toBeLessThan(epic.glowAlpha);
    expect(epic.glowAlpha).toBeLessThan(legendary.glowAlpha);
    expect(rare.ringAlpha).toBeLessThan(epic.ringAlpha);
    expect(epic.ringAlpha).toBeLessThan(legendary.ringAlpha);
    expect(rare.sparkleCount).toBeGreaterThanOrEqual(1);
    expect(epic.sparkleCount).toBeLessThan(legendary.sparkleCount);
    expect(legendary.sparkleCount).toBeLessThanOrEqual(7);
    expect(legendary.glowAlpha).toBeLessThanOrEqual(0.07);
    expect(legendary.glowAlpha).toBeLessThan(REVEAL_FX_PRESETS.legendary.glowAlpha * 0.15);
    expect(legendary.sparkleCount).toBeLessThan(REVEAL_FX_PRESETS.legendary.particleCount);
  });

  it('gives rarity a bounded anticipation and perceived-mass ladder', () => {
    const common = REVEAL_FX_PRESETS.common;
    const rare = REVEAL_FX_PRESETS.rare;
    const epic = REVEAL_FX_PRESETS.epic;
    const legendary = REVEAL_FX_PRESETS.legendary;
    const secret = REVEAL_FX_PRESETS.secret;

    expect(common.anticipationHoldMs).toBe(0);
    expect(rare.anticipationHoldMs).toBe(0);
    expect(epic.anticipationHoldMs).toBeGreaterThan(0);
    expect(epic.anticipationHoldMs).toBeLessThan(legendary.anticipationHoldMs);
    expect(legendary.anticipationHoldMs).toBeLessThan(secret.anticipationHoldMs);
    expect(secret.anticipationHoldMs).toBeLessThanOrEqual(200);
    expect(common.introDuration).toBeLessThan(rare.introDuration);
    expect(rare.introDuration).toBeLessThanOrEqual(epic.introDuration);
    expect(epic.aftershockScale).toBe(1);
    expect(epic.aftershockDurationMs).toBe(0);
    expect(legendary.aftershockScale).toBeGreaterThan(1);
    expect(legendary.aftershockScale).toBeLessThanOrEqual(1.02);
    expect(legendary.aftershockDurationMs).toBeGreaterThan(0);
    expect(legendary.aftershockDurationMs).toBeLessThanOrEqual(100);
    expect(secret.aftershockScale).toBe(1);
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
    expect(REVEAL_FX_PRESETS.legendary.particleCount).toBeLessThanOrEqual(36);
    expect(REVEAL_FX_PRESETS.secret.particleCount).toBeLessThanOrEqual(48);
  });

  it('keeps the feel-pass interaction timings and rail hierarchy bounded', () => {
    expect(OPENING_FEEL_PRESENTATION.postTearSkipGuardMs).toBeGreaterThanOrEqual(80);
    expect(OPENING_FEEL_PRESENTATION.postTearSkipGuardMs).toBeLessThanOrEqual(180);
    expect(OPENING_FEEL_PRESENTATION.resultReadHoldMs).toBeGreaterThan(600);
    expect(OPENING_FEEL_PRESENTATION.bankLegMaxDuration).toBeLessThanOrEqual(900);
    expect(OPENING_FEEL_PRESENTATION.bankLegMinDuration).toBeGreaterThanOrEqual(300);
    expect(OPENING_FEEL_PRESENTATION.chipsHudHeight).toBeLessThanOrEqual(64);
    expect(OPENING_FEEL_PRESENTATION.signalHudHeight).toBeLessThanOrEqual(64);
    expect(OPENING_FEEL_PRESENTATION.rewardTrayResultGap).toBeGreaterThanOrEqual(16);
    expect(OPENING_FEEL_PRESENTATION.railCardWidth).toBeLessThanOrEqual(230);
    expect(OPENING_FEEL_PRESENTATION.railUnavailableAlpha).toBeGreaterThanOrEqual(0.8);
    expect(OPENING_FEEL_PRESENTATION.railUnavailableAlpha).toBeLessThan(0.9);
    expect(OPENING_FEEL_PRESENTATION.railUnavailableSurfaceAlpha).toBeGreaterThanOrEqual(0.7);
    expect(OPENING_FEEL_PRESENTATION.railUnavailableSurfaceAlpha).toBeLessThan(0.9);
    expect(OPENING_FEEL_PRESENTATION.uiFadeInMs).toBeGreaterThanOrEqual(180);
    expect(OPENING_FEEL_PRESENTATION.uiFadeInMs).toBeLessThanOrEqual(260);
    expect(OPENING_FEEL_PRESENTATION.uiFadeOutMs).toBeGreaterThanOrEqual(150);
    expect(OPENING_FEEL_PRESENTATION.uiFadeOutMs).toBeLessThanOrEqual(240);
    expect(OPENING_FEEL_PRESENTATION.uiPressMs).toBeLessThanOrEqual(90);
    const discoveryDuration =
      OPENING_FEEL_PRESENTATION.discoveryIntroMs +
      OPENING_FEEL_PRESENTATION.discoveryHoldMs +
      OPENING_FEEL_PRESENTATION.discoverySettleMs;
    expect(OPENING_FEEL_PRESENTATION.discoveryPopScale).toBeGreaterThanOrEqual(1.02);
    expect(OPENING_FEEL_PRESENTATION.discoveryPopScale).toBeLessThanOrEqual(1.07);
    expect(discoveryDuration).toBeGreaterThanOrEqual(1_000);
    expect(discoveryDuration).toBeLessThanOrEqual(1_300);
    expect(OPENING_FEEL_PRESENTATION.discoveryOutlineCopies).toBeGreaterThanOrEqual(6);
    expect(OPENING_FEEL_PRESENTATION.discoveryOutlineCopies).toBeLessThanOrEqual(12);
    expect(OPENING_FEEL_PRESENTATION.discoveryOutlineRadius).toBeGreaterThanOrEqual(2);
    expect(OPENING_FEEL_PRESENTATION.discoveryOutlineRadius).toBeLessThanOrEqual(5);
    expect(OPENING_FEEL_PRESENTATION.discoveryOutlineAlpha).toBeLessThanOrEqual(0.9);
    expect(OPENING_FEEL_PRESENTATION.revealBackdropFadeInMs).toBeGreaterThanOrEqual(240);
    expect(OPENING_FEEL_PRESENTATION.revealBackdropFadeOutMs).toBeGreaterThanOrEqual(260);
    expect(OPENING_FEEL_PRESENTATION.duplicateConversionAccentMs).toBeGreaterThanOrEqual(600);
    expect(OPENING_FEEL_PRESENTATION.duplicateConversionAccentMs).toBeLessThanOrEqual(850);
    expect(OPENING_FEEL_PRESENTATION.persistentFxIntroScale).toBeLessThan(1);
    expect(OPENING_FEEL_PRESENTATION.persistentFxOvershootScale).toBeGreaterThan(1);
    expect(OPENING_FEEL_PRESENTATION.persistentFxIntroMs).toBeGreaterThanOrEqual(240);
    expect(OPENING_FEEL_PRESENTATION.persistentFxExitMs).toBeGreaterThanOrEqual(200);
    expect(OPENING_FEEL_PRESENTATION.secretOutlineCopies).toBeGreaterThanOrEqual(8);
    expect(OPENING_FEEL_PRESENTATION.secretOutlineAlpha).toBeLessThan(OPENING_FEEL_PRESENTATION.secretOutlinePeakAlpha);
    expect(OPENING_FEEL_PRESENTATION.revealInfoBadgeHoldMs).toBeGreaterThanOrEqual(550);
    expect(OPENING_FEEL_PRESENTATION.collectAcknowledgeMs).toBeGreaterThanOrEqual(120);
    expect(OPENING_FEEL_PRESENTATION.collectAcknowledgeMs).toBeLessThanOrEqual(220);
    expect(OPENING_FEEL_PRESENTATION.collectItemScale).toBeGreaterThanOrEqual(0.9);
    expect(OPENING_FEEL_PRESENTATION.collectItemScale).toBeLessThanOrEqual(0.97);
    expect(OPENING_FEEL_PRESENTATION.collectItemShiftX).toBeGreaterThan(0);
    expect(OPENING_FEEL_PRESENTATION.collectItemShiftX).toBeLessThanOrEqual(16);
    expect(OPENING_FEEL_PRESENTATION.collectItemShiftY).toBeGreaterThan(0);
    expect(OPENING_FEEL_PRESENTATION.collectItemShiftY).toBeLessThanOrEqual(12);
    expect(OPENING_FEEL_PRESENTATION.collectPanelAlpha).toBeLessThanOrEqual(0.35);
    expect(OPENING_FEEL_PRESENTATION.collectDestinationPulseScale).toBeLessThanOrEqual(1.06);
  });

  it('keeps ambient and idle motion subtle and bounded', () => {
    expect(AMBIENT_PRESENTATION.count).toBeGreaterThanOrEqual(22);
    expect(AMBIENT_PRESENTATION.count).toBeLessThanOrEqual(28);
    expect(AMBIENT_PRESENTATION.glowCount).toBeGreaterThanOrEqual(2);
    expect(AMBIENT_PRESENTATION.glowCount).toBeLessThanOrEqual(4);
    expect(AMBIENT_PRESENTATION.maxGlowAlpha).toBeLessThanOrEqual(0.03);
    expect(AMBIENT_PRESENTATION.maxAlpha).toBeLessThanOrEqual(0.2);
    expect(MOTION_PRESENTATION.starPulseScale).toBeGreaterThanOrEqual(1.06);
    expect(MOTION_PRESENTATION.starPulseScale).toBeLessThanOrEqual(1.08);
    expect(MOTION_PRESENTATION.resultReadyGlowMinAlpha).toBeLessThan(MOTION_PRESENTATION.resultReadyGlowMaxAlpha);
    expect(MOTION_PRESENTATION.resultReadyGlowDuration).toBeGreaterThanOrEqual(500);
    expect(MOTION_PRESENTATION.resultReadyGlowDuration).toBeLessThanOrEqual(900);
    expect(MOTION_PRESENTATION.rewardBreathScale).toBeLessThan(1.05);
    expect(COLLECTION_MILESTONE_PRESENTATION.holdMs).toBeGreaterThanOrEqual(2200);
    expect(COLLECTION_MILESTONE_PRESENTATION.holdMs).toBeLessThanOrEqual(2800);
    expect(COLLECTION_MILESTONE_PRESENTATION.objectGap).toBeGreaterThanOrEqual(20);
    expect(COLLECTION_MILESTONE_PRESENTATION.resultGap).toBeGreaterThanOrEqual(16);
  });
});
