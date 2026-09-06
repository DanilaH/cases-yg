# Gameplay systems

This document is the canonical gameplay-system specification. It separates the **current production target** from temporary balance numbers and future ideas.

The next gameplay target is **Gameplay Loop Lite V2**: add one lightweight meta-loop around the already-proven tactile opener without turning the project into a large idle/economy game.

> **Basic Pouch → collectible + CHIPS → duplicate = recycle + CHIPS + SIGNAL → save CHIPS → Charged Pouch → better roll → repeat**

The design goal is simple, pleasant, responsive play with visible progress on every opening.

---

# 1. Core opener — LOCKED

Primary interaction remains:

1. show Mystery Pouch;
2. one short left-to-right star-tab drag;
3. predetermine and persist the complete reward transaction;
4. reveal the pouch rewards;
5. show rarity + NEW/duplicate state;
6. apply/visualize CHIPS and Signal progression;
7. optionally run Hidden Pocket;
8. hold result briefly;
9. player advances, chooses the next available pouch action, or opens Collection.

Reveal presentation remains compact:

- pouch is the physical source of the reward;
- collectible reveal uses runtime flash/glow/ring/sparkles;
- no physics;
- no auto-dismiss;
- minimum result readability hold remains ~0.6 s;
- no separate Reveal scene.

The current reveal/pouch visual work is considered the baseline. Lite V2 must compose with it rather than redesign it.

---

# 2. Gameplay Loop Lite V2 — LOCKED TARGET

Lite V2 deliberately adds only four gameplay concepts:

1. **CHIPS** — one global soft currency.
2. **Duplicate recycle** — automatic duplicate compensation.
3. **Simplified Signal** — transparent duplicate pity.
4. **Charged Pouch** — a more valuable opening purchased with CHIPS.

The scope explicitly does **not** include timers, offline income, passive production, upgrade trees, multiple standard collectible drops, shops, prestige, Overcharge, Archive levels or other full incremental systems.

The loop should remain understandable without a tutorial screen.

---

# 3. Basic Pouch — LOCKED TARGET

Basic Pouch remains the default, immediately available opening.

For Lite V2:

- Basic remains free/unlimited; no energy or regeneration timer is introduced;
- every Basic opening **always** gives one standard collectible;
- every Basic opening also gives guaranteed base CHIPS;
- Basic cannot roll Legendary from the standard rarity table;
- Basic can roll Common, Rare and a small amount of Epic;
- Basic can still very rarely trigger Hidden Pocket and award a Secret;
- the first three onboarding openings keep undiscovered protection, constrained to the rarity set allowed by the pouch profile;
- exact Basic rarity weights and CHIPS values live in balance config.

The collectible guarantee is intentional. The pouch should never become a currency-only empty-feeling interaction; the gadget reveal remains the core fantasy.

---

# 4. CHIPS — LOCKED TARGET

CHIPS are the only spendable gameplay currency in Lite V2.

Purpose:

> **CHIPS answer “when can I afford a better opening?”**

Rules:

- one global wallet;
- earned from every pouch;
- duplicates grant additional CHIPS through recycle;
- spent on Charged Pouch;
- CHIPS are not family-specific and not Drop-specific;
- CHIPS do not replace Signal.

## 4.1 Payout model — guaranteed progress + independent cache luck

Do not use one fixed CHIPS payout and do not use one giant flat random range such as `5..100`.

Each pouch resolves CHIPS in two parts:

```text
guaranteed base payout
+ independent optional cache bonus
= total pouch CHIPS reward
```

The base payout keeps progression predictable: the player can roughly understand how many Basic openings remain before Charged becomes affordable.

The independent cache roll adds memorable variance. It may resolve conceptually as:

```text
normal       no extra cache bonus
cache        noticeably larger bonus
big cache    large bonus
mega cache   very rare jackpot-sized bonus
```

Exact names/copy are presentation details. Exact probabilities and ranges are tuning values.

A very rare top cache is allowed to award enough CHIPS to fund multiple Charged openings. That is a deliberate excitement spike, not the normal economy rate.

