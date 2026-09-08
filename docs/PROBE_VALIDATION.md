# Gameplay Loop Lite V2 validation

This is the direct/local acceptance gate for the implemented Lite V2 loop and its evidence-backed Opening Feel Correction. Hosted platform validation remains separate in `YANDEX_SLICE_VALIDATION.md`.

Current status:

- Lite V2 implementation: **COMPLETE**;
- technical tests/build/assets: **PASS**;
- original exact-revision browser audit + manual review: **PASS**;
- first repeated-use hands-on: **COMPLETE WITH FINDINGS**;
- Opening Feel Correction: **COMPLETE / MERGED**;
- second repeated-use hands-on: **COMPLETE WITH NARROW FOLLOW-UP FINDINGS**;
- bounded post-hands-on transition/input/error-state/UI polish: **COMPLETE / MERGED**;
- latest reward/result feel polish PR #45: **MERGED**;
- latest exact-audited Phase 2.6 runtime product head: `40db07a3c8069ef8ca01c5c35de0c355337d410e`;
- comprehensive Phase 2.6 exact browser/state audit: **43/43 PASS** with zero runtime/request/HTTP failures;
- focused post-fix cash-out audit: **15/15 PASS** in RU 900 + EN 1280; artifact digest `sha256:0d55df870f9b4c90c1d8c566c8c6cb7a4af4b6e6486ab991077670271de6a1cd`;
- squash-merged `main`: `f070cbeb0adf8329d8a514d78a1cad0bb1f8d020` via PR #48; subsequent differences from the exact audit head are canonical-doc synchronization/merge history, not runtime behavior;
- post-merge main CI #274: **PASS**;
- current suite baseline: **130 unit tests** + typecheck + asset self-test/validation + production build;
- final direct hands-on: **COMPLETE WITH BOUNDED FINDINGS**;
- Phase 2.6 final-hands-on correction + Signal Overcharge: **IMPLEMENTED / EXACT-AUDITED**;
- final direct repeated-use Phase 2.6 regression: **COMPLETE / ACCEPTED**;
- post-fix exact lifecycle regression: **86/86 PASS** with 10 targeted retained-lock Overcharge openings + a fresh 24-opening normal loop, zero runtime/request/HTTP failures and manual artifact review;
- Secret reward/reward-tray correction: **IMPLEMENTED / EXACT-BROWSER-AUDITED / MERGED** via PRs #55–#57;
- Secret exact product acceptance: **34/34 PASS** on `629d5beb666aa9365ce7197082938ea1a50d9d15`, zero runtime/request/HTTP diagnostics, manual screenshot/video review complete;
- current merged runtime after PR #57: `341c4a265a39c1d8f9d7e1cd1030b7d4e8c62cba`; post-merge CI **PASS**;
- final merged-main repeated-use regression after Secret correction: **PENDING — CURRENT INTERNAL GATE**;
- real Yandex DRAFT: **BLOCKED ON THAT FINAL INTERNAL REGRESSION / NEXT EXTERNAL GATE AFTER PASS**.

Historical correction scope: `OPENING_FEEL_CORRECTION_SCOPE.md`. Current delta/acceptance contract: `FINAL_HANDS_ON_OVERCHARGE_PLAN.md`.

The Lite baseline and Phase 2.6 direct regression are proven. The earlier final repeated-use pass found one presentation-lifecycle race in the Overcharge bonus counter; PR #50 added a bounded destroyed-tag guard and the exact fixed tree passed targeted stress plus the full repeated-use loop. The later bounded Secret correction is also implemented and exact-browser-accepted, but it changed save/economy/presentation after that earlier repeated-use approval. Therefore one fresh merged-main repeated-use regression is required before DRAFT. Hosted Yandex behavior remains unproven until the external DRAFT gate.

---

# 1. Already proven — do not re-litigate without contradictory evidence

The current merged implementation has established:

- Basic/Charged reward profiles resolve deterministically;
- Basic never standard-rolls Legendary, including under armed Signal;
- Charged has non-zero Legendary access;
- collectible rarity and CHIPS-cache rolls are independent;
- duplicate recycle uses rarity-dependent CHIPS values;
- Signal uses `+1` per duplicate and caps at `4/4`;
- Signal Lock respects active loot pool + selected-pouch eligibility;
- if only Legendary remains, Basic resolves normally and retains `4/4`;
- following eligible Charged can consume that lock on NEW Legendary;
- fully complete active Drop does not waste an armed lock;
- legacy Signal migration is deterministic/idempotent;
- save migration preserves collection/stat state;
- Charged cost + base/cache/recycle/Signal/collectible/Hidden result form one recoverable transaction;
- refresh cannot reroll collectible/cache/Hidden Pocket;
- recovery cannot double-grant rewards;
- Basic/Charged selection continuity and insufficient-wallet fallback work;
- compact 900/1024 and RU states are technically valid;
- Save V4 persists exact Secret new/duplicate state and per-transaction jackpot bonus;
- successful Hidden Pocket selects undiscovered Secrets first, then continues as duplicates after completion;
- the fixed `+40 CHIPS` Secret jackpot is excluded from Overcharge multiplication;
- pre-correction staged V3 Hidden Pocket reveals migrate without retroactive jackpot payment;
- Secret result/tray state follows carousel selection and recovery reconstructs the premium result.

