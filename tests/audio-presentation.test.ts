import { describe, expect, it } from 'vitest';

import {
  BASE_AMBIENCE_PROFILE,
  getAudioCuePresentationDirective,
  getRarityAmbienceProfile,
} from '../src/game/data/audioPresentation';

describe('audio presentation', () => {
  it('keeps the base bed restrained and non-melodic by construction', () => {
    expect(BASE_AMBIENCE_PROFILE.busGain).toBeLessThanOrEqual(0.3);
    expect(BASE_AMBIENCE_PROFILE.roomNoiseGain).toBeGreaterThan(BASE_AMBIENCE_PROFILE.shimmerGain);
    expect(BASE_AMBIENCE_PROFILE.padFrequencies).toHaveLength(3);
    expect(BASE_AMBIENCE_PROFILE.fadeInMs).toBeGreaterThanOrEqual(500);
  });

  it('keeps Common clean and tiers persistent rarity presence through density and mix', () => {
    const common = getRarityAmbienceProfile('common');
    const rare = getRarityAmbienceProfile('rare');
    const epic = getRarityAmbienceProfile('epic');
    const legendary = getRarityAmbienceProfile('legendary');
    const secret = getRarityAmbienceProfile('secret');

    expect(common.enabled).toBe(false);
    expect(rare.enabled).toBe(true);
    expect(rare.busGain).toBeLessThan(epic.busGain);
    expect(epic.busGain).toBeLessThan(legendary.busGain);
    expect(legendary.busGain).toBeLessThan(secret.busGain);
    expect(rare.toneFrequencies.length).toBeLessThanOrEqual(epic.toneFrequencies.length);
    expect(legendary.toneFrequencies.length).toBeLessThan(secret.toneFrequencies.length);
    expect(rare.baseMixMultiplier).toBeGreaterThan(epic.baseMixMultiplier);
    expect(epic.baseMixMultiplier).toBeGreaterThan(legendary.baseMixMultiplier);
    expect(legendary.baseMixMultiplier).toBeGreaterThan(secret.baseMixMultiplier);
  });

  it('keeps transient rarity cues transient so stable result state owns ambience', () => {
    for (const cue of ['common', 'rare', 'epic', 'legendary', 'secret-reveal'] as const) {
      const directive = getAudioCuePresentationDirective(cue);
      expect(directive.persistent).toBeUndefined();
      expect(directive.persistentDelayMs).toBeUndefined();
    }
  });

  it('clears stale result ambience before a new physical/reveal cycle', () => {
    expect(getAudioCuePresentationDirective('pouch-grab').clearPersistent).toBe(true);
    expect(getAudioCuePresentationDirective('tear').clearPersistent).toBe(true);
    expect(getAudioCuePresentationDirective('reveal-pop').clearPersistent).toBe(true);
  });

  it('uses silence/duck hierarchy instead of simply stacking louder transients', () => {
    const grab = getAudioCuePresentationDirective('pouch-grab').duck!;
    const reveal = getAudioCuePresentationDirective('reveal-pop').duck!;
    const secret = getAudioCuePresentationDirective('secret-reveal').duck!;

    expect(reveal.multiplier).toBeLessThan(grab.multiplier);
    expect(secret.multiplier).toBeLessThan(reveal.multiplier);
    expect(secret.holdMs).toBeGreaterThan(reveal.holdMs);
  });
});
