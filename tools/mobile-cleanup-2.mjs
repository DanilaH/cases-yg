import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const write = (path, content) => fs.writeFileSync(path, content);

const replaceOnce = (source, search, replacement, label) => {
  const index = source.indexOf(search);
  if (index < 0) throw new Error(`Missing replacement target: ${label}`);
  if (source.indexOf(search, index + search.length) >= 0) {
    throw new Error(`Replacement target is not unique: ${label}`);
  }
  return source.slice(0, index) + replacement + source.slice(index + search.length);
};

const replaceRegex = (source, regex, replacement, label) => {
  const matches = [...source.matchAll(new RegExp(regex.source, regex.flags.includes('g') ? regex.flags : `${regex.flags}g`))];
  if (matches.length !== 1) throw new Error(`Expected one regex target for ${label}, got ${matches.length}`);
  return source.replace(regex, replacement);
};

// OpeningScene: one shared geometry source, clean reveal chrome, calmer compact composition.
{
  const path = 'src/game/scenes/OpeningScene.ts';
  let source = read(path);

  source = replaceOnce(
    source,
    "import { createLayoutMetrics, readSafeAreaInsets, type LayoutMetrics } from '../systems/layout';\n",
    "import { createLayoutMetrics, readSafeAreaInsets, type LayoutMetrics } from '../systems/layout';\nimport {\n  getDropSelectorWidth,\n  getOpeningChromeSizing,\n  getPouchSelectorGeometry,\n} from '../systems/openingChromeLayout';\n",
    'OpeningScene shared chrome import',
  );

  source = replaceOnce(
    source,
    "  private pouchSelectorLabel: Phaser.GameObjects.Text | null = null;\n",
    "  private pouchSelectorLabel: Phaser.GameObjects.Text | null = null;\n  private pouchOddsContainer: Phaser.GameObjects.Container | null = null;\n",
    'OpeningScene odds container field',
  );

  source = replaceOnce(
    source,
    "    this.pouchSelectorButtons = [];\n    this.pouchSelectorLabel = null;\n    this.dropSelectorContainer = null;\n",
    "    this.pouchSelectorButtons = [];\n    this.pouchSelectorLabel = null;\n    this.pouchOddsContainer = null;\n    this.dropSelectorContainer = null;\n",
    'OpeningScene createRoot reset',
  );

  source = replaceRegex(
    source,
    /  private getChromeSizing\(\): \{[\s\S]*?\n  \}\n\n  private getDetailFontFamily\(\): string \{/,
    `  private getChromeSizing() {\n    return getOpeningChromeSizing(this.metrics?.compactChrome ?? false);\n  }\n\n  private getDetailFontFamily(): string {`,
    'OpeningScene getChromeSizing',
  );

  source = replaceRegex(
    source,
    /  private renderDropSelector\(root: Phaser\.GameObjects\.Container\): void \{[\s\S]*?\n  \}\n\n  private animateDropPreview/,
    `  private renderDropSelector(root: Phaser.GameObjects.Container): void {\n    if (!this.metrics || !this.saveState) return;\n    const messages = getMessages(getPlatformRuntime().language);\n    const index = this.getDisplayedDropIndex();\n    const poolId = this.getDisplayedLootPoolId();\n    const ownedStandards = new Set(this.saveState.discoveredStandard);\n    const ownedSecrets = new Set(this.saveState.discoveredSecrets);\n    const standards = GAME_REGISTRY.standardItems.filter((item) => item.lootPoolId === poolId);\n    const secrets = GAME_REGISTRY.secrets.filter((item) => item.lootPoolId === poolId);\n    const standardCount = standards.filter(({ collectible }) => ownedStandards.has(collectible.id)).length;\n    const secretCount = secrets.filter(({ collectible }) => ownedSecrets.has(collectible.id)).length;\n    const chrome = this.getChromeSizing();\n    const compact = chrome.compact;\n    const width = getDropSelectorWidth(this.metrics);\n    const height = chrome.dropSelectorHeight;\n    const x = this.metrics.centerX;\n    const y = this.metrics.safeBottom - OPENING_FEEL_PRESENTATION.dropSelectorBottomInset - height;\n    const panel = this.add.container(x, y);\n    this.dropSelectorContainer = panel;\n\n    const background = this.add.graphics();\n    background.fillStyle(0x15101f, 0.94);\n    background.fillRoundedRect(-width / 2, 0, width, height, 20);\n    background.lineStyle(2, 0x8df8ff, 0.46);\n    background.strokeRoundedRect(-width / 2, 0, width, height, 20);\n    const inner = this.add.graphics().setAlpha(0.42);\n    inner.lineStyle(1, 0xf2ddff, 0.24);\n    inner.strokeRoundedRect(-width / 2 + 4, 4, width - 8, height - 8, 17);\n\n    const label = this.add\n      .text(0, compact ? 13 : 12, \`${'${messages.opening.drop}'} ${'${index + 1}'}/${'${GAME_LOOT_POOL_IDS.length}'} · ${'${messages.drops[poolId]}'}\`, {\n        color: '#fbf7ff',\n        stroke: '#100b16',\n        strokeThickness: compact ? 3 : 2,\n        fontFamily: DIGITAL_FONT_FAMILY,\n        fontSize: compact ? '18px' : getPlatformRuntime().language === 'ru' ? '9px' : '10px',\n        fontStyle: 'bold',\n      })\n      .setOrigin(0.5, 0);\n    const standardsLabel = messages.collection.standards.toUpperCase();\n    const secretsLabel = messages.collection.secrets.toUpperCase();\n    const progress = this.add\n      .text(0, compact ? 48 : 43, \`${'${standardsLabel}'} ${'${standardCount}'}/${'${standards.length}'}   ·   ${'${secretsLabel}'} ${'${secretCount}'}/${'${secrets.length}'}\`, {\n        color: '#9feaf4',\n        fontFamily: compact ? 'system-ui, sans-serif' : DIGITAL_FONT_FAMILY,\n        fontSize: compact ? '15px' : '8px',\n        fontStyle: compact ? '600' : 'normal',\n      })\n      .setOrigin(0.5, 0);\n\n    const dotGap = OPENING_FEEL_PRESENTATION.dropSelectorDotGap;\n    const dotSize = OPENING_FEEL_PRESENTATION.dropSelectorDotSize;\n    const activeDotWidth = OPENING_FEEL_PRESENTATION.dropSelectorDotActiveWidth;\n    const dotHeight = OPENING_FEEL_PRESENTATION.dropSelectorDotHeight;\n    const dotWidths = GAME_LOOT_POOL_IDS.map((_, dotIndex) => dotIndex === index ? activeDotWidth : dotSize);\n    const dotRailWidth = dotWidths.reduce((sum, dotWidth) => sum + dotWidth, 0) + dotGap * (dotWidths.length - 1);\n    const dotY = height - (compact ? 13 : OPENING_FEEL_PRESENTATION.dropSelectorDotBottomInset) - dotHeight / 2;\n    const dropDots: Phaser.GameObjects.Graphics[] = [];\n    let dotCursorX = -dotRailWidth / 2;\n    for (let dotIndex = 0; dotIndex < dotWidths.length; dotIndex += 1) {\n      const isActive = dotIndex === index;\n      const dotWidth = dotWidths[dotIndex] ?? dotSize;\n      const dotAlpha = isActive\n        ? OPENING_FEEL_PRESENTATION.dropSelectorDotActiveAlpha\n        : OPENING_FEEL_PRESENTATION.dropSelectorDotInactiveAlpha;\n      const dot = this.add.graphics();\n      dot.fillStyle(isActive ? 0x8df8ff : 0xdccdf0, dotAlpha);\n      dot.fillRoundedRect(-dotWidth / 2, -dotHeight / 2, dotWidth, dotHeight, dotHeight / 2);\n      dot.setPosition(dotCursorX + dotWidth / 2, dotY);\n      if (isActive) {\n        dot.setScale(0.88, 1);\n        this.tweens.add({\n          targets: dot,\n          scaleX: 1,\n          duration: OPENING_FEEL_PRESENTATION.dropSelectorSwitchMs,\n          ease: 'Cubic.Out',\n        });\n      }\n      dropDots.push(dot);\n      dotCursorX += dotWidth + dotGap;\n    }\n\n    const previousX = compact ? -width / 2 - chrome.dropSelectorArrowGap : -width / 2 + 34;\n    const nextX = compact ? width / 2 + chrome.dropSelectorArrowGap : width / 2 - 34;\n    const previousBack = this.add\n      .circle(previousX, height / 2, chrome.dropSelectorArrowRadius, 0x332742, 0.98)\n      .setStrokeStyle(1.5, 0xdccdf0, 0.34);\n    const nextBack = this.add\n      .circle(nextX, height / 2, chrome.dropSelectorArrowRadius, 0x332742, 0.98)\n      .setStrokeStyle(1.5, 0xdccdf0, 0.34);\n    const previous = this.add\n      .text(previousBack.x, previousBack.y - 2, '‹', {\n        color: '#f4edff',\n        fontFamily: 'system-ui, sans-serif',\n        fontSize: compact ? '38px' : '34px',\n        fontStyle: '600',\n      })\n      .setOrigin(0.5);\n    const next = this.add\n      .text(nextBack.x, nextBack.y - 2, '›', {\n        color: '#f4edff',\n        fontFamily: 'system-ui, sans-serif',\n        fontSize: compact ? '38px' : '34px',\n        fontStyle: '600',\n      })\n      .setOrigin(0.5);\n    const hitWidth = chrome.dropSelectorArrowHitSize;\n    const hitHeight = compact ? 76 : height;\n    const previousHit = this.add\n      .zone(previousBack.x, height / 2, hitWidth, hitHeight)\n      .setInteractive({ useHandCursor: true });\n    const nextHit = this.add\n      .zone(nextBack.x, height / 2, hitWidth, hitHeight)\n      .setInteractive({ useHandCursor: true });\n    const swipeHit = this.add\n      .zone(0, height / 2, compact ? width - 40 : Math.max(80, width - hitWidth * 2), height)\n      .setInteractive({ useHandCursor: true });\n\n    const pressArrow = (\n      direction: -1 | 1,\n      back: Phaser.GameObjects.Arc,\n      arrow: Phaser.GameObjects.Text,\n    ): void => {\n      if (this.phase !== 'idle' || this.pouchArtLoadInFlight) return;\n      this.hideTearHint();\n      this.tweens.killTweensOf([back, arrow]);\n      this.tweens.add({\n        targets: [back, arrow],\n        scale: 0.91,\n        duration: OPENING_FEEL_PRESENTATION.uiPressMs,\n        yoyo: true,\n        ease: 'Sine.Out',\n      });\n      void this.switchDrop(direction);\n    };\n    previousHit.on('pointerup', () => pressArrow(-1, previousBack, previous));\n    nextHit.on('pointerup', () => pressArrow(1, nextBack, next));\n\n    swipeHit.on('pointerdown', (pointer: Phaser.Input.Pointer) => {\n      if (this.phase !== 'idle' || this.pouchArtLoadInFlight) return;\n      this.hideTearHint();\n      this.dropSelectorDrag = { pointerId: pointer.id, startX: pointer.x };\n    });\n    swipeHit.on('pointerup', (pointer: Phaser.Input.Pointer) => {\n      const drag = this.dropSelectorDrag;\n      this.dropSelectorDrag = null;\n      if (!drag || drag.pointerId !== pointer.id || this.phase !== 'idle' || !this.metrics) return;\n      const deltaX = (pointer.x - drag.startX) / this.metrics.scale;\n      if (Math.abs(deltaX) < OPENING_FEEL_PRESENTATION.dropSelectorSwipeThreshold) {\n        this.scheduleTearHint();\n        return;\n      }\n      void this.switchDrop(deltaX < 0 ? 1 : -1);\n    });\n    swipeHit.on('pointerout', () => {\n      this.dropSelectorDrag = null;\n    });\n\n    panel.add([background, inner, label, progress, ...dropDots, previousBack, nextBack, previous, next, previousHit, nextHit, swipeHit]);\n    root.add(panel);\n    this.dropSelectorInteractiveZones = [previousHit, nextHit, swipeHit];\n\n    this.tweens.add({\n      targets: inner,\n      alpha: 0.7,\n      duration: 1450,\n      yoyo: true,\n      repeat: -1,\n      repeatDelay: 2600,\n      ease: 'Sine.InOut',\n    });\n\n    const shouldNudgeNext = this.dropCompletionNudgePoolId === poolId;\n    if (shouldNudgeNext) {\n      this.dropCompletionNudgePoolId = null;\n      const nextLabel = this.add\n        .text(compact ? width / 2 - 14 : width / 2 - 68, compact ? height - 24 : 66, messages.opening.nextDrop, {\n          color: '#8df8ff',\n          stroke: '#100b16',\n          strokeThickness: 2,\n          fontFamily: DIGITAL_FONT_FAMILY,\n          fontSize: compact ? '13px' : '6px',\n          fontStyle: 'bold',\n        })\n        .setOrigin(1, 0.5)\n        .setAlpha(0);\n      panel.add(nextLabel);\n      this.tweens.add({\n        targets: [nextBack, next],\n        scale: 1.1,\n        duration: 230,\n        yoyo: true,\n        repeat: 2,\n        ease: 'Sine.InOut',\n      });\n      this.tweens.add({\n        targets: nextLabel,\n        alpha: 1,\n        x: nextLabel.x + 4,\n        duration: 250,\n        yoyo: true,\n        repeat: 2,\n        hold: 220,\n        ease: 'Sine.InOut',\n      });\n    }\n  }\n\n  private animateDropPreview`,
    'OpeningScene renderDropSelector',
  );

  source = replaceRegex(
    source,
    /  private renderPouchSelector\(root: Phaser\.GameObjects\.Container\): void \{[\s\S]*?\n  \}\n\n  private renderPouchOdds/,
    `  private renderPouchSelector(root: Phaser.GameObjects.Container): void {\n    if (!this.metrics || !this.saveState) return;\n    const messages = getMessages(getPlatformRuntime().language);\n    const cost = getChargedCost(LITE_V2_BALANCE);\n    const chargedAvailable = canAffordPouch(this.saveState, 'charged', LITE_V2_BALANCE);\n    const geometry = getPouchSelectorGeometry(this.metrics);\n    const { chrome, railX, labelY } = geometry;\n    const width = chrome.railCardWidth;\n    const height = chrome.railCardHeight;\n\n    const sectionLabel = this.add.text(railX + 2, labelY, 'POUCH', {\n      color: '#efe6f7',\n      stroke: '#120d19',\n      strokeThickness: chrome.compact ? 4 : 2,\n      fontFamily: DIGITAL_FONT_FAMILY,\n      fontSize: chrome.compact ? '19px' : '9px',\n      fontStyle: chrome.compact ? 'bold' : 'normal',\n    }).setShadow(0, 2, '#120d19', chrome.compact ? 4 : 2, true, true);\n    root.add(sectionLabel);\n    this.pouchSelectorLabel = sectionLabel;\n\n    const createCard = (\n      pouchType: PouchType,\n      y: number,\n      title: string,\n      subtitle: string,\n      available: boolean,\n    ): Phaser.GameObjects.Container => {\n      const selected = this.selectedPouchType === pouchType;\n      const charged = pouchType === 'charged';\n      const card = this.add.container(railX, y);\n      const background = this.add.graphics();\n      const fill = selected ? (charged ? 0x30234a : 0x282034) : 0x17101f;\n      const border = charged ? (selected ? CHARGED_ACCENT : 0x77629e) : selected ? 0xf0ddff : 0x6e627d;\n      background.fillStyle(fill, available ? 0.92 : OPENING_FEEL_PRESENTATION.railUnavailableSurfaceAlpha);\n      background.fillRoundedRect(0, 0, width, height, 16);\n      background.lineStyle(selected ? 2.5 : 1.5, border, selected ? 0.88 : 0.34);\n      background.strokeRoundedRect(0, 0, width, height, 16);\n      if (selected) {\n        const glow = this.add.graphics();\n        glow.lineStyle(5, charged ? CHARGED_ACCENT : 0xf0ddff, charged ? 0.1 : 0.06);\n        glow.strokeRoundedRect(2, 2, width - 4, height - 4, 14);\n        card.add(glow);\n      }\n      const marker = this.add\n        .text(13, height / 2, selected ? '◆' : '◇', {\n          color: selected ? (charged ? '#c7b8ff' : '#ffffff') : '#81758f',\n          fontFamily: 'system-ui, sans-serif',\n          fontSize: chrome.compact ? '22px' : '15px',\n          fontStyle: 'bold',\n        })\n        .setOrigin(0, 0.5);\n      const titleText = this.add.text(38, chrome.compact ? 8 : 11, title, {\n        color: available ? (charged ? CHARGED_TEXT_COLOR : '#f7f2ff') : '#b7adbf',\n        fontFamily: chrome.compact ? 'system-ui, sans-serif' : DIGITAL_FONT_FAMILY,\n        fontSize: chrome.compact ? '18px' : getPlatformRuntime().language === 'ru' ? '8px' : '9px',\n        fontStyle: chrome.compact ? '700' : 'normal',\n      });\n      const subtitleText = this.add.text(38, chrome.compact ? 38 : 35, subtitle, {\n        color: available ? (charged ? '#8df8ff' : '#bfb3ca') : '#a69aae',\n        fontFamily: chrome.compact ? 'system-ui, sans-serif' : DIGITAL_FONT_FAMILY,\n        fontSize: chrome.compact ? '16px' : '8px',\n        fontStyle: chrome.compact ? '500' : 'normal',\n      });\n      card.add([background, marker, titleText, subtitleText]);\n      const hitTarget = this.add\n        .zone(railX + width / 2, y + height / 2, width, height)\n        .setOrigin(0.5)\n        .setInteractive({ useHandCursor: true });\n      const idleAlpha = available ? (selected ? 1 : 0.84) : OPENING_FEEL_PRESENTATION.railUnavailableAlpha;\n      card.setAlpha(idleAlpha);\n      card.setData('available', available);\n      card.setData('idleAlpha', idleAlpha);\n      card.setData('baseX', railX);\n      card.setData('baseY', y);\n      card.setData('pouchType', pouchType);\n      card.setData('hitTarget', hitTarget);\n      hitTarget.on('pointerover', () => {\n        if (this.phase !== 'idle') return;\n        this.tweens.killTweensOf(card);\n        this.tweens.add({ targets: card, scale: 1.025, duration: 90, ease: 'Sine.Out' });\n      });\n      hitTarget.on('pointerout', () => {\n        if (this.phase !== 'idle') return;\n        this.tweens.killTweensOf(card);\n        this.tweens.add({ targets: card, scale: 1, duration: 110, ease: 'Sine.Out' });\n      });\n      hitTarget.on('pointerdown', () => {\n        if (this.phase !== 'idle') return;\n        this.tweens.killTweensOf(card);\n        this.tweens.add({ targets: card, scale: 0.985, duration: 55, ease: 'Sine.Out' });\n      });\n      hitTarget.on('pointerup', () => {\n        if (this.phase !== 'idle') return;\n        if (!available) {\n          this.showUnavailableChargedFeedback(card);\n          return;\n        }\n        void this.selectPouchType(pouchType, card);\n      });\n      root.add([card, hitTarget]);\n      this.pouchSelectorButtons.push(card);\n      return card;\n    };\n\n    createCard('basic', geometry.basic.y, messages.opening.basicPouch, messages.opening.free, true);\n    const chargedCard = createCard(\n      'charged',\n      geometry.charged.y,\n      \`⚡ ${'${messages.opening.chargedPouch}'}\`,\n      chargedAvailable\n        ? \`${'${cost}'} ${'${messages.opening.chips}'}\`\n        : \`${'${this.saveState.chips}'}/${'${cost}'} ${'${messages.opening.chips}'}\`,\n      chargedAvailable,\n    );\n    this.renderPouchOdds(root, geometry.odds.x, geometry.odds.y, geometry.odds.width);\n    if (chargedAvailable && this.selectedPouchType !== 'charged') {\n      this.startPaidPouchAvailabilityPulse(chargedCard, this.saveState.signal >= LITE_V2_BALANCE.signalThreshold);\n    }\n  }\n\n  private renderPouchOdds`,
    'OpeningScene renderPouchSelector',
  );

  source = replaceRegex(
    source,
    /  private renderPouchOdds\([\s\S]*?\n  \}\n\n  private startPaidPouchAvailabilityPulse/,
    `  private renderPouchOdds(\n    root: Phaser.GameObjects.Container,\n    x: number,\n    y: number,\n    width: number,\n  ): void {\n    const messages = getMessages(getPlatformRuntime().language);\n    const basic = LITE_V2_BALANCE.pouchProfiles.basic;\n    const charged = LITE_V2_BALANCE.pouchProfiles.charged;\n    const rarities: readonly StandardRarity[] = ['common', 'rare', 'epic', 'legendary'];\n    const rarityColors: Readonly<Record<StandardRarity, string>> = {\n      common: '#e8e5ee',\n      rare: '#8df8ff',\n      epic: '#c7b8ff',\n      legendary: '#ffd98a',\n    };\n    const chrome = this.getChromeSizing();\n    const compact = chrome.compact;\n    const fontFamily = this.getDetailFontFamily();\n    const panelHeight = chrome.oddsPanelHeight;\n    const panel = this.add.container(x, y);\n    const background = this.add.graphics();\n    background.fillStyle(0x17101f, compact ? 0.92 : 0.78);\n    background.fillRoundedRect(0, 0, width, panelHeight, 14);\n    background.lineStyle(compact ? 1.5 : 1, 0xbda7d6, compact ? 0.34 : 0.22);\n    background.strokeRoundedRect(0, 0, width, panelHeight, 14);\n    panel.add(background);\n\n    const title = this.add.text(12, compact ? 10 : 8, messages.opening.dropRates, {\n      color: compact ? '#e5dbea' : '#a99ab8',\n      fontFamily,\n      fontSize: compact ? '18px' : '7px',\n      fontStyle: compact ? '700' : 'normal',\n    });\n    panel.add(title);\n\n    const labelColumnWidth = compact ? 100 : 72;\n    const firstColumn = compact ? labelColumnWidth + 18 : 88;\n    const lastColumn = width - (compact ? 18 : 32);\n    const step = (lastColumn - firstColumn) / 3;\n    const columnX = rarities.map((_, index) => firstColumn + step * index);\n    const headerY = compact ? 40 : 25;\n    rarities.forEach((rarity, index) => {\n      const header = this.add\n        .text(columnX[index] ?? firstColumn, headerY, messages.rarity[rarity].toUpperCase().slice(0, 3), {\n          color: rarityColors[rarity],\n          fontFamily,\n          fontSize: compact ? '15px' : '5px',\n          fontStyle: compact ? '700' : 'normal',\n        })\n        .setOrigin(0.5);\n      panel.add(header);\n    });\n\n    const addRateRow = (\n      rowY: number,\n      label: string,\n      weights: Readonly<Record<StandardRarity, number>>,\n      accent: string,\n    ): void => {\n      panel.add(\n        this.add\n          .text(12, rowY, label, {\n            color: accent,\n            fontFamily,\n            fontSize: compact ? '17px' : getPlatformRuntime().language === 'ru' ? '6px' : '7px',\n            fontStyle: compact ? '650' : 'normal',\n          })\n          .setOrigin(0, 0.5),\n      );\n      rarities.forEach((rarity, index) => {\n        panel.add(\n          this.add\n            .text(columnX[index] ?? firstColumn, rowY, \`${'${weights[rarity]}'}%\`, {\n              color: rarityColors[rarity],\n              fontFamily,\n              fontSize: compact ? '17px' : '7px',\n              fontStyle: compact ? '600' : 'normal',\n            })\n            .setOrigin(0.5),\n        );\n      });\n    };\n\n    addRateRow(compact ? 68 : 43, messages.opening.basicPouch, basic.rarityWeights, '#f7f2ff');\n    addRateRow(compact ? 96 : 61, messages.opening.chargedPouch, charged.rarityWeights, CHARGED_TEXT_COLOR);\n\n    const formatChance = (chance: number): string => {\n      const percent = chance * 100;\n      return \`${'${Number.isInteger(percent) ? percent.toFixed(0) : percent.toFixed(1)}'}%\`;\n    };\n    panel.add(\n      this.add\n        .text(12, compact ? 127 : 78, \`${'${messages.opening.secretOdds}'}  ${'${formatChance(basic.hiddenPocketChance)}'} → ${'${formatChance(charged.hiddenPocketChance)}'}\`, {\n          color: '#ffb4dc',\n          fontFamily,\n          fontSize: compact ? '16px' : '6px',\n          fontStyle: compact ? '600' : 'normal',\n        })\n        .setOrigin(0, 0.5),\n    );\n    panel.add(\n      this.add\n        .text(12, compact ? 151 : 94, messages.opening.fromFourthOpen, {\n          color: compact ? '#b8afc0' : '#81758f',\n          fontFamily,\n          fontSize: compact ? '13px' : '5px',\n        })\n        .setOrigin(0, 0.5),\n    );\n    root.add(panel);\n    this.pouchOddsContainer = panel;\n  }\n\n  private startPaidPouchAvailabilityPulse`,
    'OpeningScene renderPouchOdds',
  );

  source = replaceOnce(
    source,
    "    const width = OPENING_FEEL_PRESENTATION.railCardWidth;\n    const height = OPENING_FEEL_PRESENTATION.railCardHeight;\n    const outline = this.add.graphics().setAlpha(0);\n",
    "    const { railCardWidth: width, railCardHeight: height, compact } = this.getChromeSizing();\n    const outline = this.add.graphics().setAlpha(0);\n",
    'OpeningScene Charged ready outline geometry',
  );
  source = replaceOnce(
    source,
    ".text(width - 12, 10, 'READY', {",
    ".text(width - 12, compact ? 10 : 10, 'READY', {",
    'OpeningScene Charged ready label anchor',
  );

  source = replaceOnce(
    source,
    "  private hideDropSelectorForReveal(): void {\n",
    `  private hideIdleChromeForReveal(): void {\n    if (this.collectionButton?.active) {\n      this.collectionButton.setAlpha(0);\n      this.collectionButton.disableInteractive();\n    }\n    if (this.pouchSelectorLabel?.active) this.pouchSelectorLabel.setAlpha(0);\n    if (this.pouchOddsContainer?.active) this.pouchOddsContainer.setAlpha(0);\n    for (const button of this.pouchSelectorButtons) {\n      this.tweens.killTweensOf(button);\n      button.setAlpha(0);\n      const hitTarget = button.getData('hitTarget') as Phaser.GameObjects.Zone | undefined;\n      if (hitTarget?.input) hitTarget.input.enabled = false;\n    }\n    this.hideDropSelectorForReveal();\n  }\n\n  private hideDropSelectorForReveal(): void {\n`,
    'OpeningScene reveal chrome isolation helper',
  );

  source = replaceOnce(
    source,
    "    this.setChromeEnabled(false);\n    this.hideDropSelectorForReveal();\n    getGameAudio().play('tear');\n",
    "    this.setChromeEnabled(false);\n    this.hideIdleChromeForReveal();\n    getGameAudio().play('tear');\n",
    'OpeningScene live reveal chrome isolation',
  );

  source = replaceOnce(
    source,
    "      this.lastReveal = pending;\n      if (firstInteraction && pending.openingNumber === 1) {\n",
    "      this.lastReveal = pending;\n      this.renderRevealShell(pending);\n      if (!this.root || !this.pouch || !this.metrics) return;\n      if (firstInteraction && pending.openingNumber === 1) {\n",
    'OpeningScene live reveal shell handoff',
  );

  write(path, source);
}

// GuidanceScene: derive tutorial targets from the exact same compact card geometry.
{
  const path = 'src/game/scenes/GuidanceScene.ts';
  let source = read(path);
  source = replaceOnce(
    source,
    "import { createLayoutMetrics, readSafeAreaInsets, type LayoutMetrics } from '../systems/layout';\n",
    "import { createLayoutMetrics, readSafeAreaInsets, type LayoutMetrics } from '../systems/layout';\nimport { getOpeningChromeSizing, getPouchSelectorGeometry } from '../systems/openingChromeLayout';\n",
    'GuidanceScene shared chrome import',
  );

  source = replaceOnce(
    source,
    "    const compact = this.metrics.compactChrome;\n    const width = compact\n      ? Math.min(470, Math.max(360, this.metrics.logicalWidth * 0.36))\n      : Math.min(390, Math.max(270, this.metrics.logicalWidth * 0.31));\n    const signalY =\n      this.metrics.safeTop +\n      OPENING_FEEL_PRESENTATION.railTopOffset +\n      (compact ? 92 : OPENING_FEEL_PRESENTATION.chipsHudHeight) +\n      10 +\n      (compact ? 100 : OPENING_FEEL_PRESENTATION.signalHudHeight) / 2;\n    const x = Math.min(\n      this.metrics.safeRight - width,\n      this.metrics.safeLeft + (compact ? 300 : OPENING_FEEL_PRESENTATION.signalHudWidth) + 18,\n    );\n",
    "    const compact = this.metrics.compactChrome;\n    const chrome = getOpeningChromeSizing(compact);\n    const width = compact\n      ? Math.min(470, Math.max(360, this.metrics.logicalWidth * 0.36))\n      : Math.min(390, Math.max(270, this.metrics.logicalWidth * 0.31));\n    const signalY =\n      this.metrics.safeTop +\n      OPENING_FEEL_PRESENTATION.railTopOffset +\n      chrome.chipsHudHeight +\n      10 +\n      chrome.signalHudHeight / 2;\n    const x = Math.min(\n      this.metrics.safeRight - width,\n      this.metrics.safeLeft + chrome.signalHudWidth + 18,\n    );\n",
    'GuidanceScene Signal hint shared geometry',
  );

  source = replaceRegex(
    source,
    /  private getChargedCardPointerPosition\(\): \{ x: number; y: number \} \{[\s\S]*?\n  \}\n\n  private rebuildRoot/,
    `  private getChargedCardPointerPosition(): { x: number; y: number } {\n    const metrics = this.metrics!;\n    const geometry = getPouchSelectorGeometry(metrics);\n    return {\n      x: geometry.charged.x + geometry.charged.width + (metrics.compactChrome ? 42 : 34),\n      y: geometry.charged.y + geometry.charged.height / 2,\n    };\n  }\n\n  private rebuildRoot`,
    'GuidanceScene Charged target geometry',
  );

  write(path, source);
}

// Durable acceptance record for the second real-phone pass.
{
  const path = 'docs/MOBILE_ACCEPTANCE_HARDENING_2026-09-14.md';
  let source = read(path);
  source = source.replace(
    '**Status:** IMPLEMENTED — AWAITING REAL-PHONE ACCEPTANCE',
    '**Status:** SECOND REAL-PHONE CORRECTION PASS — IMPLEMENTING',
  );
  if (!source.includes('## 11. Second real-phone acceptance findings')) {
    source += `\n\n## 11. Second real-phone acceptance findings\n\nThe first deployed compact-chrome pass improved physical readability and rotation handling, but the next real-phone review exposed five follow-up failures. These are treated as one bounded layout-coherence correction, not a new feature pass.\n\n1. **Odds chrome survives into live reveal.** The live tear path only dimmed selector cards and hid the Drop selector; the odds container was not owned/tracked by reveal-phase cleanup. The live path must transition to the same clean reveal shell used by staged/recovered presentation.\n2. **The POUCH section label loses contrast.** It sits directly on bright authored background art. Compact mode needs a dark outline/shadow while preserving the existing typography identity.\n3. **Compact chrome is readable but compositionally cramped.** The previous pass enlarged text without proportionally redesigning card heights, vertical rhythm and Drop navigation. This creates near-overflow, crowded surfaces and navigation controls that compete with Drop title/progress copy. The correction must reduce vertical pressure while preserving readable font sizes, and move compact Drop arrows outside the text surface.\n4. **Charged onboarding target geometry drifted.** At least one Charged-ready outline still uses the desktop rail width/height while the compact card uses enlarged dimensions. Opening and Guidance must share a single pouch-selector geometry source so pointer/highlight/hit targets cannot drift from the rendered card.\n5. **The branded gesture pointer is visible but optically off-center.** The arrowhead was intentionally placed toward the right edge of the halo, which reads as malformed rather than directional on phone. The arrow must be centered inside the circular target; direction comes from the translation loop and external trail.\n\n### Correction constraints\n\n- no economy, reward, RNG, save, tear-threshold or Yandex runtime changes;\n- no second mobile scene;\n- no broad OpeningScene rewrite;\n- preserve the improved physical readability from the first pass;\n- one shared compact geometry source must drive rendered pouch cards and guidance target coordinates;\n- reveal chrome must be semantically owned by phase, not merely dimmed;\n- compact Drop navigation must have independent space from title/progress content;\n- after automated validation, real-phone review remains authoritative.\n`;
  }
  write(path, source);
}

console.log('mobile cleanup pass applied');
