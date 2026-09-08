from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    file = Path(path)
    text = file.read_text()
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"Expected exactly one match in {path}, found {count}: {old[:80]!r}")
    file.write_text(text.replace(old, new, 1))


replace_once(
    "src/game/data/presentation.ts",
    """export const RESULT_PRESENTATION = {\n  panelY: 604,\n  panelHeight: 112,\n  panelMaxWidth: 430,\n""",
    """export const RESULT_PRESENTATION = {\n  // Keep the lower result card visually grounded near the bottom action line.\n  panelY: 620,\n  panelHeight: 112,\n  // Three optical row anchors keep title, state and CTA evenly distributed.\n  headingY: -31,\n  statusY: 1,\n  hintY: 35,\n  panelMaxWidth: 430,\n""",
)

replace_once(
    "src/i18n/en.ts",
    """    signalLockReady: 'LOCK READY',\n    signalLockRetained: 'LOCK RETAINED',\n    signalLockConsumed: 'LOCK CONSUMED',\n    signalCharged: 'LOCK · CHARGED',\n""",
    """    signalLockReady: 'SIGNAL LOCK READY',\n    signalLockRetained: 'SIGNAL LOCK RETAINED',\n    signalLockConsumed: 'SIGNAL LOCK CONSUMED',\n    signalCharged: 'SIGNAL LOCK · CHARGED',\n""",
)

replace_once(
    "src/i18n/ru.ts",
    """    signalLockReady: 'LOCK ГОТОВ',\n    signalLockRetained: 'LOCK СОХРАНЁН',\n    signalLockConsumed: 'LOCK ИСПОЛЬЗОВАН',\n    signalCharged: 'LOCK · CHARGED',\n""",
    """    signalLockReady: 'SIGNAL LOCK ГОТОВ',\n    signalLockRetained: 'SIGNAL LOCK СОХРАНЁН',\n    signalLockConsumed: 'SIGNAL LOCK ИСПОЛЬЗОВАН',\n    signalCharged: 'SIGNAL LOCK · CHARGED',\n""",
)

replace_once(
    "src/game/scenes/OpeningScene.ts",
    """  private getStandardResultStatus(pending: PendingReveal): string {\n    const messages = getMessages(getPlatformRuntime().language);\n    let status = pending.standard.isNew ? messages.opening.newItem : messages.opening.duplicate;\n    if (pending.signal.lockConsumed) {\n      status += ` · ${messages.opening.signalLockConsumed}`;\n    } else if (pending.signal.lockRetained) {\n      status += ` · ${messages.opening.signalLockRetained}`;\n    } else if (pending.signal.lockReached) {\n      status += ` · ${messages.opening.signalLockReady}`;\n    }\n    return status;\n  }\n""",
    """  private getStandardResultStatusParts(pending: PendingReveal): {\n    base: string;\n    mechanic: string | null;\n    mechanicColor: string;\n  } {\n    const messages = getMessages(getPlatformRuntime().language);\n    const base = pending.standard.isNew ? messages.opening.newItem : messages.opening.duplicate;\n    if (pending.signal.lockConsumed) {\n      return { base, mechanic: messages.opening.signalLockConsumed, mechanicColor: '#ff9ed4' };\n    }\n    if (pending.signal.lockRetained) {\n      return { base, mechanic: messages.opening.signalLockRetained, mechanicColor: '#b7a7ff' };\n    }\n    if (pending.signal.lockReached) {\n      return { base, mechanic: messages.opening.signalLockReady, mechanicColor: '#8df8ff' };\n    }\n    return { base, mechanic: null, mechanicColor: '#b7a7ff' };\n  }\n\n  private getStandardResultStatus(pending: PendingReveal): string {\n    const { base, mechanic } = this.getStandardResultStatusParts(pending);\n    return mechanic ? `${base} · ${mechanic}` : base;\n  }\n""",
)

