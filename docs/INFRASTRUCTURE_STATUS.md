# Infrastructure status

This file states what is **actually present in current `main`** and what still requires external validation.

## Completed / established

### Application / runtime

- Phaser 4.2.1 + Vite + strict TypeScript;
- `BootScene`, `OpeningScene`, `CollectionScene`;
- responsive landscape layout + safe-area handling;
- RU/EN localization;
- persistent mute;
- current two-family Camera + Flip Phone content;
- production pouch/environment/SFX integration;
- stable reveal/carousel/Collection presentation.

### Gameplay Loop Lite V2

- global CHIPS wallet;
- Basic/Charged typed pouch profiles;
- guaranteed base CHIPS + independent cache tiers;
- Basic Common/Rare/Epic gate with Legendary weight zero;
- Charged Common/Rare/Epic/Legendary profile;
- duplicate auto-recycle → CHIPS + Signal;
- 4-segment Signal lock;
- strict selected-pouch eligibility under Signal pity;
- `SIGNAL LOCK · CHARGED` retained-lock edge;
- Drop/loot-pool-aware reward selection;
- active loot-pool state;
- CHIPS + Signal HUD;
- Basic/Charged selector/affordability;
- Charged selection continuity while affordable + Basic fallback when not;
- cache/recycle/Charged-ready presentation;
- Phaser-rendered CHIPS token + Charged aura.

### Persistence / correctness

- versioned V2 save;
- migration from pre-Lite saves;
- legacy Signal conversion `min(4, floor(oldSignal / 25))`;
- full `pendingReveal` anti-reroll transaction;
- atomic Charged cost/base/cache/recycle/collectible/Signal/Hidden outcome;
- reload reconciliation for ambiguous storage writes;
- recovery preserves pouch type, loot pool, cache and retained/consumed Signal state.

### Platform boundaries

- Yandex SDK bootstrap adapter;
- safe storage boundary;
- LoadingAPI / GameplayAPI lifecycle handling;
- interstitial/rewarded/sticky ad adapter;
- rewarded exactly-once persistence semantics;
- dev rewarded CHIPS probe;
- provider-independent semantic analytics + Yandex Metrica adapter;
- pause/resume/audio coordination.

### Tooling / validation

- permanent GitHub Actions CI;
- typecheck + Vitest + asset tooling + production build;
- 87 unit tests in current suite;
- deterministic debug controls for critical reward states;
- collectible asset preprocessing/validation pipeline;
- exact-revision browser screenshot/video audit workflow;
- reviewed Basic/Charged/cache/recycle/Signal/Hidden/recovery/responsive/RU captures;
- post-merge CI green after final Charged-ready presentation correction.

---

## Current provisional runtime tuning

Implemented values are centralized in `LITE_V2_BALANCE` and remain open to evidence-based tuning:

```text
Basic
  cost 0
  base CHIPS 6–10
  rarity C/R/E/L 72/25/3/0
  Hidden Pocket 1.5%

Charged
  cost 60
  base CHIPS 18–24
  rarity C/R/E/L 35/40/20/5
  Hidden Pocket 6%

Duplicate recycle C/R/E/L
  2/4/8/15

Cache rewards
  cache 20–35
  big 45–75
  mega 120–180
```

Current deterministic all-duplicate analysis keeps Charged below break-even. Final release tuning waits for hands-on + content scale.

---

## Current pouch / UI reality

Runtime pouch assets:

```text
assets/package/pouch-body.webp
assets/package/pouch-tear-strip-compact.webp
assets/package/pouch-star-tab.webp
```

Layers use independent reviewed transforms. The old same-canvas/origin contract is obsolete.

Lite V2 did **not** require another raster asset branch:

- CHIPS token identity is Phaser-rendered;
- Charged differentiates the same pouch with runtime glow/rings/sparks/accent;
- cache tiers reuse the same token identity + text/FX intensity;
- existing SFX remain the active set; no dedicated `chips-collect` or `charged-ready` MP3 is currently required.

---

## Current missing product validation

### 1. Direct repeated hands-on — REQUIRED NOW

The next unresolved questions are tactile/product questions, not infrastructure tasks.

Run 20–50 openings and evaluate:

- repeated pacing/fatigue;
- Basic → Charged motivation;
- Charged perceived value;
- CHIPS/cache/recycle/Signal comprehension;
- `SIGNAL LOCK · CHARGED` clarity;
- `CHARGED POUCH READY` usefulness;
- whether cache/recycle sequencing feels rich or noisy.

If no concrete problem appears, **do not add another meta system**.

### 2. Real Yandex DRAFT — REQUIRED AFTER HANDS-ON

Hosted validation must still prove:

- actual `/sdk.js` boot and `LoadingAPI.ready()`;
- platform pause/resume/audio lifecycle;
- real safe storage behavior;
- save migration in hosted conditions;
- interrupted Basic recovery;
- interrupted Charged recovery with atomic cost/reward/cache state;
- retained Signal lock + following Charged consumption;
- real interstitial/rewarded/sticky behavior including no-fill/throttle/close;
- rewarded CHIPS exactly-once behavior;
- Metrica goal visibility where configured.

CI/local browser automation cannot replace these checks.

---

## Intentionally deferred

Not infrastructure defects:

- final economy tuning;
- player-facing Drop selector until Drop #2 exists;
- family-targeted acquisition;
- timed Basic energy;
- offline/passive income;
- Overcharge / Archive / upgrade trees;
- shop scene;
- multi-standard drops;
- release-scale texture streaming/loading strategy;
- multi-Drop Collection navigation;
- final public ad reward/cadence;
- public store assets/moderation package.

Do not build speculative backend/CMS/ECS/economy infrastructure for parked ideas.

---

## Asset workflow status

Collectible production pipeline remains ready for future families:

1. raw sources under git-ignored `assets-src/raw/` paths declared by the manifest;
2. `npm run assets:prepare`;
3. visual QA + `npm run assets:validate`;
4. enable accepted ids;
5. integrate art/SFX through reviewed paths;
6. CI + exact-revision visual QA.

`npm run assets:atlas -- --family <id>` remains profiling/inspection tooling, not the canonical runtime path.

---

## Current critical path

> **Direct repeated hands-on → evidence-backed fix only if needed → real Yandex DRAFT → content expansion.**

Runtime architecture is not the bottleneck now.
