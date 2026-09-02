# Yandex Games submission checklist

Platform requirements checked against current Yandex Games documentation on **2026-09-02**. Re-check the official draft form immediately before submission because platform requirements can change.

This file is operational, not a replacement for the official requirements.

---

# 1. Probe platform selection — LOCKED

Target first release:

- **Desktop**;
- **Mobile**;
- **Landscape** orientation.

No TV-specific UX/support in the first probe.

Portrait gets orientation guidance rather than a second game composition.

Operational iOS rule:

- current Yandex draft flow requires an **Apple Team ID** when iOS is selected;
- if a valid Team ID is readily available, include iOS;
- if not, do not delay the behavioral release: submit Desktop + Android/mobile support first and add iOS later.

---

# 2. SDK / lifecycle — REQUIRED

Before moderation verify:

- Yandex Games SDK is connected;
- `LoadingAPI.ready()` is called only when all critical assets are loaded, save recovery is resolved and the game is actually interactive;
- gameplay start/stop lifecycle is marked correctly if `GameplayAPI` is used;
- game/tweens/input react correctly to platform pause/resume;
- all sound stops/pauses when the page/app is minimized or gameplay is paused;
- game remains playable without authorization/login.

First probe does not require player authorization.

Recommended gameplay-markup mapping if enabled:

```text
Opening playable  → GameplayAPI.start()
Collection/menu   → GameplayAPI.stop()
return to Opening → GameplayAPI.start()
```

Do not emit contradictory start/stop events around platform/tab pause and resume.

---

# 3. Save / recovery — REQUIRED

The probe remains local-first and does not enable Yandex cloud save.

Implementation:

- inject a small `StorageAdapter`;
- in Yandex runtime use the Storage-like object returned by `await ysdk.getStorage()`;
- in ordinary local development use browser `localStorage` fallback;
- save immediately around reward transactions;
- `pendingReveal` must survive refresh and resume the same predetermined reward;
- refresh/crash must never reroll or double-commit a result.

The Draft cloud-save toggle should remain off unless `Player.setData()` / `setStats()` is deliberately introduced later.

---

# 4. Build/archive — REQUIRED

Yandex archive build:

- root contains `index.html`;
- uncompressed archive content remains below the current platform limit (**100 MB** at time of this checklist);
- no spaces or Cyrillic characters in runtime file/folder names;
- no network dependency is required to enter the base gameplay loop;
- all ten collectible hero assets, pouch layers and primary scene assets are preloaded/cached before game-ready.

Internal target is much smaller: keep the first-probe build preferably under roughly **15 MB uncompressed** unless asset-quality profiling justifies more.

---

# 5. Responsive / browser-interaction moderation — REQUIRED

The game must remain functional when moderation resizes the available game area.

Verify representative desktop sizes including:

- 1280×1024;
- 1366×768;
- 1600×900;
- 1680×1050;
- 1920×1080;
- 1920×1200;
- 2560×1080;
- 2560×1440;
- 3840×2160.

Also test real mobile landscape viewports and representative browser zoom around **80–125%**.

Fail the build if resizing/input causes:

- critical content crop;
- overlapping controls;
- unusable tear gesture;
- hidden navigation;
- non-uniform sprite stretch;
- browser scrollbars that interfere with play;
- swipe-to-refresh/overscroll stealing the gesture;
- right-click context menus blocking the game surface;
- long-press text selection/context UI interfering with touch play.

Use the locked adaptive layout rules from `TECHNICAL_DIRECTION.md` rather than special-casing every resolution.

---

# 6. Localization — REQUIRED FOR SELECTED LANGUAGES

Probe UI supports:

- RU;
- EN;
- EN fallback for unsupported platform languages.

Use `ysdk.environment.i18n.lang` for automatic language selection.

Before submission verify meaningful gameplay/UI text is localized, including:

- NEW / НОВОЕ;
- DUPLICATE / ДУБЛИКАТ;
- Common / Обычный;
- Rare / Редкий;
- Epic / Эпический;
- Legendary / Легендарный;
- Secret / Секретный;
- SIGNAL LOCK / СИГНАЛ ЗАХВАЧЕН;
- Collection / Коллекция;
- Shelf / Полка;
- Library / Библиотека;
- Next pouch / Следующий пакет;
- Open more / Открыть ещё;
- Back / Назад;
- Standard Collection / Основная коллекция;
- Secrets / Секреты.

No manual language selector is needed in the first probe.

---

# 7. Store titles — CURRENT CANDIDATES

RU:

> **Мистери Гаджеты: Ретро Распаковка**

EN:

> **Mystery Pocket Tech**

Before submission:

- verify catalog uniqueness in the actual Yandex Games Console;
- if a collision exists, rename before producing final text-bearing promotional material;
- keep the chosen title consistent with draft localization.

