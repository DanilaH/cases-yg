import { readFile, writeFile } from 'node:fs/promises';

const replaceOnce = async (path, from, to) => {
  const source = await readFile(path, 'utf8');
  const first = source.indexOf(from);
  if (first < 0) throw new Error(`Pattern not found in ${path}: ${from.slice(0, 100)}`);
  if (source.indexOf(from, first + from.length) >= 0) throw new Error(`Pattern is not unique in ${path}`);
  await writeFile(path, source.slice(0, first) + to + source.slice(first + from.length));
};

await replaceOnce(
  'src/game/data/artAssets.ts',
  `const BOOT_STATIC_ART_IDS: readonly StaticArtId[] = [\n  'pouch-body',\n  'pouch-tear-strip',\n  'pouch-star-tab',\n  'opening-bg',`,
  `const BOOT_STATIC_ART_IDS: readonly StaticArtId[] = [\n  'pouch-body',\n  'pouch-tear-strip',\n  'pouch-star-tab',\n  'charged-pouch-body',\n  'charged-pouch-tear-strip',\n  'charged-pouch-star-tab',\n  'opening-bg',`,
);

await replaceOnce(
  'src/game/scenes/OpeningScene.ts',
  `            this.saveState = this.session.getState();\n            this.previewLootPoolId = null;\n            this.dropSwitchInFlight = false;\n            this.renderIdle();\n            return;`,
  `            this.saveState = this.session.getState();\n            this.previewLootPoolId = null;\n            this.dropSwitchInFlight = false;\n            // The preview already renders the durable target. Re-rendering here\n            // would destroy the active switch tween and make the selector feel dead.\n            this.scheduleTearHint();\n            return;`,
);

await replaceOnce(
  'src/game/scenes/OpeningScene.ts',
  `        getPlatformRuntime().analytics.track('drop_selected', {\n          lootPoolId: target,\n          source: 'opening',\n        });\n        this.previewLootPoolId = null;\n        this.dropSwitchInFlight = false;\n        this.renderIdle();\n        return;`,
  `        getPlatformRuntime().analytics.track('drop_selected', {\n          lootPoolId: target,\n          source: 'opening',\n        });\n        this.previewLootPoolId = null;\n        this.dropSwitchInFlight = false;\n        // Keep the already-correct preview tree alive so its motion completes.\n        this.scheduleTearHint();\n        return;`,
);

await replaceOnce(
  'src/game/scenes/OpeningScene.ts',
  `  private async selectPouchType(pouchType: PouchType, sourceCard?: Phaser.GameObjects.Container): Promise<void> {\n    if (\n      this.phase !== 'idle' ||\n      this.dropSwitchInFlight ||\n      this.pouchArtLoadInFlight ||`,
  `  private async selectPouchType(pouchType: PouchType, sourceCard?: Phaser.GameObjects.Container): Promise<void> {\n    if (\n      this.phase !== 'idle' ||\n      this.pouchArtLoadInFlight ||`,
);

await replaceOnce(
  'src/game/scenes/OpeningScene.ts',
  `    const chargedCard = createCard(\n      'charged',\n      firstCardY + height + OPENING_FEEL_PRESENTATION.railGap,\n      \`⚡ \${messages.opening.chargedPouch}\`,\n      chargedAvailable\n        ? \`\${cost} \${messages.opening.chips}\`\n        : \`\${this.saveState.chips}/\${cost} \${messages.opening.chips}\`,\n      chargedAvailable,\n    );\n    if (chargedAvailable && this.selectedPouchType !== 'charged') {`,
  `    const chargedCard = createCard(\n      'charged',\n      firstCardY + height + OPENING_FEEL_PRESENTATION.railGap,\n      \`⚡ \${messages.opening.chargedPouch}\`,\n      chargedAvailable\n        ? \`\${cost} \${messages.opening.chips}\`\n        : \`\${this.saveState.chips}/\${cost} \${messages.opening.chips}\`,\n      chargedAvailable,\n    );\n    this.renderPouchOdds(\n      root,\n      railX,\n      firstCardY + height * 2 + OPENING_FEEL_PRESENTATION.railGap + 14,\n      width,\n    );\n    if (chargedAvailable && this.selectedPouchType !== 'charged') {`,
);

