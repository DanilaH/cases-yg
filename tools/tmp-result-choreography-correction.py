from pathlib import Path


def replace_exact(text: str, old: str, new: str, label: str, expected: int = 1) -> str:
    count = text.count(old)
    if count != expected:
        raise SystemExit(f"{label}: expected {expected} matches, found {count}")
    return text.replace(old, new)


def remove_between(text: str, start: str, end: str, label: str) -> str:
    start_index = text.find(start)
    if start_index < 0:
        raise SystemExit(f"{label}: start marker not found")
    end_index = text.find(end, start_index)
    if end_index < 0:
        raise SystemExit(f"{label}: end marker not found")
    return text[:start_index] + text[end_index:]


scene_path = Path('src/game/scenes/OpeningScene.ts')
scene = scene_path.read_text(encoding='utf-8')

# Signal lock consumption must visually resolve before the pouch reveals its item.
scene = replace_exact(
    scene,
    """      await this.animateChipsPrelude(pending);\n      if (this.isSceneShutdown()) return;\n\n      const standardVisual = await this.animateStandardReveal(pending);\n""",
    """      await this.animateChipsPrelude(pending);\n      if (this.isSceneShutdown()) return;\n\n      await this.animateSignalLockConsumptionPrelude(pending);\n      if (this.isSceneShutdown()) return;\n\n      const standardVisual = await this.animateStandardReveal(pending);\n""",
    'insert pre-reveal signal lock consumption',
)

# Signal/Overcharge transitions are now part of reward issuance, not collect-time banking.
scene = replace_exact(
    scene,
    """    this.deferredResize = false;\n    this.renderResolvedResult(pending);\n    // Signal is part of resolving the duplicate reward, not a late CHIPS-banking leg.\n    // Resolve its short cosmetic transfer first, then spend only the remaining read\n    // budget. This preserves the established total hold while keeping the single-beat\n    // fast-forward controller sequential and deterministic.\n    const signalStartedAt = this.time.now;\n    await this.bankSignalGain(pending);\n    if (this.phase !== 'result' || this.isSceneShutdown()) return;\n    const remainingResultHold = Math.max(0, RESULT_HOLD_MS - (this.time.now - signalStartedAt));\n    await this.waitPresentation(remainingResultHold);\n""",
    """    this.deferredResize = false;\n    this.renderResolvedResult(pending);\n    await this.waitPresentation(RESULT_HOLD_MS);\n""",
    'remove late result-phase signal transfer',
)

# Result HUD reflects already-resolved Signal/Overcharge transitions; CHIPS still wait for collect banking.
scene = replace_exact(
    scene,
    """  private getResultPresentationState(pending: PendingReveal): SaveState | null {\n    if (!this.saveState) return null;\n    const visualSignal = pending.signal.lockConsumed\n      ? pending.signal.before\n      : pending.signal.gain > 0\n        ? pending.signal.before\n        : pending.signal.after;\n    return {\n      ...this.saveState,\n      chips: pending.chips.before - pending.chips.cost,\n      signal: visualSignal,\n      overchargeHundredths: pending.overcharge.beforeHundredths,\n    };\n  }\n""",
    """  private getResultPresentationState(pending: PendingReveal): SaveState | null {\n    if (!this.saveState) return null;\n    return {\n      ...this.saveState,\n      chips: pending.chips.before - pending.chips.cost,\n      signal: pending.signal.after,\n      overchargeHundredths: pending.overcharge.afterHundredths,\n    };\n  }\n""",
    'show resolved signal state in result hud',
)

