from pathlib import Path


def replace_once(text: str, old: str, new: str, label: str) -> str:
    if old not in text:
        raise SystemExit(f'missing anchor: {label}')
    return text.replace(old, new, 1)

# audioAssets.ts
p = Path('src/game/data/audioAssets.ts')
t = p.read_text()
t = replace_once(t, """  'ui-click',
  'ui-skip',
  'pouch-select',
""", """  'ui-click',
  'ui-skip',
  'carousel-switch',
  'pouch-select',
""", 'carousel cue list')
t = replace_once(t, """  'ui-click': 'assets/audio/ui-click.mp3',
  'ui-skip': 'assets/audio/ui-skip.mp3',
  'pouch-select': 'assets/audio/pouch-select.mp3',
""", """  'ui-click': 'assets/audio/ui-click.mp3',
  'ui-skip': 'assets/audio/ui-skip.mp3',
  'carousel-switch': 'assets/audio/carousel-switch.mp3',
  'pouch-select': 'assets/audio/pouch-select.mp3',
""", 'carousel asset path')
p.write_text(t)

# audioPresentation.ts
p = Path('src/game/data/audioPresentation.ts')
t = p.read_text()
t = replace_once(t, """export interface BaseAmbienceProfile {
  busGain: number;
  roomNoiseGain: number;
  humGain: number;
  padGain: number;
  shimmerGain: number;
  fadeInMs: number;
  padFrequencies: readonly number[];
}
""", """export interface BaseAmbienceProfile {
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
""", 'audio profile interfaces')

old_base = """export const BASE_AMBIENCE_PROFILE: Readonly<BaseAmbienceProfile> = {
  busGain: 0.3,
  roomNoiseGain: 0.05,
  humGain: 0.016,
  padGain: 0.022,
  shimmerGain: 0.005,
  fadeInMs: 650,
  padFrequencies: [110, 164.81, 220],
} as const;
"""
new_base = """export const BASE_AMBIENCE_PROFILE: Readonly<BaseAmbienceProfile> = {
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
"""
t = replace_once(t, old_base, new_base, 'base ambience direction')

start = t.index("export const RARITY_AMBIENCE_PROFILES:")
end = t.index("export const getRarityAmbienceProfile", start)
new_rarity = """export const RARITY_AMBIENCE_PROFILES: Readonly<Record<ResultAmbienceRarity, RarityAmbienceProfile>> = {
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

"""
t = t[:start] + new_rarity + t[end:]
p.write_text(t)

# audio.ts
p = Path('src/game/systems/audio.ts')
t = p.read_text()
t = replace_once(t, """  BASE_AMBIENCE_PROFILE,
  DRAG_TEXTURE_PROFILE,
  getAudioCuePresentationDirective,
""", """  BASE_AMBIENCE_PROFILE,
  DRAG_TEXTURE_PROFILE,
  getAudioCuePresentationDirective,
  getChipPitchMultiplier,
  getOneShotPitchVariation,
""", 'audio helper imports')
t = replace_once(t, """  'ui-skip': [
    { frequency: 1480, endFrequency: 920, duration: 0.042, type: 'square', gain: 0.026 },
    { frequency: 1840, duration: 0.026, type: 'triangle', gain: 0.015, delay: 0.018 },
  ],
  'pouch-select': [
""", """  'ui-skip': [
    { frequency: 1480, endFrequency: 920, duration: 0.042, type: 'square', gain: 0.026 },
    { frequency: 1840, duration: 0.026, type: 'triangle', gain: 0.015, delay: 0.018 },
  ],
  'carousel-switch': [
    { frequency: 720, endFrequency: 810, duration: 0.038, type: 'triangle', gain: 0.014 },
    { frequency: 1080, endFrequency: 980, duration: 0.026, type: 'sine', gain: 0.008, delay: 0.012 },
  ],
  'pouch-select': [
""", 'carousel synth cue')
t = t.replace("  private chipClackIndex = 0;\n", "", 1)

# Add public chip-clack API after play()
anchor = """  public play(cue: SfxCue): void {
    if (this.muted || this.blocked || typeof AudioContext === 'undefined') return;

    const context = this.getContext();
    if (!context) return;

    if (context.state === 'suspended') {
      void context.resume().then(() => this.schedule(context, cue)).catch(() => undefined);
      return;
    }

    this.schedule(context, cue);
  }
"""
addition = anchor + """

  public playChipClack(progress: number): void {
    if (this.muted || this.blocked || typeof AudioContext === 'undefined') return;
    const context = this.getContext();
    if (!context) return;
    const schedule = (): void => {
      if (this.muted || this.blocked || context.state !== 'running') return;
      this.applyPresentationCue(context, 'chip-clack');
      this.scheduleChipClack(context, progress);
    };
    if (context.state === 'suspended') {
      void context.resume().then(schedule).catch(() => undefined);
      return;
    }
    schedule();
  }
"""
t = replace_once(t, anchor, addition, 'chip clack public API')

