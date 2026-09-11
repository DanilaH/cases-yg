import { readFile, writeFile } from 'node:fs/promises';

const replaceOnce = (source, search, replacement, label) => {
  if (!source.includes(search)) throw new Error(`Missing patch anchor: ${label}`);
  return source.replace(search, replacement);
};

const replaceRegexOnce = (source, regex, replacement, label) => {
  if (!regex.test(source)) throw new Error(`Missing patch anchor: ${label}`);
  return source.replace(regex, replacement);
};

// presentation.ts
{
  const path = 'src/game/data/presentation.ts';
  let source = await readFile(path, 'utf8');
  source = replaceOnce(
    source,
    "import type { GameLootPoolId, StandardRarity } from './collectibles';",
    "import type { StandardRarity } from './collectibles';",
    'presentation import',
  );
  source = replaceRegexOnce(
    source,
    /export type DropPouchMotif = 'spark'[\s\S]*?export const getDropPouchSkin = \(lootPoolId: GameLootPoolId\): DropPouchSkin =>\n  DROP_POUCH_SKINS\[lootPoolId\];\n\n/,
    '',
    'runtime Drop pouch skins',
  );
  source = replaceOnce(source, '  holdMs: 1850,', '  holdMs: 2400,', 'milestone dwell');
  source = replaceOnce(source, '  discoveryHoldMs: 150,', '  discoveryHoldMs: 650,', 'discovery dwell');
  source = replaceOnce(source, '  duplicateConversionAccentMs: 260,', '  duplicateConversionAccentMs: 720,', 'duplicate badge dwell');
  source = replaceOnce(
    source,
    '  revealBackdropFadeOutMs: 300,\n  duplicateConversionAccentMs: 720,',
    `  revealBackdropFadeOutMs: 300,\n  persistentFxIntroOffsetY: 8,\n  persistentFxIntroScale: 0.9,\n  persistentFxOvershootScale: 1.04,\n  persistentFxIntroMs: 280,\n  persistentFxSettleMs: 160,\n  persistentFxExitOffsetY: -8,\n  persistentFxExitScale: 1.14,\n  persistentFxExitMs: 240,\n  secretOutlineCopies: 10,\n  secretOutlineRadius: 4.2,\n  secretOutlineAlpha: 0.42,\n  secretOutlinePeakAlpha: 0.76,\n  secretOutlinePulseMs: 720,\n  revealInfoBadgeSideOffset: 150,\n  revealInfoBadgeIntroMs: 220,\n  revealInfoBadgeHoldMs: 620,\n  revealInfoBadgeExitMs: 260,\n  duplicateConversionAccentMs: 720,`,
    'feel constants',
  );
  await writeFile(path, source);
}

// openingVisuals.ts — keep authored Basic/Charged rasters neutral until dedicated Drop skins exist.
{
  const path = 'src/game/ui/openingVisuals.ts';
  let source = await readFile(path, 'utf8');
  source = replaceOnce(source, '  getDropPouchSkin,\n', '', 'remove skin import');
  source = replaceOnce(
    source,
    '  lootPoolId: GameLootPoolId = DEFAULT_LOOT_POOL_ID,\n): PouchVisual => {\n  const group = scene.add.container(x, y);\n  const skin = getDropPouchSkin(lootPoolId);',
    '  _lootPoolId: GameLootPoolId = DEFAULT_LOOT_POOL_ID,\n): PouchVisual => {\n  const group = scene.add.container(x, y);',
    'neutral pouch signature',
  );
  source = replaceOnce(
    source,
    '    addPouchLayer(scene, bodyLayer, bodyTexture, bodyPresentation).setTint(skin.tint);',
    '    addPouchLayer(scene, bodyLayer, bodyTexture, bodyPresentation);',
    'neutral body',
  );
  source = replaceRegexOnce(
    source,
    /\n  \/\/ Drop identity is a lightweight skin layer over the shared pouch geometry\.[\s\S]*?  bodyLayer\.add\(skinLayer\);\n/,
    '\n',
    'remove motif skin layer',
  );
  source = replaceOnce(source, '    stripImage.setTint(skin.tint);\n', '', 'neutral strip');
  source = replaceOnce(
    source,
    '    addPouchLayer(scene, tab, tabTexture, tabPresentation).setTint(skin.tint);',
    '    addPouchLayer(scene, tab, tabTexture, tabPresentation);',
    'neutral tab',
  );
  await writeFile(path, source);
}

