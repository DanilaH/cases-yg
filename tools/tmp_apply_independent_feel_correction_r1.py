from pathlib import Path
import re


def replace_once(path: str, old: str, new: str) -> None:
    p = Path(path)
    text = p.read_text(encoding='utf-8')
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{path}: expected one exact anchor, found {count}: {old[:120]!r}')
    p.write_text(text.replace(old, new, 1), encoding='utf-8')


def sub_once(path: str, pattern: str, replacement: str) -> None:
    p = Path(path)
    text = p.read_text(encoding='utf-8')
    new_text, count = re.subn(pattern, replacement, text, count=1, flags=re.S)
    if count != 1:
        raise SystemExit(f'{path}: expected one regex match, found {count}: {pattern[:120]!r}')
    p.write_text(new_text, encoding='utf-8')


def replace_between(path: str, start_marker: str, end_marker: str, replacement: str) -> None:
    p = Path(path)
    text = p.read_text(encoding='utf-8')
    start = text.find(start_marker)
    if start < 0:
        raise SystemExit(f'{path}: start marker missing: {start_marker!r}')
    end = text.find(end_marker, start + len(start_marker))
    if end < 0:
        raise SystemExit(f'{path}: end marker missing: {end_marker!r}')
    p.write_text(text[:start] + replacement + text[end:], encoding='utf-8')


presentation = 'src/game/data/presentation.ts'
for old, new in [
    ('sparkleCount: 0,\n  },\n  epic:', 'sparkleCount: 1,\n  },\n  epic:'),
    ('sparkleCount: 2,\n  },\n  legendary:', 'sparkleCount: 4,\n  },\n  legendary:'),
    ('sparkleCount: 4,\n  },\n} as const;', 'sparkleCount: 7,\n  },\n} as const;'),
    ('particleCount: 9,', 'particleCount: 12,'),
    ('particleCount: 14,', 'particleCount: 17,'),
    ('particleCount: 20,', 'particleCount: 24,'),
    ('particleCount: 28,', 'particleCount: 34,'),
    ('particleCount: 36,', 'particleCount: 44,'),
    (
        'count: 18,\n  minAlpha:',
        'count: 24,\n  glowCount: 3,\n  minGlowAlpha: 0.012,\n  maxGlowAlpha: 0.026,\n  minGlowRadius: 120,\n  maxGlowRadius: 210,\n  minGlowDuration: 9000,\n  maxGlowDuration: 15000,\n  minAlpha:',
    ),
]:
    replace_once(presentation, old, new)

opening = 'src/game/scenes/OpeningScene.ts'
replace_once(
    opening,
    """  private handlePointerDown(pointer: Phaser.Input.Pointer): void {
    if (this.phase === 'revealing' || this.phase === 'banking') {
      if (this.requestPresentationFastForward()) getGameAudio().play('ui-skip');
      return;
    }
""",
    """  private handlePointerDown(pointer: Phaser.Input.Pointer): void {
    if (this.phase === 'revealing' || this.phase === 'banking') {
      if (this.requestPresentationFastForward()) getGameAudio().play('ui-skip');
      return;
    }

    // The pre-ready result panel explicitly says "Tap to speed up". Keep that
    // promise true here as well as during reveal/banking, while preventing the
    // same physical gesture from becoming an immediate collect on pointerup.
    if (this.phase === 'result' && !this.resultReady) {
      if (this.requestPresentationFastForward()) {
        this.ignoreNextResultTap = true;
        getGameAudio().play('ui-skip');
      }
      return;
    }
""",
)

