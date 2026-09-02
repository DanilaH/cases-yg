import { readFileSync, writeFileSync } from 'node:fs';

const openingPath = 'src/game/scenes/OpeningScene.ts';
let text = readFileSync(openingPath, 'utf8');

const replace = (from, to, count = Infinity) => {
  let replaced = 0;
  while (text.includes(from) && replaced < count) {
    text = text.replace(from, to);
    replaced += 1;
  }
  return replaced;
};

const messagesImport = "import { getMessages } from '../../i18n';\n";
while (text.includes(messagesImport + messagesImport)) {
  text = text.replace(messagesImport + messagesImport, messagesImport);
}
if (!text.includes(messagesImport)) {
  replace(
    "import { getPlatformRuntime } from '../../app/runtime';\n",
    "import { getPlatformRuntime } from '../../app/runtime';\n" + messagesImport,
    1,
  );
}

const audioImport = "import { getGameAudio } from '../systems/audio';\n";
while (text.includes(audioImport + audioImport)) {
  text = text.replace(audioImport + audioImport, audioImport);
}
if (!text.includes(audioImport)) {
  replace(
    "import { SLICE_REGISTRY, type StandardRarity } from '../data/collectibles';\n",
    "import { SLICE_REGISTRY, type StandardRarity } from '../data/collectibles';\n" + audioImport,
    1,
  );
}

replace(
  "this.renderFailure('Save data could not be loaded. Reload to retry.');",
  'this.renderFailure(getMessages(platform.language).opening.saveLoadError);',
  1,
);
replace(".text(metrics.centerX, 62, 'Mystery Pocket Tech', {", '.text(metrics.centerX, 62, getMessages(getPlatformRuntime().language).appTitle, {', 1);
replace(".text(metrics.centerX, 610, 'Drag the star to tear →', {", '.text(metrics.centerX, 610, getMessages(getPlatformRuntime().language).opening.tearHint, {', 1);
replace(".text(this.metrics.safeRight, this.metrics.safeBottom - 8, 'Collection →', {", '.text(this.metrics.safeRight, this.metrics.safeBottom - 8, getMessages(getPlatformRuntime().language).opening.collection, {', 1);
replace(
  "this.renderIdle('Could not save the reward. Try the tear again.');",
  'this.renderIdle(getMessages(getPlatformRuntime().language).opening.saveStageError);',
  1,
);
replace(".text(metrics.centerX, 126, 'HIDDEN POCKET!', {", '.text(metrics.centerX, 126, getMessages(getPlatformRuntime().language).opening.hiddenPocket, {');
replace(".text(metrics.centerX + 72, 524, 'SECRET DISCOVERED', {", '.text(metrics.centerX + 72, 524, getMessages(getPlatformRuntime().language).opening.secretDiscovered, {');
replace(".text(this.metrics.centerX, 646, 'Result locked', {", '.text(this.metrics.centerX, 646, getMessages(getPlatformRuntime().language).opening.resultLocked, {', 1);
replace("this.resultPrompt.setText('Tap for next pouch');", 'this.resultPrompt.setText(getMessages(getPlatformRuntime().language).opening.tapNext);', 1);
replace("this.resultPrompt.setText('Tap for next pouch').setAlpha(1);", 'this.resultPrompt.setText(getMessages(getPlatformRuntime().language).opening.tapNext).setAlpha(1);', 1);
replace(
  ".text(this.metrics.centerX, 640, 'Reward shown, but save could not be confirmed. Reload to recover it safely.', {",
  '.text(this.metrics.centerX, 640, getMessages(getPlatformRuntime().language).opening.saveConfirmError, {',
  1,
);

replace(
  "    this.renderSignalHud(root, this.saveState.signal);\n    if (this.saveState.totalOpens > 0) {\n      this.createCollectionButton(root, true);\n    }",
  "    this.renderSignalHud(root, this.saveState.signal);\n    if (this.saveState.totalOpens > 0) {\n      this.createCollectionButton(root, true);\n      this.createMuteButton(root);\n    }",
  1,
);

