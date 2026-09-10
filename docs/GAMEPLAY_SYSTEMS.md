# Gameplay systems

This is the canonical specification for the implemented gameplay loop plus the evidence-backed Opening Feel Correction now merged in current `main`. Balance numbers are provisional runtime tuning unless explicitly marked locked.

> **Basic Pouch → collectible + CHIPS → duplicate recycle + SIGNAL → save CHIPS → Charged Pouch → better roll → repeat**

The product goal remains simple: every opening should feel useful and tactile without turning the game into a large idle/economy system.

---

# 1. Core opener

## Current runtime mechanics

1. choose Basic or Charged;
2. show Mystery Pouch;
3. one short left-to-right star-tab drag;
4. predetermine and persist the complete reward transaction;
5. resolve CHIPS/cache + one standard collectible;
6. show rarity + NEW/duplicate state;
7. duplicate may recycle into CHIPS + Signal;
8. optional Hidden Pocket reveals one Secret;
9. commit/recover deterministically;
10. player continues.

Reveal remains in `OpeningScene`. No physics and no auto-dismiss.

## Current feel choreography

The merged correction keeps exactly the same mechanic/result contract and changes how the sequence reads:

```text
star grab response + `pouch-grab` material cue
→ drag tension
→ tear snap/recoil
→ short anticipation
→ if this opening consumes an armed Signal Lock: pink/cyan projectile leaves Signal HUD, trails into the still-closed pouch, and HUD resolves to the post-consume state
→ collectible arrival + rarity bloom only after the lock-consume impact completes
→ earned CHIPS/cache/recycle staged once beside result
→ optional Hidden Pocket
→ resolved readable result enters on a later beat while reward tray remains continuous
→ ordinary duplicate Signal +1, when present, transfers from reward tray to Signal HUD during the result/reward phase
→ retained/consumed Overcharge presentation resolves in the same pre-collect result phase
→ player accepts
→ base/cache/recycle bank to CHIPS HUD in order; Signal/Overcharge are not replayed during collect
→ next action
```

Intentional tapping during active presentation may fast-forward the current visual beat. It never changes the reward transaction.

Canonical detail: `OPENING_FEEL_CORRECTION_SCOPE.md`.

Current Drop-selection presentation is additionally governed by `OPENING_DROP_POLISH_2026-09-10.md`:

- the active Drop selector is a tactile bottom control with explicit `DROP N/6`, Standard and Secret progress;
- Drop paging previews immediately while durable `activeLootPoolId` reconciliation stays serialized and latest-selection-wins;
- Basic/Charged pouch geometry remains shared while the displayed Drop supplies a lightweight visual skin identity;
- the tear instruction is contextual idle help after ~5.5s, not permanent chrome;
- the Drop selector fades only once a full tear succeeds;
- every standard result keeps a persistent outline, while first discovery adds a materially stronger NEW beat.

---

# 2. Pouch profiles — CURRENT RUNTIME

## Basic

- cost `0 CHIPS`;
- always one standard collectible;
- base CHIPS `6–10`;
- independent cache roll;
- rarity C/R/E/L = `72 / 25 / 3 / 0`;
- Hidden Pocket `1.5%` from opening #4; missing Secrets are selected first, then Secret duplicate jackpots remain possible after collection completion;
- first three standard openings use undiscovered protection where eligible;
- opening #2 prefers a different family when possible.

Basic can never standard-roll Legendary, including through Signal pity.

## Charged

- cost `60 CHIPS`;
- one standard collectible;
- base CHIPS `18–24`;
- stronger cache profile;
- rarity `35 / 40 / 20 / 5`;
- Hidden Pocket `6%` from opening #4; missing Secrets are selected first, then Secret duplicate jackpots remain possible after collection completion;
- selected directly in Opening; no shop;
- remains selected while affordable and falls back to Basic when not.

Charged is the standard route to Legendary and materially improves Rare/Epic access.

The correction does not change these values.

---

# 3. CHIPS

CHIPS are the only spendable gameplay currency.

Purpose:

> **CHIPS answer “when can I afford a stronger opening?”**

Rules:

- one global wallet;
- earned by every pouch;
- duplicate recycle adds extra CHIPS;
- Charged spends CHIPS;
- not family/Drop-specific;
- separate from Signal.

## 3.1 Base payout + independent cache

