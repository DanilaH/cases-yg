# Implementation roadmap

This roadmap reflects the project after the reveal/pouch/asset-production passes. The two-family build is a private development base, not the public product.

Current execution order:

1. **Gameplay Loop Lite V2** — add CHIPS, recycle, simplified Signal, Charged Pouch and Drop-aware data with minimal scope.
2. **Exact-revision visual audit + direct hands-on** — validate repeated-use feel.
3. **Real Yandex DRAFT validation** — validate hosted SDK/storage/ads/lifecycle with the Lite loop in place.
4. **Content/release expansion** — add multiple gadget families grouped into Drops and rebalance from real content scale.
5. **Public release hardening** — store materials, final moderation QA and launch.

Do not skip directly to large content production before the Lite loop and hosted draft are proven.

---

# Phase 0 — established baseline — COMPLETE

Already present in current `main`:

- Phaser 4.2.1 + Vite + strict TypeScript;
- `BootScene`, `OpeningScene`, `CollectionScene`;
- adaptive landscape layout;
- transactional `pendingReveal` recovery;
- Camera + Flip Phone, four standard rarities + one Secret each;
- production pouch/body/star/compact tear-strip integration;
- Opening/Collection environment art;
- SFX integration;
- rarity FX, Hidden Pocket carousel and reward breathing;
- Yandex/storage/analytics/ads provider boundaries;
- deterministic debug scenarios;
- permanent CI;
- exact-revision browser screenshot/video visual-review workflow.

The old docs that described asset production as the next critical path are stale and are superseded by this roadmap.

---

# Phase 1 — Gameplay Loop Lite V2

Target: materially improve repeated-opening motivation without building a full idle/incremental game.

## 1.1 Data/economy model first

Add typed config and pure logic for:

- `PouchType = 'basic' | 'charged'`;
- global `chips` wallet;
- Basic and Charged payout/rarity/Hidden Pocket profiles;
- rarity-dependent duplicate recycle CHIPS;
- simplified Signal (`+1` per duplicate, target threshold `4`);
- `dropId` / `lootPoolId` membership;
- active Drop selection state, even though selector remains hidden with one Drop.

Do **not** hard-code final tuning numbers that have not been decided. The following are still explicit tuning inputs:

- Charged cost;
- Basic/Charged CHIPS payouts;
- duplicate recycle CHIPS by rarity;
- Charged rarity weights;
- Basic/Charged Hidden Pocket probabilities.

Definition of done: pure engine can resolve Basic/Charged reward transactions and Signal/Drop behavior deterministically without Phaser.

## 1.2 Extend transactional save/recovery

Extend the existing reveal transaction so Charged spend and all rewards are atomic.

Conceptually persist:

```text
pouchType
lootPoolId
baseChips
chipsCost
pouchChipsReward
recycleChipsReward
standard result
signal before/after/lock state
hiddenPocket result
final committed snapshot
```

Required invariants:

- refresh cannot reroll a reward;
- Charged cost cannot be lost without its reward;
- one transaction cannot grant CHIPS twice;
- recovered reveal preserves the original Drop and pouch profile;
- Signal Lock is not consumed when the active Drop has no undiscovered standard item.

Add save migration for existing slice saves rather than invalidating user state.

## 1.3 Opening UI / reward presentation

Add only the minimum new UI:

- CHIPS HUD counter;
- Basic/Charged affordability/ready state on Opening screen;
- no separate shop;
- chip-token reward burst;
- chip-token flight into HUD;
- duplicate `RECYCLED` feedback;
- Signal segmented HUD (`0..4` / `SIGNAL LOCK`);
- clear `CHARGED POUCH READY` beat when a payout crosses the cost threshold.

Reward sequencing target:

```text
tear
→ CHIPS reward presentation
→ one standard collectible
→ NEW or duplicate/recycle
→ optional Hidden Pocket
→ resource transfer to HUD
→ result ready
```

Important: token-flight/tween completion is never the durable economy mutation.

## 1.4 Charged Pouch presentation

Charged must feel clearly better without new systemic complexity.

Use:

- same core tear interaction;
- runtime glow/electric/accent treatment around the existing pouch where practical;
- stronger reward/rarity anticipation;
- larger CHIPS payout presentation;
- better rarity profile + higher Hidden Pocket profile.

Do not add a second/third standard collectible in Lite V2.

## 1.5 Signal migration

Replace the old 0–100 weighted pity with:

```text
any standard duplicate → +1 SIGNAL
4/4 → SIGNAL LOCK
next standard collectible → undiscovered item in active Drop
consume → 0/4
```

Remove/retire the old rarity-dependent `+25/+20/+15/+10` behavior and late-lock weighted fallback when the migration lands. Do not leave two competing pity semantics in code or UI.

## 1.6 Drop-aware architecture

