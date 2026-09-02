# Asset manifest — first behavioral probe

This is the complete asset inventory required to ship the locked Camera + Flip Phone probe.

Status meanings:

- **EXISTS** — usable source/reference already exists in the repository;
- **TO PRODUCE** — required before submission;
- **RUNTIME-GENERATED** — create in Phaser/code, not as an external art file;
- **OPTIONAL** — do not block probe.

The goal is to keep the number of bespoke production assets small and explicit.

---

# 1. Collectible hero art — 10 required runtime assets

Runtime format for all collectibles:

- transparent WebP;
- target **1024×1024**;
- consistent framing/margins within each family;
- no baked glow/drop shadow/reveal particles;
- same asset reused for reveal, Shelf and Library.

Source master target: **1536×1536 transparent**, never below 1024×1024.

| Runtime path | Role | Status |
|---|---|---|
| `assets/collectibles/camera-common.webp` | Camera Common | TO PRODUCE |
| `assets/collectibles/camera-rare.webp` | Camera Rare | TO PRODUCE |
| `assets/collectibles/camera-epic.webp` | Camera Epic | TO PRODUCE |
| `assets/collectibles/camera-legendary.webp` | Camera Legendary | TO PRODUCE |
| `assets/collectibles/camera-secret-cosmic.webp` | Secret Camera | TO PRODUCE |
| `assets/collectibles/flip-phone-common.webp` | Flip Phone Common | TO PRODUCE |
| `assets/collectibles/flip-phone-rare.webp` | Flip Phone Rare | TO PRODUCE |
| `assets/collectibles/flip-phone-epic.webp` | Flip Phone Epic | TO PRODUCE |
| `assets/collectibles/flip-phone-legendary.webp` | Flip Phone Legendary | TO PRODUCE |
| `assets/collectibles/flip-phone-secret-music.webp` | Secret Flip Phone | TO PRODUCE |

## Production sources per family

Do not treat the ten runtime files as ten unrelated designs.

Required working material:

### Camera

- 6–10 exploration candidates;
- one contact sheet;
- one selected canonical master;
- one small prompt/revision log;
- 4 derived standard variants;
- 1 Secret edit.

### Flip Phone

- same structure.

Rejected exploration images do not all need to be committed.

---

# 2. Mystery Pouch — 3 runtime layers + 1 reference

Existing reference:

| Path | Role | Status |
|---|---|---|
| `docs/assets/package-mystery-pouch-v1.webp` | approved visual reference | EXISTS |

The reference should **not** be dropped into runtime as one flat sprite because the accepted interaction requires a draggable star/tab and a visibly detached tear strip.

Produce aligned transparent runtime layers on the same source canvas:

| Runtime path | Role | Status |
|---|---|---|
| `assets/package/pouch-body.webp` | lower/main pouch body after top strip separation | TO PRODUCE |
| `assets/package/pouch-tear-strip.webp` | detachable top strip along tear seam | TO PRODUCE |
| `assets/package/pouch-star-tab.webp` | draggable star-shaped interaction handle | TO PRODUCE |

Recommended source workflow:

- reconstruct/clean from approved package reference;
- preserve exact colors, mystery badge, gadget silhouettes and circuit-trace language;
- remove the star from the body/strip artwork so it can move independently;
- keep layer dimensions/pivots aligned for simple Phaser composition;
- the opening slit/rarity flash can be runtime-generated rather than another painted asset.

Target runtime layer envelope: roughly **1024×1024** aligned transparent canvases or smaller if final layout proves safe.

---

# 3. Scene/environment art — 3 required runtime assets

## Opening

| Runtime path | Role | Status |
|---|---|---|
| `assets/backgrounds/opening-bg.webp` | calm Y2K opener atmosphere behind pouch | TO PRODUCE |

Direction:

- supports the silver/lavender pouch without competing with it;
- center-safe composition;
- extra horizontal decoration can be cropped on compact screens;
- no baked UI/text.

## Collection

Use a two-layer composition so collectibles can visually sit inside the environment instead of looking pasted on top.

