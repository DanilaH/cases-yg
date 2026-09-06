# Product direction

## 1. Product thesis

**Mystery Pocket Tech** / RU working title **«Мистери Гаджеты: Ретро Распаковка»** is a Yandex Games collectible opener built around one strong object fantasy:

> **Open mystery tech → reveal a stylized Y2K gadget → discover rarity → improve a visible collection → repeat.**

The tactile opener and collectible desirability remain the product core. The implemented lightweight meta-loop is:

> **Basic Pouch → collectible + CHIPS → duplicate recycle + SIGNAL → Charged Pouch → better roll → repeat.**

The project is deliberately **not** a full idle/incremental economy. The meta-loop exists to make repeated openings purposeful without creating a high-production systems burden.

---

## 2. Current execution stages — LOCKED

### Stage A — internal vertical slice baseline — COMPLETE

Camera + Flip Phone established:

- pouch tear/reveal interaction;
- rarity presentation + Hidden Pocket carousel;
- Collection baseline;
- transactional save/recovery;
- responsive landscape presentation;
- asset production pipeline;
- Yandex/ads/analytics boundaries;
- exact-revision browser visual-QA workflow.

The two-family build remains private and is not the public release.

### Stage B — Gameplay Loop Lite V2 — IMPLEMENTED, VALIDATION IN PROGRESS

Current runtime contains:

- global CHIPS wallet + HUD transfer feedback;
- guaranteed base CHIPS + independent cache roll;
- duplicate auto-recycle → CHIPS + Signal;
- 4-segment Signal pity;
- Basic/Charged selection directly in Opening;
- separate pouch rarity/economy/Hidden Pocket profiles;
- Drop/loot-pool-aware reward resolution;
- versioned save migration;
- atomic Charged cost/reward recovery;
- deterministic tests/debug scenarios;
- exact-revision screenshot/video audit coverage.

Technical and visual gates are green. **Direct repeated hands-on is still pending** and is the current product gate.

### Stage C — real Yandex DRAFT validation — NEXT AFTER HANDS-ON

Validate the hosted runtime before content expansion:

- SDK boot / `LoadingAPI.ready()`;
- pause/resume/audio lifecycle;
- safe storage and migrated saves;
- interrupted Basic and Charged reveal recovery;
- retained Signal-lock edge + following Charged consumption;
- interstitial/rewarded/sticky boundaries;
- rewarded exactly-once dev CHIPS grant;
- analytics/Metrica where configured.

CI/local browser automation cannot replace this gate.

### Stage D — content/release build — BLOCKED ON STAGE C

Only after loop feel and hosted platform behavior are proven:

- materially expand gadget families;
- group content into themed Drops/loot pools;
- expose Drop selection only when Drop #2 exists;
- scale Collection around the real roster;
- re-simulate/tune economy at content scale;
- finalize monetization choices;
- produce final store creative after release content/key visual stabilizes.

### Stage E — public Yandex release

Final moderation/store/release hardening happens on the expanded content build.

---

## 3. Player fantasy

> **“I’m opening tiny mystery tech from the early 2000s and building a dream collection of nostalgic pocket gadgets.”**

The product is a collectible-toy fantasy, not repair simulation, electronics inventory management, gambling simulation or a spreadsheet-heavy idle game.

Target visual hypothesis remains:

- primary ~14–27, likely female-skewed but not exclusive;
- secondary ~25–35 nostalgia audience;
- recognizable Y2K electronics + blind-box desirability + tasteful cute finish.

---

## 4. Current core interaction

1. Mystery Pouch is ready.
2. Player chooses Basic or affordable Charged.
3. Player grabs the star tear-tab.
4. One short left-to-right drag completes the tear.
5. Complete reward transaction is already predetermined/persisted.
6. Base CHIPS and optional cache bonus are presented.
7. One standard gadget reveals with rarity + NEW/duplicate state.
8. Duplicate auto-recycles into CHIPS + Signal.
9. Hidden Pocket may add one Secret reveal.
10. Resources resolve into HUD; result becomes actionable.
11. Player repeats or opens Collection.

Compact form:

> **TEAR → LOOT → COLLECT / RECYCLE → PROGRESS → REPEAT**

No physics or multistage tactile simulation.

---

## 5. Progression model — CURRENT RUNTIME

Every Basic opening gives:

- one standard collectible;
- guaranteed base CHIPS;
- an independent chance of a CHIPS cache bonus;
- optional Hidden Pocket after onboarding.

Duplicates additionally give:

- rarity-dependent recycle CHIPS;
- `+1` Signal, capped at `4/4`.

