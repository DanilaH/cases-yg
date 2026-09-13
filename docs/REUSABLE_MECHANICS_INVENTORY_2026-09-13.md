# Signal 2000 — Reusable Mechanics Inventory

**Status:** first implementation-side inventory  
**Reviewed source revision:** `cc1220bb5898f5827b59c7cbd0b63f3fda3eb4aa`  
**Repository:** `DanilaH/cases-yg`  
**Purpose:** make the current mechanics and their reuse boundaries explicit before any shared library is created.

This document is deliberately project-local. Cross-project policy lives in `DanilaH/decisions`; this file records the concrete implementation, tests, coupling and extraction evidence in Signal 2000.

## Executive conclusion

Do **not** create a shared mechanics library from Signal 2000 yet.

The codebase already contains several clean semantic seams, but one implementation is not enough evidence to freeze a public API. The next real consumer should reveal which parts are genuinely common and which are only clean because Signal 2000 happens to need them in one shape.

Current strongest findings:

- the **durable pending reward transaction / recovery pattern** is the most valuable reusable architecture idea, but its current types are deeply coupled to Signal 2000 and should wait for a second consumer;
- `PresentationSkipController` and the RNG helpers are already technically generic and isolated, but moving them now would create a package boundary without reducing current complexity;
- reward banking, collection milestones and collection/near-completion logic have useful semantic cores but still encode Signal-specific policy;
- Signal, Overcharge, Hidden Pocket, pouch reward resolution and the exact CHIPS economy remain game-specific;
- continuous gesture state and several high-value feel primitives currently live partly inside `OpeningScene`; they should be documented, not prematurely abstracted into a framework.

**Result of this pass:** no gameplay code refactor is justified solely by reuse. The best action is to preserve the current tested seams, make their contracts discoverable, and let the next game provide the second set of requirements.

---

# 1. Classification vocabulary

## `GAME_SPECIFIC`

The implementation or policy expresses Signal 2000's actual game design. Reusing the idea elsewhere may be useful, but this code should not be treated as a generic contract.

## `REUSABLE_CANDIDATE`

A semantic capability is likely useful across projects, but the current implementation still contains policy or types that should be challenged by another consumer.

## `EXTRACT_NOW`

A shared extraction is justified now because doing so solves a current architectural problem independently of hypothetical future reuse.

**There are no `EXTRACT_NOW` mechanics in this pass.** Some modules are already generic enough to move, but moving code merely to create a library would violate the no-premature-abstraction rule.

## `WAIT_FOR_SECOND_CONSUMER`

The code or idea looks reusable, but the correct generic boundary should be defined only after another project needs the capability.

---

# 2. Inventory summary

| Capability | Current source | Classification | Current action |
| --- | --- | --- | --- |
| Durable pending reward transaction + recovery | `openingSession.ts`, `drops.ts`, `save.ts` | `REUSABLE_CANDIDATE` + `WAIT_FOR_SECOND_CONSUMER` | Preserve semantics/tests; do not extract current types |
| Presentation skip checkpoint | `presentationSkip.ts` | `WAIT_FOR_SECOND_CONSUMER` | Already isolated; leave in repo until a second consumer exists |
| Injected RNG + weighted selection | `random.ts` | `WAIT_FOR_SECOND_CONSUMER` | Already generic; keep local for now |
| Reward banking plan | `rewardBanking.ts`, `chipFlight.ts` | `REUSABLE_CANDIDATE` + `WAIT_FOR_SECOND_CONSUMER` | Reuse the semantic model, not CHIPS/Hidden Pocket types |
| Collection milestones | `collectionMilestones.ts` | `REUSABLE_CANDIDATE` + `WAIT_FOR_SECOND_CONSUMER` | Keep pure resolver; second project should define generic milestone policy |
| Continuous interaction state | inline in `OpeningScene.ts`, audio API | `REUSABLE_CANDIDATE` + `WAIT_FOR_SECOND_CONSUMER` | Document progress/velocity boundary; no gesture framework yet |
| Collection snapshot / near completion | `collection.ts` | `REUSABLE_CANDIDATE` | Keep local until another collection game needs it |
| Duplicate conversion | `pouches.ts`, `openingEconomy.ts` | `GAME_SPECIFIC` idea with reusable grammar | Do not extract CHIPS policy |
| Progress / pity-like Signal | `pouches.ts`, `signal.ts` | `GAME_SPECIFIC` implementation | Reuse only the concept if another project needs it |
| Bonus / secondary reveal | `pouches.ts`, `drops.ts` | `GAME_SPECIFIC` implementation | Hidden Pocket remains local |
| Overcharge multiplier | `overcharge.ts`, `pouches.ts` | `GAME_SPECIFIC` | Keep local |
| Pouch/reward resolver | `pouches.ts` | `GAME_SPECIFIC` | Keep local; this is the actual game design |
| Save schema + migrations | `save.ts` | `GAME_SPECIFIC` implementation with reusable transaction lesson | Never extract wholesale |
| Reward tray placement | `rewardLayout.ts` | `GAME_SPECIFIC` presentation policy | Keep local |

