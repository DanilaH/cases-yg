"""One-off source-aware patch for the isolated feel/rarity-pouch-impact branch.
Never execute against main; this script and workflow are removed before PR.
"""
from pathlib import Path
import re

path = Path('src/game/scenes/OpeningScene.ts')
source = path.read_text()

def replace_once(old: str, new: str) -> None:
    global source
    count = source.count(old)
    assert count == 1, f'expected one match, got {count}: {old[:110]!r}'
    source = source.replace(old, new, 1)

replace_once(
    "import { getRenderPixelRatio } from '../systems/renderDensity';",
    "import { RARITY_POUCH_IMPACT, type PouchImpactProfile } from '../data/rarityPouchImpact';\nimport { getRenderPixelRatio } from '../systems/renderDensity';",
)
replace_once(
    '  private chargedAura: Phaser.GameObjects.Container | null = null;',
    '  private chargedAura: Phaser.GameObjects.Container | null = null;\n  private impactVignette: Phaser.GameObjects.Graphics | null = null;',
)
replace_once(
    '    this.clearAmbientMotion();\n    if (this.environmentRoot?.active)',
    '    this.clearAmbientMotion();\n    this.clearImpactVignette();\n    if (this.environmentRoot?.active)',
)
replace_once(
    '    this.clearHudMotion();\n    if (this.chargedAura)',
    '    this.clearHudMotion();\n    this.clearImpactVignette();\n    if (this.chargedAura)',
)
replace_once(
    '    await this.animateTearDetach(recovered);',
    '    await this.animateTearDetach(recovered, pending.standard.rarity);',
)

impact_methods = '''  private clearImpactVignette(): void {
    const vignette = this.impactVignette;
    if (!vignette) return;
    this.impactVignette = null;
    this.tweens.killTweensOf(vignette);
    if (vignette.active) vignette.destroy();
  }

  // Draw once per reveal, then animate only alpha. Dark edges, never a full-screen
  // strobe, extra textures, shaders, or presentation RNG.
  private pulseImpactVignette(rarity: StandardRarity | 'secret'): void {
    if (!this.root || !this.metrics || this.isSceneShutdown()) return;
    this.clearImpactVignette();
    const profile = RARITY_POUCH_IMPACT[rarity];
    const width = this.metrics.logicalWidth;
    const vignette = this.add.graphics().setAlpha(0);
    for (let layer = 0; layer < 12; layer += 1) {
      const insetX = layer * 15;
      const insetY = layer * 12;
      const band = 17;
      const shade = 0.021 - layer * 0.0011;
      vignette.fillStyle(0x160b26, shade);
      vignette.fillRect(insetX, insetY, width - insetX * 2, band);
      vignette.fillRect(insetX, LOGICAL_HEIGHT - insetY - band, width - insetX * 2, band);
      vignette.fillRect(insetX, insetY + band, band, LOGICAL_HEIGHT - insetY * 2 - band * 2);
      vignette.fillRect(width - insetX - band, insetY + band, band, LOGICAL_HEIGHT - insetY * 2 - band * 2);
    }
    this.root.add(vignette);
    this.impactVignette = vignette;
    this.tweens.add({
      targets: vignette,
      alpha: profile.vignetteAlpha,
      duration: profile.pulseHalfMs,
      yoyo: true,
      repeat: profile.vignettePulses - 1,
      repeatDelay: profile.pulseGapMs,
      ease: 'Sine.InOut',
      onComplete: () => {
        if (this.impactVignette === vignette) this.impactVignette = null;
        if (vignette.active) vignette.destroy();
      },
    });
  }

  private async animateRarityPouchImpact(rarity: StandardRarity): Promise<void> {
    const pouch = this.pouch;
    if (!pouch?.group.active || this.isSceneShutdown()) return;
    const profile: PouchImpactProfile = RARITY_POUCH_IMPACT[rarity];
    const group = pouch.group;
    const baseX = group.x;
    const baseY = group.y;
    const baseScaleX = group.scaleX;
    const baseScaleY = group.scaleY;
    this.pulseImpactVignette(rarity);

    // A tiny backwards pull, forward kick and damped settle, all on the pouch
    // itself. Existing rarity-specific item reveal / audio remain unchanged.
    await this.runSkippableTween({
      targets: group,
      x: baseX + profile.joltX,
      y: baseY + profile.recoilY,
      scaleX: baseScaleX * profile.recoilScale,
      scaleY: baseScaleY * profile.recoilScale,
      duration: profile.recoilMs,
      ease: 'Cubic.In',
    });
    if (this.isSceneShutdown() || !group.active) return;
    await this.runSkippableTween({
      targets: group,
      x: baseX - profile.joltX,
      y: baseY + profile.reboundY,
      scaleX: baseScaleX * profile.reboundScale,
      scaleY: baseScaleY * profile.reboundScale,
      duration: profile.reboundMs,
      ease: 'Back.Out',
    });
    if (this.isSceneShutdown() || !group.active) return;
    if (profile.jolts > 1) {
      await this.runSkippableTween({
        targets: group,
        x: baseX + profile.joltX * 0.35,
        duration: 26,
        yoyo: true,
        ease: 'Sine.InOut',
      });
      if (this.isSceneShutdown() || !group.active) return;
    }
    await this.runSkippableTween({
      targets: group,
      x: baseX,
      y: baseY,
      scaleX: baseScaleX,
      scaleY: baseScaleY,
      duration: profile.settleMs,
      ease: 'Sine.Out',
    });
  }

'''
replace_once(
    '  private async animateTearDetach(recovered: boolean): Promise<void> {',
    impact_methods + '  private async animateTearDetach(recovered: boolean, rarity: StandardRarity): Promise<void> {',
)
replace_once(
    '    if (!recovered && !this.isSceneShutdown()) {\n      await this.waitPresentation(72);\n    }',
    '    if (!recovered && !this.isSceneShutdown()) {\n      await this.animateRarityPouchImpact(rarity);\n      if (!this.isSceneShutdown()) await this.waitPresentation(72);\n    }',
)
replace_once(
    "    getGameAudio().play('secret-reveal');",
    "    getGameAudio().play('secret-reveal');\n    this.pulseImpactVignette('secret');",
)
# The scene's normal skip handler must also stop a vignette that is still
# pulsing in parallel with the next presentation beat.
pattern = r'(  private requestPresentationFastForward\([^)]*\): boolean \{\n)'
source, count = re.subn(pattern, r'\1    this.clearImpactVignette();\n', source, count=1)
assert count == 1, f'missing skip handler, got {count} matches'
path.write_text(source)
print('PATCHED', path, 'lines', len(source.splitlines()))
