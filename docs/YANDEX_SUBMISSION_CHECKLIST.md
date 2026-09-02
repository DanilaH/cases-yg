# Yandex Games submission checklist

Platform requirements checked against current Yandex Games documentation on **2026-09-02**. Re-check the official draft form immediately before submission because platform requirements can change.

This file is operational, not a replacement for the official requirements.

---

# 1. Probe platform selection — LOCKED

Submit first probe for:

- **Desktop**;
- **Mobile**;
- **Landscape** orientation.

No TV-specific UX/support in the first probe.

Portrait gets orientation guidance rather than a second game composition.

---

# 2. SDK / lifecycle — REQUIRED

Before moderation verify:

- Yandex Games SDK is connected;
- `LoadingAPI.ready()` is called only when all critical assets are loaded and the game is actually interactive;
- gameplay start/stop lifecycle is marked correctly;
- game/tweens/input react correctly to platform pause/resume;
- all sound stops/pauses when the page/app is minimized or gameplay is paused;
- game remains playable without authorization/login.

First probe does not require player authorization.

---

# 3. Build/archive — REQUIRED

Yandex archive build:

- root contains a single `index.html`;
- uncompressed archive content must remain below the current platform limit (**100 MB** at time of this checklist);
- no spaces or Cyrillic characters in runtime file/folder names;
- no network dependency is required to enter the base gameplay loop;
- all ten collectible hero assets and primary scene assets are preloaded/cached before game-ready.

---

# 4. Responsive moderation — REQUIRED

The game must remain functional when the moderation team resizes the available game area.

Verify at minimum against representative desktop sizes including:

- 1280×1024;
- 1366×768;
- 1600×900;
- 1680×1050;
- 1920×1080;
- 1920×1200;
- 2560×1080;
- 2560×1440;
- 3840×2160.

Also test real mobile landscape viewports.

Fail the build if resizing causes:

- critical content crop;
- overlapping controls;
- unusable tear gesture;
- hidden navigation;
- non-uniform sprite stretch;
- browser scrollbars that interfere with play.

Use the locked adaptive layout rules from `TECHNICAL_DIRECTION.md` rather than special-casing every resolution.

---

# 5. Localization — REQUIRED FOR SELECTED LANGUAGES

Probe UI supports:

- RU;
- EN;
- EN fallback for unsupported platform languages.

Use `ysdk.environment.i18n.lang` for automatic language selection.

Before submission verify that meaningful gameplay/UI text is localized, including:

- NEW / НОВОЕ;
- DUPLICATE / ДУБЛИКАТ;
- Common / Обычный;
- Rare / Редкий;
- Epic / Эпический;
- Legendary / Легендарный;
- Secret / Секретный;
- SIGNAL LOCK / СИГНАЛ ЗАХВАЧЕН;
- Collection / Коллекция;
- Library / Библиотека;
- Next pouch / Следующий пакет;
- Back / Назад;
- Standard Collection / Основная коллекция;
- Secrets / Секреты.

The title shown inside the game/promotional materials must match the corresponding draft localization.

No manual language selector is needed in the first probe.

---

# 6. Store titles — CURRENT CANDIDATES

RU:

> **Мистери Гаджеты: Ретро Распаковка**

EN:

> **Mystery Pocket Tech**

Before submission:

- verify catalog uniqueness in the actual Yandex Games Console;
- if a collision exists, rename before producing final text-bearing promotional material;
- keep the chosen title consistent across the game and draft materials for that localization.

Catalog uniqueness is an external check, not a reason to reopen the product concept.

---

# 7. Required visual materials

Current draft requirements to design/export against:

## Icon

- **512×512 px**;
- PNG;
- not a raw gameplay screenshot.

Locked composition direction:

> partly torn Mystery Pouch + one highly readable Camera emerging + strong `?` cue; no small text.

## Cover

- **800×470 px**;
- PNG;
- not a raw gameplay screenshot.

Locked composition direction:

> Mystery Pouch + Camera + Flip Phone, showing the actual collectible fantasy without fake platform UI/badges.

## Optional Hero Image

- **1560×520 px**;
- PNG or JPG.

Do only if it is cheap after icon/cover are final.

---

# 8. Screenshots — REQUIRED

Current landscape screenshot requirement:

- **16:9**;
- long side between **1280 and 2560 px**;
- JPEG or 24-bit PNG;
- at least **2 screenshots for each selected platform**.

Because probe targets Desktop + Mobile, prepare at least:

- 2 Desktop screenshots;
- 2 Mobile-landscape screenshots.

Recommended coverage:

1. active pouch/reveal;
2. Collection Shelf;
3. Library/rarity progress as an optional additional shot.

Screenshots must be actual game presentation, not promotional mockups.

---

# 9. Media-content sanity

Before upload verify:

- no broken/compressed visual artifacts;
- no cut-off text;
- no system status bars/battery indicators in promo media;
- no fake Yandex Games rating/badge/UI;
- no borders/rounded-card frame baked around icon/cover;
- media clearly reflects the actual game;
- no brand logos or exact copyrighted product branding in collectible art.

---

# 10. Completeness / polish check

Do not present the build publicly as an unfinished `beta` or `probe`. Those are internal product terms.

The catalog build should feel like a small **complete collectible toy**:

- opening loop fully works;
- save/recovery works;
- Collection works;
- no dead buttons/placeholders;
- no visible `coming soon` systems;
- no Mod Bench/Tech Parts shells;
- no placeholder art;
- enough repeated collection/chase play exists that the experience does not look like a one-minute tech demo.

If moderation feedback says the content feels unfinished, improve polish/presentation first. Do not automatically reintroduce the old large scope.

---

# 11. Analytics verification

Built-in Yandex Games metrics require no custom gameplay backend.

For custom gameplay funnel:

- create/connect Yandex Metrica counter;
- include the counter according to current Yandex instructions;
- verify goals/events in draft mode;
- confirm `first_package_interaction`, `reveal_complete`, Collection, Signal and Hidden Pocket events fire once with correct parameters;
- never let analytics failure block gameplay/save commits.

---

# 12. Final pre-submit pass

Before pressing moderation:

- fresh install/save test;
- first 3 protected openings test;
- duplicate → Signal test;
- SIGNAL LOCK early and late-mode test;
- Hidden Pocket forced-debug test for both Secrets;
- refresh during pending reveal test;
- 8/8 completion test;
- 2/2 Secret completion test;
- RU/EN language test;
- desktop/mobile landscape test;
- resize stress test;
- minimize/audio-pause test;
- Metrica event test;
- production build/archive smoke test;
- icon/cover/screenshots/title consistency review.
