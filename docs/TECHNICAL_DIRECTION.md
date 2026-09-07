# Technical direction

## 1. Stack — LOCKED

Current stack:

- **Phaser 4.2.1**;
- **Vite**;
- **strict TypeScript**;
- **Yandex Games SDK** behind thin platform adapters.

No React runtime. Physics, backend, ECS and real-time 3D stay out unless a concrete future requirement justifies them.

Target platforms: Desktop + Mobile landscape.

---

## 2. Current architecture state

Gameplay Loop Lite V2, the bounded **Opening Feel Correction**, and Phase 2.6 Signal Overcharge are implemented in current `main` after PR #48. The Phase 2.6 runtime passed exact technical/browser validation and post-merge CI #274; the immediate gate is one final direct repeated-use regression, then real Yandex DRAFT if accepted — not broad architecture work.

Existing architecture already contains the required truth boundaries:

- typed Basic/Charged pouch profiles;
- global CHIPS wallet;
- independent base/cache reward resolution;
- automatic duplicate recycle;
- 4-segment Signal pity;
- Drop/loot-pool-aware content selection;
- versioned save migration;
- recoverable atomic cost/reward transaction;
- presentation separated from durable economy mutation.

The merged correction improves choreography without moving economic truth back into `OpeningScene` tweens.

---

## 3. Scenes

Keep:

```text
BootScene
OpeningScene
CollectionScene
```

Reveal remains inside `OpeningScene` for physical continuity.

Opening owns presentation/orchestration for:

- pouch interaction;
- CHIPS/Signal HUD;
- Basic/Charged selection and affordability;
- cache/recycle/Charged feedback;
- result/carousel interaction;
- current reveal fast-forward request handling.

There is no `ShopScene`. Drop selector remains hidden while there is one production Drop.

---

## 4. Current source boundaries

Relevant structure:

```text
src/
  game/
    scenes/
      BootScene.ts
      OpeningScene.ts
      CollectionScene.ts
    systems/
      drops.ts
      pouches.ts
      openingEconomy.ts
      openingSession.ts
      save.ts
      signal.ts
      collection.ts
      layout.ts
      audio.ts
      presentationSkip.ts
    data/
      collectibles.ts
      balance.ts
      presentation.ts
    ui/
      openingVisuals.ts
      openingEconomyVisuals.ts
      staticArt.ts
  platform/
    yandex.ts
    storage.ts
    analytics.ts
    ads.ts
    activity.ts
  debug/
  i18n/
  main.ts
```

Keep domain logic in pure systems/data modules. Scene code may orchestrate presentation but cannot become the source of truth for economy/persistence.

A small focused presentation helper is acceptable if the fast-forward/banking choreography would otherwise make `OpeningScene` substantially harder to reason about. Do not create a generalized animation framework.

---

## 5. Content / balance boundaries — LEGACY VALUES UNCHANGED

Current registry remains loot-pool-aware. Current `LITE_V2_BALANCE` remains the single tuning source.

Structural invariants remain:

- Basic cost `0`, Legendary weight `0`;
- Charged cost `60` at current provisional tuning, non-zero Legendary;
- collectible rarity and cache are independent;
- Signal threshold `4`;
- Signal respects active pool + selected-pouch eligibility;
- CHIPS/Signal global across Drops;
- Charged remains a CHIPS sink in expectation;
- balance numbers stayed unchanged through the feel correction and remain provisional pending later evidence.
- Phase 2.6 may add only Overcharge-specific pouch gain/cap tuning; legacy pouch cost/base/cache/rarity/recycle numbers do not move by intuition.

No player Drop selector before Drop #2.

---

## 6. Save / atomic reveal contract — CRITICAL BASELINE + PHASE 2.6 EXTENSION

Current save is versioned (`SAVE_VERSION = 2`) behind `StorageAdapter`.

`pendingReveal` predetermines the complete economic outcome before visual presentation:

```text
transaction id
base opens
pouch type
loot pool id
opening number
standard result
wallet before
pouch cost
base CHIPS
cache tier + bonus
recycle CHIPS
Signal transition
Hidden Pocket result
final deterministic snapshot
```

Invariants:

- no reroll on refresh;
- no cache reroll;
- Charged cost and reward are one transaction;
- no duplicate base/cache/recycle grant;
- retained/consumed Signal outcome cannot change during recovery;
- original pouch profile/loot pool survive recovery;
- presentation tweens, fast-forward and visual banking never determine durable state.

Phase 2.6 must extend this same boundary rather than bypass it:

- persist Overcharge multiplier-before, bonus CHIPS, actual clamped gain/reset and multiplier-after in the prepared reveal;
- migrate existing saves to an inactive `x1.00` Overcharge state without losing pending-reveal safety;
- recovery must never recalculate a different multiplier transition;
- reward count-up, gain flight, MAX pulse and discharge are presentation-only views of the stored transition.

---

## 7. Current presentation boundary

The correction changes what the player **sees and can accelerate**, not what the transaction means.

Target fresh reveal choreography:

```text
prepare + persist transaction
→ tear
→ collectible/reward presentation
→ stage earned CHIPS beside result
→ optional Hidden Pocket
→ commit deterministic transaction
→ resolved result
→ player accepts
→ visually bank staged base/cache/recycle CHIPS in order
→ update displayed Signal destination feedback
→ next idle
```

The exact commit point may remain where safety/recovery currently require it; visual staging is not proof that durable state is uncommitted. UI can deliberately display pre-reward/after-cost wallet until visual banking, then count to the already-known committed value.

If a reload occurs after commit and there is no pending reveal to cosmetically replay, show the durable wallet truth rather than reconstructing a fake payout animation.

### Charged cost

Charged spend remains communicated at opening time. Earned base/cache/recycle amounts are the components staged for later visual banking.

### Charged-ready

Readiness feedback should move to the visual moment the displayed wallet crosses the Charged cost during bank/count-up. This is presentation causality only; affordability logic remains derived from real state.

---

## 8. Fast-forward contract

Current dead `RESULT LOCKED` input behavior is replaced by deliberate presentation acceleration.

Rules:

- pointer/tap during `revealing` requests fast-forward of the active presentation beat;
- no new prepare/commit call;
- no economic mutation;
- no global scene/tween-manager timescale change;
- ambient motion, lifecycle and unrelated controls remain normal speed;
- short post-tear guard prevents the release event that completed drag from becoming an accidental skip;
- once result is visible, a separate intentional tap accepts/continues.

Implementation should track only reveal-owned presentation that may be accelerated. Avoid a broad “kill all tweens and render final state” approach because it risks ambient/carousel/cleanup regressions.

---

## 9. CHIPS staged bank / HUD

The merged correction uses staged reward presentation and bank-on-accept while durable transaction truth remains unchanged.

Current contract:

- create bounded aggregate visual reward components near hero;
- keep displayed HUD at appropriate pre-reward/after-cost value until acceptance;
- on acceptance bank base → cache → recycle;
- each bank step animates displayed count toward the deterministic target;
- final displayed value equals durable committed snapshot;
- local card punch/shake/glow is purely cosmetic.

Large rewards must use bounded visual token count and bounded count-up duration.

Do not mutate `SaveState.chips` from count-up callbacks.

---

## 10. Signal presentation

Current Signal pity resolver semantics remain the baseline. Phase 2.6 extends the same pure/domain layer with Overcharge; scene tweens remain non-authoritative.

Presentation may add:

- fragment/spark flight from duplicate result to Signal HUD;
- destination segment pulse;
- short electronic lock flicker/glitch;
- stronger digital/pixel label treatment.

Do not turn Signal into a scene-owned/spendable animation state machine. Signal + Overcharge resolver state and the pending transaction remain authoritative.

