from pathlib import Path


def replace_exact(text: str, old: str, new: str, label: str, expected: int = 1) -> str:
    count = text.count(old)
    if count != expected:
        raise SystemExit(f"{label}: expected {expected} matches, found {count}")
    return text.replace(old, new)

presentation_path = Path('src/game/data/presentation.ts')
presentation = presentation_path.read_text(encoding='utf-8')
presentation = replace_exact(presentation, '  tearHintY: 632,\n', '', 'remove fixed tear hint y')
presentation = replace_exact(presentation, '  railTopOffset: 8,\n', '  railTopOffset: 8,\n  bottomActionInset: 24,\n', 'add shared bottom action inset')
presentation = replace_exact(presentation, '  panelY: 586,\n', '  panelY: 604,\n', 'lower result panel')
presentation_path.write_text(presentation, encoding='utf-8')

reward_layout_path = Path('src/game/systems/rewardLayout.ts')
reward_layout = reward_layout_path.read_text(encoding='utf-8')
reward_layout = replace_exact(reward_layout, '  safeTop: number;\n  centerX: number;\n', '  safeTop: number;\n  topOffset: number;\n  centerX: number;\n', 'add reward top offset input')
reward_layout = replace_exact(reward_layout, '  safeTop,\n  centerX,\n', '  safeTop,\n  topOffset,\n  centerX,\n', 'destructure reward top offset')
reward_layout = replace_exact(reward_layout, '  const y = safeTop + halfHeight + 18;\n', '  const y = safeTop + topOffset + halfHeight;\n', 'align reward top to hud top')
reward_layout_path.write_text(reward_layout, encoding='utf-8')

scene_path = Path('src/game/scenes/OpeningScene.ts')
scene = scene_path.read_text(encoding='utf-8')
scene = replace_exact(scene, """  private getChipsHudTarget(): { x: number; y: number } {\n    if (!this.metrics) return { x: 36, y: 24 };\n    return {\n      x: this.metrics.safeLeft + 25,\n      y: this.metrics.safeTop + OPENING_FEEL_PRESENTATION.railTopOffset + OPENING_FEEL_PRESENTATION.chipsHudHeight / 2,\n    };\n  }\n\n""", """  private getChipsHudTarget(): { x: number; y: number } {\n    if (!this.metrics) return { x: 36, y: 24 };\n    return {\n      x: this.metrics.safeLeft + 25,\n      y: this.metrics.safeTop + OPENING_FEEL_PRESENTATION.railTopOffset + OPENING_FEEL_PRESENTATION.chipsHudHeight / 2,\n    };\n  }\n\n  private getBottomActionY(): number {\n    const safeBottom = this.metrics?.safeBottom ?? LOGICAL_HEIGHT - 28;\n    return safeBottom - OPENING_FEEL_PRESENTATION.bottomActionInset;\n  }\n\n""", 'add bottom action baseline helper')
scene = replace_exact(scene, ".text(this.metrics.safeRight, this.metrics.safeBottom - 8, getMessages(getPlatformRuntime().language).opening.collection, {", ".text(this.metrics.safeRight, this.getBottomActionY(), getMessages(getPlatformRuntime().language).opening.collection, {", 'move collection to shared baseline')
scene = replace_exact(scene, '      .setOrigin(1, 1);\n', '      .setOrigin(1, 0.5);\n', 'center collection on baseline')
scene = replace_exact(scene, """    const tearHint = this.add\n      .text(metrics.centerX, MOTION_PRESENTATION.tearHintY, getMessages(getPlatformRuntime().language).opening.tearHint, {\n""", """    const bottomActionY = this.getBottomActionY();\n    const tearHint = this.add\n      .text(metrics.centerX, bottomActionY, getMessages(getPlatformRuntime().language).opening.tearHint, {\n""", 'align tear hint to collection baseline')
scene = replace_exact(scene, ".text(metrics.centerX, MOTION_PRESENTATION.tearHintY - 42, message, {", ".text(metrics.centerX, bottomActionY - 42, message, {", 'align idle message to bottom baseline')

