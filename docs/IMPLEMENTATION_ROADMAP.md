# Implementation roadmap

The two-family build is a private development base, not the public release.

## Current execution order

1. **Opening Feel Correction — COMPLETE**
2. **Exact-revision combined visual/video audit + manual review — COMPLETE**
3. **Second repeated-use hands-on — COMPLETE WITH FOLLOW-UP FINDINGS**
4. **Bounded post-hands-on UI/feel polish — COMPLETE / AUDITED / MERGED**
5. **Final direct hands-on — COMPLETE WITH NEW BOUNDED FINDINGS**
6. **Final-hands-on correction + Signal Overcharge — IMPLEMENTED / EXACT-AUDITED**
7. **Final direct repeated-use regression — COMPLETE / ACCEPTED AFTER BOUNDED LIFECYCLE FIX**
8. **Secret reward/reward-tray correction — IMPLEMENTED / EXACT-BROWSER-AUDITED / MERGED**
9. **Final merged-main repeated-use regression after Secret correction — CURRENT INTERNAL GATE**
10. **Real Yandex DRAFT validation — NEXT EXTERNAL GATE AFTER #9 PASSES**
11. **Content/release expansion — BLOCKED until draft passes**
12. **Public release hardening**

The latest direct play exposed concrete UI/input/clarity issues plus one legitimate dead-Signal edge after collection completion. The approved response stayed bounded: those findings and Signal Overcharge were implemented, exact-audited and accepted. The earlier final repeated-use regression then found one stale Overcharge reward-tag tween lifecycle crash; PR #50 fixed only that callback-after-teardown defect, and the exact fixed tree passed targeted stress plus a fresh 24-opening normal loop. A later bounded Secret/reward correction was then implemented and merged through PRs #55–#57, including Save V4 and exact 34/34 browser acceptance. Because that correction changed runtime after the earlier repeated-use approval, a fresh merged-main repeated-use regression is now the final internal gate before hosted Yandex DRAFT.

Do not tune legacy economy numbers by intuition. Overcharge gain/cap are allowed only as simulation-driven tuning inside the approved pass. Do not expand content or add unrelated meta systems before hosted DRAFT.

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

Implemented:

- global CHIPS wallet;
- Basic/Charged pouch profiles;
- guaranteed base CHIPS + independent Cache/Big/Mega roll;
- Basic C/R/E with Legendary weight `0`;
- Charged C/R/E/L with stronger top end;
- duplicate auto-recycle → CHIPS + Signal;
- segmented Signal `+1`, threshold `4`;
- strict selected-pouch Signal eligibility;
- loot-pool-aware reward resolution;
- active loot-pool state;
- save V2 migration;
- atomic Charged cost/reward recovery;
- CHIPS/Signal Opening HUD;
- Basic/Charged selector;
- Charged selection continuity and insufficient-wallet fallback;
- cache/recycle/Signal/Hidden presentation;
- `CHARGED POUCH READY` milestone;
- deterministic tests/debug coverage.

Current provisional tuning remains unchanged during the feel correction:

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
  0 / 20–35 / 45–75 / 120–180

Duplicate recycle C/R/E/L
  2/4/8/15
