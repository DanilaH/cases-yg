import { describe, expect, it } from 'vitest';

import {
  BASE_AMBIENCE_PROFILE,
  CHIP_PITCH_PROFILE,
  DRAG_TEXTURE_PROFILE,
  ONE_SHOT_PITCH_VARIATION,
  getAudioCuePresentationDirective,
  getChipPitchMultiplier,
  getOneShotPitchVariation,
  getDragTextureMix,
  getRarityAmbienceProfile,
  getRevealAnticipationAudioProfile,
} from '../src/game/data/audioPresentation';

describe('audio presentation', () => {
  it('keeps the base bed calm and away from server-room pressure', () => {
    expect(BASE_AMBIENCE_PROFILE.busGain).toBeLessThanOrEqual(0.22);
    expect(BASE_AMBIENCE_PROFILE.roomNoiseGain).toBeLessThanOrEqual(0.015);
    expect(BASE_AMBIENCE_PROFILE.humGain).toBe(0);
    expect(BASE_AMBIENCE_PROFILE.roomHighpassHz).toBeGreaterThanOrEqual(120);
    expect(BASE_AMBIENCE_PROFILE.padFrequencies).toHaveLength(3);
    expect(Math.min(...BASE_AMBIENCE_PROFILE.padFrequencies)).toBeGreaterThanOrEqual(170);
    expect(BASE_AMBIENCE_PROFILE.fadeInMs).toBeGreaterThanOrEqual(700);
  });

  it('keeps base ambience motion slow, asynchronous and bounded', () => {
    expect(BASE_AMBIENCE_PROFILE.padMotionRateHz).toBeGreaterThan(0);
    expect(BASE_AMBIENCE_PROFILE.padMotionRateHz).toBeLessThanOrEqual(0.05);
    expect(BASE_AMBIENCE_PROFILE.shimmerMotionRateHz).toBeGreaterThan(0);
    expect(BASE_AMBIENCE_PROFILE.shimmerMotionRateHz).toBeLessThanOrEqual(0.05);
    expect(BASE_AMBIENCE_PROFILE.shimmerMotionRateHz).not.toBe(BASE_AMBIENCE_PROFILE.padMotionRateHz);
    expect(BASE_AMBIENCE_PROFILE.padFilterSweepHz).toBeLessThanOrEqual(180);
    expect(BASE_AMBIENCE_PROFILE.shimmerMotionDepth).toBeLessThanOrEqual(0.35);
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
    expect(rare.baseMixMultiplier).toBeLessThanOrEqual(0.72);
    expect(epic.baseMixMultiplier).toBeLessThanOrEqual(0.6);
    expect(legendary.baseMixMultiplier).toBeLessThanOrEqual(0.48);
    expect(secret.baseMixMultiplier).toBeLessThanOrEqual(0.36);
    expect(Math.min(...rare.toneFrequencies)).toBeGreaterThanOrEqual(350);
    expect(Math.min(...secret.toneFrequencies)).toBeGreaterThanOrEqual(280);
  });

  it('promotes the approved Secret family into Legendary and extends Secret upward', () => {
    const legendary = getRarityAmbienceProfile('legendary');
    const secret = getRarityAmbienceProfile('secret');

    expect(legendary.toneFrequencies).toEqual([293.66, 440, 659.25, 880, 1174.66]);
    expect(secret.toneFrequencies.slice(0, legendary.toneFrequencies.length)).toEqual(legendary.toneFrequencies);
    expect(Math.max(...secret.toneFrequencies)).toBeGreaterThan(Math.max(...legendary.toneFrequencies));
    expect(secret.shimmerGain).toBeGreaterThan(legendary.shimmerGain);
    expect(secret.shimmerBandHz).toBeGreaterThan(legendary.shimmerBandHz);
    expect(secret.stereoSpread).toBeGreaterThan(legendary.stereoSpread);
  });

  it('uses slow spectral colour motion and a restrained intro crest for rarity holds', () => {
    for (const rarity of ['rare', 'epic', 'legendary', 'secret'] as const) {
      const profile = getRarityAmbienceProfile(rarity);
      expect(profile.motionRateHz).toBeGreaterThanOrEqual(0.025);
      expect(profile.motionRateHz).toBeLessThanOrEqual(0.05);
      expect(profile.toneFilterMotionHz).toBeGreaterThan(0);
      expect(profile.shimmerBandMotionHz).toBeGreaterThan(0);
      expect(profile.shimmerMotionDepth).toBeGreaterThan(0);
      expect(profile.shimmerMotionDepth).toBeLessThanOrEqual(0.3);
      expect(profile.introPeakMultiplier).toBeGreaterThan(1);
      expect(profile.introPeakMultiplier).toBeLessThanOrEqual(1.2);
      expect(profile.introPeakMs + profile.introSettleMs).toBeLessThanOrEqual(700);
    }
  });

  it('keeps one-shot pitch variation subtle and gives CHIPS one bounded rising contour', () => {
    expect(ONE_SHOT_PITCH_VARIATION.defaultAmount).toBeLessThanOrEqual(0.03);
    expect(ONE_SHOT_PITCH_VARIATION.uiAmount).toBeLessThanOrEqual(0.04);
    expect(ONE_SHOT_PITCH_VARIATION.tonalAmount).toBeLessThanOrEqual(0.02);
    expect(getOneShotPitchVariation('ui-click')).toBeGreaterThan(getOneShotPitchVariation('legendary'));
    expect(getOneShotPitchVariation('chip-clack')).toBe(0);
    expect(getOneShotPitchVariation('pouch-grab')).toBe(0);

    const start = getChipPitchMultiplier(0, 0.5);
    const middle = getChipPitchMultiplier(0.5, 0.5);
    const end = getChipPitchMultiplier(1, 0.5);
    expect(start).toBeCloseTo(CHIP_PITCH_PROFILE.startMultiplier);
    expect(start).toBeLessThan(middle);
    expect(middle).toBeLessThan(end);
    expect(end).toBeCloseTo(CHIP_PITCH_PROFILE.endMultiplier);
    expect(getChipPitchMultiplier(1, 1)).toBeLessThanOrEqual(1.2);
  });

  it('keeps transient rarity cues transient so stable result state owns ambience', () => {
    for (const cue of ['common', 'rare', 'epic', 'legendary', 'secret-reveal'] as const) {
      const directive = getAudioCuePresentationDirective(cue);
      expect(directive.persistent).toBeUndefined();
      expect(directive.persistentDelayMs).toBeUndefined();
    }
  });

  it('gives NEW discovery a separate foreground beat without creating persistent ambience', () => {
    const discovery = getAudioCuePresentationDirective('new-discovery');
    const duplicate = getAudioCuePresentationDirective('duplicate');
    const signal = getAudioCuePresentationDirective('signal-gain');

    expect(discovery.persistent).toBeUndefined();
    expect(discovery.clearPersistent).toBeUndefined();
    expect(discovery.duck?.multiplier).toBeLessThan(duplicate.duck!.multiplier);
    expect(discovery.duck?.multiplier).toBeLessThan(signal.duck!.multiplier);
  });

  it('keeps continuous drag texture quiet, responsive and bounded', () => {
    const idle = getDragTextureMix(0, 0);
    const slowMid = getDragTextureMix(0.5, 0.15);
    const fastMid = getDragTextureMix(0.5, 0.9);
    const end = getDragTextureMix(1, 1);

    expect(DRAG_TEXTURE_PROFILE.maxGain).toBe(0.01);
    expect(DRAG_TEXTURE_PROFILE.idleReleaseMs).toBeLessThanOrEqual(110);
    expect(DRAG_TEXTURE_PROFILE.releaseMs).toBeLessThanOrEqual(70);
    expect(DRAG_TEXTURE_PROFILE.progressWeight + DRAG_TEXTURE_PROFILE.velocityWeight).toBeCloseTo(1);
    expect(idle.gain).toBe(DRAG_TEXTURE_PROFILE.minGain);
    expect(slowMid.gain).toBeGreaterThan(idle.gain);
    expect(fastMid.gain).toBeGreaterThan(slowMid.gain);
    expect(fastMid.bandHz).toBeGreaterThan(slowMid.bandHz);
    expect(end.gain).toBeLessThanOrEqual(DRAG_TEXTURE_PROFILE.maxGain);
    expect(end.bandHz).toBeLessThanOrEqual(DRAG_TEXTURE_PROFILE.maxBandHz);
  });

  it('clears stale result ambience before a new physical/reveal cycle', () => {
    expect(getAudioCuePresentationDirective('pouch-grab').clearPersistent).toBe(true);
    expect(getAudioCuePresentationDirective('tear').clearPersistent).toBe(true);
    expect(getAudioCuePresentationDirective('reveal-pop').clearPersistent).toBe(true);
  });

  it('reserves deliberate pre-reveal silence for Epic and above', () => {
    const common = getRevealAnticipationAudioProfile('common');
    const rare = getRevealAnticipationAudioProfile('rare');
    const epic = getRevealAnticipationAudioProfile('epic');
    const legendary = getRevealAnticipationAudioProfile('legendary');
    const secret = getRevealAnticipationAudioProfile('secret');

    expect(common.enabled).toBe(false);
    expect(rare.enabled).toBe(false);
    expect(epic.enabled).toBe(true);
    expect(epic.multiplier).toBeGreaterThan(legendary.multiplier);
    expect(legendary.multiplier).toBeGreaterThan(secret.multiplier);
    expect(secret.multiplier).toBeLessThanOrEqual(0.1);
    expect(epic.releaseMs).toBeLessThanOrEqual(secret.releaseMs);
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
