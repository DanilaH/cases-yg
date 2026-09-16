from pathlib import Path
ROOT=Path('.')
def patch(path, edits):
    file=ROOT/path
    s=file.read_text()
    for old,new in edits:
        n=s.count(old)
        if n!=1: raise AssertionError(f'{path}: expected one occurrence, got {n}: {old[:140]!r}')
        s=s.replace(old,new,1)
    file.write_text(s)

patch('src/game/data/rarityPouchImpact.ts', [
    ('crackDurationMs: 160, crackStrength: 0.48, fallingFragments: 3, lateralSparks: 0','crackDurationMs: 160, crackStrength: 0.48, fallingFragments: 6, lateralSparks: 0'),
    ('crackDurationMs: 220, crackStrength: 0.70, fallingFragments: 8, lateralSparks: 0','crackDurationMs: 220, crackStrength: 0.70, fallingFragments: 16, lateralSparks: 0'),
    ('crackDurationMs: 270, crackStrength: 0.89, fallingFragments: 11, lateralSparks: 5','crackDurationMs: 270, crackStrength: 0.89, fallingFragments: 20, lateralSparks: 8'),
    ('crackDurationMs: 320, crackStrength: 1, fallingFragments: 14, lateralSparks: 14','crackDurationMs: 320, crackStrength: 1, fallingFragments: 25, lateralSparks: 17'),
    ('} as const;','''} as const;

// Stable per-opening presentation variation: does not consume reward RNG or
// Phaser global randomness and survives a pending-reveal refresh unchanged.
export const resolveCrackVariant = (openingNumber: number): number => {
  const serial = Number.isFinite(openingNumber) ? Math.max(1, Math.floor(openingNumber)) : 1;
  return ((serial * 73 + 19) % 257) / 257;
};'''),
])
patch('src/game/data/rarityPouchImpact.test.ts', [
    ("import { RARITY_POUCH_IMPACT } from './rarityPouchImpact';", "import { RARITY_POUCH_IMPACT, resolveCrackVariant } from './rarityPouchImpact';"),
    ("  it('reserves secret for a second vignette", '''  it('varies the crack layout by durable opening number without random draws', () => {
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

  it('reserves secret for a second vignette'''),
])
patch('src/game/ui/pouchPerspective.ts', [
    ("  'uniform float crackStrength;',", "  'uniform float crackStrength;',\n  'uniform float crackVariant;',"),
    ("  '            float veinLeft = abs(uv.x - (0.32 + 0.095 * sin(uv.y * 17.0) + 0.020 * sin(uv.y * 47.0)));',", "  '            float phase = crackVariant * 6.2831853;',\n  '            float veinLeft = abs(uv.x - (0.32 + 0.095 * sin(uv.y * 17.0 + phase) + 0.020 * sin(uv.y * 47.0 - phase * 1.3)));',"),
    ("  '            float veinRight = abs(uv.x - (0.68 + 0.105 * sin(uv.y * 19.0 + 1.8) + 0.018 * sin(uv.y * 51.0)));',", "  '            float veinRight = abs(uv.x - (0.68 + 0.105 * sin(uv.y * 19.0 + 1.8 - phase * 0.83) + 0.018 * sin(uv.y * 51.0 + phase)));',"),
    ("  '            float branchLeft = abs(uv.y - (0.57 + 0.60 * (uv.x - 0.32) + 0.018 * sin(uv.x * 43.0)));',", "  '            float branchLeft = abs(uv.y - (0.57 + 0.60 * (uv.x - 0.32) + 0.024 * sin(uv.x * 43.0 + phase)));',"),
    ("  '            float branchRight = abs(uv.y - (0.57 - 0.60 * (uv.x - 0.68) + 0.020 * sin(uv.x * 49.0)));',", "  '            float branchRight = abs(uv.y - (0.57 - 0.60 * (uv.x - 0.68) + 0.027 * sin(uv.x * 49.0 - phase * 1.17)));',"),
    ("  '            float noise = fract(sin(dot(floor(uv * vec2(167.0, 191.0)), vec2(12.9898, 78.233))) * 43758.5453);',", "  '            float noise = fract(sin(dot(floor((uv + vec2(crackVariant * 0.37, crackVariant * 0.21)) * vec2(167.0, 191.0)), vec2(12.9898, 78.233))) * 43758.5453);',"),
    ("  '            float burn = (1.0 - smoothstep(width + 0.003, width + 0.025, ragged)) * material;',\n  '            float edge = (1.0 - smoothstep(width + 0.002, width + 0.013, ragged)) * material;',\n  '            float core = (1.0 - smoothstep(width + 0.001, width + 0.004, ragged)) * material;',\n  '            // Charcoal undercut gives gold/cyan lines contrast on bright silver foil.',\n  '            sampled.rgb = mix(sampled.rgb, vec3(0.10, 0.065, 0.13), burn * 0.68 * crackStrength);',\n  '            sampled.rgb += crackTint * (edge * 0.31 + core * 0.62) * crackStrength;',\n  '            float hole = (1.0 - smoothstep(width - 0.006, width + 0.002, ragged)) * material;',\n  '            sampled.a *= 1.0 - hole;',", "  '            float hole = (1.0 - smoothstep(width - 0.006, width + 0.002, ragged)) * material;',\n  '            // The saturated lip MUST be outside the transparent hole: drawing',\n  '            // the old colored core inside the hole made every edge look silver.',\n  '            float lip = (smoothstep(width - 0.001, width + 0.006, ragged) - smoothstep(width + 0.022, width + 0.045, ragged)) * material;',\n  '            float aura = (1.0 - smoothstep(width + 0.026, width + 0.085, ragged)) * material;',\n  '            float undercut = (1.0 - smoothstep(width + 0.038, width + 0.058, ragged)) * material;',\n  '            sampled.rgb = mix(sampled.rgb, vec3(0.085, 0.055, 0.11), undercut * 0.76 * crackStrength);',\n  '            sampled.rgb += crackTint * aura * 0.42 * crackStrength;',\n  '            sampled.rgb = mix(sampled.rgb, min(vec3(1.0), crackTint * 1.42 + vec3(0.15)), lip * 0.93 * crackStrength);',\n  '            sampled.a *= 1.0 - hole;',"),
    ("  public crackStrength = 0;", "  public crackStrength = 0;\n  public crackVariant = 0;"),
    ("    this.programManager.setUniform('crackStrength', perspective.crackStrength);", "    this.programManager.setUniform('crackStrength', perspective.crackStrength);\n    this.programManager.setUniform('crackVariant', perspective.crackVariant);"),
])
patch('src/game/scenes/OpeningScene.ts', [
    ("import { RARITY_POUCH_IMPACT, type PouchImpactProfile } from '../data/rarityPouchImpact';", "import { RARITY_POUCH_IMPACT, resolveCrackVariant, type PouchImpactProfile } from '../data/rarityPouchImpact';"),
    ("    await this.animateTearDetach(recovered, pending.standard.rarity);", "    if (this.pouch.perspective) this.pouch.perspective.crackVariant = resolveCrackVariant(pending.openingNumber);\n    await this.animateTearDetach(recovered, pending.standard.rarity);"),
    ("  private spawnCrackDebris(rarity: StandardRarity): void {", "  private spawnCrackDebris(rarity: StandardRarity, openingNumber: number): void {"),
    ("    const total = profile.fallingFragments + profile.lateralSparks;", "    const total = profile.fallingFragments + profile.lateralSparks;\n    const visualSeed = Math.floor(resolveCrackVariant(openingNumber) * 257);"),
    ("      const sequence = (index * 17 + 9) % 29;\n      const side = index % 2 === 0 ? -1 : 1;", "      const sequence = (index * 17 + visualSeed * 11 + 9) % 29;\n      const side = (index + visualSeed) % 2 === 0 ? -1 : 1;"),
    ("      const startY = POUCH_PRESENTATION.body.y + ((index * 11) % 21 - 10) * 5.4;", "      const startY = POUCH_PRESENTATION.body.y + ((index * 11 + visualSeed * 3) % 21 - 10) * 5.4;"),
    ("      const fragment = this.add.ellipse(pouch.group.x + startX, pouch.group.y + startY, lateral ? 9 : 4, lateral ? 2.4 : 3.7,\n        lateral && index % 3 === 0 ? 0xfff0a2 : color, lateral ? 0.96 : 0.80);", "      const fragment = this.add.ellipse(pouch.group.x + startX, pouch.group.y + startY, lateral ? 11 : 5.6, lateral ? 3 : 5,\n        lateral && index % 3 === 0 ? 0xfff0a2 : color, lateral ? 0.98 : 0.94);"),
    ("  private async animateCrackDissolve(rarity: StandardRarity): Promise<void> {", "  private async animateCrackDissolve(rarity: StandardRarity, openingNumber: number): Promise<void> {"),
    ("    this.spawnCrackDebris(rarity);", "    this.spawnCrackDebris(rarity, openingNumber);"),
    ("    await this.animateCrackDissolve(pending.standard.rarity);", "    await this.animateCrackDissolve(pending.standard.rarity, pending.openingNumber);"),
    ("    this.root.add(spark);\n    let lastTrailAt = Number.NEGATIVE_INFINITY;", "    this.root.add(spark);\n    // A separate launch transient makes the projectile audible before its HUD impact.\n    getGameAudio().play('signal-launch');\n    let lastTrailAt = Number.NEGATIVE_INFINITY;"),
    ("    getGameAudio().play(pending.signal.lockReached ? 'signal-lock' : 'signal-gain');", "    getGameAudio().play('signal-dock');\n    getGameAudio().play(pending.signal.lockReached ? 'signal-lock' : 'signal-gain');"),
])
patch('src/game/data/audioAssets.ts', [
    ("  'chip-clack',\n  'signal-gain',\n  'signal-lock',", "  'chip-clack',\n  'signal-launch',\n  'signal-dock',\n  'signal-gain',\n  'signal-lock',"),
    ("  'signal-gain': 'assets/audio/signal-gain.mp3',", "  // Synthetic transients only: no unreviewed/placeholder MP3 is preloaded.\n  'signal-launch': 'assets/audio/signal-launch.mp3',\n  'signal-dock': 'assets/audio/signal-dock.mp3',\n  'signal-gain': 'assets/audio/signal-gain.mp3',"),
])
patch('src/game/systems/audio.ts', [
    ("  'signal-gain': [{ frequency: 780, endFrequency: 920, duration: 0.09, type: 'square', gain: 0.018 }],", "  'signal-launch': [\n    { frequency: 1380, endFrequency: 520, duration: 0.17, type: 'triangle', gain: 0.044 },\n    { frequency: 880, endFrequency: 370, duration: 0.11, type: 'sine', gain: 0.023, delay: 0.028 },\n  ],\n  'signal-dock': [\n    { frequency: 420, endFrequency: 660, duration: 0.09, type: 'sine', gain: 0.044 },\n    { frequency: 1120, endFrequency: 860, duration: 0.065, type: 'triangle', gain: 0.029, delay: 0.018 },\n  ],\n  'signal-gain': [{ frequency: 780, endFrequency: 920, duration: 0.09, type: 'square', gain: 0.018 }],"),
])
patch('src/game/data/audioPresentation.ts', [
    ("    cue === 'signal-gain'\n", "    cue === 'signal-gain' ||\n    cue === 'signal-launch' ||\n    cue === 'signal-dock'\n"),
    ("    case 'signal-gain':\n      return {", "    case 'signal-launch':\n      return {\n        duck: { multiplier: 0.82, attackMs: 8, holdMs: 65, releaseMs: 135 },\n      };\n    case 'signal-dock':\n      return {\n        duck: { multiplier: 0.76, attackMs: 5, holdMs: 65, releaseMs: 155 },\n      };\n    case 'signal-gain':\n      return {"),
])
print('All exact-match changes applied')
