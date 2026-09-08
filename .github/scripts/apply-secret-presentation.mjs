import fs from 'node:fs';

const replaceOnce = (path, from, to) => {
  const source = fs.readFileSync(path, 'utf8');
  if (source.includes(to)) return;
  if (!source.includes(from)) throw new Error(`Expected source not found in ${path}: ${from.slice(0, 180)}`);
  fs.writeFileSync(path, source.replace(from, to));
};

const replaceRegex = (path, regex, to, label) => {
  const source = fs.readFileSync(path, 'utf8');
  if (source.includes(to)) return;
  if (!regex.test(source)) throw new Error(`Expected ${label} not found in ${path}`);
  fs.writeFileSync(path, source.replace(regex, to));
};

// Secret gets its own ruby/gold identity instead of Signal cyan.
replaceOnce(
  'src/game/ui/openingVisuals.ts',
  'export const SECRET_REVEAL_COLOR = 0x65f6ff;',
  'export const SECRET_REVEAL_COLOR = 0xff4d6d;\nexport const SECRET_PREMIUM_GOLD = 0xffd36a;',
);

// Localized duplicate semantics.
replaceOnce(
  'src/i18n/en.ts',
  "    secretDiscovered: 'SECRET DISCOVERED',",
  "    secretDiscovered: 'SECRET DISCOVERED',\n    secretDuplicate: 'SECRET DUPLICATE',",
);
replaceOnce(
  'src/i18n/ru.ts',
  "    secretDiscovered: 'СЕКРЕТ НАЙДЕН',",
  "    secretDiscovered: 'СЕКРЕТ НАЙДЕН',\n    secretDuplicate: 'ДУБЛИКАТ СЕКРЕТА',",
);

// Debug: explicit post-completion Secret duplicate scenario.
replaceOnce(
  'src/debug/debugScenarios.ts',
  "  | 'hidden-pocket';",
  "  | 'hidden-pocket'\n  | 'hidden-pocket-duplicate';",
);
replaceOnce(
  'src/debug/debugScenarios.ts',
  `const allBasicEligibleIds = (): string[] =>\n  SLICE_REGISTRY.standardItems\n    .filter(({ rarity }) => LITE_V2_BALANCE.pouchProfiles.basic.rarityWeights[rarity] > 0)\n    .map(({ collectible }) => collectible.id);`,
  `const allBasicEligibleIds = (): string[] =>\n  SLICE_REGISTRY.standardItems\n    .filter(({ rarity }) => LITE_V2_BALANCE.pouchProfiles.basic.rarityWeights[rarity] > 0)\n    .map(({ collectible }) => collectible.id);\n\nconst allSecretIds = (): string[] =>\n  SLICE_REGISTRY.secrets.map(({ collectible }) => collectible.id);`,
);
replaceOnce(
  'src/debug/debugScenarios.ts',
  `  return {\n    state: {\n      ...base,\n      signal: 0,\n      discoveredSecrets: [],\n    },\n    // Normal standard: camera/common, base CHIPS, no cache, Hidden Pocket trigger, first Secret.\n    random: new SequenceRandomSource([0.1, basicRaritySample.common, 0, 0, 0, 0.1]),\n    pouchType: 'basic',\n  };`,
  `  if (scenario === 'hidden-pocket-duplicate') {\n    return {\n      state: {\n        ...base,\n        discoveredSecrets: allSecretIds(),\n      },\n      // Normal standard + successful Hidden Pocket after Secret completion.\n      random: new SequenceRandomSource([0.1, basicRaritySample.common, 0, 0, 0, 0.1]),\n      pouchType: 'basic',\n    };\n  }\n\n  return {\n    state: {\n      ...base,\n      signal: 0,\n      discoveredSecrets: [],\n    },\n    // Normal standard: camera/common, base CHIPS, no cache, Hidden Pocket trigger, first Secret.\n    random: new SequenceRandomSource([0.1, basicRaritySample.common, 0, 0, 0, 0.1]),\n    pouchType: 'basic',\n  };`,
);
replaceOnce(
  'src/debug/createDebugPanel.ts',
  "  addButton('Force Hidden Pocket', () => stageAndReload('hidden-pocket'));",
  "  addButton('Force Hidden Pocket', () => stageAndReload('hidden-pocket'));\n  addButton('Force Hidden Pocket Duplicate', () => stageAndReload('hidden-pocket-duplicate'));",
);
replaceOnce(
  'tests/debug-scenarios.test.ts',
  "    'hidden-pocket',\n  ] as const)",
  "    'hidden-pocket',\n    'hidden-pocket-duplicate',\n  ] as const)",
);

