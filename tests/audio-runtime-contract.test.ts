import { describe, expect, it } from 'vitest';

import { getAudioCuePresentationDirective, getRarityAmbienceProfile } from '../src/game/data/audioPresentation';

describe('audio runtime contract', () => {
  it('keeps persistent result ambience lifecycle bounded', () => {
    for (const rarity of ['rare', 'epic', 'legendary', 'secret'] as const) {
      const profile = getRarityAmbienceProfile(rarity);
      expect(profile.fadeInMs).toBeGreaterThanOrEqual(200);
      expect(profile.fadeInMs).toBeLessThanOrEqual(400);
      expect(profile.fadeOutMs).toBeGreaterThanOrEqual(150);
      expect(profile.fadeOutMs).toBeLessThanOrEqual(300);
      expect(profile.pulseDepth).toBeLessThanOrEqual(0.2);
      expect(profile.stereoSpread).toBeLessThanOrEqual(0.5);
    }
  });

  it('does not turn ordinary UI into ambience state changes', () => {
    for (const cue of ['ui-click', 'ui-skip', 'carousel-switch', 'pouch-select', 'ui-denied', 'charged-spend', 'chip-clack'] as const) {
      const directive = getAudioCuePresentationDirective(cue);
      expect(directive.persistent).toBeUndefined();
      expect(directive.clearPersistent).toBeUndefined();
    }
  });

  it('keeps Secret as the strongest persistent state without making it full-scale', () => {
    const legendary = getRarityAmbienceProfile('legendary');
    const secret = getRarityAmbienceProfile('secret');
    expect(secret.busGain).toBeGreaterThan(legendary.busGain);
    expect(secret.shimmerGain).toBeGreaterThan(legendary.shimmerGain);
    expect(secret.baseMixMultiplier).toBeLessThan(legendary.baseMixMultiplier);
    expect(legendary.baseMixMultiplier).toBeLessThanOrEqual(0.48);
    expect(secret.baseMixMultiplier).toBeLessThanOrEqual(0.36);
    expect(secret.fadeOutMs).toBeGreaterThan(legendary.fadeOutMs);
    expect(secret.busGain).toBeLessThan(0.5);
  });
});
