import { describe, expect, it } from 'vitest';
import { RARITY_POUCH_IMPACT } from './rarityPouchImpact';

describe('rarity pouch impact', () => {
  it('increases pulse count, edge strength, recoil and motion without excessive hold', () => {
    const tiers = ['common', 'rare', 'epic', 'legendary'] as const;
    for (const [index, tier] of tiers.entries()) {
      const profile = RARITY_POUCH_IMPACT[tier];
      expect(profile.vignettePulses).toBe(index + 1);
      expect(profile.vignetteAlpha).toBeLessThanOrEqual(0.85);
      expect(profile.recoilScale).toBeGreaterThanOrEqual(0.93);
      expect(profile.reboundScale).toBeLessThanOrEqual(1.05);
      expect(profile.joltX).toBeLessThanOrEqual(4);
      expect(profile.recoilMs + profile.reboundMs + profile.settleMs).toBeLessThanOrEqual(350);
      if (index === 0) continue;
      const previous = RARITY_POUCH_IMPACT[tiers[index - 1]!];
      expect(profile.vignettePulses).toBeGreaterThanOrEqual(previous.vignettePulses);
      expect(profile.vignetteAlpha).toBeGreaterThan(previous.vignetteAlpha);
      expect(profile.recoilScale).toBeLessThan(previous.recoilScale);
      expect(profile.recoilMs).toBeGreaterThan(previous.recoilMs);
    }
  });

  it('reserves secret for a second vignette without animating the departed pouch', () => {
    const secret = RARITY_POUCH_IMPACT.secret;
    expect(secret.vignettePulses).toBe(3);
    expect(secret.recoilMs).toBe(0);
    expect(secret.reboundMs).toBe(0);
    expect(secret.jolts).toBe(0);
  });
});
