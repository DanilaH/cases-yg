# Implementation roadmap

This is the execution plan for the first Yandex Games behavioral probe. It assumes the product decisions in `DECISIONS.md` are frozen.

The goal is a **small, polished, submission-ready collectible toy**, not a framework for future scope.

Working target: **5–8 focused days**, excluding moderation waiting time.

---

# 0. Delivery rules

- Do not add gadget families beyond Camera + Flip Phone.
- Do not scaffold parked systems: Tech Parts, Mod Bench, package tiers, ads, dailies, leaderboard, 3D.
- Pin probe dependencies in the lockfile. Use **Phaser 4.2.1** for the first implementation unless a blocking defect is found.
- Keep balance values in typed config, not scattered through scenes.
- Keep drop/save logic independent from Phaser so it can be unit-tested.
- Final art may be produced in parallel with engineering, but gameplay code must work with placeholders until final assets are accepted.
- No public `beta`, `probe`, `coming soon`, empty buttons or placeholder features.

---

# 1. Milestone A — project foundation

Estimate: **0.25–0.5 day**.

## Tasks

1. Create Vite + strict TypeScript project.
2. Install and pin Phaser 4.2.1.
3. Add minimal source structure:

```text
src/
  game/
    scenes/
      BootScene.ts
      OpeningScene.ts
      CollectionScene.ts
    systems/
      drops.ts
      signal.ts
      collection.ts
      save.ts
      layout.ts
    data/
      collectibles.ts
      balance.ts
    ui/
  platform/
    yandex.ts
    analytics.ts
    storage.ts
  i18n/
    en.ts
    ru.ts
  main.ts
```

4. Add `body/html/canvas` shell rules:
   - full viewport;
   - no system scrolling;
   - no swipe-to-refresh;
   - no text selection/context-menu interference in the game area;
   - touch/pointer input works without browser gesture conflicts.
5. Add a dev-only debug facility for forcing rarity, duplicate, SIGNAL LOCK, Hidden Pocket and Secret outcomes. It must be excluded/disabled in production.
6. Add the Yandex SDK bootstrap boundary, but keep local development runnable without the live platform.

## Definition of done

- app boots into an empty `OpeningScene` locally;
- production build succeeds;
- no browser scrollbars;
- resize events produce shared `LayoutMetrics`;
- Yandex-specific code is isolated behind adapters.

---

# 2. Milestone B — deterministic reward engine + save transaction

Estimate: **0.5–0.75 day**.

This is the correctness-critical layer and should exist before reveal animation.

## Implement

### Content IDs

Exactly:

```text
camera-common
camera-rare
camera-epic
camera-legendary
camera-secret-cosmic

flip-phone-common
flip-phone-rare
flip-phone-epic
flip-phone-legendary
flip-phone-secret-music
```

### Standard roll

- Camera / Flip Phone: 50 / 50.
- Common 60%.
- Rare 28%.
- Epic 10%.
- Legendary 2%.

### First-three protection

- openings 1–3 must be undiscovered standard variants;
- opening 2 must be the opposite family from opening 1;
- ordinary duplicate RNG begins at opening 4.

### Signal

Duplicate gains:

```text
Common      +25
Rare        +20
Epic        +15
Legendary   +10
```

At 100:

- if a Common/Rare/Epic standard variant is missing, force one missing non-Legendary variant;
- otherwise use late-lock rarity odds `Rare 60 / Epic 30 / Legendary 10`;
- result that consumes SIGNAL LOCK does not immediately award Signal again;
- reset only after the armed transaction commits;
- stop Signal gain after standard 8/8.

### Hidden Pocket

- off for openings 1–3;
- from opening 4: independent 3% post-standard roll while a Secret remains;
- always selects an undiscovered Secret;
- no Secret duplicates;
- stop after Secrets 2/2.

### Persistence

Use a `StorageAdapter`:

- Yandex runtime: storage object returned by `ysdk.getStorage()`;
- local/dev fallback: browser `localStorage`.

Do not require authorization/cloud save.

Persist the complete `pendingReveal` before presentation. On startup, recover the same transaction instead of rerolling.

## Tests

Add a very small pure-logic test suite for:

- first-three guarantees;
- 50/50 family and rarity table shape;
- every Signal gain;
- early SIGNAL LOCK missing-item guarantee;
- late SIGNAL LOCK table;
- lock-consumption reset semantics;
- Hidden Pocket eligibility and no-duplicate Secret behavior;
- pending transaction idempotency/recovery;
- 8/8 disables further Signal gain.

No heavyweight test architecture is needed.

## Definition of done

Given an injected deterministic RNG and a SaveState, the system can produce a complete `PendingReveal` without touching Phaser.

---

# 3. Milestone C — OpeningScene interaction and reveal

Estimate: **0.75–1.25 days**.

## Idle state

