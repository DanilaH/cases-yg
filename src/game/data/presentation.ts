import type { GameLootPoolId, StandardRarity } from './collectibles';

export type RevealRarity = StandardRarity | 'secret';

export interface CollectiblePresentation {
  assetWidth: number;
  artOffsetX: number;
  artOffsetY: number;
  revealScale: number;
  carouselSideScale: number;
  shelfScale: number;
  shelfSecretScale: number;
  libraryScale: number;
  librarySecretScale: number;
  revealY: number;
}

const FALLBACK_PRESENTATION: CollectiblePresentation = {
  assetWidth: 246,
  artOffsetX: 0,
  artOffsetY: 0,
  revealScale: 1.2,
  carouselSideScale: 0.72,
  shelfScale: 0.78,
  shelfSecretScale: 0.82,
  libraryScale: 0.27,
  librarySecretScale: 0.29,
  revealY: 328,
};

export const COLLECTIBLE_PRESENTATION: Readonly<Record<string, CollectiblePresentation>> = {
  camera: {
    assetWidth: 246,
    artOffsetX: 0,
    artOffsetY: 0,
    revealScale: 1.24,
    carouselSideScale: 0.72,
    shelfScale: 0.78,
    shelfSecretScale: 0.82,
    libraryScale: 0.27,
    librarySecretScale: 0.29,
    revealY: 336,
  },
  'flip-phone': {
    assetWidth: 300,
    // Production phone variants have a left-side charm but their robust visible
    // center sits only ~10-20 source pixels right of the canvas center. The old
    // -24 runtime offset over-corrected this and pulled the phone body left.
    artOffsetX: -7,
    artOffsetY: -10,
    revealScale: 1.14,
    carouselSideScale: 0.7,
    shelfScale: 0.7,
    shelfSecretScale: 0.73,
    libraryScale: 0.36,
    librarySecretScale: 0.38,
    revealY: 328,
  },
};

export const getCollectiblePresentation = (familyId: string): CollectiblePresentation =>
  COLLECTIBLE_PRESENTATION[familyId] ?? FALLBACK_PRESENTATION;

export interface StandardResultPresenceProfile {
  enabled: boolean;
  glowAlpha: number;
  glowWidth: number;
  glowHeight: number;
  ringAlpha: number;
  pulseScale: number;
  pulseDurationMs: number;
  sparkleCount: number;
}

export const STANDARD_RESULT_PRESENCE: Readonly<Record<StandardRarity, StandardResultPresenceProfile>> = {
  common: {
    enabled: false,
    glowAlpha: 0,
    glowWidth: 0,
    glowHeight: 0,
    ringAlpha: 0,
    pulseScale: 1,
    pulseDurationMs: 0,
    sparkleCount: 0,
  },
  rare: {
    enabled: true,
    glowAlpha: 0.035,
    glowWidth: 252,
    glowHeight: 186,
    ringAlpha: 0,
    pulseScale: 1.035,
    pulseDurationMs: 1900,
    sparkleCount: 1,
  },
  epic: {
    enabled: true,
    glowAlpha: 0.05,
    glowWidth: 278,
    glowHeight: 204,
    ringAlpha: 0.1,
    pulseScale: 1.045,
    pulseDurationMs: 1750,
    sparkleCount: 4,
  },
  legendary: {
    enabled: true,
    glowAlpha: 0.065,
    glowWidth: 306,
    glowHeight: 224,
    ringAlpha: 0.15,
    pulseScale: 1.055,
    pulseDurationMs: 1600,
    sparkleCount: 7,
  },
} as const;

export const getStandardResultPresence = (rarity: StandardRarity): StandardResultPresenceProfile =>
  STANDARD_RESULT_PRESENCE[rarity];

export interface PouchLayerPresentation {
  x: number;
  y: number;
  displayWidth: number;
}

export type DropPouchMotif = 'spark' | 'video' | 'grid' | 'wave' | 'game' | 'scan';

export interface DropPouchSkin {
  tint: number;
  accent: number;
  secondary: number;
  motif: DropPouchMotif;
}

export const DROP_POUCH_SKINS: Readonly<Record<GameLootPoolId, DropPouchSkin>> = {
  'y2k-essentials': { tint: 0xffffff, accent: 0x9c7cff, secondary: 0x67e8ff, motif: 'spark' },
  'video-link': { tint: 0xdff9ff, accent: 0x55e4ff, secondary: 0xff7ad9, motif: 'video' },
  'pocket-office': { tint: 0xe8ffef, accent: 0x72f2ae, secondary: 0x8aa6ff, motif: 'grid' },
  'pocket-audio': { tint: 0xffe7f3, accent: 0xff79bd, secondary: 0x8df8ff, motif: 'wave' },
  'game-zone': { tint: 0xeee6ff, accent: 0xa985ff, secondary: 0x7bffcf, motif: 'game' },
  'analog-nights': { tint: 0xffe8c8, accent: 0xffb65d, secondary: 0xff6f9f, motif: 'scan' },
} as const;