# Shared placement for Hidden Pocket label: directly above the result info panel.
scene = replace_exact(
    scene,
    """  private getBottomActionY(): number {\n    const safeBottom = this.metrics?.safeBottom ?? LOGICAL_HEIGHT - 28;\n    return safeBottom - OPENING_FEEL_PRESENTATION.bottomActionInset;\n  }\n\n""",
    """  private getBottomActionY(): number {\n    const safeBottom = this.metrics?.safeBottom ?? LOGICAL_HEIGHT - 28;\n    return safeBottom - OPENING_FEEL_PRESENTATION.bottomActionInset;\n  }\n\n  private getHiddenPocketHeadingY(): number {\n    return RESULT_PRESENTATION.panelY - RESULT_PRESENTATION.panelHeight / 2 - 24;\n  }\n\n""",
    'add hidden pocket heading baseline helper',
)
scene = replace_exact(
    scene,
    """      metrics.centerX,\n      126,\n      getMessages(getPlatformRuntime().language).opening.hiddenPocket,\n""",
    """      metrics.centerX,\n      this.getHiddenPocketHeadingY(),\n      getMessages(getPlatformRuntime().language).opening.hiddenPocket,\n""",
    'move animated hidden pocket heading above info panel',
)
scene = replace_exact(
    scene,
    """    const heading = this.add.text(metrics.centerX, 126, messages.opening.hiddenPocket, {\n""",
    """    const heading = this.add.text(metrics.centerX, this.getHiddenPocketHeadingY(), messages.opening.hiddenPocket, {\n""",
    'move result hidden pocket heading above info panel',
)

# Hide/show the Hidden Pocket heading with the active carousel page.
position_marker = """    this.resultCarouselDots.forEach((dot, index) => {\n      dot.setFillStyle(\n        index === this.resultCarouselIndex ? activeDotColor : 0xece4f6,\n        index === this.resultCarouselIndex ? 0.95 : 0.35,\n      );\n    });\n"""
position_insert = position_marker + """\n    const secretSelected = Boolean(this.lastReveal?.hiddenPocket && this.resultCarouselIndex === 1);\n    if (this.resultCarouselHeading?.active) {\n      const heading = this.resultCarouselHeading;\n      this.tweens.killTweensOf(heading);\n      if (animate) {\n        heading.setVisible(true);\n        this.tweens.add({\n          targets: heading,\n          alpha: secretSelected ? 1 : 0,\n          duration: 140,\n          ease: 'Sine.Out',\n          onComplete: () => {\n            if (!secretSelected && heading.active) heading.setVisible(false);\n          },\n        });\n      } else {\n        heading.setVisible(secretSelected).setAlpha(secretSelected ? 1 : 0);\n      }\n    }\n"""
scene = replace_exact(scene, position_marker, position_insert, 'sync hidden pocket heading with carousel page')

# Reward tray: constrain long breakdowns to at most two semantic groups per row and allow wrapping.
scene = replace_exact(
    scene,
    """      if (breakdownParts.length > 1) {\n        const breakdown = this.add.text(textX, cursorY, breakdownParts.join(' · '), {\n          color: '#b9c8d7',\n          stroke: '#100b16',\n          strokeThickness: 2,\n          fontFamily: DIGITAL_FONT_FAMILY,\n          fontSize: '6px',\n        });\n        tray.add(breakdown);\n        cursorY += 19;\n      } else {\n        cursorY += 4;\n      }\n""",
    """      if (breakdownParts.length > 1) {\n        const breakdownRows = breakdownParts.length <= 2\n          ? [breakdownParts.join(' · ')]\n          : [breakdownParts.slice(0, 2).join(' · '), breakdownParts.slice(2).join(' · ')];\n        for (const row of breakdownRows) {\n          const breakdown = this.add.text(textX, cursorY, row, {\n            color: '#b9c8d7',\n            stroke: '#100b16',\n            strokeThickness: 2,\n            fontFamily: DIGITAL_FONT_FAMILY,\n            fontSize: '6px',\n            wordWrap: { width: width - 48, useAdvancedWrap: true },\n          });\n          tray.add(breakdown);\n          cursorY += Math.max(15, breakdown.height + 5);\n        }\n      } else {\n        cursorY += 4;\n      }\n""",
    'wrap reward breakdown rows',
)
scene = replace_exact(
    scene,
    """        const text = this.add.text(textX, cursorY, signalText, {\n          color: signalColor,\n          stroke: '#100b16',\n          strokeThickness: 2,\n          fontFamily: DIGITAL_FONT_FAMILY,\n          fontSize: '6px',\n        });\n        tray.add([icon, text]);\n        cursorY += 18;\n""",
    """        const text = this.add.text(textX, cursorY, signalText, {\n          color: signalColor,\n          stroke: '#100b16',\n          strokeThickness: 2,\n          fontFamily: DIGITAL_FONT_FAMILY,\n          fontSize: '6px',\n          wordWrap: { width: width - 48, useAdvancedWrap: true },\n        });\n        tray.add([icon, text]);\n        cursorY += Math.max(18, text.height + 5);\n""",
    'wrap reward signal status',
)