replace_once(
    "src/game/scenes/OpeningScene.ts",
    """  private getResultPanelCopy(pending: PendingReveal): {\n    title: string;\n    rarity: string;\n    rarityColor: string;\n    status: string;\n    statusColor: string;\n  } {\n    const language = getPlatformRuntime().language;\n    const messages = getMessages(language);\n    if (pending.hiddenPocket && this.resultCarouselIndex === 1) {\n      const family = SLICE_REGISTRY.familyById.get(pending.hiddenPocket.familyId);\n      return {\n        title: family?.name[language] ?? pending.hiddenPocket.familyId,\n        rarity: messages.rarity.secret,\n        rarityColor: '#ff4d6d',\n        status: pending.hiddenPocket.isNew ? messages.opening.secretDiscovered : messages.opening.secretDuplicate,\n        statusColor: pending.hiddenPocket.isNew ? '#ffdca0' : '#ffb0be',\n      };\n    }\n\n    const family = SLICE_REGISTRY.familyById.get(pending.standard.familyId);\n    return {\n      title: `${pending.pouchType === 'charged' ? '⚡ ' : ''}${family?.name[language] ?? pending.standard.familyId}`,\n      rarity: messages.rarity[pending.standard.rarity],\n      rarityColor: `#${RARITY_REVEAL_COLORS[pending.standard.rarity].toString(16).padStart(6, '0')}`,\n      status: this.getStandardResultStatus(pending),\n      statusColor: pending.standard.isNew ? '#f7f2ff' : '#c7f8ff',\n    };\n  }\n""",
    """  private getResultPanelCopy(pending: PendingReveal): {\n    title: string;\n    rarity: string;\n    rarityColor: string;\n    status: string;\n    statusColor: string;\n    statusAccent: string | null;\n    statusAccentColor: string;\n  } {\n    const language = getPlatformRuntime().language;\n    const messages = getMessages(language);\n    if (pending.hiddenPocket && this.resultCarouselIndex === 1) {\n      const family = SLICE_REGISTRY.familyById.get(pending.hiddenPocket.familyId);\n      return {\n        title: family?.name[language] ?? pending.hiddenPocket.familyId,\n        rarity: messages.rarity.secret,\n        rarityColor: '#ff4d6d',\n        status: pending.hiddenPocket.isNew ? messages.opening.secretDiscovered : messages.opening.secretDuplicate,\n        statusColor: pending.hiddenPocket.isNew ? '#ffdca0' : '#ffb0be',\n        statusAccent: null,\n        statusAccentColor: '#ff9ed4',\n      };\n    }\n\n    const family = SLICE_REGISTRY.familyById.get(pending.standard.familyId);\n    const statusParts = this.getStandardResultStatusParts(pending);\n    return {\n      title: `${pending.pouchType === 'charged' ? '⚡ ' : ''}${family?.name[language] ?? pending.standard.familyId}`,\n      rarity: messages.rarity[pending.standard.rarity],\n      rarityColor: `#${RARITY_REVEAL_COLORS[pending.standard.rarity].toString(16).padStart(6, '0')}`,\n      status: statusParts.base,\n      statusColor: pending.standard.isNew ? '#f7f2ff' : '#c7f8ff',\n      statusAccent: statusParts.mechanic,\n      statusAccentColor: statusParts.mechanicColor,\n    };\n  }\n""",
)

replace_once(
    "src/game/scenes/OpeningScene.ts",
    """    const headingY = -32;\n""",
    """    const headingY = RESULT_PRESENTATION.headingY;\n""",
)

replace_once(
    "src/game/scenes/OpeningScene.ts",
    """  private renderResultActionPanel(pending: PendingReveal): void {\n""",
    """  private positionResultStatus(\n    status: Phaser.GameObjects.Text,\n    statusAccent: Phaser.GameObjects.Text,\n  ): void {\n    const statusY = RESULT_PRESENTATION.statusY;\n    status.setY(statusY);\n    statusAccent.setY(statusY);\n    if (!statusAccent.text) {\n      status.setOrigin(0.5, 0.5).setX(0);\n      statusAccent.setVisible(false);\n      return;\n    }\n\n    statusAccent.setVisible(true);\n    status.setOrigin(0, 0.5);\n    statusAccent.setOrigin(0, 0.5);\n    const totalWidth = status.width + statusAccent.width;\n    const startX = -totalWidth / 2;\n    status.setX(startX);\n    statusAccent.setX(startX + status.width);\n  }\n\n  private renderResultActionPanel(pending: PendingReveal): void {\n""",
)

