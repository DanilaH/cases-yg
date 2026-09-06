# Implementation roadmap

The two-family build is a private development base, not the public release.

## Current execution order

1. **Opening Feel Correction — COMPLETE**
2. **Exact-revision combined visual/video audit + manual review — COMPLETE**
3. **Second direct 20–30 opening hands-on — CURRENT REQUIRED GATE**
4. **Real Yandex DRAFT validation — NEXT EXTERNAL GATE**
5. **Content/release expansion — BLOCKED until draft passes**
6. **Public release hardening**

The first Lite V2 hands-on has already happened and found specific presentation/input friction. The correct response is the bounded correction in `OPENING_FEEL_CORRECTION_SCOPE.md`, not another gameplay-system pass.

Do not change balance numbers, expand content or add new meta systems during this correction unless a separate evidence-backed decision explicitly opens that scope.

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
- 91 unit tests;
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
- one `chips-collect` SFX;
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

# Phase 2.3 — second hands-on — CURRENT REQUIRED GATE

The corrected exact revision is merged and approved. Now run **20–30 normal openings**.

Questions:

- does grabbing/tearing feel more physical?
- does every deliberate tap feel acknowledged?
- can the player naturally accelerate repetition without a separate mode?
- do CHIPS feel tangible rather than like a changing number?
- is resource progress obvious without overwhelming the collectible?
- is Basic vs Charged immediately clear?
- does Charged feel materially more desirable?
- do longer labels remain readable without slowing experienced play?
- does duplicate → recycle → Signal feel like progress?
- does neon/digital styling add identity without becoming generic synthwave?
- is the loop still pleasant after repetition?

If this passes, stop polishing the same loop and go to hosted DRAFT.

If a narrow defect remains, make the smallest correction and re-audit only the affected behavior plus regression essentials.

---

# Deferred information pass — NOT PART OF 2.1

Hands-on also raised a valid information need:

- exact rarity/drop probabilities;
- what can drop from the pouch;
- active collection/Drop names;
- discovered vs undiscovered items.

Do not put all of this permanently on the main Opening screen now.

After the feel correction is re-tested, consider an on-demand information drawer:

```text
Drop name · discovered/total · info
→ exact Basic/Charged odds from typed config
→ family list
→ discovered items / obscured unknowns
```

The permanent giant collection sidebar and always-visible probability table are rejected because they do not scale and would compete with the hero reward.

Player-facing Drop selection remains deferred until Drop #2 exists.

---

# Phase 3 — real Yandex DRAFT validation — NEXT EXTERNAL GATE

Run `docs/YANDEX_SLICE_VALIDATION.md` only after Phase 2.3 acceptance.

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
- Overcharge / Archive levels;
- upgrade trees/set bonuses;
- shop scene;
- multiple currencies;
- multi-standard drops;
- auto-open/x5;
- prestige/crafting/merge/trading;
- third family/content expansion;
- custom shaders;
- permanent odds/collection sidebar.

> **Current next action: re-test the merged corrected loop with 20–30 normal openings; if accepted, go to Yandex DRAFT.**