---

# 3. Durable pending reward transaction / recovery

**Classification:** `REUSABLE_CANDIDATE` + `WAIT_FOR_SECOND_CONSUMER`  
**Reuse priority:** highest

## Semantic capability

A reward can be resolved and persisted as a durable pending transaction **before** its presentation is completed. If the app reloads, storage reports an ambiguous failure, the scene is recreated, or the user resumes later, the exact same resolved reward is reused instead of rerolled.

The transaction then commits exactly once into durable progression.

Conceptually:

```text
base durable state
→ resolve deterministic transaction
→ persist pending transaction
→ present it
→ commit exact stored snapshot
→ clear pending marker
```

Presentation may be replayed/recovered; reward ownership may not be rerolled or duplicated.

## Current implementation

Primary files:

- `src/game/systems/openingSession.ts`
- `src/game/systems/drops.ts`
- `src/game/systems/save.ts`

`PendingReveal` stores both the semantic reward result and the exact future `commit` snapshot. `OpeningSession.prepareReveal()` returns an already-persisted pending reveal rather than creating another one. `commitReveal()` commits the staged snapshot and treats repeated commit calls as idempotent.

The session also handles an important storage failure mode: a storage promise can reject **after the underlying write became durable**. In that case it reloads state and accepts success only when the durable data matches the transaction it attempted.

## Durable owner

`SaveState.pendingReveal` plus the corresponding base state and `pending.commit` snapshot.

The animation sequence is not an owner.

## Test evidence

`tests/opening-session.test.ts` covers:

- persisting a full pending transaction before returning the reward;
- recovery without rerolling or creating another transaction id;
- exactly-once commit behavior;
- atomic Charged cost/reward staging;
- rejected unaffordable transactions leaving no pending state;
- ambiguous write-after-durable begin recovery;
- ambiguous write-after-durable commit recovery.

`tests/reward-engine.test.ts` additionally validates persistence/reload/idempotent commit as part of the reward integration.

## Signal-specific coupling

The current generic-looking transaction is actually coupled to:

- `SaveState`;
- `PendingReveal`;
- CHIPS;
- Signal;
- Overcharge;
- collection arrays;
- Hidden Pocket;
- active loot pool;
- Signal 2000 save migrations.

Do not export `OpeningSession` or `SaveRepository` as a future public API unchanged.

## Likely future abstraction boundary

A second game may prove a smaller capability resembling:

```text
prepare(baseState) -> durable pending transaction
recover() -> existing pending transaction | null
commit(pending) -> durable next state
```

with game-specific resolver, validator and persistence policy injected.

That is intentionally **not** a committed API yet.

## Extraction trigger

Another project needs a staged action whose gameplay result must survive interrupted presentation without rerolling/reapplying durable effects.

---

# 4. Presentation skip checkpoint

**Classification:** `WAIT_FOR_SECOND_CONSUMER`  
**Technical state:** already isolated and effectively generic

## Semantic capability

Skip affects presentation time, not gameplay truth. Exactly one currently registered presentation beat can be completed early, optionally behind a short guard window.

## Current implementation

`src/game/systems/presentationSkip.ts` has no Phaser or Signal 2000 dependencies. `PresentationSkipController` owns only a callback for the current skippable beat.

Its implementation deliberately clears the active callback before invoking it, preventing synchronous completion from double-firing the same beat. A disposer only unregisters the exact callback that created it, so an old beat cannot clear a newer one.

## Test evidence

`tests/presentation-skip.test.ts` verifies:

- one registered beat can be skipped exactly once;
- the guard does not consume the beat;
- disposing an older registration does not remove a newer one.

## Why not move it now

There is no current package boundary and no second consumer. Moving a 1 KB generic helper into a new repository would increase operational complexity without improving Signal 2000.

The correct current state is: **already reusable in design, physically local until reuse exists.**

## Extraction trigger

A second game has staged presentation with the same `skip one visual beat without changing durable semantics` requirement.

