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

## 3. Suggested scene boundaries

Initial direction:

```text
BootScene
OpeningScene
RevealScene
CollectionScene
```

Potential overlays/surfaces rather than full scenes:

- Mod Bench;
- settings;
- rewarded ad prompt;
- collection detail;
- Signal state.

Keep scene count small unless implementation proves a real need.

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

---

# 11. Responsive layout — OPEN

Still to decide before implementation:

- portrait vs landscape primary orientation;
- logical Phaser resolution;
- scaling strategy;
- safe areas and desktop/mobile framing;
- how opening screen and collection screen adapt.

This is a genuine pre-development blocker because it affects all composition and asset sizing.

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