# Charged aura gets the same exit choreography as the pouch instead of blinking away later.
scene = replace_exact(
    scene,
    """  private applyChargedPouchTreatment(): void {\n""",
    """  private startChargedAuraExit(delay: number, duration: number): void {\n    const aura = this.chargedAura;\n    if (!aura?.active) return;\n    this.tweens.killTweensOf(aura);\n    const targetY = aura.y + 18;\n    this.tweens.add({\n      targets: aura,\n      y: targetY,\n      scale: 0.965,\n      alpha: 0,\n      delay,\n      duration,\n      ease: 'Cubic.InOut',\n      onComplete: () => {\n        if (aura.active) aura.destroy(true);\n        if (this.chargedAura === aura) this.chargedAura = null;\n      },\n    });\n  }\n\n  private applyChargedPouchTreatment(): void {\n""",
    'add charged aura exit choreography',
)
scene = replace_exact(
    scene,
    """    // Keep z-order stable: the reward remains behind the pouch while both move.\n    // The pouch exits downward and fades, uncovering the reward continuously.\n    this.tweens.add({\n""",
    """    // Keep z-order stable: the reward remains behind the pouch while both move.\n    // The pouch and its Charged aura exit together so no glow is left hanging behind.\n    this.startChargedAuraExit(\n      REVEAL_MOTION_PRESENTATION.pouchExitDelay,\n      REVEAL_MOTION_PRESENTATION.pouchExitDuration,\n    );\n    this.tweens.add({\n""",
    'fade charged aura with normal pouch exit',
)
scene = replace_exact(
    scene,
    """  private async animateRecoveredReveal(pending: PendingReveal): Promise<void> {\n    if (!this.root || !this.metrics) return;\n    this.pouch?.group.setAlpha(0);\n""",
    """  private async animateRecoveredReveal(pending: PendingReveal): Promise<void> {\n    if (!this.root || !this.metrics) return;\n    if (this.pouch?.group.active) {\n      this.tweens.killTweensOf(this.pouch.group);\n      this.tweens.add({\n        targets: this.pouch.group,\n        y: this.pouch.group.y + 22,\n        scale: 0.97,\n        alpha: 0,\n        duration: 180,\n        ease: 'Cubic.InOut',\n      });\n    }\n    this.startChargedAuraExit(0, 180);\n""",
    'fade pouch and charged aura on recovered reveal',
)