---

# 5. Injected gameplay RNG + weighted selection

**Classification:** `WAIT_FOR_SECOND_CONSUMER`  
**Technical state:** generic utility

## Current implementation

`src/game/systems/random.ts` defines:

- `RandomSource`;
- `MathRandomSource`;
- validated `nextUnit()`;
- generic `pickWeighted<T>()`.

The reward engine accepts an injected `RandomSource`, which makes reward behavior deterministic under tests and helps keep gameplay RNG separate from presentation randomness.

## Reuse value

The important pattern is not the weighted helper itself. It is the explicit **gameplay RNG dependency boundary**.

That supports:

- deterministic tests;
- no accidental dependence on animation randomness;
- clearer replay/recovery semantics.

## Extraction trigger

A second game needs deterministic/testable gameplay randomness. The exact helper may move almost unchanged, but creating a library for this utility alone has no value.

---

# 6. Reward banking plan

**Classification:** `REUSABLE_CANDIDATE` + `WAIT_FOR_SECOND_CONSUMER`

## Semantic capability

A durable reward can expose a presentation plan describing **where value came from, who owns each presentation page, and how much must visually bank**, while the animation itself does not own the wallet transaction.

This is a strong architectural split:

```text
durable reward already resolved
→ derive pure banking plan
→ animate transfer
→ visual destination acknowledges arrival
```

## Current implementation

`src/game/systems/rewardBanking.ts` creates a pure `RewardBankingPlan` from `PendingReveal`.

Current Signal-specific legs:

- `base`;
- `cache`;
- `recycle`;
- `overcharge`;
- `secret`.

Current owners:

- `standard`;
- `secret`.

Hidden Pocket results can produce two banking pages; page ordering follows the result carousel page the player is currently viewing.

`src/game/systems/chipFlight.ts` separately derives bounded duration, emission window and audio stride from amount, keeping large rewards from producing unbounded presentation duration/audio spam.

## Test evidence

`tests/reward-banking.test.ts` verifies:

- ordinary opening ownership;
- standard → Secret ordering;
- Secret → standard ordering when Secret is active;
- totals are preserved regardless of order;
- zero-value legs disappear without changing ownership semantics.

`tests/chip-flight.test.ts` covers transfer timing behavior.

## Coupling that must not leak into a generic API

- CHIPS naming;
- Hidden Pocket semantics;
- standard/Secret page identities;
- current five reward-leg kinds;
- carousel index as the generic ordering input.

## Extraction trigger

Another project needs to present a committed multi-source or multi-destination reward/transformation without allowing animation to own durable value.

The second consumer should define whether the true reusable abstraction is `banking plan`, `transfer plan`, or something smaller.

---

# 7. Collection milestones

**Classification:** `REUSABLE_CANDIDATE` + `WAIT_FOR_SECOND_CONSUMER`

## Semantic capability

Derive a one-shot presentation event from a transition between pre-commit and committed collection/progress state.

## Current implementation

`src/game/systems/collectionMilestones.ts` is a pure resolver. It currently knows four game rules:

- standard halfway;
- standards complete;
- first Secret;
- Secrets complete.

It deliberately emits at most one milestone for an opening and applies Signal-specific priority between simultaneous milestones.

## Test evidence

`tests/collection-milestones.test.ts` verifies threshold crossing, non-replay, simultaneous-event priority, first Secret, Secret completion and unknown saved IDs.

## Reuse boundary

The reusable idea is **transition-derived one-shot milestones after durable mutation**.

The current milestone names, halfway rule, standard/Secret split and priority order are policy and remain local.

## Extraction trigger

A second game needs declarative milestones derived from before/after committed state. At that point compare whether a generic threshold/event rule engine is actually simpler than project-local pure functions.

---

# 8. Continuous interaction semantic state

**Classification:** `REUSABLE_CANDIDATE` + `WAIT_FOR_SECOND_CONSUMER`

## Semantic capability

A continuous gesture should expose semantic interaction values to presentation rather than making every feel system reason directly from raw pointer coordinates.

Useful values observed here:

- normalized progress;
- normalized velocity;
- direction/delta where relevant;
- completion/cancel state.

## Current implementation

This boundary is **not yet a standalone system**.

`OpeningScene` stores drag state and computes normalized progress/velocity during `handlePointerMove`. The continuous tear sound then receives semantic `(progress, velocity)` through `getGameAudio().setDragTexture(...)`.

This is valuable evidence that the semantic boundary works, but it is not evidence that every future game needs a common drag/gesture controller.

