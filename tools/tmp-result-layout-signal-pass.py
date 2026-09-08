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
    """    root.add(\n      this.add\n        .text(metrics.centerX, 62, getMessages(getPlatformRuntime().language).appTitle, {\n          color: '#f5eefc',\n          fontFamily: 'system-ui, sans-serif',\n          fontSize: '30px',\n          fontStyle: 'bold',\n        })\n        .setOrigin(0.5),\n    );\n\n""",
    "",
    'remove opening title',
)

scene = replace_exact(
    scene,
    """    this.renderResolvedResult(pending);\n\n    await this.waitPresentation(RESULT_HOLD_MS);\n    if (this.phase !== 'result') return;\n""",
    """    this.renderResolvedResult(pending);\n    // Signal is part of resolving the duplicate reward, not a late CHIPS-banking leg.\n    // Start the cosmetic transfer during the readable result phase; durable state is\n    // already committed above, so this remains presentation-only.\n    const signalTransfer = this.bankSignalGain(pending);\n\n    await this.waitPresentation(RESULT_HOLD_MS);\n    await signalTransfer;\n    if (this.phase !== 'result') return;\n""",
    'move signal transfer into result phase',
)

scene = replace_exact(
    scene,
    """    } else if (pending.signal.lockReached) {\n      status += ` · ${messages.opening.signalLockReady}`;\n    } else if (pending.signal.gain > 0) {\n      status += ` · ${messages.opening.signal} +${pending.signal.gain} · ${pending.signal.after}/${LITE_V2_BALANCE.signalThreshold}`;\n    }\n""",
    """    } else if (pending.signal.lockReached) {\n      status += ` · ${messages.opening.signalLockReady}`;\n    }\n""",
    'remove duplicated ordinary signal gain from result status',
)

scene = replace_exact(
    scene,
    """    const spark = this.add\n      .circle(origin.x + 17, origin.y + 10, 8, 0x76e9f5, 0.94)\n      .setStrokeStyle(2, 0xffffff, 0.58);\n    this.root.add(spark);\n    await this.runSkippableTween(\n      {\n        targets: spark,\n        x: signalTarget.x,\n        y: signalTarget.y,\n        scale: 0.38,\n        alpha: 0.22,\n        duration: 280,\n        ease: 'Cubic.In',\n      },\n      () => spark.destroy(),\n    );\n""",
    """    const spark = this.add\n      .circle(origin.x + 17, origin.y + 10, 8, 0x76e9f5, 0.94)\n      .setStrokeStyle(2, 0xffffff, 0.58);\n    this.root.add(spark);\n    let lastTrailAt = Number.NEGATIVE_INFINITY;\n    await this.runSkippableTween(\n      {\n        targets: spark,\n        x: signalTarget.x,\n        y: signalTarget.y,\n        scale: 0.38,\n        alpha: 0.22,\n        duration: 320,\n        ease: 'Cubic.In',\n        onUpdate: () => {\n          if (!spark.active || !this.root || this.isSceneShutdown()) return;\n          if (this.time.now - lastTrailAt < 34) return;\n          lastTrailAt = this.time.now;\n          const trail = this.add\n            .circle(spark.x, spark.y, 4.2, 0x8df8ff, 0.58)\n            .setBlendMode(Phaser.BlendModes.ADD);\n          this.root.add(trail);\n          this.tweens.add({\n            targets: trail,\n            alpha: 0,\n            scale: 0.18,\n            duration: 180,\n            ease: 'Sine.Out',\n            onComplete: () => trail.destroy(),\n          });\n        },\n      },\n      () => spark.destroy(),\n    );\n""",
    'add signal flight trail',
)

scene = replace_exact(
    scene,
    """    await bankLeg(pending.chips.secretBonus);\n    if (this.isSceneShutdown() || this.finishDeferredBankingResize()) return;\n    await this.bankSignalGain(pending);\n    if (this.isSceneShutdown() || this.finishDeferredBankingResize()) return;\n    await this.animateOverchargeTransition(pending);\n""",
    """    await bankLeg(pending.chips.secretBonus);\n    if (this.isSceneShutdown() || this.finishDeferredBankingResize()) return;\n    await this.animateOverchargeTransition(pending);\n""",
    'remove late signal banking leg',
)

