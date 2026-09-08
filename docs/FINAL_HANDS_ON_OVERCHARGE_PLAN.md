# Final hands-on correction + Signal Overcharge

Status: **IMPLEMENTED / EXACT-AUDITED / FINAL DIRECT REGRESSION ACCEPTED**.

This document is the canonical contract for the implemented Phase 2.6 correction and Signal Overcharge extension. The legacy Lite V2 pouch/cache/rarity/recycle values remain unchanged; the new Overcharge state/economy/presentation passed exact technical/browser validation and the final direct repeated-use regression. Hosted Yandex DRAFT is now the next gate.

The pass must remain bounded: fix the observed UI/input issues, make Signal and Secret self-explanatory, add one small Signal-to-economy extension, simulate its tuning, and stop. It is not permission to add a shop, multiple currencies, crafting, auto-open, new families or a large meta layer.

---

# 1. Direct hands-on findings

The latest hands-on found eight concrete issues/opportunities:

1. the opaque black rarity backing looks visually foreign to the rest of the result UI;
2. long reward rows can overflow, especially Legendary recycle copy;
3. Signal lacks a clear player-facing purpose/cause→effect story;
4. repeated unaffordable-Charged clicks can accumulate denial-tween displacement;
5. affordable paid pouches that are not selected need a restrained availability affordance;
6. Secret discovery is visually special but its reward meaning is not explicit;
7. Secret reveal needs a stronger premium feel peak/settle;
8. at full eligible-standard completion, an armed `4/4` Signal can remain useful only if it gains a secondary role.

These findings justify one bounded pre-DRAFT correction/extension pass.

---

# 2. Pass A — UI/input defects

## 2.1 Rarity badge

Keep rarity prominent, but remove the opaque black rectangular backing.

Target treatment:

- integrated tinted/outlined capsule or equivalent lightweight rarity treatment;
- rarity color remains obvious;
- item name remains the primary title;
- no large solid black block;
- verify Common/Rare/Epic/Legendary/Secret in EN/RU at 800/900/1280 widths.

## 2.2 Reward tray overflow

Reward rows must fit the supported compact layout without clipping.

Requirements:

- long recycle + rarity copy must not overflow;
- prefer a compact semantic ordering or a small rarity sub-tag rather than shrinking all reward typography;
- layout must be validated with Legendary + recycle + cache + Signal in the same tray;
- keep semantic reward colors, but do not turn the tray into a rainbow.

## 2.3 Charged denial re-entry

Rapid unaffordable-Charged input must never accumulate transform drift.

Requirements:

- kill/replace the active denial tween before starting another;
- reset the control to its canonical base transform before every denial response;
- repeated clicks remain acknowledged but bounded;
- no economy/selection mutation.

## 2.4 Available paid-pouch affordance

An affordable paid pouch that is not currently selected may use a rare, subtle nudge/pulse to communicate availability.

Constraints:

- no permanent shake;
- Basic/free does not need this attention pattern;
- selected pouch does not nudge;
- cadence must stay calm enough for future multi-pouch/multi-Drop UI.

---

# 3. Pass B — Signal clarity

The UI must teach the loop without a modal:

> duplicate → `+1 SIGNAL` → `4/4 LOCK READY` → lock is retained or consumed → visible consequence.

## 3.1 Signal reward copy

When Signal is gained, the reward tray should communicate progress, not only `+1 SIGNAL`.

Direction:

```text
SIGNAL +1 · 3/4
```

At threshold:

```text
SIGNAL +1 · LOCK READY
```

The exact localized copy may change for fit, but the progress/result meaning must remain explicit.

## 3.2 Lock ready

At `4/4`:

- Signal HUD gives a short electronic readiness pulse;
- the relevant eligible paid pouch may receive a linked visual response;
- UI clearly reads `LOCK READY` rather than leaving four anonymous filled segments.

## 3.3 Lock retained

If the selected pouch has no eligible missing standard item:

