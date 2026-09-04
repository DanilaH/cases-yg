import type { StandardRarity } from './collectibles';

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
  revealY: 310,
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
    revealY: 318,
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
    revealY: 310,
  },
};

export const getCollectiblePresentation = (familyId: string): CollectiblePresentation =>
  COLLECTIBLE_PRESENTATION[familyId] ?? FALLBACK_PRESENTATION;

export interface PouchLayerPresentation {
  x: number;
  y: number;
  displayWidth: number;
}

export const POUCH_PRESENTATION = {
  // Keep the pouch visual center near the reward's reveal position. The previous
  // lower placement made the scene jump upward by roughly a hundred logical px
  // as soon as the collectible appeared.
  groupY: 266,
  body: { x: 0, y: 92, displayWidth: 420 } satisfies PouchLayerPresentation,
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
  shake: number;
  secondaryRing: boolean;
}

export const REVEAL_FX_PRESETS: Readonly<Record<RevealRarity, RevealFxPreset>> = {
  common: {
    backdropAlpha: 0.14,
    flashAlpha: 0.38,
    glowAlpha: 0.22,
    ringScale: 1.58,
    particleCount: 9,
    particleDistance: 130,
    particleDuration: 520,
    sparkleScale: 1.05,
    overshootScale: 1.14,
    introDuration: 360,
    settleDuration: 140,
    shake: 0.0006,
    secondaryRing: false,
  },
  rare: {
    backdropAlpha: 0.19,
    flashAlpha: 0.46,
    glowAlpha: 0.3,
    ringScale: 1.78,
    particleCount: 14,
    particleDistance: 155,
    particleDuration: 580,
    sparkleScale: 1.15,
    overshootScale: 1.16,
    introDuration: 380,
    settleDuration: 145,
    shake: 0.0013,
    secondaryRing: false,
  },
  epic: {
    backdropAlpha: 0.28,
    flashAlpha: 0.6,
    glowAlpha: 0.42,
    ringScale: 2.05,
    particleCount: 20,
    particleDistance: 195,
    particleDuration: 680,
    sparkleScale: 1.32,
    overshootScale: 1.2,
    introDuration: 420,
    settleDuration: 155,
    shake: 0.0027,
    secondaryRing: true,
  },
  legendary: {
    backdropAlpha: 0.36,
    flashAlpha: 0.72,
    glowAlpha: 0.55,
    ringScale: 2.32,
    particleCount: 28,
    particleDistance: 235,
    particleDuration: 780,
    sparkleScale: 1.48,
    overshootScale: 1.23,
    introDuration: 455,
    settleDuration: 165,
    shake: 0.0038,
    secondaryRing: true,
  },
  secret: {
    backdropAlpha: 0.42,
    flashAlpha: 0.8,
    glowAlpha: 0.66,
    ringScale: 2.58,
    particleCount: 36,
    particleDistance: 270,
    particleDuration: 860,
    sparkleScale: 1.62,
    overshootScale: 1.25,
    introDuration: 480,
    settleDuration: 175,
    shake: 0.0045,
    secondaryRing: true,
  },
};

export const AMBIENT_PRESENTATION = {
  count: 18,
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
  tearHintY: 632,
  starPulseScale: 1.07,
  starPulseDuration: 520,
  resultPulseScale: 1.04,
  resultPulseDuration: 180,
  resultPulseRepeatDelay: 520,
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

export const RESULT_PRESENTATION = {
  panelY: 568,
  panelHeight: 112,
  panelMaxWidth: 430,
  panelMinWidth: 330,
  carouselDotY: 486,
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
