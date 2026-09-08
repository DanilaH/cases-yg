import type { SfxCue } from './audioAssets';

export type ResultAmbienceRarity = 'common' | 'rare' | 'epic' | 'legendary' | 'secret';
export type PersistentResultAmbience = Exclude<ResultAmbienceRarity, 'common'>;

export interface BaseAmbienceProfile {
  busGain: number;
  roomNoiseGain: number;
  humGain: number;
  padGain: number;
  shimmerGain: number;
  fadeInMs: number;
  padFrequencies: readonly number[];
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

export const BASE_AMBIENCE_PROFILE: Readonly<BaseAmbienceProfile> = {
  busGain: 0.3,
  roomNoiseGain: 0.05,
  humGain: 0.016,
  padGain: 0.022,
  shimmerGain: 0.005,
  fadeInMs: 650,
  padFrequencies: [110, 164.81, 220],
} as const;

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
    fadeOutMs: 180,
  },
  rare: {
    enabled: true,
    busGain: 0.24,
    toneGain: 0.026,
    shimmerGain: 0.004,
    toneFrequencies: [164.81, 329.63],
    pulseRateHz: 0.13,
    pulseDepth: 0.08,
    stereoSpread: 0.18,
    toneLowpassHz: 760,
    shimmerBandHz: 2500,
    baseMixMultiplier: 0.88,
    fadeInMs: 320,
    fadeOutMs: 180,
  },
  epic: {
    enabled: true,
    busGain: 0.28,
    toneGain: 0.03,
    shimmerGain: 0.006,
    toneFrequencies: [146.83, 293.66, 587.33],
    pulseRateHz: 0.16,
    pulseDepth: 0.11,
    stereoSpread: 0.28,
    toneLowpassHz: 980,
    shimmerBandHz: 3100,
    baseMixMultiplier: 0.76,
    fadeInMs: 300,
    fadeOutMs: 190,
  },
  legendary: {
    enabled: true,
    busGain: 0.34,
    toneGain: 0.034,
    shimmerGain: 0.008,
    toneFrequencies: [130.81, 261.63, 523.25],
    pulseRateHz: 0.14,
    pulseDepth: 0.15,
    stereoSpread: 0.38,
    toneLowpassHz: 1150,
    shimmerBandHz: 3600,
    baseMixMultiplier: 0.64,
    fadeInMs: 280,
    fadeOutMs: 210,
  },
  secret: {
    enabled: true,
    busGain: 0.38,
    toneGain: 0.038,
    shimmerGain: 0.011,
    toneFrequencies: [82.41, 164.81, 247, 494],
    pulseRateHz: 0.1,
    pulseDepth: 0.18,
    stereoSpread: 0.5,
    toneLowpassHz: 1280,
    shimmerBandHz: 4200,
    baseMixMultiplier: 0.48,
    fadeInMs: 340,
    fadeOutMs: 240,
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
