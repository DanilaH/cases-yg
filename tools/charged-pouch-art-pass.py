from pathlib import Path


def read(path: str) -> str:
    return Path(path).read_text()


def write(path: str, text: str) -> None:
    Path(path).write_text(text)


def replace_once(path: str, old: str, new: str) -> None:
    text = read(path)
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{path}: expected one match, found {count}: {old[:140]!r}')
    write(path, text.replace(old, new, 1))


# --- Static art manifest ----------------------------------------------------
path = 'src/game/data/artAssets.ts'
replace_once(
    path,
    "export type StaticArtId =\n  | 'pouch-body'\n  | 'pouch-tear-strip'\n  | 'pouch-star-tab'\n  | 'opening-bg'",
    "export type StaticArtId =\n  | 'pouch-body'\n  | 'pouch-tear-strip'\n  | 'pouch-star-tab'\n  | 'charged-pouch-body'\n  | 'charged-pouch-tear-strip'\n  | 'charged-pouch-star-tab'\n  | 'opening-bg'",
)
replace_once(
    path,
    "  'pouch-star-tab': 'assets/package/pouch-star-tab.webp',\n  'opening-bg': 'assets/backgrounds/opening-bg.webp',",
    "  'pouch-star-tab': 'assets/package/pouch-star-tab.webp',\n  'charged-pouch-body': 'assets/package/charged-pouch-body.webp',\n  'charged-pouch-tear-strip': 'assets/package/charged-pouch-tear-strip-compact.webp',\n  'charged-pouch-star-tab': 'assets/package/charged-pouch-star-tab.webp',\n  'opening-bg': 'assets/backgrounds/opening-bg.webp',",
)
replace_once(
    path,
    "  'pouch-star-tab',\n  'opening-bg',",
    "  'pouch-star-tab',\n  'charged-pouch-body',\n  'charged-pouch-tear-strip',\n  'charged-pouch-star-tab',\n  'opening-bg',",
)
replace_once(
    path,
    "export const staticTextureKey = (id: StaticArtId): string => `${STATIC_TEXTURE_PREFIX}${id}`;\n\nconst toRuntimeCollectibleArt",
    "export const staticTextureKey = (id: StaticArtId): string => `${STATIC_TEXTURE_PREFIX}${id}`;\n\nexport type PouchArtVariant = 'basic' | 'charged';\nexport type PouchArtLayer = 'body' | 'tear-strip' | 'star-tab';\n\nconst POUCH_STATIC_ART_IDS: Readonly<Record<PouchArtVariant, Readonly<Record<PouchArtLayer, StaticArtId>>>> = {\n  basic: {\n    body: 'pouch-body',\n    'tear-strip': 'pouch-tear-strip',\n    'star-tab': 'pouch-star-tab',\n  },\n  charged: {\n    body: 'charged-pouch-body',\n    'tear-strip': 'charged-pouch-tear-strip',\n    'star-tab': 'charged-pouch-star-tab',\n  },\n};\n\nconst BOOT_STATIC_ART_IDS: readonly StaticArtId[] = [\n  'pouch-body',\n  'pouch-tear-strip',\n  'pouch-star-tab',\n  'opening-bg',\n  'collection-bg',\n  'collection-foreground',\n];\n\nexport const pouchStaticArtId = (variant: PouchArtVariant, layer: PouchArtLayer): StaticArtId =>\n  POUCH_STATIC_ART_IDS[variant][layer];\n\nconst toRuntimeCollectibleArt",
)
replace_once(
    path,
    "export const getRuntimeStaticArt = (): readonly RuntimeStaticArt[] =>\n  (Object.keys(STATIC_ART_PATHS) as StaticArtId[])\n    .filter((id) => AVAILABLE_STATIC_ART_IDS.has(id))\n    .map((id) => ({\n      id,\n      textureKey: staticTextureKey(id),\n      assetPath: STATIC_ART_PATHS[id],\n    }));",
    "const toRuntimeStaticArt = (ids: readonly StaticArtId[]): readonly RuntimeStaticArt[] =>\n  ids\n    .filter((id) => AVAILABLE_STATIC_ART_IDS.has(id))\n    .map((id) => ({\n      id,\n      textureKey: staticTextureKey(id),\n      assetPath: STATIC_ART_PATHS[id],\n    }));\n\nexport const getRuntimeStaticArt = (): readonly RuntimeStaticArt[] =>\n  toRuntimeStaticArt(Object.keys(STATIC_ART_PATHS) as StaticArtId[]);\n\nexport const getRuntimeBootStaticArt = (): readonly RuntimeStaticArt[] =>\n  toRuntimeStaticArt(BOOT_STATIC_ART_IDS);\n\nexport const getRuntimePouchArt = (variant: PouchArtVariant): readonly RuntimeStaticArt[] =>\n  toRuntimeStaticArt(Object.values(POUCH_STATIC_ART_IDS[variant]));",
)