scene = replace_exact(scene, """    const contentLeft = left + 13;\n    const contentRight = width / 2 - 13;\n""", """    const contentLeft = left + 13;\n    const contentRight = width / 2 - 13;\n    const iconX = contentLeft + 4;\n    const textX = contentLeft + 18;\n""", 'add reward grid columns')
scene = replace_exact(scene, "const header = this.add.text(contentLeft, 9, 'REWARD'", "const header = this.add.text(textX, 9, 'REWARD'", 'align reward header')
scene = replace_exact(scene, 'this.add.text(contentLeft, cursorY - 2, secretStatus', 'this.add.text(textX, cursorY - 2, secretStatus', 'align secret status')
scene = replace_exact(scene, 'createChipToken(this, contentLeft + 4, cursorY + 4, 0.48)', 'createChipToken(this, iconX, cursorY + 4, 0.48)', 'align chip icons', expected=2)
scene = replace_exact(scene, 'this.add.text(contentLeft + 18, cursorY - 3, `+${pending.chips.secretBonus}', 'this.add.text(textX, cursorY - 3, `+${pending.chips.secretBonus}', 'align secret bonus text')
scene = replace_exact(scene, 'this.add.text(contentLeft, cursorY, messages.opening.addedToCollection', 'this.add.text(textX, cursorY, messages.opening.addedToCollection', 'align collection reward text')
scene = replace_exact(scene, 'this.add.text(contentLeft + 18, cursorY - 3, `+${animatedTotalStart}', 'this.add.text(textX, cursorY - 3, `+${animatedTotalStart}', 'align total reward text')
scene = replace_exact(scene, 'this.add.text(contentLeft, cursorY, breakdownParts.join', 'this.add.text(textX, cursorY, breakdownParts.join', 'align breakdown text')
scene = replace_exact(scene, 'createSignalToken(this, contentLeft + 4, cursorY + 4, false)', 'createSignalToken(this, iconX, cursorY + 4, false)', 'align signal icon')
scene = replace_exact(scene, 'this.add.text(contentLeft + 18, cursorY, signalText', 'this.add.text(textX, cursorY, signalText', 'align signal text')
scene = replace_exact(scene, """      safeTop: this.metrics!.safeTop,\n      centerX: this.metrics!.centerX,\n""", """      safeTop: this.metrics!.safeTop,\n      topOffset: OPENING_FEEL_PRESENTATION.railTopOffset,\n      centerX: this.metrics!.centerX,\n""", 'pass shared hud top offset to reward layout')

