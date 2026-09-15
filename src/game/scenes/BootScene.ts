import Phaser from 'phaser';

import { getPlatformRuntime } from '../../app/runtime';
import { markStartupPhase } from '../../app/startupPerformance';
import { getRuntimeCollectibleArt, getRuntimeStaticArt } from '../data/artAssets';
import { GAME_REGISTRY } from '../data/collectibles';
import {
  RUNTIME_ART_BUNDLES,
  RUNTIME_ART_BUNDLE_TEXTURE_COUNT,
} from '../data/runtimeAssetBundles.generated';
import { applyRuntimeArtTrim } from '../systems/artTrim';
import { shouldRunPrimaryOnboarding } from '../systems/onboarding';
import { parseRuntimeAssetBundle } from '../systems/runtimeAssetBundle';
import { SaveRepository, type SaveState } from '../systems/save';

type InitialSaveResult =
  | { ok: true; state: SaveState }
  | { ok: false; error: unknown };

export class BootScene extends Phaser.Scene {
  private initialSaveResult: Promise<InitialSaveResult> | null = null;
  private bundleFailure: Error | null = null;
  private readonly expectedRuntimeArt = new Map<string, string>();
  private readonly bundledTextureKeys = new Set<string>();
  private readonly bundleObjectUrls: string[] = [];

  public constructor() {
    super('BootScene');
  }

  public preload(): void {
    const platform = getPlatformRuntime();

    // Save reconciliation and the complete image preload are independent startup
    // work. Start the save read before queueing art so Yandex Player.getData() can
    // overlap image download/decode instead of forming a second serial wall after
    // Phaser's loader completes. Capture rejection immediately: waiting until
    // create() to attach a handler could otherwise surface an unhandled rejection
    // during a long image preload.
    this.initialSaveResult = new SaveRepository(platform.storage).load().then<InitialSaveResult, InitialSaveResult>(
      (state) => {
        markStartupPhase('bootSaveSettled');
        return { ok: true, state };
      },
      (error: unknown) => {
        markStartupPhase('bootSaveSettled');
        return { ok: false, error };
      },
    );

    const reviewedArt = [
      ...getRuntimeStaticArt(),
      ...getRuntimeCollectibleArt(GAME_REGISTRY),
    ];
    for (const art of reviewedArt) {
      if (this.expectedRuntimeArt.has(art.textureKey)) {
        throw new Error(`Duplicate reviewed runtime texture key: ${art.textureKey}`);
      }
      this.expectedRuntimeArt.set(art.textureKey, art.assetPath);
    }
    if (this.expectedRuntimeArt.size !== RUNTIME_ART_BUNDLE_TEXTURE_COUNT) {
      throw new Error(
        `Runtime bundle manifest is stale: ${RUNTIME_ART_BUNDLE_TEXTURE_COUNT} packed textures vs ` +
        `${this.expectedRuntimeArt.size} reviewed textures`,
      );
    }

    const bundleKeys = new Set(RUNTIME_ART_BUNDLES.map((bundle) => bundle.key));
    const onFileComplete = (key: string, type: string, data: unknown): void => {
      if (type !== 'binary' || !bundleKeys.has(key)) return;
      if (!(data instanceof ArrayBuffer)) {
        this.bundleFailure ??= new Error(`Runtime asset bundle did not load as ArrayBuffer: ${key}`);
        return;
      }

      try {
        const entries = parseRuntimeAssetBundle(data);
        for (const entry of entries) {
          const expectedPath = this.expectedRuntimeArt.get(entry.textureKey);
          if (expectedPath === undefined) {
            throw new Error(`Runtime bundle contains an unreviewed texture: ${entry.textureKey}`);
          }
          if (expectedPath !== entry.assetPath) {
            throw new Error(
              `Runtime bundle path mismatch for ${entry.textureKey}: ${entry.assetPath} vs ${expectedPath}`,
            );
          }
          if (this.bundledTextureKeys.has(entry.textureKey)) {
            throw new Error(`Runtime texture is duplicated across bundles: ${entry.textureKey}`);
          }
          this.bundledTextureKeys.add(entry.textureKey);

          // The pack is transport-only. Feed the exact embedded WebP bytes back
          // into Phaser's active startup Loader so the final Texture Manager state
          // is identical to individual network image files and remains fully ready
          // before Boot.create() / Game Ready.
          const ownedBytes = entry.bytes.slice();
          const objectUrl = URL.createObjectURL(new Blob([ownedBytes], { type: 'image/webp' }));
          this.bundleObjectUrls.push(objectUrl);
          this.load.image(entry.textureKey, objectUrl);
        }
      } catch (error: unknown) {
        this.bundleFailure ??= error instanceof Error ? error : new Error(String(error));
      } finally {
        // Blob construction owns the image bytes needed by the dynamically queued
        // ImageFiles, so retain neither the transport ArrayBuffer nor its cache key
        // for the playable session.
        this.cache.binary.remove(key);
      }
    };

    this.load.on(Phaser.Loader.Events.FILE_COMPLETE, onFileComplete);
    this.load.once(Phaser.Loader.Events.COMPLETE, () => {
      this.load.off(Phaser.Loader.Events.FILE_COMPLETE, onFileComplete);
      if (this.bundledTextureKeys.size !== this.expectedRuntimeArt.size) {
        this.bundleFailure ??= new Error(
          `Runtime bundle coverage incomplete: ${this.bundledTextureKeys.size}/${this.expectedRuntimeArt.size}`,
        );
      }
      for (const objectUrl of this.bundleObjectUrls) URL.revokeObjectURL(objectUrl);
      this.bundleObjectUrls.length = 0;
    });

    // Product contract: once Game Ready is emitted there are no in-game image
    // loader states. Six balanced transport requests are expanded back into all
    // reviewed individual textures inside this same startup Loader transaction.
    for (const bundle of RUNTIME_ART_BUNDLES) {
      this.load.binary(bundle.key, bundle.assetPath);
    }
  }

  public create(): void {
    if (this.bundleFailure !== null) throw this.bundleFailure;

    for (const textureKey of this.expectedRuntimeArt.keys()) {
      if (!this.textures.exists(textureKey)) {
        throw new Error(`Missing Phaser-ready startup texture after bundle load: ${textureKey}`);
      }
    }

    // Phaser preload has fully settled before create(). Record the real art wall
    // independently from save reconciliation so startup telemetry can show which
    // side of the overlap actually owns the critical path.
    markStartupPhase('bootArtSettled');

    // Some runtime files are physically cropped to alpha bounds, but all scene
    // composition continues to use their original logical canvases. Apply Phaser
    // frame trim metadata before any presentation Scene can instantiate Images.
    applyRuntimeArtTrim(this, GAME_REGISTRY);
    void this.routeInitialScene();
  }

  private async routeInitialScene(): Promise<void> {
    const result = this.initialSaveResult === null
      ? { ok: false as const, error: new Error('Boot save reconciliation was not started') }
      : await this.initialSaveResult;

    let firstRun = false;
    if (result.ok) {
      firstRun = shouldRunPrimaryOnboarding(result.state);
    } else {
      // OpeningScene already owns the canonical save-load failure UI.
      console.warn('[boot] onboarding route check failed; falling back to Opening', result.error);
    }

    if (!this.sys.isActive()) return;
    if (!this.scene.isActive('GuidanceScene')) this.scene.launch('GuidanceScene');
    this.scene.start(firstRun ? 'FirstRunScene' : 'OpeningScene');
  }
}