// OpeningScene imports and persistent-effect bookkeeping.
replaceOnce(
  'src/game/scenes/OpeningScene.ts',
  `  SECRET_REVEAL_COLOR,\n  type PouchVisual,`,
  `  SECRET_PREMIUM_GOLD,\n  SECRET_REVEAL_COLOR,\n  type PouchVisual,`,
);
replaceOnce(
  'src/game/scenes/OpeningScene.ts',
  `  private ambientParticles: Phaser.GameObjects.Arc[] = [];\n  private resultBreathTarget: Phaser.GameObjects.Container | null = null;`,
  `  private ambientParticles: Phaser.GameObjects.Arc[] = [];\n  private secretPremiumTargets: Phaser.GameObjects.GameObject[] = [];\n  private resultBreathTarget: Phaser.GameObjects.Container | null = null;`,
);
replaceOnce(
  'src/game/scenes/OpeningScene.ts',
  `    this.stopRewardBreathing();\n    this.clearAmbientMotion();\n    this.clearHudMotion();`,
  `    this.stopRewardBreathing();\n    this.clearAmbientMotion();\n    this.clearSecretPremiumMotion();\n    this.clearHudMotion();`,
);

replaceOnce(
  'src/game/scenes/OpeningScene.ts',
  `  private clearAmbientMotion(): void {\n    for (const particle of this.ambientParticles) {\n      this.tweens.killTweensOf(particle);\n    }\n    this.ambientParticles = [];\n  }`,
  `  private clearAmbientMotion(): void {\n    for (const particle of this.ambientParticles) {\n      this.tweens.killTweensOf(particle);\n    }\n    this.ambientParticles = [];\n  }\n\n  private clearSecretPremiumMotion(): void {\n    for (const target of this.secretPremiumTargets) {\n      this.tweens.killTweensOf(target);\n    }\n    this.secretPremiumTargets = [];\n  }\n\n  private trackSecretPremiumTarget<T extends Phaser.GameObjects.GameObject>(target: T): T {\n    this.secretPremiumTargets.push(target);\n    return target;\n  }\n\n  private addPersistentSecretPremiumState(page: Phaser.GameObjects.Container): void {\n    const layer = this.trackSecretPremiumTarget(this.add.container(0, 0));\n    const backdrop = this.trackSecretPremiumTarget(\n      this.add.ellipse(0, 10, 410, 320, 0x2a102a, 0.14).setBlendMode(Phaser.BlendModes.MULTIPLY),\n    );\n    const halo = this.trackSecretPremiumTarget(\n      this.add.circle(0, 0, 158, SECRET_REVEAL_COLOR, 0.13).setBlendMode(Phaser.BlendModes.ADD),\n    );\n    const cloudA = this.trackSecretPremiumTarget(\n      this.add.ellipse(-30, 12, 292, 182, SECRET_REVEAL_COLOR, 0.095).setBlendMode(Phaser.BlendModes.ADD),\n    );\n    const cloudB = this.trackSecretPremiumTarget(\n      this.add.ellipse(44, -18, 238, 150, 0xa45cff, 0.075).setBlendMode(Phaser.BlendModes.ADD),\n    );\n    layer.add([backdrop, halo, cloudA, cloudB]);\n\n    this.tweens.add({ targets: halo, scale: 1.06, alpha: 0.18, duration: 1500, yoyo: true, repeat: -1, ease: 'Sine.InOut' });\n    this.tweens.add({ targets: cloudA, x: 22, y: -4, angle: 3, duration: 2400, yoyo: true, repeat: -1, ease: 'Sine.InOut' });\n    this.tweens.add({ targets: cloudB, x: -18, y: 12, angle: -4, duration: 2100, yoyo: true, repeat: -1, ease: 'Sine.InOut' });\n\n    for (let index = 0; index < 10; index += 1) {\n      const angle = (Math.PI * 2 * index) / 10 + 0.31;\n      const radius = 92 + (index % 3) * 34;\n      const sparkle = this.trackSecretPremiumTarget(\n        this.add.circle(\n          Math.cos(angle) * radius,\n          Math.sin(angle) * radius * 0.72,\n          index % 3 === 0 ? 3.2 : 2.1,\n          index % 3 === 0 ? SECRET_PREMIUM_GOLD : SECRET_REVEAL_COLOR,\n          0.28 + (index % 4) * 0.08,\n        ).setBlendMode(Phaser.BlendModes.ADD),\n      );\n      layer.add(sparkle);\n      const baseX = sparkle.x;\n      const baseY = sparkle.y;\n      this.tweens.add({\n        targets: sparkle,\n        x: baseX + (index % 2 === 0 ? 9 : -9),\n        y: baseY - 14 - (index % 3) * 4,\n        alpha: index % 3 === 0 ? 0.88 : 0.58,\n        scale: index % 3 === 0 ? 1.55 : 1.25,\n        duration: 1100 + index * 90,\n        delay: index * 95,\n        yoyo: true,\n        repeat: -1,\n        repeatDelay: 260 + (index % 4) * 170,\n        ease: 'Sine.InOut',\n      });\n    }\n\n    page.add(layer);\n    page.sendToBack(layer);\n  }`,
);