| Runtime path | Role | Status |
|---|---|---|
| `assets/backgrounds/collection-bg.webp` | rear wall/desk/shelf atmosphere | TO PRODUCE |
| `assets/backgrounds/collection-foreground.webp` | shelf lip/foreground props drawn in front of collectibles | TO PRODUCE |

Direction:

- cozy illustrated Y2K shelf/desk;
- two intentional hero positions;
- decorative CDs/beads/cables/stickers/lamp glow allowed;
- props must not look like additional locked collectible slots;
- keep central safe region compatible with compact/standard/wide layout.

Recommended background working canvas: approximately **2560×1080** so the same art can cover wide landscape and crop safely toward compact aspect ratios.

---

# 4. UI visuals — no bespoke raster pack required

Keep UI cheap and responsive.

Prefer Phaser Graphics/Text and tiny vector paths rather than generated art for every button.

Required UI elements:

- Collection navigation;
- Shelf / Library switch;
- Back / Open More;
- mute / unmute;
- Signal LCD meter shell/bars;
- rarity label/badge treatment;
- NEW / duplicate treatment;
- `???` Secret state;
- standard 8/8 + Secrets 0/2 counters;
- first-session tear gesture cue.

Status: **RUNTIME-GENERATED / CODE UI**.

Optional tiny inline SVG icons if desired:

```text
collection
shelf
library
back
volume-on
volume-off
```

Do not add an icon library dependency solely for these six shapes.

Missing collectible silhouettes should be derived from the real collectible texture using tint/alpha/blur/mask treatment rather than separately generated silhouette art.

---

# 5. Runtime FX — code-generated, no art production block

Generate/reuse simple textures at runtime where practical:

- soft radial rarity glow;
- sparkle particle;
- ring/outline pulse;
- small light flash from pouch;
- scan/glitch treatment for SIGNAL LOCK;
- completion sparkle burst.

Status: **RUNTIME-GENERATED**.

Do not create four baked rarity animation sequences.

If one tiny reusable soft-gradient texture materially simplifies Phaser rendering, it may be added later; it is not an art milestone.

---

# 6. Audio — 12 short SFX, no music

Use short compressed files, preferably MP3 for broad browser support.

Target total audio payload: **well under ~1.5 MB**.

| Suggested path | Event | Status |
|---|---|---|
| `assets/audio/tear.mp3` | tear completion | TO PRODUCE |
| `assets/audio/reveal-pop.mp3` | gadget emergence/pop | TO PRODUCE |
| `assets/audio/rarity-common.mp3` | Common settle/chime | TO PRODUCE |
| `assets/audio/rarity-rare.mp3` | Rare chime | TO PRODUCE |
| `assets/audio/rarity-epic.mp3` | Epic chime | TO PRODUCE |
| `assets/audio/rarity-legendary.mp3` | Legendary jackpot chime | TO PRODUCE |
| `assets/audio/duplicate.mp3` | duplicate resolution tick | TO PRODUCE |
| `assets/audio/signal-gain.mp3` | Signal increment | TO PRODUCE |
| `assets/audio/signal-lock.mp3` | meter reaches 100 / armed | TO PRODUCE |
| `assets/audio/hidden-pocket.mp3` | pouch second-beat cue | TO PRODUCE |
| `assets/audio/secret-reveal.mp3` | Secret reveal | TO PRODUCE |
| `assets/audio/collection-complete.mp3` | first standard 8/8 celebration | TO PRODUCE |

Reusing/pitching one base sound is acceptable if it still creates a clear rarity hierarchy.

No background music asset in first probe.

---

# 7. Localization resources — bundled code assets

Use typed dictionaries, not network-loaded localization files.

Suggested paths:

```text
src/i18n/en.ts
src/i18n/ru.ts
```

Minimum localized strings:

- NEW;
- DUPLICATE;
- Common;
- Rare;
- Epic;
- Legendary;
- Secret;
- SIGNAL LOCK;
- Collection;
- Shelf;
- Library;
- Open next;
- Open more;
- Back;
- Standard Collection;
- Secrets;
- Camera;
- Flip Phone;
- mute accessibility label if exposed to DOM/shell.