export const getDropPouchSkin = (lootPoolId: GameLootPoolId): DropPouchSkin =>
  DROP_POUCH_SKINS[lootPoolId];

export interface PouchVariantPresentation {
  bodyOffsetX: number;
  bodyOffsetY: number;
  stripOffsetX: number;
  stripOffsetY: number;
  tabOffsetX: number;
  tabOffsetY: number;
}

// Optical offsets are intentionally variant-specific: Basic and Charged use
// different authored rasters and should be hand-tuned independently.
export const POUCH_VARIANT_PRESENTATION = {
  basic: {
    bodyOffsetX: 0,
    bodyOffsetY: 0,
    stripOffsetX: -4,
    stripOffsetY: 0,
    tabOffsetX: 0,
    tabOffsetY: 0,
  },
  charged: {
    bodyOffsetX: -7,
    bodyOffsetY: -2,
    stripOffsetX: -7,
    stripOffsetY: 0,
    tabOffsetX: 0,
    tabOffsetY: 0,
  },
} as const satisfies Readonly<Record<'basic' | 'charged', PouchVariantPresentation>>;

export const POUCH_PRESENTATION = {
  // Keep the pouch body at the established reveal center while tucking its upper
  // silver shoulders farther behind the authored tear strip. The group moves up
  // by the same 6 logical px that the body moves down inside it, so reward/pouch
  // center continuity is unchanged.
  groupY: 260,
  body: { x: 0, y: 98, displayWidth: 420 } satisfies PouchLayerPresentation,
  // Compatibility aliases for the existing presentation contract. Edit the
  // variant table above when visually tuning the pouch.
  chargedBodyOpticalOffsetX: POUCH_VARIANT_PRESENTATION.charged.bodyOffsetX,
  chargedBodyOpticalOffsetY: POUCH_VARIANT_PRESENTATION.charged.bodyOffsetY,
  // The reviewed tear-strip artwork is pre-cropped to its visible bounds,
  // so runtime placement uses normal visual coordinates instead of source-canvas offsets.
  strip: { x: 0, y: -108, displayWidth: 360 } satisfies PouchLayerPresentation,
  // The existing star source has large transparent padding. These offsets place
  // the visible star on the left end of the seam and let it traverse the rail.
  tab: { x: -62, y: 20, displayWidth: 286 } satisfies PouchLayerPresentation,
  shadowY: 286,
  shadowWidth: 358,
  hitboxX: -158,
  hitboxY: -83,
  hitboxSize: 100,
  tabTravel: 318,
  dragThreshold: 294,
  tearLineY: -82,
} as const;

export const COLLECTION_MILESTONE_PRESENTATION = {
  width: 292,
  minWidth: 250,
  height: 60,
  safeSidePadding: 28,
  centerTopOffset: 78,
  objectGap: 28,
  verticalOffset: -20,
  minCenterY: 218,
  resultGap: 20,
  introOffsetX: 10,
  introOffsetY: 2,
  introMs: 240,
  holdMs: 1850,
  exitOffsetY: -4,
  exitMs: 320,
} as const;

export interface RevealFxPreset {
  backdropAlpha: number;
  flashAlpha: number;
  glowAlpha: number;
  ringScale: number;
  particleCount: number;
  particleDistance: number;
  particleDuration: number;
  sparkleScale: number;
  overshootScale: number;
  introDuration: number;
  settleDuration: number;
  anticipationHoldMs: number;
  introEase: string;
  settleEase: string;
  aftershockScale: number;
  aftershockDurationMs: number;
  shake: number;
  secondaryRing: boolean;
}

