# Product direction

## 1. Product thesis

**Mystery Pocket Tech** / RU working title **«Мистери Гаджеты: Ретро Распаковка»** is a Yandex Games collectible opener built around one strong object fantasy:

> **Open mystery tech → reveal a stylized Y2K gadget → discover rarity → improve a visible collection → repeat.**

The product should stay mechanically compact, but the **public release is not intended to contain only two gadget families**. Low production burden means a repeatable content factory, not an artificially tiny final catalog.

---

## 2. Development stages — LOCKED

### Stage A — internal vertical slice

Private build for the user/developer only.

Purpose:

- verify tearing/reveal feel hands-on;
- validate Camera/Flip Phone art grammar and rarity escalation;
- validate Signal and Hidden Pocket behavior;
- validate Collection UX;
- validate save/recovery;
- validate responsive desktop/mobile landscape behavior;
- validate Yandex SDK, lifecycle, analytics and **advertising integration** in draft/debug mode.

Content:

- Digital Camera;
- Flip Phone;
- four standard rarities each;
- one Secret per family.

This build is **not submitted to moderation and not released publicly**.

### Stage B — content/release build

After the internal slice is approved:

- expand the gadget roster materially;
- preserve the established family production pipeline;
- scale Collection from two-family demo composition to a real catalog;
- re-simulate/rebalance drops, Signal, Hidden Pocket and completion;
- decide final ad placements/rewards/cadence;
- reconsider low-cost meta systems only where the larger content pool gives them a purpose;
- produce final store creative only after the release content/key visual is stable.

### Stage C — public Yandex release

Only the expanded release build goes through final moderation/store preparation.

---

## 3. Player fantasy

> **“I’m opening tiny mystery tech from the early 2000s and building a dream collection of nostalgic pocket gadgets.”**

The product is a collectible-toy fantasy, not repair simulation, realistic electronics inventory management, or a simulated-gambling economy.

Target visual hypothesis remains:

- primary ~14–27, likely female-skewed but not exclusive;
- secondary ~25–35 nostalgia audience;
- recognizable Y2K electronics + blind-box desirability + tasteful cute finish.

---

## 4. Core interaction — LOCKED

1. Mystery Pouch is ready.
2. Player grabs the star tear-tab.
3. One short left-to-right drag completes the tear.
4. Reward transaction is persisted.
5. ~1.0–1.4 s reveal plays from the pouch.
6. Gadget + rarity + NEW/duplicate resolves.
7. Duplicate may advance Signal.
8. Hidden Pocket may add an automatic Secret beat.
9. Result remains readable briefly; player advances to next pouch or opens Collection.

Compact form:

> **TEAR → REVEAL → COLLECT / PROGRESS → REPEAT**

No physics or multistage tactile simulation.

---

## 5. Internal-slice progression

The exact numbers below exist to make the two-family slice testable; they are **not sacred launch economy**.

- standard odds: Common 60 / Rare 28 / Epic 10 / Legendary 2;
- Camera / Flip Phone 50/50;
- first three standard opens protected from duplicates;
- Signal turns duplicates into visible pity progress;
- Hidden Pocket: 3% from opening #4 while a slice Secret remains;
- slice completion: standard 8/8 + Secrets 0/2 separately.

After public content expansion, rebalance from the new content matrix rather than preserving these percentages by inertia.

---

## 6. Public content direction

Camera and Flip Phone are the **first two production families**, not the final game.

Candidate expansion pool includes:

- MP3 player;
- pager;
- mini camcorder;
- handheld console;
- PDA / pocket organizer;
- portable disc / MiniDisc-like player;
- pocket radio;
- virtual-pet-like electronic;
- additional Y2K pocket-tech archetypes discovered during production/research.

Exact public family count remains open. The old ~24-family scale can be reconsidered and exceeded if the art pipeline stays fast and coherent. Do not lock a launch count before we know real per-family production cost.

---

## 7. Collection fantasy

Visual direction remains a cozy illustrated Y2K shelf/desk/display.

Internal slice:

- two hero positions;
- Shelf shows best owned Camera/Flip Phone;
- Library shows all slice variants.

Public release:

- Collection must scale from data rather than hard-coded two-family layout;
- likely needs groups/pages/themed shelves or another compact organization once launch family count is known;
- Shelf stays the attractive “best finds” surface;
- Library stays the completionist record.

Exact public completion semantics are redefined together with the expanded roster.

---

## 8. Monetization philosophy — UPDATED

The public product is intended to be ad-supported, so **SDK and ad infrastructure are implemented from the first internal slice** rather than bolted on at the end.

Internal slice:

- exercise interstitial/rewarded/sticky-banner SDK boundaries in Yandex draft/debug mode;
- verify pause/resume/audio behavior;
- verify rewarded callbacks and idempotent reward granting;
- a dev-only test reward is allowed purely to validate plumbing.

Public release:

- final rewarded reward and interstitial placement are chosen after content/economy scale is known;
- rewarded ads remain optional and clearly state the reward;
- interstitials belong only at logical pauses, never during active tear/reveal;
- do not manufacture energy/package scarcity solely to make ads valuable.

---

## 9. Internal validation

There is no 500-player/7-day gate before content expansion anymore.

The internal slice is approved from direct hands-on review plus technical checks:

- does tearing feel immediate and pleasant?
- is reveal satisfying after dozens of repetitions?
- are rarity differences desirable/readable?
- do duplicates + Signal feel understandable?
- does Collection feel worth visiting?
- does Hidden Pocket land as a genuine surprise?
- do resize/mobile/save/ad lifecycle paths hold up?

Once the user signs off, move into content expansion.

---

## 10. Scope guardrails

Still excluded by default:

- real-time 3D;
- physics-driven opening;
- character movement/NPCs;
- trading/market;
- crash/double/jackpot betting framing;
- giant minigame suite;
- backend/live-service infrastructure without a proven requirement.

Potentially return during release expansion, but only with a clear job:

- Tech Parts / Mod Bench;
- package tiers;
- Daily Spotlight;
- shelf evolution;
- other cheap retention systems.

The release should become **content-rich, not system-bloated**.