```text
base CHIPS
+ independent cache bonus
+ optional duplicate recycle
- pouch cost
= final wallet delta
```

| Tier | Basic weight | Charged weight | Reward |
|---|---:|---:|---:|
| none | 90 | 78 | 0 |
| cache | 7 | 15 | 20–35 |
| big | 2.5 | 5.5 | 45–75 |
| mega | 0.5 | 1.5 | 120–180 |

Collectible rarity and cache are independent rolls.

Current expected all-duplicate Charged return remains below cost, so the CHIPS-sink invariant holds.

## 3.2 Current CHIPS presentation

Hands-on proved the old immediate-flight presentation was too weak/early. The merged correction now uses:

Current contract:

- Charged cost still reads at opening time;
- earned base/cache/recycle components first stage near the lower-left of the hero collectible;
- reward amounts remain aggregate truth; visible tokens stay bounded;
- player sees/accepts the result;
- base banks to HUD;
- cache banks next when present;
- recycle banks next when present;
- HUD number counts between displayed values;
- local CHIPS card reacts with bounded pulse/shake/glow;
- synthesized `chip-clack` sells the transfer with bounded audio density;
- final displayed wallet equals deterministic committed state.

Cosmetic staging/banking never owns durable currency state.

## 3.3 Charged-ready threshold

Current runtime uses a separate visible readiness beat. The correction changes the presentation relationship:

- readiness should trigger when the **displayed** wallet count crosses Charged cost during banking;
- CHIPS HUD and Charged control react together;
- concise `CHARGED POUCH READY` feedback may appear;
- it must not become a mandatory blocking pause.

Affordability logic itself remains unchanged.

---

# 4. Duplicate recycle

A standard duplicate resolves as:

> **DUPLICATE → RECYCLED → CHIPS + SIGNAL**

Current recycle CHIPS:

| Rarity | CHIPS |
|---|---:|
| Common | 2 |
| Rare | 4 |
| Epic | 8 |
| Legendary | 15 |

Mechanics remain unchanged.

Current presentation:

1. actual duplicate collectible reveals normally;
2. `DUPLICATE` remains readable;
3. a short scan/glint/conversion beat may reinforce recycle;
4. rarity-aware `RECYCLED +N · RARITY` stages near the item;
5. ordinary `SIGNAL +1`, when earned, transfers from reward staging to the Signal HUD before result acceptance;
6. the destination segment pulses/fills and the HUD shows the predetermined post-opening Signal state;
7. recycle CHIPS later bank to wallet after acceptance;
8. collect-time banking must not replay a second Signal/Overcharge transition.

The goal is to make a duplicate visibly become progress rather than add extra ceremony.

---

# 5. Signal pity

Signal is non-spendable duplicate protection.

```text
standard duplicate → +1 Signal
4/4 → SIGNAL LOCK
next standard roll with an eligible missing item → guaranteed NEW
consume → 0/4
```

A guarantee respects active loot pool + selected pouch profile.

When armed:

1. collect missing standard candidates in active pool;
2. filter zero-weight rarities for selected pouch;
3. if candidates remain, preserve selected-pouch weighting, guarantee NEW, consume lock;
4. otherwise perform normal selected-pouch roll and retain `4/4`.

Consequences remain:

- Basic pity cannot produce Legendary;
- Legendary-only missing state leaves Basic Signal armed;
- UI communicates `SIGNAL LOCK · CHARGED`;
- eligible Charged guarantees missing Legendary and consumes lock;
- complete Drop does not waste lock;
- armed duplicates do not overfill.

## Current Signal presentation

Use stronger electronic UI while preserving semantic separation from CHIPS:

```text
SIGNAL
◆ ◆ ◆ ◇
03 / 04
```

At lock, use a brief electronic pulse/flicker/glitch. No long blocking animation.

Consumed-lock choreography is now locked presentation behavior:

```text
closed pouch + armed 4/4
→ Signal projectile leaves HUD with visible pink/cyan trail
→ projectile impacts the still-unrevealed pouch
→ HUD already shows the predetermined post-consume state
→ only then may the standard collectible reveal begin
```

Ordinary duplicate `SIGNAL +1` remains a post-reveal reward/result transfer and completes before collect. Fast-forward may shorten the visual beats but must preserve this semantic order.

