# Signal 2000 — onboarding

**Status:** CURRENT RUNTIME / HANDS-ON PENDING — implementation merged; direct visual/repeated-use acceptance is the remaining local gate before hosted Yandex DRAFT validation.

This document is the canonical contract for first-run guidance. It intentionally keeps onboarding inside normal play instead of adding a separate tutorial UI or explanation screen.

> **Teach only the action the player must perform now; let the reward loop teach the rest.**

The onboarding has two directed product beats — the first Basic opening and the first Charged opening — plus two small contextual Signal explanations. Hidden Pocket, Overcharge, cache tiers and the rarity ladder are not tutorialized.

---

## 1. Primary onboarding — first Basic opening

The first launch begins with the authored Opening environment but **without the normal gameplay chrome**. The pouch itself owns the player's attention.

### Entrance choreography

1. A Basic pouch enters from above the normal gameplay position.
2. The entrance has a short arrival/whoosh cue.
3. A ground shadow is already present under the landing point. While the pouch approaches, that shadow contracts from a broader/softer footprint toward the normal pouch-shadow size and becomes slightly more grounded.
4. On contact, the pouch gets a short material landing cue / rustle.
5. The pouch visibly compresses on impact (`scaleY ↓`, `scaleX ↑`), rebounds slightly, then settles at the exact ordinary Opening position and scale.
6. The landing must read as one compact physical event; no physics system is required.

The settled pouch must be the same gameplay object/geometry the player will learn to use. Do not introduce a tutorial-only tear distance, hitbox or gesture.

### Teaching the tear

After the pouch settles, show a small animated pointer/ghost gesture at the star tear-tab. It demonstrates the normal pull direction and repeats only after a short idle delay.

Rules:

- no modal;
- no darkened tutorial overlay;
- no `Next` button;
- text is unnecessary when the motion is self-explanatory;
- the pointer disappears immediately when the player starts the intended star interaction;
- an aborted drag may restore the pointer after a short idle delay;
- the normal tear geometry and threshold remain unchanged.

### First reward

The first Basic opening is an authored onboarding transaction:

- starting wallet for a brand-new save: **10 CHIPS**;
- first Basic standard result: **guaranteed NEW Rare** from the active Drop;
- normal Basic base payout still applies: **6–10 CHIPS**;
- first Basic cache: **guaranteed `cache` tier at exactly +20 CHIPS**;
- no onboarding-specific Secret/Hidden Pocket injection;
- all reward fields are real transaction fields, not presentation fakes.

Therefore the ordinary post-first-opening wallet is normally **36–40 CHIPS** before any future normal luck. This intentionally puts the 60-CHIPS Charged milestone within sight without unlocking it immediately.

### UI reveal and completion

The normal gameplay UI is absent during the pouch entrance/tear lesson. Once the first pouch is successfully torn and the real reveal begins, the ordinary Opening UI appears and the game continues through the existing reveal/reward choreography.

When the first result becomes collectible, show a small pointer toward the ordinary `Tap to collect` / `Нажми, чтобы забрать` action. The pointer is guidance only; the existing result interaction remains the real control.

The primary onboarding is complete only after the player accepts the first result with the ordinary collect action. Reward commit and tutorial completion are deliberately separate: the first result may already be durable while the collect lesson is still unfinished. The save therefore keeps a durable `primaryCompleted` marker plus the exact committed first-result receipt until collect succeeds.

---

## 2. Refresh / interruption semantics

Refreshing the page during onboarding must restart **tutorial presentation**, never gameplay truth.

The rule is:

```text
refresh during first-run guidance
→ replay the directed entrance / gesture lesson from a safe visual checkpoint
→ if opening #1 already has a persisted pending transaction, reuse that exact transaction
→ never reroll, duplicate CHIPS, duplicate collection state or create a second transaction
```

Concrete cases:

- `totalOpens === 0`, no pending reveal: replay the full pouch entrance and allow the first tear to create the authored Rare/+20-cache transaction.
- `totalOpens === 0`, `pendingReveal.openingNumber === 1`: replay the onboarding entrance/tear presentation, but `prepareReveal()` must return the already persisted pending reveal. The subsequent Opening recovery shows that exact Rare/cache result.
- opening #1 committed but collect not yet accepted: replay the exact stored first-result receipt directly in the normal result UI; do not reroll or recommit the reward.
- `primaryCompleted === true`: primary onboarding is complete and must not restart. Existing pre-v5 saves with prior openings are grandfathered as complete because no exact historical receipt can be reconstructed safely.

