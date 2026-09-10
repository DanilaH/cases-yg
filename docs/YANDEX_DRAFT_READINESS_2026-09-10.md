# Yandex DRAFT readiness — 2026-09-10

Status: **LOCAL PRECONDITIONS ACCEPTED / HOSTED YANDEX DRAFT NOT YET VERIFIED**.

This document is the current handoff for uploading the expanded release candidate to the real Yandex Games DRAFT environment. It supersedes old staging assumptions that the project is still a two-family vertical slice or that content expansion must happen after hosted validation.

It does **not** claim that Yandex SDK/storage/ad/lifecycle behavior has passed hosted validation. Those checks require the game to run on Yandex infrastructure.

---

## 1. Current candidate

Current production content/runtime:

- 6 Drops;
- 12 gadget families;
- 48 standard collectibles;
- 12 Secrets;
- 60 authored collectible assets total;
- Basic + Charged Pouch loop;
- global CHIPS / Signal / Overcharge;
- Drop-scoped standard/Secret resolution;
- Save V4 transactional pending-reveal recovery;
- on-demand non-active Drop collectible loading;
- authored Charged Pouch package loaded on demand;
- RU + EN automatic platform-language architecture.

The six-Drop economy audit is accepted in `FULL_GAME_ECONOMY_AUDIT_2026-09-10.md`; current balance is intentionally unchanged.

---

## 2. Official Yandex requirements re-check

Official Yandex Games documentation was re-checked on **2026-09-10** before this readiness pass.

Relevant current requirements:

- SDK connection / `/sdk.js`: https://yandex.com/dev/games/doc/en/sdk/sdk-about
- Game Ready + Gameplay markup: https://yandex.com/dev/games/doc/en/sdk/sdk-game-events
- SDK moderation requirement 1.19: https://yandex.com/dev/games/doc/en/requirements/1/19
- pause/resume + startup ads: https://yandex.com/dev/games/doc/en/sdk/sdk-events
- advertising: https://yandex.com/dev/games/doc/en/sdk/sdk-adv
- automatic language detection: https://yandex.com/dev/games/doc/en/requirements/2/14
- current game requirements: https://yandex.com/dev/games/doc/en/concepts/requirements
- archive/draft fields: https://yandex.com/dev/games/doc/en/console/add-new-game/draft
- content duration/replayability: https://yandex.com/dev/games/doc/en/requirements/2/9
- sound outside game: https://yandex.com/dev/games/doc/en/requirements/1/3
- technical errors/interactions: https://yandex.com/dev/games/doc/en/requirements/1/14

Key current hard constraints relevant to this build:

1. `/sdk.js` must be connected before `YaGames.init()`.
2. `LoadingAPI.ready()` is sent only when required game resources are ready and the game is available for interaction.
3. `GameplayAPI.start()/stop()` must match actual active gameplay/menu/pause state.
4. `game_api_pause` / `game_api_resume` must pause/resume gameplay and sound correctly, including startup fullscreen ads.
5. automatic language detection must use `sdk.environment.i18n.lang` at launch.
6. sound must stop when the game loses focus.
7. the archive must contain `index.html` at its root and remain at or below 100 MB uncompressed.
8. the game must have sufficient primary content or replayability for more than a trivial short session.

---

## 3. Readiness correction made in this pass

### Gameplay marker timing

Before this pass, `OpeningScene.create()` called:

```text
setGameplayDesired(true)
```

before async save initialization, active-Drop art loading and `LoadingAPI.ready()`.

That could make Yandex's gameplay indicator green while the game was still initializing, which conflicts with the current requirement that `GameplayAPI.start()` correspond to gameplay actually starting immediately.

Corrected order:

```text
OpeningScene.create
→ gameplay desired = false
→ load/recover save
→ ensure active Drop art
→ ensure recovered Charged art when needed
→ render first usable Opening frame
→ gameplay desired = true
→ idempotent LoadingAPI.ready()
→ continue normal/recovered Opening flow
```