ambient_method = """  private addAmbientMotion(root: Phaser.GameObjects.Container, metrics: LayoutMetrics): void {
    const colors = [0xf4e5ff, 0xb9efff, 0xffe7f2];

    // Large, extremely faint pools keep the authored room from reading as a
    // frozen backdrop once the audio bed is alive. They remain behind gameplay
    // chrome and move on deliberately slow, asynchronous cycles.
    for (let index = 0; index < AMBIENT_PRESENTATION.glowCount; index += 1) {
      const radius = Phaser.Math.FloatBetween(
        AMBIENT_PRESENTATION.minGlowRadius,
        AMBIENT_PRESENTATION.maxGlowRadius,
      );
      const x = Phaser.Math.FloatBetween(metrics.logicalWidth * 0.24, metrics.logicalWidth * 0.82);
      const y = Phaser.Math.FloatBetween(150, 570);
      const alpha = Phaser.Math.FloatBetween(
        AMBIENT_PRESENTATION.minGlowAlpha,
        AMBIENT_PRESENTATION.maxGlowAlpha,
      );
      const glow = this.add
        .circle(x, y, radius, colors[index % colors.length], alpha)
        .setScale(Phaser.Math.FloatBetween(1.25, 1.75), Phaser.Math.FloatBetween(0.52, 0.82))
        .setBlendMode(Phaser.BlendModes.ADD);
      root.add(glow);
      this.ambientParticles.push(glow);

      const baseScaleX = glow.scaleX;
      const baseScaleY = glow.scaleY;
      this.tweens.add({
        targets: glow,
        x: x + Phaser.Math.FloatBetween(-38, 38),
        y: y + Phaser.Math.FloatBetween(-24, 24),
        alpha: Math.min(AMBIENT_PRESENTATION.maxGlowAlpha * 1.35, alpha * Phaser.Math.FloatBetween(1.08, 1.3)),
        scaleX: baseScaleX * Phaser.Math.FloatBetween(1.025, 1.06),
        scaleY: baseScaleY * Phaser.Math.FloatBetween(1.025, 1.07),
        duration: Phaser.Math.Between(
          AMBIENT_PRESENTATION.minGlowDuration,
          AMBIENT_PRESENTATION.maxGlowDuration,
        ),
        delay: Phaser.Math.Between(0, 3200),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.InOut',
      });
    }

    for (let index = 0; index < AMBIENT_PRESENTATION.count; index += 1) {
      const radius = Phaser.Math.FloatBetween(AMBIENT_PRESENTATION.minRadius, AMBIENT_PRESENTATION.maxRadius);
      const alpha = Phaser.Math.FloatBetween(AMBIENT_PRESENTATION.minAlpha, AMBIENT_PRESENTATION.maxAlpha);
      const x = Phaser.Math.FloatBetween(54, Math.max(55, metrics.logicalWidth - 54));
      const y = Phaser.Math.FloatBetween(108, 622);
      const particle = this.add
        .circle(x, y, radius, colors[Phaser.Math.Between(0, colors.length - 1)], alpha)
        .setBlendMode(Phaser.BlendModes.ADD);
      root.add(particle);
      this.ambientParticles.push(particle);

      const driftX = Phaser.Math.FloatBetween(-AMBIENT_PRESENTATION.maxDriftX, AMBIENT_PRESENTATION.maxDriftX);
      const driftY = Phaser.Math.FloatBetween(-AMBIENT_PRESENTATION.maxDriftY, AMBIENT_PRESENTATION.maxDriftY);
      const targetAlpha = Math.min(0.24, alpha * Phaser.Math.FloatBetween(1.2, 1.72));
      this.tweens.add({
        targets: particle,
        x: x + driftX,
        y: y + driftY,
        alpha: targetAlpha,
        scale: Phaser.Math.FloatBetween(0.82, 1.34),
        duration: Phaser.Math.Between(AMBIENT_PRESENTATION.minDuration, AMBIENT_PRESENTATION.maxDuration),
        delay: Phaser.Math.Between(0, 3400),
        yoyo: true,
        repeat: -1,
        repeatDelay: Phaser.Math.Between(120, 1500),
        ease: 'Sine.InOut',
      });
    }
  }

  private """
sub_once(
    opening,
    r"  private addAmbientMotion\(root: Phaser\.GameObjects\.Container, metrics: LayoutMetrics\): void \{.*?\n  \}\n\n  private ",
    ambient_method,
)