Current suite baseline: **130 unit tests** plus typecheck, asset self-test/validation and production build.

The correction must preserve all of these properties.

---

# 2. First hands-on findings — accepted evidence

The first repeated-use pass found:

- CHIPS need a dedicated collection sound;
- CHIPS HUD lacks visual weight;
- wallet changes need animated count-up + physical receiving feedback;
- Basic/Charged selector is cramped and selected state is unclear;
- transient reward copy disappears too quickly;
- earned CHIPS should visually stage with the result before banking;
- Charged needs stronger visual differentiation;
- `RESULT LOCKED` / dead tapping creates frustration;
- UI needs more distinctive electronic/neon Y2K character;
- player wants better visibility into probabilities, Drop contents and discovered/unknown items.

The first nine points justify the current feel correction. The final information request is valid but deferred into a separate possible info-drawer pass after final hands-on acceptance.

---

# 3. Correction behavioral gate

## Input / pacing

Must prove:

- deliberate tap/click during reveal is acknowledged;
- fast-forward changes presentation only, never reward/economy state;
- pointer release that completes tear cannot accidentally skip the next beat;
- no player-facing dead `RESULT LOCKED` state remains;
- result can be accepted quickly once visible/readable;
- Hidden Pocket carousel input remains safe.

## Pouch tactile feel

Must judge:

- grab response is immediate;
- drag/tension feels connected to the pouch rather than only moving the tab;
- tear threshold has a satisfying short snap/recoil;
- aborted drag resets cleanly;
- no motion feels like added latency.

## Reward / rarity

Must judge:

- collectible arrival has clear overshoot/settle;
- rarity energy feels attached to the reveal;
- Common/Rare/Epic/Legendary spectacle remains monotonic;
- Secret remains the strongest/distinct surprise;
- increased effects do not obscure collectible art.

---

# 4. CHIPS / Signal correction gate

## Staged reward

Before acceptance:

- base/cache/recycle reward components can be understood beside the hero result;
- the reward staging area stays secondary to the collectible;
- visible token count remains symbolic/bounded.

On acceptance:

- base banks first;
- cache follows when present;
- recycle follows when present;
- Signal travels to its own destination;
- displayed wallet ends exactly at the deterministic transaction snapshot.

## CHIPS HUD

Must prove:

- resource card is materially easier to notice;
- number count-up remains fast enough for large rewards;
- ordinary intake produces restrained pulse;
- Big/Mega produce stronger local reaction without whole-screen noise;
- HUD shake is local, not camera shake;
- `chip-clack` is satisfying over repetition and not casino-like.

## Charged-ready threshold

Must prove:

- readiness feedback happens when displayed wallet crosses cost during banking;
- Charged control visibly activates;
- feedback does not block progression with a mandatory long banner;
- threshold crossing still reads after a Mega jump.

## Duplicate / Signal

Must prove:

- duplicate first reads as the actual rolled collectible;
- `RECYCLED` conversion feels compensating rather than punitive;
- recycle CHIPS and Signal destinations are understandable;
- Signal segment pulse/lock feedback reads clearly;
- `SIGNAL LOCK · CHARGED` remains understandable.

---

# 5. UI / visual-language gate

## Basic / Charged selection

At a glance:

- selected pouch must be obvious without relying on color alone;
- center pouch reflects selected mode immediately;
- unavailable Charged attempt gives feedback instead of silently doing nothing;
- new left-side gameplay rail does not collide with hero, title, Collection/mute or compact safe areas.

## Charged differentiation

Review screenshots/video with Basic/Charged labels mentally ignored.

PASS when Charged is still clearly different through pouch/UI treatment.

If runtime treatment still reads as “Basic with a glow,” a recolored Charged raster variant is allowed as a narrow fallback; geometry/interaction must not change.

## Digital / neon direction

Visual rule:

> **Cozy Y2K world, electric digital UI.**

PASS when:

