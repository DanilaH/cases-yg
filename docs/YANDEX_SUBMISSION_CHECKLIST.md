# Yandex Games public-release checklist

This checklist is for the current **expanded six-Drop public-release candidate**.

Platform requirements were re-checked against current Yandex Games documentation on **2026-09-10**. Re-check again immediately before public moderation if requirements change.

The current expanded candidate uses `YANDEX_DRAFT_READINESS_2026-09-10.md` as the authoritative pre-upload handoff. `YANDEX_SLICE_VALIDATION.md` retains the detailed hosted scenario matrix; historical assumptions that content expansion happens after the first hosted gate are superseded.

---

# 1. SDK / hosted-runtime baseline

Before public moderation verify:

- Yandex Games SDK initializes correctly;
- `LoadingAPI.ready()` fires only when required startup assets/save recovery are done and the game is interactive;
- `GameplayAPI.start()/stop()` mapping matches actual gameplay/menu state if used;
- platform pause/resume events pause and resume gameplay/audio correctly;
- game remains usable without mandatory authorization unless release scope later adds an account-dependent feature.

These paths must be exercised in the real hosted DRAFT using the current expanded candidate. The six-Drop/content-loading build has not yet earned hosted-platform acceptance from local CI alone.

---

# 2. Advertising — PLATFORM RULES ARE THE BASELINE

Advertising follows the current Yandex Games SDK + moderation requirements, with product placement/reward values tuned against the final release loop.

Required baseline:

- ads are called only through Yandex Games SDK;
- no third-party/static ad substitutions;
- interstitial/fullscreen requests happen only at logical pauses and never during active tear/reveal;
- rewarded ad is voluntary;
- rewarded UI clearly communicates both that an ad will be watched and the **specific reward** the user receives;
- rewarded value is granted exactly once on the rewarded-completion callback;
- close/error without rewarded completion grants nothing;
- full-screen/rewarded ads pause gameplay and all audio;
- returning from ads preserves progress and cannot double-commit a pending reward;
- ad unavailability/error never deadlocks gameplay;
- platform/ad/visibility pause reasons are coordinated so duplicate callbacks do not cause premature or double resume.

Yandex controls actual interstitial display frequency. The game should request interstitials only at deliberately chosen logical moments rather than implementing high-frequency timer spam.

### Sticky banner

If sticky banner is used:

- configure supported placement in Yandex Games Console;
- if the game needs manual show/hide, enable the matching API-managed sticky option in Console;
- control visibility only through the SDK adapter;
- verify it never obscures CHIPS/Signal/Charged controls or required navigation/gameplay;
- verify behavior across resize/orientation/layout changes.

Architecture continues to expose ad behavior through the project adapter rather than scenes calling Yandex globals directly.

---

# 3. Final monetization tuning — LOCK BEFORE SUBMISSION

After expanded content/economy is known, choose:

- useful rewarded placement(s) and exact reward(s);
- which compliant logical pauses are worth requesting interstitial at;
- whether sticky banner is worth its layout/revenue trade-off;
- any game-owned cooldown/config needed beyond platform behavior;
- analytics events used to evaluate monetization impact.

These are release optimization choices. They do not reopen platform compliance rules.

Do not manufacture energy/package scarcity solely to force ads.

The old development-only `+25 Signal` rewarded probe belongs to the pre-Lite Signal model and must not survive into the final product. Lite technical rewarded validation uses a clearly dev-only CHIPS grant; public rewarded value is a separate final decision.

---

# 4. Save / economy / recovery

Use injected `StorageAdapter`:

- Yandex runtime through safe SDK-backed storage;
- local development fallback through browser localStorage.

Verify:

- progress survives refresh;
- save migrations from development versions are deterministic/idempotent;
- `pendingReveal` survives interruption;
- refresh cannot reroll;
- ad open/close cannot double-commit;
- CHIPS wallet cannot double-credit;
- duplicate recycle cannot grant twice;
- Signal cannot increment/consume twice;
- Charged Pouch cost and all rewards are one atomic transaction;
- interrupted Charged opening cannot lose its cost without preserving the already-rolled reward.

Cloud/player save remains a separate release choice if later needed.

---

# 5. Expanded-content / Drop loading

The current expanded candidate contains **60 authored collectible assets** organized into six themed Drops / loot pools rather than one global mega-pool.

Before Game Ready / moderation:

- profile actual startup payload;
- preload only what is required for immediate interaction;
- use grouped/on-demand loading for expanded Collection/Drop content if needed;
- no user-visible network wait during ordinary Opening ↔ currently available Collection navigation;
- decoded texture memory is tested on real mobile;
- archive remains below current Yandex limits;
- active Drop content is complete and deterministic;
- switching Drops cannot corrupt pending rewards or Signal targeting.

Do not blindly preload every 1024 texture; keep active-Drop/on-demand loading unless hosted profiling demonstrates a better strategy.

---

# 6. Responsive / browser-interaction QA

Target Desktop + Mobile landscape unless release plan changes.

Verify representative desktop/mobile sizes, browser zoom ~80–125%, and orientation transitions.

Fail release if there is:

- critical crop;
- overlapping controls;
- unusable tear gesture;
- hidden navigation;
- CHIPS/Signal/Charged state hidden or clipped;
- non-uniform sprite stretch;
- system scrollbar;
- swipe-to-refresh/overscroll stealing interaction;
- right-click/long-press context UI interfering with play;
- ad/banner overlay hiding required game controls.

---

# 7. Localization

Current architecture: RU + EN, unsupported language → EN.

Before release:

- choose language automatically from Yandex SDK environment;
- verify all gameplay, Collection, Drop, CHIPS, Signal, Charged and monetization copy in both languages;
- rewarded CTA states that an ad will be watched and names the reward;
- screenshots/media match selected localization;
- no important gameplay copy is baked into non-localizable raster art.

---

# 8. Store metadata / titles

Final title is chosen only after expanded release content/key visual is stable.

Working candidates remain:

```text
RU: Мистери Гаджеты: Ретро Распаковка
EN: Mystery Pocket Tech
```

Before upload:

- verify catalog uniqueness in Console;
- choose real categories/tags/keywords from current Console options;
- ensure metadata describes the expanded release, not the current development catalog;
- confirm platform/iOS Team ID requirements if iOS is selected.

---

# 9. Store visual materials

Re-check exact current dimensions before upload.

Current planning targets:

- icon 512×512 PNG;
- cover 800×470 PNG;
- optional maskable icon 512×512;
- optional hero 1560×520;
- required landscape screenshots 16:9 within current allowed long-side range.

Produce these from the **actual expanded six-Drop release build/key visual**. Camera/Flip Phone may still appear only if they are genuinely the strongest marketing heroes.

Screenshots must show the actual release build. Real gameplay should occupy the required majority of screenshot composition under current Yandex moderation rules, and localization must match the selected language.

---

# 10. Content / loop completeness

The public build must look intentionally complete:

- expanded roster is present;
- Drops/loot pools are coherently grouped when more than one exists;
- no internal debug controls;
- no placeholder assets;
- no dead buttons;
- no unexplained `coming soon` shells;
- Collection organization fits the final family/Drop count;
- Basic/Charged economy is tuned against the final content matrix;
- Signal/Hidden Pocket behavior matches release semantics rather than old slice numbers;
- monetization UI is integrated coherently rather than bolted on;
- total content/replayability meets current Yandex duration/replayability expectations.

The old moderation concern about a two-family game is irrelevant because that build remains development-only.

---

# 11. Analytics

Verify built-in Yandex metrics and Metrica gameplay/ad events in draft mode.

Gameplay events should represent final semantics, including where relevant:

- pouch type;
- active Drop;
- CHIPS earned/spent;
- duplicate recycle;
- Signal lock reach/consume;
- Charged ready/open;
- Hidden Pocket;
- Collection navigation/completion.

Ad events should allow diagnosing:

- interstitial request/open/close/error;
- rewarded request/start/earned/close/error;
- reward granted exactly once;
- progression/continuation around ad placements.

Analytics failure must never block gameplay/reward commits.

---

# 12. Final pre-submit pass

At minimum:

- fresh save + every supported migration path;
- Basic/Charged/Drop/Signal/Hidden Pocket release rules;
- forced rarity/Secret paths;
- interrupted Basic pending reveal;
- interrupted Charged pending reveal with exact wallet verification;
- Collection at early/mid/full states across Drops;
- expanded-content loading/memory test;
- RU/EN automatic language selection;
- Desktop/Mobile landscape;
- resize/zoom/right-click/long-press/overscroll;
- minimize/tab pause;
- startup/platform pause-resume/ad path;
- interstitial call/return/error;
- rewarded success/close/error/exactly-once reward;
- sticky banner layout + API-managed mode if enabled;
- Metrica events;
- production archive smoke test;
- final icon/cover/screenshots/metadata consistency;
- Yandex draft/debug run before moderation.