// OpeningScene.ts
{
  const path = 'src/game/scenes/OpeningScene.ts';
  let source = await readFile(path, 'utf8');

  const trackAnchor = `  private trackStandardPresenceTarget<T extends Phaser.GameObjects.GameObject>(target: T): T {\n    this.standardPresenceTargets.push(target);\n    return target;\n  }\n\n`;
  const helperBlock = `  private trackStandardPresenceTarget<T extends Phaser.GameObjects.GameObject>(target: T): T {\n    this.standardPresenceTargets.push(target);\n    return target;\n  }\n\n  private animatePersistentRevealFxEntrance(\n    parent: Phaser.GameObjects.Container,\n    layer: Phaser.GameObjects.Container,\n  ): void {\n    const baseY = layer.y;\n    layer.setData('persistentRevealFxBaseY', baseY);\n    parent.setData('persistentRevealFxLayer', layer);\n    layer\n      .setAlpha(0)\n      .setY(baseY + OPENING_FEEL_PRESENTATION.persistentFxIntroOffsetY)\n      .setScale(OPENING_FEEL_PRESENTATION.persistentFxIntroScale);\n    this.tweens.add({\n      targets: layer,\n      alpha: 1,\n      y: baseY,\n      scale: OPENING_FEEL_PRESENTATION.persistentFxOvershootScale,\n      duration: OPENING_FEEL_PRESENTATION.persistentFxIntroMs,\n      ease: 'Back.Out',\n      onComplete: () => {\n        if (!layer.active) return;\n        this.tweens.add({\n          targets: layer,\n          scale: 1,\n          duration: OPENING_FEEL_PRESENTATION.persistentFxSettleMs,\n          ease: 'Sine.Out',\n        });\n      },\n    });\n  }\n\n  private getActivePersistentRevealFxLayer(): Phaser.GameObjects.Container | null {\n    const activePage = this.resultCarouselItems[this.resultCarouselIndex];\n    const pageLayer = activePage?.getData('persistentRevealFxLayer') as Phaser.GameObjects.Container | undefined;\n    if (pageLayer?.active) return pageLayer;\n    const rootLayer = this.root?.getData('persistentRevealFxLayer') as Phaser.GameObjects.Container | undefined;\n    return rootLayer?.active ? rootLayer : null;\n  }\n\n  private animatePersistentRevealFxExit(layer: Phaser.GameObjects.Container): Promise<void> {\n    if (!layer.active) return Promise.resolve();\n    const baseY = Number(layer.getData('persistentRevealFxBaseY') ?? layer.y);\n    this.tweens.killTweensOf(layer);\n    return this.runSkippableTween({\n      targets: layer,\n      y: baseY + OPENING_FEEL_PRESENTATION.persistentFxExitOffsetY,\n      scale: OPENING_FEEL_PRESENTATION.persistentFxExitScale,\n      alpha: 0,\n      angle: 1.4,\n      duration: OPENING_FEEL_PRESENTATION.persistentFxExitMs,\n      ease: 'Cubic.In',\n    });\n  }\n\n`;
  source = replaceOnce(source, trackAnchor, helperBlock, 'persistent FX helpers');

  source = replaceOnce(
    source,
    '    parent.add(layer);\n  }\n\n  private addPersistentSecretPremiumState',
    `    parent.add(layer);\n    this.animatePersistentRevealFxEntrance(parent, layer);\n  }\n\n  private addPersistentSecretPremiumState`,
    'standard persistent FX entrance',
  );
  source = replaceOnce(
    source,
    '    page.add(layer);\n    page.sendToBack(layer);\n  }\n\n  private addAmbientMotion',
    `    page.add(layer);\n    page.sendToBack(layer);\n    this.animatePersistentRevealFxEntrance(page, layer);\n  }\n\n  private addAmbientMotion`,
    'secret persistent FX entrance',
  );

  const outlineAnchor = `  private async animateDiscoveryBeat(\n    pending: PendingReveal,\n    standardVisual: Phaser.GameObjects.Container,\n  ): Promise<void> {`;
  const outlineHelper = `  private addPersistentSecretSilhouetteAccent(secretVisual: Phaser.GameObjects.Container): void {\n    const targets = this.createDiscoverySilhouetteAccent(\n      secretVisual,\n      SECRET_REVEAL_COLOR,\n      OPENING_FEEL_PRESENTATION.secretOutlineCopies,\n      OPENING_FEEL_PRESENTATION.secretOutlineRadius,\n    );\n    targets.forEach((target, index) => {\n      this.trackSecretPremiumTarget(target);\n      target.setAlpha(OPENING_FEEL_PRESENTATION.secretOutlineAlpha);\n      this.tweens.add({\n        targets: target,\n        alpha: OPENING_FEEL_PRESENTATION.secretOutlinePeakAlpha,\n        duration: OPENING_FEEL_PRESENTATION.secretOutlinePulseMs,\n        delay: index * 34,\n        yoyo: true,\n        repeat: -1,\n        repeatDelay: 90 + index * 8,\n        ease: 'Sine.InOut',\n      });\n    });\n  }\n\n  private createRevealInfoBadge(\n    text: string,\n    accent: number,\n    x: number,\n    y: number,\n  ): Phaser.GameObjects.Container {\n    const label = this.add\n      .text(0, 0, text, {\n        color: '#fffaff',\n        stroke: '#100b16',\n        strokeThickness: 2,\n        fontFamily: DIGITAL_FONT_FAMILY,\n        fontSize: '8px',\n        fontStyle: 'bold',\n      })\n      .setOrigin(0, 0.5);\n    const width = Phaser.Math.Clamp(label.width + 56, 176, 308);\n    const height = 38;\n    const badge = this.add.container(x, y).setAlpha(0).setScale(0.96);\n    const glow = this.add.graphics().setAlpha(0.2);\n    glow.lineStyle(5, accent, 0.16);\n    glow.strokeRoundedRect(-width / 2 + 2, -height / 2 + 2, width - 4, height - 4, 12);\n    const background = this.add.graphics();\n    background.fillStyle(0x15101f, 0.93);\n    background.fillRoundedRect(-width / 2, -height / 2, width, height, 13);\n    background.lineStyle(2, accent, 0.68);\n    background.strokeRoundedRect(-width / 2, -height / 2, width, height, 13);\n    const diamond = this.add\n      .rectangle(-width / 2 + 19, 0, 8, 8, accent, 0.96)\n      .setRotation(Math.PI / 4)\n      .setStrokeStyle(1, 0xffffff, 0.34);\n    label.setX(-width / 2 + 36);\n    badge.add([glow, background, diamond, label]);\n    badge.setData('badgeAccent', accent);\n    badge.setData('badgeWidth', width);\n    return badge;\n  }\n\n  private getRevealInfoBadgeX(side: -1 | 1): number {\n    if (!this.metrics) return 450;\n    return Phaser.Math.Clamp(\n      this.metrics.centerX + side * OPENING_FEEL_PRESENTATION.revealInfoBadgeSideOffset,\n      this.metrics.safeLeft + 118,\n      this.metrics.safeRight - 118,\n    );\n  }\n\n${outlineAnchor}`;
  source = replaceOnce(source, outlineAnchor, outlineHelper, 'secret outline and info badge helpers');

  const oldDiscoveryLabel = `    const outlineTargets = this.createDiscoverySilhouetteAccent(standardVisual, rarityColor);\n    const label = this.add\n      .text(heroX, heroY + OPENING_FEEL_PRESENTATION.discoveryLabelOffsetY, messages.opening.addedToCollection, {\n        color: '#dffcff',\n        backgroundColor: '#182130',\n        padding: { x: 9, y: 5 },\n        stroke: '#100b16',\n        strokeThickness: 2,\n        fontFamily: DIGITAL_FONT_FAMILY,\n        fontSize: '8px',\n        fontStyle: 'bold',\n      })\n      .setOrigin(0.5)\n      .setAlpha(0)\n      .setScale(0.96);\n    label.setData('rewardMeaning', 'discovery');`;
  const newDiscoveryLabel = `    const outlineTargets = this.createDiscoverySilhouetteAccent(standardVisual, rarityColor);\n    const badgeSide: -1 | 1 = pending.openingNumber % 2 === 0 ? 1 : -1;\n    const label = this.createRevealInfoBadge(\n      messages.opening.addedToCollection,\n      0x8df8ff,\n      this.getRevealInfoBadgeX(badgeSide),\n      heroY + OPENING_FEEL_PRESENTATION.discoveryLabelOffsetY - 12,\n    );\n    label.setData('rewardMeaning', 'discovery');`;
  source = replaceOnce(source, oldDiscoveryLabel, newDiscoveryLabel, 'discovery semantic badge');

  const oldConversion = `      const conversionLabel = this.add\n        .text(\n          this.metrics.centerX,\n          heroY + 106,\n          \`${'${messages.opening.recycled} +${pending.chips.recycle}'}\`,\n          {\n            color: '#c8fbff',\n            backgroundColor: '#182431',\n            padding: { x: 8, y: 4 },\n            stroke: '#100b16',\n            strokeThickness: 2,\n            fontFamily: DIGITAL_FONT_FAMILY,\n            fontSize: '8px',\n            fontStyle: 'bold',\n          },\n        )\n        .setOrigin(0.5)\n        .setAlpha(0);\n      conversionLabel.setData('rewardMeaning', 'conversion');\n      this.root.add(conversionLabel);\n      this.tweens.add({\n        targets: conversionLabel,\n        y: heroY + 100,\n        alpha: 1,\n        duration: 90,\n        ease: 'Sine.Out',\n        onComplete: () => {\n          if (!conversionLabel.active) return;\n          this.tweens.add({\n            targets: conversionLabel,\n            y: heroY + 94,\n            alpha: 0,\n            duration: OPENING_FEEL_PRESENTATION.duplicateConversionAccentMs - 90,\n            ease: 'Sine.In',\n            onComplete: () => conversionLabel.destroy(),\n          });\n        },\n      });`;
  const newConversion = `      const traySide = String(tray.getData('side') ?? 'right');\n      const badgeSide: -1 | 1 = traySide === 'left' ? 1 : -1;\n      const conversionLabel = this.createRevealInfoBadge(\n        \`${'${messages.opening.recycled} +${pending.chips.recycle}'}\`,\n        0xffd36a,\n        this.getRevealInfoBadgeX(badgeSide),\n        heroY + 102,\n      );\n      conversionLabel.setData('rewardMeaning', 'conversion');\n      this.root.add(conversionLabel);\n      const conversionTargetY = conversionLabel.y;\n      conversionLabel.setY(conversionTargetY + 8);\n      this.tweens.add({\n        targets: conversionLabel,\n        y: conversionTargetY,\n        alpha: 1,\n        scale: 1,\n        duration: OPENING_FEEL_PRESENTATION.revealInfoBadgeIntroMs,\n        ease: 'Back.Out',\n        onComplete: () => {\n          if (!conversionLabel.active) return;\n          const exitDelay = Math.max(\n            0,\n            OPENING_FEEL_PRESENTATION.duplicateConversionAccentMs -\n              OPENING_FEEL_PRESENTATION.revealInfoBadgeIntroMs -\n              OPENING_FEEL_PRESENTATION.revealInfoBadgeExitMs,\n          );\n          this.tweens.add({\n            targets: conversionLabel,\n            y: conversionTargetY - 6,\n            alpha: 0,\n            scale: 1.025,\n            delay: exitDelay,\n            duration: OPENING_FEEL_PRESENTATION.revealInfoBadgeExitMs,\n            ease: 'Sine.In',\n            onComplete: () => conversionLabel.destroy(),\n          });\n        },\n      });`;
  source = replaceOnce(source, oldConversion, newConversion, 'duplicate semantic badge');
  source = replaceOnce(
    source,
    '    await this.waitPresentation(440);\n  }\n\n  private getResultPresentationState',
    '    await this.waitPresentation(OPENING_FEEL_PRESENTATION.revealInfoBadgeHoldMs);\n  }\n\n  private getResultPresentationState',
    'reward staging dwell',
  );

  source = replaceOnce(
    source,
    `    await this.runSkippableTween({\n      targets: secret.group,\n      scale: secretPresentation.revealScale,\n      duration: fx.settleDuration,\n      ease: fx.settleEase,\n    });\n    this.cameras.main.shake`,
    `    await this.runSkippableTween({\n      targets: secret.group,\n      scale: secretPresentation.revealScale,\n      duration: fx.settleDuration,\n      ease: fx.settleEase,\n    });\n    this.addPersistentSecretSilhouetteAccent(secret.group);\n    this.cameras.main.shake`,
    'secret reveal outline',
  );
  source = replaceOnce(
    source,
    `    secretVisual.group.setScale(secretVisual.presentation.revealScale);\n    secretPage.setData('sideScale', secretVisual.presentation.carouselSideScale);`,
    `    secretVisual.group.setScale(secretVisual.presentation.revealScale);\n    this.addPersistentSecretSilhouetteAccent(secretVisual.group);\n    secretPage.setData('sideScale', secretVisual.presentation.carouselSideScale);`,
    'secret result outline',
  );
  source = replaceOnce(
    source,
    `    await this.runSkippableTween({\n      targets: visual.group,\n      scale: presentation.revealScale,\n      alpha: 1,\n      duration: 180,\n      ease: 'Sine.Out',\n    });\n    await this.waitPresentation(90);`,
    `    await this.runSkippableTween({\n      targets: visual.group,\n      scale: presentation.revealScale,\n      alpha: 1,\n      duration: 180,\n      ease: 'Sine.Out',\n    });\n    if (pending.hiddenPocket) this.addPersistentSecretSilhouetteAccent(visual.group);\n    await this.waitPresentation(90);`,
    'recovered secret outline',
  );

  source = replaceOnce(
    source,
    `    const motions: Promise<void>[] = [];\n    for (const target of collectTargets) {`,
    `    const motions: Promise<void>[] = [];\n    const persistentFxLayer = this.getActivePersistentRevealFxLayer();\n    if (persistentFxLayer) motions.push(this.animatePersistentRevealFxExit(persistentFxLayer));\n    for (const target of collectTargets) {`,
    'persistent FX collect exit',
  );

  await writeFile(path, source);
}

