import fs from 'node:fs';

const replaceOnce = (source, before, after, label) => {
  const first = source.indexOf(before);
  if (first === -1) throw new Error(`Missing ${label}`);
  if (source.indexOf(before, first + before.length) !== -1) {
    throw new Error(`Expected one ${label}`);
  }
  return source.slice(0, first) + after + source.slice(first + before.length);
};

const collectiblesPath = 'src/game/data/collectibles.ts';
let collectibles = fs.readFileSync(collectiblesPath, 'utf8');

collectibles = replaceOnce(
  collectibles,
  "export type LootPoolId = string;\n",
  "export type LootPoolId = string;\n\n// Result headings share one row with the rarity badge. Keep authored display\n// names concise so every locale starts from a safe, readable baseline; the UI\n// still performs pixel-width fitting as a second line of defense.\nexport const MAX_FAMILY_DISPLAY_NAME_LENGTH = 16;\n",
  'display-name length constant anchor',
);

collectibles = replaceOnce(
  collectibles,
  "    if (!family.dropId.trim()) {\n      throw new Error(`Gadget family ${family.id} requires a non-empty dropId`);\n    }\n",
  "    if (!family.dropId.trim()) {\n      throw new Error(`Gadget family ${family.id} requires a non-empty dropId`);\n    }\n    for (const language of ['en', 'ru'] as const) {\n      const displayName = family.name[language].trim();\n      const displayLength = Array.from(displayName).length;\n      if (!displayName || displayLength > MAX_FAMILY_DISPLAY_NAME_LENGTH) {\n        throw new Error(\n          `Gadget family ${family.id} ${language} name must be 1-${MAX_FAMILY_DISPLAY_NAME_LENGTH} characters`,\n        );\n      }\n    }\n",
  'family display-name validation anchor',
);

const nameReplacements = new Map([
  [
    "family('pda', 'pocket-office', { en: 'PDA / Pocket Organizer', ru: 'КПК' }, 'pda-secret-flip'),",
    "family('pda', 'pocket-office', { en: 'PDA', ru: 'КПК' }, 'pda-secret-flip'),",
  ],
  [
    "family('pager', 'pocket-office', { en: 'Pager / Pocket Communicator', ru: 'Пейджер' }, 'pager-secret-flip'),",
    "family('pager', 'pocket-office', { en: 'Pager', ru: 'Пейджер' }, 'pager-secret-flip'),",
  ],
  [
    "family('portable-disc-player', 'pocket-audio', { en: 'Portable Disc Player', ru: 'Портативный дисковый плеер' }, 'portable-disc-player-secret-remote'),",
    "family('portable-disc-player', 'pocket-audio', { en: 'Disc Player', ru: 'Дисковый плеер' }, 'portable-disc-player-secret-remote'),",
  ],
  [
    "family('handheld-console', 'game-zone', { en: 'Handheld Console', ru: 'Портативная консоль' }, 'handheld-console-secret-phone'),",
    "family('handheld-console', 'game-zone', { en: 'Handheld Console', ru: 'Портативка' }, 'handheld-console-secret-phone'),",
  ],
  [
    "family('crt-tv', 'analog-nights', { en: 'Pocket CRT TV', ru: 'Карманный ЭЛТ-телевизор' }, 'crt-tv-secret-communicator'),",
    "family('crt-tv', 'analog-nights', { en: 'Pocket CRT TV', ru: 'ЭЛТ-телевизор' }, 'crt-tv-secret-communicator'),",
  ],
]);

for (const [before, after] of nameReplacements) {
  collectibles = replaceOnce(collectibles, before, after, `collectible name: ${before}`);
}

fs.writeFileSync(collectiblesPath, collectibles);

const openingPath = 'src/game/scenes/OpeningScene.ts';
let opening = fs.readFileSync(openingPath, 'utf8');
const headingPattern = /  private positionResultHeading\([\s\S]*?\n  private positionResultStatus\(/;
const headingMatches = opening.match(new RegExp(headingPattern.source, 'g')) ?? [];
if (headingMatches.length !== 1) {
  throw new Error(`Expected one positionResultHeading block, found ${headingMatches.length}`);
}

const headingMethod = `  private positionResultHeading(\n    title: Phaser.GameObjects.Text,\n    rarity: Phaser.GameObjects.Text,\n  ): void {\n    const headingGap = 12;\n    const diamondTextOffset = 11;\n    const headingSidePadding = 24;\n    const titleMaxFontSize = 21;\n    const titleMinFontSize = 17;\n    const logicalWidth = this.metrics?.logicalWidth ?? RESULT_PRESENTATION.panelMaxWidth + 120;\n    const panelWidth = Math.max(\n      RESULT_PRESENTATION.panelMinWidth,\n      Math.min(RESULT_PRESENTATION.panelMaxWidth, logicalWidth - 120),\n    );\n    const availableWidth = Math.max(1, panelWidth - headingSidePadding * 2);\n\n    // Rarity badges keep a stable visual size. If a localized item name plus the\n    // badge would overflow the result card, fit only the title by measured pixel\n    // width instead of relying on character count or wrapping the heading.\n    title.setFontSize(titleMaxFontSize);\n    const badgeContentWidth = diamondTextOffset + rarity.width;\n    const maxTitleWidth = Math.max(1, availableWidth - headingGap - badgeContentWidth);\n    if (title.width > maxTitleWidth) {\n      const fittedFontSize = Math.max(\n        titleMinFontSize,\n        Math.floor(titleMaxFontSize * (maxTitleWidth / Math.max(1, title.width))),\n      );\n      title.setFontSize(fittedFontSize);\n    }\n\n    const totalWidth = title.width + headingGap + badgeContentWidth;\n    const startX = -totalWidth / 2;\n    const headingY = RESULT_PRESENTATION.headingY;\n    title.setOrigin(0, 0.5).setPosition(startX, headingY);\n\n    const badgeLeft = startX + title.width + headingGap;\n    const diamond = rarity.getData('diamond') as Phaser.GameObjects.Rectangle | undefined;\n    if (diamond) diamond.setPosition(badgeLeft + 3.5, headingY);\n    rarity.setOrigin(0, 0.5).setPosition(badgeLeft + diamondTextOffset, headingY);\n\n    const capsule = rarity.getData('capsule') as Phaser.GameObjects.Graphics | undefined;\n    if (capsule) {\n      const capsuleColor = Number(rarity.getData('capsuleColor') ?? 0xf0ddff);\n      const contentHeight = Math.max(rarity.height, 7);\n      const capsuleLeft = badgeLeft - 7;\n      const capsuleTop = headingY - contentHeight / 2 - 4;\n      const capsuleWidth = badgeContentWidth + 14;\n      const capsuleHeight = contentHeight + 8;\n      capsule.clear();\n      capsule.fillStyle(capsuleColor, 0.1);\n      capsule.fillRoundedRect(capsuleLeft, capsuleTop, capsuleWidth, capsuleHeight, 9);\n      capsule.lineStyle(1.5, capsuleColor, 0.5);\n      capsule.strokeRoundedRect(capsuleLeft, capsuleTop, capsuleWidth, capsuleHeight, 9);\n    }\n  }\n\n  private positionResultStatus(`;

opening = opening.replace(headingPattern, headingMethod);
fs.writeFileSync(openingPath, opening);

console.log('Applied concise collectible names + pixel-width result heading fit.');
