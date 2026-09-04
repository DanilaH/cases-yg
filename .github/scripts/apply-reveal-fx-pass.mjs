import fs from 'node:fs/promises';

const edit = async (path, transform) => {
  const before = await fs.readFile(path, 'utf8');
  const after = transform(before);
  if (after === before) throw new Error(`No change produced for ${path}`);
  await fs.writeFile(path, after);
};

await edit('src/game/data/presentation.ts', (text) => {
  const start = text.indexOf('export const REVEAL_FX_PRESETS:');
  const end = text.indexOf('\nexport const AMBIENT_PRESENTATION', start);
  if (start < 0 || end < 0) throw new Error('FX preset block not found');
  const fxBlock = `export const REVEAL_FX_PRESETS: Readonly<Record<RevealRarity, RevealFxPreset>> = {
  common: {
    backdropAlpha: 0.14,
    flashAlpha: 0.38,
    glowAlpha: 0.22,
    ringScale: 1.58,
    particleCount: 9,
    particleDistance: 130,
    particleDuration: 520,
    sparkleScale: 1.05,
    overshootScale: 1.14,
    introDuration: 360,
    settleDuration: 140,
    shake: 0.0006,
    secondaryRing: false,
  },
  rare: {
    backdropAlpha: 0.19,
    flashAlpha: 0.46,
    glowAlpha: 0.3,
    ringScale: 1.78,
    particleCount: 14,
    particleDistance: 155,
    particleDuration: 580,
    sparkleScale: 1.15,
    overshootScale: 1.16,
    introDuration: 380,
    settleDuration: 145,
    shake: 0.0013,
    secondaryRing: false,
  },
  epic: {
    backdropAlpha: 0.28,
    flashAlpha: 0.6,
    glowAlpha: 0.42,
    ringScale: 2.05,
    particleCount: 20,
    particleDistance: 195,
    particleDuration: 680,
    sparkleScale: 1.32,
    overshootScale: 1.2,
    introDuration: 420,
    settleDuration: 155,
    shake: 0.0027,
    secondaryRing: true,
  },
  legendary: {
    backdropAlpha: 0.36,
    flashAlpha: 0.72,
    glowAlpha: 0.55,
    ringScale: 2.32,
    particleCount: 28,
    particleDistance: 235,
    particleDuration: 780,
    sparkleScale: 1.48,
    overshootScale: 1.23,
    introDuration: 455,
    settleDuration: 165,
    shake: 0.0038,
    secondaryRing: true,
  },
  secret: {
    backdropAlpha: 0.42,
    flashAlpha: 0.8,
    glowAlpha: 0.66,
    ringScale: 2.58,
    particleCount: 36,
    particleDistance: 270,
    particleDuration: 860,
    sparkleScale: 1.62,
    overshootScale: 1.25,
    introDuration: 480,
    settleDuration: 175,
    shake: 0.0045,
    secondaryRing: true,
  },
};
`;
  let next = text.slice(0, start) + fxBlock + text.slice(end);
  const ambientStart = next.indexOf('export const AMBIENT_PRESENTATION = {');
  const ambientEnd = next.indexOf('\n} as const;', ambientStart) + '\n} as const;'.length;
  if (ambientStart < 0 || ambientEnd < 0) throw new Error('ambient block not found');
  const ambientBlock = `export const AMBIENT_PRESENTATION = {
  count: 18,
  minAlpha: 0.09,
  maxAlpha: 0.2,
  minRadius: 2,
  maxRadius: 6,
  minDuration: 6000,
  maxDuration: 10000,
  maxDriftX: 52,
  maxDriftY: 30,
} as const;`;
  next = next.slice(0, ambientStart) + ambientBlock + next.slice(ambientEnd);
  return next;
});

