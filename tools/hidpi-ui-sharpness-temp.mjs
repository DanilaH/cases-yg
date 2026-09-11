import { readFile, writeFile } from 'node:fs/promises';

const replaceOnce = async (path, from, to) => {
  const source = await readFile(path, 'utf8');
  const first = source.indexOf(from);
  if (first < 0) throw new Error(`Pattern not found in ${path}: ${from.slice(0, 120)}`);
  if (source.indexOf(from, first + from.length) >= 0) throw new Error(`Pattern is not unique in ${path}: ${from.slice(0, 120)}`);
  await writeFile(path, source.slice(0, first) + to + source.slice(first + from.length));
};

await replaceOnce(
  'src/game/systems/layout.ts',
  `export type LayoutMode = 'compact' | 'standard' | 'wide';`,
  `import { resolveRenderPixelRatio } from './renderDensity';\n\nexport type LayoutMode = 'compact' | 'standard' | 'wide';`,
);

await replaceOnce(
  'src/game/systems/layout.ts',
  `export const readSafeAreaInsets = (): SafeAreaInsets => {\n  if (typeof document === 'undefined') return ZERO_INSETS;\n  const styles = window.getComputedStyle(document.documentElement);\n  return {\n    left: readCssPixels(styles, '--safe-area-left'),\n    right: readCssPixels(styles, '--safe-area-right'),\n    top: readCssPixels(styles, '--safe-area-top'),\n    bottom: readCssPixels(styles, '--safe-area-bottom'),\n  };\n};`,
  `export const readSafeAreaInsets = (pixelRatio = 1): SafeAreaInsets => {\n  if (typeof document === 'undefined') return ZERO_INSETS;\n  const styles = window.getComputedStyle(document.documentElement);\n  const ratio = resolveRenderPixelRatio(pixelRatio);\n  return {\n    left: readCssPixels(styles, '--safe-area-left') * ratio,\n    right: readCssPixels(styles, '--safe-area-right') * ratio,\n    top: readCssPixels(styles, '--safe-area-top') * ratio,\n    bottom: readCssPixels(styles, '--safe-area-bottom') * ratio,\n  };\n};`,
);

await replaceOnce(
  'src/main.ts',
  `import { getGameAudio } from './game/systems/audio';\nimport { loadSettingsSafe } from './game/systems/settings';`,
  `import { getGameAudio } from './game/systems/audio';\nimport { getBackingStoreSize } from './game/systems/renderDensity';\nimport { loadSettingsSafe } from './game/systems/settings';`,
);

await replaceOnce(
  'src/main.ts',
  `const ACCENT_FONT_WARMUP_TEXT = 'CHIPS SIGNAL REWARD ЖЙЦУКЕН 0123';`,
  `const ACCENT_FONT_WARMUP_TEXT = 'CHIPS SIGNAL REWARD ЖЙЦУКЕН 0123';\n\nconst readGameCssSize = (): { width: number; height: number } => {\n  const host = document.querySelector<HTMLElement>('#game');\n  const bounds = host?.getBoundingClientRect();\n  return {\n    width: Math.max(1, bounds?.width || window.innerWidth || 1),\n    height: Math.max(1, bounds?.height || window.innerHeight || 1),\n  };\n};`,
);

await replaceOnce(
  'src/main.ts',
  `  game = new Phaser.Game({\n    type: Phaser.AUTO,\n    parent: 'game',\n    backgroundColor: '#171421',\n    scene: [BootScene, OpeningScene, CollectionScene],\n    scale: {\n      mode: Phaser.Scale.RESIZE,\n      autoCenter: Phaser.Scale.CENTER_BOTH,\n    },\n  });`,
  `  const initialCssSize = readGameCssSize();\n  const initialBackingSize = getBackingStoreSize(initialCssSize.width, initialCssSize.height);\n  game = new Phaser.Game({\n    type: Phaser.AUTO,\n    parent: 'game',\n    width: initialBackingSize.width,\n    height: initialBackingSize.height,\n    backgroundColor: '#171421',\n    scene: [BootScene, OpeningScene, CollectionScene],\n    render: {\n      antialias: true,\n      antialiasGL: true,\n      pixelArt: false,\n      roundPixels: false,\n    },\n    // Phaser RESIZE uses CSS pixels for the backing store. Keep CSS sizing in\n    // the page and drive a denser backing canvas ourselves for HiDPI UI.\n    scale: {\n      mode: Phaser.Scale.NONE,\n      autoCenter: Phaser.Scale.NO_CENTER,\n    },\n  });`,
);

