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
    revealY: 308,
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
    revealY: 296,
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
  groupY: 246,
  body: { x: 0, y: 92, displayWidth: 420 } satisfies PouchLayerPresentation,
  // Runtime seam is intentionally only the narrow tear rail. It should overlap
  // the body's own top foil edge instead of reading as a second package lid.
  strip: { x: 0, y: -82, displayWidth: 360 } satisfies PouchLayerPresentation,
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
    backdropAlpha: 0.12,
    flashAlpha: 0.28,
    glowAlpha: 0.18,
    ringScale: 1.5,
    particleCount: 8,
    particleDistance: 118,
    particleDuration: 420,
    sparkleScale: 1,
    overshootScale: 1.13,
    introDuration: 340,
    settleDuration: 135,
    shake: 0.0005,
    secondaryRing: false,
  },
  rare: {
    backdropAlpha: 0.15,
    flashAlpha: 0.35,
    glowAlpha: 0.24,
    ringScale: 1.65,
    particleCount: 12,
    particleDistance: 142,
    particleDuration: 470,
    sparkleScale: 1.05,
    overshootScale: 1.15,
    introDuration: 360,
    settleDuration: 140,
    shake: 0.0012,
    secondaryRing: false,
  },
  epic: {
    backdropAlpha: 0.21,
    flashAlpha: 0.46,
    glowAlpha: 0.34,
    ringScale: 1.9,
    particleCount: 18,
    particleDistance: 178,
    particleDuration: 540,
    sparkleScale: 1.18,
    overshootScale: 1.18,
    introDuration: 390,
    settleDuration: 150,
    shake: 0.0025,
    secondaryRing: true,
  },
  legendary: {
    backdropAlpha: 0.27,
    flashAlpha: 0.58,
    glowAlpha: 0.46,
    ringScale: 2.15,
    particleCount: 25,
    particleDistance: 214,
    particleDuration: 630,
    sparkleScale: 1.28,
    overshootScale: 1.21,
    introDuration: 420,
    settleDuration: 160,
    shake: 0.0036,
    secondaryRing: true,
  },
  secret: {
    backdropAlpha: 0.31,
    flashAlpha: 0.66,
    glowAlpha: 0.56,
    ringScale: 2.35,
    particleCount: 32,
    particleDistance: 242,
    particleDuration: 700,
    sparkleScale: 1.38,
    overshootScale: 1.22,
    introDuration: 445,
    settleDuration: 165,
    shake: 0.0042,
    secondaryRing: true,
  },
};

export const AMBIENT_PRESENTATION = {
  count: 15,
  minAlpha: 0.07,
  maxAlpha: 0.17,
  minRadius: 1.5,
  maxRadius: 4.5,
  minDuration: 6800,
  maxDuration: 11200,
  maxDriftX: 42,
  maxDriftY: 24,
} as const;

export const MOTION_PRESENTATION = {
  tearHintY: 662,
  starPulseScale: 1.04,
  starPulseDuration: 720,
  resultPulseScale: 1.028,
  resultPulseDuration: 620,
  rewardBreathScale: 1.028,
  rewardBreathDuration: 1200,
} as const;

export const RESULT_PRESENTATION = {
  panelY: 558,
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
