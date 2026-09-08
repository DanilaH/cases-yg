from pathlib import Path


def replace_exact(text: str, old: str, new: str, label: str, expected: int = 1) -> str:
    count = text.count(old)
    if count != expected:
        raise SystemExit(f"{label}: expected {expected} matches, found {count}")
    return text.replace(old, new)

scene_path = Path('src/game/scenes/OpeningScene.ts')
scene = scene_path.read_text(encoding='utf-8')
scene = replace_exact(
    scene,
    """    const rarityCapsule = this.add.graphics();\n    const rarityColorNumber = Number.parseInt(copy.rarityColor.slice(1), 16);\n    const rarityDiamond = this.add\n""",
    """    const rarityCapsule = this.add.graphics();\n    const rarityDiamond = this.add\n""",
    'reuse existing rarity color number',
)
scene = replace_exact(
    scene,
    """    root.add(tearHint);\n    this.tearHint = tearHint;\n""",
    """    root.add(tearHint);\n    root.setData('tearHint', tearHint);\n    this.tearHint = tearHint;\n""",
    'register tear hint on root',
)
scene_path.write_text(scene, encoding='utf-8')

visuals_path = Path('src/game/ui/openingVisuals.ts')
visuals = visuals_path.read_text(encoding='utf-8')
visuals = replace_exact(
    visuals,
    """const findTearHint = (root: Phaser.GameObjects.Container): Phaser.GameObjects.Text | null => {\n  for (const child of root.list) {\n    if (\n      child instanceof Phaser.GameObjects.Text &&\n      Math.abs(child.y - MOTION_PRESENTATION.tearHintY) < 1\n    ) {\n      return child;\n    }\n  }\n  return null;\n};\n""",
    """const findTearHint = (root: Phaser.GameObjects.Container): Phaser.GameObjects.Text | null => {\n  const hint = root.getData('tearHint') as Phaser.GameObjects.Text | undefined;\n  return hint?.active ? hint : null;\n};\n""",
    'lookup tear hint by root reference',
)
visuals_path.write_text(visuals, encoding='utf-8')

presentation_test_path = Path('tests/presentation.test.ts')
presentation_test = presentation_test_path.read_text(encoding='utf-8')
presentation_test = replace_exact(
    presentation_test,
    "    expect(MOTION_PRESENTATION.tearHintY).toBeGreaterThan(POUCH_PRESENTATION.groupY + POUCH_PRESENTATION.shadowY);\n",
    "",
    'remove obsolete fixed tear hint assertion',
)
presentation_test_path.write_text(presentation_test, encoding='utf-8')

for path in [scene_path, visuals_path, presentation_test_path]:
    if 'tearHintY' in path.read_text(encoding='utf-8'):
        raise SystemExit(f'legacy tearHintY reference remains in {path}')

print('alignment follow-up applied')