if (!text.includes('private createMuteButton(')) {
  const marker = '  private setChromeEnabled(enabled: boolean): void {';
  const method = `  private createMuteButton(root: Phaser.GameObjects.Container): void {
    if (!this.metrics) return;
    const audio = getGameAudio();
    const messages = getMessages(getPlatformRuntime().language);
    const button = this.add
      .text(this.metrics.safeRight, this.metrics.safeTop + 8, audio.isMuted() ? \`🔇 \${messages.audio.unmute}\` : \`🔊 \${messages.audio.mute}\`, {
        color: '#d9cfe4',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '14px',
        backgroundColor: '#312746',
        padding: { x: 10, y: 7 },
      })
      .setOrigin(1, 0)
      .setInteractive({ useHandCursor: true });
    button.on('pointerup', () => {
      this.ignoreNextResultTap = true;
      const muted = audio.toggleMuted();
      button.setText(muted ? \`🔇 \${messages.audio.unmute}\` : \`🔊 \${messages.audio.mute}\`);
    });
    root.add(button);
  }

`;
  if (!text.includes(marker)) throw new Error('Mute-button insertion marker missing');
  text = text.replace(marker, method + marker);
}

replace("      this.lastReveal = pending;\n      if (firstInteraction", "      this.lastReveal = pending;\n      getGameAudio().play('tear');\n      if (firstInteraction", 1);
replace("    const color = RARITY_REVEAL_COLORS[pending.standard.rarity];\n", "    const color = RARITY_REVEAL_COLORS[pending.standard.rarity];\n    getGameAudio().play('reveal-pop');\n", 1);
replace(
  "    this.addStandardResultLabels(pending, heroX, 492);\n    return visual.group;",
  "    getGameAudio().play(pending.standard.rarity);\n    if (!pending.standard.isNew) getGameAudio().play('duplicate');\n    if (pending.signal.gain > 0) getGameAudio().play('signal-gain');\n    if (pending.signal.lockReached || pending.signal.lockConsumed) getGameAudio().play('signal-lock');\n    this.addStandardResultLabels(pending, heroX, 492);\n    return visual.group;",
  1,
);
replace('    const rarity = pending.standard.rarity.toUpperCase();', '    const rarity = getMessages(getPlatformRuntime().language).rarity[pending.standard.rarity];', 1);
replace(
  "    let status = pending.standard.isNew ? 'NEW' : 'DUPLICATE';\n    if (pending.signal.lockConsumed) {\n      status += ' · SIGNAL LOCK';",
  "    const messages = getMessages(getPlatformRuntime().language);\n    let status = pending.standard.isNew ? messages.opening.newItem : messages.opening.duplicate;\n    if (pending.signal.lockConsumed) {\n      status += ` · ${messages.opening.signalLock}`;",
  1,
);
replace("      status += ' · LOCKED';", '      status += ` · ${messages.opening.locked}`;', 1);
replace("    await this.wait(320);\n\n    for (const label", "    await this.wait(320);\n    getGameAudio().play('hidden-pocket');\n\n    for (const label", 1);
replace(
  "    const secret = createCollectibleVisual(\n      this,\n      root,\n      pending.hiddenPocket.familyId,",
  "    getGameAudio().play('secret-reveal');\n    const secret = createCollectibleVisual(\n      this,\n      root,\n      pending.hiddenPocket.familyId,",
  1,
);
replace("    this.createCollectionButton(root, true);\n    this.pouch = null;", "    this.createCollectionButton(root, true);\n    this.createMuteButton(root);\n    this.pouch = null;", 1);
replace(
  "      if (!wasCompleteBefore) {\n        analytics.track('standard_collection_complete', { openingNumber: pending.openingNumber });\n      }",
  "      if (!wasCompleteBefore) {\n        analytics.track('standard_collection_complete', { openingNumber: pending.openingNumber });\n        getGameAudio().play('collection-complete');\n      }",
  1,
);

writeFileSync(openingPath, text);

const collectionPath = 'src/game/scenes/CollectionScene.ts';
let collection = readFileSync(collectionPath, 'utf8');
collection = collection.replace(
  "'Collection data could not be loaded.'",
  'getMessages(getPlatformRuntime().language).collection.loadError',
);
collection = collection.replace('  private openTracked = false;\n', '');
collection = collection.replace(
  "    if (!this.openTracked) {\n      this.openTracked = true;\n      getPlatformRuntime().analytics.track('collection_open', {\n        standardCount: this.snapshot.standardCount,\n        standardTotal: this.snapshot.standardTotal,\n        secretCount: this.snapshot.secretCount,\n        secretTotal: this.snapshot.secretTotal,\n      });\n    }",
  "    getPlatformRuntime().analytics.track('collection_open', {\n      standardCount: this.snapshot.standardCount,\n      standardTotal: this.snapshot.standardTotal,\n      secretCount: this.snapshot.secretCount,\n      secretTotal: this.snapshot.secretTotal,\n    });",
);
writeFileSync(collectionPath, collection);
