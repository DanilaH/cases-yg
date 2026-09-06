# Product direction

## 1. Product thesis

**Mystery Pocket Tech** / RU working title **«Мистери Гаджеты: Ретро Распаковка»** is a Yandex Games collectible opener built around one strong object fantasy:

> **Open mystery tech → reveal a stylized Y2K gadget → discover rarity → improve a visible collection → repeat.**

The tactile opener and collectible desirability remain the product core. **Gameplay Loop Lite V2** adds one compact meta-goal around that opener:

> **Basic Pouch → collectible + CHIPS → duplicate recycle + SIGNAL → Charged Pouch → better roll → repeat.**

The project is not trying to become a full idle/incremental economy. Lite V2 exists to make repeated openings feel more rewarding and purposeful with minimal development burden.

---

## 2. Current execution stages — LOCKED

### Stage A — internal vertical slice baseline — COMPLETE ENOUGH TO EXTEND

The Camera + Flip Phone slice has established:

- pouch tear/reveal interaction;
- rarity presentation;
- Hidden Pocket carousel;
- Collection baseline;
- save/recovery transaction model;
- responsive landscape presentation;
- asset production pipeline;
- platform/ads/analytics boundaries;
- browser visual-QA workflow.

The current two-family build remains private and is not the public release.

### Stage B — Gameplay Loop Lite V2 — NEXT

Add only:

- global CHIPS wallet + HUD transfer feedback;
- guaranteed base CHIPS on every pouch plus an independent rare CHIPS-cache roll;
- automatic duplicate recycle → CHIPS + Signal;
- simplified 4-segment Signal pity;
- one Charged Pouch tier bought with CHIPS;
- distinct Basic/Charged rarity access and balance profiles;
- Drop/loot-pool identifiers in data so future content can scale without a global mega-pool.

Do not add idle timers, offline income, passive production, prestige, upgrade trees or multi-standard drops in this stage.

After implementation, run the same exact-revision browser visual gate plus direct hands-on repetition test.

### Stage C — real Yandex DRAFT validation

After Lite V2 hands-on acceptance, validate the real hosted runtime before content expansion:

- SDK boot / `LoadingAPI.ready()`;
- pause/resume/audio lifecycle;
- storage + interrupted reveal recovery;
- interstitial/rewarded/sticky boundaries;
- analytics where configured;
- Lite V2 wallet/Charged transaction recovery in hosted conditions.

CI and local browser automation cannot replace this gate.

### Stage D — content/release build

Only after the loop and hosted platform path are proven:

- materially expand gadget families;
- group content into themed Drops/loot pools rather than one ever-growing global pool;
- expose a Drop selector only when more than one Drop exists;
- scale Collection around the real roster;
- re-simulate Basic/Charged rarity, CHIPS, Signal and Hidden Pocket balance;
- finalize monetization choices;
- produce final store creative after release content/key visual stabilizes.

### Stage E — public Yandex release

Final moderation/store/release hardening happens only on the expanded content build.

---

## 3. Player fantasy

> **“I’m opening tiny mystery tech from the early 2000s and building a dream collection of nostalgic pocket gadgets.”**

The product is a collectible-toy fantasy, not repair simulation, electronics inventory management, gambling simulation or a spreadsheet-heavy idle game.

Target visual hypothesis remains:

- primary ~14–27, likely female-skewed but not exclusive;
- secondary ~25–35 nostalgia audience;
- recognizable Y2K electronics + blind-box desirability + tasteful cute finish.

---

## 4. Core interaction — LOCKED

The physical opener does not change for Lite V2:

1. Mystery Pouch is ready.
2. Player grabs the star tear-tab.
3. One short left-to-right drag completes the tear.
4. Complete reward transaction is predetermined/persisted.
5. CHIPS/reward presentation begins from the pouch.
6. One standard gadget reveals with rarity + NEW/duplicate state.
7. Duplicate may auto-recycle into CHIPS + Signal.
8. Hidden Pocket may add an automatic Secret beat.
9. Resource rewards visibly transfer to HUD.
10. Player advances, opens Collection, or chooses Charged when affordable.

Compact form:

> **TEAR → LOOT → COLLECT / RECYCLE → PROGRESS → REPEAT**

No physics or multistage tactile simulation.

---

## 5. Lite V2 progression philosophy

Every opening moves visible progress because Basic never becomes a currency-only empty interaction:

- **standard collectible** → always the hero reward;
- **new collectible** → Collection progress;
- **base CHIPS** → predictable progress toward Charged Pouch;
- **rare CHIPS cache** → occasional large wallet spike;
- **duplicate** → recycle CHIPS + Signal pity;
- **Hidden Pocket** → rare Secret surprise.

CHIPS and Signal have deliberately different meanings:

- **CHIPS** = spendable progress toward a better pouch;
- **Signal** = non-spendable duplicate protection.

The player-facing Signal rule is intentionally simple:

> **4 duplicates → next standard collectible is NEW (inside the active Drop).**