- CHIPS/Signal/Charged feel more electronic and distinctive;
- one accent digital/pixel-like font works at actual sizes;
- main instructional text remains easy to read;
- neon/glow/iridescence does not turn the entire scene into generic synthwave;
- no custom shader is needed to make the concept convincing.

---

# 6. Exact-revision browser/video matrix

Capture and manually inspect at minimum:

- Basic idle with new resource/selector rail;
- Charged selected state;
- unavailable Charged interaction feedback;
- star grab frame;
- mid-drag tension;
- tear recoil;
- ordinary result with staged CHIPS before acceptance;
- base CHIPS bank/count-up;
- Cache / Big / Mega bank sequences;
- threshold crossing → Charged activation;
- duplicate → recycle → CHIPS + Signal;
- Signal `4/4`;
- `SIGNAL LOCK · CHARGED`;
- Common / Rare / Epic / Legendary results;
- Charged iridescent treatment;
- Hidden Pocket result/carousel;
- tap-to-fast-forward path;
- accidental drag-release guard;
- recovered Basic;
- recovered Charged;
- 900 logical width;
- 1024 logical width;
- representative wider width;
- RU compact state.

Browser errors and failed requests must be empty. Generated artifacts do not count as approved until manually reviewed.

---

# 7. Technical regression requirements

Run:

- `npm run typecheck`;
- `npm test`;
- `npm run assets:selftest`;
- `npm run assets:validate`;
- `npm run build`.

Add/adjust focused tests where practical for:

- no duplicate prepare/commit from fast-forward input;
- skip does not alter pending/committed transaction data;
- tear pointer release does not become unintended skip;
- displayed CHIPS endpoint matches transaction snapshot;
- staged visual banking cannot grant CHIPS;
- Signal retain/consume semantics unchanged;
- recovery semantics unchanged;
- Charged selection continuity unchanged.

No custom shader is introduced in this pass, so no shader-specific compatibility surface should appear.

---

# 8. Historical second hands-on gate — COMPLETE WITH FINDINGS

This gate produced the findings now captured in `FINAL_HANDS_ON_OVERCHARGE_PLAN.md`. Do not use this section as the current GO-to-DRAFT decision by itself.

## GO to real Yandex DRAFT when

- grabbing/tearing feels more physical;
- deliberate input is always acknowledged;
- the loop can be accelerated naturally without a separate mode;
- CHIPS feel tangible and important;
- wallet feedback remains pleasant after repetition;
- Basic vs Charged is immediately understandable;
- Charged feels materially more desirable;
- callouts are readable without creating forced waits;
- duplicate/recycle/Signal feels like progress;
- neon/digital styling gives identity without overwhelming the cozy art;
- repeated opening is more pleasant than the pre-correction build.

## FIX before DRAFT when

- fast-forward can skip/duplicate economy state;
- accidental pointer release skips content;
- banking sequence creates new waiting frustration;
- CHIPS HUD dominates the collectible;
- audio becomes repetitive/slot-machine-like;
- left rail makes 900/1024 layout crowded;
- Basic/Charged selection is still ambiguous;
- Charged still looks like Basic plus glow;
- digital font hurts readability;
- neon/iridescence muddies rarity hierarchy;
- callouts remain unreadable or now feel too slow.

Fix only the observed problem; do not add another progression system.

## Current Phase 2.6 delta gate

In addition to preserving every baseline invariant above, current acceptance must cover rarity-badge cleanup, reward overflow, 20+ denial clicks without drift, Signal gain/ready/retain/consume clarity, Secret collection meaning + celebration, Overcharge persisted/recovered transitions, bonus count-up, actual clamped gain near cap, MAX behavior, cash-out/reset and complete-Drop behavior. The canonical detailed matrix is `FINAL_HANDS_ON_OVERCHARGE_PLAN.md`.

---

# 9. Deferred information need

After Phase 2.6 + hosted DRAFT evidence, separately decide whether to implement an on-demand Drop info drawer containing:

- active Drop/collection name;
- discovered/total progress;
- exact Basic/Charged rarity odds sourced from typed balance config;
- family list;
- discovered items visible;
- undiscovered items obscured/silhouetted.

Do not implement a permanent giant sidebar or permanently visible odds table on the main Opening screen.

Drop selector still waits for actual Drop #2.

---

# 10. After correction approval

1. real `YANDEX_SLICE_VALIDATION.md` hosted DRAFT;
2. fix only hosted-platform defects;
3. first expanded content batch;
4. first real Drop grouping when enough families exist;
5. economy re-simulation at content scale;
6. Collection scaling only as required;
7. final monetization/store/release work.