- Mystery Pouch centered as visual hero.
- Collection navigation hidden until first completed reveal.
- Signal hidden until first Signal gain.
- subtle animated gesture cue points to the star tear-tab on first launch.

## Tear interaction

Use separated pouch layers from `ASSET_MANIFEST.md`.

Recommended input behavior:

- drag can begin only from the star-tab hit area;
- required motion is primarily left-to-right;
- completion threshold ≈ 65–70% of the tear path;
- generous vertical tolerance for mobile;
- releasing early snaps the tab/strip back in ~120–180 ms;
- on completion, input locks until the reward presentation is finished.

No physics.

## Reveal choreography

After a successful tear:

1. tear strip detaches;
2. pouch gives a tiny recoil;
3. rarity-tinted flash starts inside the pouch;
4. collectible rises/scales visibly from the pouch;
5. pouch remains visible as source for ~0.3–0.4 s;
6. pouch slides/scales/fades downward;
7. collectible overshoots and settles;
8. rarity + `NEW`/duplicate appears.

Target standard reveal duration after drag: **~1.0–1.4 s**.

FX are runtime-only:

- radial glow;
- small sparkle burst;
- one ring/outline pulse;
- rarity-colored underglow;
- tiny camera bump only for Epic/Legendary.

## Result / next-open behavior

Make this explicit rather than auto-clearing the reward:

- keep result fully readable for at least **~0.6 s**;
- after that, enable `Open next` / tap-to-continue input;
- clicking/tapping empty result space advances to the next pouch;
- Collection navigation remains a distinct target and opens Collection instead of consuming the tap;
- reset to the next pouch in roughly **150–250 ms**;
- do not auto-dismiss a reward on a timer.

## Hidden Pocket beat

If predetermined in `pendingReveal`:

- after normal reward settles, pause briefly;
- pouch twitches/returns;
- distinct inner flash + audio cue;
- Secret emerges;
- additional animation budget **~0.9–1.1 s**;
- no second user gesture.

`reveal_complete` analytics fires only after the whole transaction presentation, including Hidden Pocket, is done.

## Definition of done

A player can repeatedly perform 50+ openings without broken input state, double commits, stuck phases or visible loading.

---

# 4. Milestone D — CollectionScene

Estimate: **0.5–0.75 day**.

One Phaser scene with two internal views.

## Shelf — default

- cozy Y2K shelf/desk environment;
- exactly two hero positions: Camera and Flip Phone;
- best-owned priority: `Secret > Legendary > Epic > Rare > Common`;
- missing family: tasteful silhouette/empty stand;
- compact family mastery `x/4`;
- headline standard progress `x/8`;
- separate `Secrets x/2`.

## Library

Two family groups:

```text
Camera:     Common Rare Epic Legendary Secret
Flip Phone: Common Rare Epic Legendary Secret
```

- discovered standard: thumbnail + rarity;
- missing standard: silhouette/locked state;
- missing Secret: `???`, no silhouette leak;
- no item-detail modal/page;
- standard/wide shows a row where practical;
- compact may wrap cards.

## Completion

At first 8/8:

- short, non-blocking completion celebration;
- no game-ending modal;
- the player can immediately return to the opener and chase Secrets.

## Navigation

Opening ↔ Collection should feel immediate: **~100–200 ms perceived response** plus only a tiny cosmetic transition.

## Definition of done

Shelf and Library correctly derive from SaveState at every partial-completion state, including fresh save, 8/8, 2/2 Secrets and recovered pending transactions.

---

# 5. Milestone E — responsive layout, localization, audio and platform lifecycle

Estimate: **0.75–1 day**.

## Responsive

- landscape only;
- logical height 720;
- logical width `clamp(aspect * 720, 900, 1728)`;
- modes: compact / standard / wide;
- safe insets + clamped ~3–5% margins;
- effective hit targets ≥ ~44 CSS px;
- no critical crop/overlap/stretch;
- no browser scroll/swipe-to-refresh.

## Localization

- typed RU and EN dictionaries bundled in the build;
- language detected at launch from `ysdk.environment.i18n.lang`;
- unsupported languages fall back to EN;
- no manual language selector in first probe.

## Audio

- SFX only;
- persistent mute button;
- no background music;
- stop/pause all game sound on `game_api_pause`, tab switch/minimize, and resume safely.

## Gameplay markup

If GameplayAPI is enabled:

- call `start()` when Opening becomes actively playable;
- call `stop()` when Collection/menu state is opened or platform gameplay is paused;
- call `start()` again when returning to active Opening;
- do not emit contradictory start/stop events around tab pause/resume.

## Game Ready

Call `LoadingAPI.ready()` only when:

- all critical probe assets are loaded;
- save recovery is resolved;
- Opening is visually ready;
- first interaction can actually occur;
- no loading overlay remains.

## Definition of done

