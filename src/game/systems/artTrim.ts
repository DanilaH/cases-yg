import Phaser from 'phaser';

import trimManifest from '../data/artTrim.generated.json';
import { getRuntimeCollectibleArt, getRuntimeStaticArt } from '../data/artAssets';
import type { ContentRegistry } from '../data/collectibles';

interface RuntimeArtTrimFrame {
  logicalWidth: number;
  logicalHeight: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

const trimFrames = trimManifest.frames as Readonly<Record<string, RuntimeArtTrimFrame>>;

const assertTrimFrame = (assetPath: string, frame: RuntimeArtTrimFrame): void => {
  const positive =
    frame.logicalWidth > 0 &&
    frame.logicalHeight > 0 &&
    frame.width > 0 &&
    frame.height > 0 &&
    frame.x >= 0 &&
    frame.y >= 0;
  const insideLogicalCanvas =
    frame.x + frame.width <= frame.logicalWidth &&
    frame.y + frame.height <= frame.logicalHeight;
  if (!positive || !insideLogicalCanvas) {
    throw new Error(`Invalid trim metadata for ${assetPath}`);
  }
};

/**
 * Restore the authored logical canvas for physically cropped runtime textures.
 *
 * Phaser's Frame#setTrim keeps `realWidth` / `realHeight` equal to the original
 * source size while rendering only the cropped physical pixels at the recorded
 * destination offset. Apply this before any gameplay Scene constructs Images so
 * existing layout/origin/scale code remains completely trim-unaware.
 */
export const applyRuntimeArtTrim = (scene: Phaser.Scene, registry: ContentRegistry): void => {
  const runtimeArt = [
    ...getRuntimeStaticArt(),
    ...getRuntimeCollectibleArt(registry),
  ];
  const runtimeArtByPath = new Map(runtimeArt.map((art) => [art.assetPath, art]));

  for (const [assetPath, trim] of Object.entries(trimFrames)) {
    assertTrimFrame(assetPath, trim);
    const art = runtimeArtByPath.get(assetPath);
    if (!art) {
      throw new Error(`Trim metadata references non-runtime art: ${assetPath}`);
    }

    const frame = scene.textures.getFrame(art.textureKey);
    if (!frame) {
      throw new Error(`Trimmed runtime texture was not preloaded: ${art.textureKey}`);
    }
    if (frame.cutWidth !== trim.width || frame.cutHeight !== trim.height) {
      throw new Error(
        `Trimmed runtime texture size mismatch for ${art.textureKey}: ` +
        `${frame.cutWidth}x${frame.cutHeight} vs ${trim.width}x${trim.height}`,
      );
    }

    frame.setTrim(
      trim.logicalWidth,
      trim.logicalHeight,
      trim.x,
      trim.y,
      trim.width,
      trim.height,
    );
  }
};

export const getRuntimeArtTrimFrames = (): Readonly<Record<string, RuntimeArtTrimFrame>> => trimFrames;
