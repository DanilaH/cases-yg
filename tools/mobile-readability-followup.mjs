import fs from 'node:fs';

const path = 'src/game/scenes/OpeningScene.ts';
let source = fs.readFileSync(path, 'utf8');

const replaceOnce = (before, after, label) => {
  const index = source.indexOf(before);
  if (index < 0) throw new Error(`Missing target: ${label}`);
  if (source.indexOf(before, index + before.length) >= 0) throw new Error(`Non-unique target: ${label}`);
  source = source.slice(0, index) + after + source.slice(index + before.length);
};

replaceOnce(
  `      rewardTrayWidth: compact ? 360 : OPENING_FEEL_PRESENTATION.rewardTrayWidth,`,
  `      rewardTrayWidth: compact ? 420 : OPENING_FEEL_PRESENTATION.rewardTrayWidth,`,
  'reward tray width',
);
replaceOnce(
  `    const width = OPENING_FEEL_PRESENTATION.chipsHudWidth;\n    const height = OPENING_FEEL_PRESENTATION.chipsHudHeight;\n    const debitX = this.metrics.safeLeft + width - 14;`,
  `    const chrome = this.getChromeSizing();\n    const width = chrome.chipsHudWidth;\n    const height = chrome.chipsHudHeight;\n    const debitX = this.metrics.safeLeft + width - 14;`,
  'charged spend HUD geometry',
);
replaceOnce(
  `        fontSize: '10px',\n      })\n      .setOrigin(1, 0.5)`,
  `        fontSize: chrome.compact ? '18px' : '10px',\n      })\n      .setOrigin(1, 0.5)`,
  'charged spend debit size',
);

const direct = [
  ["fontSize: chrome.compact ? '18px' : '9px'", "fontSize: chrome.compact ? '20px' : '9px'", 'chips label'],
  ["fontSize: chrome.compact ? '17px' : lockReady ? '8px' : '9px'", "fontSize: chrome.compact ? '19px' : lockReady ? '8px' : '9px'", 'signal label'],
  ["fontSize: chrome.compact ? '17px' : '9px'", "fontSize: chrome.compact ? '19px' : '9px'", 'signal value'],
  ["fontSize: chrome.compact ? '14px' : '7px'", "fontSize: chrome.compact ? '17px' : '7px'", 'overcharge label'],
  ["fontSize: this.metrics.compactChrome ? '16px' : getPlatformRuntime().language === 'ru' ? '9px' : '10px'", "fontSize: this.metrics.compactChrome ? '18px' : getPlatformRuntime().language === 'ru' ? '9px' : '10px'", 'drop title'],
  ["fontSize: this.metrics.compactChrome ? '14px' : '8px'", "fontSize: this.metrics.compactChrome ? '16px' : '8px'", 'drop progress'],
  ["fontSize: this.metrics.compactChrome ? '12px' : '6px'", "fontSize: this.metrics.compactChrome ? '14px' : '6px'", 'next drop'],
  ["fontSize: chrome.compact ? '17px' : '9px'", "fontSize: chrome.compact ? '20px' : '9px'", 'pouch section'],
  ["fontSize: chrome.compact ? '21px' : '15px'", "fontSize: chrome.compact ? '24px' : '15px'", 'pouch marker'],
  ["fontSize: chrome.compact ? '17px' : getPlatformRuntime().language === 'ru' ? '8px' : '9px'", "fontSize: chrome.compact ? '20px' : getPlatformRuntime().language === 'ru' ? '8px' : '9px'", 'pouch title'],
  ["fontSize: chrome.compact ? '15px' : '8px'", "fontSize: chrome.compact ? '18px' : '8px'", 'pouch subtitle'],
  ["fontSize: compact ? '18px' : '7px'", "fontSize: compact ? '21px' : '7px'", 'odds title'],
  ["fontSize: compact ? '14px' : '5px'", "fontSize: compact ? '17px' : '5px'", 'odds headers'],
  ["fontSize: compact ? '16px' : getPlatformRuntime().language === 'ru' ? '6px' : '7px'", "fontSize: compact ? '19px' : getPlatformRuntime().language === 'ru' ? '6px' : '7px'", 'odds row label'],
  ["fontSize: compact ? '16px' : '7px'", "fontSize: compact ? '19px' : '7px'", 'odds percentages'],
  ["fontSize: compact ? '15px' : '6px'", "fontSize: compact ? '18px' : '6px'", 'secret odds'],
  ["fontSize: compact ? '13px' : '5px'", "fontSize: compact ? '15px' : '5px'", 'odds footer'],
  ["fontSize: chrome.compact ? '14px' : '7px'", "fontSize: chrome.compact ? '17px' : '7px'", 'reward header'],
  ["fontSize: chrome.compact ? '13px' : '6px'", "fontSize: chrome.compact ? '16px' : '6px'", 'reward rarity'],
  ["fontSize: chrome.compact ? '15px' : '8px'", "fontSize: chrome.compact ? '18px' : '8px'", 'reward secret status'],
];
for (const [before, after, label] of direct) replaceOnce(before, after, label);

// Several reward-detail styles intentionally share the same compact size. Raise
// them together: on a ~412 CSS-px-high landscape phone 12 logical px is only ~7
// physical CSS px even though it is sharp on a 2x backing store.
source = source.replaceAll("fontSize: chrome.compact ? '16px' : '9px'", "fontSize: chrome.compact ? '20px' : '9px'");
source = source.replaceAll("fontSize: chrome.compact ? '12px' : '6px'", "fontSize: chrome.compact ? '18px' : '6px'");

replaceOnce(
  `      fontSize: this.metrics.compactChrome ? '15px' : '10px',\n      fontStyle: 'bold',`,
  `      fontSize: this.metrics.compactChrome ? '17px' : '10px',\n      fontStyle: 'bold',`,
  'result rarity',
);
source = source.replaceAll("fontSize: this.metrics.compactChrome ? '16px' : '10px'", "fontSize: this.metrics.compactChrome ? '18px' : '10px'");
replaceOnce(
  `      fontSize: this.metrics.compactChrome ? (pending.hiddenPocket ? '18px' : '20px') : pending.hiddenPocket ? '13px' : '15px',`,
  `      fontSize: this.metrics.compactChrome ? (pending.hiddenPocket ? '20px' : '22px') : pending.hiddenPocket ? '13px' : '15px',`,
  'result CTA hint',
);

replaceOnce(
  `        fontFamily: DIGITAL_FONT_FAMILY,\n        fontSize: '8px',\n        fontStyle: 'bold',\n      })\n      .setOrigin(0, 0.5);\n    const width = Phaser.Math.Clamp(label.width + 56, 176, 308);\n    const height = 38;`,
  `        fontFamily: this.metrics?.compactChrome ? 'system-ui, sans-serif' : DIGITAL_FONT_FAMILY,\n        fontSize: this.metrics?.compactChrome ? '18px' : '8px',\n        fontStyle: 'bold',\n      })\n      .setOrigin(0, 0.5);\n    const width = Phaser.Math.Clamp(label.width + 56, 176, this.metrics?.compactChrome ? 380 : 308);\n    const height = this.metrics?.compactChrome ? 54 : 38;`,
  'reveal info badge typography',
);

replaceOnce(
  `        fontSize: '16px',\n      })\n      .setOrigin(0.5)\n      .setAlpha(0)`,
  `        fontSize: metrics.compactChrome ? '20px' : '16px',\n      })\n      .setOrigin(0.5)\n      .setAlpha(0)`,
  'tear hint size',
);

fs.writeFileSync(path, source);