- the roll proceeds normally;
- Signal stays armed;
- UI explicitly communicates that the lock was retained rather than silently doing nothing;
- Overcharge rules in section 5 apply when Signal was already armed before the opening.

## 3.4 Lock consumed

When an eligible NEW is guaranteed:

- current reward resolves normally;
- UI shows `LOCK CONSUMED` / equivalent;
- energy/discharge should visually connect Signal to the guaranteed result;
- the durable transaction may already contain Signal `0/4`; the **displayed** Signal reset/discharge is staged only after the current reward/Overcharge cash-out has been presented.

---

# 4. Pass B — Secret semantics and feel

## 4.1 Reward meaning

Current runtime only rolls an undiscovered Secret; the current slice does **not** roll Secret duplicates. Therefore a Secret currently represents a collection discovery, not recycle income.

The result/reward presentation must say this explicitly, for example:

```text
SECRET DISCOVERED
ADDED TO COLLECTION
```

or an equivalent compact reward-tray row.

Do not invent a Secret CHIPS payout merely to fill the tray. If Secret duplicates are introduced later, their recycle/economy rule becomes a separate design decision.

## 4.2 Secret celebration

Hidden Pocket remains the strongest surprise beat.

Add a bounded premium effect:

- moving diffuse aura/cloud behind the Secret;
- restrained drifting particles/sparkles;
- stronger reveal burst;
- stronger but short object shake/overshoot;
- energetic peak followed by a calm premium settle.

Avoid a permanent fireworks loop or full-screen visual noise.

---

# 5. Signal Overcharge — approved mechanic

## 5.1 Purpose

Overcharge gives an armed Signal value when its collection lock cannot currently be consumed. It also makes the Signal system legible and creates a small economic decision between continuing to farm and spending CHIPS on a more eligible pouch.

It is a secondary state of the existing Signal system, not a new currency.

## 5.2 State model

Signal still uses the existing `0/4 → 4/4` pity model.

Overcharge is inactive at `x1.00`.

The key ordering rule:

> the multiplier used for an opening is the multiplier that existed **before that opening's reward was calculated**. The complete Overcharge transition for that opening is predetermined and persisted inside the same recoverable reveal transaction; only its **player-facing gain/reset presentation** happens after the reward is shown.

Consequences:

- an opening that first moves Signal `3/4 → 4/4` does **not** also gain Overcharge;
- if Signal was already `4/4` and the lock is retained, the current multiplier applies to this opening, then the selected pouch adds Overcharge for the **next** opening;
- if Signal was already `4/4` and the lock is consumed, the current multiplier still applies to this opening, then resets to `x1.00`;
- if Overcharge is already at cap and the lock is retained, the multiplier still applies but no fake `+gain` mutation/flight is shown.

Atomicity requirement:

- `pendingReveal` must persist multiplier-before, actual bonus CHIPS, multiplier-after and whether the transition was retained/consumed/capped;
- refresh/recovery must replay the exact economic outcome without recalculating Overcharge from current UI state;
- tweens/count-ups/token flights never mutate the durable multiplier.

## 5.3 CHIPS calculation

Multiply all CHIPS earned by the pouch opening, not pouch cost and not external grants.

```text
rawEarned = baseChips + cacheBonus + recycleChips
overchargeBonus = round(rawEarned * (multiplier - 1))
finalEarned = rawEarned + overchargeBonus
walletDelta = finalEarned - pouchCost
```

Round once at the bonus/final-earned boundary; do not round each component independently.

Hidden Pocket/Secret collection value itself is not multiplied because it is not CHIPS.

## 5.4 Pouch-specific gain

Each pouch profile owns an `overchargeGain` tuning value.

Current Phase 2.6 validation tuning:

```text
Basic   +0.10
Charged +0.50
```

These values are implemented in typed pouch profiles and passed the current EV sanity/transaction/browser gates. They are locked for this validation candidate, not claimed as immutable public-release balance. Future pouch types may use different gains.

