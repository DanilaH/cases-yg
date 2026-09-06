# Implementation roadmap

The two-family build is a private development base, not the public release.

## Current execution order

1. **Direct Lite V2 repeated hands-on — CURRENT**
2. **Fix only evidence-backed friction — CONDITIONAL**
3. **Real Yandex DRAFT validation — NEXT REQUIRED PLATFORM GATE**
4. **Content/release expansion — BLOCKED until draft passes**
5. **Public release hardening**

Do not return to broad feature ideation or large content production before hands-on and hosted validation are complete.

---

# Phase 0 — established opener baseline — COMPLETE

Current `main` already includes:

- Phaser 4.2.1 + Vite + strict TypeScript;
- `BootScene`, `OpeningScene`, `CollectionScene`;
- adaptive landscape layout;
- transactional `pendingReveal` recovery;
- Camera + Flip Phone, four standard rarities + one Secret each;
- production pouch/body/star/compact tear-strip integration;
- Opening/Collection environment art;
- production SFX set;
- rarity FX, Hidden Pocket carousel, ambient motion and reward breathing;
- Yandex/storage/analytics/ads boundaries;
- deterministic debug scenarios;
- permanent CI;
- exact-revision screenshot/video visual-review workflow.

---

# Phase 1 — Gameplay Loop Lite V2 — COMPLETE

Target was to improve repeated-opening motivation without building a full idle/incremental game. That implementation is now present.

## 1.1 Economy / reward engine — COMPLETE

Implemented:

- `PouchType = 'basic' | 'charged'`;
- global CHIPS wallet;
- guaranteed base CHIPS per pouch profile;
- independent Cache/Big/Mega bonus roll;
- Basic Common/Rare/Epic access, Legendary weight `0`;
- Charged Common/Rare/Epic/Legendary profile;
- rarity-dependent duplicate recycle;
- `+1` Signal per duplicate, threshold `4`;
- loot-pool-aware reward resolution;
- active loot-pool state.

Current provisional tuning lives in `LITE_V2_BALANCE`:

```text
Basic
  cost: 0
  base CHIPS: 6–10
  rarity C/R/E/L: 72/25/3/0
  Hidden Pocket: 1.5%
  cache weights none/cache/big/mega: 90/7/2.5/0.5

Charged
  cost: 60
  base CHIPS: 18–24
  rarity C/R/E/L: 35/40/20/5
  Hidden Pocket: 6%
  cache weights none/cache/big/mega: 78/15/5.5/1.5

Cache rewards
  none: 0
  cache: 20–35
  big: 45–75
  mega: 120–180

Duplicate recycle C/R/E/L
  2/4/8/15
```

These are implementation starting values, not final release tuning.

## 1.2 Transactional save/recovery — COMPLETE

Current transaction preserves:

- pouch type;
- loot pool;
- CHIPS before/cost/base/cache/recycle;
- standard reward;
- Signal transition including retained lock;
- Hidden Pocket result;
- deterministic final commit snapshot.

Properties covered by tests:

- no refresh reroll;
- no cache reroll;
- Charged cost/reward atomicity;
- no duplicate CHIPS grant;
- retained Signal remains retained after recovery;
- ambiguous storage failures are reconciled against exact durable transaction state.

## 1.3 Signal migration — COMPLETE

Active runtime uses:

```text
duplicate → +1
4/4 → SIGNAL LOCK
next selected-pouch-eligible missing standard → guaranteed NEW
consume → 0
```

Legacy conversion:

```text
min(4, floor(oldSignal / 25))
```

Strict Charged gate is implemented: if only Legendary remains, Basic cannot consume the lock or bypass Legendary weight `0`.

## 1.4 Opening UI / reward presentation — COMPLETE

Implemented:

- CHIPS HUD;
- segmented Signal HUD;
- Basic/Charged selector + cost/affordability;
- Phaser-rendered CHIPS token identity;
- base/cache reward beats;
- duplicate `RECYCLED` feedback;
- resource flights;
- Charged aura/treatment;
- `SIGNAL LOCK · CHARGED` waiting state;
- `CHARGED POUCH READY` threshold beat;
- Charged selection continuity while affordable and Basic fallback when not.

A final visual audit found the Charged-ready banner was initially destroyed too early by result re-render. That presentation defect was fixed and the corrected exact revision was audited again before merge.

## 1.5 Drop-aware architecture — COMPLETE FOR ONE-DROP RUNTIME

Current systems resolve against active `lootPoolId`. No player selector is shown because only one production Drop exists.

When Drop #2 exists, selector exposure should be a compact UI/config expansion, not a reward-engine rewrite.

