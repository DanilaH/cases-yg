# Technical direction

## 1. Stack — LOCKED

Use:

- **Phaser 4.2.1** for the first probe; pin the exact dependency/lockfile rather than floating on `4.x`;
- **Vite**;
- **strict TypeScript**;
- **Yandex Games SDK** behind a thin platform adapter.

Upgrade Phaser only deliberately if a concrete defect or required fix justifies it.

Target Yandex platforms for the first probe:

- Desktop;
- Mobile, landscape orientation.

Do not build TV-specific controls/UX in the first probe.

Do not use React for the game runtime.

Physics is off. Nothing in the first-probe opener needs a physics engine.

---

## 2. Architecture principle

This is a tiny deterministic 2D collectible game. Architecture must remain proportional to that scope.

Prefer:

- plain typed state;
- pure data/config for collectibles/balance;
- small systems with explicit inputs/outputs;
- Phaser tweens/particles for presentation;
- provider adapters only where platform/storage/analytics boundaries justify them.

Do not build framework infrastructure for future systems that are currently parked.

---

## 3. Scene boundaries — LOCKED FOR PROBE

Primary structure:

```text
BootScene
OpeningScene
CollectionScene
```

There is **no separate RevealScene** in the probe.

Reason: the accepted reveal requires visual continuity with the physical pouch for the first ~0.3–0.4 s. Keeping tear, reveal, result and Hidden Pocket as phases inside `OpeningScene` is simpler and avoids a pointless scene transition.

`CollectionScene` contains two internal UI states:

- Shelf;
- Library.

Do not create `LibraryScene` or `ModBenchScene`.

Possible transient overlays/components:

- orientation prompt at shell/platform level;
- tiny mute/speaker control;
- lightweight notification/toast;
- Collection view switch.

### Opening transient phase

A small scene-local phase enum is enough, for example:

```ts
type OpeningPhase =
  | 'idle'
  | 'dragging'
  | 'revealing'
  | 'hidden-pocket'
  | 'result-hold'
  | 'result-ready';
```

Rules:

- `result-hold` blocks dismissal for the minimum ~0.6 s readability window;
- `result-ready` accepts tap/click outside Collection navigation to spawn the next pouch;
- Hidden Pocket, when predetermined, runs before result dismissal becomes available;
- opening result state is presentation state; reward ownership/progression belongs to persistent game state / `pendingReveal`.

---

## 4. Suggested source structure

```text
src/
  game/
    scenes/
      BootScene.ts
      OpeningScene.ts
      CollectionScene.ts

    systems/
      drops.ts
      signal.ts
      collection.ts
      save.ts
      layout.ts
      audio.ts

    data/
      collectibles.ts
      balance.ts

    ui/
      ...

  platform/
    yandex.ts
    storage.ts
    analytics.ts

  i18n/
    en.ts
    ru.ts

  main.ts
```

Do not scaffold ads, Tech Parts, Mod Bench, daily systems or package economy code in the probe.

---

## 5. Persistent game state — LOCKED DIRECTION

Duplicates are not retained as inventory stacks in the probe. Store discovery and progression state directly.

Minimum shape:

```ts
interface SaveState {
  version: number;
  discoveredStandard: StandardCollectibleId[];
  discoveredSecrets: SecretCollectibleId[];
  signal: number;
  totalOpens: number;
  pendingReveal: PendingReveal | null;
  muted: boolean;
  stats: {
    duplicates: number;
    hiddenPockets: number;
  };
}
```

Notes:

- `signal === 100` is enough to derive SIGNAL LOCK;
- onboarding protection derives from `totalOpens < 3`;
- Shelf best-owned state derives from discovered collectible data;
- no `techParts`, currency, energy, package inventory or Mod Bench state;
- persist mute preference because audio is otherwise SFX-only and trivial to restore.

Version the save from day one.

---

# 6. Transactional reveal / anti-reroll — LOCKED

A single opening transaction must predetermine everything that refresh/restart must not reroll.

Before the reveal animation begins:

1. determine the standard result, applying onboarding/SIGNAL LOCK rules;
2. determine whether it is new/duplicate and the resulting Signal delta/reset;
3. if eligible, roll Hidden Pocket;
4. if Hidden Pocket triggers, choose the undiscovered Secret result;
5. persist the full `pendingReveal` transaction;
6. only then run tear/reveal/result presentation;
7. commit discovery/stats/Signal once;
8. clear `pendingReveal`.

Conceptual shape:

```ts
interface PendingReveal {
  id: string;
  standard: {
    collectibleId: StandardCollectibleId;
    isNew: boolean;
  };
  signal: {
    before: number;
    after: number;
    lockConsumed: boolean;
  };
  hiddenPocket: null | {
    secretId: SecretCollectibleId;
  };
}
```