# --- Boot keeps Charged assets out of cold start ---------------------------
path = 'src/game/scenes/BootScene.ts'
replace_once(
    path,
    "import { getRuntimeCollectibleArtForLootPool, getRuntimeStaticArt } from '../data/artAssets';",
    "import { getRuntimeBootStaticArt, getRuntimeCollectibleArtForLootPool } from '../data/artAssets';",
)
replace_once(path, "for (const art of getRuntimeStaticArt())", "for (const art of getRuntimeBootStaticArt())")

# --- Generic runtime loader + pouch-specific entrypoint --------------------
path = 'src/game/systems/artLoading.ts'
replace_once(
    path,
    "import { getRuntimeCollectibleArtForLootPool } from '../data/artAssets';",
    "import {\n  getRuntimeCollectibleArtForLootPool,\n  getRuntimePouchArt,\n  type PouchArtVariant,\n  type RuntimeCollectibleArt,\n  type RuntimeStaticArt,\n} from '../data/artAssets';",
)
old = """/**
 * Loads only collectible textures belonging to one Drop and skips textures that
 * already exist in Phaser's global texture manager. A rejected load is safe to
 * recover from: callers can keep using procedural collectible fallbacks and a
 * later visit will retry only the still-missing textures.
 */
export const ensureLootPoolCollectibleArt = async (
  scene: Phaser.Scene,
  registry: ContentRegistry,
  lootPoolId: LootPoolId,
): Promise<void> => {
  if (!scene.sys.isActive()) return;

  const missing = getRuntimeCollectibleArtForLootPool(registry, lootPoolId).filter(
    ({ textureKey }) => !scene.textures.exists(textureKey),
  );
  if (missing.length === 0) return;

  await new Promise<void>((resolve, reject) => {
    const pendingKeys = new Set(missing.map(({ textureKey }) => textureKey));
    const failedKeys = new Set<string>();
    let settled = false;

    const cleanup = (): void => {
      scene.load.off('loaderror', onLoadError);
      scene.load.off(Phaser.Loader.Events.COMPLETE, onComplete);
      scene.events.off(Phaser.Scenes.Events.SHUTDOWN, onShutdown);
    };
    const finish = (error?: Error): void => {
      if (settled) return;
      settled = true;
      cleanup();
      if (error) reject(error);
      else resolve();
    };
    const onLoadError = (file: Phaser.Loader.File): void => {
      const key = String(file.key);
      if (pendingKeys.has(key)) failedKeys.add(key);
    };
    const onComplete = (): void => {
      if (failedKeys.size > 0) {
        finish(new Error(`Failed to load collectible art: ${[...failedKeys].join(', ')}`));
        return;
      }
      finish();
    };
    const onShutdown = (): void => finish();

    scene.load.on('loaderror', onLoadError);
    scene.load.once(Phaser.Loader.Events.COMPLETE, onComplete);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, onShutdown);
    missing.forEach(({ textureKey, assetPath }) => scene.load.image(textureKey, assetPath));
    scene.load.start();
  });
};"""
new = """type RuntimeImageArt = Pick<RuntimeCollectibleArt | RuntimeStaticArt, 'textureKey' | 'assetPath'>;

/**
 * Loads only missing reviewed image textures for the current Scene activation.
 * Shutdown settles the Promise and detaches listeners so stale async work never
 * retains a dead Scene. Failed files stay absent from the texture manager and
 * are therefore eligible for retry on the next visit.
 */
const ensureRuntimeImageArt = async (
  scene: Phaser.Scene,
  art: readonly RuntimeImageArt[],
  failureLabel: string,
): Promise<void> => {
  if (!scene.sys.isActive()) return;

  const missing = art.filter(({ textureKey }) => !scene.textures.exists(textureKey));
  if (missing.length === 0) return;

  await new Promise<void>((resolve, reject) => {
    const pendingKeys = new Set(missing.map(({ textureKey }) => textureKey));
    const failedKeys = new Set<string>();
    let settled = false;

    const cleanup = (): void => {
      scene.load.off('loaderror', onLoadError);
      scene.load.off(Phaser.Loader.Events.COMPLETE, onComplete);
      scene.events.off(Phaser.Scenes.Events.SHUTDOWN, onShutdown);
    };
    const finish = (error?: Error): void => {
      if (settled) return;
      settled = true;
      cleanup();
      if (error) reject(error);
      else resolve();
    };
    const onLoadError = (file: Phaser.Loader.File): void => {
      const key = String(file.key);
      if (pendingKeys.has(key)) failedKeys.add(key);
    };
    const onComplete = (): void => {
      if (failedKeys.size > 0) {
        finish(new Error(`Failed to load ${failureLabel}: ${[...failedKeys].join(', ')}`));
        return;
      }
      finish();
    };
    const onShutdown = (): void => finish();

    scene.load.on('loaderror', onLoadError);
    scene.load.once(Phaser.Loader.Events.COMPLETE, onComplete);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, onShutdown);
    missing.forEach(({ textureKey, assetPath }) => scene.load.image(textureKey, assetPath));
    scene.load.start();
  });
};

export const ensureLootPoolCollectibleArt = (
  scene: Phaser.Scene,
  registry: ContentRegistry,
  lootPoolId: LootPoolId,
): Promise<void> =>
  ensureRuntimeImageArt(scene, getRuntimeCollectibleArtForLootPool(registry, lootPoolId), 'collectible art');

export const ensurePouchArt = (scene: Phaser.Scene, variant: PouchArtVariant): Promise<void> =>
  ensureRuntimeImageArt(scene, getRuntimePouchArt(variant), `${variant} pouch art`);"""