When a pouch gain would cross the cap, apply only the real clamped delta. Example: `x1.40 + 0.50` with cap `x1.50` resolves as actual gain `+0.10`, not `+0.50`. Presentation must report the actual applied delta.

## 5.5 Cap

Overcharge has a finite current validation cap of **x1.50** (`150` hundredths). This is implemented and locked for the Phase 2.6 candidate; content-scale release balancing may reopen it only from evidence.

At cap:

- multiplier continues to apply to every eligible CHIPS reward;
- no `OVERCHARGE +X` line is shown because no value changed;
- no fake energy token flies to the HUD;
- reward/HUD may show `OVERCHARGE MAX` / `MAX OVERCHARGE ACTIVE`;
- max state uses a visibly saturated treatment rather than looking disabled.

The validation pass compared lower-cap alternatives conceptually/through EV sanity work and selected `x1.50` for the current candidate. Do not raise it further without new economy evidence.

## 5.6 Completion behavior

If the active Drop/selected-pouch eligibility leaves the lock with nothing to guarantee, Signal does not become dead UI.

It remains `4/4` and Overcharge can continue to provide/cap an economic multiplier until an eligible future lock target exists.

When later content or another eligible pouch makes a guaranteed NEW possible, the existing lock may consume normally and discharge Overcharge after the cash-out opening.

---

# 6. Overcharge presentation

## 6.1 Signal HUD states

### Inactive

```text
SIGNAL 2/4
OVERCHARGE x1.00
```

`OVERCHARGE` and `x1.00` are deliberately low-contrast / nearly dormant.

### Active

```text
SIGNAL 4/4 · LOCK
OVERCHARGE x1.20
```

Active Overcharge uses the established electric/cyan language.

### Maximum

```text
SIGNAL 4/4 · LOCK
OVERCHARGE x1.50 · MAX
```

Maximum uses a hot-pink/coral-red overloaded state, distinct from both dormant and normal cyan active states. It should read as saturated power, not an error.

A tiny segmented Overcharge progression indicator is allowed only if it improves comprehension without overcrowding the existing Signal card.

## 6.2 Current-opening bonus in reward tray

When multiplier > `x1.00`, explicitly show the contribution.

Example:

```text
+37 CHIPS
OVERCHARGE x1.20   +0 → +7
TOTAL +44 CHIPS
```

The exact composition can be compacted, but the player must be able to see:

- raw earned CHIPS;
- active multiplier;
- additional CHIPS caused by Overcharge;
- final total.

The Overcharge bonus value should count from zero to its final value. The main CHIPS total may simultaneously count from raw to final if the motion remains readable.

When multiplier is `x1.00`, do not add an unnecessary Overcharge bonus row to ordinary rewards.

## 6.3 Gain after reward

If lock is retained and multiplier is below cap, the final reward-tray beat shows the **actual applied** pouch contribution after clamping to cap, for example:

```text
OVERCHARGE +0.10
```

or:

```text
OVERCHARGE +0.50
```

Then a small energy fragment travels from the reward tray to the Signal HUD and the HUD counts/punches:

```text
x1.20 → x1.30
```

This happens **after** the current reward calculation/presentation.

If the configured pouch gain is larger than the remaining headroom, show only the applied delta and then enter MAX (for example `+0.10 → MAX`). Never show the nominal `+0.50` when only `+0.10` was persisted.

## 6.4 Cap after reward

If already at cap:

```text
OVERCHARGE MAX
```

No fake gain amount and no gain flight.

## 6.5 Discharge

When lock consumes:

1. current multiplier still contributes to the current CHIPS reward;
2. guaranteed NEW/lock consumption is communicated;
3. energy visibly discharges from Signal toward the result;
4. multiplier resets after the cash-out:

```text
OVERCHARGE x1.50 → x1.00
```

Discharge/reset should be a stronger beat than an ordinary `+0.10` gain.

---