// CollectionScene.ts — promote Shelf / Library into a discoverable segmented control.
{
  const path = 'src/game/scenes/CollectionScene.ts';
  let source = await readFile(path, 'utf8');
  source = replaceOnce(
    source,
    `    this.createTab(root, metrics.centerX - 78, 128, 'shelf', messages.collection.shelf);\n    this.createTab(root, metrics.centerX + 78, 128, 'library', messages.collection.library);`,
    `    const viewSwitcher = this.add.graphics();\n    viewSwitcher.fillStyle(0x120d19, 0.9);\n    viewSwitcher.fillRoundedRect(metrics.centerX - 166, 104, 332, 50, 18);\n    viewSwitcher.lineStyle(2, 0xbda7d6, 0.42);\n    viewSwitcher.strokeRoundedRect(metrics.centerX - 166, 104, 332, 50, 18);\n    root.add(viewSwitcher);\n    this.createTab(root, metrics.centerX - 78, 129, 'shelf', messages.collection.shelf);\n    this.createTab(root, metrics.centerX + 78, 129, 'library', messages.collection.library);`,
    'segmented control surface',
  );
  const oldTab = `  private createTab(\n    root: Phaser.GameObjects.Container,\n    x: number,\n    y: number,\n    view: CollectionView,\n    label: string,\n  ): void {\n    const active = this.view === view;\n    const tab = this.add\n      .text(x, y, label, {\n        color: active ? '#211b2c' : '#e7def0',\n        backgroundColor: active ? '#e4d7f2' : '#3a3049',\n        padding: { x: 18, y: 8 },\n        fontFamily: 'system-ui, sans-serif',\n        fontSize: '16px',\n        fontStyle: active ? 'bold' : 'normal',\n      })\n      .setOrigin(0.5)\n      .setInteractive({ useHandCursor: true });\n    tab.on('pointerup', () => {\n      if (this.view === view) return;\n      getGameAudio().play('ui-click');\n      this.view = view;\n      this.render();\n    });\n    root.add(tab);\n  }`;
  const newTab = `  private createTab(\n    root: Phaser.GameObjects.Container,\n    x: number,\n    y: number,\n    view: CollectionView,\n    label: string,\n  ): void {\n    const active = this.view === view;\n    const width = 148;\n    const height = 42;\n    const tab = this.add.container(x, y);\n    const background = this.add.graphics();\n    background.fillStyle(active ? 0xf0e7fa : 0x251b33, active ? 0.98 : 0.96);\n    background.fillRoundedRect(-width / 2, -height / 2, width, height, 14);\n    background.lineStyle(\n      active ? 2.5 : 1.5,\n      active ? 0x8df8ff : 0xbda7d6,\n      active ? 0.86 : 0.52,\n    );\n    background.strokeRoundedRect(-width / 2, -height / 2, width, height, 14);\n    const marker = this.add\n      .rectangle(-width / 2 + 19, 0, 8, 8, active ? 0x8df8ff : 0x7f6f91, active ? 1 : 0.72)\n      .setRotation(Math.PI / 4)\n      .setStrokeStyle(1, active ? 0x211b2c : 0xe9ddf6, active ? 0.36 : 0.3);\n    const text = this.add\n      .text(8, 0, label, {\n        color: active ? '#211b2c' : '#fff8ff',\n        fontFamily: 'system-ui, sans-serif',\n        fontSize: '16px',\n        fontStyle: 'bold',\n      })\n      .setOrigin(0.5)\n      .setShadow(0, 1, active ? '#ffffff' : '#120d19', active ? 1 : 3, true, true);\n    const zone = this.add\n      .zone(0, 0, width, height)\n      .setInteractive({ useHandCursor: true });\n    tab.add([background, marker, text, zone]);\n    zone.on('pointerover', () => {\n      this.tweens.killTweensOf(tab);\n      this.tweens.add({ targets: tab, scale: 1.025, duration: 90, ease: 'Sine.Out' });\n    });\n    zone.on('pointerout', () => {\n      this.tweens.killTweensOf(tab);\n      this.tweens.add({ targets: tab, scale: 1, duration: 110, ease: 'Sine.Out' });\n    });\n    zone.on('pointerdown', () => {\n      this.tweens.killTweensOf(tab);\n      this.tweens.add({ targets: tab, scale: 0.975, duration: 60, ease: 'Sine.Out' });\n    });\n    zone.on('pointerup', () => {\n      if (this.view === view) {\n        this.tweens.add({ targets: tab, scale: 1, duration: 90, ease: 'Sine.Out' });\n        return;\n      }\n      getGameAudio().play('ui-click');\n      this.view = view;\n      this.render();\n    });\n    root.add(tab);\n  }`;
  source = replaceOnce(source, oldTab, newTab, 'strong collection tabs');
  await writeFile(path, source);
}

