import { describe, expect, it } from 'vitest';

import { AVAILABLE_SFX_CUES, getRuntimeSfxAssets, SFX_CUES } from '../src/game/data/audioAssets';
import { getAudioCuePresentationDirective } from '../src/game/data/audioPresentation';

describe('Signal flight audio contract', () => {
  it('has distinct launch and docking transients without requesting nonexistent samples', () => {
    const assets = getRuntimeSfxAssets();
    for (const cue of ['signal-launch', 'signal-dock'] as const) {
      expect(SFX_CUES).toContain(cue);
      expect(AVAILABLE_SFX_CUES.has(cue)).toBe(false);
      expect(assets.some((asset) => asset.cue === cue)).toBe(false);
      const directive = getAudioCuePresentationDirective(cue);
      expect(directive.clearPersistent).toBeUndefined();
      expect(directive.persistent).toBeUndefined();
      expect(directive.duck?.multiplier).toBeGreaterThan(0.7);
    }
  });
});