## 4.2 Collectible luck and CHIPS luck are independent

The collectible rarity roll and the CHIPS-cache roll are separate axes.

Therefore memorable combinations are possible without adding more content:

```text
Common + Mega Cache
Epic + normal CHIPS
Rare + Big Cache
...
```

Do not derive the cache tier from collectible rarity and do not make rare collectibles automatically pay more pouch CHIPS. Duplicate recycle remains the rarity-dependent CHIPS source.

## 4.3 CHIPS presentation

- persistent compact CHIPS HUD counter;
- reward tokens appear as part of the pouch reward sequence;
- larger cache results use stronger burst density/scale/copy/FX;
- after the reward is accepted/resolved, chip tokens fly into the HUD counter;
- the counter animates from the pre-transaction value to the committed value;
- crossing the Charged affordability threshold produces a clear `CHARGED POUCH READY` feedback beat.

The number of visible chip sprites is **not** the numerical payout. A `+150` result must not spawn 150 persisted/economic objects. Visual token count is a presentation sample of one aggregate reward.

The physical transfer animation is presentation only. Durable wallet state comes from the persisted reveal transaction and must never depend on an animation completing.

---

# 5. Duplicate recycle — LOCKED TARGET

There is no manual “sell duplicate” choice in Lite V2.

A duplicate automatically resolves as:

> **DUPLICATE → RECYCLED → CHIPS + SIGNAL**

Rationale: if duplicates have no other use, a manual sell button is fake choice and unnecessary friction.

Rules:

- duplicate still reveals as the rolled collectible first;
- duplicate then awards a small rarity-dependent CHIPS rebate;
- duplicate also advances Signal by one segment;
- new collectibles do not grant recycle CHIPS and do not advance Signal;
- recycle CHIPS stack on top of the pouch base payout/cache result;
- exact rarity-to-CHIPS recycle values are balance values still to be tuned.

CHIPS are immediate compensation. Signal is protection against repeated duplicate streaks. The systems therefore have different jobs and should remain separate.

---

# 6. Signal — LOCKED TARGET, MIGRATION FROM CURRENT SLICE

Signal is a pity meter, **not a spendable currency**.

Lite V2 simplifies the current weighted Signal implementation to a transparent segmented rule:

- every standard duplicate: `+1 SIGNAL`;
- target threshold: `4/4`;
- at `4/4`, **SIGNAL LOCK** is armed;
- the next standard collectible roll must be an undiscovered standard collectible in the active Drop if one exists;
- consuming the lock resets Signal to `0/4`;
- if the active Drop is already complete, the armed lock is not wasted/consumed.

Player-facing mental model:

> **Four duplicates → next collectible is NEW.**

Recommended HUD language is segmented rather than numerical economy language, e.g. `◆ ◆ ◇ ◇` → `◆ ◆ ◆ ◆` → `SIGNAL LOCK`.

## 6.1 Legacy migration — LOCKED

Current `main` uses the old 0–100 Signal value. Migration to Lite V2 is deterministic:

```text
newSignal = min(4, floor(oldSignal / 25))
```

Therefore:

```text
0–24   → 0
25–49  → 1
50–74  → 2
75–99  → 3
100    → 4 / SIGNAL LOCK
```

This preserves a fully armed legacy lock, never manufactures more than one lock, and does not round partial progress upward.

## 6.2 SIGNAL LOCK + pouch profile — LOCKED

A Signal guarantee must not erase the value of choosing Charged.

Resolution order:

1. restrict candidates to undiscovered standard collectibles in the active Drop;
2. apply the selected pouch's rarity profile across those eligible candidates;
3. choose the guaranteed NEW result;
4. consume Signal lock.

Thus a Charged opening with SIGNAL LOCK still benefits from Charged rarity weighting among the missing items.

Do not keep the old late-lock weighted fallback as a second pity system.

---

# 7. Charged Pouch — LOCKED CONCEPT, NUMBERS OPEN

Charged Pouch is the single extra acquisition tier in Lite V2.