replace_once(
    "src/game/scenes/OpeningScene.ts",
    """      const status = panel.getData('status') as Phaser.GameObjects.Text | undefined;\n      const hint = panel.getData('hint') as Phaser.GameObjects.Text | undefined;\n      const background = panel.getData('background') as Phaser.GameObjects.Graphics | undefined;\n      const panelWidth = Number(panel.getData('panelWidth') ?? 0);\n      if (title && rarity && status && hint) {\n""",
    """      const status = panel.getData('status') as Phaser.GameObjects.Text | undefined;\n      const statusAccent = panel.getData('statusAccent') as Phaser.GameObjects.Text | undefined;\n      const hint = panel.getData('hint') as Phaser.GameObjects.Text | undefined;\n      const background = panel.getData('background') as Phaser.GameObjects.Graphics | undefined;\n      const panelWidth = Number(panel.getData('panelWidth') ?? 0);\n      if (title && rarity && status && statusAccent && hint) {\n""",
)

replace_once(
    "src/game/scenes/OpeningScene.ts",
    """        status.setText(copy.status).setColor(copy.statusColor);\n        this.positionResultHeading(title, rarity);\n""",
    """        status.setText(copy.status).setColor(copy.statusColor);\n        statusAccent\n          .setText(copy.statusAccent ? ` · ${copy.statusAccent}` : '')\n          .setColor(copy.statusAccentColor);\n        this.positionResultHeading(title, rarity);\n        this.positionResultStatus(status, statusAccent);\n""",
)

replace_once(
    "src/game/scenes/OpeningScene.ts",
    """    const title = this.add.text(0, -32, copy.title, {\n""",
    """    const title = this.add.text(0, RESULT_PRESENTATION.headingY, copy.title, {\n""",
)

replace_once(
    "src/game/scenes/OpeningScene.ts",
    """      .rectangle(0, -32, 6, 6, rarityColorNumber, 1)\n""",
    """      .rectangle(0, RESULT_PRESENTATION.headingY, 6, 6, rarityColorNumber, 1)\n""",
)

replace_once(
    "src/game/scenes/OpeningScene.ts",
    """    const rarity = this.add.text(0, -32, copy.rarity.toUpperCase(), {\n""",
    """    const rarity = this.add.text(0, RESULT_PRESENTATION.headingY, copy.rarity.toUpperCase(), {\n""",
)

replace_once(
    "src/game/scenes/OpeningScene.ts",
    """    const status = this.add.text(0, 0, copy.status, {\n      color: copy.statusColor,\n      stroke: '#160f20',\n      strokeThickness: 2,\n      fontFamily: DIGITAL_FONT_FAMILY,\n      fontSize: '10px',\n    }).setOrigin(0.5);\n    const hint = this.add.text(0, 43, hintText, {\n""",
    """    const status = this.add.text(0, RESULT_PRESENTATION.statusY, copy.status, {\n      color: copy.statusColor,\n      stroke: '#160f20',\n      strokeThickness: 2,\n      fontFamily: DIGITAL_FONT_FAMILY,\n      fontSize: '10px',\n    }).setOrigin(0.5);\n    const statusAccent = this.add.text(\n      0,\n      RESULT_PRESENTATION.statusY,\n      copy.statusAccent ? ` · ${copy.statusAccent}` : '',\n      {\n        color: copy.statusAccentColor,\n        stroke: '#160f20',\n        strokeThickness: 2,\n        fontFamily: DIGITAL_FONT_FAMILY,\n        fontSize: '10px',\n      },\n    ).setOrigin(0, 0.5);\n    this.positionResultStatus(status, statusAccent);\n    const hint = this.add.text(0, RESULT_PRESENTATION.hintY, hintText, {\n""",
)

replace_once(
    "src/game/scenes/OpeningScene.ts",
    """    panel.add([background, readyGlow, title, rarityCapsule, rarityDiamond, rarity, status, hint, actionZone]);\n""",
    """    panel.add([background, readyGlow, title, rarityCapsule, rarityDiamond, rarity, status, statusAccent, hint, actionZone]);\n""",
)

replace_once(
    "src/game/scenes/OpeningScene.ts",
    """    panel.setData('status', status);\n    panel.setData('hint', hint);\n""",
    """    panel.setData('status', status);\n    panel.setData('statusAccent', statusAccent);\n    panel.setData('hint', hint);\n""",
)

print("final result panel correction applied")
