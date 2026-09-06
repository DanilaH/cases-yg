from pathlib import Path

path = Path('src/game/scenes/OpeningScene.ts')
text = path.read_text()
needle = '''  private clearAmbientMotion(): void {
    for (const particle of this.ambientParticles) {
      this.tweens.killTweensOf(particle);
    }
    this.ambientParticles = [];
  }

  private clearHudMotion(): void {
'''
replacement = '''  private clearAmbientMotion(): void {
    for (const particle of this.ambientParticles) {
      this.tweens.killTweensOf(particle);
    }
    this.ambientParticles = [];
  }

  private addAmbientMotion(root: Phaser.GameObjects.Container, metrics: LayoutMetrics): void {
    const usableWidth = Math.max(160, metrics.logicalWidth - 120);
    const colors = [0xf4e5ff, 0xb9efff, 0xffe7f2];
    for (let index = 0; index < AMBIENT_PRESENTATION.count; index += 1) {
      const radiusMix = (index % 4) / 3;
      const alphaMix = (index % 5) / 4;
      const radius = Phaser.Math.Linear(
        AMBIENT_PRESENTATION.minRadius,
        AMBIENT_PRESENTATION.maxRadius,
        radiusMix,
      );
      const alpha = Phaser.Math.Linear(
        AMBIENT_PRESENTATION.minAlpha,
        AMBIENT_PRESENTATION.maxAlpha,
        alphaMix,
      );
      const x = 60 + ((index * 173) % usableWidth);
      const y = 122 + ((index * 97) % 470);
      const particle = this.add.circle(x, y, radius, colors[index % colors.length], alpha);
      root.add(particle);
      this.ambientParticles.push(particle);

      const driftX = (index % 2 === 0 ? 1 : -1) * (18 + (index % 4) * 8);
      const driftY = -(10 + (index % 3) * 7);
      const durationMix = (index % 6) / 5;
      this.tweens.add({
        targets: particle,
        x: x + Phaser.Math.Clamp(driftX, -AMBIENT_PRESENTATION.maxDriftX, AMBIENT_PRESENTATION.maxDriftX),
        y: y + Phaser.Math.Clamp(driftY, -AMBIENT_PRESENTATION.maxDriftY, AMBIENT_PRESENTATION.maxDriftY),
        alpha: Math.min(0.24, alpha * 1.55),
        duration: Phaser.Math.Linear(
          AMBIENT_PRESENTATION.minDuration,
          AMBIENT_PRESENTATION.maxDuration,
          durationMix,
        ),
        delay: index * 110,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.InOut',
      });
    }
  }

  private clearHudMotion(): void {
'''
if needle not in text:
    raise SystemExit('ambient insertion point not found')
path.write_text(text.replace(needle, replacement, 1))
