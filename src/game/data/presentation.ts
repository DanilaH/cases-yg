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
  groupY: 340,
  body: { x: 0, y: 88, displayWidth: 410 } satisfies PouchLayerPresentation,
  strip: { x: 0, y: 0, displayWidth: 376 } satisfies PouchLayerPresentation,
  tab: { x: 0, y: 0, displayWidth: 376 } satisfies PouchLayerPresentation,
  shadowY: 286,
  shadowWidth: 350,
  hitboxX: -125,
  hitboxY: -135,
  hitboxSize: 136,
  tabTravel: 284,
  dragThreshold: 260,
  tearLineY: -92,
} as const;

export interface RevealFxPreset {
  flashAlpha: number;
  glowAlpha: number;
  ringScale: number;
  particleCount: number;
  particleDistance: number;
  particleDuration: number;
  overshootScale: number;
  introDuration: number;
  settleDuration: number;
  shake: number;
  secondaryRing: boolean;
}

export const REVEAL_FX_PRESETS: Readonly<Record<RevealRarity, RevealFxPreset>> = {
  common: {
    flashAlpha: 0.18,
    glowAlpha: 0.12,
    ringScale: 1.35,
    particleCount: 7,
    particleDistance: 104,
    particleDuration: 380,
    overshootScale: 1.12,
    introDuration: 330,
    settleDuration: 130,
    shake: 0,
    secondaryRing: false,
  },
  rare: {
    flashAlpha: 0.23,
    glowAlpha: 0.16,
    ringScale: 1.5,
    particleCount: 11,
    particleDistance: 124,
    particleDuration: 430,
    overshootScale: 1.14,
    introDuration: 350,
    settleDuration: 135,
    shake: 0.0008,
    secondaryRing: false,
  },
  epic: {
    flashAlpha: 0.3,
    glowAlpha: 0.22,
    ringScale: 1.7,
    particleCount: 16,
    particleDistance: 154,
    particleDuration: 500,
    overshootScale: 1.16,
    introDuration: 380,
    settleDuration: 145,
    shake: 0.0018,
    secondaryRing: true,
  },
  legendary: {
    flashAlpha: 0.38,
    glowAlpha: 0.3,
    ringScale: 1.95,
    particleCount: 23,
    particleDistance: 188,
    particleDuration: 590,
    overshootScale: 1.18,
    introDuration: 410,
    settleDuration: 155,
    shake: 0.0028,
    secondaryRing: true,
  },
  secret: {
    flashAlpha: 0.44,
    glowAlpha: 0.36,
    ringScale: 2.15,
    particleCount: 30,
    particleDistance: 214,
    particleDuration: 660,
    overshootScale: 1.18,
    introDuration: 430,
    settleDuration: 160,
    shake: 0.0032,
    secondaryRing: true,
  },
};

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