Availability:

- purchased using global CHIPS;
- exposed directly on the Opening screen; no store/economy scene;
- when affordable, the player may choose Charged rather than Basic;
- affordability/ready state must be obvious from the same screen.

Charged Pouch gives:

- one standard collectible roll;
- access to Common / Rare / Epic / Legendary;
- materially more Rare/Epic than Basic;
- **Legendary as a standard collectible only through Charged in Lite V2**;
- stronger normal CHIPS payout/cache profile than Basic;
- a higher Hidden Pocket chance than Basic.

Charged is therefore not merely “the same pouch with +2% luck.” It is the main path to the top of the standard rarity ladder while Basic remains useful and can still surprise with Rare/Epic or a very rare Secret through Hidden Pocket.

Lite V2 intentionally does **not** add a second/third standard collectible to Charged Pouch. The perception of a larger reward comes from CHIPS/cache presentation + stronger collectible roll + possible Hidden Pocket.

## 7.1 CHIPS sink invariant

Across repeated play, Charged must cost more CHIPS than it returns in expected CHIPS value.

A rare Big/Mega Cache may occasionally pay for one or several future Charged openings. That is desirable. The **average** Charged opening must still consume wallet progress or the currency loop collapses into self-funding Charged spam.

Still open for tuning before implementation is considered balance-complete:

- Charged CHIPS cost;
- Basic/Charged base CHIPS ranges;
- cache tier probabilities/ranges by pouch profile;
- duplicate recycle CHIPS by rarity;
- Basic Common/Rare/Epic weights;
- Charged Common/Rare/Epic/Legendary weights;
- Basic vs Charged Hidden Pocket chances.

These values belong in typed balance config and should be simulation-checked and adjusted after hands-on rather than invented in presentation code.

---

# 8. Multi-reward presentation — LOCKED TARGET

Lite V2 creates the feeling of “several things came out of the pouch” without introducing a multi-standard-drop economy.

Expected reward sequence:

1. tear;
2. chip tokens burst/appear;
3. base CHIPS resolves;
4. optional Cache/Big/Mega bonus beat resolves;
5. one standard collectible reveal;
6. NEW or duplicate/recycle feedback;
7. optional Hidden Pocket/Secret beat;
8. resource tokens/Signal visibly transfer into their HUD meters;
9. result ready.

Transaction model remains conceptually:

```text
1 aggregate base CHIPS reward
0..1 cache bonus reward
1 standard collectible
0..1 Hidden Pocket Secret
0..1 duplicate recycle CHIPS reward
0..1 Signal increment
```

Do not reinterpret visual chip particles as individual economic rolls.

---

# 9. Standard rarity — LOCKED LADDER AND ACCESS RULES

> **Common → Rare → Epic → Legendary**

Lite V2 structural access:

| Pouch | Common | Rare | Epic | Legendary |
|---|---:|---:|---:|---:|
| Basic | yes | yes | small chance | **no** |
| Charged | yes | yes | meaningful chance | **yes** |

Exact percentages are tuning inputs, but the access distinction is locked.

The existing 60/28/10/2 table is **current pre-Lite runtime only** and is not the target Basic profile because Lite V2 removes Legendary from Basic.

---

# 10. Hidden Pocket — CORE MECHANIC RETAINED

Hidden Pocket remains the rare jackpot-like second reveal beat and still awards a Secret.

Current runtime/slice behavior:

- disabled on openings #1–3;
- 3% from #4 while an undiscovered slice Secret remains;
- no Secret duplicates in the current slice.

Lite V2 target:

- Basic retains a very low Hidden Pocket chance;
- Charged has a materially higher Hidden Pocket chance;
- Secret is therefore **not** hard-gated behind Charged;
- Hidden Pocket remains `0..1` additional Secret, not a generic multi-drop system;
- exact probabilities are tuned with the new economy/content pool.

This preserves the possibility of an exceptional “Basic pouch jackpot” while giving Charged a clear advantage.

---

