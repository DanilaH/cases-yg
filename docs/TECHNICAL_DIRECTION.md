# Technical direction

## 1. Stack — LOCKED

Use:

- **Phaser 4.x**
- **Vite**
- **strict TypeScript**
- **Yandex Games SDK** through a small platform adapter

Do not use React for the game runtime.

Physics is **off by default**. Nothing in the accepted opener loop requires a physics engine.

---

## 2. Why Phaser

Phaser gives the project the right abstraction level for:

- scenes/state transitions;
- sprite/image rendering;
- tweens;
- particles/reveal FX;
- pointer/touch input;
- audio;
- asset loading;
- responsive canvas/scaling;
- pause/resume boundaries around platform events/ads.

The project should use Phaser as a small 2D game framework, not as justification for building a large game architecture.

---

## 3. Scene boundaries — LOCKED FOR PROBE

Primary first-probe structure:

```text
BootScene
OpeningScene
RevealScene
CollectionScene
```

`OpeningScene` is the clean primary surface. `CollectionScene` is the only separate persistent gameplay surface required by the first behavioral probe.

`ModBenchScene` is **parked** and should not be scaffolded merely for future possibility.

Small transient UI may still be implemented as overlays/components inside a scene, for example:

- settings;
- rewarded ad prompt;
- item detail;
- Signal status;
- lightweight notifications.

Keep scene count small unless implementation proves a real need.

### Transition performance rule

Navigation between Opening and Collection must feel effectively instant.

Implementation requirements:

- preload or shared-load assets required by these primary scenes before normal navigation;
- do not perform network-dependent work on scene switches;
- do not trigger user-visible asset loading when opening Collection;
- keep persistent game/save state outside individual scene instances;
- avoid destroying/reconstructing heavyweight shared resources unnecessarily;
- cosmetic fades/slides must be very short and must not mask actual loading.

Target:

> **~100–200 ms perceived response plus, at most, a very short cosmetic transition.**

If switching scenes feels like navigating to another web page, the implementation is wrong.

---

## 4. Suggested source structure

Working structure, not yet final:

```text
src/
  game/
    scenes/
      BootScene.ts
      OpeningScene.ts
      RevealScene.ts
      CollectionScene.ts

    systems/
      rarity.ts
      drops.ts
      collection.ts
      signal.ts
      save.ts

    data/
      collectibles.ts
      packages.ts
      balance.ts

    ui/
      ...

  platform/
    yandex.ts
    ads.ts
    analytics.ts

  main.ts
```

Avoid framework architecture for its own sake. Prefer pure data/config for content and balance.

---

## 5. Game-state model

At minimum the save will need concepts similar to:

```ts
interface SaveState {
  version: number;
  inventory: Record<string, number>;
  discovered: string[];
  signal: number;
  pendingReveal: PendingReveal | null;
  stats: {
    totalOpens: number;
    duplicates: number;
    secretsFound: number;
  };
}
```

Exact types should be designed during implementation spec work. The important rule is that **game systems are explicit state, not hidden inside scene objects**.

This also allows scene changes to remain cheap: switching from Opening to Collection should mostly be a rendering/navigation operation, not a reinitialization of game state.

Do not add `techParts` or Mod Bench state to the first-probe save schema unless that parked system is explicitly brought back later.

---

# 6. Transactional reveal / anti-reroll — LOCKED

Before reveal animation begins:

1. determine the result;
2. persist a `pendingReveal` record;
3. only then start the reveal animation;
4. on completion, commit the result to inventory/progression;
5. clear `pendingReveal`.

Goals:

- refresh cannot reroll the reward;
- double click cannot apply the reward twice;
- interrupted animation does not corrupt progression;
- save recovery is deterministic.

This rule must account for:

- Signal changes from duplicates;
- possible Hidden Pocket result;
- Secret result if applicable.

The full transaction shape should be specified before coding the drop pipeline.

---

# 7. Save and persistence

For the behavioral probe:

- local-first persistence is sufficient;
- no required account;
- no backend;
- no cloud sync requirement.

The save format must be versioned from the start so generated content/balance can evolve without immediately breaking old saves.

Potential Yandex player/cloud data can be considered later; it is not required to validate the opener loop.

---

# 8. Yandex platform adapter

Do not scatter SDK calls across game scenes.

Create a thin boundary for:

- SDK initialization;
- loading-ready signal;
- gameplay start/stop/pause boundaries;
- rewarded ads;
- analytics hooks if routed through platform-specific integrations;
- optional player data later.

Game logic should remain testable without a live Yandex environment.

---

# 9. Rewarded ads

Rules:

- reward only after confirmed rewarded completion callback;
- pause/resume Phaser correctly around ad display;
- avoid duplicate reward delivery on resume/retry;
- ad failure must not corrupt save state;
- base loop must never deadlock because an ad is unavailable.

Exact rewarded use is still open.

---

# 10. Rendering and assets

Current item direction is static transparent 2D/2.5D art.

A single collectible asset should be reusable across:

- reveal hero presentation;
- shelf/collection placement;
- thumbnails/detail UI where appropriate.

Reveal juice should be primarily runtime presentation:

- scale tween;
- rotation/settle;
- glow/filter if needed;
- particles;
- rarity frame/burst.

Do not create separate 3D/inventory/reveal models for the same collectible.

For fast navigation, scene-critical shared assets should be loaded up front or kept available in Phaser's asset cache rather than repeatedly loaded and discarded between primary scenes.

---

# 11. Responsive layout — LOCKED

Primary orientation is **landscape-only for the first probe**.

The layout is genuinely adaptive. Do **not** implement one immutable 1280×720 board and simply `FIT` it into every viewport.

## Reference and supported aspect range

- reference art/composition ratio: **16:9**;
- expected coherent layout range: approximately **5:4 (1.25)** through **12:5 (2.40)**;
- screens outside this range still render safely, but the meaningful composition is clamped and extra area is treated as decorative space rather than stretching gameplay/UI.

Responsive modes:

```text
compact   1.25 – 1.50
standard  >1.50 – 1.95
wide      >1.95 – 2.40
```

These modes may change spacing, safe margins, collection density, and modest object scale. They must not change the core interaction or require a second UX design.

## Logical coordinate strategy

Use a stable logical **height of 720 units** and derive logical width from the current viewport aspect ratio:

```text
logicalHeight = 720
logicalWidth = clamp(viewportAspect * 720, 900, 1728)
```

This means:

- 5:4 ≈ 900×720 logical space;
- 16:9 = 1280×720;
- 12:5 ≈ 1728×720.

The renderer/canvas follows the available viewport, while scene layout is recomputed from logical bounds.

Do not non-uniformly stretch sprites or UI.

## Layout metrics

Create one small layout service/helper that scenes consume, e.g.:

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

Recompute metrics on viewport/scale resize and relayout scene elements from anchors/constraints. Do not scatter bespoke resize math across every sprite.

## OpeningScene anchoring

Default semantic anchors:

```text
Signal       → top-left safe anchor
Package      → visual center
Collection   → bottom-left or another quiet edge anchor
```

Rules:

- package remains the visual hero in every mode;
- package may scale down modestly in `compact`;
- package should not grow indefinitely in `wide`;
- extra horizontal room primarily becomes atmosphere/decor;
- HUD may tighten spacing in `compact`, but no core control disappears;
- reveal can temporarily dim/de-emphasize HUD without changing layout.

## Safe areas and hit targets

Critical UI must honor both device/browser safe insets and internal scene margins.

Use responsive internal margins around **3–5% of the viewport dimension**, with sensible min/max clamps so margins neither collapse on small screens nor become comically large on ultrawide desktop.

Touch/pointer targets must remain at least approximately **44 CSS px** in effective hit size on mobile landscape. The hit area may be larger than the drawn icon.

Never place critical interaction exactly against a viewport edge.

## Background and extreme aspect handling

Backgrounds are decorative and may:

- crop;
- extend;
- reveal additional side decoration;
- use layered/parallax pieces if cheap.

Critical gameplay content may **not**:

- be cropped;
- leave the viewport;
- overlap because of aspect changes;
- stretch non-uniformly;
- trigger browser scrolling.

For very wide desktop, keep the meaningful gameplay composition bounded and use the extra sides for atmosphere rather than pushing HUD/package farther and farther apart.

## Collection adaptation

Collection must use the same layout metrics and may change density between `compact`, `standard`, and `wide`.

Exact slot count/grid is intentionally deferred to the Collection specification. The responsive system must support changing columns/spacing without changing collection data semantics.

## Portrait behavior

Do not build a separate portrait game UI for the first probe. Portrait is outside the intended gameplay orientation; handle it at the platform/shell level with an orientation prompt rather than maintaining two full scene compositions.

---

# 12. Analytics

Behavioral analytics should answer product questions rather than merely log technical events.

Minimum families:

### Start

- game loaded/ready;
- first package interaction;
- first reveal completed.

### Core loop

- package opened;
- reveal completed;
- second package opened;
- N lifetime/session openings.

### Drop quality

- rarity result;
- new vs duplicate;
- Secret found;
- Hidden Pocket triggered if implemented.

### Progression

- Signal advanced;
- Signal lock reached/consumed.

### Collection

- collection opened;
- item detail viewed if such UI exists;
- return to opener.

### Monetization

- rewarded offered;
- rewarded started;
- rewarded completed;
- reward consumed.

Exact event names and success thresholds remain open.

---

# 13. Engineering scope guardrails

Do not introduce by default:

- React;
- Redux/Zustand-style state framework unless plain typed state genuinely fails;
- ECS;
- physics engine usage;
- backend;
- websocket infrastructure;
- real-time 3D;
- complex asset pipeline server;
- Mod Bench / Tech Parts before post-validation evidence justifies them;
- premature test harness/CI complexity unrelated to shipping the probe.

The technical design should remain proportional to a tiny 2D collectible game.
