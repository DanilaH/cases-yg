# Yandex Games public-release checklist

This checklist is for the **expanded public release**, not the private Camera + Flip Phone internal slice.

Platform requirements were checked against Yandex Games documentation on 2026-09-02. Re-check immediately before submission.

---

# 1. SDK is production infrastructure from day one

Before public moderation verify:

- Yandex Games SDK initializes correctly;
- `LoadingAPI.ready()` fires only when required startup assets/save recovery are done and the game is interactive;
- `GameplayAPI.start()/stop()` mapping matches actual gameplay/menu state if used;
- `game_api_pause` / `game_api_resume` pause and resume gameplay/audio correctly;
- game remains usable without mandatory authorization unless release scope later adds an account-dependent feature.

The internal slice should already have exercised these paths in Yandex draft/debug mode.

---

# 2. Advertising — PLATFORM RULES ARE THE BASELINE

Advertising is not a bespoke design-policy question: implement it according to the **current Yandex Games SDK + moderation requirements**, then tune product placement/reward values later.

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

Yandex controls the actual display frequency of interstitial ads. The game should request them only at deliberately chosen logical moments rather than implementing high-frequency timer spam.

### Sticky banner

If sticky banner is used:

- configure supported placement in the Yandex Games Console;
- by default Yandex may manage/show it automatically;
- if the game needs manual show/hide, enable the Console option **Use the API to display a sticky-banner**;
- then control visibility only through the SDK adapter;
- verify it never obscures required navigation/gameplay and behaves correctly across resize/orientation/layout changes.

Architecture must expose roughly:

```text
showInterstitial()
showRewarded(rewardId)
setStickyBannerVisible(boolean)
```

with explicit result/error semantics rather than scenes calling Yandex globals directly.

---

# 3. Final monetization tuning — LOCK BEFORE SUBMISSION, NOT BEFORE SLICE

After expanded content/economy is known, choose:

- useful rewarded placement(s) and exact reward(s);
- which compliant logical pauses are worth requesting interstitial at;
- whether sticky banner is worth its layout/revenue trade-off;
- any game-owned cooldown/config needed beyond platform behavior;
- analytics events used to evaluate monetization impact.

These are release optimization choices. They do not reopen the platform compliance rules above.

Do not manufacture energy/package scarcity solely to force ads.

---

# 4. Save / recovery

Use injected `StorageAdapter`:

- Yandex runtime via `await ysdk.getStorage()`;
- local development fallback via browser localStorage.

Verify:

- progress survives refresh;
- `pendingReveal` survives interruption;
- refresh cannot reroll;
- ad open/close cannot double-commit;
- save format migrates cleanly from internal/content-development versions where needed.

Cloud/player save remains a separate release choice if later needed.

---

# 5. Expanded-content loading

The public release will contain substantially more than 10 collectible assets.

Before Game Ready / moderation:

- profile actual startup payload;
- preload only what is required for immediate interaction;
- use grouped/on-demand loading for expanded Collection content if needed;
- no user-visible network wait during ordinary Opening ↔ currently available Collection navigation;
- decoded texture memory is tested on real mobile;
- archive remains below current Yandex limits.

Do not blindly preload every 1024 texture merely because the internal slice could.

---

# 6. Responsive / browser-interaction QA

Target Desktop + Mobile landscape unless release plan changes.

Verify representative desktop/mobile sizes, browser zoom ~80–125%, and orientation transitions.

Fail release if there is:

- critical crop;
- overlapping controls;
- unusable tear gesture;
- hidden navigation;
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
- verify all gameplay, Collection, progression and monetization copy in both languages;
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
- ensure metadata describes the expanded release, not the internal two-family slice;
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

Produce these from the **expanded release key visual/content**, not from the temporary two-family slice unless Camera/Flip Phone still happen to be the strongest marketing heroes.

Screenshots must show the actual release build. Real gameplay should occupy the required majority of screenshot composition under current Yandex moderation rules, and localization must match the selected language.

---

# 10. Content completeness

The public build must look intentionally complete:

- expanded roster is present;
- no internal debug controls;
- no placeholder assets;
- no dead buttons;
- no unexplained `coming soon` shells;
- Collection organization fits the final family count;
- progression/odds match release balance rather than old slice numbers;
- monetization UI is integrated coherently rather than bolted on;
- total content/replayability meets current Yandex duration/replayability expectations.

The old moderation concern about a two-family game is no longer relevant because that build is private.

---

# 11. Analytics

Verify built-in Yandex metrics and Metrica gameplay events in draft mode.

Gameplay events should represent release semantics after roster/balance changes.

Ad events should allow diagnosing:

- interstitial request/open/close/error;
- rewarded request/start/earned/close/error;
- reward granted exactly once;
- progression/continuation around ad placements.

Analytics failure must never block gameplay/reward commits.

---

# 12. Final pre-submit pass

At minimum:

- fresh save + migration test;
- drop/Signal/Hidden Pocket release rules;
- forced rarity/Secret paths;
- interrupted pending reveal;
- Collection at early/mid/full states;
- expanded-content loading/memory test;
- RU/EN automatic language selection;
- Desktop/Mobile landscape;
- resize/zoom/right-click/long-press/overscroll;
- minimize/tab pause;
- startup/platform pause-resume ad path;
- interstitial call/return/error;
- rewarded success/close/error/exactly-once reward;
- sticky banner layout + API-managed mode if enabled;
- Metrica events;
- production archive smoke test;
- final icon/cover/screenshots/metadata consistency;
- Yandex draft/debug run before moderation.
