from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    file = Path(path)
    text = file.read_text()
    if old not in text:
        raise SystemExit(f"{path}: expected text not found: {old[:120]!r}")
    file.write_text(text.replace(old, new, 1))


# 1) Tuck the pouch body slightly farther under the authored tear strip so the
# silver upper shoulders do not peek 5–10 logical px above it in idle states.
replace_once(
    "src/game/data/presentation.ts",
    "body: { x: 0, y: 92, displayWidth: 420 } satisfies PouchLayerPresentation,",
    "body: { x: 0, y: 98, displayWidth: 420 } satisfies PouchLayerPresentation,",
)

# 2) Own the idle tear hint in OpeningScene as well as the pouch pointer helper,
# so recovery reveals (which have no pointerdown) cannot leave the stale hint on screen.
replace_once(
    "src/game/scenes/OpeningScene.ts",
    "  private rewardTrayContainer: Phaser.GameObjects.Container | null = null;\n  private readonly presentationSkip = new PresentationSkipController();",
    "  private rewardTrayContainer: Phaser.GameObjects.Container | null = null;\n  private tearHint: Phaser.GameObjects.Text | null = null;\n  private readonly presentationSkip = new PresentationSkipController();",
)
replace_once(
    "src/game/scenes/OpeningScene.ts",
    "    this.rewardTrayContainer = null;\n    const metrics = createLayoutMetrics",
    "    this.rewardTrayContainer = null;\n    this.tearHint = null;\n    const metrics = createLayoutMetrics",
)
replace_once(
    "src/game/scenes/OpeningScene.ts",
    "    root.add(tearHint);\n\n    if (message) {",
    "    root.add(tearHint);\n    this.tearHint = tearHint;\n\n    if (message) {",
)
replace_once(
    "src/game/scenes/OpeningScene.ts",
    "      fontSize: waitingForCharged ? '8px' : '10px',",
    "      fontSize: waitingForCharged ? '7px' : '10px',",
)
replace_once(
    "src/game/scenes/OpeningScene.ts",
    "    this.phase = 'revealing';\n    this.setChromeEnabled(false);\n    this.pouch.dragZone.disableInteractive();\n\n    if (recovered) {",
    "    this.phase = 'revealing';\n    this.setChromeEnabled(false);\n    this.pouch.dragZone.disableInteractive();\n    if (this.tearHint) {\n      this.tweens.killTweensOf(this.tearHint);\n      this.tearHint.setAlpha(0);\n    }\n\n    if (recovered) {",
)
