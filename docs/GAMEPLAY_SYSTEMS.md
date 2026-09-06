# Gameplay systems

This is the canonical specification for the **implemented current gameplay loop**. Balance numbers are provisional runtime tuning unless explicitly marked locked.

> **Basic Pouch → collectible + CHIPS → duplicate recycle + SIGNAL → save CHIPS → Charged Pouch → better roll → repeat**

The product goal remains simple: every opening should feel useful without turning the game into a large idle/economy system.

---

# 1. Core opener — CURRENT RUNTIME

Primary interaction:

1. choose Basic or Charged;
2. show Mystery Pouch;
3. one short left-to-right star-tab drag;
4. predetermine and persist the complete reward transaction;
5. tear + CHIPS/cache presentation;
6. reveal one standard collectible;
7. show rarity + NEW/duplicate state;
8. duplicate may recycle into CHIPS + Signal;
9. optional Hidden Pocket reveals one Secret;
10. resource HUD reaches the committed state;
11. hold result briefly, then allow next action.

Reveal remains in `OpeningScene`. No physics and no auto-dismiss.

---

# 2. Pouch profiles

## 2.1 Basic Pouch

Current behavior:

- cost `0 CHIPS`;
- free/unlimited;
- always one standard collectible;
- guaranteed base CHIPS `6–10`;
- independent CHIPS cache roll;
- standard rarity weights Common/Rare/Epic/Legendary = `72 / 25 / 3 / 0`;
- Hidden Pocket chance `1.5%` from opening #4 while a Secret remains undiscovered;
- first three standard openings use undiscovered protection where eligible;
- opening #2 prefers a different family when possible.

Basic can never standard-roll Legendary, including through Signal pity.

## 2.2 Charged Pouch

Current behavior:

- cost `60 CHIPS`;
- one standard collectible;
- guaranteed base CHIPS `18–24`;
- stronger independent cache profile;
- rarity weights `35 / 40 / 20 / 5`;
- Hidden Pocket chance `6%` from opening #4 while a Secret remains undiscovered;
- selected directly in Opening; no shop scene;
- selected Charged state persists across repeated openings while the current wallet can still afford it;
- after an opening leaves the wallet below cost, next idle state falls back to Basic.

Charged is the normal standard route to Legendary and materially improves Rare/Epic access.

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
- CHIPS are neither Drop-specific nor family-specific;
- CHIPS do not replace Signal.

## 3.1 Base payout + independent cache

Each pouch resolves:

```text
base CHIPS
+ independent cache bonus
+ optional duplicate recycle
- pouch cost
= final wallet delta
```

Cache tiers:

| Tier | Basic weight | Charged weight | Reward |
|---|---:|---:|---:|
| none | 90 | 78 | 0 |
| cache | 7 | 15 | 20–35 |
| big | 2.5 | 5.5 | 45–75 |
| mega | 0.5 | 1.5 | 120–180 |

Collectible rarity and cache tier are separate random rolls. A Common + Mega Cache and Epic + no cache are both valid.

## 3.2 Current sink sanity

Using the typed balance config:

- Charged expected base CHIPS = `21`;
- expected cache bonus ≈ `9.675`;
- expected recycle if every result were duplicate ≈ `4.65`;
- expected all-duplicate return ≈ `35.325` against cost `60`;
- expected all-duplicate net ≈ `−24.675`.

Thus the current provisional tuning satisfies the locked rule that Charged is a net CHIPS sink. Values may change after hands-on/content-scale simulation.

## 3.3 Presentation

- persistent CHIPS HUD;
- bounded Phaser-rendered chip tokens for bursts/flight;
- token count is presentation, not the numeric reward;
- Big/Mega outcomes increase visual emphasis without spawning one sprite per CHIPS unit;
- wallet threshold crossing shows `CHARGED POUCH READY`;
- that milestone finishes before the final result render replaces the reveal root.

Animations never own durable wallet state.

---

# 4. Duplicate recycle

A standard duplicate automatically resolves as:

> **DUPLICATE → RECYCLED → CHIPS + SIGNAL**

Current recycle CHIPS:

| Rarity | Recycle CHIPS |
|---|---:|
| Common | 2 |
| Rare | 4 |
| Epic | 8 |
| Legendary | 15 |

Rules:

- duplicate first reveals as the rolled collectible;
- recycle stacks with base/cache payout;
- duplicate adds one Signal segment unless Signal is already armed;
- NEW standard collectibles do not recycle and do not add Signal;
- there is no manual sell choice.

---

# 5. Signal pity

Signal is non-spendable duplicate protection.

Current rule:

```text
standard duplicate → +1 Signal
4/4 → SIGNAL LOCK
next standard roll with an eligible missing item → guaranteed NEW
consume → 0/4
```

A guarantee respects both active loot pool and selected pouch profile.

