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

## 3. Scene boundaries — LOCKED DIRECTION

Primary structure:

```text
BootScene
OpeningScene
RevealScene
CollectionScene
ModBenchScene
```

`OpeningScene` is the clean primary surface. `CollectionScene` and `ModBenchScene` are separate navigable game surfaces rather than permanent panels cluttering the opener.

Small transient UI may still be implemented as overlays/components inside a scene, for example:

- settings;
- rewarded ad prompt;
- item detail;
- Signal status;
- lightweight notifications.

Keep scene count small unless implementation proves a real need.

### Transition performance rule

Navigation between Opening, Collection and Mod Bench must feel effectively instant.

Implementation requirements:

- preload or shared-load assets required by these primary scenes before normal navigation;
- do not perform network-dependent work on scene switches;
- do not trigger user-visible asset loading when opening Collection or Mod Bench;
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
      ModBenchScene.ts

    systems/
      rarity.ts
      drops.ts
      collection.ts
      signal.ts
      duplicates.ts
      modBench.ts
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
  techParts: number;
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

This also allows scene changes to remain cheap: switching from Opening to Collection or Mod Bench should mostly be a rendering/navigation operation, not a reinitialization of game state.

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

This rule must also account for:

- Tech Parts from duplicates;
- Signal changes;
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

# 11. Responsive layout — LANDSCAPE LOCKED

Primary orientation is **landscape**.

This means the opener, reveal composition, Collection and Mod Bench should all be designed landscape-first rather than treating landscape as an afterthought around a portrait game board.

Still to decide before implementation:

- logical Phaser resolution / aspect-ratio target;
- scaling strategy across desktop and mobile landscape;
- minimum supported viewport and safe-area policy;
- whether extreme-wide desktop uses bounded composition / decorative side space;
- how Collection density changes across narrower landscape screens.

Do not build a separate portrait composition for the first probe unless platform evidence later makes it necessary.

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
- Signal lock reached/consumed;
- Tech Parts gained/spent;
- Mod Bench used/result chosen.

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
- premature test harness/CI complexity unrelated to shipping the probe.

The technical design should remain proportional to a tiny 2D collectible game.
