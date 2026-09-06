# Infrastructure status

This document separates what is already reusable/stable from the **next missing gameplay work**.

## Completed / established in current main

- Phaser/Vite/strict TypeScript application shell;
- config-driven content registry and balance engine;
- transactional `pendingReveal` save/recovery;
- current Signal and Hidden Pocket engine paths;
- generic Collection snapshot/rendering boundary;
- Yandex SDK bootstrap, safe storage, LoadingAPI and GameplayAPI lifecycle;
- interstitial/rewarded/sticky ad adapters with exactly-once rewarded persistence semantics;
- Yandex Metrica adapter and semantic game/ad events;
- responsive landscape layout and safe-area handling;
- RU/EN localization and persistent mute;
- permanent GitHub Actions CI (`npm ci`, typecheck, tests, asset tooling, production build);
- deterministic debug controls for critical reward paths;
- collectible-art manifest and preprocessing pipeline;
- all current Camera + Flip Phone production collectible assets integrated/enabled;
- production Opening/Collection environment art integrated;
- production SFX set integrated;
- production pouch body + star tab + compact authored tear strip integrated;
- stable pouch/reward z-order and reveal presentation;
- rarity FX, ambient motion, CTA heartbeat and reward breathing;
- Hidden Pocket swipe carousel with resize-state preservation;
- exact-revision browser screenshot/video review workflow.

The earlier documentation describing Camera/Flip Phone art, pouch layers, environments or SFX as still awaiting production is obsolete.

### Current pouch reality

Runtime uses:

```text
assets/package/pouch-body.webp
assets/package/pouch-tear-strip-compact.webp
assets/package/pouch-star-tab.webp
```

The layers intentionally use independent reviewed presentation transforms. The old “all three runtime layers must share one identical untrimmed canvas/origin” rule is no longer valid.

## Next missing product work — Gameplay Loop Lite V2

The next gap is not more presentation scaffolding. It is the agreed lightweight meta-loop:

- CHIPS state + HUD;
- guaranteed base CHIPS payout + independent cache bonus roll;
- Basic standard rarity gate: Common/Rare/Epic only, no Legendary;
- Charged standard rarity gate: all rarities including Legendary with stronger top-end weighting;
- duplicate auto-recycle → CHIPS + Signal;
- Signal migration from current 0–100 model to +1-per-duplicate / 4-segment lock;
- locked legacy mapping `min(4, floor(oldSignal / 25))`;
- Signal Lock preserving selected pouch rarity profile among eligible missing items;
- strict Signal gate: if Basic has no eligible NEW because only Legendary remains, Basic resolves normally while Signal stays armed until Charged;
- Charged Pouch cost/profile and net-CHIPS-sink invariant;
- Drop/loot-pool-aware reward selection;
- save migration;
- atomic Charged cost/base/cache/recycle reward recovery plus retained/consumed Signal state;
- minimal CHIPS token presentation and optional concise SFX;
- new deterministic tests/debug scenarios;
- new browser visual/interaction gates.

This should be implemented without adding a generalized idle/economy framework.

## Intentionally deferred

These are not infrastructure defects:

- exact Lite economy tuning numbers until implementation/simulation/hands-on;
- player-facing Drop selector until more than one Drop exists;
- family-targeted acquisition;
- timed Basic charges/energy;
- offline income;
- passive Collection production;
- Overcharge / Archive levels / upgrade trees;
- separate shop scene;
- multi-standard collectible drops;
- release-scale grouped/on-demand texture loading strategy;
- final multi-Drop Collection grouping/navigation;
- final public ad placements/reward values;
- public store assets and moderation package.

Do not build speculative backend/CMS/ECS/streaming/economy architecture for these parked ideas.

## Asset workflow status

The collectible pipeline remains available for future families:

1. put raw sources under git-ignored `assets-src/raw/` paths declared by `assets-src/collectibles.manifest.json`;
2. run `npm run assets:prepare`;
3. visually QA cutout/framing and run `npm run assets:validate`;
4. enable reviewed collectible ids;
5. integrate static art/SFX through their reviewed paths/allowlists;
6. run CI + visual QA.

`npm run assets:atlas -- --family <id>` remains a profiling experiment, not the canonical runtime path.

## Lite V2 asset impact

The plan deliberately adds almost no asset burden:

- **required:** one reusable CHIPS token/icon visual identity (raster or equally good vector/Phaser form), reused for ordinary payouts, recycle and cache bursts;
- **default:** reuse current pouch layers for Charged with runtime treatment;
- **optional:** `chips-collect` and `charged-ready` SFX only if existing/re-pitched cues are insufficient;
- **not required:** separate Cache/Big/Mega token art or a second Charged pouch raster set.

See `ASSET_MANIFEST.md`.

## External validation still required

A real Yandex Games DRAFT remains required after Lite V2 hands-on acceptance.

Hosted checks must include:

- actual SDK boot / LoadingAPI timing;
- platform pause/resume/audio;
- real ad no-fill/throttle/close paths;
- safe storage in hosted environment;
- save migration;
- interrupted Basic reveal recovery, including retained-Signal edge;
- interrupted **Charged** reveal recovery so CHIPS cost/cache/reward cannot be lost or duplicated;
- rewarded exactly-once dev CHIPS probe after Signal migration;
- Metrica goal visibility if configured.

CI/local browser automation cannot truthfully replace those platform-hosted checks.

## Current critical path

> **Gameplay Loop Lite V2 → independent exact-revision visual/interaction review → direct repeated hands-on → Yandex DRAFT → content expansion.**

Do not return to broad feature ideation unless Lite hands-on exposes a concrete problem that the small loop does not solve.