The existing durable `pendingReveal` / ambiguous-write recovery contract remains authoritative. A live FirstRun → Opening handoff is not treated as reload recovery and therefore receives the full authored reveal; an actual reload of a staged transaction may use the abbreviated recovery reveal. Once opening #1 commits, its exact receipt remains durable until collect so refresh cannot erase the tutorial state or duplicate economy mutations.

The one-time 10-CHIPS starting grant is also treated as a durable write: if storage rejects after the underlying write may already have succeeded, the implementation reloads and accepts success only when the exact intended grant state is present.

---

## 3. Secondary onboarding — first Charged pouch

The second directed beat begins when a player can afford Charged for the first time.

### Trigger and pointer behavior

When the durable wallet reaches **60 CHIPS** and the player has not yet completed the first-Charged milestone:

1. show an animated pointer on the Charged selector;
2. selecting Charged hides the pointer immediately;
3. do **not** point at the star again — the player already knows the tear gesture;
4. if the player returns to Basic without opening Charged, show the Charged pointer again;
5. while a reveal is pending/in progress, suppress this selector pointer.

### First Charged presentation

The first selected Charged pouch gets one short, non-blocking premium emphasis before opening — e.g. a stronger local aura/ring/energy pulse around the pouch. It should feel like a milestone, not a new mechanic and not a second tutorial screen.

### First Charged reward

The first Charged opening is authored to guarantee a **NEW Legendary** from the active Drop whenever a missing eligible Legendary exists.

Reason: the game itself has just taught the player that 60 CHIPS buy a materially stronger pouch. Paying the full cost and immediately receiving a Common would create avoidable frustration at the exact moment the premium route is introduced.

The reward remains a real normal Charged transaction:

- cost is still 60 CHIPS;
- normal Charged base/cache/Hidden Pocket rules otherwise remain active;
- the guaranteed Legendary is stored in `pendingReveal` before presentation;
- refresh/recovery reuses the same Legendary;
- after this milestone, Charged returns to its normal `35 / 40 / 20 / 5` C/R/E/L distribution.

For the current product, completion can be derived without a new save flag: **Basic has zero standard Legendary weight, so owning any standard Legendary proves that at least one Charged Legendary has already committed.** The authored first Charged establishes that marker itself. Revisit this derivation only if a future mechanic can award standard Legendary collectibles outside Charged.

### Signal interaction

If Signal is already armed when the first Charged is opened, the authored Legendary must still obey the Signal contract:

- if the forced Legendary is an eligible missing standard, it also satisfies and consumes the armed Signal guarantee;
- do not grant a second additional guaranteed item;
- the exact Signal transition is part of the same persisted transaction;
- Overcharge cash-out/reset follows the existing transaction rules.

---

## 4. Signal guidance

Signal needs one-time explanation because its causal rule is not obvious, but it does **not** need a modal tutorial.

### First duplicate that charges Signal

On the first duplicate that actually produces Signal gain, show a non-blocking contextual message near the Signal HUD for roughly two seconds:

- RU: **`Дубликаты заряжают Сигнал`**
- EN: **`Duplicates charge Signal`**

The existing duplicate → Signal transfer remains the main teaching animation. The message only names the relationship.

### First full Signal

The first time Signal reaches `4/4`, show a second short contextual message:

- RU: **`Сигнал заряжен — следующий подходящий пакет даст новый предмет`**
- EN: **`Signal charged — the next eligible pouch guarantees something new`**

This is informational only and must not pause the opening loop.

These two hint-seen flags are presentation preferences, not economy state. They may live in a small separate local onboarding-hints record; losing that record may repeat a harmless hint but must never affect reward resolution.

### Signal waiting for Charged

When Signal is armed but Basic has no eligible missing standard while Charged does, communicate the live state near the Charged selector. This is recurring **state communication**, not a one-time tutorial.

Preferred copy:

- RU: **`Сигнал ждёт заряженный пакет`**
- EN: **`Signal is waiting for Charged`**

The existing `isSignalWaitingForCharged()` semantic condition remains the source of truth. The indicator must disappear when the condition is no longer true.

Guidance observes existing game-authored lifecycle/analytics events. `reveal_complete` carries the exact transaction-authored `signalGain`, so the first-duplicate hint does not infer causality by racing a later save read. Local guidance observers are isolated from the gameplay emitter: a presentation observer failure must not propagate back into reward or interaction flow.

---

## 5. Explicit non-goals

Do not onboard:

- Hidden Pocket;
- Overcharge;
- exact rarity odds;
- cache-tier taxonomy;
- collection navigation;
- every HUD element;
- the full Signal/Overcharge edge-case model.