Save-load failure remains non-gameplay and still exposes the existing failure UI.

Validation for the correction passed:

- explicit source-order assertion;
- strict typecheck;
- full unit suite;
- asset self-test;
- asset validation;
- production build.

---

## 4. SDK / lifecycle architecture — locally reviewed

Current Yandex runtime:

```text
load /sdk.js
→ YaGames.init()
→ create activity coordinator
→ subscribe game_api_pause / game_api_resume
→ getStorage()
→ expose platform runtime
```

The pause/resume subscription is intentionally installed immediately after SDK initialization and **before** async storage completion, so a startup platform pause can be buffered before Phaser attaches.

The activity coordinator:

- aggregates `ad`, `orientation`, `platform`, and `visibility` blockers;
- emits blocked state only when the aggregate changes;
- replays current blocked state to late subscribers;
- does not resume gameplay until every blocker clears;
- marks gameplay active only when Opening wants gameplay and no blocker remains;
- marks Collection as non-gameplay/menu state.

`main.ts` subscribes to blocked state before constructing Phaser. Blocked state:

- blocks the WebAudio presentation layer;
- mutes Phaser sound;
- sleeps the game loop;
- wakes only when aggregate blockers clear.

**Hosted requirement:** validate this against real Yandex startup ad, tab/minimize, fullscreen ad and rewarded-ad events. CI cannot prove platform callback ordering.

---

## 5. Game Ready

Current Game Ready path is idempotent.

For a normal boot, `LoadingAPI.ready()` happens after:

- Yandex SDK initialization;
- safe storage acquisition;
- settings read;
- SFX sample preload;
- accent-font warmup or bounded timeout;
- Phaser construction / BootScene assets;
- Save V4 load/migration;
- active Drop collectible art availability attempt;
- requested Drop transaction when entering from Collection;
- recovered Charged package art availability attempt when applicable;
- first usable Opening frame is rendered;
- gameplay marker is switched to active.

The platform method itself guards against duplicate `ready()` calls.

**Hosted acceptance:** Yandex debug panel Game Ready indicator must turn green at the actual usable frame and must not time out or turn green while an internal loading state is still visible.

---

## 6. Storage / recovery

Production Yandex uses SDK-backed safe storage through the injected `StorageAdapter`; browser `localStorage` remains the mock/development fallback.

Current durable invariants already unit-covered include:

- V1/V2/V3 → V4 deterministic migration;
- staged reveal survives reload;
- no reward reroll on recovery;
- Charged cost + result are one atomic transaction;
- base/cache/recycle/Secret/Signal/Overcharge commit once;
- Secret `+40 CHIPS` is persisted in the exact transaction;
- old pre-V4 pending Hidden Pocket transactions keep their historical outcome;
- active Drop and pouch type survive recovery.

**Hosted acceptance:** repeat Basic and Charged interruptions against actual Yandex safe storage. LocalStorage tests are not a substitute.

---

## 7. Ads boundary

Audit found no direct `YaGames` / `sdk.adv` usage outside `src/platform/`.

Current ad call sites outside the adapter are **internal debug probes only**:

- rewarded technical grant;
- interstitial;
- sticky show/hide.

The debug rewarded probe grants one Charged-cost-sized DEV CHIPS amount and reloads after durable persistence so the cached OpeningSession cannot overwrite an out-of-session grant.

Current adapter protections:

- only one fullscreen request in flight;
- activity/audio blocked for fullscreen surface;
- callback watchdog prevents permanent deadlock;
- repeated `onRewarded` grants at most once;
- closing without `onRewarded` grants nothing;
- reward persistence failure returns an error rather than claiming success;
- gameplay surface can resume after ad close while the fullscreen lock remains reserved until reward persistence finishes;
- sticky failures return a reason rather than throw through gameplay.

### Important scope distinction

**Technical DRAFT ad integration is ready to test. Public monetization placement is not yet finalized.**

There is currently no normal-player rewarded CTA, interstitial placement policy, or production sticky-banner decision. Do not confuse successful debug-ad validation with a finished monetization design.