## 5.1 Signal Overcharge — CURRENT PHASE 2.6 RUNTIME

Canonical contract: `FINAL_HANDS_ON_OVERCHARGE_PLAN.md`. Current validation tuning is Basic `+0.10`, Charged `+0.50`, cap `x1.50`.

When Signal was already `4/4` before an opening and the selected pouch has no eligible missing standard item, the lock is retained and Overcharge gives Signal a secondary economic role.

Locked semantics:

```text
rawEarned = base + cache + recycle
bonus = round(rawEarned * (multiplier - 1))
finalEarned = rawEarned + bonus
```

- pouch cost is not multiplied;
- first `3/4 → 4/4` does not gain Overcharge on the same opening;
- retained lock: current multiplier applies, then pouch-specific gain affects the next opening;
- consumed lock: current multiplier applies to the cash-out opening, then resets to `x1.00`;
- finite cap remains an active max multiplier; cap state shows MAX rather than fake `+gain`;
- current candidate uses Basic `+0.10`, Charged `+0.50`, cap `x1.50`; reopen only from later hosted/content-scale evidence.

Durable truth remains transaction-first: the Overcharge before/bonus/after transition is prepared with `pendingReveal`; reward-tray/HUD gain or discharge is only delayed presentation of that stored result. Near cap, the persisted/displayed gain is the actual clamped delta, not the pouch's nominal configured gain.

Presentation must make inactive/active/MAX states, bonus CHIPS, post-reward gain and discharge/reset visible.

---

# 6. Hidden Pocket — CURRENT RUNTIME

- disabled openings #1–3;
- Basic from #4: `1.5%`;
- Charged from #4: `6%`;
- while Secrets are missing, Hidden Pocket selects a missing Secret first;
- after `2/2`, Hidden Pocket remains alive and may resolve to a Secret duplicate jackpot;
- at most one Secret per opening.

Current Secret value is a separate fixed `+40 CHIPS` jackpot plus collection discovery when new. Secret duplicates also award `+40 CHIPS` without adding another collection ID. The Secret bonus is not multiplied by Overcharge.

Hidden Pocket remains the strongest surprise beat. New neon/rarity treatment must not flatten it.

---

# 7. Drops / loot pools — CURRENT RUNTIME

Current production content is **6 themed Drops / 12 families / 60 collectibles**. Each Drop contains two families, eight standards and two Secrets.

Current navigation/loading contract:

- Collection exposes all six Drops through its pager;
- browsing a non-active Drop lazy-loads that Drop's authored collectible art before rendering it;
- Collection browsing itself is non-durable;
- returning to Opening passes the browsed Drop, and `OpeningSession` owns the durable active-Drop switch;
- a staged `pendingReveal` keeps its persisted Drop and cannot be silently retargeted by navigation;
- Boot preloads only the default Drop plus required static assets; alternate Drops are loaded on demand;
- Basic/Charged standard and Hidden Pocket resolution stay inside the active Drop;
- Signal guarantee eligibility is active-Drop + selected-pouch scoped;
- CHIPS, Signal and Overcharge remain global across Drops;
- family-targeted pouches remain parked.

Content-scale economy behavior is audited in `FULL_GAME_ECONOMY_AUDIT_2026-09-10.md`.

---

# 8. Transaction / recovery — LOCKED

Every opening uses persisted `pendingReveal` before presentation.

It retains enough state to recover the exact outcome:

```text
transaction id
base opens
pouch type
loot pool
wallet before
pouch cost
base CHIPS
cache tier + bonus
recycle CHIPS
standard result
Signal transition
Hidden Pocket result
final snapshot
```

Phase 2.6 extends this transaction with Overcharge multiplier-before, bonus CHIPS, actual applied gain/reset and multiplier-after. These fields are implemented, migration-covered and recoverable/idempotent before presentation is replayed.

Critical invariants:

- no reroll on refresh;
- no double base/cache/recycle;
- Charged cost cannot be lost without reward;
- Signal consume/retain outcome is fixed;
- original pouch/pool survive recovery;
- presentation, fast-forward, count-up and flight cannot mutate durable reward state.

A committed result reloaded after cosmetic staging may show durable wallet truth directly rather than replaying cosmetic banking.

---

# 9. Input / pacing — CURRENT RUNTIME