await replaceOnce(
  'src/game/scenes/OpeningScene.ts',
  `  private startPaidPouchAvailabilityPulse(card: Phaser.GameObjects.Container, linkedToSignal: boolean): void {`,
  `  private renderPouchOdds(\n    root: Phaser.GameObjects.Container,\n    x: number,\n    y: number,\n    width: number,\n  ): void {\n    const messages = getMessages(getPlatformRuntime().language);\n    const basic = LITE_V2_BALANCE.pouchProfiles.basic;\n    const charged = LITE_V2_BALANCE.pouchProfiles.charged;\n    const rarities: readonly StandardRarity[] = ['common', 'rare', 'epic', 'legendary'];\n    const rarityColors: Readonly<Record<StandardRarity, string>> = {\n      common: '#e8e5ee',\n      rare: '#8df8ff',\n      epic: '#c7b8ff',\n      legendary: '#ffd98a',\n    };\n    const panelHeight = 104;\n    const panel = this.add.container(x, y);\n    const background = this.add.graphics();\n    background.fillStyle(0x17101f, 0.78);\n    background.fillRoundedRect(0, 0, width, panelHeight, 14);\n    background.lineStyle(1, 0xbda7d6, 0.22);\n    background.strokeRoundedRect(0, 0, width, panelHeight, 14);\n    panel.add(background);\n\n    const title = this.add.text(10, 8, messages.opening.dropRates, {\n      color: '#a99ab8',\n      fontFamily: DIGITAL_FONT_FAMILY,\n      fontSize: '7px',\n    });\n    panel.add(title);\n\n    const columnX = [88, 120, 152, 184] as const;\n    rarities.forEach((rarity, index) => {\n      const header = this.add\n        .text(columnX[index] ?? 88, 25, messages.rarity[rarity].toUpperCase().slice(0, 3), {\n          color: rarityColors[rarity],\n          fontFamily: DIGITAL_FONT_FAMILY,\n          fontSize: '5px',\n        })\n        .setOrigin(0.5);\n      panel.add(header);\n    });\n\n    const addRateRow = (\n      rowY: number,\n      label: string,\n      weights: Readonly<Record<StandardRarity, number>>,\n      accent: string,\n    ): void => {\n      panel.add(\n        this.add\n          .text(10, rowY, label, {\n            color: accent,\n            fontFamily: DIGITAL_FONT_FAMILY,\n            fontSize: getPlatformRuntime().language === 'ru' ? '6px' : '7px',\n          })\n          .setOrigin(0, 0.5),\n      );\n      rarities.forEach((rarity, index) => {\n        panel.add(\n          this.add\n            .text(columnX[index] ?? 88, rowY, \`\${weights[rarity]}%\`, {\n              color: rarityColors[rarity],\n              fontFamily: DIGITAL_FONT_FAMILY,\n              fontSize: '7px',\n            })\n            .setOrigin(0.5),\n        );\n      });\n    };\n\n    addRateRow(43, messages.opening.basicPouch, basic.rarityWeights, '#f7f2ff');\n    addRateRow(61, messages.opening.chargedPouch, charged.rarityWeights, CHARGED_TEXT_COLOR);\n\n    const formatChance = (chance: number): string => {\n      const percent = chance * 100;\n      return \`\${Number.isInteger(percent) ? percent.toFixed(0) : percent.toFixed(1)}%\`;\n    };\n    panel.add(\n      this.add\n        .text(10, 78, \`\${messages.opening.secretOdds}  \${formatChance(basic.hiddenPocketChance)} → \${formatChance(charged.hiddenPocketChance)}\`, {\n          color: '#ffb4dc',\n          fontFamily: DIGITAL_FONT_FAMILY,\n          fontSize: '6px',\n        })\n        .setOrigin(0, 0.5),\n    );\n    panel.add(\n      this.add\n        .text(10, 94, messages.opening.fromFourthOpen, {\n          color: '#81758f',\n          fontFamily: DIGITAL_FONT_FAMILY,\n          fontSize: '5px',\n        })\n        .setOrigin(0, 0.5),\n    );\n    root.add(panel);\n  }\n\n  private startPaidPouchAvailabilityPulse(card: Phaser.GameObjects.Container, linkedToSignal: boolean): void {`,
);

await replaceOnce(
  'src/i18n/en.ts',
  `    free: 'FREE',\n    chargedReady: 'CHARGED POUCH READY',`,
  `    free: 'FREE',\n    dropRates: 'DROP RATES',\n    secretOdds: 'SECRET*',\n    fromFourthOpen: '* FROM OPEN 4',\n    chargedReady: 'CHARGED POUCH READY',`,
);

await replaceOnce(
  'src/i18n/ru.ts',
  `    free: 'БЕСПЛАТНО',\n    chargedReady: 'ЗАРЯЖЕННЫЙ ПАКЕТ ГОТОВ',`,
  `    free: 'БЕСПЛАТНО',\n    dropRates: 'ШАНСЫ',\n    secretOdds: 'СЕКРЕТ*',\n    fromFourthOpen: '* С 4-ГО ОТКРЫТИЯ',\n    chargedReady: 'ЗАРЯЖЕННЫЙ ПАКЕТ ГОТОВ',`,
);

await replaceOnce(
  'tests/runtime-assets.test.ts',
  `  it('keeps authored Charged Pouch art out of boot preload and maps all three layers', () => {\n    replaceSetContents(AVAILABLE_STATIC_ART_IDS, defaultStaticArtIds);\n\n    const bootIds = getRuntimeBootStaticArt().map(({ id }) => id);\n    expect(bootIds).toContain('pouch-body');\n    expect(bootIds).not.toContain('charged-pouch-body');`,
  `  it('preloads both pouch variants and maps all Charged layers', () => {\n    replaceSetContents(AVAILABLE_STATIC_ART_IDS, defaultStaticArtIds);\n\n    const bootIds = getRuntimeBootStaticArt().map(({ id }) => id);\n    expect(bootIds).toContain('pouch-body');\n    expect(bootIds).toContain('charged-pouch-body');\n    expect(bootIds).toContain('charged-pouch-tear-strip');\n    expect(bootIds).toContain('charged-pouch-star-tab');`,
);

console.log('Opening QA fixes applied.');