When armed:

1. collect undiscovered standard candidates in active loot pool;
2. remove candidates whose rarity has zero selected-pouch weight;
3. if candidates remain, preserve that pouch's rarity weighting among them, pick NEW and consume lock;
4. if none remain, roll the selected pouch normally and retain Signal at `4/4`.

Consequences:

- Basic pity never bypasses Basic Legendary weight `0`;
- if only Legendary remains, Basic can keep opening normally while Signal stays armed;
- UI communicates the exceptional state as `SIGNAL LOCK · CHARGED`;
- the next eligible Charged opening guarantees a missing Legendary and consumes the lock;
- a fully complete active Drop does not waste the lock;
- duplicates while armed do not overfill Signal.

## 5.1 Legacy migration

Pre-Lite 0–100 saves migrate deterministically:

```text
newSignal = min(4, floor(oldSignal / 25))
```

Mapping:

```text
0–24   → 0
25–49  → 1
50–74  → 2
75–99  → 3
100    → 4 / SIGNAL LOCK
```

Migration is versioned and idempotent.

---

# 6. Hidden Pocket

Hidden Pocket remains the rare automatic Secret second beat, outside the standard rarity ladder.

Current runtime:

- disabled for openings #1–3;
- Basic chance from #4: `1.5%`;
- Charged chance from #4: `6%`;
- triggers only while an undiscovered Secret in the active loot pool exists;
- current two-family slice does not roll Secret duplicates;
- one opening can add at most one Secret.

Hidden Pocket is intentionally still possible from Basic; Secret is not hard-gated behind Charged.

---

# 7. Drops / loot pools

Current content resolves through one active loot pool. The player-facing selector remains hidden because only one production Drop exists.

Rules:

- every family/collectible belongs to a loot-pool identity;
- Basic and Charged resolve inside active `lootPoolId`;
- Signal searches only that pool and selected-pouch eligible rarities;
- CHIPS and Signal are global;
- when Drop #2 exists, expose the minimum compact selector required;
- adding another Drop should be data/config work rather than a reward-engine rewrite.

Family-targeted pouches remain parked.

---

# 8. Transaction / recovery contract

Every opening uses a persisted `pendingReveal` before presentation.

The pending transaction includes enough deterministic state to recover:

```text
transaction id
base total opens
pouch type
loot pool id
wallet before
pouch cost
base CHIPS
cache tier + bonus
recycle CHIPS
standard result
Signal transition
Hidden Pocket result
final committed snapshot
```

Critical invariants:

- refresh cannot reroll collectible/cache/Hidden Pocket;
- Charged cost cannot be lost without preserving its reward;
- base/cache/recycle cannot be granted twice;
- Signal consume/retain result is fixed by the pending transaction;
- recovery preserves original pouch type and loot pool;
- a failed storage promise is reconciled by reload only when the durable state exactly matches the deterministic transaction snapshot.

Presentation can replay in a calmer recovery path; economic state cannot change because an animation was interrupted.

---

# 9. Opening UI states

Current Opening surface contains:

- CHIPS HUD;
- segmented Signal HUD / lock state;
- Basic/Charged selector;
- Charged cost/affordability state;
- Charged runtime aura/accent;
- `SIGNAL LOCK · CHARGED` waiting communication;
- CHIPS/cache/recycle beats;
- `CHARGED POUCH READY` threshold milestone;
- Collection and mute controls.

No store/modal is required for pouch selection.

---

# 10. Collection

Core roles remain:

> **Shelf = attractive best finds. Library = exhaustive ownership/completion view.**

The current two-family Collection remains valid. Drop grouping/navigation should be added only when multiple real Drops make it necessary.

---

# 11. Advertising / rewarded debug

Ads remain behind the Yandex adapter and outside active tear/reveal.

Current debug rewarded path grants CHIPS rather than mutating Signal. It exists to validate exactly-once rewarded persistence, not to define public monetization.

Final public rewarded value/cadence is open for release tuning.

---

# 12. Acceptance state

Automated/local gates completed for the current merged Lite V2 tree:

- typecheck;
- 87 unit tests;
- asset self-test/validation;
- production build;
- exact-revision browser audit;
- manual screenshot/video inspection;
- post-merge CI.

Current open gate: **20–50 direct repeated openings** to judge reward feel, comprehension, pacing and fatigue.

After hands-on acceptance: real Yandex DRAFT validation.

---

# 13. Guardrails

Do not add by default:

- timed Basic energy;
- offline/passive income;
- Overcharge / Archive levels;
- upgrade trees;
- second currency;
- shop scene;
- multi-standard drops;
- auto-open/x5;
- prestige;
- crafting/merge/trading;
- backend/ECS/physics/3D without a concrete requirement.

If repeated hands-on proves the current loop works, the correct next move is hosted validation and content expansion — not another meta system.
