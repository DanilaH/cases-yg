import type { StandardRarity } from './collectibles';

/** Presentation-only choreography; rewards, odds and save state never depend on it. */
export interface PouchImpactProfile {
  vignettePulses: number;
  vignetteAlpha: number;
  pulseHalfMs: number;
  pulseGapMs: number;
  recoilScale: number;
  recoilY: number;
  recoilMs: number;
  reboundScale: number;
  reboundY: number;
  reboundMs: number;
  settleMs: number;
  joltX: number;
  jolts: number;
  crackDurationMs: number;
  crackStrength: number;
  fallingFragments: number;
  lateralSparks: number;
}

export const RARITY_POUCH_IMPACT: Readonly<Record<StandardRarity | 'secret', PouchImpactProfile>> = {
  common: {
    vignettePulses: 1, vignetteAlpha: 0.46, pulseHalfMs: 100, pulseGapMs: 0,
    recoilScale: 0.98, recoilY: 5, recoilMs: 65,
    reboundScale: 1.012, reboundY: -2, reboundMs: 84, settleMs: 68,
    joltX: 0.8, jolts: 1,
    crackDurationMs: 160, crackStrength: 0.48, fallingFragments: 3, lateralSparks: 0,
  },
  rare: {
    vignettePulses: 2, vignetteAlpha: 0.57, pulseHalfMs: 100, pulseGapMs: 36,
    recoilScale: 0.969, recoilY: 7, recoilMs: 79,
    reboundScale: 1.022, reboundY: -3, reboundMs: 94, settleMs: 80,
    joltX: 1.5, jolts: 1,
    crackDurationMs: 220, crackStrength: 0.70, fallingFragments: 8, lateralSparks: 0,
  },
  epic: {
    vignettePulses: 3, vignetteAlpha: 0.69, pulseHalfMs: 94, pulseGapMs: 34,
    recoilScale: 0.953, recoilY: 10, recoilMs: 94,
    reboundScale: 1.032, reboundY: -5, reboundMs: 108, settleMs: 88,
    joltX: 2.6, jolts: 2,
    crackDurationMs: 270, crackStrength: 0.89, fallingFragments: 11, lateralSparks: 5,
  },
  legendary: {
    vignettePulses: 4, vignetteAlpha: 0.84, pulseHalfMs: 88, pulseGapMs: 28,
    recoilScale: 0.935, recoilY: 14, recoilMs: 112,
    reboundScale: 1.043, reboundY: -7, reboundMs: 126, settleMs: 102,
    joltX: 3.8, jolts: 2,
    crackDurationMs: 320, crackStrength: 1, fallingFragments: 14, lateralSparks: 14,
  },
  // Secret is a second reveal AFTER the pouch has already left the scene.
  // Only its distinct vignette beat is used; never replay the pouch motion.
  secret: {
    vignettePulses: 3, vignetteAlpha: 0.94, pulseHalfMs: 108, pulseGapMs: 46,
    recoilScale: 1, recoilY: 0, recoilMs: 0,
    reboundScale: 1, reboundY: 0, reboundMs: 0, settleMs: 0,
    joltX: 0, jolts: 0,
    crackDurationMs: 0, crackStrength: 0, fallingFragments: 0, lateralSparks: 0,
  },
} as const;