For the first probe, icon/cover/hero should contain **no localized title text** so the same high-quality object creative can be reused for RU + EN and a late title collision does not force art re-export.

Catalog uniqueness is an external check, not a reason to reopen the product concept.

---

# 8. Required visual materials

Current draft requirements to design/export against:

## Icon

- **512×512 px**;
- PNG;
- not a raw gameplay screenshot.

Locked composition:

> partly torn Mystery Pouch + one highly readable Camera emerging + strong `?` cue; no small text.

## Cover

- **800×470 px**;
- PNG;
- not a raw gameplay screenshot.

Locked composition:

> Mystery Pouch + Camera + Flip Phone, showing the actual collectible fantasy without fake platform UI/badges.

## Maskable icon

- current Draft exposes a **512×512 PNG** maskable-icon field;
- optional for the probe; cheap to produce if final icon layers already support safe margins.

## Optional Hero Image

- **1560×520 px**;
- PNG or JPG.

Do only if cheap after icon/cover are final.

---

# 9. Screenshots — REQUIRED

Current landscape screenshot requirement:

- **16:9**;
- long side between **1280 and 2560 px**;
- JPEG or 24-bit PNG;
- at least **2 screenshots for each selected platform**;
- screenshots must be actual game presentation.

Because the draft declares RU + EN and screenshots contain localized in-game UI, plan language-specific captures.

Minimum planned set:

```text
RU: 2 Desktop + 2 Mobile landscape
EN: 2 Desktop + 2 Mobile landscape
= 8 screenshots
```

Recommended coverage:

1. active pouch tear/reveal;
2. Collection Shelf;
3. Library/rarity progress as an optional additional shot.

Do not substitute promotional mockups for screenshots.

---

# 10. Media-content sanity

Before upload verify:

- no broken/compressed visual artifacts;
- no cut-off text;
- no system status bars/battery indicators in promo media;
- no fake Yandex Games rating/badge/UI;
- no borders/rounded-card frame baked around icon/cover;
- media clearly reflects the actual game;
- no brand logos or exact copyrighted product branding in collectible art;
- localized screenshots match the language selected in the draft.

---

# 11. Content-duration / completeness check — REQUIRED

Yandex requirement 2.9 expects enough content for a user to spend at least around **10 minutes**, but official guidance explicitly allows games with little unique content when **replayability/variability provides a real reason to keep playing**.

Our moderation case is replayability:

- random family/rarity outcomes;
- Signal progression;
- Legendary chase;
- Hidden Pocket;
- 2 Secret outcomes;
- persistent 8/8 + 2/2 collection goals;
- repeatable opening remains functional after standard completion.

Do not present the build publicly as unfinished `beta` or `probe`.

The catalog build must feel like a small complete collectible toy:

- opening loop fully works;
- save/recovery works;
- Collection works;
- no dead buttons/placeholders;
- no visible `coming soon` systems;
- no Mod Bench/Tech Parts shells;
- no placeholder art;
- repeated/chase play is visible and intentional.

If moderation specifically rejects content duration, respond to that evidence. Do **not** pre-emptively restore the old large content scope.

---

# 12. Monetization declaration — REQUIRED

The first behavioral release intentionally contains **no ads and no in-app purchases**.

Current Yandex requirement says YAN monetization is normally expected; when a developer intentionally does not monetize, state that directly in the Draft **Developer’s comment**.

Recommended comment:

> First release intentionally contains no ads or in-app purchases. Monetization is not provided in this version. The core experience is a free replayable collectible opener; progress is saved immediately after reward transactions.

Do not add artificial energy/package scarcity just to make monetization exist.

---

# 13. Analytics verification

Built-in Yandex Games metrics require no custom gameplay backend.

For custom gameplay funnel:

- create/connect Yandex Metrica counter;
- include the counter according to current Yandex instructions;
- verify goals/events in draft mode;
- confirm `first_package_interaction`, `reveal_complete`, Collection, Signal and Hidden Pocket events fire once with correct parameters;
- never let analytics failure block gameplay/save commits.

---

# 14. Final pre-submit pass

Before pressing moderation:

- fresh install/save test;
- first 3 protected openings test;
- duplicate → Signal test;
- SIGNAL LOCK early and late-mode test;
- Hidden Pocket forced-debug test for both Secrets;
- refresh during pending reveal test;
- recovery through Yandex safe storage test;
- 8/8 completion test;
- 2/2 Secret completion test;
- RU/EN language test;
- Desktop/mobile landscape test;
- resize + browser zoom stress test;
- right-click/long-press/overscroll test;
- orientation-change/save test on mobile;
- minimize/audio-pause test;
- Metrica event test;
- production build/archive smoke test;
- icon/cover/screenshots/title consistency review;
- Developer’s comment confirms intentional no-monetization;
- if iOS selected, verify Apple Team ID is available and valid;
- run the game in Yandex draft/debug environment before moderation.
