from pathlib import Path

path = Path('src/game/scenes/OpeningScene.ts')
text = path.read_text()
old = '''    for (let index = 0; index < 10; index += 1) {
      const angle = (Math.PI * 2 * index) / 10 + 0.31;
      const radius = 92 + (index % 3) * 34;
      const sparkle = this.trackSecretPremiumTarget(
        this.add.circle(
          Math.cos(angle) * radius,
          Math.sin(angle) * radius * 0.72,
          index % 3 === 0 ? 3.2 : 2.1,
          index % 3 === 0 ? SECRET_PREMIUM_GOLD : SECRET_REVEAL_COLOR,
          0.28 + (index % 4) * 0.08,
        ).setBlendMode(Phaser.BlendModes.ADD),
      );
      layer.add(sparkle);
      const baseX = sparkle.x;
      const baseY = sparkle.y;
      this.tweens.add({
        targets: sparkle,
        x: baseX + (index % 2 === 0 ? 9 : -9),
        y: baseY - 14 - (index % 3) * 4,
        alpha: index % 3 === 0 ? 0.88 : 0.58,
        scale: index % 3 === 0 ? 1.55 : 1.25,
        duration: 1100 + index * 90,
        delay: index * 95,
        yoyo: true,
        repeat: -1,
        repeatDelay: 260 + (index % 4) * 170,
        ease: 'Sine.InOut',
      });
    }
'''
new = '''    // Keep Secret premium presence distributed, but avoid a recognisable fixed
    // ten-point ring on every reveal. This is presentation-only randomness; the
    // persisted loot result is already resolved before this layer is created.
    const sparklePhase = Phaser.Math.FloatBetween(0, Math.PI * 2);
    for (let index = 0; index < 10; index += 1) {
      const premium = index % 3 === 0;
      const angle = sparklePhase + (Math.PI * 2 * index) / 10 + Phaser.Math.FloatBetween(-0.28, 0.28);
      const radius = Phaser.Math.FloatBetween(86, 158);
      const sparkle = this.trackSecretPremiumTarget(
        this.add.circle(
          Math.cos(angle) * radius,
          Math.sin(angle) * radius * Phaser.Math.FloatBetween(0.64, 0.82),
          premium ? Phaser.Math.FloatBetween(2.8, 3.5) : Phaser.Math.FloatBetween(1.8, 2.5),
          premium ? SECRET_PREMIUM_GOLD : SECRET_REVEAL_COLOR,
          premium ? Phaser.Math.FloatBetween(0.34, 0.48) : Phaser.Math.FloatBetween(0.22, 0.38),
        ).setBlendMode(Phaser.BlendModes.ADD),
      );
      layer.add(sparkle);
      const baseX = sparkle.x;
      const baseY = sparkle.y;
      this.tweens.add({
        targets: sparkle,
        x: baseX + Phaser.Math.FloatBetween(-11, 11),
        y: baseY - Phaser.Math.FloatBetween(11, 23),
        alpha: premium ? Phaser.Math.FloatBetween(0.72, 0.9) : Phaser.Math.FloatBetween(0.48, 0.64),
        scale: premium ? Phaser.Math.FloatBetween(1.42, 1.62) : Phaser.Math.FloatBetween(1.18, 1.34),
        duration: Phaser.Math.Between(1050, 1980),
        delay: Phaser.Math.Between(0, 900),
        yoyo: true,
        repeat: -1,
        repeatDelay: Phaser.Math.Between(260, 980),
        ease: 'Sine.InOut',
      });
    }
'''
count = text.count(old)
if count != 1:
    raise SystemExit(f'expected one Secret sparkle block, found {count}')
path.write_text(text.replace(old, new, 1))