scene_path.write_text(scene, encoding='utf-8')

presentation_path = Path('src/game/data/presentation.ts')
presentation = presentation_path.read_text(encoding='utf-8')
presentation = replace_exact(presentation, 'revealY: 310,', 'revealY: 328,', 'lower fallback and phone hero', expected=2)
presentation = replace_exact(presentation, 'revealY: 318,', 'revealY: 336,', 'lower camera hero')
presentation = replace_exact(presentation, 'panelY: 568,', 'panelY: 586,', 'lower result panel')
presentation = replace_exact(presentation, 'carouselDotY: 486,', 'carouselDotY: 504,', 'lower carousel dots')
presentation_path.write_text(presentation, encoding='utf-8')

reward_layout_path = Path('src/game/systems/rewardLayout.ts')
reward_layout = reward_layout_path.read_text(encoding='utf-8')
old_fn = """export const computeRewardTrayPlacement = ({\n  safeLeft,\n  safeRight,\n  safeTop,\n  centerX,\n  railRight,\n  resultPanelTop,\n  trayWidth,\n  trayHeight,\n  heroHalfWidth,\n  sideGap,\n  resultGap,\n}: RewardTrayPlacementInput): RewardTrayPlacement => {\n  const halfWidth = trayWidth / 2;\n  const halfHeight = trayHeight / 2;\n  const leftX = railRight + sideGap + halfWidth;\n  const rightX = safeRight - sideGap - halfWidth;\n  const heroLeft = centerX - heroHalfWidth;\n  const heroRight = centerX + heroHalfWidth;\n  const leftClearance = heroLeft - (leftX + halfWidth);\n  const rightClearance = rightX - halfWidth - heroRight;\n\n  let side: RewardTrayPlacement['side'];\n  // The persistent pouch/gameplay rail owns the left side. Prefer the free right\n  // reward slot whenever it fits; only fall back left when right is genuinely blocked.\n  if (rightClearance >= 0) {\n    side = 'right';\n  } else if (leftClearance >= 0) {\n    side = 'left';\n  } else {\n    side = rightClearance > leftClearance ? 'right' : 'left';\n  }\n\n  const preferredX = side === 'left' ? leftX : rightX;\n  const x = clamp(preferredX, safeLeft + halfWidth, safeRight - halfWidth);\n  const preferredY = resultPanelTop - resultGap - halfHeight;\n  const y = Math.max(safeTop + halfHeight, preferredY);\n\n  return { x, y, side };\n};\n"""
new_fn = """export const computeRewardTrayPlacement = ({\n  safeLeft,\n  safeRight,\n  safeTop,\n  centerX,\n  trayWidth,\n  trayHeight,\n}: RewardTrayPlacementInput): RewardTrayPlacement => {\n  const halfWidth = trayWidth / 2;\n  const halfHeight = trayHeight / 2;\n  const safeWidth = Math.max(1, safeRight - safeLeft);\n\n  // Result rewards belong to the hero/result reading path. Keep the tray in the\n  // upper center-right space previously occupied by the decorative product title,\n  // rather than pinning it to the far screen edge. The bounded offset preserves\n  // clear separation from the persistent left resource rail across supported widths.\n  const centerOffset = clamp(safeWidth * 0.12, 96, 160);\n  const x = clamp(centerX + centerOffset, safeLeft + halfWidth, safeRight - halfWidth);\n  const y = safeTop + halfHeight + 18;\n\n  return { x, y, side: 'right' };\n};\n"""
reward_layout = replace_exact(reward_layout, old_fn, new_fn, 'move reward tray to upper center-right')
reward_layout_path.write_text(reward_layout, encoding='utf-8')