```

Current deterministic economy analysis keeps Charged a net CHIPS sink. Tuning remains a separate evidence question.

---

# Phase 2 — Lite V2 first validation — COMPLETE WITH FINDINGS

Already passed:

- strict typecheck;
- 108 unit tests;
- asset self-test/validation;
- production build;
- exact-revision browser screenshots/video;
- manual artifact inspection;
- Basic/Charged/cache/recycle/Signal/Hidden/recovery/continuity/fallback/responsive/RU states;
- post-merge CI.

The first direct hands-on found real UX/feel issues:

- CHIPS need stronger audio/tactile feedback;
- CHIPS HUD is too small/weak;
- wallet values should count up and react physically;
- Basic/Charged selector is cramped and selected state is unclear;
- important callouts are too brief;
- earned CHIPS should stage with the result and bank after acceptance;
- Charged visual differentiation is not strong enough;
- `RESULT LOCKED` / dead tapping is frustrating;
- UI needs a stronger electronic/neon Y2K identity;
- player also wants better visibility into odds/Drop contents/collection progress, but that is deliberately deferred from the immediate feel correction.

Because evidence exists, a correction pass is justified before Yandex DRAFT.

---

# Phase 2.1 — Opening Feel Correction — COMPLETE

Canonical scope: `docs/OPENING_FEEL_CORRECTION_SCOPE.md`.

## Pass A — input + reward choreography

Implement:

- intentional tap/click fast-forward of active reveal presentation;
- remove player-facing dead `RESULT LOCKED` behavior;
- short post-tear input guard;
- immediate star grab response;
- subtle tension during drag;
- short tear recoil/snap;
- longer readable callouts combined with fast-forward;
- reward staging beside hero;
- visual CHIPS banking on result acceptance.

Keep:

- same deterministic tear mechanic;
- same prepared transaction;
- same economy result;
- no physics;
- no new Quick Reveal mode.

## Pass B — resource tactile feedback

Implement:

- larger CHIPS card;
- digital numeric treatment;
- count-up animation to deterministic target;
- local HUD punch/shake/glow;
- one bounded synthesized `chip-clack` CHIPS-banking cue;
- base → cache → recycle banking order;
- duplicate → CHIPS + Signal physical transfer;
- Signal destination segment response;
- Charged-ready activation at actual displayed threshold crossing rather than a mandatory isolated blocking beat.

No tween or sound event may own durable currency state.

## Pass C — Opening UI + visual language

Implement:

- left-side gameplay rail for CHIPS / Signal / pouch selection;
- clear Basic/Charged selected state independent of color;
- responsive hover/down/release feedback;
- feedback for unaffordable Charged attempts;
- stronger Charged cyan/violet/iridescent runtime presentation;
- one accent digital/pixel-like font for short electronic system labels/numbers;
- restrained neon glow/shimmer hierarchy for CHIPS, Signal, Charged and rarities;
- small controlled animation variation.

Visual rule:

> **Cozy Y2K world, electric digital UI.**

No custom shader in this pass. Use Phaser Text/Graphics/tint/blend/highlight/tweens first.

A dedicated recolored Charged pouch raster becomes allowed only if a label-hidden exact-revision audit still cannot distinguish Basic from Charged.

---

# Phase 2.2 — combined correction validation — COMPLETE

Do not approve the three internal passes independently as the final product. Feel depends on their combined choreography.

Run:

- typecheck;
- full unit suite;
- asset self-test/validation;
- production build;
- exact-revision browser screenshot/video capture;
- manual artifact review.

Minimum visual/motion states:

- Basic idle with new rail/HUD;
- Basic vs Charged selected, judging without relying on labels;
- unavailable Charged attempt feedback;
- grab/drag/tear recoil;
- ordinary reward staged before acceptance;
- base CHIPS banking/count-up/HUD response;
- Cache/Big/Mega intensity;
- Charged-ready threshold crossing during bank;
- duplicate/recycle/Signal transfer;
- `4/4`, lock and `LOCK · CHARGED`;
- rarity hierarchy Common/Rare/Epic/Legendary;
- Charged iridescent treatment;
- Hidden Pocket;
- tap-to-fast-forward;
- accidental drag-release protection;
- recovered Basic/Charged;
- 900/1024/wider widths;
- RU compact layout.

Generated artifacts do not self-approve. Manual review remains mandatory.

---

# Phase 2.3 — second repeated-use hands-on — COMPLETE WITH FOLLOW-UP FINDINGS

The corrected opener was played again rather than being approved from automation alone. The repeated-use pass and independent pre-hands-on reviews found narrow presentation/input issues, not a need for new mechanics or balance changes.

Evidence-backed findings included:

- abrupt result/banking → idle handoff;
- resize during active banking leaving stale wide geometry;
- weak portrait orientation blocker;
- one-gesture → two-actions result input race;
- mute unavailable before the first opening;
- low-contrast load-failure UI;
- reward tray replaying its entry when result UI appeared;
- star grab lacking a material interaction cue;
- rarity metadata under-emphasized in the result panel;
- reward rows too visually uniform to communicate cache/recycle/Signal semantics.

No finding justified balance tuning, new content, odds UI, Quick Reveal, x5 or a larger scene architecture rewrite.

---

# Phase 2.4 — bounded post-hands-on polish — COMPLETE

The follow-up fixes were implemented in small patches and independently re-audited. Current merged runtime now includes:

- smooth result/banking → idle handoff;
- safe compact resize policy during banking;
- polished orientation/load-failure states;
- one physical gesture → one semantic action;
- mute available before the first opening;
- reward tray continuity: tray appears once, then result panel enters on a later beat;
- synth-only `pouch-grab` pop/zip cue;
- stronger rarity capsule + rarity-tinted result border;
- semantic reward-row colors and rarity-aware recycle copy.

Latest reward/result polish merged via PR #45. Audited product head `afeb2ac50cba02cec68dcabd60a18e16ced97094`; audited product tree `8a8375b27c2f4001ab4160922d447d7b56d5f36f`; R3 normal-flow browser/video audit passed; squash merge `2837872d6ff9ffb3f6e492725fb034bfc82f5f4a` has the identical tree; post-merge CI #248 passed.

At this historical phase the baseline was 108 unit tests; the current post-Secret baseline is **130 unit tests** + typecheck + asset self-test/validation + production build.

---

# Phase 2.5 — final direct hands-on — COMPLETE WITH FINDINGS

Direct play confirmed the opener is broadly enjoyable but exposed a bounded set of remaining issues:

- opaque black rarity backing feels visually foreign;
- maximum-density reward copy can overflow;
- Signal's purpose/retain/consume behavior is not self-explanatory enough;
- unaffordable Charged denial tween can accumulate displacement under rapid clicking;
- affordable non-selected paid pouches need a restrained availability affordance;
- Secret discovery lacks explicit reward/collection meaning;
- Secret reveal can support a stronger premium aura/burst/shake settle;
- completed/zero-eligible states leave armed Signal without enough continuing value.

These findings justify one final bounded pass before DRAFT.

---

# Phase 2.6 — final-hands-on correction + Signal Overcharge — IMPLEMENTED / EXACT-AUDITED

Canonical contract: `docs/FINAL_HANDS_ON_OVERCHARGE_PLAN.md`.

Execution order:

1. fix rarity badge treatment, reward overflow and Charged denial drift;
2. add subtle affordance for affordable non-selected paid pouches;
3. make Signal gain → ready → retain/consume semantics explicit;
4. make current Secret collection reward explicit and strengthen the Secret celebration;
5. implement deterministic/recoverable Signal Overcharge state/economy;
6. add HUD/reward presentation for multiplier bonus, post-reward gain, MAX and discharge;
7. simulate pouch gains/cap and lock only evidence-backed tuning;
8. run exact browser/video audit + direct repeated-use regression.

Current validation tuning is implemented as Basic `+0.10`, Charged `+0.50`, with cap `x1.50`. The legacy pouch economy is unchanged; these new parameters may be reopened later only from hosted/content-scale evidence.

The future several-hundred-CHIPS high-tier/Secret-oriented pouch is a later hypothesis only; do not implement it in Phase 2.6.

---

# Phase 2.7 — Secret reward + reward-tray correction — IMPLEMENTED / EXACT-BROWSER-AUDITED / MERGED

Canonical contract: `docs/SECRET_REWARD_CORRECTION.md`.

Merged outcome:

- wider/readable right-preferred reward tray + self-contained debug scenarios (PR #55);
- Save V4 with persisted Secret new/duplicate outcome and fixed `+40 CHIPS` jackpot excluded from Overcharge (PR #56);
- Hidden Pocket guarantees missing Secrets first, then remains alive as duplicate jackpots after 2/2;
- ruby/coral + warm-gold Secret identity, stronger arrival and persistent premium state until collect;
- one reward tray follows standard/Secret carousel selection;
- recovery and aggressive fast-forward preserve exact transaction/result state;
- exact product head `629d5beb666aa9365ce7197082938ea1a50d9d15` passed **34/34** browser assertions with zero runtime/request/HTTP diagnostics and manual artifact review;
- merged runtime head after PR #57: `341c4a265a39c1d8f9d7e1cd1030b7d4e8c62cba`, post-merge CI PASS.

One fresh merged-main repeated-use regression remains required before Phase 3 because this correction added long-lived Secret presentation tweens and changed the save/economy path after the earlier repeated-use gate.

---

# Deferred information pass — NOT PART OF 2.1

Hands-on also raised a valid information need:

- exact rarity/drop probabilities;
- what can drop from the pouch;
- active collection/Drop names;
- discovered vs undiscovered items.

Do not put all of this permanently on the main Opening screen now.

After final hands-on acceptance, consider an on-demand information drawer:

```text
Drop name · discovered/total · info
→ exact Basic/Charged odds from typed config
→ family list
→ discovered items / obscured unknowns
```

The permanent giant collection sidebar and always-visible probability table are rejected because they do not scale and would compete with the hero reward.

Player-facing Drop selection remains deferred until Drop #2 exists.

---

# Phase 3 — real Yandex DRAFT validation — NEXT EXTERNAL GATE AFTER CURRENT INTERNAL REGRESSION

Run `docs/YANDEX_SLICE_VALIDATION.md` only after the merged Phase 2.6 + Secret correction runtime passes the fresh final repeated-use regression.

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

## 4.1 First expanded roster

Choose new families from visual desirability, silhouette diversity, Y2K recognition, asset-generation consistency and measured production burden.

Candidate pool remains MP3 player, pager, mini camcorder, handheld console, PDA, portable disc/MiniDisc-like player, pocket radio, virtual-pet-like electronics and other suitable Y2K archetypes.

## 4.2 Drops

Do not build one global pool. Roughly 3–5 families per themed Drop is a starting heuristic, not a fixed count.

When Drop #2 exists:

- expose compact selection;
- keep CHIPS/Signal global;
- keep Basic/Charged mechanics unchanged;
- use each Drop as a fresh completion surface.

## 4.3 Content factory

```text
6–10 explorations
→ canonical master
→ Common / Rare / Epic / Legendary
→ Secret only where planned
→ cleanup/export/log
```

## 4.4 Rebalance from real scale

Only then re-simulate/tune rarity profiles, Charged cost, CHIPS income/cache, recycle, Signal threshold if evidence demands it, Hidden Pocket and completion horizon.

## 4.5 Collection / monetization

Scale Collection only from real density. Final rewarded/interstitial/sticky decisions wait for the actual release loop/content shape.

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
- final hosted draft pass if materially different;
- moderation submission.

Use `docs/YANDEX_SUBMISSION_CHECKLIST.md`.

---

# Scope guardrail

The current pass is **not a feature expansion**. It is an evidence-backed quality pass on an already implemented loop.

Remain parked:

- timed Basic energy;
- offline/passive income;
- Archive levels;
- upgrade trees/set bonuses;
- shop scene;
- multiple currencies;
- multi-standard drops;
- auto-open/x5;
- prestige/crafting/merge/trading;
- third family/content expansion;
- custom shaders;
- permanent odds/collection sidebar.

> **Current next action: run one final direct repeated-use regression on the exact Phase 2.6 candidate; if accepted, move immediately to real Yandex DRAFT validation.**
