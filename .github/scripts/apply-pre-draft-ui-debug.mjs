import fs from 'node:fs';

const replaceOnce = (path, from, to) => {
  const source = fs.readFileSync(path, 'utf8');
  if (!source.includes(from)) {
    if (source.includes(to)) return;
    throw new Error(`Expected source not found in ${path}: ${from.slice(0, 120)}`);
  }
  fs.writeFileSync(path, source.replace(from, to));
};

replaceOnce(
  'src/game/data/presentation.ts',
  '  rewardTrayWidth: 210,',
  '  rewardTrayWidth: 244,',
);

replaceOnce(
  'src/game/systems/rewardLayout.ts',
  `  let side: RewardTrayPlacement['side'];\n  if (leftClearance >= 0) {\n    side = 'left';\n  } else if (rightClearance >= 0) {\n    side = 'right';\n  } else {\n    side = rightClearance > leftClearance ? 'right' : 'left';\n  }`,
  `  let side: RewardTrayPlacement['side'];\n  // The persistent pouch/gameplay rail owns the left side. Prefer the free right\n  // reward slot whenever it fits; only fall back left when right is genuinely blocked.\n  if (rightClearance >= 0) {\n    side = 'right';\n  } else if (leftClearance >= 0) {\n    side = 'left';\n  } else {\n    side = rightClearance > leftClearance ? 'right' : 'left';\n  }`,
);

replaceOnce(
  'tests/reward-layout.test.ts',
  "        expect(placement.side).toBe(width >= 1280 ? 'left' : 'right');",
  "        expect(placement.side).toBe('right');",
);

replaceOnce(
  'src/game/scenes/OpeningScene.ts',
  "        fontSize: getPlatformRuntime().language === 'ru' ? '4.5px' : '5px',",
  "        fontSize: '6px',",
);
replaceOnce(
  'src/game/scenes/OpeningScene.ts',
  "        fontSize: getPlatformRuntime().language === 'ru' ? '5px' : '6px',",
  "        fontSize: '6px',",
);

replaceOnce(
  'src/debug/debugScenarios.ts',
  "import { LITE_V2_BALANCE, type PouchType } from '../game/data/balance';",
  "import { LITE_V2_BALANCE, OVERCHARGE_BASE_HUNDREDTHS, type PouchType } from '../game/data/balance';",
);

const debugPath = 'src/debug/debugScenarios.ts';
let debugSource = fs.readFileSync(debugPath, 'utf8');
const resetSignalPairs = [
  ["        signal: 0,\n        discoveredStandard: without(base.discoveredStandard, [phoneItemId('epic')]),", "        signal: 0,\n        overchargeHundredths: OVERCHARGE_BASE_HUNDREDTHS,\n        discoveredStandard: without(base.discoveredStandard, [phoneItemId('epic')]),"],
  ["        signal: 0,\n        discoveredStandard: without(base.discoveredStandard, [cameraItemId('legendary')]),", "        signal: 0,\n        overchargeHundredths: OVERCHARGE_BASE_HUNDREDTHS,\n        discoveredStandard: without(base.discoveredStandard, [cameraItemId('legendary')]),"],
  ["        signal: 0,\n        discoveredStandard: without(base.discoveredStandard, [cameraItemId(rarity)]),", "        signal: 0,\n        overchargeHundredths: OVERCHARGE_BASE_HUNDREDTHS,\n        discoveredStandard: without(base.discoveredStandard, [cameraItemId(rarity)]),"],
  ["        signal: 0,\n        discoveredStandard: unique([...base.discoveredStandard, cameraItemId('common')]),", "        signal: 0,\n        overchargeHundredths: OVERCHARGE_BASE_HUNDREDTHS,\n        discoveredStandard: unique([...base.discoveredStandard, cameraItemId('common')]),"],
  ["        signal: LITE_V2_BALANCE.signalThreshold - 1,\n        discoveredStandard: unique([...base.discoveredStandard, cameraItemId('common')]),", "        signal: LITE_V2_BALANCE.signalThreshold - 1,\n        overchargeHundredths: OVERCHARGE_BASE_HUNDREDTHS,\n        discoveredStandard: unique([...base.discoveredStandard, cameraItemId('common')]),"],
  ["        signal: 0,\n        discoveredSecrets: [],", "        signal: 0,\n        overchargeHundredths: OVERCHARGE_BASE_HUNDREDTHS,\n        discoveredSecrets: [],"],
];
for (const [from, to] of resetSignalPairs) {
  if (debugSource.includes(from)) debugSource = debugSource.replace(from, to);
  else if (!debugSource.includes(to)) throw new Error(`debug reset pattern missing: ${from}`);
}

const consumedFrom = "        signal: LITE_V2_BALANCE.signalThreshold,\n        discoveredStandard: unique([";
const consumedTo = "        signal: LITE_V2_BALANCE.signalThreshold,\n        overchargeHundredths: LITE_V2_BALANCE.overchargeCapHundredths,\n        discoveredStandard: unique([";
if (debugSource.includes(consumedFrom)) debugSource = debugSource.replace(consumedFrom, consumedTo);
else if (!debugSource.includes(consumedTo)) throw new Error('signal-lock-consumed pattern missing');

const waitingFrom = "        signal: LITE_V2_BALANCE.signalThreshold,\n        discoveredStandard: unique([...base.discoveredStandard, ...allBasicEligibleIds()]),";
const waitingTo = "        signal: LITE_V2_BALANCE.signalThreshold,\n        overchargeHundredths: LITE_V2_BALANCE.overchargeCapHundredths,\n        discoveredStandard: unique([...base.discoveredStandard, ...allBasicEligibleIds()]),";
if (debugSource.includes(waitingFrom)) debugSource = debugSource.replace(waitingFrom, waitingTo);
else if (!debugSource.includes(waitingTo)) throw new Error('signal-lock-waiting pattern missing');
fs.writeFileSync(debugPath, debugSource);

replaceOnce(
  'tests/debug-scenarios.test.ts',
  "import { SaveRepository } from '../src/game/systems/save';",
  "import { SaveRepository, createInitialSaveState } from '../src/game/systems/save';",
);

const testPath = 'tests/debug-scenarios.test.ts';
let testSource = fs.readFileSync(testPath, 'utf8');
const marker = "  it('seeds a collection that is immediately reachable from Opening', async () => {";
const inserted = `  it.each([\n    'common',\n    'rare',\n    'epic',\n    'epic-phone',\n    'legendary',\n    'duplicate',\n    'signal-lock-reached',\n    'signal-lock-consumed',\n    'signal-lock-waiting',\n    'hidden-pocket',\n  ] as const)('stages %s from an active MAX Overcharge save without invalid payloads', async (scenario) => {\n    const repository = createRepository();\n    await repository.write({\n      ...createInitialSaveState(),\n      chips: 500,\n      signal: LITE_V2_BALANCE.signalThreshold,\n      overchargeHundredths: LITE_V2_BALANCE.overchargeCapHundredths,\n    });\n\n    const pending = await stageDebugReveal(repository, scenario);\n\n    expect(pending).toBeTruthy();\n    expect(await repository.load()).toMatchObject({ pendingReveal: { id: pending.id } });\n  });\n\n`;
if (testSource.includes(marker) && !testSource.includes('stages %s from an active MAX Overcharge save')) {
  testSource = testSource.replace(marker, inserted + marker);
}
fs.writeFileSync(testPath, testSource);
