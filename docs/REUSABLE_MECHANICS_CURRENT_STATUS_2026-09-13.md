# Signal 2000 — Reusable Mechanics Current Status

**Status:** post-extraction update  
**Historical inventory:** `docs/REUSABLE_MECHANICS_INVENTORY_2026-09-13.md`  
**Shared runtime repository:** `DanilaH/mini-games-kit`

The older inventory was written before the shared kit existed. It remains useful as source evidence about coupling and production behavior, but its repeated `WAIT_FOR_SECOND_CONSUMER` recommendations are no longer the active extraction policy.

## Already extracted experimentally

The following capabilities now live in `DanilaH/mini-games-kit` as `0.x` APIs:

- presentation skip ownership;
- **durable pending transaction / ambiguous-write recovery kernel**;
- injectable gameplay RNG / weighted choice;
- continuous-interaction progress/velocity semantics;
- bounded value-transfer planning with semantic value separated from visual/audio density;
- pointer normalization, idle drift, pose response and environment parallax;
- Phaser planar homography/material response;
- presentation audio mixer, continuous tactile noise and pitch helpers;
- render-density helpers;
- platform-independent gameplay activity coordination and interstitial eligibility;
- document-visibility and viewport-orientation activity bridges;
- generic async storage seam;
- versioned JSON repository with injected migration/validation and serialized writes;
- Yandex ads adapter, Player Data mirroring and Metrica adapter;
- **Yandex SDK/platform runtime bootstrap** with early pause/resume capture, safe-storage setup, optional Player Data enhancement, idempotent readiness and cleanup;
- mock platform runtime with the same consumer-facing shape;
- configurable landscape logical layout;
- Phaser text sharpness and runtime image loading;
- Node-side generated-image cutout/normalization/validation tooling.

These APIs are deliberately experimental. The next real project should reuse them where they fit and is allowed to reshape them when real requirements expose a better boundary.

### Durable transaction extraction boundary

The shared transaction primitive was generalized from Signal 2000's `OpeningSession` / `pendingReveal` lifecycle, but it does **not** export `OpeningSession`, `SaveState` or `PendingReveal`.

The kit owns only this lifecycle:

```text
base durable state
→ create one pending transaction
→ persist that exact pending transaction
→ presentation / non-durable work
→ deterministic commit
→ pending marker cleared
```

Projects inject:

- how pending state is stored/read;
- how a new pending transaction is resolved;
- how staging and commit are persisted;
- how semantic transaction identity is compared after reload;
- how committed state proves that the exact transaction already applied.

The generic implementation also hardens one edge case beyond Signal 2000: when a write is ambiguous and the immediate recovery reload also fails, further mutations are blocked until an authoritative `load()` succeeds. This prevents blind reroll or double-apply while durable truth is unknown.

Signal 2000 remains on its proven local implementation for now; switching the shipped game to a private cross-repository dependency solely to prove reuse would add deployment/CI risk without product value.

### Production-skeleton extraction boundary

The final broad extraction pass generalized the remaining high-leverage boot/persistence plumbing from Signal 2000 without moving game policy.

The shared Yandex runtime now owns:

- controlled SDK script loading / injected SDK initialization;
- immediate `game_api_pause` / `game_api_resume` subscription before async storage setup;
- `GameplayAPI.start()` / `stop()` edges through `GameplayActivityCoordinator`;
- safe storage setup;
- optional Player Data mirroring with game-injected conflict policy;
- idempotent `LoadingAPI.ready()`;
- deterministic visibility/listener cleanup;
- a matching mock runtime for development.

The shared JSON repository owns JSON parse/serialize and per-instance write ordering, while the game still owns schema validation, migrations and defaults.

The orientation helper only mirrors a viewport rule into a blocker. Signal 2000's rotate-device UI and Phaser loop/audio pause wiring remain local.

## Still intentionally local

Keep these Signal-specific unless a future consumer proves a smaller common contract:

- CHIPS/Signal/Overcharge/Hidden Pocket rules;
- pouch geometry and tear thresholds;
- exact rarity/material/audio policy;
- reward probabilities and balance;
- collection schema and milestone policy;
- `OpeningScene` orchestration;
- Signal 2000 save schema and its exact commit/conflict comparison rules;
- concrete Y2K art/audio identity;
- exact RU/EN product language policy and debug controls;
- Signal 2000-specific boot UI, scene list and visual orientation gate.

The generic transaction and persistence layers do **not** make those save/economy/product policies shared.

## Remaining lower-priority candidates

Silhouette-following accents, transformed-bounds contextual placement, milestone resolution and collection read models remain useful observations, but there is no reason to extract them merely for completeness.

At this point broad pre-emptive extraction should stop. The next useful evidence must come from another real game consuming the kit.

## Rule for future agents

Before writing a reusable-looking mechanism in Signal 2000:

1. inspect `DanilaH/mini-games-kit` and its `docs/API.md`;
2. reuse an existing primitive if it fits without changing the game design;
3. extend the kit when the mechanism is expensive and its generic boundary is clear enough;
4. keep Signal policy local;
5. feed consumer evidence back into kit docs/tests and `DanilaH/decisions`.
