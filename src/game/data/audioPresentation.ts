import type { SfxCue } from './audioAssets';

export type ResultAmbienceRarity = 'common' | 'rare' | 'epic' | 'legendary' | 'secret';
export type PersistentResultAmbience = Exclude<ResultAmbienceRarity, 'common'>;

export interface BaseAmbienceProfile {
  busGain: number;
  roomNoiseGain: number;
  roomHighpassHz: number;
  roomLowpassHz: number;
  humGain: number;
  padGain: number;
  padLowpassHz: number;
  shimmerGain: number;
  fadeInMs: number;
  padFrequencies: readonly number[];
}

export interface OneShotPitchVariationProfile {
  defaultAmount: number;
  uiAmount: number;
  tonalAmount: number;
}

export interface ChipPitchProfile {
  startMultiplier: number;
  endMultiplier: number;
  jitterAmount: number;
}

export interface RarityAmbienceProfile {
  enabled: boolean;
  busGain: number;
  toneGain: number;
  shimmerGain: number;
  toneFrequencies: readonly number[];
  pulseRateHz: number;
  pulseDepth: number;
  stereoSpread: number;
  toneLowpassHz: number;
  shimmerBandHz: number;
  baseMixMultiplier: number;
  fadeInMs: number;
  fadeOutMs: number;
}

export interface AudioDuckProfile {
  multiplier: number;
  attackMs: number;
  holdMs: number;
  releaseMs: number;
}

export interface AudioCuePresentationDirective {
  clearPersistent?: boolean;
  persistent?: PersistentResultAmbience;
  persistentDelayMs?: number;
  duck?: AudioDuckProfile;
}

export interface RevealAnticipationAudioProfile {
  enabled: boolean;
  multiplier: number;
  attackMs: number;
  releaseMs: number;
}

export const REVEAL_ANTICIPATION_AUDIO: Readonly<Record<ResultAmbienceRarity, RevealAnticipationAudioProfile>> = {
  common: { enabled: false, multiplier: 1, attackMs: 0, releaseMs: 0 },
  rare: { enabled: false, multiplier: 1, attackMs: 0, releaseMs: 0 },
  epic: { enabled: true, multiplier: 0.56, attackMs: 35, releaseMs: 260 },
  legendary: { enabled: true, multiplier: 0.18, attackMs: 32, releaseMs: 340 },
  secret: { enabled: true, multiplier: 0.08, attackMs: 28, releaseMs: 380 },
} as const;

export const getRevealAnticipationAudioProfile = (rarity: ResultAmbienceRarity): RevealAnticipationAudioProfile =>
  REVEAL_ANTICIPATION_AUDIO[rarity];

export interface DragTextureProfile {
  minGain: number;
  maxGain: number;
  minBandHz: number;
  maxBandHz: number;
  minQ: number;
  maxQ: number;
  progressWeight: number;
  velocityWeight: number;
  updateMs: number;
  idleReleaseMs: number;
  releaseMs: number;
}

export interface DragTextureMix {
  gain: number;
  bandHz: number;
  q: number;
}

export const DRAG_TEXTURE_PROFILE: Readonly<DragTextureProfile> = {
  minGain: 0.0018,
  maxGain: 0.0085,
  minBandHz: 950,
  maxBandHz: 2800,
  minQ: 0.55,
  maxQ: 1.0,
  progressWeight: 0.62,
  velocityWeight: 0.38,
  updateMs: 35,
  idleReleaseMs: 90,
  releaseMs: 55,
} as const;

export const getDragTextureMix = (progress: number, velocity: number): DragTextureMix => {
  const clampedProgress = Math.max(0, Math.min(1, progress));
  const clampedVelocity = Math.max(0, Math.min(1, velocity));
  const intensity = Math.min(
    1,
    clampedProgress * DRAG_TEXTURE_PROFILE.progressWeight +
      clampedVelocity * DRAG_TEXTURE_PROFILE.velocityWeight,
  );
  const brightness = Math.min(1, clampedProgress * 0.72 + clampedVelocity * 0.28);
  return {
    gain:
      DRAG_TEXTURE_PROFILE.minGain +
      (DRAG_TEXTURE_PROFILE.maxGain - DRAG_TEXTURE_PROFILE.minGain) * intensity,
    bandHz:
      DRAG_TEXTURE_PROFILE.minBandHz +
      (DRAG_TEXTURE_PROFILE.maxBandHz - DRAG_TEXTURE_PROFILE.minBandHz) * brightness,
    q:
      DRAG_TEXTURE_PROFILE.minQ +
      (DRAG_TEXTURE_PROFILE.maxQ - DRAG_TEXTURE_PROFILE.minQ) * clampedVelocity,
  };
};