// One tray follows the active carousel page; standard total excludes the separate Secret jackpot.
replaceRegex(
  'src/game/scenes/OpeningScene.ts',
  /  private renderRewardTray\([\s\S]*?\n  private async animateRewardStaging\(/,
  `  private renderRewardTray(\n    pending: PendingReveal,\n    root: Phaser.GameObjects.Container,\n    animate = false,\n  ): Phaser.GameObjects.Container {\n    this.rewardTrayContainer?.destroy(true);\n    const messages = getMessages(getPlatformRuntime().language);\n    const secretSelected = Boolean(pending.hiddenPocket && this.resultCarouselIndex === 1);\n    const width = OPENING_FEEL_PRESENTATION.rewardTrayWidth;\n    const left = -width / 2;\n    const contentLeft = left + 13;\n    const contentRight = width / 2 - 13;\n    const tray = this.add.container(0, 0);\n    const background = this.add.graphics();\n    tray.add(background);\n\n    const rarityCode = secretSelected ? 'SECRET' : pending.standard.rarity.toUpperCase();\n    const rarityColor = secretSelected\n      ? '#ff4d6d'\n      : \`#\${RARITY_REVEAL_COLORS[pending.standard.rarity].toString(16).padStart(6, '0')}\`;\n    const header = this.add.text(contentLeft, 9, 'REWARD', {\n      color: '#d9cbef',\n      fontFamily: DIGITAL_FONT_FAMILY,\n      fontSize: '7px',\n    });\n    const rarity = this.add.text(contentRight, 9, rarityCode, {\n      color: rarityColor,\n      fontFamily: DIGITAL_FONT_FAMILY,\n      fontSize: '6px',\n      fontStyle: 'bold',\n    }).setOrigin(1, 0);\n    tray.add([header, rarity]);\n\n    let cursorY = 31;\n    if (secretSelected && pending.hiddenPocket) {\n      const secretStatus = pending.hiddenPocket.isNew\n        ? messages.opening.secretDiscovered\n        : messages.opening.secretDuplicate;\n      const status = this.add.text(contentLeft, cursorY - 2, secretStatus, {\n        color: '#ff7088',\n        stroke: '#100b16',\n        strokeThickness: 2,\n        fontFamily: DIGITAL_FONT_FAMILY,\n        fontSize: '8px',\n        fontStyle: 'bold',\n      });\n      tray.add(status);\n      cursorY += 23;\n\n      if (pending.chips.secretBonus > 0) {\n        const token = createChipToken(this, contentLeft + 4, cursorY + 4, 0.48);\n        const bonus = this.add.text(contentLeft + 18, cursorY - 3, \`+\${pending.chips.secretBonus} \${messages.opening.chips}\`, {\n          color: '#ffd36a',\n          stroke: '#100b16',\n          strokeThickness: 2,\n          fontFamily: DIGITAL_FONT_FAMILY,\n          fontSize: '9px',\n        });\n        tray.add([token, bonus]);\n        cursorY += 23;\n      }\n\n      if (pending.hiddenPocket.isNew) {\n        const collection = this.add.text(contentLeft, cursorY, messages.opening.addedToCollection, {\n          color: '#ffdca0',\n          stroke: '#100b16',\n          strokeThickness: 2,\n          fontFamily: DIGITAL_FONT_FAMILY,\n          fontSize: '6px',\n        });\n        tray.add(collection);\n        cursorY += 18;\n      }\n    } else {\n      const cacheLabel = this.getCacheLabel(pending.chips.cacheTier);\n      const standardTotal = pending.chips.totalEarned - pending.chips.secretBonus;\n      const breakdownParts = [\`\${messages.opening.chips} +\${pending.chips.base}\`];\n      if (cacheLabel && pending.chips.cacheBonus > 0) breakdownParts.push(\`\${cacheLabel} +\${pending.chips.cacheBonus}\`);\n      if (pending.chips.recycle > 0) breakdownParts.push(\`\${messages.opening.recycled} +\${pending.chips.recycle}\`);\n      if (pending.chips.overchargeBonus > 0) breakdownParts.push(\`\${messages.opening.overcharge} +\${pending.chips.overchargeBonus}\`);\n\n      const totalIcon = createChipToken(this, contentLeft + 4, cursorY + 4, 0.48);\n      const animatedTotalStart = animate && pending.chips.overchargeBonus > 0\n        ? pending.chips.rawEarned\n        : standardTotal;\n      const totalText = this.add.text(contentLeft + 18, cursorY - 3, \`+\${animatedTotalStart} \${messages.opening.chips}\`, {\n        color: '#f4feff',\n        stroke: '#100b16',\n        strokeThickness: 2,\n        fontFamily: DIGITAL_FONT_FAMILY,\n        fontSize: '9px',\n      });\n      tray.add([totalIcon, totalText]);\n      cursorY += 21;\n\n      if (breakdownParts.length > 1) {\n        const breakdown = this.add.text(contentLeft, cursorY, breakdownParts.join(' · '), {\n          color: '#b9c8d7',\n          stroke: '#100b16',\n          strokeThickness: 2,\n          fontFamily: DIGITAL_FONT_FAMILY,\n          fontSize: '6px',\n        });\n        tray.add(breakdown);\n        cursorY += 19;\n      } else {\n        cursorY += 4;\n      }\n\n      let signalText: string | null = null;\n      let signalColor = '#b7a7ff';\n      if (pending.signal.gain > 0) {\n        const signalResult = pending.signal.lockReached\n          ? messages.opening.signalLockReady\n          : \`\${pending.signal.after}/\${LITE_V2_BALANCE.signalThreshold}\`;\n        signalText = \`\${messages.opening.signal} +\${pending.signal.gain} · \${signalResult}\`;\n      } else if (pending.signal.lockConsumed) {\n        signalText = messages.opening.signalLockConsumed;\n        signalColor = '#ff9ed4';\n      } else if (pending.signal.lockRetained) {\n        const retainedMultiplier = formatOverchargeMultiplier(pending.overcharge.afterHundredths);\n        const maxSuffix = pending.overcharge.afterHundredths >= LITE_V2_BALANCE.overchargeCapHundredths ? ' MAX' : '';\n        signalText = \`\${messages.opening.signalLockRetained} · \${retainedMultiplier}\${maxSuffix}\`;\n        signalColor = pending.overcharge.afterHundredths >= LITE_V2_BALANCE.overchargeCapHundredths ? '#ff9ed4' : '#b7a7ff';\n      }\n      if (signalText) {\n        const icon = createSignalToken(this, contentLeft + 4, cursorY + 4, false);\n        const text = this.add.text(contentLeft + 18, cursorY, signalText, {\n          color: signalColor,\n          stroke: '#100b16',\n          strokeThickness: 2,\n          fontFamily: DIGITAL_FONT_FAMILY,\n          fontSize: '6px',\n        });\n        tray.add([icon, text]);\n        cursorY += 18;\n      }\n\n      if (animate && pending.chips.overchargeBonus > 0) {\n        const counter = { value: pending.chips.rawEarned };\n        this.tweens.add({\n          targets: counter,\n          value: standardTotal,\n          delay: 90,\n          duration: 360,\n          ease: 'Cubic.Out',\n          onUpdate: () => {\n            if (totalText.active) totalText.setText(\`+\${Math.round(counter.value)} \${messages.opening.chips}\`);\n          },\n          onComplete: () => {\n            if (totalText.active) totalText.setText(\`+\${standardTotal} \${messages.opening.chips}\`);\n          },\n        });\n      }\n    }\n\n    const height = Math.max(72, cursorY + 8);\n    const placement = computeRewardTrayPlacement({\n      safeLeft: this.metrics!.safeLeft,\n      safeRight: this.metrics!.safeRight,\n      safeTop: this.metrics!.safeTop,\n      centerX: this.metrics!.centerX,\n      railRight: this.metrics!.safeLeft + OPENING_FEEL_PRESENTATION.railCardWidth,\n      resultPanelTop: RESULT_PRESENTATION.panelY - RESULT_PRESENTATION.panelHeight / 2,\n      trayWidth: width,\n      trayHeight: height,\n      heroHalfWidth: OPENING_FEEL_PRESENTATION.rewardTrayHeroHalfWidth,\n      sideGap: OPENING_FEEL_PRESENTATION.rewardTraySideGap,\n      resultGap: OPENING_FEEL_PRESENTATION.rewardTrayResultGap,\n    });\n    tray.setPosition(placement.x, placement.y - height / 2);\n    tray.setData('height', height);\n    tray.setData('side', placement.side);\n    background.fillStyle(0x17101f, 0.91);\n    background.fillRoundedRect(left, 0, width, height, 16);\n    background.lineStyle(1.5, secretSelected ? SECRET_REVEAL_COLOR : 0x8df8ff, secretSelected ? 0.5 : 0.3);\n    background.strokeRoundedRect(left, 0, width, height, 16);\n\n    root.add(tray);\n    this.rewardTrayContainer = tray;\n    if (animate) {\n      const targetY = tray.y;\n      tray.setAlpha(0).setY(targetY + 7);\n      this.tweens.add({\n        targets: tray,\n        alpha: 1,\n        y: targetY,\n        duration: OPENING_FEEL_PRESENTATION.uiFadeInMs,\n        ease: 'Sine.Out',\n      });\n    }\n    return tray;\n  }\n\n  private async animateRewardStaging(`,
  'reward tray function',
);

// Bank the Secret jackpot as its own visible leg after the standard reward components.
replaceOnce(
  'src/game/scenes/OpeningScene.ts',
  `    await bankLeg(pending.chips.overchargeBonus);\n    if (this.isSceneShutdown() || this.finishDeferredBankingResize()) return;\n    await this.bankSignalGain(pending);`,
  `    await bankLeg(pending.chips.overchargeBonus);\n    if (this.isSceneShutdown() || this.finishDeferredBankingResize()) return;\n    await bankLeg(pending.chips.secretBonus);\n    if (this.isSceneShutdown() || this.finishDeferredBankingResize()) return;\n    await this.bankSignalGain(pending);`,
);

// Strengthen the one-shot arrival peak and move it into the new rarity language.
replaceOnce(
  'src/game/scenes/OpeningScene.ts',
  "        color: '#8df8ff',",
  "        color: '#ff7088',",
);
replaceOnce(
  'src/game/scenes/OpeningScene.ts',
  '    this.createRevealBackdrop(fx.backdropAlpha, fx.particleDuration);',
  '    this.createRevealBackdrop(Math.min(0.58, fx.backdropAlpha * 1.28), fx.particleDuration + 120);',
);
replaceOnce(
  'src/game/scenes/OpeningScene.ts',
  '    const cloudA = this.add.ellipse(-28, 8, 280, 176, SECRET_REVEAL_COLOR, 0.13).setBlendMode(Phaser.BlendModes.ADD);\n    const cloudB = this.add.ellipse(42, -20, 220, 142, 0xff8ed1, 0.09).setBlendMode(Phaser.BlendModes.ADD);',
  '    const cloudA = this.add.ellipse(-28, 8, 300, 188, SECRET_REVEAL_COLOR, 0.19).setBlendMode(Phaser.BlendModes.ADD);\n    const cloudB = this.add.ellipse(42, -20, 238, 154, 0xa45cff, 0.13).setBlendMode(Phaser.BlendModes.ADD);',
);
replaceOnce(
  'src/game/scenes/OpeningScene.ts',
  `    const secondary = createRevealRing(this, root, heroX, heroY, SECRET_REVEAL_COLOR)\n      .setScale(0.25)\n      .setAlpha(0.46)\n      .setStrokeStyle(4, SECRET_REVEAL_COLOR, 0.68);`,
  `    const secondary = createRevealRing(this, root, heroX, heroY, SECRET_PREMIUM_GOLD)\n      .setScale(0.25)\n      .setAlpha(0.56)\n      .setStrokeStyle(4, SECRET_PREMIUM_GOLD, 0.76);`,
);
replaceOnce(
  'src/game/scenes/OpeningScene.ts',
  `    this.spawnSparkles(\n      heroX,\n      heroY,\n      SECRET_REVEAL_COLOR,\n      fx.particleCount,\n      fx.particleDistance,\n      fx.particleDuration,\n      fx.sparkleScale,\n    );`,
  `    this.spawnSparkles(\n      heroX,\n      heroY,\n      SECRET_REVEAL_COLOR,\n      fx.particleCount,\n      fx.particleDistance,\n      fx.particleDuration,\n      fx.sparkleScale,\n    );\n    this.spawnSparkles(\n      heroX,\n      heroY,\n      SECRET_PREMIUM_GOLD,\n      Math.max(10, Math.floor(fx.particleCount / 3)),\n      fx.particleDistance * 0.82,\n      fx.particleDuration + 120,\n      fx.sparkleScale * 0.72,\n    );`,
);
replaceOnce(
  'src/game/scenes/OpeningScene.ts',
  '    this.cameras.main.shake(120, Math.min(0.0054, fx.shake * 1.18));',
  '    this.cameras.main.shake(145, Math.min(0.0062, fx.shake * 1.35));',
);

// Persistent premium state is constructed in the final carousel and survives until collect/root teardown.
replaceOnce(
  'src/game/scenes/OpeningScene.ts',
  `    const secretPage = this.add.container(0, getCollectiblePresentation(pending.hiddenPocket.familyId).revealY);\n    root.add(secretPage);\n    const secretVisual = createCollectibleVisual(`,
  `    const secretPage = this.add.container(0, getCollectiblePresentation(pending.hiddenPocket.familyId).revealY);\n    root.add(secretPage);\n    this.addPersistentSecretPremiumState(secretPage);\n    const secretVisual = createCollectibleVisual(`,
);
replaceOnce(
  'src/game/scenes/OpeningScene.ts',
  "      color: '#8df8ff',\n      stroke: '#160f20',\n      strokeThickness: 3,\n      fontFamily: 'monospace',",
  "      color: '#ff7088',\n      stroke: '#160f20',\n      strokeThickness: 3,\n      fontFamily: 'monospace',",
);

// Carousel page switch updates both the panel copy and the single reward tray.
replaceOnce(
  'src/game/scenes/OpeningScene.ts',
  `        this.positionResultCarousel(0, true);\n        this.syncCarouselRewardBreathing();\n        if (this.lastReveal) this.renderResultActionPanel(this.lastReveal);`,
  `        this.positionResultCarousel(0, true);\n        this.syncCarouselRewardBreathing();\n        if (this.lastReveal && this.root) {\n          this.renderRewardTray(this.lastReveal, this.root, false);\n          this.renderResultActionPanel(this.lastReveal);\n        }`,
);

// Active carousel marker follows Secret ruby when the Secret page is selected.
replaceOnce(
  'src/game/scenes/OpeningScene.ts',
  `    this.resultCarouselDots.forEach((dot, index) => {\n      dot.setFillStyle(\n        index === this.resultCarouselIndex ? 0x8df8ff : 0xece4f6,\n        index === this.resultCarouselIndex ? 0.95 : 0.35,\n      );\n    });`,
  `    const activeDotColor = this.lastReveal?.hiddenPocket && this.resultCarouselIndex === 1\n      ? SECRET_REVEAL_COLOR\n      : 0x8df8ff;\n    this.resultCarouselDots.forEach((dot, index) => {\n      dot.setFillStyle(\n        index === this.resultCarouselIndex ? activeDotColor : 0xece4f6,\n        index === this.resultCarouselIndex ? 0.95 : 0.35,\n      );\n    });`,
);

// Result copy distinguishes new vs duplicate and uses Secret rarity color.
replaceOnce(
  'src/game/scenes/OpeningScene.ts',
  `        rarity: messages.rarity.secret,\n        rarityColor: '#8df8ff',\n        status: messages.opening.secretDiscovered,\n        statusColor: '#f5f0ff',`,
  `        rarity: messages.rarity.secret,\n        rarityColor: '#ff4d6d',\n        status: pending.hiddenPocket.isNew ? messages.opening.secretDiscovered : messages.opening.secretDuplicate,\n        statusColor: pending.hiddenPocket.isNew ? '#ffdca0' : '#ffb0be',`,
);

// Analytics records the exact jackpot kind instead of calling duplicates discoveries.
replaceOnce(
  'src/game/scenes/OpeningScene.ts',
  `    if (pending.hiddenPocket) {\n      analytics.track('hidden_pocket_triggered', { openingNumber: pending.openingNumber });\n      analytics.track('secret_discovered', {\n        openingNumber: pending.openingNumber,\n        familyId: pending.hiddenPocket.familyId,\n        collectibleId: pending.hiddenPocket.collectibleId,\n      });\n    }`,
  `    if (pending.hiddenPocket) {\n      analytics.track('hidden_pocket_triggered', {\n        openingNumber: pending.openingNumber,\n        isNew: pending.hiddenPocket.isNew,\n        bonusChips: pending.hiddenPocket.bonusChips,\n      });\n      analytics.track(pending.hiddenPocket.isNew ? 'secret_discovered' : 'secret_duplicate', {\n        openingNumber: pending.openingNumber,\n        familyId: pending.hiddenPocket.familyId,\n        collectibleId: pending.hiddenPocket.collectibleId,\n        bonusChips: pending.hiddenPocket.bonusChips,\n      });\n    }`,
);