At `4/4`, `SIGNAL LOCK` guarantees NEW only if the selected pouch has an eligible undiscovered standard candidate. If Basic has no eligible NEW because only Legendary remains, Basic resolves normally and Signal stays armed; the UI communicates `SIGNAL LOCK · CHARGED`.

CHIPS and Signal have different jobs:

- **CHIPS** = spendable progress toward a stronger pouch;
- **Signal** = non-spendable protection against duplicate streaks.

Legacy 0–100 Signal saves migrate with:

```text
newSignal = min(4, floor(oldSignal / 25))
```

---

## 6. Basic vs Charged — CURRENT PROVISIONAL TUNING

### Basic Pouch

- free/unlimited;
- base CHIPS: `6–10`;
- standard rarity weights Common/Rare/Epic/Legendary: `72 / 25 / 3 / 0`;
- Hidden Pocket chance from opening #4: `1.5%`;
- never standard-rolls Legendary, including under Signal pity.

### Charged Pouch

- cost: `60 CHIPS`;
- base CHIPS: `18–24`;
- rarity weights: `35 / 40 / 20 / 5`;
- Hidden Pocket chance from opening #4: `6%`;
- preserves materially stronger Rare/Epic access and non-zero Legendary access under Signal.

Duplicate recycle values are Common/Rare/Epic/Legendary = `2 / 4 / 8 / 15 CHIPS`.

Both pouch profiles independently roll cache tiers. Mega currently pays `120–180 CHIPS`; it is intentionally rare and may fund multiple future Charged openings.

These numbers are **implemented starting values, not release-locked balance**. Deterministic analysis of the current config keeps Charged a net CHIPS sink even in the all-duplicate case. Hands-on/content-scale simulation may tune the values without changing the mechanics.

---

## 7. Two independent luck axes

Collectible rarity and CHIPS-cache luck are separate rolls.

Possible combinations include:

- Common + Mega Cache;
- Rare + normal CHIPS;
- Epic + small/no cache bonus;
- ordinary standard result + rare Hidden Pocket Secret.

This creates reward variance without adding multi-standard drops or more currencies.

---

## 8. Content growth strategy — LOCKED ARCHITECTURE

Camera and Flip Phone are the first production families, not the final game.

Candidate future families include MP3 player, pager, mini camcorder, handheld console, PDA, portable disc/MiniDisc-like player, pocket radio, virtual-pet-like electronics and other suitable Y2K archetypes.

As the catalog grows:

- families belong to themed Drops / loot pools;
- Basic and Charged resolve inside the active Drop;
- Signal Lock targets NEW only inside the active Drop and selected-pouch eligibility;
- CHIPS and Signal remain global;
- selector stays hidden while only one Drop exists;
- rough 3–5 families per Drop is a heuristic, not a commitment.

Do not create one global mega-pool.

---

## 9. Collection fantasy

Current roles remain:

> **Shelf = attractive best finds. Library = exhaustive ownership/completion view.**

When multiple Drops actually exist, add the minimum grouping/navigation required by the real roster. Do not redesign Collection pre-emptively.

---

## 10. Monetization philosophy

Public product remains ad-supported, but ads do not define the gameplay economy.

Rules:

- rewarded is optional and explicit;
- interstitial only at logical pauses outside active tear/reveal;
- ad failure never blocks gameplay;
- fullscreen/rewarded pauses gameplay/audio correctly;
- no artificial energy scarcity solely to force ads.

The old `+25 Signal` dev probe is gone from the current design path; the debug rewarded probe grants CHIPS for exactly-once plumbing validation. Final public reward/cadence remains release tuning.

---

## 11. Current hands-on questions

The next player test should answer only what automation cannot:

- does Basic → CHIPS → Charged create a genuine “one more pouch” pull?
- does Charged feel worth saving for?
- are CHIPS/cache/recycle/Signal understandable without explanation?
- does `SIGNAL LOCK · CHARGED` make the exceptional Legendary-only state clear?
- are ordinary openings still pleasant after 20–50 repetitions?
- does the extra economy sequencing add friction?
- does the `CHARGED POUCH READY` milestone feel useful rather than interruptive?

If the loop works, **stop adding meta systems**.

---

## 12. Scope guardrails

Explicitly excluded from the current phase:

- Basic energy/regeneration timers;
- offline income;
- passive CHIPS/min;
- Overcharge / Archive levels;
- upgrade/set-bonus trees;
- shop scene;
- multiple spendable currencies;
- multiple standard collectibles per pouch;
- prestige/reset;
- auto-open/x5;
- crafting/merge/trading/market;
- large minigame suite;
- real-time 3D;
- speculative backend/live-service infrastructure.

> **The release should become content-rich and loop-rich, not system-bloated.**