old_heading = """  private positionResultHeading(\n    title: Phaser.GameObjects.Text,\n    rarity: Phaser.GameObjects.Text,\n  ): void {\n    const gap = 12;\n    const totalWidth = title.width + gap + rarity.width;\n    const startX = -totalWidth / 2;\n    title.setOrigin(0, 0.5).setPosition(startX, -32);\n    rarity.setOrigin(0, 0.5).setPosition(startX + title.width + gap, -32);\n    const capsule = rarity.getData('capsule') as Phaser.GameObjects.Graphics | undefined;\n    if (capsule) {\n      const capsuleColor = Number(rarity.getData('capsuleColor') ?? 0xf0ddff);\n      capsule.clear();\n      capsule.fillStyle(capsuleColor, 0.1);\n      capsule.fillRoundedRect(rarity.x - 7, rarity.y - rarity.height / 2 - 4, rarity.width + 14, rarity.height + 8, 9);\n      capsule.lineStyle(1.5, capsuleColor, 0.5);\n      capsule.strokeRoundedRect(rarity.x - 7, rarity.y - rarity.height / 2 - 4, rarity.width + 14, rarity.height + 8, 9);\n    }\n  }\n"""
new_heading = """  private positionResultHeading(\n    title: Phaser.GameObjects.Text,\n    rarity: Phaser.GameObjects.Text,\n  ): void {\n    const headingGap = 12;\n    const diamondTextOffset = 11;\n    const badgeContentWidth = diamondTextOffset + rarity.width;\n    const totalWidth = title.width + headingGap + badgeContentWidth;\n    const startX = -totalWidth / 2;\n    const headingY = -32;\n    title.setOrigin(0, 0.5).setPosition(startX, headingY);\n\n    const badgeLeft = startX + title.width + headingGap;\n    const diamond = rarity.getData('diamond') as Phaser.GameObjects.Rectangle | undefined;\n    if (diamond) diamond.setPosition(badgeLeft + 3.5, headingY);\n    rarity.setOrigin(0, 0.5).setPosition(badgeLeft + diamondTextOffset, headingY);\n\n    const capsule = rarity.getData('capsule') as Phaser.GameObjects.Graphics | undefined;\n    if (capsule) {\n      const capsuleColor = Number(rarity.getData('capsuleColor') ?? 0xf0ddff);\n      const contentHeight = Math.max(rarity.height, 7);\n      const capsuleLeft = badgeLeft - 7;\n      const capsuleTop = headingY - contentHeight / 2 - 4;\n      const capsuleWidth = badgeContentWidth + 14;\n      const capsuleHeight = contentHeight + 8;\n      capsule.clear();\n      capsule.fillStyle(capsuleColor, 0.1);\n      capsule.fillRoundedRect(capsuleLeft, capsuleTop, capsuleWidth, capsuleHeight, 9);\n      capsule.lineStyle(1.5, capsuleColor, 0.5);\n      capsule.strokeRoundedRect(capsuleLeft, capsuleTop, capsuleWidth, capsuleHeight, 9);\n    }\n  }\n"""
scene = replace_exact(scene, old_heading, new_heading, 'center rarity diamond geometrically')
scene = replace_exact(scene, """        rarity.setText(`◆ ${copy.rarity.toUpperCase()}`).setColor(copy.rarityColor);\n        rarity.setData('capsuleColor', Number.parseInt(copy.rarityColor.slice(1), 16));\n""", """        rarity.setText(copy.rarity.toUpperCase()).setColor(copy.rarityColor);\n        const updatedRarityColor = Number.parseInt(copy.rarityColor.slice(1), 16);\n        rarity.setData('capsuleColor', updatedRarityColor);\n        const diamond = rarity.getData('diamond') as Phaser.GameObjects.Rectangle | undefined;\n        if (diamond) diamond.setFillStyle(updatedRarityColor, 1).setStrokeStyle(1, 0xffffff, 0.28);\n""", 'update rarity diamond color on carousel switch')
scene = replace_exact(scene, """    const rarityCapsule = this.add.graphics();\n    const rarity = this.add.text(0, -32, `◆ ${copy.rarity.toUpperCase()}`, {\n      color: copy.rarityColor,\n      padding: { x: 3, y: 2 },\n      stroke: '#160f20',\n      strokeThickness: 1,\n      fontFamily: DIGITAL_FONT_FAMILY,\n      fontSize: '10px',\n      fontStyle: 'bold',\n    });\n    rarity.setData('capsule', rarityCapsule);\n    rarity.setData('capsuleColor', Number.parseInt(copy.rarityColor.slice(1), 16));\n""", """    const rarityCapsule = this.add.graphics();\n    const rarityColorNumber = Number.parseInt(copy.rarityColor.slice(1), 16);\n    const rarityDiamond = this.add\n      .rectangle(0, -32, 6, 6, rarityColorNumber, 1)\n      .setRotation(Math.PI / 4)\n      .setStrokeStyle(1, 0xffffff, 0.28);\n    const rarity = this.add.text(0, -32, copy.rarity.toUpperCase(), {\n      color: copy.rarityColor,\n      padding: { x: 0, y: 2 },\n      stroke: '#160f20',\n      strokeThickness: 1,\n      fontFamily: DIGITAL_FONT_FAMILY,\n      fontSize: '10px',\n      fontStyle: 'bold',\n    });\n    rarity.setData('capsule', rarityCapsule);\n    rarity.setData('capsuleColor', rarityColorNumber);\n    rarity.setData('diamond', rarityDiamond);\n""", 'create geometric rarity diamond')
scene = replace_exact(scene, "    const hint = this.add.text(0, 35, hintText, {\n", "    const hint = this.add.text(0, 43, hintText, {\n", 'lower collect hint inside panel')
scene = replace_exact(scene, "    panel.add([background, readyGlow, title, rarityCapsule, rarity, status, hint, actionZone]);\n", "    panel.add([background, readyGlow, title, rarityCapsule, rarityDiamond, rarity, status, hint, actionZone]);\n", 'add rarity diamond to result panel')
scene = replace_exact(scene, "    rarity.setScale(0.92).setAlpha(0);\n", "    rarity.setScale(0.92).setAlpha(0);\n    rarityDiamond.setScale(0.92).setAlpha(0);\n", 'initialize rarity diamond intro state')
scene = replace_exact(scene, "      targets: rarity,\n      scale: 1,\n", "      targets: [rarity, rarityDiamond],\n      scale: 1,\n", 'animate rarity diamond with badge')
if 'MOTION_PRESENTATION.tearHintY' in scene:
    raise SystemExit('legacy tearHintY usage remains in OpeningScene')