---

# Phase 2 — Lite V2 validation — CURRENT

## Automated / reviewer gates — COMPLETE

Current merged tree has passed:

- strict typecheck;
- 87 unit tests;
- asset self-test/validation;
- production build;
- exact-revision browser screenshots/video;
- manual artifact inspection;
- Basic/Charged/cache/recycle/Signal/Hidden/recovery/continuity/fallback/responsive/RU states;
- post-merge CI.

## Direct repeated hands-on — OPEN

Run **20–50 openings** and answer only questions automation cannot:

- does every opening feel meaningfully rewarding?
- is CHIPS acquisition legible without explanation?
- do cache outcomes feel exciting rather than arbitrary/noisy?
- does recycle soften duplicates without slowing the loop?
- is `4 duplicates → next eligible NEW` understandable?
- is `SIGNAL LOCK · CHARGED` understandable when only Legendary remains?
- does Basic remain worth opening despite no standard Legendary?
- does Charged feel worth saving for?
- does Basic → Charged create a natural “one more pouch” impulse?
- does the added sequencing become annoying after repetition?
- does `CHARGED POUCH READY` help or feel like an interruption?

### Allowed response to hands-on findings

If a problem appears, make the smallest evidence-backed correction and rerun the relevant exact-revision gate.

Do **not** respond by adding offline income, new currencies, Overcharge, Archive levels, x5 opening or other scope expansion.

If the loop works, stop changing the meta-loop.

---

# Phase 3 — real Yandex DRAFT validation — NEXT

Run `docs/YANDEX_SLICE_VALIDATION.md` against a hosted build after hands-on acceptance.

Must cover:

- real `/sdk.js` boot / `LoadingAPI.ready()`;
- pause/resume/audio lifecycle;
- safe storage and save migration;
- interrupted Basic reveal recovery;
- interrupted Charged reveal recovery with atomic cost/reward/cache outcome;
- retained Signal-lock edge + following Charged consumption;
- interstitial;
- rewarded exactly-once dev CHIPS path;
- sticky boundary if enabled;
- Metrica goals where configured.

Do not claim this phase complete from CI/local browser tests.

---

# Phase 4 — content and release build

Start only after Phase 3 passes.

## 4.1 Lock first expanded roster

Choose new families using:

- visual desirability;
- silhouette diversity;
- Y2K recognition;
- asset-generation consistency;
- measured per-family production burden.

Candidate pool:

- MP3 player;
- pager;
- mini camcorder;
- handheld console;
- PDA;
- portable disc/MiniDisc-like player;
- pocket radio;
- virtual-pet-like electronics;
- additional suitable Y2K archetypes.

## 4.2 Group into Drops

Do not build one global pool. Roughly 3–5 families per themed Drop remains a starting heuristic, not a fixed count.

With more than one Drop:

- expose compact selector;
- keep CHIPS/Signal global;
- keep Basic/Charged mechanics unchanged;
- make each Drop a fresh completion surface.

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

Re-simulate/tune:

- Basic/Charged rarity profiles;
- Charged cost;
- base CHIPS income;
- cache frequency/size;
- duplicate recycle;
- Signal threshold only if evidence demands it;
- Hidden Pocket by pouch type;
- completion/chase horizon.

Preserve simple player-facing semantics unless evidence requires change.

## 4.5 Scale Collection only when required

Drops are the first grouping primitive. Add pages/filtering/themed shelves only when real density requires them.

## 4.6 Final monetization tuning

Infrastructure exists. Decide actual rewarded benefit, interstitial pause points and sticky use after the release loop/content shape is known.

---

# Phase 5 — public release hardening

Only after expanded release content stabilizes:

- final RU/EN metadata;
- icon/cover/hero;
- localized gameplay screenshots;
- final asset-memory/loading strategy;
- moderation viewport/input QA;
- release ad configuration;
- save/recovery/lifecycle QA;
- analytics QA;
- final hosted draft pass if release build materially differs;
- moderation submission.

Use `docs/YANDEX_SUBMISSION_CHECKLIST.md`.

---

# Scope guardrail

The project is not “build an idle game.” The current engineering problem is already solved; the current product question is whether the implemented lightweight loop **feels good enough to repeat**.

Parked unless evidence gives one a concrete job:

- timed Basic energy;
- offline income;
- passive Collection production;
- Overcharge;
- Archive levels;
- upgrade trees/set bonuses;
- shop scene;
- multiple currencies;
- multi-standard drops;
- auto-open/x5;
- prestige/crafting/merge/trading.

> **Current next action: hands-on, not another feature pass.**