# 7. Economy tuning status

The mechanic contract and current Phase 2.6 validation tuning are implemented. Legacy Lite V2 balance remains unchanged; only Overcharge uses the selected Basic `+0.10`, Charged `+0.50`, cap `x1.50` parameters. Public-release/content-scale rebalancing remains a later evidence gate.

Before locking numbers, simulate at minimum:

- Basic/Charged gain combinations such as `+0.05/+0.15`, `+0.10/+0.25`, `+0.10/+0.50`;
- caps `x1.30`, `x1.50`, and only if viable a higher cap;
- expected duration of retained-lock streaks;
- extra CHIPS EV per Basic/Charged opening;
- time-to-60 Charged affordability;
- cache/Big/Mega jackpot interaction with multiplier;
- all-duplicate Charged net-return invariant;
- complete-Drop long-run CHIPS inflation;
- future expensive-pouch price bands.

The existing economy remains the baseline comparator.

---

# 8. Future expensive pouch — hypothesis, not this pass

Overcharge creates a useful foundation for a later high-cost sink, but this pass does not implement one.

Candidate direction:

- several hundred CHIPS rather than ~60;
- high-tier rarity profile and/or materially higher Secret access;
- possibly a future Secret-guarantee rule only if collection scale supports it;
- intended to become reachable more comfortably through sustained Overcharge without making Basic/Charged obsolete.

Price, contents, eligibility and Secret guarantees require economy/content-scale simulation. Do not commit them now.

---

# 9. Implementation order

1. **UI/input bug pass** — rarity treatment, reward overflow, Charged denial drift, available paid-pouch affordance.
2. **Signal/Secret clarity pass** — Signal gain/ready/retain/consume communication; explicit Secret collection reward meaning.
3. **Secret feel pass** — aura/cloud, burst, particles, stronger bounded shake/settle.
4. **Signal Overcharge engine + transaction/save model** — deterministic and recovery-safe before presentation polish.
5. **Overcharge reward/HUD presentation** — bonus count-up, post-reward gain, cap, discharge.
6. **Economy simulation/tuning** — choose pouch gains/cap only from results.
7. **Exact browser/video audit + direct hands-on regression**.
8. If accepted, proceed to real Yandex DRAFT.

Do not implement the future expensive pouch in this sequence.

---

# 10. Validation requirements

Technical:

- strict typecheck;
- full unit suite;
- asset self-test/validation;
- production build;
- deterministic transaction/recovery tests for Overcharge gain/cap/consume/reset;
- no double bonus or reroll after refresh;
- pouch cost excluded from multiplier;
- exact final wallet equals committed transaction.

Browser/visual:

- EN/RU 800/900/1280;
- Common/Rare/Epic/Legendary/Secret result treatment;
- maximum-density reward tray;
- 20+ rapid unaffordable Charged clicks without drift;
- Signal `3/4 → 4/4`;
- retained lock + first Overcharge gain;
- active multiplier reward count-up;
- different Basic vs Charged Overcharge gains;
- cap entry + repeated MAX opening;
- lock consume + cash-out + reset;
- complete-Drop Overcharge behavior;
- Hidden Pocket collection reward + stronger Secret celebration;
- recovery/reload during each new durable state transition.

Generated artifacts do not self-approve; manual review and direct hands-on remain required.

Final direct regression outcome (2026-09-08): **ACCEPTED** after one bounded lifecycle correction. The repeated-use pass exposed a stale Overcharge bonus-counter tween calling `setText()` after its reward tag had been destroyed during accelerated result teardown. PR #50 guarded those callbacks without changing economy/save semantics. The exact fixed tree then passed **86/86** browser assertions: 10 targeted retained-lock Overcharge stress openings through `x1.50/MAX`, plus a fresh 24-opening normal loop with 6 Charged openings, duplicates, Signal retain/consume behavior and Collection round-trips; runtime/request/HTTP failures were zero and screenshots/video were manually reviewed.