replace_once(path, old, new)

# --- Pouch visual chooses authored package per variant ---------------------
path = 'src/game/ui/openingVisuals.ts'
replace_once(
    path,
    "import { collectibleTextureKey, staticTextureKey } from '../data/artAssets';",
    "import { collectibleTextureKey, pouchStaticArtId, staticTextureKey, type PouchArtVariant } from '../data/artAssets';",
)
replace_once(
    path,
    "  x: number,\n  y: number,\n): PouchVisual => {",
    "  x: number,\n  y: number,\n  variant: PouchArtVariant = 'basic',\n): PouchVisual => {",
)
replace_once(path, "const bodyTexture = staticTextureKey('pouch-body');", "const bodyTexture = staticTextureKey(pouchStaticArtId(variant, 'body'));")
replace_once(path, "const stripTexture = staticTextureKey('pouch-tear-strip');", "const stripTexture = staticTextureKey(pouchStaticArtId(variant, 'tear-strip'));")
replace_once(path, "const tabTexture = staticTextureKey('pouch-star-tab');", "const tabTexture = staticTextureKey(pouchStaticArtId(variant, 'star-tab'));")

# --- Opening: recover/select Charged art lazily and serialize transition ---
path = 'src/game/scenes/OpeningScene.ts'
replace_once(path, "import { ensureLootPoolCollectibleArt } from '../systems/artLoading';", "import { ensureLootPoolCollectibleArt, ensurePouchArt } from '../systems/artLoading';")
replace_once(
    path,
    "  private requestedLootPoolId: GameLootPoolId | null = null;\n  private dropSwitchInFlight = false;",
    "  private requestedLootPoolId: GameLootPoolId | null = null;\n  private dropSwitchInFlight = false;\n  private pouchArtLoadInFlight = false;",
)
replace_once(
    path,
    "    this.chargedReadyPulsePending = false;\n    this.dropSwitchInFlight = false;",
    "    this.chargedReadyPulsePending = false;\n    this.dropSwitchInFlight = false;\n    this.pouchArtLoadInFlight = false;",
)
replace_once(
    path,
    "    const pending = this.saveState.pendingReveal;\n    if (pending) this.selectedPouchType = pending.pouchType;\n    this.renderIdle(idleMessage);",
    "    const pending = this.saveState.pendingReveal;\n    if (pending) {\n      this.selectedPouchType = pending.pouchType;\n      if (pending.pouchType === 'charged') {\n        try {\n          await ensurePouchArt(this, 'charged');\n        } catch (error: unknown) {\n          console.warn('[art] recovered Charged Pouch art failed to load; using fallbacks', error);\n        }\n        if (this.isSceneShutdown()) return;\n      }\n    }\n    this.renderIdle(idleMessage);",
)
replace_once(
    path,
    "    this.pouch = createPouchVisual(this, root, metrics.centerX, POUCH_Y);\n    getGameAudio().primeDragTexture();\n    this.applyChargedPouchTreatment();",
    "    this.pouch = createPouchVisual(this, root, metrics.centerX, POUCH_Y, this.selectedPouchType);\n    getGameAudio().primeDragTexture();",
)
# Drop switch must not overlap a pouch-art transition.
replace_once(
    path,
    "if (this.phase !== 'idle' || this.dropSwitchInFlight || !this.session || !this.saveState) return;",
    "if (this.phase !== 'idle' || this.dropSwitchInFlight || this.pouchArtLoadInFlight || !this.session || !this.saveState) return;",
)
# Selector callbacks intentionally fire-and-forget an async transition.
replace_once(path, "        this.selectPouchType(pouchType, card);", "        void this.selectPouchType(pouchType, card);")
old_select = """  private selectPouchType(pouchType: PouchType, sourceCard?: Phaser.GameObjects.Container): void {
    if (this.phase !== 'idle' || this.dropSwitchInFlight || !this.saveState || this.selectedPouchType === pouchType) return;
    if (!canAffordPouch(this.saveState, pouchType, LITE_V2_BALANCE)) return;
    this.selectedPouchType = pouchType;
    getGameAudio().play('pouch-select');
    if (sourceCard) {
      this.tweens.killTweensOf(sourceCard);
      this.tweens.add({
        targets: sourceCard,
        scale: 1.025,
        duration: OPENING_FEEL_PRESENTATION.uiPressMs,
        yoyo: true,
        ease: 'Sine.Out',
      });
    }
    if (this.pouch) {
      this.tweens.killTweensOf(this.pouch.group);
      this.tweens.add({
        targets: this.pouch.group,
        scale: 0.97,
        alpha: 0.78,
        duration: 90,
        ease: 'Sine.In',
      });
    }
    this.time.delayedCall(95, () => {
      if (this.phase === 'idle') this.renderIdle();
    });
  }"""
