import fs from 'node:fs/promises';

const path = 'src/game/scenes/OpeningScene.ts';
const source = await fs.readFile(path, 'utf8');
const startMarker = '  private renderRewardTray(\n';
const endMarker = '  private async animateRewardStaging(\n';
const start = source.indexOf(startMarker);
const end = source.indexOf(endMarker);
if (start < 0 || end < 0 || end <= start) throw new Error('Reward tray function markers not found.');

const replacement = `  private renderRewardTray(
    pending: PendingReveal,
    root: Phaser.GameObjects.Container,
    animate = false,
  ): Phaser.GameObjects.Container {
    this.rewardTrayContainer?.destroy(true);
    const messages = getMessages(getPlatformRuntime().language);
    const cacheLabel = this.getCacheLabel(pending.chips.cacheTier);
    const rarityColor = \`#\${RARITY_REVEAL_COLORS[pending.standard.rarity].toString(16).padStart(6, '0')}\`;
    const rarityCode = pending.standard.rarity.toUpperCase();
    const width = OPENING_FEEL_PRESENTATION.rewardTrayWidth;
    const left = -width / 2;
    const contentLeft = left + 13;
    const contentRight = width / 2 - 13;
    const breakdownParts = [\`\${messages.opening.chips} +\${pending.chips.base}\`];
    if (cacheLabel && pending.chips.cacheBonus > 0) breakdownParts.push(\`\${cacheLabel} +\${pending.chips.cacheBonus}\`);
    if (pending.chips.recycle > 0) breakdownParts.push(\`\${messages.opening.recycled} +\${pending.chips.recycle}\`);
    if (pending.chips.overchargeBonus > 0) breakdownParts.push(\`\${messages.opening.overcharge} +\${pending.chips.overchargeBonus}\`);

    type StatusRow = {
      kind: 'signal' | 'secret';
      text: string;
      color: string;
    };
    const statuses: StatusRow[] = [];
    if (pending.signal.gain > 0) {
      const signalResult = pending.signal.lockReached
        ? messages.opening.signalLockReady
        : \`\${pending.signal.after}/\${LITE_V2_BALANCE.signalThreshold}\`;
      statuses.push({
        kind: 'signal',
        text: \`\${messages.opening.signal} +\${pending.signal.gain} · \${signalResult}\`,
        color: '#b7a7ff',
      });
    } else if (pending.signal.lockConsumed) {
      statuses.push({ kind: 'signal', text: messages.opening.signalLockConsumed, color: '#ff9ed4' });
    } else if (pending.signal.lockRetained) {
      const retainedMultiplier = formatOverchargeMultiplier(pending.overcharge.afterHundredths);
      const maxSuffix = pending.overcharge.afterHundredths >= LITE_V2_BALANCE.overchargeCapHundredths ? ' MAX' : '';
      statuses.push({
        kind: 'signal',
        text: \`\${messages.opening.signalLockRetained} · \${retainedMultiplier}\${maxSuffix}\`,
        color: pending.overcharge.afterHundredths >= LITE_V2_BALANCE.overchargeCapHundredths ? '#ff9ed4' : '#b7a7ff',
      });
    }
    if (pending.hiddenPocket) {
      statuses.push({ kind: 'secret', text: messages.opening.addedToCollection, color: '#8df8ff' });
    }

    const tray = this.add.container(0, 0);
    const background = this.add.graphics();
    tray.add(background);

    const header = this.add.text(contentLeft, 9, 'REWARD', {
      color: '#d9cbef',
      fontFamily: DIGITAL_FONT_FAMILY,
      fontSize: '7px',
    });
    const rarity = this.add.text(contentRight, 9, rarityCode, {
      color: rarityColor,
      fontFamily: DIGITAL_FONT_FAMILY,
      fontSize: '6px',
    }).setOrigin(1, 0);
    tray.add([header, rarity]);

    const totalY = 31;
    const totalIcon = createChipToken(this, contentLeft + 4, totalY + 4, 0.48);
    const animatedTotalStart = animate && pending.chips.overchargeBonus > 0
      ? pending.chips.rawEarned
      : pending.chips.totalEarned;
    const totalText = this.add.text(contentLeft + 18, totalY - 3, \`+\${animatedTotalStart} \${messages.opening.chips}\`, {
      color: '#f4feff',
      stroke: '#100b16',
      strokeThickness: 2,
      fontFamily: DIGITAL_FONT_FAMILY,
      fontSize: '9px',
    });
    tray.add([totalIcon, totalText]);

    let cursorY = 52;
    if (breakdownParts.length > 1) {
      const breakdown = this.add.text(contentLeft, cursorY, breakdownParts.join(' · '), {
        color: '#b9c8d7',
        stroke: '#100b16',
        strokeThickness: 2,
        fontFamily: DIGITAL_FONT_FAMILY,
        fontSize: getPlatformRuntime().language === 'ru' ? '4.5px' : '5px',
        wordWrap: { width: width - 26, useAdvancedWrap: true },
        lineSpacing: 1,
      });
      tray.add(breakdown);
      cursorY += breakdown.height + 9;
    } else {
      cursorY += 3;
    }

    statuses.forEach((status) => {
      const iconY = cursorY + 4;
      const icon = status.kind === 'signal'
        ? createSignalToken(this, contentLeft + 4, iconY, false)
        : this.add.circle(contentLeft + 4, iconY, 5.5, SECRET_REVEAL_COLOR, 0.94).setStrokeStyle(1.5, 0xffffff, 0.5);
      const text = this.add.text(contentLeft + 18, cursorY, status.text, {
        color: status.color,
        stroke: '#100b16',
        strokeThickness: 2,
        fontFamily: DIGITAL_FONT_FAMILY,
        fontSize: getPlatformRuntime().language === 'ru' ? '5px' : '6px',
        wordWrap: { width: width - 50, useAdvancedWrap: true },
        lineSpacing: 1,
      });
      tray.add([icon, text]);
      cursorY += Math.max(18, text.height + 5);
    });

    const height = Math.max(67, cursorY + 7);
    const placement = computeRewardTrayPlacement({
      safeLeft: this.metrics!.safeLeft,
      safeRight: this.metrics!.safeRight,
      safeTop: this.metrics!.safeTop,
      centerX: this.metrics!.centerX,
      railRight: this.metrics!.safeLeft + OPENING_FEEL_PRESENTATION.railCardWidth,
      resultPanelTop: RESULT_PRESENTATION.panelY - RESULT_PRESENTATION.panelHeight / 2,
      trayWidth: width,
      trayHeight: height,
      heroHalfWidth: OPENING_FEEL_PRESENTATION.rewardTrayHeroHalfWidth,
      sideGap: OPENING_FEEL_PRESENTATION.rewardTraySideGap,
      resultGap: OPENING_FEEL_PRESENTATION.rewardTrayResultGap,
    });
    tray.setPosition(placement.x, placement.y - height / 2);
    tray.setData('height', height);
    tray.setData('side', placement.side);
    background.fillStyle(0x17101f, 0.9);
    background.fillRoundedRect(left, 0, width, height, 16);
    background.lineStyle(1.5, 0x8df8ff, 0.3);
    background.strokeRoundedRect(left, 0, width, height, 16);

    if (animate && pending.chips.overchargeBonus > 0) {
      const counter = { value: pending.chips.rawEarned };
      this.tweens.add({
        targets: counter,
        value: pending.chips.totalEarned,
        delay: 90,
        duration: 360,
        ease: 'Cubic.Out',
        onUpdate: () => {
          if (totalText.active) totalText.setText(\`+\${Math.round(counter.value)} \${messages.opening.chips}\`);
        },
        onComplete: () => {
          if (totalText.active) totalText.setText(\`+\${pending.chips.totalEarned} \${messages.opening.chips}\`);
        },
      });
    }

    root.add(tray);
    this.rewardTrayContainer = tray;
    if (animate) {
      const targetY = tray.y;
      tray.setAlpha(0).setY(targetY + 7);
      this.tweens.add({
        targets: tray,
        alpha: 1,
        y: targetY,
        duration: OPENING_FEEL_PRESENTATION.uiFadeInMs,
        ease: 'Sine.Out',
      });
    }
    return tray;
  }

`;

const currentFunction = source.slice(start, end);
if (currentFunction.includes('breakdownParts') && currentFunction.includes('retainedMultiplier')) {
  console.log('Compact reward tray already applied.');
  process.exit(0);
}

await fs.writeFile(path, source.slice(0, start) + replacement + source.slice(end));
console.log('Applied compact reward tray compromise.');