---

## 8. Automatic language

Yandex runtime resolves language from:

```text
sdk.environment.i18n.lang
```

Supported runtime languages:

- `ru` → Russian;
- all other values → English fallback.

This occurs during platform bootstrap before game messages are resolved.

**Hosted acceptance:** use Yandex SDK mocks/debug language selection to open both RU and EN and inspect all current six-Drop UI, not only the original Camera/Flip Phone content.

---

## 9. Input / focus boundary

Current browser shell already implements:

- fixed full-viewport game shell;
- `overflow: hidden`;
- `overscroll-behavior: none`;
- `touch-action: none`;
- text/callout selection disabled in game surface;
- iOS touch-callout disabled;
- context-menu prevention on the game shell;
- portrait orientation gate + activity blocker;
- safe-area inset layout support.

**Hosted/device acceptance:** long press, right click, swipe/overscroll, zoom, resize, portrait↔landscape and tab/minimize still require real-browser validation on the declared platform set.

---

## 10. Expanded content / loading

Boot does **not** preload all 60 collectibles.

Current loading model:

- Boot: default Drop + required static Opening/Collection assets;
- alternate Drop: lazy-load before switch/browse;
- Charged authored package: lazy-load only when selected or recovered;
- missing texture/load failure preserves procedural fallback and can retry later;
- Collection browse loads target Drop before rendering it;
- Collection → Opening passes the selected Drop and Opening owns the durable switch;
- pending reveal keeps its persisted Drop instead of being silently retargeted.

This keeps the archive complete while avoiding a 60-texture startup decode/fetch burst.

---

## 11. Candidate archive audit

Exact branch candidate audit after the gameplay-marker correction:

```text
unit tests:            172 / 172 PASS
asset validation:      60 checked / 0 skipped
build output files:    88
dist uncompressed:     11,720,751 bytes (~11.72 MB)
ZIP:                   10,516,502 bytes (~10.52 MB)
collectible assets:    60
index.html:             root of dist/archive
```

Current Yandex limit is 100 MB **uncompressed**, so the candidate has substantial size headroom.

Largest generated code chunk is currently about 1.56 MB minified / 407.6 KB gzip. This produces a Vite chunk-size warning but is not itself an archive-limit failure. Do not add code splitting solely to silence that warning; profile actual hosted Game Ready / TTI first.

---

## 12. Analytics boundary

Current semantic analytics already include the important gameplay outcome dimensions such as:

- pouch type;
- loot pool / Drop;
- rarity / NEW state;
- CHIPS earned and wallet after;
- cache tier / cache CHIPS;
- recycle CHIPS;
- Signal lock reached/consumed/retained;
- Overcharge gain/cash-out;
- Hidden Pocket;
- Secret discovery/duplicate;
- Collection open/return;
- Drop selection;
- pending-reveal recovery.

Ad adapter records request/open/close/error/grant semantics.

Custom Metrica `reachGoal` is enabled only when `VITE_YANDEX_METRICA_ID` is configured. With no ID, gameplay does not fail; debug console analytics remain available.

If custom Metrica is enabled for release, verify the Yandex CSP/allowed-host configuration and actual goal delivery in hosted DRAFT.

---

## 13. Local verdict

### Cleared locally

- current `/sdk.js` connection approach;
- SDK-before-platform-services ordering;
- startup pause subscription placement;
- corrected GameplayAPI start timing;
- idempotent Game Ready call site;
- injected safe-storage architecture;
- atomic/recoverable Save V4 reward transactions;
- activity blocker coordination;
- ads adapter exactly-once/error/timeout guards;
- automatic SDK-language architecture;
- six-Drop lazy-loading ownership;
- archive structure/size;
- 172-test/typecheck/assets/build gates;
- no direct Yandex ad globals outside platform adapter.

### Not possible to clear locally

