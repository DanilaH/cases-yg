from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    file = Path(path)
    text = file.read_text()
    if old not in text:
        raise SystemExit(f"{path}: expected text not found: {old[:120]!r}")
    file.write_text(text.replace(old, new, 1))


def replace_between(path: str, start: str, end: str, replacement: str) -> None:
    file = Path(path)
    text = file.read_text()
    start_index = text.find(start)
    if start_index < 0:
        raise SystemExit(f"{path}: start marker not found: {start!r}")
    end_index = text.find(end, start_index)
    if end_index < 0:
        raise SystemExit(f"{path}: end marker not found: {end!r}")
    file.write_text(text[:start_index] + replacement + text[end_index:])


replace_between(
    "src/game/data/presentation.ts",
    "export const MOTION_PRESENTATION = {",
    "export const REVEAL_MOTION_PRESENTATION = {",
    '''export const MOTION_PRESENTATION = {
  tearHintY: 632,
  starPulseScale: 1.07,
  starPulseDuration: 520,
  resultReadyGlowMinAlpha: 0.16,
  resultReadyGlowMaxAlpha: 0.46,
  resultReadyGlowDuration: 680,
  rewardBreathScale: 1.028,
  rewardBreathDuration: 1200,
} as const;

''',
)

replace_between(
    "src/game/data/presentation.ts",
    "export const OPENING_FEEL_PRESENTATION = {",
    "export const RESULT_PRESENTATION = {",
    '''export const OPENING_FEEL_PRESENTATION = {
  postTearSkipGuardMs: 120,
  resultReadHoldMs: 980,
  rewardTrayWidth: 210,
  rewardTraySideGap: 18,
  rewardTrayResultGap: 18,
  rewardTrayHeroHalfWidth: 144,
  chipsHudWidth: 216,
  chipsHudHeight: 64,
  signalHudWidth: 216,
  signalHudHeight: 64,
  railCardWidth: 216,
  railCardHeight: 58,
  railGap: 10,
  railUnavailableAlpha: 0.84,
  railUnavailableSurfaceAlpha: 0.78,
  railTopOffset: 8,
  selectorTopOffset: 164,
  bankLegMinDuration: 320,
  bankLegMaxDuration: 900,
  uiFadeInMs: 220,
  uiFadeOutMs: 180,
  uiPressMs: 70,
  hudShimmerDurationMs: 900,
  hudShimmerRepeatDelayMs: 2100,
} as const;

''',
)

replace_once(
    "tests/presentation.test.ts",
    "    expect(OPENING_FEEL_PRESENTATION.bankLegMaxDuration).toBeLessThanOrEqual(500);",
    "    expect(OPENING_FEEL_PRESENTATION.bankLegMaxDuration).toBeLessThanOrEqual(900);\n    expect(OPENING_FEEL_PRESENTATION.bankLegMinDuration).toBeGreaterThanOrEqual(300);\n    expect(OPENING_FEEL_PRESENTATION.chipsHudHeight).toBeLessThanOrEqual(64);\n    expect(OPENING_FEEL_PRESENTATION.signalHudHeight).toBeLessThanOrEqual(64);\n    expect(OPENING_FEEL_PRESENTATION.rewardTrayResultGap).toBeGreaterThanOrEqual(16);",
)
replace_once(
    "tests/presentation.test.ts",
    "    expect(MOTION_PRESENTATION.resultPulseScale).toBeGreaterThanOrEqual(1.035);\n    expect(MOTION_PRESENTATION.resultPulseScale).toBeLessThan(1.05);\n    expect(MOTION_PRESENTATION.resultPulseDuration).toBeLessThan(250);\n    expect(MOTION_PRESENTATION.resultPulseRepeatDelay).toBeGreaterThan(400);",
    "    expect(MOTION_PRESENTATION.resultReadyGlowMinAlpha).toBeLessThan(MOTION_PRESENTATION.resultReadyGlowMaxAlpha);\n    expect(MOTION_PRESENTATION.resultReadyGlowDuration).toBeGreaterThanOrEqual(500);\n    expect(MOTION_PRESENTATION.resultReadyGlowDuration).toBeLessThanOrEqual(900);",
)

