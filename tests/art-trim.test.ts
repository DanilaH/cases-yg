import { readFileSync } from 'node:fs';

import sharp from 'sharp';
import { describe, expect, it } from 'vitest';

import trimManifest from '../src/game/data/artTrim.generated.json';
import { getRuntimeCollectibleArt, getRuntimeStaticArt } from '../src/game/data/artAssets';
import { GAME_REGISTRY } from '../src/game/data/collectibles';

interface TrimFrame {
  logicalWidth: number;
  logicalHeight: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

const frames = trimManifest.frames as Readonly<Record<string, TrimFrame>>;
const runtimeArt = [
  ...getRuntimeStaticArt(),
  ...getRuntimeCollectibleArt(GAME_REGISTRY),
];
const runtimePaths = new Set(runtimeArt.map(({ assetPath }) => assetPath));

describe('tight runtime art trim', () => {
  it('contains only valid reviewed runtime assets and excludes tear/background art', () => {
    expect(Object.keys(frames)).toHaveLength(98);

    for (const [assetPath, frame] of Object.entries(frames)) {
      expect(runtimePaths.has(assetPath), assetPath).toBe(true);
      expect(assetPath).not.toContain('tear-strip');
      expect(assetPath).not.toContain('opening-bg');
      expect(assetPath).not.toContain('collection-bg');
      expect(assetPath).not.toContain('collection-foreground');

      expect(frame.logicalWidth).toBeGreaterThan(0);
      expect(frame.logicalHeight).toBeGreaterThan(0);
      expect(frame.x).toBeGreaterThanOrEqual(0);
      expect(frame.y).toBeGreaterThanOrEqual(0);
      expect(frame.width).toBeGreaterThan(0);
      expect(frame.height).toBeGreaterThan(0);
      expect(frame.x + frame.width).toBeLessThanOrEqual(frame.logicalWidth);
      expect(frame.y + frame.height).toBeLessThanOrEqual(frame.logicalHeight);
    }
  });

  it('matches physical WebP dimensions to generated trim metadata', async () => {
    for (const [assetPath, frame] of Object.entries(frames)) {
      const metadata = await sharp(`public/${assetPath}`).metadata();
      expect(metadata.width, assetPath).toBe(frame.width);
      expect(metadata.height, assetPath).toBe(frame.height);
    }
  });

  it('applies trim metadata before Boot hands off to a gameplay scene', () => {
    const source = readFileSync('src/game/scenes/BootScene.ts', 'utf8');
    const applyIndex = source.indexOf('applyRuntimeArtTrim(this, GAME_REGISTRY)');
    const routeIndex = source.indexOf('void this.routeInitialScene()');

    expect(applyIndex).toBeGreaterThanOrEqual(0);
    expect(routeIndex).toBeGreaterThan(applyIndex);
  });

  it('keeps presentation scenes unaware of physical trim offsets', () => {
    for (const path of [
      'src/game/scenes/OpeningScene.ts',
      'src/game/scenes/CollectionScene.ts',
      'src/game/systems/openingVisuals.ts',
    ]) {
      const source = readFileSync(path, 'utf8');
      expect(source).not.toContain('artTrim.generated');
      expect(source).not.toContain('spriteSourceSize');
      expect(source).not.toContain('setTrim(');
    }
  });
});
