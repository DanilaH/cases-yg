import fs from 'node:fs/promises';

const edit = async (path, transform) => {
  const before = await fs.readFile(path, 'utf8');
  const after = transform(before);
  if (after === before) throw new Error(`No change produced for ${path}`);
  await fs.writeFile(path, after);
};

await edit('src/game/data/presentation.ts', (text) => {
  let next = text;
  for (const [from, to] of [
    ['  starPulseScale: 1.04,', '  starPulseScale: 1.07,'],
    ['  starPulseDuration: 720,', '  starPulseDuration: 520,'],
    ['  resultPulseScale: 1.028,', '  resultPulseScale: 1.04,'],
    ['  resultPulseDuration: 620,', '  resultPulseDuration: 180,\n  resultPulseRepeatDelay: 520,'],
  ]) {
    if (!next.includes(from)) throw new Error(`motion marker not found: ${from}`);
    next = next.replace(from, to);
  }
  return next;
});

await edit('src/game/scenes/OpeningScene.ts', (text) => {
  let next = text;
  const starFrom = `      scale: MOTION_PRESENTATION.starPulseScale,\n      alpha: 0.86,\n      duration: MOTION_PRESENTATION.starPulseDuration,`;
  const starTo = `      scale: MOTION_PRESENTATION.starPulseScale,\n      duration: MOTION_PRESENTATION.starPulseDuration,`;
  if (!next.includes(starFrom)) throw new Error('star pulse block not found');
  next = next.replace(starFrom, starTo);

  const resultFrom = `      duration: MOTION_PRESENTATION.resultPulseDuration,\n      yoyo: true,\n      repeat: -1,\n      ease: 'Sine.InOut',`;
  const resultTo = `      duration: MOTION_PRESENTATION.resultPulseDuration,\n      yoyo: true,\n      repeat: -1,\n      repeatDelay: MOTION_PRESENTATION.resultPulseRepeatDelay,\n      ease: 'Sine.Out',`;
  if (!next.includes(resultFrom)) throw new Error('result pulse block not found');
  return next.replace(resultFrom, resultTo);
});

await edit('tests/presentation.test.ts', (text) => {
  const old = `    expect(MOTION_PRESENTATION.starPulseScale).toBeGreaterThan(1);\n    expect(MOTION_PRESENTATION.starPulseScale).toBeLessThan(1.08);\n    expect(MOTION_PRESENTATION.resultPulseScale).toBeLessThan(1.05);\n    expect(MOTION_PRESENTATION.rewardBreathScale).toBeLessThan(1.05);`;
  const replacement = `    expect(MOTION_PRESENTATION.starPulseScale).toBeGreaterThanOrEqual(1.06);\n    expect(MOTION_PRESENTATION.starPulseScale).toBeLessThanOrEqual(1.08);\n    expect(MOTION_PRESENTATION.resultPulseScale).toBeGreaterThanOrEqual(1.035);\n    expect(MOTION_PRESENTATION.resultPulseScale).toBeLessThan(1.05);\n    expect(MOTION_PRESENTATION.resultPulseDuration).toBeLessThan(250);\n    expect(MOTION_PRESENTATION.resultPulseRepeatDelay).toBeGreaterThan(400);\n    expect(MOTION_PRESENTATION.rewardBreathScale).toBeLessThan(1.05);`;
  if (!text.includes(old)) throw new Error('pulse bounds test block not found');
  return text.replace(old, replacement);
});