# 11. Content growth: Drops / loot pools — LOCKED ARCHITECTURE, UI DEFERRED

The game must not grow into one global pool containing every collectible ever produced.

Content is grouped into themed **Drops** / loot pools.

Conceptual structure:

```text
active Drop
  → eligible families
  → pouch rarity profile
  → collectible
```

Rules:

- every family/collectible belongs to a `dropId` / `lootPoolId`;
- Basic and Charged resolve only inside the active Drop;
- Signal Lock guarantees an undiscovered standard item inside the active Drop while preserving the selected pouch rarity profile;
- CHIPS and Signal remain global across Drops;
- with only one Drop, the Drop selector is hidden and adds zero user-facing complexity;
- when multiple Drops exist, expose a compact selector rather than redesigning the core loop.

A useful future heuristic is roughly 3–5 families per themed Drop, but actual grouping should follow the real roster and collection UX rather than a hard count.

Potential examples are thematic only, not locked release names:

- Y2K Essentials;
- Pocket Gaming;
- Music Tech.

Targeted family-specific pouches are **not** part of Lite V2. Add targeting only if real completion data shows that a Drop becomes frustrating to finish.

---

# 12. Collection — CORE MODEL RETAINED, SCALE OPEN

Roles remain:

> **Shelf = attractive best finds. Library = exhaustive ownership/completion view.**

The current two-family Collection is valid for the present content.

As content grows:

- Collection renders from data;
- Drop grouping becomes the natural high-level organization;
- exact pages/shelves/filtering are designed when more than one Drop exists;
- do not add a new Collection navigation system merely to support Lite V2.

---

# 13. Persistence / transaction requirements — LOCKED

Lite V2 expands the existing `pendingReveal` transaction rather than creating side-channel wallet mutations.

A pending transaction must predetermine enough data to recover without rerolling or double-spending, including conceptually:

- pouch type/profile (`basic` / `charged`);
- active `lootPoolId`;
- Charged cost, if any;
- base/pre-transaction CHIPS value;
- base pouch CHIPS reward;
- cache tier/outcome + cache CHIPS bonus;
- duplicate recycle CHIPS reward;
- standard collectible result;
- Signal before/after + lock consume/reach state;
- Hidden Pocket result;
- final committed wallet/progress snapshot.

Critical rule:

> **Charged cost and all rewards are one atomic reveal transaction.**

A crash/refresh must never consume CHIPS without preserving the rolled reward, and must never replay the same transaction for extra base/cache/recycle CHIPS.

Resource-flight animations can replay in a shortened recovery presentation if useful, but they are never the source of truth.

---

# 14. Advertising — PLATFORM RULES RETAINED

Advertising remains behind the Yandex adapter and outside active tear/reveal.

The old dev-only `+25 Signal` rewarded probe becomes obsolete once Signal moves to 4 segments. When Lite V2 is implemented, use a clearly dev-only CHIPS reward for exactly-once rewarded plumbing instead of mutating pity state.

Final public rewarded value/placement remains a later product-tuning decision.

---

# 15. Explicitly parked from Lite V2

Do not add during this pass:

- Basic Pouch regeneration timers/energy;
- offline income;
- passive CHIPS/min from Collection;
- Overcharge meter/pouch;
- Archive levels;
- collection upgrade tree/set bonuses;
- separate shop screen;
- multiple spendable currencies;
- 2–3 standard collectibles per pouch;
- auto-open/x5/mass opening;
- prestige/reset;
- crafting/merge/market/trading;
- large minigame suite.

These can be reconsidered only if the Lite loop is proven fun and a concrete retention/completion problem remains.

---

# 16. Lite V2 acceptance question

The pass succeeds if, after repeated hands-on play, the player naturally understands and feels:

> **“Every pouch gives me a gadget and some progress; Basic can still surprise me; duplicates still move me forward; I can see myself getting closer to Charged; Charged is where the top standard rarities live.”**

If that is true, stop adding systems and move to Yandex draft validation + content expansion. If it is not true, fix the smallest failing part of the loop rather than adding more meta systems.