// tests/drop-pouch-presentation.test.ts
{
  const path = 'tests/drop-pouch-presentation.test.ts';
  let source = await readFile(path, 'utf8');
  source = replaceOnce(source, "import { GAME_LOOT_POOL_IDS } from '../src/game/data/collectibles';\n", '', 'remove Drop ids test import');
  source = replaceOnce(source, '  DROP_POUCH_SKINS,\n', '', 'remove skin test import');
  source = replaceOnce(source, '  POUCH_PRESENTATION,\n', '  POUCH_PRESENTATION,\n  POUCH_VARIANT_PRESENTATION,\n', 'variant presentation test import');
  source = replaceRegexOnce(
    source,
    /  it\('defines a distinct skin identity for every production Drop',[\s\S]*?  \}\);\n\n/,
    `  it('keeps authored Basic and Charged pouches neutral and independently tunable', () => {\n    expect(POUCH_VARIANT_PRESENTATION.basic.stripWidthOffset).toBe(-8);\n    expect(POUCH_VARIANT_PRESENTATION.charged.bodyOffsetX).toBe(-7);\n    expect(POUCH_VARIANT_PRESENTATION.charged.bodyWidthOffset).toBe(-7);\n    expect(POUCH_VARIANT_PRESENTATION.charged.stripWidthOffset).toBe(4);\n  });\n\n`,
    'replace runtime skin contract test',
  );
  await writeFile(path, source);
}

