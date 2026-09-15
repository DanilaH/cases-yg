import fs from 'node:fs/promises';

const mainPath = 'src/main.ts';
let source = await fs.readFile(mainPath, 'utf8');

const replaceOnce = (input, needle, replacement, label) => {
  if (!input.includes(needle)) throw new Error(`Missing ${label} needle`);
  const next = input.replace(needle, replacement);
  if (next === input) throw new Error(`Failed to replace ${label}`);
  return next;
};

source = replaceOnce(
  source,
  "import { setPlatformRuntime } from './app/runtime';\n",
  "import { setPlatformRuntime } from './app/runtime';\nimport { detectPreferredRuntimeArtFormat, setRuntimeArtFormat } from './app/runtimeArtFormat';\n",
  'runtime art format import',
);

source = replaceOnce(
  source,
  "const startupPreload = new StartupPreloadController(createStartupPreloadDomView());\nstartupPreload.begin();\n",
  "const startupPreload = new StartupPreloadController(createStartupPreloadDomView());\nstartupPreload.begin();\nconst runtimeArtFormatReady = detectPreferredRuntimeArtFormat();\n",
  'runtime art format probe start',
);

source = replaceOnce(
  source,
  "  const settings = await loadSettingsSafe(platform.storage);\n  await Promise.all([audio.preloadSamples(getRuntimeSfxAssets()), preloadAccentFont()]);\n  audio.setMuted(settings.muted);\n",
  "  const settings = await loadSettingsSafe(platform.storage);\n  const [runtimeArtFormat] = await Promise.all([\n    runtimeArtFormatReady,\n    audio.preloadSamples(getRuntimeSfxAssets()),\n    preloadAccentFont(),\n  ]);\n  setRuntimeArtFormat(runtimeArtFormat);\n  audio.setMuted(settings.muted);\n",
  'runtime art format await',
);

await fs.writeFile(mainPath, source);
console.log('Applied runtime AVIF rollout patch to src/main.ts');
