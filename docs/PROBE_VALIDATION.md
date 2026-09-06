# Gameplay Loop Lite V2 validation

This is the direct/local acceptance gate for the implemented Lite V2 loop and its evidence-backed Opening Feel Correction. Hosted platform validation remains separate in `YANDEX_SLICE_VALIDATION.md`.

Current status:

- Lite V2 implementation: **COMPLETE**;
- technical tests/build/assets: **PASS**;
- original exact-revision browser audit: **PASS**;
- original manual screenshot/video review: **PASS**;
- first 20–50 opening hands-on: **COMPLETE WITH FINDINGS**;
- Opening Feel Correction: **COMPLETE / MERGED**;
- corrected exact-revision browser/video audit: **PASS**;
- corrected manual screenshot/video review: **PASS**;
- audited product head: `89f2a722942886cf5a5aae3acfaf5b70e15c98e3`;
- r3 audit artifact digest: `sha256:7e352be95a2eea913ab713bcdce05107d3f3df38a7acb93ca44072ceb82d0a41`;
- squash-merge product tree verified identical to the audited tree;
- post-merge main CI #170: **PASS**;
- second 20–30 opening hands-on: **CURRENT / PENDING**;
- real Yandex DRAFT: **BLOCKED until corrected hands-on acceptance**.

Canonical correction scope: `OPENING_FEEL_CORRECTION_SCOPE.md`.

The remaining question is no longer whether the Lite mechanics work. It is:

> **Can the same loop feel tactile, responsive, readable and rewarding enough to repeat without adding more systems?**

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
- compact 900/1024 and RU states are technically valid.

Current suite baseline: **91 unit tests** plus typecheck, asset self-test/validation and production build.

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

The first nine points justify the current feel correction. The final information request is valid but deferred into a separate possible info-drawer pass after corrected hands-on.

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
- `chips-collect` SFX is satisfying over repetition and not casino-like.

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

# 8. Second hands-on — GO / FIX

Exact-revision visual approval is complete. Current gate: run **20–30 normal openings**.

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

---

# 9. Deferred information need

After corrected hands-on, separately decide whether to implement an on-demand Drop info drawer containing:

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