## Why no local refactor now

The interaction is currently stable and the raw pointer-to-tear geometry is intentionally guarded. Extracting a generic gesture framework now would touch a high-value, already-polished interaction for hypothetical reuse.

That is poor risk/ROI.

## Extraction trigger

The next game has a materially different continuous interaction (for example placement, rubbing, painting, decorating, cleaning or breaking) and still needs the same progress/velocity-to-feel boundary. Compare both interactions first, then extract only their true common semantic state.

---

# 9. Collection snapshot and near-completion state

**Classification:** `REUSABLE_CANDIDATE`

## Current implementation

`src/game/systems/collection.ts` derives:

- per-family owned standard/Secret state;
- global collection counts;
- featured shelf item priority;
- `one item missing` near-completion state globally or per loot pool.

These are pure read models over durable collection state.

`tests/reward-engine.test.ts` confirms that adding another family does not require special-case transaction/collection code and verifies shelf priority. `tests/near-completion.test.ts` covers near-completion behavior.

## Reuse assessment

The general idea—derive pure UI/progression read models from durable state—is strongly reusable.

The actual schema is not generic:

- four standard rarities;
- Secret tier;
- family structure;
- shelf priority;
- loot pools.

Do not extract until another collection-like project proves shared structure.

---

# 10. Duplicate conversion

**Classification:** `GAME_SPECIFIC` implementation; reusable reward grammar

## Current implementation

Duplicate handling is part of `src/game/systems/pouches.ts`:

- a duplicate receives rarity-dependent recycle CHIPS;
- it advances Signal when applicable;
- duplicate statistics update in the transaction commit;
- presentation later communicates conversion rather than discovery.

`tests/reward-engine.test.ts` verifies recycle CHIPS, Signal gain and duplicate stats are committed together.

## Reuse assessment

The reusable product idea is:

> `redundant outcome → meaningful progression/conversion`

The current CHIPS amounts, Signal interaction and rarity mapping are Signal 2000 game design. Do not create a generic `DuplicateSink` API yet.

---

# 11. Signal progress / pity-like meter

**Classification:** `GAME_SPECIFIC`

## Current implementation

Signal is distributed across:

- `src/game/systems/pouches.ts` — gain/lock consumption/retention during reward resolution;
- `src/game/systems/signal.ts` — completion helpers and legacy migration;
- `src/game/systems/openingEconomy.ts` — presentation/read-state helpers;
- `src/game/systems/save.ts` — persisted invariants and validation.

The meter is not simply `number + threshold`; it interacts with eligible missing rarities, Charged pouch reachability, duplicates and Overcharge state.

## Reuse assessment

A generic progress-to-guarantee mechanic may eventually emerge, but extracting Signal itself would leak too many assumptions.

If another game needs pity/progress, implement its actual rules first and compare the two policies.

---

# 12. Hidden Pocket / bonus reveal

**Classification:** `GAME_SPECIFIC`

## Current implementation

`src/game/systems/pouches.ts` owns:

- start-opening gate;
- per-pouch probability;
- Secret candidate selection;
- preference for undiscovered Secrets;
- fixed bonus CHIPS;
- durable inclusion in the same pending transaction.

`PendingReveal.hiddenPocket` then drives presentation and second-page banking semantics.

## Reuse assessment

The abstract grammar `primary result → optional bounded secondary result` is useful. Hidden Pocket's probability, collection behavior, bonus currency and carousel presentation are not generic.

Wait for a second game with a genuinely similar secondary reveal before defining an API.

---

# 13. Overcharge

**Classification:** `GAME_SPECIFIC`

`src/game/systems/overcharge.ts` is clean pure logic, but purity alone does not make a system generic.

Overcharge is coupled to:

- armed Signal lock;
- lock consumed vs retained;
- CHIPS earned during the same opening;
- hundredths multiplier representation;
- pouch-specific gain;
- game cap rules.

Keep it local. A future multiplier mechanic should not inherit this state machine merely because this implementation is testable.

---

# 14. Pouch / reward resolver

**Classification:** `GAME_SPECIFIC`

`src/game/systems/pouches.ts` is the central Signal 2000 reward policy. It owns or coordinates:

- family and rarity weighted selection;
- onboarding protected openings;
- Signal guarantee behavior;
- duplicate detection/recycle;
- base/cache CHIPS;
- Overcharge;
- Hidden Pocket;
- Charged pouch cost/profile;
- reward-economy analysis.