# pitch-aware schedule
old_schedule_head = """    this.applyPresentationCue(context, cue);

    const sample = this.samples.get(cue);
    if (sample) {
      const source = context.createBufferSource();
      const gain = context.createGain();
      const start = context.currentTime;
      const tail = Math.min(0.12, Math.max(0.05, sample.duration * 0.1));
      const fadeStart = start + Math.max(0, sample.duration - tail);
      source.buffer = sample;
      gain.gain.setValueAtTime(0.72, start);
      gain.gain.setValueAtTime(0.72, fadeStart);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + sample.duration);
      source.connect(gain);
      gain.connect(context.destination);
      source.start(start);
      return;
    }

    if (cue === 'chip-clack') {
      this.scheduleChipClack(context);
      return;
    }
    if (cue === 'pouch-grab') {
      this.schedulePouchGrab(context);
      return;
    }

    const now = context.currentTime;
    for (const spec of CUES[cue]) {
      const start = now + (spec.delay ?? 0);
      const end = start + spec.duration;
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = spec.type;
      oscillator.frequency.setValueAtTime(spec.frequency, start);
      if (spec.endFrequency !== undefined) {
        oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, spec.endFrequency), end);
      }
"""
new_schedule_head = """    this.applyPresentationCue(context, cue);
    const variation = getOneShotPitchVariation(cue);
    const pitchFactor = 1 + (Math.random() * 2 - 1) * variation;

    const sample = this.samples.get(cue);
    if (sample) {
      const source = context.createBufferSource();
      const gain = context.createGain();
      const start = context.currentTime;
      const playbackDuration = sample.duration / Math.max(0.5, pitchFactor);
      const tail = Math.min(0.12, Math.max(0.05, playbackDuration * 0.1));
      const fadeStart = start + Math.max(0, playbackDuration - tail);
      source.buffer = sample;
      source.playbackRate.setValueAtTime(pitchFactor, start);
      gain.gain.setValueAtTime(0.72, start);
      gain.gain.setValueAtTime(0.72, fadeStart);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + playbackDuration);
      source.connect(gain);
      gain.connect(context.destination);
      source.start(start);
      return;
    }

    if (cue === 'chip-clack') {
      this.scheduleChipClack(context, 0.5);
      return;
    }
    if (cue === 'pouch-grab') {
      this.schedulePouchGrab(context, pitchFactor);
      return;
    }

    const now = context.currentTime;
    for (const spec of CUES[cue]) {
      const start = now + (spec.delay ?? 0);
      const end = start + spec.duration;
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = spec.type;
      oscillator.frequency.setValueAtTime(spec.frequency * pitchFactor, start);
      if (spec.endFrequency !== undefined) {
        oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, spec.endFrequency * pitchFactor), end);
      }
"""
t = replace_once(t, old_schedule_head, new_schedule_head, 'pitch aware scheduler')