new_select = """  private async selectPouchType(pouchType: PouchType, sourceCard?: Phaser.GameObjects.Container): Promise<void> {
    if (
      this.phase !== 'idle' ||
      this.dropSwitchInFlight ||
      this.pouchArtLoadInFlight ||
      !this.saveState ||
      this.selectedPouchType === pouchType
    ) return;
    if (!canAffordPouch(this.saveState, pouchType, LITE_V2_BALANCE)) return;

    this.pouchArtLoadInFlight = true;
    try {
      await ensurePouchArt(this, pouchType);
    } catch (error: unknown) {
      console.warn(`[art] ${pouchType} Pouch art failed to load; using fallbacks`, error);
    }
    if (this.isSceneShutdown()) {
      this.pouchArtLoadInFlight = false;
      return;
    }
    if (this.phase !== 'idle' || !this.saveState || !canAffordPouch(this.saveState, pouchType, LITE_V2_BALANCE)) {
      this.pouchArtLoadInFlight = false;
      return;
    }

    this.selectedPouchType = pouchType;
    getGameAudio().play('pouch-select');
    if (sourceCard?.active) {
      this.tweens.killTweensOf(sourceCard);
      this.tweens.add({
        targets: sourceCard,
        scale: 1.025,
        duration: OPENING_FEEL_PRESENTATION.uiPressMs,
        yoyo: true,
        ease: 'Sine.Out',
      });
    }
    if (this.pouch?.group.active) {
      this.tweens.killTweensOf(this.pouch.group);
      this.tweens.add({
        targets: this.pouch.group,
        scale: 0.97,
        alpha: 0.78,
        duration: 90,
        ease: 'Sine.In',
      });
    }
    this.time.delayedCall(95, () => {
      this.pouchArtLoadInFlight = false;
      if (this.phase === 'idle' && !this.isSceneShutdown()) this.renderIdle();
    });
  }"""
