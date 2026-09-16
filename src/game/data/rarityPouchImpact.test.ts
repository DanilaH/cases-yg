import { describe, expect, it } from 'vitest';
import { RARITY_POUCH_IMPACT, resolveCrackVariant } from './rarityPouchImpact';

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

  it('keeps rare debris downward and lets legendary throw yellow side sparks', () => {
    expect(RARITY_POUCH_IMPACT.common.lateralSparks).toBe(0);
    expect(RARITY_POUCH_IMPACT.rare.lateralSparks).toBe(0);
    expect(RARITY_POUCH_IMPACT.rare.fallingFragments).toBeGreaterThan(0);
    expect(RARITY_POUCH_IMPACT.epic.lateralSparks).toBeGreaterThan(0);
    expect(RARITY_POUCH_IMPACT.legendary.lateralSparks).toBeGreaterThan(RARITY_POUCH_IMPACT.epic.lateralSparks);
    expect(RARITY_POUCH_IMPACT.legendary.crackStrength).toBeGreaterThan(RARITY_POUCH_IMPACT.rare.crackStrength);
  });

  it('varies the crack layout by durable opening number without random draws', () => {
    const first = resolveCrackVariant(17);
    expect(first).toBe(resolveCrackVariant(17));
    expect(new Set(Array.from({ length: 16 }, (_, index) => resolveCrackVariant(index + 1))).size).toBe(16);
    expect(first).toBeGreaterThanOrEqual(0);
    expect(first).toBeLessThan(1);
    expect(resolveCrackVariant(Number.NaN)).toBe(resolveCrackVariant(1));
  });

  it('caps debris even for legendary to protect mobile frame pacing', () => {
    const tiers = ['common', 'rare', 'epic', 'legendary'] as const;
    for (const tier of tiers) {
      const profile = RARITY_POUCH_IMPACT[tier];
      expect(profile.fallingFragments + profile.lateralSparks).toBeLessThanOrEqual(42);
    }
    expect(RARITY_POUCH_IMPACT.rare.fallingFragments).toBeGreaterThan(8);
    expect(RARITY_POUCH_IMPACT.legendary.lateralSparks).toBeGreaterThan(14);
  });

  it('reserves secret for a second vignette without animating the departed pouch', () => {
    const secret = RARITY_POUCH_IMPACT.secret;
    expect(secret.vignettePulses).toBe(3);
    expect(secret.recoilMs).toBe(0);
    expect(secret.reboundMs).toBe(0);
    expect(secret.jolts).toBe(0);
  });
});