Required properties:

- refresh cannot reroll standard rarity/family;
- refresh cannot reroll Hidden Pocket;
- reward cannot commit twice;
- interrupted reveal can recover deterministically;
- Signal reset/gain cannot double-apply.

If a pending transaction is found on startup, resume/finish the same reward rather than generating a new one.

---

# 7. Drop-system boundaries

Keep drop calculation pure enough to test independently from Phaser.

Inputs should include only what affects the result:

- `totalOpens`;
- discovered standard IDs;
- discovered Secret IDs;
- current Signal.

Outputs are a complete `PendingReveal` proposal.

Do not make scenes directly mutate probability tables.

Balance constants live in `data/balance.ts`, including:

```ts
STANDARD_ODDS
SIGNAL_GAINS
SIGNAL_LATE_LOCK_ODDS
HIDDEN_POCKET_CHANCE
REVEAL_TIMINGS
RESULT_HOLD_MS
```

This keeps Quick Reveal/balance tuning cheap later.

---

# 8. Save and persistence — LOCKED

For first probe:

- local-first save;
- no required account;
- no backend;
- no cloud-sync requirement.

Do not couple game/save logic directly to `window.localStorage`. Use a tiny injected `StorageAdapter` with the same minimal get/set/remove semantics.

Provider rule:

- in Yandex runtime, initialize storage from **`await ysdk.getStorage()`** and inject that storage object into the save system;
- in ordinary local development outside Yandex, use browser `localStorage` as the fallback provider;
- if the archive wrapper already makes browser storage safe, the adapter still remains useful because game code stays provider-agnostic.

Persistence requirements:

- write pending transaction before presentation;
- commit immediately after reward resolution;
- tolerate refresh/crash between these steps;
- migrate by `version` rather than assuming old saves match current content;
- storage failures must fail visibly in development but must not produce duplicate rewards.

Optional Yandex `Player.setData()` cloud save is post-validation scope and should not be enabled merely because the SDK supports it.

---

# 9. Yandex platform adapter — LOCKED

Do not scatter SDK calls across scenes.

`platform/yandex.ts` owns:

- SDK initialization;
- acquisition of safe storage via `ysdk.getStorage()`;
- access to `ysdk.environment.i18n.lang`;
- `LoadingAPI.ready()` when critical assets are loaded, save recovery is resolved and the game is actually interactive;
- `GameplayAPI.start()` / `stop()` lifecycle boundaries if gameplay markup is used;
- pause/resume events from platform/tab visibility;
- future optional player/cloud integration.

Sound/tweens/input must pause appropriately when gameplay is stopped/minimized.

Ads are not part of the first probe, so do not add an ad adapter until monetization is deliberately reintroduced.

---

# 10. Localization — LOCKED FOR PROBE

Ship a tiny typed string dictionary for:

- **RU**;
- **EN**.

Use `ysdk.environment.i18n.lang` to choose language automatically.

Fallback:

> unsupported language → EN

Do not add a manual language selector in the first probe.

Keep all meaningful UI copy outside image assets. Typical strings include:

- NEW / НОВОЕ;
- DUPLICATE / ДУБЛИКАТ;
- SIGNAL LOCK;
- Collection / Коллекция;
- Shelf / Полка;
- Library / Библиотека;
- Back / Назад;
- Next pouch / Следующий пакет;
- Open more / Открыть ещё;
- Standard Collection / Основная коллекция;
- Secrets / Секреты.

Rarity must not rely on color alone: keep readable rarity labels/material differences.

---

# 11. Audio — LOCKED FOR PROBE

No background music.

Use a small SFX set; exact manifest lives in `ASSET_MANIFEST.md`.

Rules:

- do not attempt autoplay audio before the first user gesture;
- pause/stop audio with Yandex/platform/tab pause;
- expose one small mute/speaker toggle;
- persist mute preference;
- do not build a Settings scene just for audio.

---

# 12. Analytics — LOCKED

Use:

- automatic built-in Yandex Games metrics for platform/product/technical metrics;
- **Yandex Metrica** for custom gameplay events.

Implement one typed `platform/analytics.ts` adapter so game systems emit semantic events without depending directly on the Metrica global.

Minimum custom events and decision thresholds are defined in `PROBE_VALIDATION.md`.

Do not add a custom analytics backend.

---

# 13. Rendering and collectible assets

Collectibles are static transparent 2D/2.5D assets reused across:

- reveal hero;
- Shelf;
- Library thumbnail.