This module is data-driven enough to scale Signal 2000 content, but that is different from being a generic microgame reward engine.

`tests/lite-pouches.test.ts` and `tests/reward-engine.test.ts` are evidence that this **game's** policy is robust. They are not evidence that another game should consume the same resolver.

Do not wrap it in a generic `createRewardLoop()` facade at this stage.

---

# 15. Save schema and repository

**Classification:** `GAME_SPECIFIC` implementation with one highly reusable architectural lesson

`src/game/systems/save.ts` includes:

- current Signal 2000 schema/version;
- migrations from old game versions;
- validation of CHIPS, Signal, Overcharge, rarity and Hidden Pocket invariants;
- validation that a pending transaction matches its exact base state;
- staging and committing pending reveals;
- repository persistence.

This should **not** be moved wholesale into a shared package.

The reusable lesson is the transaction boundary described in section 3. Future games should be free to have completely different save shapes and migration histories.

---

# 16. Presentation-only mechanics adjacent to this inventory

These are important, but they belong to the feel/presentation reuse track rather than core gameplay extraction:

- pointer-driven perspective/material response in `src/game/ui/pouchPerspective.ts` + `OpeningScene.update()`;
- idle hero drift and environment parallax in `OpeningScene.update()`;
- audio state/mix ownership in `src/game/systems/audio.ts` + `src/game/data/audioPresentation.ts`;
- rarity/reveal/settle policy in `src/game/data/presentation.ts`;
- silhouette/result visual primitives in `src/game/ui/openingVisuals.ts`;
- responsive reward/economy visuals in `src/game/ui/openingEconomyVisuals.ts`;
- chip transfer choreography in `chipFlight.ts` and `OpeningScene`.

These should get a separate implementation inventory if/when we prepare a second project. The cross-project reasoning is already recorded in the decisions repository's game-feel doctrine and pattern catalog.

---

# 17. Infrastructure intentionally out of scope

This pass does not classify platform infrastructure such as:

- Yandex SDK bootstrap;
- ads/activity integration;
- analytics;
- local/cloud storage adapters;
- localization;
- render density/layout utilities;
- settings persistence.

Some may become reusable later, especially Yandex platform adapters, but they are not gameplay mechanics and should not be mixed into the first mechanic API decision.

---

# 18. Refactor decision for Signal 2000

After reviewing the implementation and tests, **no behavior-preserving mechanics refactor is required right now solely to prepare for reuse**.

Reasons:

1. the highest-value generic-looking pieces (`presentationSkip.ts`, `random.ts`) are already isolated;
2. the highest-value architectural pattern (pending reward transaction) is correctly separated from presentation but intentionally coupled to this game's durable schema;
3. the remaining mechanics encode real product policy and would require invented generic interfaces to extract;
4. touching the polished opening loop without a concrete second consumer would increase regression risk while producing little current-game value;
5. the existing tests give the next project a strong reference for expected semantics without requiring a library today.

The correct near-term optimization is **discoverability and preservation of clean seams**, not code movement.

---

# 19. Second-consumer protocol

When the next Yandex Games project begins:

1. Start from that project's own mechanic and durable-state model.
2. Mark which capabilities from this inventory it actually needs.
3. Implement or prototype the second project's policy without forcing Signal 2000's types onto it.
4. Compare the two implementations at the semantic boundary.
5. Separate shared mechanism from project policy/configuration.
6. Only then decide whether shared code is cheaper than two small local implementations.
7. If extracting, make both projects consumers before calling the contract stable.
8. Record integration pain as evidence; if one game requires adapters everywhere, the abstraction is probably wrong.

A future shared package should emerge from repeated production needs, not from renaming Signal 2000 concepts.

---

# 20. Recommended extraction order if future evidence supports it

If the second consumer validates the need, evaluate in this order:

1. **pending durable action / transaction semantics**;
2. **presentation skip checkpoint**;
3. **gameplay RNG boundary / weighted selection**;
4. **reward/value transfer plan**;
5. **continuous interaction semantic state**;
6. **milestone transition evaluation**;
7. collection-specific read models only if the second game is also collection-driven.

Signal/Overcharge/Hidden Pocket/CHIPS policy should remain last and should probably never be extracted as-is.

## Current stop condition

This inventory is enough to prevent rediscovery and premature abstraction. Do not continue refactoring mechanics merely to make the repository look more library-like.

The next meaningful evidence should come from either:

- a concrete Signal 2000 maintenance problem that benefits from a local seam; or
- a second project asking for one of the capabilities above.