The first hands-on found dead tapping frustrating.

Current rules:

- remove player-facing `RESULT LOCKED` dead state;
- intentional click/tap during reveal accelerates current presentation beat;
- short guard after tear completion prevents the drag-release event from becoming unintended skip;
- no global tween manager acceleration;
- ambient motion remains normal;
- once result is visible, a distinct tap accepts it;
- no separate Quick Reveal mode in this pass.

---

# 10. Opening UI — CURRENT RUNTIME

Current gameplay hierarchy uses a left-side rail:

```text
CHIPS
SIGNAL

POUCH
[ BASIC    FREE ]
[ CHARGED  60   ]
```

Selected state must remain obvious without color alone.

Available controls get small hover/down/release feedback. Unaffordable Charged acknowledges deliberate input with wiggle/cost flash/HUD response but cannot mutate selection/state.

The center remains visually owned by pouch/collectible.

No fake Drop controls are added before Drop #2.

---

# 11. Charged presentation — CURRENT RUNTIME

Direct hands-on supersedes the previous assumption that current aura is sufficiently distinct.

Current merged runtime treatment uses:

- cyan/violet base;
- restrained pink/iridescent accents;
- brighter star/seal emphasis;
- contour/aura/rings/sparks;
- moving highlight/sweep;
- selector + center pouch change together.

Label-hidden comparison is the acceptance test.

Only if runtime treatment still fails may a recolored Charged raster variant be added. Preserve exact geometry and tear mechanics.

---

# 12. Digital / neon visual language — CURRENT RUNTIME

Principle:

> **Cozy Y2K world, electric digital UI.**

Bundled Press Start 2P accent typography is used only for short electronic system information such as CHIPS numerals, Signal and short Cache/Charged labels.

Long copy/navigation remains readable sans.

Prefer Phaser Text/Graphics, glow duplicates, stroke/shadow, tint, blend modes, highlight strips, rings/sparks and tweens.

No custom shader in the current correction.

Rarity standard hierarchy may use escalating electronic shimmer:

- Common restrained;
- Rare light cyan shimmer;
- Epic stronger lavender/cyan sweep;
- Legendary strongest standard iridescent bloom;
- Secret remains distinct/stronger.

---

# 13. Callouts / variation — CURRENT RUNTIME

Important feedback gets longer readable holds, but experienced players can fast-forward.

Do not scatter messages randomly across the screen. Use semantic zones:

- rarity/NEW/duplicate near hero;
- CHIPS/cache/recycle near staged reward area;
- Signal at result origin + Signal HUD destination;
- Charged-ready near CHIPS/Charged UI.

Allowed controlled variation:

- tiny reward rotation;
- small overshoot differences;
- sparkle/token trajectory variation;
- bounded audio playback variation where safe.

Do not randomize core rhythm enough to hurt learnability.

---

# 14. Information surface — DEFERRED

The desire to see exact odds, active collection/Drop and missing items is valid but not part of current feel choreography.

After Phase 2.6 and hosted DRAFT evidence, consider an on-demand drawer reading exact values from typed config and showing discovered/unknown items.

Do not add a permanent full collection sidebar or permanent odds table to main Opening.

---

# 15. Acceptance state

Existing Lite V2 automated/local gates, direct repeated-use regressions, Secret correction, and the final result-choreography correction are complete.

PR #65 merged the bounded presentation-only correction after targeted Chromium evidence and manual review: Hidden Pocket carousel chrome, dense reward bounds, pre-reveal Signal-lock consumption, ordinary Signal timing, and Charged aura teardown are accepted locally.

Current gate:

> **Real hosted Yandex DRAFT validation is the next external gate.**

Do not infer hosted SDK/storage/ad/device safety from CI or local browser evidence.

---

# 16. Guardrails

Do not add by default:

- balance changes in this branch;
- timed Basic energy;
- offline/passive income;
- Archive;
- upgrades;
- second currency;
- shop;
- multi-standard drops;
- auto-open/x5;
- prestige/crafting/merge/trading;
- new family/Drop content;
- permanent odds/sidebar UI;
- backend/ECS/physics/3D;
- custom shader system.

The approved exception is the small Signal Overcharge extension specified in `FINAL_HANDS_ON_OVERCHARGE_PLAN.md`; do not treat it as permission for unrelated meta-system expansion.
