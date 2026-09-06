# Infrastructure status

This file states what is **actually present in current `main`** and what the current evidence-backed correction changes.

## Completed / established

### Application / runtime

- Phaser 4.2.1 + Vite + strict TypeScript;
- `BootScene`, `OpeningScene`, `CollectionScene`;
- responsive landscape + safe-area handling;
- RU/EN localization;
- persistent mute;
- Camera + Flip Phone private validation content;
- production pouch/environment/SFX integration;
- stable reveal/carousel/Collection presentation.

### Gameplay Loop Lite V2

- global CHIPS wallet;
- Basic/Charged typed pouch profiles;
- guaranteed base CHIPS + independent cache tiers;
- Basic C/R/E gate, Legendary weight zero;
- Charged C/R/E/L profile;
- duplicate auto-recycle → CHIPS + Signal;
- 4-segment Signal lock + selected-pouch eligibility;
- `SIGNAL LOCK · CHARGED` edge;
- loot-pool-aware reward selection + active pool state;
- CHIPS/Signal HUD;
- Basic/Charged selection/affordability;
- Charged continuity/fallback;
- cache/recycle/Charged-ready presentation;
- Phaser-rendered CHIPS token + Charged aura.

### Persistence / platform

- V2 save + migration;
- deterministic `pendingReveal` anti-reroll transaction;
- atomic Charged cost/reward/cache/recycle/Signal/Hidden outcome;
- ambiguous storage-write reconciliation;
- Yandex SDK/storage/ads/analytics/activity adapters;
- rewarded exactly-once dev CHIPS probe;
- pause/resume/audio coordination.

### Tooling / QA

- permanent CI;
- 87-test baseline;
- asset tooling + production build;
- deterministic debug controls;
- exact-revision screenshot/video audit workflow;
- original Lite V2 visual audit + manual review passed;
- final Charged-ready correction merged and re-audited.

---

## First hands-on result — PRODUCT FINDINGS, NOT ARCHITECTURE FAILURE

The first direct repeated-use pass is complete. It found no need for a new economy or architecture layer; it found presentation/input issues:

- CHIPS feedback too weak;
- CHIPS HUD too small;
- no satisfying count-up/local receiving response;
- Basic/Charged selector cramped/ambiguous;
- callouts too brief;
- CHIPS should stage beside reward and bank after acceptance;
- Charged visual differentiation too weak;
- `RESULT LOCKED` dead tapping frustrating;
- UI lacks enough distinctive electronic/neon Y2K character.

The response is the bounded `OPENING_FEEL_CORRECTION_SCOPE.md`.

---

## Opening Feel Correction — NEXT IMPLEMENTATION

Infrastructure impact is deliberately small.

### Existing boundaries reused

- `OpeningScene` remains reveal/presentation orchestrator;
- `pendingReveal` remains economic truth;
- `LITE_V2_BALANCE` remains tuning truth;
- existing audio abstraction/persistent mute remains;
- existing Phaser Graphics/Text UI path remains;
- existing exact-revision browser/video workflow remains.

### Small additions/changes allowed

- targeted reveal fast-forward handling;
- post-tear input guard;
- staged reward representation;
- visual bank-on-accept sequence;
- CHIPS count-up/local HUD reaction;
- one `chips-collect` SFX;
- Signal destination feedback;
- left-side gameplay rail;
- one bundled accent digital/pixel font;
- stronger runtime Charged/neon/iridescent treatment;
- small presentation helper if needed to keep `OpeningScene` understandable.

### Not justified

- generalized animation engine;
- custom shader system;
- physics;
- state framework;
- backend;
- new economy abstraction;
- second pouch mechanic;
- new content architecture.

---

## Technical truth during visual banking

The correction intentionally separates **display timing** from durable state.

The game may visually keep earned CHIPS beside the result and delay the displayed wallet increase until acceptance even if the deterministic transaction has already been safely committed.

Rules:

- visual tokens/count-up cannot grant currency;
- final displayed wallet must equal durable snapshot;
- refresh after commit may show durable value directly rather than reconstruct cosmetic banking;
- fast-forward cannot prepare/commit/reroll;
- Charged cost remains part of the original atomic transaction;
- Signal consume/retain outcome stays fixed.

This keeps feel work from weakening recovery correctness.

---

## Digital/neon implementation boundary

Visual principle:

> **Cozy Y2K world, electric digital UI.**

Use Phaser Text/Graphics/tint/blend/highlight/tweens first.

No custom WebGL shader in the current pass. If a later reviewed no-shader result proves one specific holographic effect insufficient, reconsider exactly that effect rather than creating a shader framework.

A dedicated Charged raster recolor is also conditional only if stronger runtime treatment still fails a label-hidden differentiation audit.

---

## Current provisional runtime tuning — FROZEN FOR THIS PASS

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

Do not tune these values in the feel-correction branch. Current deterministic analysis already keeps Charged below break-even.

---

## Current validation path

1. implement Opening Feel Correction;
2. full typecheck/tests/assets/build;
3. exact-revision screenshot/video audit;
4. manual artifact review;
5. second 20–30 opening hands-on;
6. real Yandex DRAFT;
7. content expansion.

Hosted DRAFT must still prove real SDK boot/loading, storage, lifecycle/audio, Basic/Charged recovery, ads and analytics.

CI/local browser automation cannot replace it.

---

## Deferred / not infrastructure defects

- odds/Drop contents/discovered-item drawer;
- player Drop selector until Drop #2;
- final economy tuning;
- family-targeted acquisition;
- timed Basic energy;
- offline/passive income;
- Overcharge / Archive / upgrades;
- shop;
- multi-standard drops;
- release texture streaming;
- multi-Drop Collection navigation;
- final ad cadence/reward;
- store assets/moderation package.

---

## Asset workflow

Collectible pipeline remains unchanged:

1. raw sources under git-ignored `assets-src/raw/`;
2. `npm run assets:prepare`;
3. visual QA + `npm run assets:validate`;
4. enable accepted ids;
5. integrate art/SFX through reviewed paths;
6. CI + visual QA.

---

## Current critical path

> **Opening Feel Correction → exact-revision review → second hands-on → real Yandex DRAFT → content expansion.**

Runtime architecture is still not the bottleneck; presentation quality is.
