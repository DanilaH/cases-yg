import fs from 'node:fs';

const replaceUnique = (source, before, after, label) => {
  const first = source.indexOf(before);
  if (first < 0) throw new Error(`Missing target: ${label}`);
  if (source.indexOf(before, first + before.length) >= 0) throw new Error(`Non-unique target: ${label}`);
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

const localReplace = (method, before, after, label) => replaceUnique(method, before, after, label);

{
  const path = 'src/game/scenes/OpeningScene.ts';
  let source = fs.readFileSync(path, 'utf8');

  source = replaceUnique(
    source,
    `      rewardTrayWidth: compact ? 360 : OPENING_FEEL_PRESENTATION.rewardTrayWidth,`,
    `      rewardTrayWidth: compact ? 420 : OPENING_FEEL_PRESENTATION.rewardTrayWidth,`,
    'reward tray width',
  );

  source = mapMethod(source, 'renderIdle(', 'animateIdleEntry(', (method) =>
    localReplace(
      method,
      `        fontSize: '16px',`,
      `        fontSize: metrics.compactChrome ? '20px' : '16px',`,
      'tear hint size',
    ),
  );

  source = mapMethod(source, 'renderChipsHud(', 'setChipsHudValue(', (method) =>
    localReplace(
      method,
      `        fontSize: chrome.compact ? '18px' : '9px',`,
      `        fontSize: chrome.compact ? '20px' : '9px',`,
      'chips label',
    ),
  );

  source = mapMethod(source, 'renderSignalHud(', 'getDisplayedLootPoolId(', (method) => {
    method = localReplace(
      method,
      `      fontSize: chrome.compact ? '17px' : lockReady ? '8px' : '9px',`,
      `      fontSize: chrome.compact ? '19px' : lockReady ? '8px' : '9px',`,
      'signal label',
    );
    method = localReplace(
      method,
      `      fontSize: chrome.compact ? '17px' : '9px',`,
      `      fontSize: chrome.compact ? '19px' : '9px',`,
      'signal value',
    );
    method = method.replaceAll(
      `fontSize: chrome.compact ? '14px' : '7px'`,
      `fontSize: chrome.compact ? '17px' : '7px'`,
    );
    return method;
  });

  source = mapMethod(source, 'renderDropSelector(', 'animateDropPreview(', (method) => {
    method = localReplace(
      method,
      `fontSize: this.metrics.compactChrome ? '16px' : getPlatformRuntime().language === 'ru' ? '9px' : '10px'`,
      `fontSize: this.metrics.compactChrome ? '18px' : getPlatformRuntime().language === 'ru' ? '9px' : '10px'`,
      'drop title',
    );
    method = localReplace(
      method,
      `fontSize: this.metrics.compactChrome ? '14px' : '8px'`,
      `fontSize: this.metrics.compactChrome ? '16px' : '8px'`,
      'drop progress',
    );
    method = localReplace(
      method,
      `fontSize: this.metrics.compactChrome ? '12px' : '6px'`,
      `fontSize: this.metrics.compactChrome ? '14px' : '6px'`,
      'next drop',
    );
    return method;
  });

  source = mapMethod(source, 'renderPouchSelector(', 'renderPouchOdds(', (method) => {
    method = localReplace(method, `fontSize: chrome.compact ? '17px' : '9px'`, `fontSize: chrome.compact ? '20px' : '9px'`, 'pouch section');
    method = localReplace(method, `fontSize: chrome.compact ? '21px' : '15px'`, `fontSize: chrome.compact ? '24px' : '15px'`, 'pouch marker');
    method = localReplace(
      method,
      `fontSize: chrome.compact ? '17px' : getPlatformRuntime().language === 'ru' ? '8px' : '9px'`,
      `fontSize: chrome.compact ? '20px' : getPlatformRuntime().language === 'ru' ? '8px' : '9px'`,
      'pouch title',
    );
    method = localReplace(method, `fontSize: chrome.compact ? '15px' : '8px'`, `fontSize: chrome.compact ? '18px' : '8px'`, 'pouch subtitle');
    return method;
  });

  source = mapMethod(source, 'renderPouchOdds(', 'startPaidPouchAvailabilityPulse(', (method) => {
    method = localReplace(method, `fontSize: compact ? '18px' : '7px'`, `fontSize: compact ? '21px' : '7px'`, 'odds title');
    method = localReplace(method, `fontSize: compact ? '14px' : '5px'`, `fontSize: compact ? '17px' : '5px'`, 'odds headers');
    method = localReplace(
      method,
      `fontSize: compact ? '16px' : getPlatformRuntime().language === 'ru' ? '6px' : '7px'`,
      `fontSize: compact ? '19px' : getPlatformRuntime().language === 'ru' ? '6px' : '7px'`,
      'odds row label',
    );
    method = localReplace(method, `fontSize: compact ? '16px' : '7px'`, `fontSize: compact ? '19px' : '7px'`, 'odds percentages');
    method = localReplace(method, `fontSize: compact ? '15px' : '6px'`, `fontSize: compact ? '18px' : '6px'`, 'secret odds');
    method = localReplace(method, `fontSize: compact ? '13px' : '5px'`, `fontSize: compact ? '15px' : '5px'`, 'odds footer');
    return method;
  });

  source = mapMethod(source, 'animateChipsPrelude(', 'getRewardBankOrigin(', (method) => {
    method = localReplace(
      method,
      `    const width = OPENING_FEEL_PRESENTATION.chipsHudWidth;\n    const height = OPENING_FEEL_PRESENTATION.chipsHudHeight;`,
      `    const chrome = this.getChromeSizing();\n    const width = chrome.chipsHudWidth;\n    const height = chrome.chipsHudHeight;`,
      'charged-spend HUD geometry',
    );
    method = localReplace(method, `        fontSize: '10px',`, `        fontSize: chrome.compact ? '18px' : '10px',`, 'charged-spend debit size');
    return method;
  });

  source = mapMethod(source, 'renderRewardTray(', 'createDiscoverySilhouetteAccent(', (method) => {
    method = localReplace(method, `fontSize: chrome.compact ? '14px' : '7px'`, `fontSize: chrome.compact ? '17px' : '7px'`, 'reward header');
    method = localReplace(method, `fontSize: chrome.compact ? '13px' : '6px'`, `fontSize: chrome.compact ? '16px' : '6px'`, 'reward rarity');
    method = localReplace(method, `fontSize: chrome.compact ? '15px' : '8px'`, `fontSize: chrome.compact ? '18px' : '8px'`, 'reward secret status');
    method = method.replaceAll(`fontSize: chrome.compact ? '16px' : '9px'`, `fontSize: chrome.compact ? '20px' : '9px'`);
    method = method.replaceAll(`fontSize: chrome.compact ? '12px' : '6px'`, `fontSize: chrome.compact ? '18px' : '6px'`);
    return method;
  });

  source = mapMethod(source, 'createRevealInfoBadge(', 'getRevealInfoBadgeX(', (method) => {
    method = localReplace(method, `        fontFamily: DIGITAL_FONT_FAMILY,`, `        fontFamily: this.metrics?.compactChrome ? 'system-ui, sans-serif' : DIGITAL_FONT_FAMILY,`, 'reveal badge font');
    method = localReplace(method, `        fontSize: '8px',`, `        fontSize: this.metrics?.compactChrome ? '18px' : '8px',`, 'reveal badge size');
    method = localReplace(
      method,
      `    const width = Phaser.Math.Clamp(label.width + 56, 176, 308);\n    const height = 38;`,
      `    const width = Phaser.Math.Clamp(label.width + 56, 176, this.metrics?.compactChrome ? 380 : 308);\n    const height = this.metrics?.compactChrome ? 54 : 38;`,
      'reveal badge geometry',
    );
    return method;
  });

  source = mapMethod(source, 'showCollectionMilestone(', 'getResultPanelCopy(', (method) => {
    method = localReplace(
      method,
      `        fontFamily: DIGITAL_FONT_FAMILY,\n        fontSize: '8px',`,
      `        fontFamily: this.metrics.compactChrome ? 'system-ui, sans-serif' : DIGITAL_FONT_FAMILY,\n        fontSize: this.metrics.compactChrome ? '17px' : '8px',`,
      'milestone title',
    );
    method = localReplace(
      method,
      `        fontFamily: DIGITAL_FONT_FAMILY,\n        fontSize: '7px',`,
      `        fontFamily: this.metrics.compactChrome ? 'system-ui, sans-serif' : DIGITAL_FONT_FAMILY,\n        fontSize: this.metrics.compactChrome ? '15px' : '7px',`,
      'milestone progress',
    );
    return method;
  });

  source = mapMethod(source, 'renderResultActionPanel(', 'continueFromResult(', (method) => {
    method = localReplace(method, `fontSize: this.metrics.compactChrome ? '15px' : '10px'`, `fontSize: this.metrics.compactChrome ? '17px' : '10px'`, 'result rarity');
    method = method.replaceAll(`fontSize: this.metrics.compactChrome ? '16px' : '10px'`, `fontSize: this.metrics.compactChrome ? '18px' : '10px'`);
    method = localReplace(
      method,
      `fontSize: this.metrics.compactChrome ? (pending.hiddenPocket ? '18px' : '20px') : pending.hiddenPocket ? '13px' : '15px'`,
      `fontSize: this.metrics.compactChrome ? (pending.hiddenPocket ? '20px' : '22px') : pending.hiddenPocket ? '13px' : '15px'`,
      'result CTA',
    );
    return method;
  });

  fs.writeFileSync(path, source);
}

{
  const path = 'src/game/scenes/GuidanceScene.ts';
  let source = fs.readFileSync(path, 'utf8');

  source = mapMethod(source, 'showNextHint(', 'syncWaitingLabel(', (method) => {
    method = localReplace(
      method,
      `    const width = Math.min(390, Math.max(270, this.metrics.logicalWidth * 0.31));`,
      `    const compact = this.metrics.compactChrome;\n    const width = compact\n      ? Math.min(470, Math.max(360, this.metrics.logicalWidth * 0.36))\n      : Math.min(390, Math.max(270, this.metrics.logicalWidth * 0.31));`,
      'guidance hint width',
    );
    method = localReplace(
      method,
      `      OPENING_FEEL_PRESENTATION.chipsHudHeight +\n      10 +\n      OPENING_FEEL_PRESENTATION.signalHudHeight / 2;`,
      `      (compact ? 92 : OPENING_FEEL_PRESENTATION.chipsHudHeight) +\n      10 +\n      (compact ? 100 : OPENING_FEEL_PRESENTATION.signalHudHeight) / 2;`,
      'guidance hint signal y',
    );
    method = localReplace(
      method,
      `      this.metrics.safeLeft + OPENING_FEEL_PRESENTATION.signalHudWidth + 18,`,
      `      this.metrics.safeLeft + (compact ? 300 : OPENING_FEEL_PRESENTATION.signalHudWidth) + 18,`,
      'guidance hint x',
    );
    method = localReplace(method, `    const container = this.add.container(x, signalY - 30).setAlpha(0);`, `    const panelHeight = compact ? 80 : 60;\n    const container = this.add.container(x, signalY - panelHeight / 2).setAlpha(0);`, 'guidance hint container');
    method = method.replaceAll(`panel.fillRoundedRect(0, 0, width, 60, 14);`, `panel.fillRoundedRect(0, 0, width, panelHeight, 14);`);
    method = method.replaceAll(`panel.strokeRoundedRect(0, 0, width, 60, 14);`, `panel.strokeRoundedRect(0, 0, width, panelHeight, 14);`);
    method = localReplace(method, `.text(16, 30, next.text, {`, `.text(16, panelHeight / 2, next.text, {`, 'guidance hint label y');
    method = localReplace(method, `        fontSize: '14px',`, `        fontSize: compact ? '18px' : '14px',`, 'guidance hint font');
    return method;
  });

  source = mapMethod(source, 'syncWaitingLabel(', 'hideWaitingLabel(', (method) =>
    localReplace(method, `        fontSize: '12px',`, `        fontSize: this.metrics.compactChrome ? '17px' : '12px',`, 'waiting label font'),
  );

  fs.writeFileSync(path, source);
}

console.log('Applied reviewed mobile readability follow-up.');
