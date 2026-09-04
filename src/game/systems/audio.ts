import type { RuntimeSfxAsset, SfxCue } from '../data/audioAssets';

export type { SfxCue } from '../data/audioAssets';

interface ToneSpec {
  frequency: number;
  endFrequency?: number;
  duration: number;
  type: OscillatorType;
  gain: number;
  delay?: number;
}

const CUES: Readonly<Record<SfxCue, readonly ToneSpec[]>> = {
  tear: [
    { frequency: 260, endFrequency: 105, duration: 0.1, type: 'sawtooth', gain: 0.035 },
    { frequency: 690, endFrequency: 330, duration: 0.07, type: 'square', gain: 0.018, delay: 0.045 },
  ],
  'reveal-pop': [{ frequency: 180, endFrequency: 520, duration: 0.11, type: 'sine', gain: 0.055 }],
  common: [{ frequency: 520, duration: 0.12, type: 'sine', gain: 0.035 }],
  rare: [
    { frequency: 560, duration: 0.12, type: 'sine', gain: 0.036 },
    { frequency: 720, duration: 0.14, type: 'sine', gain: 0.03, delay: 0.07 },
  ],
  epic: [
    { frequency: 610, duration: 0.13, type: 'triangle', gain: 0.038 },
    { frequency: 820, duration: 0.15, type: 'sine', gain: 0.032, delay: 0.07 },
    { frequency: 1040, duration: 0.17, type: 'sine', gain: 0.026, delay: 0.14 },
  ],
  legendary: [
    { frequency: 650, duration: 0.16, type: 'triangle', gain: 0.04 },
    { frequency: 880, duration: 0.18, type: 'sine', gain: 0.035, delay: 0.08 },
    { frequency: 1180, duration: 0.22, type: 'sine', gain: 0.03, delay: 0.16 },
  ],
  duplicate: [{ frequency: 230, endFrequency: 180, duration: 0.11, type: 'triangle', gain: 0.026 }],
  'signal-gain': [{ frequency: 780, endFrequency: 920, duration: 0.09, type: 'square', gain: 0.018 }],
  'signal-lock': [
    { frequency: 450, endFrequency: 900, duration: 0.18, type: 'square', gain: 0.025 },
    { frequency: 1120, duration: 0.16, type: 'sine', gain: 0.028, delay: 0.14 },
  ],
  'hidden-pocket': [
    { frequency: 350, endFrequency: 760, duration: 0.15, type: 'triangle', gain: 0.035 },
    { frequency: 980, endFrequency: 620, duration: 0.2, type: 'sine', gain: 0.025, delay: 0.11 },
  ],
  'secret-reveal': [
    { frequency: 720, duration: 0.18, type: 'triangle', gain: 0.04 },
    { frequency: 1080, duration: 0.24, type: 'sine', gain: 0.035, delay: 0.09 },
    { frequency: 1440, duration: 0.28, type: 'sine', gain: 0.028, delay: 0.18 },
  ],
  'collection-complete': [
    { frequency: 523, duration: 0.13, type: 'sine', gain: 0.032 },
    { frequency: 659, duration: 0.13, type: 'sine', gain: 0.032, delay: 0.09 },
    { frequency: 784, duration: 0.2, type: 'sine', gain: 0.032, delay: 0.18 },
  ],
};

class GameAudioController {
  private context: AudioContext | null = null;
  private readonly samples = new Map<SfxCue, AudioBuffer>();
  private muted = false;
  private blocked = false;

  public isMuted(): boolean {
    return this.muted;
  }

  public setMuted(muted: boolean): void {
    this.muted = muted;
    if (muted && this.context?.state === 'running') {
      void this.context.suspend();
    }
  }

  public toggleMuted(): boolean {
    this.setMuted(!this.muted);
    return this.muted;
  }

  public setBlocked(blocked: boolean): void {
    this.blocked = blocked;
    if (blocked && this.context?.state === 'running') {
      void this.context.suspend();
    }
  }

  public async preloadSamples(assets: readonly RuntimeSfxAsset[]): Promise<void> {
    if (assets.length === 0 || typeof AudioContext === 'undefined') return;
    const context = this.getContext();
    if (!context) return;

    await Promise.all(
      assets.map(async ({ cue, assetPath }) => {
        try {
          const response = await fetch(assetPath, { cache: 'force-cache' });
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }
          const encoded = await response.arrayBuffer();
          const decoded = await context.decodeAudioData(encoded);
          this.samples.set(cue, decoded);
        } catch (error: unknown) {
          console.warn(`[audio] failed to preload ${cue}; synth fallback remains active`, error);
        }
      }),
    );
  }

  public play(cue: SfxCue): void {
    if (this.muted || this.blocked || typeof AudioContext === 'undefined') return;

    const context = this.getContext();
    if (!context) return;

    if (context.state === 'suspended') {
      void context.resume().then(() => this.schedule(context, cue)).catch(() => undefined);
      return;
    }

    this.schedule(context, cue);
  }

  private getContext(): AudioContext | null {
    try {
      this.context ??= new AudioContext();
      return this.context;
    } catch {
      return null;
    }
  }

  private schedule(context: AudioContext, cue: SfxCue): void {
    if (this.muted || this.blocked || context.state !== 'running') return;

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
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(spec.gain, start + Math.min(0.018, spec.duration / 4));
      gain.gain.exponentialRampToValueAtTime(0.0001, end);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(start);
      oscillator.stop(end + 0.02);
    }
  }
}

const gameAudio = new GameAudioController();

export const getGameAudio = (): GameAudioController => gameAudio;