# Calm base ambience implementation
old_room_filters = """    const roomLow = context.createBiquadFilter();
    roomLow.type = 'lowpass';
    roomLow.frequency.setValueAtTime(1450, now);
    roomLow.Q.setValueAtTime(0.55, now);
    const roomHigh = context.createBiquadFilter();
    roomHigh.type = 'highpass';
    roomHigh.frequency.setValueAtTime(38, now);
    const roomGain = context.createGain();
    roomGain.gain.setValueAtTime(BASE_AMBIENCE_PROFILE.roomNoiseGain, now);
"""
new_room_filters = """    const roomLow = context.createBiquadFilter();
    roomLow.type = 'lowpass';
    roomLow.frequency.setValueAtTime(BASE_AMBIENCE_PROFILE.roomLowpassHz, now);
    roomLow.Q.setValueAtTime(0.38, now);
    const roomHigh = context.createBiquadFilter();
    roomHigh.type = 'highpass';
    roomHigh.frequency.setValueAtTime(BASE_AMBIENCE_PROFILE.roomHighpassHz, now);
    const roomGain = context.createGain();
    roomGain.gain.setValueAtTime(BASE_AMBIENCE_PROFILE.roomNoiseGain, now);
"""
t = replace_once(t, old_room_filters, new_room_filters, 'calm room filters')
old_hum = """    const humFilter = context.createBiquadFilter();
    humFilter.type = 'lowpass';
    humFilter.frequency.setValueAtTime(230, now);
    humFilter.Q.setValueAtTime(0.7, now);
    humFilter.connect(bus);
    const humFrequencies = [55, 110] as const;
    humFrequencies.forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = index === 0 ? 'sine' : 'triangle';
      oscillator.frequency.setValueAtTime(frequency, now);
      gain.gain.setValueAtTime(BASE_AMBIENCE_PROFILE.humGain / humFrequencies.length, now);
      oscillator.connect(gain);
      gain.connect(humFilter);
      oscillator.start(now);
    });

"""
new_hum = """    // The original 55/110 Hz transformer layer read as a server-room fan in
    // headphones. Keep the profile field for tuneability, but do not construct
    // a machine-hum layer when the reviewed profile disables it.
    if (BASE_AMBIENCE_PROFILE.humGain > 0) {
      const hum = context.createOscillator();
      const humGain = context.createGain();
      hum.type = 'sine';
      hum.frequency.setValueAtTime(146.83, now);
      humGain.gain.setValueAtTime(BASE_AMBIENCE_PROFILE.humGain, now);
      hum.connect(humGain);
      humGain.connect(bus);
      hum.start(now);
    }

"""
t = replace_once(t, old_hum, new_hum, 'remove machine hum')
t = replace_once(t, """    padFilter.frequency.setValueAtTime(620, now);
    padFilter.Q.setValueAtTime(0.42, now);
""", """    padFilter.frequency.setValueAtTime(BASE_AMBIENCE_PROFILE.padLowpassHz, now);
    padFilter.Q.setValueAtTime(0.32, now);
""", 'pad filter')
t = replace_once(t, """      oscillator.type = index === 1 ? 'sine' : 'triangle';
      oscillator.frequency.setValueAtTime(frequency, now);
      oscillator.detune.setValueAtTime(index === 0 ? -4 : index === 1 ? 3 : 0, now);
""", """      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(frequency, now);
      oscillator.detune.setValueAtTime(index === 0 ? -2 : index === 1 ? 1.5 : 3, now);
""", 'soft pad oscillators')
t = replace_once(t, """    padLfo.frequency.setValueAtTime(0.028, now);
    padLfoDepth.gain.setValueAtTime(95, now);
""", """    padLfo.frequency.setValueAtTime(0.021, now);
    padLfoDepth.gain.setValueAtTime(120, now);
""", 'slower pad modulation')

# persistent rarity uses smooth sine family
old_tone = """      oscillator.type = index % 2 === 0 ? 'sine' : 'triangle';
      oscillator.frequency.setValueAtTime(frequency, now);
      oscillator.detune.setValueAtTime((index - (profile.toneFrequencies.length - 1) / 2) * 2.5, now);
"""
new_tone = """      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(frequency, now);
      oscillator.detune.setValueAtTime((index - (profile.toneFrequencies.length - 1) / 2) * 1.6, now);
"""
t = replace_once(t, old_tone, new_tone, 'calm rarity tones')
t = replace_once(t, """      shimmerBand.Q.setValueAtTime(rarity === 'secret' ? 0.9 : 1.25, now);
""", """      shimmerBand.Q.setValueAtTime(rarity === 'secret' ? 0.62 : 0.78, now);
""", 'soft rarity shimmer')

# pitch-aware pouch grab
old_grab_sig = """  private schedulePouchGrab(context: AudioContext): void {
    const now = context.currentTime;
"""
new_grab_sig = """  private schedulePouchGrab(context: AudioContext, pitchFactor: number): void {
    const now = context.currentTime;
"""
t = replace_once(t, old_grab_sig, new_grab_sig, 'pouch grab signature')
t = replace_once(t, """    band.frequency.setValueAtTime(3300, now);
""", """    band.frequency.setValueAtTime(3300 * pitchFactor, now);
""", 'pouch noise pitch')
t = replace_once(t, """    body.frequency.setValueAtTime(430, now + 0.004);
    body.frequency.exponentialRampToValueAtTime(255, now + 0.052);
""", """    body.frequency.setValueAtTime(430 * pitchFactor, now + 0.004);
    body.frequency.exponentialRampToValueAtTime(255 * pitchFactor, now + 0.052);
""", 'pouch body pitch')

# ascending chip clack
old_chip = """  private scheduleChipClack(context: AudioContext): void {
    const now = context.currentTime;
    const variants = [0.92, 1.04, 0.97, 1.09, 1.0] as const;
    const variant = variants[this.chipClackIndex % variants.length] ?? 1;
    this.chipClackIndex += 1;
"""
new_chip = """  private scheduleChipClack(context: AudioContext, progress: number): void {
    const now = context.currentTime;
    const variant = getChipPitchMultiplier(progress, Math.random());
"""
t = replace_once(t, old_chip, new_chip, 'ascending chip clack')
p.write_text(t)

