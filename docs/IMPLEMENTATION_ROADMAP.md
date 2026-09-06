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
- guaranteed base CHIPS payout per pouch profile;
- independent CHIPS-cache bonus roll per pouch profile;
- Basic rarity access: Common / Rare / small Epic, **no Legendary**;
- Charged rarity access: Common / Rare / Epic / Legendary, with materially stronger Rare/Epic weighting;
- rarity-dependent duplicate recycle CHIPS;
- simplified Signal (`+1` per duplicate, threshold `4`);
- `dropId` / `lootPoolId` membership;
- active Drop selection state, even though selector remains hidden with one Drop.

Do **not** hard-code final tuning numbers. Still-open inputs:

- Charged cost;
- Basic/Charged base CHIPS payout ranges;
- cache tier probabilities/ranges by pouch profile;
- duplicate recycle CHIPS by rarity;
- Basic rarity weights inside Common/Rare/Epic;
- Charged rarity weights inside Common/Rare/Epic/Legendary;
- Basic/Charged Hidden Pocket probabilities.

Locked economy invariants:

- every Basic opening gives one collectible + base CHIPS;
- collectible rarity luck and cache luck are independent;
- a very rare top cache may fund several Charged openings;
- Charged remains a net CHIPS sink in expectation;
- Basic cannot standard-roll Legendary, including under Signal pity;
- Charged is the standard route to Legendary;
- Basic may still very rarely reach Secret through Hidden Pocket.

Definition of done: pure engine can resolve Basic/Charged reward transactions, cache outcomes, rarity gating and Signal/Drop behavior deterministically without Phaser.

## 1.2 Extend transactional save/recovery

Extend the existing reveal transaction so Charged spend and all rewards are atomic.

Conceptually persist:

```text
pouchType
lootPoolId
baseChips
chipsCost
basePouchChipsReward
cacheTier/cacheChipsReward
recycleChipsReward
standard result
signal before/after/lock reached/consumed/retained state
hiddenPocket result
final committed snapshot
```

Required invariants:

- refresh cannot reroll a reward or cache tier;
- Charged cost cannot be lost without its reward;
- one transaction cannot grant base/cache/recycle CHIPS twice;
- recovered reveal preserves original Drop and pouch profile;
- a retained Signal lock remains retained after recovery;
- Signal Lock is not consumed when active Drop has no undiscovered standard item or when the selected pouch has no eligible undiscovered item.

Add save migration for existing slice saves rather than invalidating user state.

## 1.3 Signal migration

Replace old 0–100 weighted pity with:

```text
any standard duplicate → +1 SIGNAL
4/4 → SIGNAL LOCK
next standard roll with eligible missing item → guaranteed NEW
consume → 0/4
```

Legacy conversion is locked:

```text
newSignal = min(4, floor(oldSignal / 25))
```

So `0–24→0`, `25–49→1`, `50–74→2`, `75–99→3`, `100→4/LOCK`.

When lock is armed:

1. collect undiscovered standard candidates in active Drop;
2. filter them through the selected pouch rarity gate/non-zero weights;
3. if eligible candidates remain, preserve selected pouch weighting among them, pick guaranteed NEW and consume lock;
4. if none remain, resolve the selected pouch normally and **keep Signal at `4/4`**.

This explicitly creates the strict Charged gate: if only Legendary remains, Basic never receives it through pity. Basic can still open normally for collectible/CHIPS/recycle while Signal waits; an eligible Charged opening then guarantees the missing Legendary and consumes the lock.

Remove old rarity-dependent `+25/+20/+15/+10` and late-lock fallback completely when migration lands.

## 1.4 Opening UI / reward presentation

Add only minimum new UI:

- CHIPS HUD counter;
- Basic/Charged affordability/ready state on Opening screen;
- no separate shop;
- chip-token reward burst;
- stronger runtime burst/copy for rare cache outcomes;
- chip-token flight into HUD;
- duplicate `RECYCLED` feedback;
- Signal segmented HUD (`0..4` / `SIGNAL LOCK`);
- clear `CHARGED POUCH READY` beat when payout crosses threshold;
- clear waiting state such as `SIGNAL LOCK · CHARGED` when Signal is armed but Basic has no eligible NEW.

Reward sequencing target:

```text
tear
→ base CHIPS presentation
→ optional cache bonus beat
→ one standard collectible
→ NEW or duplicate/recycle
→ optional Hidden Pocket
→ resource transfer to HUD
→ result ready
```

Important: visible token count is not the economic amount, and tween completion is never the durable economy mutation.

## 1.5 Charged Pouch presentation

Charged must feel clearly better without new systemic complexity.

Use:

- same core tear interaction;
- runtime glow/electric/accent treatment around existing pouch where practical;
- stronger reward/rarity anticipation;
- stronger CHIPS/cache presentation;
- access to Legendary plus materially better Rare/Epic profile;
- higher Hidden Pocket profile.

Do not add a second/third standard collectible in Lite V2.

## 1.6 Drop-aware architecture

Current content belongs to one initial Drop. No player-facing selector yet.

Core systems must nevertheless resolve against active `lootPoolId` so later content expansion becomes configuration work.

Future behavior when Drop #2 exists:

- expose compact Drop selector;
- Basic/Charged roll only in selected Drop;
- Signal Lock targets NEW in selected Drop only among candidates eligible for the selected pouch;
- if no eligible candidate exists for that pouch, retain the lock;
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

Hands-on should answer only questions automation cannot:

- does every opening feel meaningfully rewarding?
- is CHIPS acquisition legible without explanation?
- do rare cache outcomes feel exciting rather than arbitrary/noisy?
- does duplicate recycle soften disappointment rather than clutter reveal?
- is `4 duplicates → next eligible NEW` immediately understandable?
- when only Legendary remains, does `SIGNAL LOCK · CHARGED` clearly explain why Basic does not consume the lock?
- does Basic still feel worth opening even without Legendary access?
- does Charged feel worth saving for because top standard rarity lives there?
- does Basic → Charged create a natural “one more pouch” impulse?
- does extra sequencing make opener slower/annoying after 20–50 repetitions?

If Lite loop works, **stop adding meta systems**.

---

# Phase 3 — real Yandex DRAFT validation

Run `docs/YANDEX_SLICE_VALIDATION.md` against hosted Lite V2 build.

Must cover:

- real `/sdk.js` boot / `LoadingAPI.ready()`;
- pause/resume/audio;
- storage and save migration;
- interrupted Basic reveal recovery;
- interrupted Charged reveal recovery with atomic cost/reward/cache outcome;
- Signal retained-lock edge and following Charged consumption;
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

- Basic Common/Rare/Epic profile;
- Charged Common/Rare/Epic/Legendary profile;
- Charged cost;
- base CHIPS income;
- cache tier frequency/size;
- recycle economy;
- Signal threshold if 4 proves too generous/slow at release scale;
- Hidden Pocket by pouch type;
- completion/chase horizon.

Preserve simple player-facing semantics unless evidence demands change.

## 4.5 Scale Collection only when required

Use Drops as first grouping primitive. Add pages/filtering/themed shelves only when real content density requires them.

Family-targeted acquisition remains deferred until completion data shows a real problem.

## 4.6 Final monetization tuning

Infrastructure already exists. Decide final rewarded benefit, interstitial pause points and sticky use only after actual release loop/content exists.

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
- final Yandex draft pass if release build materially differs from earlier hosted validation;
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
