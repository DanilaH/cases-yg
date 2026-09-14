import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const write = (path, value) => fs.writeFileSync(path, value);

const replaceOnce = (source, before, after, label) => {
  const first = source.indexOf(before);
  if (first < 0) throw new Error(`Missing replacement target: ${label}`);
  if (source.indexOf(before, first + before.length) >= 0) {
    throw new Error(`Replacement target is not unique: ${label}`);
  }
  return source.slice(0, first) + after + source.slice(first + before.length);
};

const mapMethod = (source, methodName, nextMethodName, mapper) => {
  const startToken = `  private ${methodName}`;
  const endToken = `\n  private ${nextMethodName}`;
  const start = source.indexOf(startToken);
  const end = source.indexOf(endToken, start + startToken.length);
  if (start < 0 || end < 0) throw new Error(`Cannot isolate ${methodName}`);
  const before = source.slice(start, end);
  const after = mapper(before);
  if (after === before) throw new Error(`No changes applied inside ${methodName}`);
  return source.slice(0, start) + after + source.slice(end);
};

const methodReplace = (method, before, after, label) => replaceOnce(method, before, after, label);

// Opening scene: phase ownership + readable short-height chrome.
{
  const path = 'src/game/scenes/OpeningScene.ts';
  let source = read(path);

  source = replaceOnce(
    source,
    `    this.renderIdle(idleMessage);\n    // Gameplay becomes active only after save recovery + required active art are ready`,
    `    if (pending) this.renderRevealShell(pending);\n    else this.renderIdle(idleMessage);\n    // Gameplay becomes active only after save recovery + required active art are ready`,
    'Opening initialize reveal shell',
  );

  source = replaceOnce(
    source,
    `    const metrics = createLayoutMetrics(this.scale.width, this.scale.height, readSafeAreaInsets(getRenderPixelRatio()));\n    this.metrics = metrics;`,
    `    const ratio = getRenderPixelRatio();\n    const metrics = createLayoutMetrics(this.scale.width, this.scale.height, readSafeAreaInsets(ratio), ratio);\n    this.metrics = metrics;`,
    'Opening layout pixel ratio',
  );

  source = replaceOnce(
    source,
    `  private renderIdle(message?: string, animateEntry = false): void {`,
    `  private renderRevealShell(pending: PendingReveal): void {\n    if (!this.saveState || this.isSceneShutdown()) return;\n    this.resultReady = false;\n    this.drag = null;\n    this.deferredResize = false;\n\n    const root = this.createRoot();\n    const metrics = this.metrics!;\n    this.renderResourceHud(root, this.saveState);\n    this.createMuteButton(root);\n    if (pending.pouchType === 'charged') this.renderChargedPouchAura(root);\n    this.pouch = createPouchVisual(\n      this,\n      root,\n      metrics.centerX,\n      POUCH_Y,\n      pending.pouchType,\n      pending.lootPoolId as GameLootPoolId,\n    );\n    // Scene-entry pending reveals represent a tear that already crossed its durable\n    // staging boundary. Render the actual torn state, never the idle selector shell.\n    this.pouch.tab.setX(this.pouch.tabEndX);\n    this.pouch.dragZone.disableInteractive();\n  }\n\n  private getChromeSizing(): {\n    compact: boolean;\n    chipsHudWidth: number;\n    chipsHudHeight: number;\n    signalHudWidth: number;\n    signalHudHeight: number;\n    railCardWidth: number;\n    railCardHeight: number;\n    railGap: number;\n    selectorTopOffset: number;\n    rewardTrayWidth: number;\n    rewardTrayContentInset: number;\n  } {\n    const compact = this.metrics?.compactChrome ?? false;\n    return {\n      compact,\n      chipsHudWidth: compact ? 300 : OPENING_FEEL_PRESENTATION.chipsHudWidth,\n      chipsHudHeight: compact ? 92 : OPENING_FEEL_PRESENTATION.chipsHudHeight,\n      signalHudWidth: compact ? 300 : OPENING_FEEL_PRESENTATION.signalHudWidth,\n      signalHudHeight: compact ? 100 : OPENING_FEEL_PRESENTATION.signalHudHeight,\n      railCardWidth: compact ? 300 : OPENING_FEEL_PRESENTATION.railCardWidth,\n      railCardHeight: compact ? 82 : OPENING_FEEL_PRESENTATION.railCardHeight,\n      railGap: compact ? 12 : OPENING_FEEL_PRESENTATION.railGap,\n      selectorTopOffset: compact ? 230 : OPENING_FEEL_PRESENTATION.selectorTopOffset,\n      rewardTrayWidth: compact ? 360 : OPENING_FEEL_PRESENTATION.rewardTrayWidth,\n      rewardTrayContentInset: compact ? 24 : OPENING_FEEL_PRESENTATION.rewardTrayContentInset,\n    };\n  }\n\n  private getDetailFontFamily(): string {\n    return this.metrics?.compactChrome ? 'system-ui, sans-serif' : DIGITAL_FONT_FAMILY;\n  }\n\n  private renderIdle(message?: string, animateEntry = false): void {`,
    'Opening reveal shell and chrome helpers',
  );

  source = mapMethod(source, 'renderChipsHud(', 'setChipsHudValue(', (method) => {
    method = methodReplace(method,
      `    const x = this.metrics.safeLeft;\n    const y = this.metrics.safeTop + OPENING_FEEL_PRESENTATION.railTopOffset;\n    const width = OPENING_FEEL_PRESENTATION.chipsHudWidth;\n    const height = OPENING_FEEL_PRESENTATION.chipsHudHeight;`,
      `    const chrome = this.getChromeSizing();\n    const x = this.metrics.safeLeft;\n    const y = this.metrics.safeTop + OPENING_FEEL_PRESENTATION.railTopOffset;\n    const width = chrome.chipsHudWidth;\n    const height = chrome.chipsHudHeight;`,
      'chips chrome sizing');
    method = methodReplace(method,
      `    const token = createChipToken(this, 24, 37, 0.86);`,
      `    const token = createChipToken(this, chrome.compact ? 30 : 24, chrome.compact ? 53 : 37, chrome.compact ? 1.05 : 0.86);`,
      'chips token');
    method = methodReplace(method,
      `.text(49, 10, messages.opening.chips, {`,
      `.text(chrome.compact ? 62 : 49, chrome.compact ? 13 : 10, messages.opening.chips, {`,
      'chips label position');
    method = methodReplace(method,
      `        fontSize: '9px',`,
      `        fontSize: chrome.compact ? '18px' : '9px',`,
      'chips label size');
    method = methodReplace(method,
      `.text(48, 40, \`\${Math.max(0, Math.floor(chips))}\`, {`,
      `.text(chrome.compact ? 62 : 48, chrome.compact ? 61 : 40, \`\${Math.max(0, Math.floor(chips))}\`, {`,
      'chips value position');
    method = methodReplace(method,
      `        fontSize: '19px',`,
      `        fontSize: chrome.compact ? '30px' : '19px',`,
      'chips value size');
    return method;
  });

  source = mapMethod(source, 'renderSignalHud(', 'getDisplayedLootPoolId(', (method) => {
    method = methodReplace(method,
      `    const x = this.metrics.safeLeft;\n    const y = this.metrics.safeTop + OPENING_FEEL_PRESENTATION.railTopOffset + OPENING_FEEL_PRESENTATION.chipsHudHeight + 10;\n    const width = OPENING_FEEL_PRESENTATION.signalHudWidth;\n    const height = OPENING_FEEL_PRESENTATION.signalHudHeight;`,
      `    const chrome = this.getChromeSizing();\n    const x = this.metrics.safeLeft;\n    const y = this.metrics.safeTop + OPENING_FEEL_PRESENTATION.railTopOffset + chrome.chipsHudHeight + 10;\n    const width = chrome.signalHudWidth;\n    const height = chrome.signalHudHeight;`,
      'signal chrome sizing');
    method = methodReplace(method,
      `      fontSize: lockReady ? '8px' : '9px',`,
      `      fontSize: chrome.compact ? '17px' : lockReady ? '8px' : '9px',`,
      'signal label size');
    method = methodReplace(method,
      `      fontSize: '9px',\n    }).setOrigin(1, 0);`,
      `      fontSize: chrome.compact ? '17px' : '9px',\n    }).setOrigin(1, 0);`,
      'signal value size');
    method = methodReplace(method,
      `    const overchargeLabel = this.add.text(14, 27, messages.opening.overcharge, {`,
      `    const overchargeLabel = this.add.text(14, chrome.compact ? 38 : 27, messages.opening.overcharge, {`,
      'overcharge label y');
    method = methodReplace(method,
      `      fontSize: '7px',\n    });`,
      `      fontSize: chrome.compact ? '14px' : '7px',\n    });`,
      'overcharge label size');
    method = methodReplace(method,
      `      27,\n      \`\${formatOverchargeMultiplier(overcharge)}\${overchargeMax ? ' · MAX' : ''}\`,`,
      `      chrome.compact ? 38 : 27,\n      \`\${formatOverchargeMultiplier(overcharge)}\${overchargeMax ? ' · MAX' : ''}\`,`,
      'overcharge value y');
    method = methodReplace(method,
      `        fontSize: '7px',\n      },\n    ).setOrigin(1, 0);`,
      `        fontSize: chrome.compact ? '14px' : '7px',\n      },\n    ).setOrigin(1, 0);`,
      'overcharge value size');
    method = methodReplace(method,
      `          50,\n          segmentWidth,\n          8,`,
      `          chrome.compact ? 76 : 50,\n          segmentWidth,\n          chrome.compact ? 11 : 8,`,
      'signal segment geometry');
    return method;
  });

  source = mapMethod(source, 'renderDropSelector(', 'animateDropPreview(', (method) => {
    method = methodReplace(method,
      `        fontSize: getPlatformRuntime().language === 'ru' ? '9px' : '10px',`,
      `        fontSize: this.metrics.compactChrome ? '16px' : getPlatformRuntime().language === 'ru' ? '9px' : '10px',`,
      'drop title size');
    method = methodReplace(method,
      `        fontSize: '8px',`,
      `        fontSize: this.metrics.compactChrome ? '14px' : '8px',`,
      'drop progress size');
    method = methodReplace(method,
      `          fontSize: '6px',\n          fontStyle: 'bold',`,
      `          fontSize: this.metrics.compactChrome ? '12px' : '6px',\n          fontStyle: 'bold',`,
      'next drop size');
    return method;
  });

  source = mapMethod(source, 'renderPouchSelector(', 'renderPouchOdds(', (method) => {
    method = methodReplace(method,
      `    const chargedAvailable = canAffordPouch(this.saveState, 'charged', LITE_V2_BALANCE);\n    const width = OPENING_FEEL_PRESENTATION.railCardWidth;\n    const height = OPENING_FEEL_PRESENTATION.railCardHeight;\n    const railX = this.metrics.safeLeft;\n    const labelY = this.metrics.safeTop + OPENING_FEEL_PRESENTATION.selectorTopOffset;`,
      `    const chargedAvailable = canAffordPouch(this.saveState, 'charged', LITE_V2_BALANCE);\n    const chrome = this.getChromeSizing();\n    const width = chrome.railCardWidth;\n    const height = chrome.railCardHeight;\n    const railX = this.metrics.safeLeft;\n    const labelY = this.metrics.safeTop + chrome.selectorTopOffset;`,
      'pouch selector sizing');
    method = methodReplace(method,
      `      fontSize: '9px',\n    });`,
      `      fontSize: chrome.compact ? '17px' : '9px',\n      fontStyle: chrome.compact ? 'bold' : 'normal',\n    });`,
      'pouch section size');
    method = methodReplace(method,
      `          fontSize: '15px',`,
      `          fontSize: chrome.compact ? '21px' : '15px',`,
      'pouch marker size');
    method = methodReplace(method,
      `        fontFamily: DIGITAL_FONT_FAMILY,\n        fontSize: getPlatformRuntime().language === 'ru' ? '8px' : '9px',`,
      `        fontFamily: chrome.compact ? 'system-ui, sans-serif' : DIGITAL_FONT_FAMILY,\n        fontSize: chrome.compact ? '17px' : getPlatformRuntime().language === 'ru' ? '8px' : '9px',\n        fontStyle: chrome.compact ? 'bold' : 'normal',`,
      'pouch title size');
    method = methodReplace(method,
      `        fontFamily: DIGITAL_FONT_FAMILY,\n        fontSize: '8px',`,
      `        fontFamily: chrome.compact ? 'system-ui, sans-serif' : DIGITAL_FONT_FAMILY,\n        fontSize: chrome.compact ? '15px' : '8px',`,
      'pouch subtitle size');
    method = methodReplace(method,
      `    const firstCardY = labelY + 20;`,
      `    const firstCardY = labelY + (chrome.compact ? 30 : 20);`,
      'pouch first card y');
    method = methodReplace(method,
      `      firstCardY + height + OPENING_FEEL_PRESENTATION.railGap,`,
      `      firstCardY + height + chrome.railGap,`,
      'charged card gap');
    method = methodReplace(method,
      `      firstCardY + height * 2 + OPENING_FEEL_PRESENTATION.railGap + 14,`,
      `      firstCardY + height * 2 + chrome.railGap + (chrome.compact ? 18 : 14),`,
      'odds panel y');
    return method;
  });

  source = mapMethod(source, 'renderPouchOdds(', 'startPaidPouchAvailabilityPulse(', () => `  private renderPouchOdds(\n    root: Phaser.GameObjects.Container,\n    x: number,\n    y: number,\n    width: number,\n  ): void {\n    const messages = getMessages(getPlatformRuntime().language);\n    const basic = LITE_V2_BALANCE.pouchProfiles.basic;\n    const charged = LITE_V2_BALANCE.pouchProfiles.charged;\n    const rarities: readonly StandardRarity[] = ['common', 'rare', 'epic', 'legendary'];\n    const rarityColors: Readonly<Record<StandardRarity, string>> = {\n      common: '#e8e5ee',\n      rare: '#8df8ff',\n      epic: '#c7b8ff',\n      legendary: '#ffd98a',\n    };\n    const compact = this.metrics?.compactChrome ?? false;\n    const fontFamily = this.getDetailFontFamily();\n    const panelHeight = compact ? 190 : 104;\n    const panel = this.add.container(x, y);\n    const background = this.add.graphics();\n    background.fillStyle(0x17101f, compact ? 0.91 : 0.78);\n    background.fillRoundedRect(0, 0, width, panelHeight, 14);\n    background.lineStyle(compact ? 1.5 : 1, 0xbda7d6, compact ? 0.34 : 0.22);\n    background.strokeRoundedRect(0, 0, width, panelHeight, 14);\n    panel.add(background);\n\n    const title = this.add.text(12, compact ? 12 : 8, messages.opening.dropRates, {\n      color: compact ? '#d9cfe4' : '#a99ab8',\n      fontFamily,\n      fontSize: compact ? '18px' : '7px',\n      fontStyle: compact ? 'bold' : 'normal',\n    });\n    panel.add(title);\n\n    const labelColumnWidth = compact ? 108 : 72;\n    const firstColumn = compact ? labelColumnWidth + 18 : 88;\n    const lastColumn = width - (compact ? 20 : 32);\n    const step = (lastColumn - firstColumn) / 3;\n    const columnX = rarities.map((_, index) => firstColumn + step * index);\n    const headerY = compact ? 47 : 25;\n    rarities.forEach((rarity, index) => {\n      const header = this.add\n        .text(columnX[index] ?? firstColumn, headerY, messages.rarity[rarity].toUpperCase().slice(0, 3), {\n          color: rarityColors[rarity],\n          fontFamily,\n          fontSize: compact ? '14px' : '5px',\n          fontStyle: compact ? 'bold' : 'normal',\n        })\n        .setOrigin(0.5);\n      panel.add(header);\n    });\n\n    const addRateRow = (\n      rowY: number,\n      label: string,\n      weights: Readonly<Record<StandardRarity, number>>,\n      accent: string,\n    ): void => {\n      panel.add(\n        this.add\n          .text(12, rowY, label, {\n            color: accent,\n            fontFamily,\n            fontSize: compact ? '16px' : getPlatformRuntime().language === 'ru' ? '6px' : '7px',\n            fontStyle: compact ? 'bold' : 'normal',\n          })\n          .setOrigin(0, 0.5),\n      );\n      rarities.forEach((rarity, index) => {\n        panel.add(\n          this.add\n            .text(columnX[index] ?? firstColumn, rowY, \`\${weights[rarity]}%\`, {\n              color: rarityColors[rarity],\n              fontFamily,\n              fontSize: compact ? '16px' : '7px',\n              fontStyle: compact ? '600' : 'normal',\n            })\n            .setOrigin(0.5),\n        );\n      });\n    };\n\n    addRateRow(compact ? 78 : 43, messages.opening.basicPouch, basic.rarityWeights, '#f7f2ff');\n    addRateRow(compact ? 108 : 61, messages.opening.chargedPouch, charged.rarityWeights, CHARGED_TEXT_COLOR);\n\n    const formatChance = (chance: number): string => {\n      const percent = chance * 100;\n      return \`\${Number.isInteger(percent) ? percent.toFixed(0) : percent.toFixed(1)}%\`;\n    };\n    panel.add(\n      this.add\n        .text(12, compact ? 141 : 78, \`\${messages.opening.secretOdds}  \${formatChance(basic.hiddenPocketChance)} → \${formatChance(charged.hiddenPocketChance)}\`, {\n          color: '#ffb4dc',\n          fontFamily,\n          fontSize: compact ? '15px' : '6px',\n          fontStyle: compact ? '600' : 'normal',\n        })\n        .setOrigin(0, 0.5),\n    );\n    panel.add(\n      this.add\n        .text(12, compact ? 171 : 94, messages.opening.fromFourthOpen, {\n          color: compact ? '#aca1b8' : '#81758f',\n          fontFamily,\n          fontSize: compact ? '13px' : '5px',\n        })\n        .setOrigin(0, 0.5),\n    );\n    root.add(panel);\n  }\n`);

  source = mapMethod(source, 'startPaidPouchAvailabilityPulse(', 'showUnavailableChargedFeedback(', (method) => {
    method = methodReplace(method,
      `    const width = OPENING_FEEL_PRESENTATION.railCardWidth;\n    const height = OPENING_FEEL_PRESENTATION.railCardHeight;`,
      `    const chrome = this.getChromeSizing();\n    const width = chrome.railCardWidth;\n    const height = chrome.railCardHeight;`,
      'paid pouch pulse geometry');
    return method;
  });

  source = mapMethod(source, 'getChipsHudTarget(', 'getBottomActionY(', (method) => {
    method = methodReplace(method,
      `    return {\n      x: this.metrics.safeLeft + 25,\n      y: this.metrics.safeTop + OPENING_FEEL_PRESENTATION.railTopOffset + OPENING_FEEL_PRESENTATION.chipsHudHeight / 2,\n    };`,
      `    const chrome = this.getChromeSizing();\n    return {\n      x: this.metrics.safeLeft + (chrome.compact ? 32 : 25),\n      y: this.metrics.safeTop + OPENING_FEEL_PRESENTATION.railTopOffset + chrome.chipsHudHeight / 2,\n    };`,
      'chips hud target compact');
    return method;
  });

  source = mapMethod(source, 'createCollectionButton(', 'createMuteButton(', (method) => {
    method = methodReplace(method,
      `        fontSize: '18px',`,
      `        fontSize: this.metrics.compactChrome ? '22px' : '18px',`,
      'collection action size');
    return method;
  });

  source = mapMethod(source, 'createMuteButton(', 'setChromeEnabled(', (method) => {
    method = methodReplace(method,
      `        fontSize: '14px',`,
      `        fontSize: this.metrics.compactChrome ? '18px' : '14px',`,
      'mute action size');
    return method;
  });

  source = mapMethod(source, 'getRewardBankOrigin(', 'renderRewardTray(', (method) => {
    method = methodReplace(method,
      `        x: this.rewardTrayContainer.x - OPENING_FEEL_PRESENTATION.rewardTrayWidth / 2 - 4,`,
      `        x: this.rewardTrayContainer.x - Number(this.rewardTrayContainer.getData('width') ?? OPENING_FEEL_PRESENTATION.rewardTrayWidth) / 2 - 4,`,
      'reward origin dynamic width');
    return method;
  });

  source = mapMethod(source, 'renderRewardTray(', 'createDiscoverySilhouetteAccent(', (method) => {
    method = methodReplace(method,
      `    const secretSelected = Boolean(pending.hiddenPocket && this.resultCarouselIndex === 1);\n    const width = OPENING_FEEL_PRESENTATION.rewardTrayWidth;\n    const left = -width / 2;\n    const contentLeft = left + OPENING_FEEL_PRESENTATION.rewardTrayContentInset;\n    const contentRight = width / 2 - OPENING_FEEL_PRESENTATION.rewardTrayContentInset;`,
      `    const secretSelected = Boolean(pending.hiddenPocket && this.resultCarouselIndex === 1);\n    const chrome = this.getChromeSizing();\n    const width = chrome.rewardTrayWidth;\n    const left = -width / 2;\n    const contentLeft = left + chrome.rewardTrayContentInset;\n    const contentRight = width / 2 - chrome.rewardTrayContentInset;`,
      'reward tray sizing');
    method = methodReplace(method, `      fontSize: '7px',`, `      fontSize: chrome.compact ? '14px' : '7px',`, 'reward header size');
    method = methodReplace(method, `      fontSize: '6px',\n      fontStyle: 'bold',`, `      fontSize: chrome.compact ? '13px' : '6px',\n      fontStyle: 'bold',`, 'reward rarity size');
    method = methodReplace(method, `    let cursorY = 31;`, `    let cursorY = chrome.compact ? 43 : 31;`, 'reward initial cursor');
    method = method.replaceAll(`fontFamily: DIGITAL_FONT_FAMILY,\n          fontSize: '6px',`, `fontFamily: chrome.compact ? 'system-ui, sans-serif' : DIGITAL_FONT_FAMILY,\n          fontSize: chrome.compact ? '12px' : '6px',`);
    method = method.replaceAll(`fontFamily: DIGITAL_FONT_FAMILY,\n            fontSize: '6px',`, `fontFamily: chrome.compact ? 'system-ui, sans-serif' : DIGITAL_FONT_FAMILY,\n            fontSize: chrome.compact ? '12px' : '6px',`);
    method = method.replaceAll(`fontFamily: DIGITAL_FONT_FAMILY,\n        fontSize: '9px',`, `fontFamily: chrome.compact ? 'system-ui, sans-serif' : DIGITAL_FONT_FAMILY,\n        fontSize: chrome.compact ? '16px' : '9px',`);
    method = method.replaceAll(`fontFamily: DIGITAL_FONT_FAMILY,\n          fontSize: '9px',`, `fontFamily: chrome.compact ? 'system-ui, sans-serif' : DIGITAL_FONT_FAMILY,\n          fontSize: chrome.compact ? '16px' : '9px',`);
    method = method.replaceAll(`fontFamily: DIGITAL_FONT_FAMILY,\n        fontSize: '8px',`, `fontFamily: chrome.compact ? 'system-ui, sans-serif' : DIGITAL_FONT_FAMILY,\n        fontSize: chrome.compact ? '15px' : '8px',`);
    method = method.replaceAll(`cursorY += 23;`, `cursorY += chrome.compact ? 34 : 23;`);
    method = method.replaceAll(`cursorY += 21;`, `cursorY += chrome.compact ? 31 : 21;`);
    method = method.replaceAll(`cursorY += 18;`, `cursorY += chrome.compact ? 28 : 18;`);
    method = method.replaceAll(`Math.max(15, breakdown.height + 5)`, `Math.max(chrome.compact ? 24 : 15, breakdown.height + 5)`);
    method = method.replaceAll(`Math.max(18, text.height + 5)`, `Math.max(chrome.compact ? 27 : 18, text.height + 5)`);
    method = method.replaceAll(`Math.max(18, nearCompletionText.height + 5)`, `Math.max(chrome.compact ? 27 : 18, nearCompletionText.height + 5)`);
    method = methodReplace(method,
      `      railRight: this.metrics!.safeLeft + OPENING_FEEL_PRESENTATION.railCardWidth,`,
      `      railRight: this.metrics!.safeLeft + chrome.railCardWidth,`,
      'reward placement rail');
    method = methodReplace(method,
      `    tray.setData('height', height);`,
      `    tray.setData('height', height);\n    tray.setData('width', width);`,
      'reward tray width data');
    return method;
  });

  source = mapMethod(source, 'positionResultHeading(', 'positionResultStatus(', (method) => {
    method = methodReplace(method,
      `    const titleMaxFontSize = 21;\n    const titleMinFontSize = 17;`,
      `    const titleMaxFontSize = this.metrics?.compactChrome ? 27 : 21;\n    const titleMinFontSize = this.metrics?.compactChrome ? 21 : 17;`,
      'result title fitting');
    return method;
  });

  source = mapMethod(source, 'renderResultActionPanel(', 'continueFromResult(', (method) => {
    method = methodReplace(method,
      `      fontSize: '21px',`,
      `      fontSize: this.metrics.compactChrome ? '27px' : '21px',`,
      'result title size');
    method = methodReplace(method,
      `      fontFamily: DIGITAL_FONT_FAMILY,\n      fontSize: '10px',\n      fontStyle: 'bold',`,
      `      fontFamily: this.metrics.compactChrome ? 'system-ui, sans-serif' : DIGITAL_FONT_FAMILY,\n      fontSize: this.metrics.compactChrome ? '15px' : '10px',\n      fontStyle: 'bold',`,
      'result rarity size');
    method = methodReplace(method,
      `      fontFamily: DIGITAL_FONT_FAMILY,\n      fontSize: '10px',\n    }).setOrigin(0.5);`,
      `      fontFamily: this.metrics.compactChrome ? 'system-ui, sans-serif' : DIGITAL_FONT_FAMILY,\n      fontSize: this.metrics.compactChrome ? '16px' : '10px',\n    }).setOrigin(0.5);`,
      'result status size');
    method = methodReplace(method,
      `        fontFamily: DIGITAL_FONT_FAMILY,\n        fontSize: '10px',`,
      `        fontFamily: this.metrics.compactChrome ? 'system-ui, sans-serif' : DIGITAL_FONT_FAMILY,\n        fontSize: this.metrics.compactChrome ? '16px' : '10px',`,
      'result status accent size');
    method = methodReplace(method,
      `      fontSize: pending.hiddenPocket ? '13px' : '15px',`,
      `      fontSize: this.metrics.compactChrome ? (pending.hiddenPocket ? '18px' : '20px') : pending.hiddenPocket ? '13px' : '15px',`,
      'result hint size');
    return method;
  });

  write(path, source);
}