The current runtime still uses the older 0–100 Signal implementation until Lite V2 is coded. Migration is locked to `min(4, floor(oldSignal / 25))`, preserving an old fully armed lock without rounding partial progress upward.

---

## 6. Basic vs Charged — LOCKED STRUCTURE

### Basic Pouch

- free/unlimited in Lite V2;
- always one standard collectible roll;
- always guaranteed base CHIPS;
- independent chance of a larger CHIPS cache bonus;
- Common + Rare + a small Epic chance;
- **no Legendary from the Basic standard table**;
- lower Hidden Pocket chance, but Secret remains possible as a very rare jackpot;
- current onboarding protection retained within Basic's allowed rarity set.

Basic therefore stays pleasant and can still surprise the player, but it does not provide the top standard rarity.

### Charged Pouch

- purchased with global CHIPS;
- selected directly from Opening UI when affordable; no store screen;
- one standard collectible roll;
- stronger normal CHIPS payout/cache profile;
- materially stronger Rare/Epic odds;
- **Legendary is available from the Charged standard table**;
- higher Hidden Pocket chance.

Charged is the main route to Epic/Legendary progression rather than merely a tiny percentage buff over Basic.

Exact CHIPS cost, base payout ranges, cache probabilities/amounts, duplicate recycle payouts, rarity weights and Hidden Pocket odds remain tuning values to lock from simulation + hands-on.

The economy invariant is already locked: over repeated play, Charged must be a **net CHIPS sink in expectation**. A very rare cache may still fund several Charged openings and create a memorable jackpot moment.

Lite V2 does **not** introduce two or three standard collectibles per pouch. “More loot” is achieved cheaply through visible CHIPS/cache presentation + one hero collectible + optional Hidden Pocket.

---

## 7. Two independent luck axes

Collectible quality and CHIPS payout are intentionally independent.

A Basic opening can therefore produce combinations such as:

- Common + huge CHIPS cache;
- Rare + normal CHIPS;
- Epic + small CHIPS;
- ordinary collectible + rare Hidden Pocket Secret.

This adds meaningful variation without requiring more collectible drops or more gameplay systems.

Duplicate rarity may affect the **recycle rebate**, but the pouch's CHIPS cache is not derived from collectible rarity.

---

## 8. Content growth strategy — LOCKED ARCHITECTURE

Camera and Flip Phone are the first two production families, not the final game.

Candidate future families include:

- MP3 player;
- pager;
- mini camcorder;
- handheld console;
- PDA / pocket organizer;
- portable disc / MiniDisc-like player;
- pocket radio;
- virtual-pet-like electronic;
- additional Y2K pocket-tech archetypes discovered during production/research.

As the catalog grows, do **not** put every collectible into one global loot table.

Instead:

- families belong to themed Drops / loot pools;
- Basic and Charged roll inside the active Drop;
- Signal Lock guarantees NEW inside the active Drop while preserving the selected pouch rarity profile;
- CHIPS and Signal remain global;
- selector stays hidden while only one Drop exists;
- a rough future heuristic is ~3–5 families per Drop, adjusted to the real roster.

This gives each content expansion a fresh completion surface without changing the core gameplay loop.

---

## 9. Collection fantasy

Visual direction remains a cozy illustrated Y2K shelf/desk/display.

Current slice:

- Shelf shows the best owned Camera/Flip Phone;
- Library shows all current variants.

As content grows:

- Collection remains data-driven;
- Drops become the natural high-level grouping;
- exact pages/shelves/filtering are introduced only when the roster requires them;
- targeted family-specific acquisition is deferred until real completion friction proves it necessary.

---

## 10. Monetization philosophy

The public product is intended to be ad-supported, but ads do not define the gameplay economy.

Rules remain:

- rewarded is optional and clearly names the reward;
- interstitial only at logical pauses outside active tear/reveal;
- ad failure never blocks gameplay;
- fullscreen/rewarded pauses gameplay/audio correctly;
- no artificial energy scarcity solely to force ads.

The old dev-only `+25 Signal` rewarded probe is a legacy slice plumbing test. Once Lite V2 replaces Signal with 4 segments, dev reward validation should use CHIPS instead of directly mutating pity state.

Final public ad reward/cadence is tuned after Lite V2 and the expanded content economy exist.

---

## 11. Scope guardrails — IMPORTANT

Lite V2 explicitly excludes:

- Basic Pouch regeneration timers / energy;
- offline income;
- passive CHIPS/min from Collection;
- Overcharge;
- Archive level;
- upgrade/set-bonus trees;
- shop screen;
- multiple spendable currencies;
- multiple standard collectibles per pouch;
- prestige/reset;
- auto-open / x5 opening;
- crafting/merge/trading/market;
- large minigame suite;
- real-time 3D;
- backend/live-service infrastructure without a proven requirement.

These are not rejected forever. They are excluded because the current product problem is much smaller:

> **make repeated pouch opening pleasant enough that the player wants one more opening, without turning a low-production game into a multi-week systems project.**

The release should become **content-rich and loop-rich, not system-bloated**.