// tests/presentation.test.ts
{
  const path = 'tests/presentation.test.ts';
  let source = await readFile(path, 'utf8');
  source = replaceOnce(source, '    expect(discoveryDuration).toBeGreaterThanOrEqual(350);\n    expect(discoveryDuration).toBeLessThanOrEqual(720);', '    expect(discoveryDuration).toBeGreaterThanOrEqual(1_000);\n    expect(discoveryDuration).toBeLessThanOrEqual(1_300);', 'discovery dwell bounds');
  source = replaceOnce(source, '    expect(OPENING_FEEL_PRESENTATION.duplicateConversionAccentMs).toBeGreaterThanOrEqual(200);\n    expect(OPENING_FEEL_PRESENTATION.duplicateConversionAccentMs).toBeLessThanOrEqual(320);', '    expect(OPENING_FEEL_PRESENTATION.duplicateConversionAccentMs).toBeGreaterThanOrEqual(600);\n    expect(OPENING_FEEL_PRESENTATION.duplicateConversionAccentMs).toBeLessThanOrEqual(850);\n    expect(OPENING_FEEL_PRESENTATION.persistentFxIntroScale).toBeLessThan(1);\n    expect(OPENING_FEEL_PRESENTATION.persistentFxOvershootScale).toBeGreaterThan(1);\n    expect(OPENING_FEEL_PRESENTATION.persistentFxIntroMs).toBeGreaterThanOrEqual(240);\n    expect(OPENING_FEEL_PRESENTATION.persistentFxExitMs).toBeGreaterThanOrEqual(200);\n    expect(OPENING_FEEL_PRESENTATION.secretOutlineCopies).toBeGreaterThanOrEqual(8);\n    expect(OPENING_FEEL_PRESENTATION.secretOutlineAlpha).toBeLessThan(OPENING_FEEL_PRESENTATION.secretOutlinePeakAlpha);\n    expect(OPENING_FEEL_PRESENTATION.revealInfoBadgeHoldMs).toBeGreaterThanOrEqual(550);', 'new feel bounds');
  source = replaceOnce(source, '    expect(COLLECTION_MILESTONE_PRESENTATION.holdMs).toBeGreaterThanOrEqual(1600);\n    expect(COLLECTION_MILESTONE_PRESENTATION.holdMs).toBeLessThanOrEqual(2200);', '    expect(COLLECTION_MILESTONE_PRESENTATION.holdMs).toBeGreaterThanOrEqual(2200);\n    expect(COLLECTION_MILESTONE_PRESENTATION.holdMs).toBeLessThanOrEqual(2800);', 'milestone dwell bounds');
  await writeFile(path, source);
}

