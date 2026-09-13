# Signal 2000 — Reusable Mechanics Current Status

**Status:** post-extraction update  
**Historical inventory:** `docs/REUSABLE_MECHANICS_INVENTORY_2026-09-13.md`  
**Shared runtime repository:** `DanilaH/mini-games-kit`

The older inventory was written before the shared kit existed. It remains useful as source evidence about coupling and production behavior, but its repeated `WAIT_FOR_SECOND_CONSUMER` recommendations are no longer the active extraction policy.

## Already extracted experimentally

The following capabilities now live in `DanilaH/mini-games-kit` as `0.x` APIs:

- presentation skip ownership;
- injectable gameplay RNG / weighted choice;
- continuous-interaction progress/velocity semantics;
- bounded value-transfer planning with semantic value separated from visual/audio density;
- pointer normalization, idle drift, pose response and environment parallax;
- Phaser planar homography/material response;
- presentation audio mixer, continuous tactile noise and pitch helpers;
- render-density helpers;
- platform-independent gameplay activity coordination and interstitial eligibility;
- generic async storage seam;
- Yandex ads adapter, Player Data mirroring and Metrica adapter;
- configurable landscape logical layout;
- Phaser text sharpness and runtime image loading;
- Node-side generated-image cutout/normalization/validation tooling.

These APIs are deliberately experimental. The next real project should reuse them where they fit and is allowed to reshape them when real requirements expose a better boundary.

## Still intentionally local

Keep these Signal-specific unless a future consumer proves a smaller common contract:

- CHIPS/Signal/Overcharge/Hidden Pocket rules;
- pouch geometry and tear thresholds;
- exact rarity/material/audio policy;
- reward probabilities and balance;
- collection schema and milestone policy;
- `OpeningScene` orchestration;
- Signal 2000 save schema and conflict comparison rules;
- concrete Y2K art/audio identity.

## Highest-value remaining extraction candidate

The durable pending transaction / ambiguous-write recovery pattern remains the strongest architectural candidate not yet moved. Do **not** export `OpeningSession`, `SaveState` or `PendingReveal` unchanged. A generic extraction should preserve the proven guarantees while injecting project state/pending/commit verification policy.

The trigger is not merely "a second consumer exists". Extract when either:

1. another project actually needs interruption-safe staged durable work; or
2. a project-local refactor can expose a small generic transaction kernel without importing Signal-specific state into the shared API.

## Lower-priority candidates

Silhouette-following accents, transformed-bounds contextual placement, milestone resolution and collection read models remain useful observations, but should not outrank platform/runtime/asset infrastructure already moved to the kit.

## Rule for future agents

Before writing a reusable-looking mechanism in Signal 2000:

1. inspect `DanilaH/mini-games-kit` and its `docs/API.md`;
2. reuse an existing primitive if it fits without changing the game design;
3. extend the kit when the mechanism is expensive and its generic boundary is clear enough;
4. keep Signal policy local;
5. feed consumer evidence back into kit docs/tests and `DanilaH/decisions`.
