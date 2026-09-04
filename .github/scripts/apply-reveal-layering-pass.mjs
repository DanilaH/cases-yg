import fs from 'node:fs/promises';

const edit = async (path, transform) => {
  const before = await fs.readFile(path, 'utf8');
  const after = transform(before);
  if (after === before) throw new Error(`No change produced for ${path}`);
  await fs.writeFile(path, after);
};

await edit('src/game/data/presentation.ts', (text) => {
  const marker = `export const MOTION_PRESENTATION = {\n  tearHintY: 662,\n  starPulseScale: 1.04,\n  starPulseDuration: 720,\n  resultPulseScale: 1.028,\n  resultPulseDuration: 620,\n  rewardBreathScale: 1.028,\n  rewardBreathDuration: 1200,\n} as const;\n\n`;
  if (!text.includes(marker)) throw new Error('MOTION_PRESENTATION marker not found');
  return text.replace(marker, `${marker}export const REVEAL_MOTION_PRESENTATION = {\n  // The collectible stays behind the pouch for the entire emergence. The pouch\n  // moves/fades away instead of swapping z-order mid-animation.\n  emergeOffsetY: 132,\n  pouchExitOffsetY: 104,\n  pouchExitScale: 0.93,\n  pouchExitDelay: 90,\n  pouchExitDuration: 330,\n} as const;\n\n`);
});

await edit('src/game/scenes/OpeningScene.ts', (text) => {
  let next = text.replace(
    `  POUCH_PRESENTATION,\n  REVEAL_FX_PRESETS,`,
    `  POUCH_PRESENTATION,\n  REVEAL_FX_PRESETS,\n  REVEAL_MOTION_PRESENTATION,`,
  );
  if (next === text) throw new Error('OpeningScene presentation import marker not found');

  next = next.replace(
    `      heroX,\n      POUCH_Y + 74,\n      pending.standard.collectibleId,\n    );\n    visual.group.setScale(finalScale * 0.3).setAlpha(0);`,
    `      heroX,\n      POUCH_Y + REVEAL_MOTION_PRESENTATION.emergeOffsetY,\n      pending.standard.collectibleId,\n    );\n    visual.group.setScale(finalScale * 0.3).setAlpha(0);\n\n    // Keep z-order stable: the reward remains behind the pouch while both move.\n    // The pouch exits downward and fades, uncovering the reward continuously.\n    this.tweens.add({\n      targets: pouch.group,\n      y: pouch.group.y + REVEAL_MOTION_PRESENTATION.pouchExitOffsetY,\n      scale: REVEAL_MOTION_PRESENTATION.pouchExitScale,\n      alpha: 0,\n      delay: REVEAL_MOTION_PRESENTATION.pouchExitDelay,\n      duration: REVEAL_MOTION_PRESENTATION.pouchExitDuration,\n      ease: 'Cubic.InOut',\n    });`,
  );
  if (!next.includes('REVEAL_MOTION_PRESENTATION.emergeOffsetY')) {
    throw new Error('Standard reveal start marker not found');
  }

  const oldPouchTween = `\n    this.tweens.add({\n      targets: pouch.group,\n      y: pouch.group.y + 72,\n      scale: 0.92,\n      alpha: 0,\n      duration: 190,\n      ease: 'Cubic.In',\n    });\n`;
  if (!next.includes(oldPouchTween)) throw new Error('Old post-intro pouch tween not found');
  return next.replace(oldPouchTween, '\n');
});

await edit('src/game/ui/openingVisuals.ts', (text) => {
  const oldBlock = `  const pouch = root.getData('activePouchVisual') as PouchVisual | undefined;\n  if (\n    pouch &&\n    pouch.group.active &&\n    pouch.group.alpha > 0.01 &&\n    !pouch.revealOcclusionUsed\n  ) {\n    pouch.revealOcclusionUsed = true;\n    // Use the real pouch as the foreground occluder. The previous duplicate body\n    // produced a visible \"two pouches fading\" artifact during the reveal.\n    root.bringToTop(pouch.group);\n    scene.time.delayedCall(175, () => {\n      if (!root.active || !group.active) return;\n      root.bringToTop(group);\n    });\n  }\n`;
  const newBlock = `  const pouch = root.getData('activePouchVisual') as PouchVisual | undefined;\n  if (\n    pouch &&\n    pouch.group.active &&\n    pouch.group.alpha > 0.01 &&\n    !pouch.revealOcclusionUsed\n  ) {\n    pouch.revealOcclusionUsed = true;\n    // Establish the reveal order once, before the collectible becomes visible.\n    // The pouch stays above the reward until it fades away; there is no delayed\n    // bringToTop swap, so the reward cannot visibly jump between z-layers.\n    root.bringToTop(pouch.group);\n  }\n`;
  if (!text.includes(oldBlock)) throw new Error('createCollectibleVisual layering block not found');
  return text.replace(oldBlock, newBlock);
});

await edit('tests/presentation.test.ts', (text) => {
  let next = text.replace(
    `  REVEAL_FX_PRESETS,\n  RESULT_PRESENTATION,`,
    `  REVEAL_FX_PRESETS,\n  REVEAL_MOTION_PRESENTATION,\n  RESULT_PRESENTATION,`,
  );
  if (next === text) throw new Error('presentation test import marker not found');

  const marker = `  it('keeps a sub-threshold carousel drag on the current page', () => {`;
  if (!next.includes(marker)) throw new Error('presentation test insertion marker not found');
  return next.replace(marker, `  it('keeps reveal emergence on one stable z-order path', () => {\n    expect(REVEAL_MOTION_PRESENTATION.emergeOffsetY).toBeGreaterThan(100);\n    expect(REVEAL_MOTION_PRESENTATION.pouchExitOffsetY).toBeGreaterThan(80);\n    expect(REVEAL_MOTION_PRESENTATION.pouchExitScale).toBeLessThan(1);\n    expect(REVEAL_MOTION_PRESENTATION.pouchExitDelay).toBeLessThan(150);\n    expect(REVEAL_MOTION_PRESENTATION.pouchExitDuration).toBeGreaterThanOrEqual(280);\n  });\n\n${marker}`);
});