await replaceOnce(
  'src/main.ts',
  `  const gate = document.querySelector<HTMLElement>('#orientation-gate');\n  if (gate) gate.textContent = messages.rotateDevice;\n  const updateOrientationGate = (): void => {`,
  `  const syncBackingStore = (): void => {\n    if (!game) return;\n    const cssSize = readGameCssSize();\n    const backingSize = getBackingStoreSize(cssSize.width, cssSize.height);\n    if (game.scale.width === backingSize.width && game.scale.height === backingSize.height) return;\n    game.scale.resize(backingSize.width, backingSize.height);\n  };\n\n  const gate = document.querySelector<HTMLElement>('#orientation-gate');\n  if (gate) gate.textContent = messages.rotateDevice;\n  const updateOrientationGate = (): void => {`,
);

await replaceOnce(
  'src/main.ts',
  `  updateOrientationGate();\n  window.addEventListener('resize', updateOrientationGate);\n  document.querySelector('#game-shell')?.addEventListener('contextmenu', preventContextMenu);`,
  `  const handleViewportChange = (): void => {\n    syncBackingStore();\n    updateOrientationGate();\n  };\n  const resizeObserver = typeof ResizeObserver === 'undefined'\n    ? null\n    : new ResizeObserver(() => syncBackingStore());\n  const gameHost = document.querySelector<HTMLElement>('#game');\n  if (gameHost) resizeObserver?.observe(gameHost);\n\n  updateOrientationGate();\n  syncBackingStore();\n  window.addEventListener('resize', handleViewportChange);\n  document.querySelector('#game-shell')?.addEventListener('contextmenu', preventContextMenu);`,
);

await replaceOnce(
  'src/main.ts',
  `      window.removeEventListener('resize', updateOrientationGate);\n      document.querySelector('#game-shell')?.removeEventListener('contextmenu', preventContextMenu);`,
  `      window.removeEventListener('resize', handleViewportChange);\n      resizeObserver?.disconnect();\n      document.querySelector('#game-shell')?.removeEventListener('contextmenu', preventContextMenu);`,
);

for (const scenePath of ['src/game/scenes/OpeningScene.ts', 'src/game/scenes/CollectionScene.ts']) {
  await replaceOnce(
    scenePath,
    `import { createLayoutMetrics, readSafeAreaInsets, type LayoutMetrics } from '../systems/layout';`,
    `import { createLayoutMetrics, readSafeAreaInsets, type LayoutMetrics } from '../systems/layout';\nimport { getRenderPixelRatio } from '../systems/renderDensity';\nimport { installSceneTextSharpness } from '../systems/uiSharpness';`,
  );
}

await replaceOnce(
  'src/game/scenes/OpeningScene.ts',
  `  public create(): void {\n    // Phaser reuses the Scene instance after Collection -> Opening. Shutdown is`,
  `  public create(): void {\n    installSceneTextSharpness(this);\n    // Phaser reuses the Scene instance after Collection -> Opening. Shutdown is`,
);

await replaceOnce(
  'src/game/scenes/CollectionScene.ts',
  `  public create(): void {\n    const platform = getPlatformRuntime();`,
  `  public create(): void {\n    installSceneTextSharpness(this);\n    const platform = getPlatformRuntime();`,
);

for (const scenePath of ['src/game/scenes/OpeningScene.ts', 'src/game/scenes/CollectionScene.ts']) {
  await replaceOnce(
    scenePath,
    `createLayoutMetrics(this.scale.width, this.scale.height, readSafeAreaInsets())`,
    `createLayoutMetrics(this.scale.width, this.scale.height, readSafeAreaInsets(getRenderPixelRatio()))`,
  );
}

console.log('HiDPI UI sharpness patch applied.');