export const REVEAL_FX_PRESETS: Readonly<Record<RevealRarity, RevealFxPreset>> = {
  common: {
    backdropAlpha: 0.14,
    flashAlpha: 0.38,
    glowAlpha: 0.22,
    ringScale: 1.58,
    particleCount: 12,
    particleDistance: 130,
    particleDuration: 520,
    sparkleScale: 1.05,
    overshootScale: 1.08,
    introDuration: 330,
    settleDuration: 120,
    anticipationHoldMs: 0,
    introEase: 'Cubic.Out',
    settleEase: 'Sine.Out',
    aftershockScale: 1,
    aftershockDurationMs: 0,
    shake: 0.0006,
    secondaryRing: false,
  },
  rare: {
    backdropAlpha: 0.19,
    flashAlpha: 0.46,
    glowAlpha: 0.3,
    ringScale: 1.78,
    particleCount: 17,
    particleDistance: 155,
    particleDuration: 580,
    sparkleScale: 1.15,
    overshootScale: 1.11,
    introDuration: 370,
    settleDuration: 160,
    anticipationHoldMs: 0,
    introEase: 'Back.Out',
    settleEase: 'Sine.InOut',
    aftershockScale: 1,
    aftershockDurationMs: 0,
    shake: 0.0013,
    secondaryRing: false,
  },
  epic: {
    backdropAlpha: 0.28,
    flashAlpha: 0.6,
    glowAlpha: 0.42,
    ringScale: 2.05,
    particleCount: 24,
    particleDistance: 195,
    particleDuration: 680,
    sparkleScale: 1.32,
    overshootScale: 1.16,
    introDuration: 420,
    settleDuration: 175,
    anticipationHoldMs: 90,
    introEase: 'Back.Out',
    settleEase: 'Quad.Out',
    aftershockScale: 1,
    aftershockDurationMs: 0,
    shake: 0.0027,
    secondaryRing: true,
  },
  legendary: {
    backdropAlpha: 0.36,
    flashAlpha: 0.72,
    glowAlpha: 0.55,
    ringScale: 2.32,
    particleCount: 34,
    particleDistance: 235,
    particleDuration: 780,
    sparkleScale: 1.48,
    overshootScale: 1.19,
    introDuration: 455,
    settleDuration: 190,
    anticipationHoldMs: 150,
    introEase: 'Back.Out',
    settleEase: 'Cubic.Out',
    aftershockScale: 1.016,
    aftershockDurationMs: 90,
    shake: 0.0038,
    secondaryRing: true,
  },
  secret: {
    backdropAlpha: 0.42,
    flashAlpha: 0.8,
    glowAlpha: 0.66,
    ringScale: 2.58,
    particleCount: 44,
    particleDistance: 270,
    particleDuration: 860,
    sparkleScale: 1.62,
    overshootScale: 1.22,
    introDuration: 480,
    settleDuration: 200,
    anticipationHoldMs: 180,
    introEase: 'Back.Out',
    settleEase: 'Cubic.Out',
    aftershockScale: 1,
    aftershockDurationMs: 0,
    shake: 0.0045,
    secondaryRing: true,
  },
};

export const AMBIENT_PRESENTATION = {
  count: 24,
  glowCount: 3,
  minGlowAlpha: 0.012,
  maxGlowAlpha: 0.026,
  minGlowRadius: 120,
  maxGlowRadius: 210,
  minGlowDuration: 9000,
  maxGlowDuration: 15000,
  minAlpha: 0.09,
  maxAlpha: 0.2,
  minRadius: 2,
  maxRadius: 6,
  minDuration: 6000,
  maxDuration: 10000,
  maxDriftX: 52,
  maxDriftY: 30,
} as const;

export const MOTION_PRESENTATION = {
  starPulseScale: 1.07,
  starPulseDuration: 520,
  resultReadyGlowMinAlpha: 0.16,
  resultReadyGlowMaxAlpha: 0.46,
  resultReadyGlowDuration: 680,
  rewardBreathScale: 1.028,
  rewardBreathDuration: 1200,
} as const;

export const REVEAL_MOTION_PRESENTATION = {
  // The collectible stays behind the pouch for the entire emergence. The pouch
  // moves/fades away instead of swapping z-order mid-animation.
  emergeOffsetY: 132,
  pouchExitOffsetY: 104,
  pouchExitScale: 0.93,
  pouchExitDelay: 90,
  pouchExitDuration: 330,
} as const;