Runtime collectible target:

- transparent **1024×1024 WebP**;
- consistent object framing/margins across rarity variants.

Reveal juice stays runtime-first:

- tweens;
- glow;
- particles;
- ring/outline pulse;
- tiny camera bump for high rarity.

The Mystery Pouch must be implemented as aligned runtime layers rather than one flat texture:

- body;
- detachable tear strip;
- draggable star tab.

Do not create separate 3D/inventory/reveal models for the same item.

See `ART_PRODUCTION.md` and `ASSET_MANIFEST.md`.

---

# 14. Asset loading — LOCKED

Preload/cache all probe-critical assets before `LoadingAPI.ready()`:

- 3 Mystery Pouch runtime layers;
- 8 standard collectibles;
- 2 Secrets;
- Opening background/UI;
- Collection background/UI;
- core reveal particles/sounds.

There are only ten collectible hero assets, so lazy-loading between Opening and Collection is unnecessary complexity.

Opening ↔ Collection navigation must not wait on network/assets.

Target perceived navigation response:

> **~100–200 ms plus, at most, a very short cosmetic fade/slide.**

---

# 15. Responsive layout — LOCKED

Primary orientation: **landscape-only for first probe**.

Do not implement an immutable 1280×720 board and merely `FIT` it.

## Supported composition range

- reference: **16:9**;
- coherent target: approximately **5:4 (1.25)** through **12:5 (2.40)**;
- outside range: keep meaningful composition clamped and fill excess space decoratively.

Modes:

```text
compact   1.25 – 1.50
standard  >1.50 – 1.95
wide      >1.95 – 2.40
```

## Logical coordinates

```text
logicalHeight = 720
logicalWidth = clamp(viewportAspect * 720, 900, 1728)
```

Examples:

- 5:4 → ~900×720;
- 16:9 → 1280×720;
- 12:5 → ~1728×720.

Renderer/canvas follows viewport; layout is recomputed from logical bounds. Never non-uniformly stretch sprites/UI.

## Shared layout metrics

Use one helper/service:

```ts
type LayoutMode = 'compact' | 'standard' | 'wide';

interface LayoutMetrics {
  width: number;
  height: number;
  aspect: number;
  mode: LayoutMode;
  safeLeft: number;
  safeRight: number;
  safeTop: number;
  safeBottom: number;
  centerX: number;
  centerY: number;
}
```

Recompute on resize. Do not scatter bespoke viewport math throughout sprites.

## Opening anchors

```text
Signal      → top-left safe anchor
Sound       → top-right safe anchor
Package     → visual center
Collection  → quiet bottom/edge safe anchor
```

Package remains the hero. In compact mode it may scale down modestly; in wide mode it does not grow indefinitely.

## Safe areas / browser gesture constraints

- honor browser/device safe insets;
- use ~3–5% internal responsive margins with practical clamps;
- effective touch/pointer target floor ~44 CSS px;
- no critical control directly against viewport edge;
- no browser scrolling;
- prevent swipe-to-refresh / overscroll from hijacking the game;
- disable right-click/context-menu behavior inside the game surface when it interferes with play;
- long-press must not trigger browser selection/context UI that blocks the tear gesture.

## Collection adaptation

Shelf remains a two-hero composition in all modes.

Library:

- standard/wide: show a full family row where practical;
- compact: wrap cards/adjust gaps;
- never hide rarity state or change data semantics.

## Portrait

No separate portrait game composition. Use shell/platform orientation guidance rather than maintaining two games.

---

# 16. Store/build constraints

For Yandex archive builds:

- root archive contains `index.html`;
- avoid spaces/Cyrillic in runtime filenames/paths;
- keep build comfortably below platform archive limits;
- call game-ready only after all critical probe assets are ready;
- test resize across Yandex moderation reference resolutions before submission;
- test representative browser zoom in the **80–125%** range;
- select Desktop + Mobile and landscape orientation in the draft;
- keep game fully playable without login.

Store media/specification details are tracked in `YANDEX_SUBMISSION_CHECKLIST.md` and `ASSET_MANIFEST.md`.

---

# 17. Engineering guardrails

Do not introduce by default:

- React;
- Redux/Zustand-style store;
- ECS;
- physics;
- backend/websockets;
- real-time 3D;
- custom asset-pipeline server;
- ads before post-validation monetization pass;
- Tech Parts / Mod Bench;
- package economy;
- manual language-selection UI;
- premature CI/test infrastructure unrelated to shipping the probe.

Small unit tests for pure drop/Signal/transaction logic are worthwhile because RNG/recovery correctness matters. Do not expand this into a heavyweight testing program.
