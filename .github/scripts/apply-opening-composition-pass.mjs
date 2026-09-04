import fs from 'node:fs/promises';

const edit = async (path, transform) => {
  const before = await fs.readFile(path, 'utf8');
  const after = transform(before);
  if (after === before) throw new Error(`No change produced for ${path}`);
  await fs.writeFile(path, after);
};

await edit('src/game/data/presentation.ts', (text) => {
  let next = text;
  const replacements = [
    ['    revealY: 308,', '    revealY: 318,'],
    ['    revealY: 296,', '    revealY: 310,'],
    ['  groupY: 246,', '  groupY: 266,'],
    ['  tearHintY: 662,', '  tearHintY: 632,'],
    ['  panelY: 558,', '  panelY: 568,'],
  ];
  for (const [from, to] of replacements) {
    if (!next.includes(from)) throw new Error(`presentation marker not found: ${from}`);
    next = next.replace(from, to);
  }
  return next;
});

await edit('tests/presentation.test.ts', (text) => {
  const marker = `  it('keeps the pouch visual center near the reward reveal center', () => {\n    const pouchVisualCenterY = POUCH_PRESENTATION.groupY + POUCH_PRESENTATION.body.y;\n    expect(Math.abs(pouchVisualCenterY - getCollectiblePresentation('camera').revealY)).toBeLessThan(50);\n    expect(Math.abs(pouchVisualCenterY - getCollectiblePresentation('flip-phone').revealY)).toBeLessThan(50);\n  });\n`;
  if (!text.includes(marker)) throw new Error('pouch/reward alignment test marker not found');
  const replacement = `${marker}\n  it('keeps idle vertical rhythm away from both the title and bottom edge', () => {\n    expect(POUCH_PRESENTATION.groupY).toBeGreaterThanOrEqual(260);\n    expect(MOTION_PRESENTATION.tearHintY - (POUCH_PRESENTATION.groupY + POUCH_PRESENTATION.shadowY)).toBeGreaterThan(60);\n    expect(MOTION_PRESENTATION.tearHintY).toBeLessThanOrEqual(640);\n    expect(RESULT_PRESENTATION.panelY).toBeGreaterThan(560);\n  });\n`;
  return text.replace(marker, replacement);
});