Current content belongs to one initial Drop. No player-facing selector yet.

Core systems must nevertheless resolve against an active `lootPoolId` so later content expansion becomes configuration work.

Future behavior when Drop #2 exists:

- expose compact Drop selector;
- Basic/Charged roll only in selected Drop;
- Signal Lock targets NEW in selected Drop;
- CHIPS/Signal remain global.

No family-targeted pouch in this phase.

---

# Phase 2 — Lite V2 validation

Use the established workflow:

1. isolated implementation passes where visual/motion changes are meaningful;
2. technical tests/CI;
3. exact-revision browser screenshots/video;
4. reviewer actually inspects captures;
5. fix obvious defects before user hands-on;
6. final combined visual/interaction gate;
7. direct user repeated-opening test.

Hands-on should answer only the questions that automation cannot:

- does every opening feel meaningfully rewarding?
- is CHIPS acquisition legible without explanation?
- does duplicate recycle soften disappointment rather than clutter the reveal?
- is `4 duplicates → next NEW` immediately understandable?
- does Charged feel worth saving for?
- does Basic → Charged create a natural “one more pouch” impulse?
- does the extra reward sequencing make the opener slower/annoying after 20–50 repetitions?

If the Lite loop works, **stop adding meta systems**.

---

# Phase 3 — real Yandex DRAFT validation

Run `docs/YANDEX_SLICE_VALIDATION.md` against the hosted Lite V2 build.

Must cover:

- real `/sdk.js` boot / `LoadingAPI.ready()`;
- pause/resume/audio;
- storage and save migration;
- interrupted Basic reveal recovery;
- interrupted Charged reveal recovery with atomic cost/reward;
- interstitial;
- rewarded exactly-once behavior;
- sticky boundary if enabled;
- Metrica goals where configured.

The old dev-only rewarded `+25 Signal` probe should be replaced with a clearly dev-only CHIPS grant after Signal migration, because rewarded plumbing must not manipulate pity state.

Do not claim this phase complete from CI/local browser tests.

---

# Phase 4 — content and release build

## 4.1 Lock first expanded roster

Choose new families using:

- visual desirability;
- silhouette diversity;
- Y2K recognition;
- asset-generation consistency;
- measured per-family production burden.

Candidate pool remains:

- MP3 player;
- pager;
- mini camcorder;
- handheld console;
- PDA;
- portable disc/MiniDisc-like player;
- pocket radio;
- virtual-pet-like electronic;
- additional suitable Y2K archetypes.

## 4.2 Group into Drops

Do not build one global pool.

Create themed Drops/loot pools, roughly 3–5 families each as a starting heuristic.

With more than one Drop:

- expose selector;
- keep wallet/Signal global;
- keep Basic/Charged mechanics unchanged;
- allow each Drop to feel like a fresh completion surface.

## 4.3 Content factory

For each family:

```text
6–10 explorations
→ canonical master
→ Common / Rare / Epic / Legendary
→ Secret only where planned
→ cleanup/export/log
```

## 4.4 Rebalance from real scale

Re-simulate:

- Basic rarity profile;
- Charged rarity profile;
- Charged cost;
- CHIPS income/recycle economy;
- Signal threshold if 4 proves too generous/slow at release scale;
- Hidden Pocket by pouch type;
- completion/chase horizon.

Preserve the simple player-facing semantics unless evidence demands a change.

## 4.5 Scale Collection only when required

Use Drops as the first grouping primitive. Add pages/filtering/themed shelves only when real content density requires them.

Family-targeted acquisition remains deferred until completion data shows a real problem.

## 4.6 Final monetization tuning

Infrastructure already exists. Decide final rewarded benefit, interstitial pause points and sticky use only after the actual release loop/content exists.

---

# Phase 5 — public release hardening

Only now:

- final RU/EN metadata;
- icon/cover/hero;
- localized gameplay screenshots;
- final asset-memory/loading strategy for expanded catalog;
- moderation viewport/input QA;
- release ad configuration;
- save/recovery/lifecycle QA;
- analytics QA;
- final Yandex draft pass if release build materially differs from the earlier hosted validation;
- moderation submission.

Use `docs/YANDEX_SUBMISSION_CHECKLIST.md`.

---

# Scope guardrail

The next pass is **not “build an idle game.”**

It is:

> **add one cheap meta-loop that makes the existing tactile opener worth repeating.**

Explicitly parked until evidence asks for them:

- timed Basic charges/energy;
- offline income;
- collection passive production;
- Overcharge;
- Archive levels;
- upgrade trees/set bonuses;
- shop scene;
- multiple currencies;
- multiple standard collectible drops;
- auto-open/x5;
- prestige/crafting/merge/trading.

If Basic → CHIPS → Charged already produces the desired pull, adding these systems would be scope creep rather than progress.