// Canonical Drop polish doc: runtime tint/motifs are intentionally removed pending authored skins.
{
  const path = 'docs/OPENING_DROP_POLISH_2026-09-10.md';
  let source = await readFile(path, 'utf8');
  source = replaceOnce(source, '- Arrow/swipe input updates the displayed Drop and pouch skin immediately.', '- Arrow/swipe input updates the displayed Drop immediately while the selected Basic/Charged authored pouch remains visually stable.', 'fast switch doc');
  source = replaceRegexOnce(
    source,
    /## Drop-specific pouch skins[\s\S]*?The Charged body also receives a small optical offset correction so its visible mass aligns with Basic without rotating the pouch\.\n/,
    `## Pouch art while authored Drop skins are pending\n\nAll six Drops currently share the same neutral authored Basic/Charged pouch art, geometry, tear line, star-tab mechanics, hitboxes, and opening choreography. The former runtime tint/motif overlay has been removed: Drop identity must not be simulated by recoloring or procedural symbols while dedicated authored skins are pending.\n\nThe active Basic/Charged type is preserved while switching Drops. Charged keeps its independent optical offsets so its visible mass aligns with Basic without rotating the pouch. Future per-Drop skins should replace authored art only; they must not fork tear mechanics or reward logic.\n`,
    'pouch skin doc section',
  );
  source = replaceOnce(source, '1. Page through all six Drops with arrows and swipe; confirm name, index, standard count, Secret count, and pouch identity agree.', '1. Page through all six Drops with arrows and swipe; confirm name, index, standard count, and Secret count agree while the neutral authored pouch is not recolored or stamped with runtime motifs.', 'qa skin item');
  source = replaceOnce(source, '3. Repeat the switching stress while Charged is selected; confirm Charged remains selected when affordable and receives the correct Drop skin immediately.', '3. Repeat the switching stress while Charged is selected; confirm Charged remains selected when affordable and keeps the neutral authored Charged presentation without Drop tint/motif overlays.', 'qa charged skin item');
  await writeFile(path, source);
}

console.log('Reveal/meta feel polish applied.');