export const BASE_AMBIENCE_PROFILE: Readonly<BaseAmbienceProfile> = {
  // Hands-on correction: room tone should feel like soft air, not a server rack.
  busGain: 0.2,
  roomNoiseGain: 0.012,
  roomHighpassHz: 150,
  roomLowpassHz: 2600,
  humGain: 0,
  padGain: 0.015,
  padLowpassHz: 1450,
  shimmerGain: 0.0018,
  fadeInMs: 900,
  padFrequencies: [174.61, 261.63, 349.23],
} as const;

export const ONE_SHOT_PITCH_VARIATION: Readonly<OneShotPitchVariationProfile> = {
  defaultAmount: 0.022,
  uiAmount: 0.032,
  tonalAmount: 0.012,
} as const;

export const getOneShotPitchVariation = (cue: SfxCue): number => {
  if (cue === 'chip-clack') return 0;
  if (
    cue === 'ui-click' ||
    cue === 'ui-skip' ||
    cue === 'carousel-switch' ||
    cue === 'pouch-select' ||
    cue === 'pouch-grab' ||
    cue === 'ui-denied' ||
    cue === 'duplicate' ||
    cue === 'signal-gain'
  ) {
    return ONE_SHOT_PITCH_VARIATION.uiAmount;
  }
  if (
    cue === 'common' ||
    cue === 'rare' ||
    cue === 'epic' ||
    cue === 'legendary' ||
    cue === 'secret-reveal' ||
    cue === 'collection-complete'
  ) {
    return ONE_SHOT_PITCH_VARIATION.tonalAmount;
  }
  return ONE_SHOT_PITCH_VARIATION.defaultAmount;
};

export const CHIP_PITCH_PROFILE: Readonly<ChipPitchProfile> = {
  startMultiplier: 0.92,
  endMultiplier: 1.18,
  jitterAmount: 0.012,
} as const;

export const getChipPitchMultiplier = (progress: number, jitterUnit = 0.5): number => {
  const clamped = Math.max(0, Math.min(1, progress));
  const eased = 1 - (1 - clamped) * (1 - clamped);
  const contour =
    CHIP_PITCH_PROFILE.startMultiplier +
    (CHIP_PITCH_PROFILE.endMultiplier - CHIP_PITCH_PROFILE.startMultiplier) * eased;
  const jitter = (Math.max(0, Math.min(1, jitterUnit)) * 2 - 1) * CHIP_PITCH_PROFILE.jitterAmount;
  return contour * (1 + jitter);
};