if '`◆ ${copy.rarity.toUpperCase()}`' in scene:
    raise SystemExit('legacy rarity glyph remains in result badge')
scene_path.write_text(scene, encoding='utf-8')

reward_test_path = Path('tests/reward-layout.test.ts')
reward_test = reward_test_path.read_text(encoding='utf-8')
reward_test = replace_exact(reward_test, """          safeTop: metrics.safeTop,\n          centerX: metrics.centerX,\n""", """          safeTop: metrics.safeTop,\n          topOffset: OPENING_FEEL_PRESENTATION.railTopOffset,\n          centerX: metrics.centerX,\n""", 'pass top offset in reward layout tests')
reward_test = replace_exact(reward_test, """        expect(tray.top).toBeGreaterThanOrEqual(metrics.safeTop);\n        expect(tray.bottom).toBeLessThan(190);\n""", """        expect(tray.top).toBeCloseTo(metrics.safeTop + OPENING_FEEL_PRESENTATION.railTopOffset);\n        expect(tray.bottom).toBeLessThan(190);\n""", 'assert exact reward and hud top baseline')
reward_test_path.write_text(reward_test, encoding='utf-8')

presentation_test_path = Path('tests/presentation.test.ts')
presentation_test = presentation_test_path.read_text(encoding='utf-8')
presentation_test = replace_exact(presentation_test, """  it('keeps idle vertical rhythm away from both the title and bottom edge', () => {\n    expect(POUCH_PRESENTATION.groupY).toBeGreaterThanOrEqual(260);\n    expect(MOTION_PRESENTATION.tearHintY - (POUCH_PRESENTATION.groupY + POUCH_PRESENTATION.shadowY)).toBeGreaterThan(60);\n    expect(MOTION_PRESENTATION.tearHintY).toBeLessThanOrEqual(640);\n    expect(RESULT_PRESENTATION.panelY).toBeGreaterThan(560);\n  });\n""", """  it('keeps the bottom action lane and result panel inside safe visual bounds', () => {\n    expect(POUCH_PRESENTATION.groupY).toBeGreaterThanOrEqual(260);\n    expect(OPENING_FEEL_PRESENTATION.bottomActionInset).toBeGreaterThanOrEqual(20);\n    expect(OPENING_FEEL_PRESENTATION.bottomActionInset).toBeLessThanOrEqual(32);\n    expect(RESULT_PRESENTATION.panelY).toBeGreaterThanOrEqual(600);\n    expect(RESULT_PRESENTATION.panelY + RESULT_PRESENTATION.panelHeight / 2).toBeLessThanOrEqual(668);\n  });\n""", 'update bottom action presentation test')
presentation_test_path.write_text(presentation_test, encoding='utf-8')

print('alignment pass applied')
