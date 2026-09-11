import { readFile, writeFile } from 'node:fs/promises';

const replaceOnce = (source, search, replacement, label) => {
  if (!source.includes(search)) throw new Error(`Missing patch anchor: ${label}`);
  return source.replace(search, replacement);
};

{
  const path = 'src/game/data/presentation.ts';
  let source = await readFile(path, 'utf8');
  source = replaceOnce(source, '  secretOutlineAlpha: 0.42,\n  secretOutlinePeakAlpha: 0.76,', '  secretOutlineAlpha: 0.5,\n  secretOutlinePeakAlpha: 0.82,', 'secret outline intensity');
  await writeFile(path, source);
}

{
  const path = 'src/game/scenes/OpeningScene.ts';
  let source = await readFile(path, 'utf8');
  source = replaceOnce(
    source,
    `    targets.forEach((target, index) => {\n      this.trackSecretPremiumTarget(target);\n      target.setAlpha(OPENING_FEEL_PRESENTATION.secretOutlineAlpha);`,
    `    targets.forEach((target, index) => {\n      this.trackSecretPremiumTarget(target);\n      if (target instanceof Phaser.GameObjects.Image) {\n        target.setTint(SECRET_REVEAL_COLOR);\n        target.setTintFill();\n        target.setBlendMode(Phaser.BlendModes.NORMAL);\n      }\n      target.setAlpha(OPENING_FEEL_PRESENTATION.secretOutlineAlpha);`,
    'secret outline rendering',
  );
  await writeFile(path, source);
}

console.log('Secret outline review fix applied.');
