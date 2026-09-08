import fs from 'node:fs';

const replaceOnce = (path, from, to) => {
  const source = fs.readFileSync(path, 'utf8');
  if (source.includes(to)) return;
  if (!source.includes(from)) throw new Error(`Expected source not found in ${path}: ${from.slice(0, 140)}`);
  fs.writeFileSync(path, source.replace(from, to));
};

replaceOnce('src/game/data/presentation.ts', '  rewardTrayWidth: 210,', '  rewardTrayWidth: 244,');

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
replaceOnce(
  'src/debug/debugScenarios.ts',
  `const baseDebugState = (state: SaveState): SaveState => ({\n  ...state,\n  activeLootPoolId: SLICE_LOOT_POOL_ID,\n  totalOpens: Math.max(3, state.totalOpens),\n  pendingReveal: null,\n});`,
  `const baseDebugState = (state: SaveState): SaveState => ({\n  ...state,\n  activeLootPoolId: SLICE_LOOT_POOL_ID,\n  totalOpens: Math.max(3, state.totalOpens),\n  pendingReveal: null,\n  // Debug scenarios must never inherit an incompatible armed Overcharge state.\n  // Individual lock scenarios explicitly opt back into a valid armed pair below.\n  signal: 0,\n  overchargeHundredths: OVERCHARGE_BASE_HUNDREDTHS,\n});`,
);
replaceOnce(
  'src/debug/debugScenarios.ts',
  `        signal: LITE_V2_BALANCE.signalThreshold,\n        discoveredStandard: unique([`,
  `        signal: LITE_V2_BALANCE.signalThreshold,\n        overchargeHundredths: LITE_V2_BALANCE.overchargeCapHundredths,\n        discoveredStandard: unique([`,
);
replaceOnce(
  'src/debug/debugScenarios.ts',
  `        signal: LITE_V2_BALANCE.signalThreshold,\n        discoveredStandard: unique([...base.discoveredStandard, ...allBasicEligibleIds()]),`,
  `        signal: LITE_V2_BALANCE.signalThreshold,\n        overchargeHundredths: LITE_V2_BALANCE.overchargeCapHundredths,\n        discoveredStandard: unique([...base.discoveredStandard, ...allBasicEligibleIds()]),`,
);

replaceOnce(
  'tests/debug-scenarios.test.ts',
  "import { SaveRepository } from '../src/game/systems/save';",
  "import { SaveRepository, createInitialSaveState } from '../src/game/systems/save';",
);

const testPath = 'tests/debug-scenarios.test.ts';
let testSource = fs.readFileSync(testPath, 'utf8');
const marker = "  it('seeds a collection that is immediately reachable from Opening', async () => {";
if (!testSource.includes('stages %s from an active MAX Overcharge save')) {
  if (!testSource.includes(marker)) throw new Error('debug test insertion marker missing');
  const inserted = `  it.each([\n    'common',\n    'rare',\n    'epic',\n    'epic-phone',\n    'legendary',\n    'duplicate',\n    'signal-lock-reached',\n    'signal-lock-consumed',\n    'signal-lock-waiting',\n    'hidden-pocket',\n  ] as const)('stages %s from an active MAX Overcharge save without invalid payloads', async (scenario) => {\n    const repository = createRepository();\n    await repository.write({\n      ...createInitialSaveState(),\n      chips: 500,\n      signal: LITE_V2_BALANCE.signalThreshold,\n      overchargeHundredths: LITE_V2_BALANCE.overchargeCapHundredths,\n    });\n\n    const pending = await stageDebugReveal(repository, scenario);\n\n    expect(pending).toBeTruthy();\n    expect(await repository.load()).toMatchObject({ pendingReveal: { id: pending.id } });\n  });\n\n`;
  testSource = testSource.replace(marker, inserted + marker);
  fs.writeFileSync(testPath, testSource);
}