- real Yandex Game Ready/debug indicator behavior;
- real startup fullscreen-ad pause race;
- actual `game_api_pause/resume` callback order on hosted platform;
- real SDK safe-storage persistence/interruption behavior;
- real rewarded/interstitial/sticky availability and callback behavior;
- actual Metrica delivery;
- hosted mobile/device focus/audio behavior;
- Yandex-side CSP/host settings;
- moderation-console metadata/media/configuration.

Those are the **next gate**, not reasons to add speculative code.

---

## 14. Exact hosted DRAFT run order

Use this order to maximize information and avoid mixing failures:

### A. Boot / markup

1. Upload exact production archive.
2. Open with Yandex debug panel.
3. Confirm SDK initialized with current loader (`IT`, not old-loader failure).
4. Confirm Game Ready turns green only at usable Opening.
5. Confirm gameplay gamepad is not green during loading.
6. Confirm gamepad becomes green when Opening is playable.
7. Open Collection and confirm gameplay marker stops/red.
8. Return to Opening and confirm it starts/green again.

### B. Startup/platform pause + sound

1. Exercise startup fullscreen ad if presented.
2. Toggle Yandex pause/resume debug control.
3. Switch tab/minimize/restore.
4. Confirm sound and gameplay stop together.
5. Confirm one clean resume with no stacked ambience/tweens.
6. Repeat during a held Secret result.

### C. Storage/recovery

1. Fresh save.
2. Basic interruption/reload at several reveal points.
3. Charged interruption/reload at several reveal points.
4. Signal lock retain/consume recovery.
5. Hidden Pocket NEW and duplicate recovery.
6. Verify exact wallet/Drop/pouch/result survives once.

### D. Six-Drop content

1. Browse every Collection Drop.
2. Confirm lazy-load/fallback produces no dead navigation.
3. Switch active Drop through Collection → Opening.
4. Open at least one real reward in every Drop.
5. Confirm result belongs only to selected Drop.
6. With pending reveal, verify browsing/navigation cannot retarget its persisted Drop.

### E. Ads debug probes

1. Interstitial success/no-fill/error/throttle where observable.
2. Rewarded success: grant exactly once.
3. Rewarded close without earned callback: grant zero.
4. Return uses fresh durable wallet.
5. Sticky status/show/hide only if testing API-managed sticky mode.
6. Confirm ad/pause blockers cannot resume sound/gameplay early.

### F. Localization / layout

1. Yandex RU environment.
2. Yandex EN environment.
3. Desktop landscape.
4. Mobile landscape.
5. resize/orientation/long-press/right-click/overscroll.
6. verify six Drop names and all gameplay/Collection copy.

### G. Hosted mix/repeated use

Play consecutive normal openings with headphones and an ordinary speaker/device. Reject only from evidence if ambience, rarity loops, Secret state, repeated banking or input behavior becomes tiring/broken on the hosted build.

---

## 15. After hosted DRAFT, before public moderation

Do **not** submit directly from a successful technical DRAFT without resolving these release decisions:

1. choose real rewarded placement + exact player-facing reward, or explicitly ship without rewarded ads;
2. choose interstitial logical pause policy, or explicitly omit interstitials;
3. decide whether sticky banner is worth its layout cost;
4. disable/remove unnecessary internal debug access for the public candidate if economy integrity matters;
5. configure/verify Metrica ID + CSP only if custom goals are used;
6. finalize title/category/tags/keywords/age/platform/orientation fields;
7. create release icon/cover/screenshots from the actual six-Drop build;
8. run final declared-device/browser/moderation self-check;
9. ensure public metadata describes the actual expanded game rather than the historical two-family slice.

These are public-release tasks. They should not block uploading this candidate to hosted DRAFT for platform validation.

---

## 16. Gate decision

**The project is locally ready to upload as a Yandex DRAFT candidate after the gameplay-marker correction.**

Do not add another speculative platform abstraction before that upload. The highest-value next evidence is now the real hosted environment.

If hosted DRAFT finds a defect, fix the smallest demonstrated platform problem, rebuild the exact archive, rerun the affected hosted scenario, then repeat the full critical recovery/audio/ad smoke before moderation.
