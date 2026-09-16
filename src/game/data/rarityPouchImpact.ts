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
}

export const RARITY_POUCH_IMPACT: Readonly<Record<StandardRarity | 'secret', PouchImpactProfile>> = {
  common: {
    vignettePulses: 1, vignetteAlpha: 0.36, pulseHalfMs: 68, pulseGapMs: 0,
    recoilScale: 0.98, recoilY: 5, recoilMs: 65,
    reboundScale: 1.012, reboundY: -2, reboundMs: 84, settleMs: 68,
    joltX: 0.8, jolts: 1,
  },
  rare: {
    vignettePulses: 2, vignetteAlpha: 0.49, pulseHalfMs: 73, pulseGapMs: 24,
    recoilScale: 0.969, recoilY: 7, recoilMs: 79,
    reboundScale: 1.022, reboundY: -3, reboundMs: 94, settleMs: 80,
    joltX: 1.5, jolts: 1,
  },
  epic: {
    vignettePulses: 2, vignetteAlpha: 0.66, pulseHalfMs: 78, pulseGapMs: 28,
    recoilScale: 0.953, recoilY: 10, recoilMs: 94,
    reboundScale: 1.032, reboundY: -5, reboundMs: 108, settleMs: 88,
    joltX: 2.6, jolts: 2,
  },
  legendary: {
    vignettePulses: 3, vignetteAlpha: 0.84, pulseHalfMs: 82, pulseGapMs: 30,
    recoilScale: 0.935, recoilY: 14, recoilMs: 112,
    reboundScale: 1.043, reboundY: -7, reboundMs: 126, settleMs: 102,
    joltX: 3.8, jolts: 2,
  },
  // Secret is a second reveal AFTER the pouch has already left the scene.
  // Only its distinct vignette beat is used; never replay the pouch motion.
  secret: {
    vignettePulses: 2, vignetteAlpha: 0.94, pulseHalfMs: 96, pulseGapMs: 45,
    recoilScale: 1, recoilY: 0, recoilMs: 0,
    reboundScale: 1, reboundY: 0, reboundMs: 0, settleMs: 0,
    joltX: 0, jolts: 0,
  },
} as const;