standard_sparkles = """    for (let index = 0; index < profile.sparkleCount; index += 1) {
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const radius = Phaser.Math.FloatBetween(92, 146);
      const sparkle = this.trackStandardPresenceTarget(
        this.add
          .circle(
            Math.cos(angle) * radius,
            Math.sin(angle) * radius * Phaser.Math.FloatBetween(0.62, 0.82),
            Phaser.Math.FloatBetween(1.4, 2.5),
            color,
            Phaser.Math.FloatBetween(0.14, 0.25),
          )
          .setBlendMode(Phaser.BlendModes.ADD),
      );
      layer.add(sparkle);
      const baseY = sparkle.y;
      this.tweens.add({
        targets: sparkle,
        y: baseY - Phaser.Math.FloatBetween(5, 11),
        alpha: Phaser.Math.FloatBetween(0.3, 0.48),
        scale: Phaser.Math.FloatBetween(1.2, 1.48),
        duration: Math.round(profile.pulseDurationMs * Phaser.Math.FloatBetween(0.78, 1.22)),
        delay: Phaser.Math.Between(120, 1250),
        yoyo: true,
        repeat: -1,
        repeatDelay: Phaser.Math.Between(420, 1700),
        ease: 'Sine.InOut',
      });
    }

    parent.add(layer);"""
sub_once(
    opening,
    r"    for \(let index = 0; index < profile\.sparkleCount; index \+= 1\) \{.*?\n    \}\n\n    parent\.add\(layer\);",
    standard_sparkles,
)

spawn_method = """  private spawnSparkles(
    x: number,
    y: number,
    color: number,
    count: number,
    distance: number,
    duration: number,
    sizeScale = 1,
  ): void {
    if (!this.root) return;
    const root = this.root;
    for (let index = 0; index < count; index += 1) {
      // Presentation randomness only: loot resolution is already persisted before
      // this runs. Breaking the old spoke/grid pattern makes repeated openings
      // feel less stamped without touching any gameplay RNG.
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const distanceJitter = distance * Phaser.Math.FloatBetween(0.68, 1.08);
      const sparkle = this.add
        .circle(
          x,
          y,
          Phaser.Math.FloatBetween(3.2, 7.2) * sizeScale,
          color,
          Phaser.Math.FloatBetween(0.72, 1),
        )
        .setStrokeStyle(1.5, 0xffffff, Phaser.Math.FloatBetween(0.34, 0.56));
      root.add(sparkle);
      this.tweens.add({
        targets: sparkle,
        x: x + Math.cos(angle) * distanceJitter,
        y: y + Math.sin(angle) * distanceJitter * Phaser.Math.FloatBetween(0.7, 0.86) - Phaser.Math.FloatBetween(6, 18),
        alpha: 0,
        scale: Phaser.Math.FloatBetween(0.12, 0.24),
        duration: Math.round(duration * Phaser.Math.FloatBetween(0.88, 1.14)),
        delay: Phaser.Math.Between(0, 72),
        ease: 'Cubic.Out',
        onComplete: () => sparkle.destroy(),
      });
    }
  }

"""
replace_between(
    opening,
    '  private spawnSparkles(',
    '  private createRevealBackdrop',
    spawn_method,
)

tests = 'tests/presentation.test.ts'
replace_once(tests, 'expect(rare.sparkleCount).toBe(0);', 'expect(rare.sparkleCount).toBeGreaterThanOrEqual(1);')
replace_once(tests, 'expect(legendary.sparkleCount).toBeLessThanOrEqual(4);', 'expect(legendary.sparkleCount).toBeLessThanOrEqual(7);')
replace_once(
    tests,
    'expect(AMBIENT_PRESENTATION.count).toBeLessThanOrEqual(20);',
    'expect(AMBIENT_PRESENTATION.count).toBeGreaterThanOrEqual(22);\n    expect(AMBIENT_PRESENTATION.count).toBeLessThanOrEqual(28);\n    expect(AMBIENT_PRESENTATION.glowCount).toBeGreaterThanOrEqual(2);\n    expect(AMBIENT_PRESENTATION.glowCount).toBeLessThanOrEqual(4);\n    expect(AMBIENT_PRESENTATION.maxGlowAlpha).toBeLessThanOrEqual(0.03);',
)
replace_once(
    tests,
    'expect(REVEAL_FX_PRESETS.secret.particleDuration).toBeGreaterThanOrEqual(800);',
    'expect(REVEAL_FX_PRESETS.secret.particleDuration).toBeGreaterThanOrEqual(800);\n    expect(REVEAL_FX_PRESETS.legendary.particleCount).toBeLessThanOrEqual(36);\n    expect(REVEAL_FX_PRESETS.secret.particleCount).toBeLessThanOrEqual(48);',
)