// First-run scene: HiDPI-aware compact classification + larger drag cue on phones.
{
  const path = 'src/game/scenes/FirstRunScene.ts';
  let source = read(path);
  source = replaceOnce(
    source,
    `    const metrics = createLayoutMetrics(this.scale.width, this.scale.height, readSafeAreaInsets(ratio));`,
    `    const metrics = createLayoutMetrics(this.scale.width, this.scale.height, readSafeAreaInsets(ratio), ratio);`,
    'FirstRun layout ratio',
  );
  source = replaceOnce(
    source,
    `        { travelX: 72, durationMs: 720, repeatDelayMs: 420, angle: 0, scale: 0.92 },`,
    `        {\n          travelX: this.metrics.compactChrome ? 96 : 78,\n          durationMs: 720,\n          repeatDelayMs: 420,\n          angle: 0,\n          scale: this.metrics.compactChrome ? 1.24 : 1,\n        },`,
    'FirstRun compact pointer',
  );
  write(path, source);
}

// Guidance scene: keep pointers aligned with enlarged compact chrome.
{
  const path = 'src/game/scenes/GuidanceScene.ts';
  let source = read(path);
  source = replaceOnce(
    source,
    `    this.metrics = createLayoutMetrics(this.scale.width, this.scale.height, readSafeAreaInsets(ratio));`,
    `    this.metrics = createLayoutMetrics(this.scale.width, this.scale.height, readSafeAreaInsets(ratio), ratio);`,
    'Guidance layout ratio',
  );
  source = replaceOnce(
    source,
    `      {\n      travelX: -24,\n      durationMs: 620,\n      repeatDelayMs: 360,\n      angle: 180,\n      scale: 0.9,\n    });`,
    `      {\n      travelX: this.metrics.compactChrome ? -34 : -24,\n      durationMs: 620,\n      repeatDelayMs: 360,\n      angle: 180,\n      scale: this.metrics.compactChrome ? 1.12 : 0.9,\n    });`,
    'Guidance charged pointer scale',
  );
  source = replaceOnce(
    source,
    `        { travelX: -20, durationMs: 580, repeatDelayMs: 320, angle: 180, scale: 0.86 },`,
    `        {\n          travelX: this.metrics.compactChrome ? -30 : -20,\n          durationMs: 580,\n          repeatDelayMs: 320,\n          angle: 180,\n          scale: this.metrics.compactChrome ? 1.08 : 0.86,\n        },`,
    'Guidance result pointer scale',
  );
  source = mapMethod(source, 'getChargedCardPointerPosition(', 'rebuildRoot(', (method) => {
    method = methodReplace(method,
      `    const labelY = metrics.safeTop + OPENING_FEEL_PRESENTATION.selectorTopOffset;\n    const firstCardY = labelY + 20;\n    const chargedY = firstCardY + OPENING_FEEL_PRESENTATION.railCardHeight + OPENING_FEEL_PRESENTATION.railGap;\n    return {\n      x: metrics.safeLeft + OPENING_FEEL_PRESENTATION.railCardWidth + 34,\n      y: chargedY + OPENING_FEEL_PRESENTATION.railCardHeight / 2,\n    };`,
      `    const compact = metrics.compactChrome;\n    const selectorTopOffset = compact ? 230 : OPENING_FEEL_PRESENTATION.selectorTopOffset;\n    const railCardWidth = compact ? 300 : OPENING_FEEL_PRESENTATION.railCardWidth;\n    const railCardHeight = compact ? 82 : OPENING_FEEL_PRESENTATION.railCardHeight;\n    const railGap = compact ? 12 : OPENING_FEEL_PRESENTATION.railGap;\n    const labelY = metrics.safeTop + selectorTopOffset;\n    const firstCardY = labelY + (compact ? 30 : 20);\n    const chargedY = firstCardY + railCardHeight + railGap;\n    return {\n      x: metrics.safeLeft + railCardWidth + (compact ? 44 : 34),\n      y: chargedY + railCardHeight / 2,\n    };`,
      'Guidance charged card compact geometry');
    return method;
  });
  write(path, source);
}

// Collection already uses substantially larger system typography, but it still
// needs the same physical CSS-height classification and rotation metrics.
{
  const path = 'src/game/scenes/CollectionScene.ts';
  let source = read(path);
  source = replaceOnce(
    source,
    `    const metrics = createLayoutMetrics(this.scale.width, this.scale.height, readSafeAreaInsets(getRenderPixelRatio()));`,
    `    const ratio = getRenderPixelRatio();\n    const metrics = createLayoutMetrics(this.scale.width, this.scale.height, readSafeAreaInsets(ratio), ratio);`,
    'Collection layout ratio',
  );
  write(path, source);
}

console.log('Applied mobile acceptance hardening source patch.');