# OpeningScene.ts
p = Path('src/game/scenes/OpeningScene.ts')
t = p.read_text()
# Carousel click only when index actually changes
old_carousel = """      if (gesture.startedInCarousel && this.resultCarouselItems.length > 1) {
        this.resultCarouselIndex = resolveCarouselIndex(
          this.resultCarouselIndex,
          this.resultCarouselItems.length,
          gesture.deltaX,
        );
        this.positionResultCarousel(0, true);
"""
new_carousel = """      if (gesture.startedInCarousel && this.resultCarouselItems.length > 1) {
        const previousIndex = this.resultCarouselIndex;
        this.resultCarouselIndex = resolveCarouselIndex(
          this.resultCarouselIndex,
          this.resultCarouselItems.length,
          gesture.deltaX,
        );
        if (this.resultCarouselIndex !== previousIndex) getGameAudio().play('carousel-switch');
        this.positionResultCarousel(0, true);
"""
t = replace_once(t, old_carousel, new_carousel, 'carousel switch cue')

# bankChipLeg signature and clack progress
old_bank_sig = """  private async bankChipLeg(
    targetValue: number,
    chargedReadyOnArrival: boolean,
  ): Promise<void> {
"""
new_bank_sig = """  private async bankChipLeg(
    targetValue: number,
    chargedReadyOnArrival: boolean,
    sequenceStartAmount: number,
    sequenceTotalAmount: number,
  ): Promise<void> {
"""
t = replace_once(t, old_bank_sig, new_bank_sig, 'bank leg signature')
t = replace_once(t, """            if (!fastForwarding && shouldPlayChipClack(plan, index)) getGameAudio().play('chip-clack');
""", """            if (!fastForwarding && shouldPlayChipClack(plan, index)) {
              const sequenceProgress =
                (sequenceStartAmount + arrived) / Math.max(1, sequenceTotalAmount);
              getGameAudio().playChipClack(sequenceProgress);
            }
""", 'chip pitch progress')

old_banking_setup = """    let nextValue = pending.chips.before - pending.chips.cost;
    const chargedCost = getChargedCost(LITE_V2_BALANCE);
    let readyShown = false;
    const bankLeg = async (amount: number): Promise<void> => {
      if (amount <= 0) return;
      const target = nextValue + amount;
      const crossesReady =
        !readyShown &&
        crossedChargedReadyThreshold(pending, LITE_V2_BALANCE) &&
        nextValue < chargedCost &&
        target >= chargedCost;
      await this.bankChipLeg(target, crossesReady);
      readyShown ||= crossesReady;
      nextValue = target;
    };
"""
new_banking_setup = """    let nextValue = pending.chips.before - pending.chips.cost;
    const totalBankAmount =
      pending.chips.base +
      pending.chips.cacheBonus +
      pending.chips.recycle +
      pending.chips.overchargeBonus +
      pending.chips.secretBonus;
    let bankedAmount = 0;
    const chargedCost = getChargedCost(LITE_V2_BALANCE);
    let readyShown = false;
    const bankLeg = async (amount: number): Promise<void> => {
      if (amount <= 0) return;
      const target = nextValue + amount;
      const crossesReady =
        !readyShown &&
        crossedChargedReadyThreshold(pending, LITE_V2_BALANCE) &&
        nextValue < chargedCost &&
        target >= chargedCost;
      await this.bankChipLeg(target, crossesReady, bankedAmount, totalBankAmount);
      readyShown ||= crossesReady;
      bankedAmount += amount;
      nextValue = target;
    };
"""
t = replace_once(t, old_banking_setup, new_banking_setup, 'global chip pitch contour')
p.write_text(t)