replace_once(path, old_select, new_select)
# Remove old tint treatment entirely: dedicated Charged exports are authored final art.
text = read(path)
start = "  private applyChargedPouchTreatment(): void {\n"
end = "  private getChipsHudTarget(): { x: number; y: number } {\n"
if text.count(start) != 1 or text.count(end) != 1:
    raise SystemExit('OpeningScene.ts: charged tint method boundary mismatch')
prefix, rest = text.split(start, 1)
_, suffix = rest.split(end, 1)
write(path, prefix + end + suffix)
# Navigation and opening remain locked during the 95ms visual hand-off too.
replace_once(path, "        if (this.dropSwitchInFlight) return;", "        if (this.dropSwitchInFlight || this.pouchArtLoadInFlight) return;")
replace_once(
    path,
    "if (this.phase !== 'idle' || this.dropSwitchInFlight || !this.pouch || !this.metrics) return;",
    "if (this.phase !== 'idle' || this.dropSwitchInFlight || this.pouchArtLoadInFlight || !this.pouch || !this.metrics) return;",
)

# --- Manifest tests --------------------------------------------------------
path = 'tests/runtime-assets.test.ts'
replace_once(
    path,
    "  getRuntimeCollectibleArtForLootPool,\n  getRuntimeStaticArt,\n  staticTextureKey,",
    "  getRuntimeBootStaticArt,\n  getRuntimeCollectibleArtForLootPool,\n  getRuntimePouchArt,\n  getRuntimeStaticArt,\n  pouchStaticArtId,\n  staticTextureKey,",
)
insert = """  it('keeps authored Charged Pouch art out of boot preload and maps all three layers', () => {
    replaceSetContents(AVAILABLE_STATIC_ART_IDS, defaultStaticArtIds);

    const bootIds = getRuntimeBootStaticArt().map(({ id }) => id);
    expect(bootIds).toContain('pouch-body');
    expect(bootIds).not.toContain('charged-pouch-body');
    expect(getRuntimePouchArt('charged')).toEqual([
      {
        id: 'charged-pouch-body',
        textureKey: staticTextureKey('charged-pouch-body'),
        assetPath: 'assets/package/charged-pouch-body.webp',
      },
      {
        id: 'charged-pouch-tear-strip',
        textureKey: staticTextureKey('charged-pouch-tear-strip'),
        assetPath: 'assets/package/charged-pouch-tear-strip-compact.webp',
      },
      {
        id: 'charged-pouch-star-tab',
        textureKey: staticTextureKey('charged-pouch-star-tab'),
        assetPath: 'assets/package/charged-pouch-star-tab.webp',
      },
    ]);
    expect(pouchStaticArtId('basic', 'body')).toBe('pouch-body');
    expect(pouchStaticArtId('charged', 'body')).toBe('charged-pouch-body');
  });

"""
marker = "  it('maps reviewed pouch/background layers without scene-specific file knowledge', () => {"
text = read(path)
if text.count(marker) != 1:
    raise SystemExit('runtime-assets.test.ts insertion marker mismatch')
write(path, text.replace(marker, insert + marker, 1))