---

## 11. Opening UI layout

Current gameplay hierarchy is a left-side rail:

```text
CHIPS
SIGNAL
POUCH
  Basic
  Charged
```

Requirements:

- selected state obvious without color alone;
- unavailable Charged attempt can receive input feedback but cannot select/mutate;
- center remains visually owned by pouch/collectible;
- 900 logical width remains clean;
- no fake future Drop controls.

Responsive strategy remains:

```text
logicalHeight = 720
logicalWidth = clamp(viewportAspect * 720, 900, 1728)
```

---

## 12. Digital/neon visual implementation

Visual rule:

> **Cozy Y2K world, electric digital UI.**

Use one bundled digital/pixel-like accent font for short system data only. Long UI/instructions remain readable sans.

Prefer existing renderer capabilities:

- Phaser Text/Graphics;
- translucent duplicate glow layers;
- stroke/shadow;
- tint;
- blend modes where stable;
- moving translucent highlight strips;
- rings/sparks/particles;
- bounded tweened iridescent sweeps.

### Custom shaders — NOT IN CURRENT PASS

Do not add a custom WebGL pipeline/shader now. It creates a new mobile/WebGL compatibility surface before the visual hypothesis is proven.

Only reconsider one local shader after manual review if a specific Charged/Legendary effect cannot be achieved convincingly enough without it.

---

## 13. Charged visual identity

Direct hands-on required stronger differentiation. The merged runtime treatment passed the r3 label-hidden comparison without bespoke pouch raster art:

- stronger cyan/violet palette;
- restrained pink/iridescent accents;
- star/seal emphasis;
- stronger contour/aura/rings/sparks;
- moving highlight/sweep;
- selector and pouch transition together.

No recolored raster is required by the current audit. Re-open one only if later hands-on contradicts the reviewed runtime result; preserve geometry, silhouette and tear mechanics.

---

## 14. Audio boundary

The evidence-backed cue is integrated through the existing audio abstraction and persistent mute behavior:

Current integrated cues include synthesized `chip-clack` for CHIPS banking and synth-only `pouch-grab` for star grab. Do not add one cue per cache tier. Optional `charged-ready` cue remains conditional on review.

---

## 15. Current regression coverage

Current suite baseline is 108 tests plus typecheck/assets/build. Focused coverage and the r3 exact-revision audit cover:

- fast-forward cannot prepare/commit twice;
- fast-forward cannot alter pending reveal data;
- tear pointer release cannot accidentally skip next beat;
- visual CHIPS endpoint equals deterministic transaction snapshot;
- banking animation cannot grant currency;
- existing Signal retain/consume edge remains intact;
- recovery remains idempotent;
- Charged selection continuity/fallback remains intact.

The r3 browser/video regression covered the matrix in `PROBE_VALIDATION.md`, including grab/tear motion, staged CHIPS, bank/count-up, selector states, Charged differentiation, neon/digital treatment, fast-forward and compact RU layouts; manual artifact review passed.

---

## 16. Yandex boundary

Real hosted Yandex DRAFT remains required **after Phase 2.6 implementation + exact audit + direct regression approval**.

Hosted gate still covers SDK boot/loading, storage, lifecycle/audio, ad behavior, interrupted Basic/Charged recovery and Metrica.

Do not infer hosted correctness from local CI.

---

## 17. Engineering guardrails

Do not introduce by default:

- React/state framework;
- ECS;
- physics;
- backend/websockets;
- generalized economy/currency framework;
- generalized animation engine;
- shop scene;
- timers/offline scheduler;
- real-time 3D;
- content CMS/server;
- custom shader system;
- generalized abstractions for Archive/prestige or future Overcharge expansion beyond the approved small Signal extension.

Phase 2.6 should stay narrow: preserve existing boundaries, add only the smallest pure-state/save fields needed for deterministic Overcharge, and keep presentation helpers local.
