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

# 2. Advertising — REQUIRED RELEASE QA

The release is intended to monetize through Yandex advertising.

Architecture must already expose:

```text
showInterstitial()
showRewarded(rewardId)
setStickyBannerVisible(boolean)
```

Final release config must specify which are actually used.

Verify:

- ads are called only through Yandex Games SDK;
- interstitial is requested only at a logical pause, never during active tear/reveal;
- rewarded is explicitly optional and UI states the **specific reward** before the user starts it;
- rewarded value is granted exactly once only after rewarded completion callback;
- close/error without reward grants nothing;
- ad unavailability/error never deadlocks gameplay;
- full-screen/rewarded ads pause gameplay and all audio;
- state resumes correctly after `game_api_resume`;
- returning from an ad cannot double-commit a pending reward;
- sticky banner, if enabled, never obscures gameplay/navigation and its show/hide state survives layout changes appropriately.

Yandex controls interstitial display frequency; game code should request at chosen logical moments rather than inventing an unsafe high-frequency loop.

---

# 3. Final monetization choices — MUST BE LOCKED BEFORE SUBMISSION

After expanded content/economy is known, document:

- rewarded placement(s);
- exact reward(s);
- interstitial request point(s);
- whether sticky banner is enabled;
- any cooldown/config rules owned by game code;
- analytics events used to evaluate monetization impact.

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

Screenshots must show the actual release build and localization.

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
- monetization UI is integrated coherently rather than bolted on.

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
- RU/EN;
- Desktop/Mobile landscape;
- resize/zoom/right-click/long-press/overscroll;
- minimize/tab pause;
- startup ad pause/resume event path;
- interstitial call/return;
- rewarded success/close/error/exactly-once reward;
- sticky banner layout if enabled;
- Metrica events;
- production archive smoke test;
- final icon/cover/screenshots/metadata consistency;
- Yandex draft/debug run before moderation.