replace_once(
    "src/game/scenes/OpeningScene.ts",
    "import { getGameAudio } from '../systems/audio';\nimport type { PendingReveal } from '../systems/drops';",
    "import { getGameAudio } from '../systems/audio';\nimport { chipEmissionDelay, createChipFlightPlan, shouldPlayChipClack } from '../systems/chipFlight';\nimport type { PendingReveal } from '../systems/drops';",
)
replace_once(
    "src/game/scenes/OpeningScene.ts",
    "import { createLayoutMetrics, readSafeAreaInsets, type LayoutMetrics } from '../systems/layout';",
    "import { createLayoutMetrics, readSafeAreaInsets, type LayoutMetrics } from '../systems/layout';\nimport { computeRewardTrayPlacement } from '../systems/rewardLayout';",
)
replace_once(
    "src/game/scenes/OpeningScene.ts",
    "  DIGITAL_FONT_FAMILY,\n  createChargedAura,\n  createChipToken,",
    "  DIGITAL_FONT_FAMILY,\n  createChargedAura,\n  createChipToken,\n  createFlyingChipToken,\n  createHudShimmer,\n  createSignalToken,",
)
replace_once(
    "src/game/scenes/OpeningScene.ts",
    "  private signalHudContainer: Phaser.GameObjects.Container | null = null;\n  private chargedAura: Phaser.GameObjects.Container | null = null;",
    "  private signalHudContainer: Phaser.GameObjects.Container | null = null;\n  private signalHudSegments: Phaser.GameObjects.Rectangle[] = [];\n  private hudShimmers: Phaser.GameObjects.Rectangle[] = [];\n  private chargedReadyPulsePending = false;\n  private chargedAura: Phaser.GameObjects.Container | null = null;",
)
replace_once(
    "src/game/scenes/OpeningScene.ts",
    "    this.ignoreNextResultTap = false;\n    this.presentationSkip.reset();",
    "    this.ignoreNextResultTap = false;\n    this.chargedReadyPulsePending = false;\n    this.presentationSkip.reset();",
)
replace_once(
    "src/game/scenes/OpeningScene.ts",
    "    this.clearAmbientMotion();\n    if (this.chargedAura)",
    "    this.clearAmbientMotion();\n    this.clearHudMotion();\n    if (this.chargedAura)",
)
replace_once(
    "src/game/scenes/OpeningScene.ts",
    "    this.signalHudContainer = null;\n    this.chargedAura = null;",
    "    this.signalHudContainer = null;\n    this.signalHudSegments = [];\n    this.chargedAura = null;",
)

# Product menu interaction sounds.
replace_once(
    "src/game/scenes/CollectionScene.ts",
    "    back.on('pointerdown', () => {\n      back.disableInteractive().setAlpha(0.65);",
    "    back.on('pointerdown', () => {\n      getGameAudio().play('ui-click');\n      back.disableInteractive().setAlpha(0.65);",
)
replace_once(
    "src/game/scenes/CollectionScene.ts",
    "    tab.on('pointerup', () => {\n      if (this.view === view) return;\n      this.view = view;",
    "    tab.on('pointerup', () => {\n      if (this.view === view) return;\n      getGameAudio().play('ui-click');\n      this.view = view;",
)
replace_once(
    "src/game/scenes/CollectionScene.ts",
    "    button.on('pointerup', () => {\n      const muted = audio.toggleMuted();",
    "    button.on('pointerup', () => {\n      const wasMuted = audio.isMuted();\n      if (!wasMuted) audio.play('ui-click');\n      const muted = audio.toggleMuted();\n      if (wasMuted && !muted) audio.play('ui-click');",
)
replace_once(
    "src/game/scenes/CollectionScene.ts",
    "      previous.setInteractive({ useHandCursor: true }).on('pointerup', () => {\n        this.page -= 1;",
    "      previous.setInteractive({ useHandCursor: true }).on('pointerup', () => {\n        getGameAudio().play('ui-click');\n        this.page -= 1;",
)
replace_once(
    "src/game/scenes/CollectionScene.ts",
    "      next.setInteractive({ useHandCursor: true }).on('pointerup', () => {\n        this.page += 1;",
    "      next.setInteractive({ useHandCursor: true }).on('pointerup', () => {\n        getGameAudio().play('ui-click');\n        this.page += 1;",
)