# Signal lock consumption prelude: visible trail into the still-closed pouch before any item reveal.
prelude_marker = """  private async bankSignalGain(pending: PendingReveal): Promise<void> {\n"""
prelude_method = """  private async animateSignalLockConsumptionPrelude(pending: PendingReveal): Promise<void> {\n    if (!pending.signal.lockConsumed || !this.root || !this.metrics || !this.saveState || !this.pouch) return;\n\n    const signalOrigin = {\n      x: this.metrics.safeLeft + OPENING_FEEL_PRESENTATION.signalHudWidth / 2,\n      y:\n        this.metrics.safeTop +\n        OPENING_FEEL_PRESENTATION.railTopOffset +\n        OPENING_FEEL_PRESENTATION.chipsHudHeight +\n        10 +\n        OPENING_FEEL_PRESENTATION.signalHudHeight / 2,\n    };\n    const pouchTarget = {\n      x: this.pouch.group.x,\n      y: this.pouch.group.y + POUCH_PRESENTATION.body.y,\n    };\n    const discharge = this.add\n      .circle(signalOrigin.x, signalOrigin.y, 9, 0xff8ed1, 0.98)\n      .setStrokeStyle(2, 0xffffff, 0.72)\n      .setBlendMode(Phaser.BlendModes.ADD);\n    const ring = this.add\n      .circle(signalOrigin.x, signalOrigin.y, 18, 0x9d7cff, 0.12)\n      .setStrokeStyle(3, 0x9d7cff, 0.76)\n      .setBlendMode(Phaser.BlendModes.ADD);\n    this.root.add([ring, discharge]);\n    getGameAudio().play('signal-lock');\n    this.tweens.add({\n      targets: ring,\n      scale: 2.4,\n      alpha: 0,\n      duration: 280,\n      ease: 'Cubic.Out',\n      onComplete: () => ring.destroy(),\n    });\n\n    let lastTrailAt = Number.NEGATIVE_INFINITY;\n    await this.runSkippableTween(\n      {\n        targets: discharge,\n        x: pouchTarget.x,\n        y: pouchTarget.y,\n        scale: 0.5,\n        alpha: 0.34,\n        duration: 420,\n        ease: 'Cubic.In',\n        onUpdate: () => {\n          if (!discharge.active || !this.root || this.isSceneShutdown()) return;\n          if (this.time.now - lastTrailAt < 28) return;\n          lastTrailAt = this.time.now;\n          const trailColor = Math.floor(this.time.now / 28) % 2 === 0 ? 0xff8ed1 : 0x8df8ff;\n          const trail = this.add\n            .circle(discharge.x, discharge.y, 5.2, trailColor, 0.7)\n            .setBlendMode(Phaser.BlendModes.ADD);\n          this.root.add(trail);\n          this.tweens.add({\n            targets: trail,\n            alpha: 0,\n            scale: 0.12,\n            duration: 220,\n            ease: 'Sine.Out',\n            onComplete: () => trail.destroy(),\n          });\n        },\n      },\n      () => discharge.destroy(),\n    );\n    if (!this.root || this.isSceneShutdown()) return;\n\n    const impact = this.add\n      .circle(pouchTarget.x, pouchTarget.y, 16, 0x8df8ff, 0.28)\n      .setStrokeStyle(3, 0xff8ed1, 0.82)\n      .setBlendMode(Phaser.BlendModes.ADD);\n    this.root.add(impact);\n    this.tweens.add({\n      targets: impact,\n      scale: 2.2,\n      alpha: 0,\n      duration: 240,\n      ease: 'Cubic.Out',\n      onComplete: () => impact.destroy(),\n    });\n    this.cameras.main.shake(95, 0.0019);\n    this.renderSignalHud(this.root, {\n      ...this.saveState,\n      signal: pending.signal.after,\n      overchargeHundredths: pending.overcharge.afterHundredths,\n    });\n    if (this.signalHudContainer) {\n      this.tweens.add({ targets: this.signalHudContainer, scale: 0.97, duration: 85, yoyo: true, ease: 'Sine.Out' });\n    }\n    await this.waitPresentation(90);\n  }\n\n""" + prelude_marker
scene = replace_exact(scene, prelude_marker, prelude_method, 'add signal lock consumption prelude')

# Signal gain also resolves during reward issuance and renders the after-state HUD.
scene = replace_exact(
    scene,
    """    this.renderSignalHud(this.root, this.saveState);\n    this.animateSignalArrival(pending);\n""",
    """    this.renderSignalHud(this.root, {\n      ...this.saveState,\n      signal: pending.signal.after,\n      overchargeHundredths: pending.overcharge.beforeHundredths,\n    });\n    this.animateSignalArrival(pending);\n""",
    'render signal gain after-state',
)

# lockConsumed is no longer a collect-time branch inside Overcharge transition.
scene = remove_between(
    scene,
    """    if (pending.signal.lockConsumed) {\n      const targetY = getCollectiblePresentation(pending.standard.familyId).revealY;\n""",
    """  }\n\n  private finishDeferredBankingResize(): boolean {\n""",
    'remove late lock-consumed overcharge branch',
)