export const RARITY_AMBIENCE_PROFILES: Readonly<Record<ResultAmbienceRarity, RarityAmbienceProfile>> = {
  common: {
    enabled: false,
    busGain: 0,
    toneGain: 0,
    shimmerGain: 0,
    toneFrequencies: [],
    pulseRateHz: 0,
    pulseDepth: 0,
    stereoSpread: 0,
    toneLowpassHz: 0,
    shimmerBandHz: 0,
    baseMixMultiplier: 0.96,
    fadeInMs: 0,
    fadeOutMs: 190,
  },
  rare: {
    enabled: true,
    busGain: 0.18,
    toneGain: 0.01,
    shimmerGain: 0.0016,
    toneFrequencies: [392, 587.33],
    pulseRateHz: 0.09,
    pulseDepth: 0.045,
    stereoSpread: 0.16,
    toneLowpassHz: 2400,
    shimmerBandHz: 4100,
    baseMixMultiplier: 0.68,
    fadeInMs: 320,
    fadeOutMs: 210,
  },
  epic: {
    enabled: true,
    busGain: 0.21,
    toneGain: 0.0115,
    shimmerGain: 0.0022,
    toneFrequencies: [349.23, 523.25, 783.99],
    pulseRateHz: 0.08,
    pulseDepth: 0.055,
    stereoSpread: 0.25,
    toneLowpassHz: 2800,
    shimmerBandHz: 4700,
    baseMixMultiplier: 0.55,
    fadeInMs: 320,
    fadeOutMs: 225,
  },
  legendary: {
    enabled: true,
    busGain: 0.24,
    toneGain: 0.013,
    shimmerGain: 0.003,
    toneFrequencies: [329.63, 493.88, 739.99, 987.77],
    pulseRateHz: 0.07,
    pulseDepth: 0.065,
    stereoSpread: 0.34,
    toneLowpassHz: 3200,
    shimmerBandHz: 5200,
    baseMixMultiplier: 0.43,
    fadeInMs: 340,
    fadeOutMs: 245,
  },
  secret: {
    enabled: true,
    busGain: 0.27,
    toneGain: 0.014,
    shimmerGain: 0.004,
    toneFrequencies: [293.66, 440, 659.25, 880, 1174.66],
    pulseRateHz: 0.055,
    pulseDepth: 0.075,
    stereoSpread: 0.44,
    toneLowpassHz: 3600,
    shimmerBandHz: 5800,
    baseMixMultiplier: 0.31,
    fadeInMs: 360,
    fadeOutMs: 270,
  },
} as const;

export const getRarityAmbienceProfile = (rarity: ResultAmbienceRarity): RarityAmbienceProfile =>
  RARITY_AMBIENCE_PROFILES[rarity];

export const getAudioCuePresentationDirective = (cue: SfxCue): AudioCuePresentationDirective => {
  switch (cue) {
    case 'pouch-grab':
      return {
        clearPersistent: true,
        duck: { multiplier: 0.8, attackMs: 18, holdMs: 70, releaseMs: 180 },
      };
    case 'tear':
      return {
        clearPersistent: true,
        duck: { multiplier: 0.62, attackMs: 18, holdMs: 120, releaseMs: 300 },
      };
    case 'reveal-pop':
      return {
        clearPersistent: true,
        duck: { multiplier: 0.35, attackMs: 10, holdMs: 210, releaseMs: 420 },
      };
    case 'common':
      return {
        clearPersistent: true,
        duck: { multiplier: 0.82, attackMs: 10, holdMs: 55, releaseMs: 170 },
      };
    case 'rare':
      return {
        clearPersistent: true,
        duck: { multiplier: 0.74, attackMs: 10, holdMs: 70, releaseMs: 190 },
      };
    case 'epic':
      return {
        clearPersistent: true,
        duck: { multiplier: 0.66, attackMs: 10, holdMs: 95, releaseMs: 230 },
      };
    case 'legendary':
      return {
        clearPersistent: true,
        duck: { multiplier: 0.56, attackMs: 10, holdMs: 125, releaseMs: 270 },
      };
    case 'hidden-pocket':
      return {
        duck: { multiplier: 0.52, attackMs: 10, holdMs: 150, releaseMs: 280 },
      };
    case 'secret-reveal':
      return {
        clearPersistent: true,
        duck: { multiplier: 0.28, attackMs: 10, holdMs: 280, releaseMs: 450 },
      };
    case 'new-discovery':
      return {
        duck: { multiplier: 0.62, attackMs: 8, holdMs: 90, releaseMs: 220 },
      };
    case 'duplicate':
      return {
        duck: { multiplier: 0.78, attackMs: 10, holdMs: 50, releaseMs: 150 },
      };
    case 'signal-gain':
      return {
        duck: { multiplier: 0.84, attackMs: 8, holdMs: 40, releaseMs: 120 },
      };
    case 'signal-lock':
      return {
        duck: { multiplier: 0.68, attackMs: 8, holdMs: 90, releaseMs: 220 },
      };
    case 'collection-complete':
      return {
        duck: { multiplier: 0.55, attackMs: 12, holdMs: 180, releaseMs: 300 },
      };
    default:
      return {};
  }
};