Do not add a tutorial scene full of copy, a blocking stepper, a new currency, a quest system, tutorial-only gameplay geometry or a parallel fake reward path.

The player should experience:

```text
pouch physically arrives
→ learns one tactile action
→ receives a strong Rare + visible CHIPS progress
→ repeats the loop independently
→ reaches 60 CHIPS
→ discovers Charged
→ receives a strong Legendary payoff
→ game lets go of the player's hand
```

---

## 6. Economy boundary

This pass changes **new-player onboarding only**, not steady-state pouch tuning.

The Sep-10 full-game economy audit remains valid for normal Basic/Charged costs, base payouts, cache distributions, rarity distributions, recycle, Signal, Hidden Pocket and Overcharge after the authored onboarding exceptions.

One audited metric is intentionally superseded for new players: the old simulation started at 0 CHIPS with fully normal opening rolls and therefore measured first 60 CHIPS / first Charged around openings 6–8. New players now start at 10 CHIPS and opening #1 adds a fixed +20 cache, so first Charged should arrive materially earlier. This is the purpose of the onboarding change, not an accidental economy drift.

Do not use the onboarding grant as evidence to retune ordinary cache odds or Charged cost. Re-evaluate first-Charged timing from hosted/player evidence after this flow is live.

---

## 7. Compatibility review

Independent review against current product docs and runtime found **no blocking contradiction**.

Resolved tensions:

- Existing docs say Signal needs no tutorial modal. This remains true; the new Signal guidance is contextual and non-blocking.
- Existing docs say the normal tear hint appears only after idle time. That remains true after onboarding; the first-run pointer temporarily replaces it only for the initial directed lesson.
- The Sep-10 economy audit accepted the ordinary balance unchanged. The new +10 start and first +20 cache are one-time authored onboarding exceptions; normal distributions/costs remain unchanged. Only the audit's early first-Charged timing is superseded.
- Durable transaction rules prohibit presentation-owned rewards or rerolls. The onboarding guarantees are resolved into the real pending transaction before reveal and therefore preserve the existing anti-reroll/recovery architecture.
- Basic cannot produce a standard Legendary. That invariant makes standard-Legendary ownership a safe current marker for completion of the authored first-Charged milestone.

The implementation is merged without reopening the broader economy, pouch geometry, Signal rules, Hidden Pocket rules or the normal rarity tables.

---

## 8. Implementation evidence

Merged implementation: PR #149, squash commit `2f2a0dcad60e61896394c5f8ca831b374f5884ce`.

Automated gate is green:

- `npm ci`;
- `npm run typecheck`;
- `npm test`;
- `npm run assets:selftest`;
- `npm run assets:validate`;
- `npm run build`.

Focused tests cover first-Basic recovery, first-Charged Legendary guarantee, armed-Signal interaction and ambiguous starting-grant recovery.

Automated green does **not** complete the onboarding acceptance gate. The presentation-specific checks below still require direct hands-on review at real speed.

---

## 9. Acceptance checklist

The onboarding is accepted only if all of the following hold:

- brand-new save begins with 10 CHIPS;
- no gameplay chrome is visible before the first tear completes;
- first pouch enters from above with audible arrival, contracting ground shadow, landing material cue, squash and rebound;
- star pointer disappears on intended interaction and can return after an aborted idle;
- first Basic transaction is NEW Rare + normal 6–10 base + exactly +20 `cache` bonus;
- page refresh before first tear restarts the intro;
- page refresh after the first pending reveal was persisted never rerolls it;
- page refresh after opening #1 committed but before collect replays the exact committed result without a second commit;
- primary completion becomes durable only when first-result collect succeeds;
- the live first-run handoff uses the full reveal choreography, while true reload recovery may use the shortened recovery reveal;
- ordinary Opening UI appears for the first reveal;
- first result gets a collect pointer and the pointer disappears after collection;
- Charged pointer appears at affordability, hides on Charged selection, and returns if the player backs out to Basic without opening;
- first Charged transaction guarantees a NEW Legendary when eligible and remains exactly recoverable;
- an armed Signal consumed by that first Charged does not produce a second reward;
- subsequent Basic/Charged openings use the ordinary release-candidate distributions;
- first duplicate and first Signal-lock messages are short/non-blocking and do not mutate economy state;
- `Signal is waiting for Charged` follows the actual live eligibility condition;
- resize/orientation/reload do not duplicate onboarding transactions or leave stale pointer objects;
- typecheck, unit tests, asset self-test/validation and production build remain green;
- hands-on acceptance verifies the first pouch landing, pointer readability, first reveal handoff and first-Charged emphasis at real speed.
