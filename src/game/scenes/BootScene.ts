import Phaser from 'phaser';

import { getPlatformRuntime } from '../../app/runtime';
import { markStartupPhase } from '../../app/startupPerformance';
import { getRuntimeCollectibleArt, getRuntimeStaticArt } from '../data/artAssets';
import { GAME_REGISTRY } from '../data/collectibles';
import { applyRuntimeArtTrim } from '../systems/artTrim';
import { shouldRunPrimaryOnboarding } from '../systems/onboarding';
import { SaveRepository, type SaveState } from '../systems/save';

type InitialSaveResult =
  | { ok: true; state: SaveState }
  | { ok: false; error: unknown };

export class BootScene extends Phaser.Scene {
  private initialSaveResult: Promise<InitialSaveResult> | null = null;

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

    const queuedTextureKeys = new Set<string>();
    const queueImage = (textureKey: string, assetPath: string): void => {
      if (queuedTextureKeys.has(textureKey)) return;
      queuedTextureKeys.add(textureKey);
      this.load.image(textureKey, assetPath);
    };

    // Product contract: once Game Ready is emitted there are no in-game image
    // loader states. Every reviewed texture reachable in this session is made
    // Phaser-ready while the single startup loader still owns presentation.
    for (const art of getRuntimeStaticArt()) {
      queueImage(art.textureKey, art.assetPath);
    }
    for (const art of getRuntimeCollectibleArt(GAME_REGISTRY)) {
      queueImage(art.textureKey, art.assetPath);
    }
  }

  public create(): void {
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