await edit('src/game/scenes/OpeningScene.ts', (text) => {
  const standardFrom = `    const halo = this.add.circle(heroX, heroY, 136, color, fx.glowAlpha).setScale(0.4);\n    const flash = this.add.circle(heroX, heroY, 102, color, fx.flashAlpha).setScale(0.3);\n    root.add([halo, flash]);`;
  const standardTo = `    const halo = this.add.circle(heroX, heroY, 144, color, fx.glowAlpha).setScale(0.36);\n    const flash = this.add.circle(heroX, heroY, 108, color, fx.flashAlpha).setScale(0.24);\n    const coreFlash = this.add\n      .circle(heroX, heroY, 64, 0xffffff, Math.min(0.58, fx.flashAlpha * 0.72))\n      .setScale(0.18);\n    root.add([halo, flash, coreFlash]);`;
  if (!text.includes(standardFrom)) throw new Error('standard flash block not found');
  let next = text.replace(standardFrom, standardTo);

  const standardTweenMarker = `    this.tweens.add({\n      targets: flash,\n      scale: 3.8,\n      alpha: 0,\n      duration: Math.max(300, fx.introDuration - 20),\n      ease: 'Cubic.Out',\n      onComplete: () => flash.destroy(),\n    });`;
  if (!next.includes(standardTweenMarker)) throw new Error('standard flash tween not found');
  next = next.replace(standardTweenMarker, `${standardTweenMarker}\n    this.tweens.add({\n      targets: coreFlash,\n      scale: 3.1,\n      alpha: 0,\n      duration: Math.max(330, fx.introDuration + 40),\n      ease: 'Cubic.Out',\n      onComplete: () => coreFlash.destroy(),\n    });`);

  const secretFrom = `    const halo = this.add.circle(heroX, heroY, 150, SECRET_REVEAL_COLOR, fx.glowAlpha).setScale(0.38);\n    const flash = this.add.circle(heroX, heroY, 112, SECRET_REVEAL_COLOR, fx.flashAlpha).setScale(0.28);\n    root.add([halo, flash]);`;
  const secretTo = `    const halo = this.add.circle(heroX, heroY, 158, SECRET_REVEAL_COLOR, fx.glowAlpha).setScale(0.34);\n    const flash = this.add.circle(heroX, heroY, 118, SECRET_REVEAL_COLOR, fx.flashAlpha).setScale(0.22);\n    const coreFlash = this.add\n      .circle(heroX, heroY, 70, 0xffffff, Math.min(0.64, fx.flashAlpha * 0.78))\n      .setScale(0.16);\n    root.add([halo, flash, coreFlash]);`;
  if (!next.includes(secretFrom)) throw new Error('secret flash block not found');
  next = next.replace(secretFrom, secretTo);

  const secretTweenMarker = `    this.tweens.add({\n      targets: flash,\n      scale: 4,\n      alpha: 0,\n      duration: fx.introDuration,\n      ease: 'Cubic.Out',\n      onComplete: () => flash.destroy(),\n    });`;
  if (!next.includes(secretTweenMarker)) throw new Error('secret flash tween not found');
  return next.replace(secretTweenMarker, `${secretTweenMarker}\n    this.tweens.add({\n      targets: coreFlash,\n      scale: 3.4,\n      alpha: 0,\n      duration: fx.introDuration + 70,\n      ease: 'Cubic.Out',\n      onComplete: () => coreFlash.destroy(),\n    });`);
});

await edit('tests/presentation.test.ts', (text) => {
  const marker = `    expect(REVEAL_FX_PRESETS.secret.sparkleScale).toBeGreaterThan(REVEAL_FX_PRESETS.legendary.sparkleScale);`;
  if (!text.includes(marker)) throw new Error('FX test marker not found');
  const replacement = `${marker}\n    expect(REVEAL_FX_PRESETS.epic.backdropAlpha).toBeGreaterThanOrEqual(0.28);\n    expect(REVEAL_FX_PRESETS.legendary.flashAlpha).toBeGreaterThanOrEqual(0.7);\n    expect(REVEAL_FX_PRESETS.secret.particleDuration).toBeGreaterThanOrEqual(800);`;
  return text.replace(marker, replacement);
});