Same build works in local dev and Yandex draft mode, in RU/EN, across representative desktop/mobile landscape sizes.

---

# 6. Milestone F — analytics

Estimate: **0.25–0.5 day**.

- Add Yandex Metrica tag according to current platform instructions.
- Route all custom goals through typed `platform/analytics.ts`.
- Analytics failures never block gameplay/save.

Required custom goals/events:

```text
first_package_interaction
reveal_complete
collection_open
collection_return
signal_lock_reached
signal_lock_consumed
hidden_pocket_triggered
secret_discovered
standard_collection_complete
```

`reveal_complete` parameters include:

- session open index;
- lifetime open index;
- family;
- rarity;
- new/duplicate;
- Signal before/after;
- SIGNAL LOCK consumed yes/no;
- Hidden Pocket yes/no.

Validate each event fires once per intended action in Yandex draft mode.

---

# 7. Milestone G — final art integration and polish

Estimate: **1.5–2.5 days**, partially parallel with Milestones A–F.

Follow `ART_PRODUCTION.md` and `ASSET_MANIFEST.md`.

Critical order:

1. Camera exploration → canonical master.
2. Flip Phone exploration → canonical master.
3. Common/Rare/Epic/Legendary derivations for both.
4. Two Secret editions.
5. Runtime pouch layers derived from the approved package reference.
6. Opening background.
7. Collection background + shelf foreground/depth layer.
8. SFX pass.
9. Visual polish at real shelf/mobile sizes.

Do not spend time on store art until the in-game hero assets and opener are stable enough to represent truthfully.

## Visual acceptance gate

- both families clearly belong to the same product line;
- rarity escalation reads without FX;
- Common is attractive;
- Legendary remains readable;
- Secrets are obviously special editions, not recolors;
- alpha edges are clean;
- shelf thumbnails remain legible;
- final runtime assets stay within size budget.

---

# 8. Milestone H — store card + submission package

Estimate: **0.5–0.75 day** after gameplay is stable.

## Draft metadata

Prepare RU + EN:

- title;
- SEO description;
- full description;
- short description;
- How to play.

Operational selections:

- age rating candidate: **0+** unless final content changes;
- Desktop + Mobile landscape;
- if iOS is selected, provide the required Apple Team ID; if unavailable, submit Desktop + Android first rather than blocking launch;
- cloud-save toggle off because the probe uses local/safe browser storage;
- developer comment explicitly states that this first version intentionally has no ads/in-app purchases.

Categories/tags/keywords must be chosen from the actual current Console options and must describe the real collectible opener; do not guess unsupported category names in code/docs.

## Visual materials

See `ASSET_MANIFEST.md`.

Important simplification:

> **Do not bake the localized game title into icon/cover/hero for the first probe.**

This allows the same high-quality visual creative to be used for RU and EN without title-consistency/localization errors.

Screenshots, however, contain localized in-game UI and therefore should be captured separately for RU and EN.

---

# 9. Milestone I — moderation QA

Estimate: **0.5–1 day**.

Use `YANDEX_SUBMISSION_CHECKLIST.md` as the final gate.

Must verify:

- archive root `index.html`;
- uncompressed files well below 100 MB;
- no spaces/Cyrillic in runtime paths;
- SDK loads correctly;
- `LoadingAPI.ready()` timing;
- gameplay markup if used;
- automatic language detection;
- local progress survives refresh and orientation changes;
- pending reveal cannot reroll;
- right-click/long-press browser context menu does not interfere;
- no system scrollbar or swipe-to-refresh;
- sound stops on tab switch/minimize;
- resize/zoom stress;
- first-three protection;
- every Signal path;
- both Secret paths;
- Collection 8/8 and Secrets 2/2;
- Metrica goals;
- real Desktop/Mobile screenshots;
- draft text/media/title consistency;
- developer comment explains intentional no-monetization version.

Submit to draft mode first and run the Yandex debug panel before moderation.

---

# 10. Recommended PR sequence

Keep changes reviewable and avoid one giant agent PR.

```text
PR-1  foundation + layout + platform/storage adapters
PR-2  drop engine + Signal + pendingReveal + tests
PR-3  OpeningScene + reveal + Hidden Pocket
PR-4  CollectionScene + localization + audio
PR-5  analytics + final asset integration + polish
PR-6  Yandex QA fixes + store/submission materials
```

Art assets can land in their own focused PR if production timing makes that cleaner.

---

# 11. Kill scope during implementation

If the submission-ready build starts exceeding ~8 focused days, first cut/polish rather than add systems.

Do **not** solve implementation friction by introducing:

- additional scenes;
- another state library;
- package economy;
- extra currencies;
- more collectible families;
- background music;
- elaborate tutorial;
- custom backend;
- generalized asset-pipeline tooling.

The probe is done when the locked loop is polished, recoverable, measurable and moderation-ready.