# audio presentation tests
p = Path('tests/audio-presentation.test.ts')
t = p.read_text()
t = replace_once(t, """  BASE_AMBIENCE_PROFILE,
  DRAG_TEXTURE_PROFILE,
  getAudioCuePresentationDirective,
""", """  BASE_AMBIENCE_PROFILE,
  CHIP_PITCH_PROFILE,
  DRAG_TEXTURE_PROFILE,
  ONE_SHOT_PITCH_VARIATION,
  getAudioCuePresentationDirective,
  getChipPitchMultiplier,
  getOneShotPitchVariation,
""", 'audio test imports')
t = replace_once(t, """  it('keeps the base bed restrained and non-melodic by construction', () => {
    expect(BASE_AMBIENCE_PROFILE.busGain).toBeLessThanOrEqual(0.3);
    expect(BASE_AMBIENCE_PROFILE.roomNoiseGain).toBeGreaterThan(BASE_AMBIENCE_PROFILE.shimmerGain);
    expect(BASE_AMBIENCE_PROFILE.padFrequencies).toHaveLength(3);
    expect(BASE_AMBIENCE_PROFILE.fadeInMs).toBeGreaterThanOrEqual(500);
  });
""", """  it('keeps the base bed calm and away from server-room pressure', () => {
    expect(BASE_AMBIENCE_PROFILE.busGain).toBeLessThanOrEqual(0.22);
    expect(BASE_AMBIENCE_PROFILE.roomNoiseGain).toBeLessThanOrEqual(0.015);
    expect(BASE_AMBIENCE_PROFILE.humGain).toBe(0);
    expect(BASE_AMBIENCE_PROFILE.roomHighpassHz).toBeGreaterThanOrEqual(120);
    expect(BASE_AMBIENCE_PROFILE.padFrequencies).toHaveLength(3);
    expect(Math.min(...BASE_AMBIENCE_PROFILE.padFrequencies)).toBeGreaterThanOrEqual(170);
    expect(BASE_AMBIENCE_PROFILE.fadeInMs).toBeGreaterThanOrEqual(700);
  });
""", 'base ambience test')
# Add stronger duck + calmer frequency checks after monotonic hierarchy test
anchor_test = """    expect(legendary.baseMixMultiplier).toBeGreaterThan(secret.baseMixMultiplier);
  });
"""
replacement_test = """    expect(legendary.baseMixMultiplier).toBeGreaterThan(secret.baseMixMultiplier);
    expect(rare.baseMixMultiplier).toBeLessThanOrEqual(0.72);
    expect(epic.baseMixMultiplier).toBeLessThanOrEqual(0.6);
    expect(legendary.baseMixMultiplier).toBeLessThanOrEqual(0.48);
    expect(secret.baseMixMultiplier).toBeLessThanOrEqual(0.36);
    expect(Math.min(...rare.toneFrequencies)).toBeGreaterThanOrEqual(350);
    expect(Math.min(...secret.toneFrequencies)).toBeGreaterThanOrEqual(280);
  });

  it('keeps one-shot pitch variation subtle and gives CHIPS one bounded rising contour', () => {
    expect(ONE_SHOT_PITCH_VARIATION.defaultAmount).toBeLessThanOrEqual(0.03);
    expect(ONE_SHOT_PITCH_VARIATION.uiAmount).toBeLessThanOrEqual(0.04);
    expect(ONE_SHOT_PITCH_VARIATION.tonalAmount).toBeLessThanOrEqual(0.02);
    expect(getOneShotPitchVariation('ui-click')).toBeGreaterThan(getOneShotPitchVariation('legendary'));
    expect(getOneShotPitchVariation('chip-clack')).toBe(0);

    const start = getChipPitchMultiplier(0, 0.5);
    const middle = getChipPitchMultiplier(0.5, 0.5);
    const end = getChipPitchMultiplier(1, 0.5);
    expect(start).toBeCloseTo(CHIP_PITCH_PROFILE.startMultiplier);
    expect(start).toBeLessThan(middle);
    expect(middle).toBeLessThan(end);
    expect(end).toBeCloseTo(CHIP_PITCH_PROFILE.endMultiplier);
    expect(getChipPitchMultiplier(1, 1)).toBeLessThanOrEqual(1.2);
  });
"""
t = replace_once(t, anchor_test, replacement_test, 'audio pitch tests')
p.write_text(t)

# runtime contract: carousel is ordinary UI, stronger base duck guard
p = Path('tests/audio-runtime-contract.test.ts')
t = p.read_text()
t = replace_once(t, """    for (const cue of ['ui-click', 'ui-skip', 'pouch-select', 'ui-denied', 'charged-spend', 'chip-clack'] as const) {
""", """    for (const cue of ['ui-click', 'ui-skip', 'carousel-switch', 'pouch-select', 'ui-denied', 'charged-spend', 'chip-clack'] as const) {
""", 'runtime carousel contract')
t = replace_once(t, """    expect(secret.baseMixMultiplier).toBeLessThan(legendary.baseMixMultiplier);
""", """    expect(secret.baseMixMultiplier).toBeLessThan(legendary.baseMixMultiplier);
    expect(legendary.baseMixMultiplier).toBeLessThanOrEqual(0.48);
    expect(secret.baseMixMultiplier).toBeLessThanOrEqual(0.36);
""", 'runtime stronger duck contract')
p.write_text(t)

print('hands-on audio correction applied')