reward_test_path = Path('tests/reward-layout.test.ts')
reward_test_path.write_text("""import { describe, expect, it } from 'vitest';\n\nimport { OPENING_FEEL_PRESENTATION, RESULT_PRESENTATION } from '../src/game/data/presentation';\nimport { createLayoutMetrics } from '../src/game/systems/layout';\nimport { computeRewardTrayPlacement, rectsOverlap, type LogicalRect } from '../src/game/systems/rewardLayout';\n\nconst rectFromCenter = (x: number, y: number, width: number, height: number): LogicalRect => ({\n  left: x - width / 2,\n  right: x + width / 2,\n  top: y - height / 2,\n  bottom: y + height / 2,\n});\n\ndescribe('reward tray layout', () => {\n  for (const width of [900, 1024, 1280]) {\n    for (const rows of [1, 2, 3, 4]) {\n      it(`keeps ${rows} reward rows in the upper center-right result lane at ${width}px`, () => {\n        const metrics = createLayoutMetrics(width, 720);\n        const trayHeight = 30 + rows * 22;\n        const placement = computeRewardTrayPlacement({\n          safeLeft: metrics.safeLeft,\n          safeRight: metrics.safeRight,\n          safeTop: metrics.safeTop,\n          centerX: metrics.centerX,\n          railRight: metrics.safeLeft + OPENING_FEEL_PRESENTATION.railCardWidth,\n          resultPanelTop: RESULT_PRESENTATION.panelY - RESULT_PRESENTATION.panelHeight / 2,\n          trayWidth: OPENING_FEEL_PRESENTATION.rewardTrayWidth,\n          trayHeight,\n          heroHalfWidth: OPENING_FEEL_PRESENTATION.rewardTrayHeroHalfWidth,\n          sideGap: OPENING_FEEL_PRESENTATION.rewardTraySideGap,\n          resultGap: OPENING_FEEL_PRESENTATION.rewardTrayResultGap,\n        });\n        const tray = rectFromCenter(\n          placement.x,\n          placement.y,\n          OPENING_FEEL_PRESENTATION.rewardTrayWidth,\n          trayHeight,\n        );\n        const rail: LogicalRect = {\n          left: metrics.safeLeft,\n          right: metrics.safeLeft + OPENING_FEEL_PRESENTATION.railCardWidth,\n          top: metrics.safeTop,\n          bottom: metrics.safeBottom,\n        };\n        const result: LogicalRect = rectFromCenter(\n          metrics.centerX,\n          RESULT_PRESENTATION.panelY,\n          RESULT_PRESENTATION.panelMaxWidth,\n          RESULT_PRESENTATION.panelHeight,\n        );\n        const hero: LogicalRect = {\n          left: metrics.centerX - OPENING_FEEL_PRESENTATION.rewardTrayHeroHalfWidth,\n          right: metrics.centerX + OPENING_FEEL_PRESENTATION.rewardTrayHeroHalfWidth,\n          top: 220,\n          bottom: 520,\n        };\n\n        expect(tray.left).toBeGreaterThanOrEqual(metrics.safeLeft);\n        expect(tray.right).toBeLessThanOrEqual(metrics.safeRight);\n        expect(tray.top).toBeGreaterThanOrEqual(metrics.safeTop);\n        expect(tray.bottom).toBeLessThan(190);\n        expect(rectsOverlap(tray, rail)).toBe(false);\n        expect(rectsOverlap(tray, result)).toBe(false);\n        expect(rectsOverlap(tray, hero)).toBe(false);\n        expect(placement.x).toBeGreaterThan(metrics.centerX);\n        expect(placement.x - metrics.centerX).toBeLessThanOrEqual(160);\n        expect(placement.side).toBe('right');\n      });\n    }\n  }\n});\n""", encoding='utf-8')

doc_path = Path('docs/GAMEPLAY_SYSTEMS.md')
doc = doc_path.read_text(encoding='utf-8')
doc = replace_exact(
    doc,
    """→ resolved readable result enters on a later beat while reward tray remains continuous\n→ player accepts\n→ base/cache/recycle bank to CHIPS HUD in order\n→ Signal fragment resolves to Signal HUD\n→ next action\n""",
    """→ resolved readable result enters on a later beat while reward tray remains continuous\n→ duplicate Signal gain, when present, transfers from reward tray to Signal HUD during the result read\n→ player accepts\n→ base/cache/recycle bank to CHIPS HUD in order\n→ next action\n""",
    'document early Signal transfer',
)
doc_path.write_text(doc, encoding='utf-8')

print('result layout + early Signal presentation patch applied')