scene = replace_exact(
    scene,
    """    await bankLeg(pending.chips.secretBonus);\n    if (this.isSceneShutdown() || this.finishDeferredBankingResize()) return;\n    await this.animateOverchargeTransition(pending);\n    if (this.isSceneShutdown() || this.finishDeferredBankingResize()) return;\n\n    this.setChipsHudValue(pending.chips.after, false);\n""",
    """    await bankLeg(pending.chips.secretBonus);\n    if (this.isSceneShutdown() || this.finishDeferredBankingResize()) return;\n\n    this.setChipsHudValue(pending.chips.after, false);\n""",
    'remove collect-time overcharge transition',
)
scene = replace_exact(
    scene,
    """  private async animatePostStandardEconomy(\n    pending: PendingReveal,\n    standardVisual: Phaser.GameObjects.Container,\n  ): Promise<void> {\n    await this.animateRewardStaging(pending, standardVisual);\n  }\n""",
    """  private async animatePostStandardEconomy(\n    pending: PendingReveal,\n    standardVisual: Phaser.GameObjects.Container,\n  ): Promise<void> {\n    await this.animateRewardStaging(pending, standardVisual);\n    if (this.isSceneShutdown()) return;\n    await this.bankSignalGain(pending);\n    if (this.isSceneShutdown()) return;\n    await this.animateOverchargeTransition(pending);\n  }\n""",
    'resolve signal and overcharge during reward issuance',
)

# Result panel border must follow the currently selected carousel rarity instead of sticking on SECRET.
scene = replace_exact(
    scene,
    """      const status = panel.getData('status') as Phaser.GameObjects.Text | undefined;\n      const hint = panel.getData('hint') as Phaser.GameObjects.Text | undefined;\n      if (title && rarity && status && hint) {\n""",
    """      const status = panel.getData('status') as Phaser.GameObjects.Text | undefined;\n      const hint = panel.getData('hint') as Phaser.GameObjects.Text | undefined;\n      const background = panel.getData('background') as Phaser.GameObjects.Graphics | undefined;\n      const panelWidth = Number(panel.getData('panelWidth') ?? 0);\n      if (title && rarity && status && hint) {\n""",
    'read result panel chrome data',
)
scene = replace_exact(
    scene,
    """        const updatedRarityColor = Number.parseInt(copy.rarityColor.slice(1), 16);\n        rarity.setData('capsuleColor', updatedRarityColor);\n""",
    """        const updatedRarityColor = Number.parseInt(copy.rarityColor.slice(1), 16);\n        rarity.setData('capsuleColor', updatedRarityColor);\n        if (background && panelWidth > 0) {\n          background.clear();\n          background.fillStyle(0x21172e, 0.84);\n          background.fillRoundedRect(\n            -panelWidth / 2,\n            -RESULT_PRESENTATION.panelHeight / 2,\n            panelWidth,\n            RESULT_PRESENTATION.panelHeight,\n            22,\n          );\n          background.lineStyle(2, Number.isFinite(updatedRarityColor) ? updatedRarityColor : 0xf0ddff, 0.44);\n          background.strokeRoundedRect(\n            -panelWidth / 2,\n            -RESULT_PRESENTATION.panelHeight / 2,\n            panelWidth,\n            RESULT_PRESENTATION.panelHeight,\n            22,\n          );\n        }\n""",
    'redraw result panel border on carousel switch',
)
scene = replace_exact(
    scene,
    """    panel.setData('readyGlow', readyGlow);\n    panel.setData('title', title);\n""",
    """    panel.setData('readyGlow', readyGlow);\n    panel.setData('background', background);\n    panel.setData('panelWidth', panelWidth);\n    panel.setData('title', title);\n""",
    'store result panel chrome data',
)

# Guard against regressions in this correction batch.
for forbidden in [
    "await this.animateOverchargeTransition(pending);\n    if (this.isSceneShutdown() || this.finishDeferredBankingResize()) return;",
    "const signalStartedAt = this.time.now;",
    "metrics.centerX, 126, messages.opening.hiddenPocket",
]:
    if forbidden in scene:
        raise SystemExit(f'forbidden legacy choreography remains: {forbidden}')

scene_path.write_text(scene, encoding='utf-8')
print('result choreography correction applied')