export const OPENING_FEEL_PRESENTATION = {
  postTearSkipGuardMs: 120,
  resultReadHoldMs: 980,
  rewardTrayWidth: 248,
  rewardTrayContentInset: 16,
  rewardTrayMinHeight: 72,
  rewardTrayHeightStep: 8,
  rewardTraySideGap: 18,
  rewardTrayResultGap: 18,
  rewardTrayHeroHalfWidth: 144,
  chipsHudWidth: 216,
  chipsHudHeight: 64,
  signalHudWidth: 216,
  signalHudHeight: 64,
  railCardWidth: 216,
  railCardHeight: 58,
  railGap: 10,
  railUnavailableAlpha: 0.84,
  railUnavailableSurfaceAlpha: 0.78,
  railTopOffset: 8,
  bottomActionInset: 24,
  selectorTopOffset: 164,
  dropSelectorBottomInset: 18,
  dropSelectorHeight: 84,
  dropSelectorMinWidth: 360,
  dropSelectorMaxWidth: 470,
  dropSelectorArrowHitWidth: 68,
  dropSelectorSwipeThreshold: 34,
  dropSelectorSwitchMs: 120,
  tearHintIdleDelayMs: 5500,
  tearHintNudgeAngle: 6,
  tearHintNudgeRepeats: 2,
  bankLegMinDuration: 320,
  bankLegMaxDuration: 900,
  uiFadeInMs: 220,
  uiFadeOutMs: 180,
  uiPressMs: 70,
  // Every standard result gets a quiet silhouette presence. A NEW discovery
  // layers the stronger transient discovery beat on top.
  standardOutlineCopies: 4,
  standardOutlineRadius: 2.2,
  standardOutlineAlpha: 0.12,
  standardOutlinePeakAlpha: 0.22,
  newPersistentOutlineAlpha: 0.2,
  newPersistentOutlinePeakAlpha: 0.34,
  discoveryPopScale: 1.06,
  discoveryFrameWidth: 288,
  discoveryFrameHeight: 208,
  discoveryOutlineCopies: 12,
  discoveryOutlineRadius: 4.8,
  discoveryOutlineAlpha: 0.86,
  discoveryLabelOffsetY: 120,
  discoveryIntroMs: 250,
  discoveryHoldMs: 150,
  discoverySettleMs: 290,
  revealBackdropFadeInMs: 280,
  revealBackdropFadeOutMs: 300,
  duplicateConversionAccentMs: 260,
  collectAcknowledgeMs: 160,
  collectItemScale: 0.94,
  collectItemShiftX: 12,
  collectItemShiftY: 8,
  collectPanelAlpha: 0.28,
  collectDestinationPulseScale: 1.04,
  hudShimmerDurationMs: 900,
  hudShimmerRepeatDelayMs: 2100,
} as const;

// Reward content varies by duplicate/cache/Signal/Secret state; snap only the
// background growth to the shared 8px surface rhythm without moving the rows.
export const getRewardTrayHeight = (contentHeight: number): number =>
  Math.max(
    OPENING_FEEL_PRESENTATION.rewardTrayMinHeight,
    Math.ceil(contentHeight / OPENING_FEEL_PRESENTATION.rewardTrayHeightStep) * OPENING_FEEL_PRESENTATION.rewardTrayHeightStep,
  );

export const RESULT_PRESENTATION = {
  // Keep the lower result card visually grounded near the bottom action line.
  panelY: 612,
  panelHeight: 112,
  // Three optical row anchors keep title, state and CTA evenly distributed.
  headingY: -31,
  statusY: 1,
  hintY: 35,
  panelMaxWidth: 432,
  panelMinWidth: 330,
  carouselDotY: 504,
  carouselSpacingMin: 260,
  carouselSpacingMax: 330,
  carouselSpacingRatio: 0.29,
  sideAlpha: 0.27,
  swipeThreshold: 72,
  dragClamp: 230,
  tapMoveTolerance: 14,
} as const;

export const getCarouselSpacing = (logicalWidth: number): number =>
  Math.min(
    RESULT_PRESENTATION.carouselSpacingMax,
    Math.max(RESULT_PRESENTATION.carouselSpacingMin, logicalWidth * RESULT_PRESENTATION.carouselSpacingRatio),
  );

export interface CarouselVisualState {
  xOffset: number;
  scaleMultiplier: number;
  alpha: number;
}

export const getCarouselVisualState = (
  itemIndex: number,
  activeIndex: number,
  dragOffset: number,
  spacing: number,
  sideScale: number,
): CarouselVisualState => {
  const xOffset = (itemIndex - activeIndex) * spacing + dragOffset;
  const normalizedDistance = Math.min(1, Math.abs(xOffset) / Math.max(1, spacing));
  return {
    xOffset,
    scaleMultiplier: 1 - (1 - sideScale) * normalizedDistance,
    alpha: 1 - (1 - RESULT_PRESENTATION.sideAlpha) * normalizedDistance,
  };
};

export const resolveCarouselIndex = (
  currentIndex: number,
  itemCount: number,
  dragOffset: number,
): number => {
  if (Math.abs(dragOffset) < RESULT_PRESENTATION.swipeThreshold) return currentIndex;
  const direction = dragOffset < 0 ? 1 : -1;
  return Math.min(Math.max(0, currentIndex + direction), Math.max(0, itemCount - 1));
};