import fs from 'node:fs';

const path = 'src/game/scenes/OpeningScene.ts';
let source = fs.readFileSync(path, 'utf8');

const replaceRequired = (from, to, label) => {
  if (source.includes(to)) return;
  if (!source.includes(from)) throw new Error(`Expected ${label} source not found`);
  source = source.replace(from, to);
};

// The broad first-pass color replacement can encounter the Charged READY label
// before Hidden Pocket. Keep that system cyan and recolor the actual discovery beat.
replaceRequired(
  `      .text(width - 12, 10, 'READY', {\n        color: '#ff7088',`,
  `      .text(width - 12, 10, 'READY', {\n        color: '#8df8ff',`,
  'Charged READY color restore',
);
replaceRequired(
  `    const hiddenLabel = this.add.text(\n      metrics.centerX,\n      126,\n      getMessages(getPlatformRuntime().language).opening.hiddenPocket,\n      {\n        color: '#8df8ff',`,
  `    const hiddenLabel = this.add.text(\n      metrics.centerX,\n      126,\n      getMessages(getPlatformRuntime().language).opening.hiddenPocket,\n      {\n        color: '#ff7088',`,
  'Hidden Pocket discovery color',
);

// The first generic reveal-backdrop match is the standard reveal. Restore it,
// then strengthen only the Secret reveal block.
replaceRequired(
  `    const fx = REVEAL_FX_PRESETS[pending.standard.rarity];\n    this.createRevealBackdrop(Math.min(0.58, fx.backdropAlpha * 1.28), fx.particleDuration + 120);`,
  `    const fx = REVEAL_FX_PRESETS[pending.standard.rarity];\n    this.createRevealBackdrop(fx.backdropAlpha, fx.particleDuration);`,
  'standard reveal backdrop restore',
);
replaceRequired(
  `    const heroX = metrics.centerX;\n    const heroY = secretPresentation.revealY;\n    this.createRevealBackdrop(fx.backdropAlpha, fx.particleDuration);`,
  `    const heroX = metrics.centerX;\n    const heroY = secretPresentation.revealY;\n    this.createRevealBackdrop(Math.min(0.58, fx.backdropAlpha * 1.28), fx.particleDuration + 120);`,
  'Secret reveal backdrop strengthening',
);

fs.writeFileSync(path, source);