Unsupported platform language → EN fallback.

---

# 8. Store visual assets

Official dimensions must be re-checked immediately before upload.

## Required creative masters

| Deliverable | Size | Format | Status |
|---|---:|---|---|
| Catalog icon | 512×512 | PNG | TO PRODUCE |
| Catalog cover | 800×470 | PNG | TO PRODUCE |
| Maskable icon | 512×512 | PNG | OPTIONAL but cheap if icon is already layered |
| Hero image | 1560×520 | PNG/JPG | OPTIONAL |

Locked creative simplification:

> **No localized title text baked into icon, cover or hero image for the first probe.**

Reason:

- same visual file can serve RU + EN;
- avoids cross-language title mismatch;
- object hook is stronger at small size than text.

### Icon composition

- partly torn silver/lavender Mystery Pouch;
- bright Camera emerging;
- strong `?` cue;
- simple, high contrast, readable at tiny size.

### Cover composition

- Mystery Pouch;
- Camera + Flip Phone;
- visible material/rarity desirability;
- cozy Y2K background;
- no fake Yandex UI/badges.

---

# 9. Store screenshots — 8 minimum localized captures

Yandex requires at least **2 screenshots for each selected platform**. Because the game declares RU + EN and screenshots contain localized UI, prepare separate language sets.

## RU

Desktop:

1. active tear/reveal;
2. Collection Shelf or Library.

Mobile landscape:

1. active tear/reveal;
2. Collection Shelf or Library.

## EN

Repeat the same four compositions with EN UI.

Total required planned set:

> **8 screenshots**

Format requirements:

- landscape 16:9;
- long side 1280–2560 px;
- JPEG or 24-bit PNG;
- real gameplay presentation.

Optional: add a third Library-focused screenshot per platform/language after required captures are done.

---

# 10. Store text assets — RU + EN

Not image files, but required release assets.

For each selected language prepare:

- title ≤ 50 chars;
- SEO description 50–160 chars;
- description 100–1000 chars;
- short description ≤ 70 chars;
- How to play 100–1000 chars.

Current title candidates:

```text
RU: Мистери Гаджеты: Ретро Распаковка
EN: Mystery Pocket Tech
```

Final uniqueness must be checked in the Yandex Games Console before submission.

Also prepare:

- age rating selection;
- categories;
- tags;
- lowercase comma-separated keywords ≤ 100 chars;
- developer comment explaining intentional no-monetization first release and any non-standard save notes if needed.

---

# 11. Asset size/performance budget

These are internal targets, not Yandex limits.

## Runtime payload targets

- each collectible WebP: ideally **~150–350 KB**, investigate if >500 KB;
- all 10 collectible files: preferably **≤4 MB** total;
- three pouch layers combined: preferably **≤750 KB**;
- each scene background layer: preferably **≤1 MB encoded**;
- all SFX: preferably **≤1.5 MB**;
- total first-probe production build target: preferably **≤15 MB** before ZIP compression, and comfortably below Yandex's 100 MB uncompressed limit.

Do not sacrifice visible alpha-edge quality merely to hit an arbitrary micro-budget; these targets are to catch accidental bloat.

## GPU/memory sanity

Ten 1024×1024 RGBA collectible textures decode to roughly 40 MB before renderer overhead. This is acceptable for the tiny scene count, but do not duplicate the textures into separate reveal/shelf copies.

If mobile profiling shows pressure, derive 768/512 runtime variants from the saved source masters rather than regenerating art.

---

# 12. Final count

## Bespoke runtime visual files

- 10 collectibles;
- 3 pouch layers;
- 1 opening background;
- 2 collection environment layers.

Total:

> **16 required bespoke runtime image files**

## Audio

> **12 short SFX**

## Store creatives

Required:

- 1 icon;
- 1 cover;
- 8 localized screenshots.

Optional:

- 1 maskable icon;
- 1 hero image;
- additional screenshots/video after validation.

This is the complete first-probe asset commitment. Anything beyond this list needs an explicit reason.