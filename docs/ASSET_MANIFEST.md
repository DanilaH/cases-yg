# Asset manifest

This manifest records the **actual current runtime asset state** plus the deferred public content factory.

The executable collectible processing manifest remains `assets-src/collectibles.manifest.json`; production commands/constraints remain in `docs/ASSET_PIPELINE.md`.

---

# 1. Current collectible art — INTEGRATED

Runtime contract:

- transparent WebP;
- 1024×1024;
- consistent framing/margins;
- no baked reveal glow/particles/drop shadow;
- same asset reused for reveal, Shelf and Library.

Integrated files:

```text
public/assets/collectibles/camera-common.webp
public/assets/collectibles/camera-rare.webp
public/assets/collectibles/camera-epic.webp
public/assets/collectibles/camera-legendary.webp
public/assets/collectibles/camera-secret-cosmic.webp

public/assets/collectibles/flip-phone-common.webp
public/assets/collectibles/flip-phone-rare.webp
public/assets/collectibles/flip-phone-epic.webp
public/assets/collectibles/flip-phone-legendary.webp
public/assets/collectibles/flip-phone-secret-noir.webp
```

All ten are enabled in runtime.

Per-family source workflow remains:

```text
6–10 explorations
→ contact sheet
→ canonical master
→ prompt/revision log
→ Common / Rare / Epic / Legendary
→ Secret where planned
```

---

# 2. Mystery Pouch — INTEGRATED

Canonical visual reference:

`docs/assets/package-mystery-pouch-v1.webp`

Runtime mapping:

```text
public/assets/package/pouch-body.webp
public/assets/package/pouch-tear-strip-compact.webp
public/assets/package/pouch-star-tab.webp
```

The source/original full strip also exists as:

```text
public/assets/package/pouch-tear-strip.webp
```

but runtime uses the compact authored strip.

### Current pouch contract

The old requirement that all three layers share one identical untrimmed transparent canvas/origin is obsolete.

Accepted implementation uses independent reviewed transforms:

- body owns main silhouette;
- compact tear strip trims transparent padding while preserving authored art;
- star tab has independent placement/scale + generous hit area;
- runtime owns shadow/highlight/motion;
- no synthetic dark slit/mouth.

---

# 3. Environment art — INTEGRATED

```text
public/assets/backgrounds/opening-bg.webp
public/assets/backgrounds/collection-bg.webp
public/assets/backgrounds/collection-foreground.webp
```

Opening uses cover scaling. Collection rear + foreground are an aligned pair; foreground is Shelf-only and remains below Collection chrome.

---

# 4. Audio — INTEGRATED

Current reviewed SFX:

```text
public/assets/audio/tear.mp3
public/assets/audio/reveal-pop.mp3
public/assets/audio/rarity-common.mp3
public/assets/audio/rarity-rare.mp3
public/assets/audio/rarity-epic.mp3
public/assets/audio/rarity-legendary.mp3
public/assets/audio/duplicate.mp3
public/assets/audio/signal-gain.mp3
public/assets/audio/signal-lock.mp3
public/assets/audio/hidden-pocket.mp3
public/assets/audio/secret-reveal.mp3
public/assets/audio/collection-complete.mp3
```

No background music requirement.

Lite V2 currently reuses this set. Dedicated `chips-collect` / `charged-ready` cues are **not implemented and not required unless repeated hands-on identifies a real sound-feedback gap**.

---

# 5. Lite V2 UI / economy visuals — INTEGRATED WITHOUT NEW RASTERS

The earlier plan allowed one CHIPS raster asset, but runtime review showed it was unnecessary.

## 5.1 CHIPS token — PHASER-RENDERED

`src/game/ui/openingEconomyVisuals.ts` defines a reusable bounded chip/token identity from Phaser shapes.

It is reused for:

- CHIPS HUD identity/payout language;
- ordinary reward bursts;
- token flight;
- duplicate recycle;
- Cache / Big / Mega presentation.

No `public/assets/ui/chip-token.webp` is required in the current runtime.

The visual token count never equals economic amount. Large payouts use a bounded number of token instances + text/counter/FX emphasis.

## 5.2 Cache tiers — NO EXTRA IMAGE ASSETS

Cache magnitude uses the same CHIPS identity plus runtime amount/burst emphasis.

```text
0 cache-tier raster assets
```

Do not add separate `cache`, `big-cache`, `mega-cache` token images without evidence that runtime presentation is insufficient.

## 5.3 Charged Pouch — SAME POUCH ART + RUNTIME TREATMENT

Charged does not use a second pouch raster set.

Runtime differentiation comes from Phaser-rendered:

- glow;
- rings;
- sparks;
- lavender/cyan accent;
- selector/cost/ready state;
- stronger reward profile/presentation.

This is visually integrated and passed exact-revision review. Add bespoke Charged pouch art only if later hands-on/content work proves the current treatment inadequate.

## 5.4 Signal meter — RUNTIME UI

Segmented Signal/lock/waiting presentation is Text/Graphics-driven. No raster pack is required.

---

# 6. Current runtime UI / FX inventory

Phaser Graphics/Text + existing assets cover:

- Collection navigation;
- Shelf / Library switch;
- Back / Open More;
- mute;
- CHIPS HUD;
- Basic/Charged selector + affordability;
- Charged aura/ready state;
- 4-segment Signal meter;
- `SIGNAL LOCK · CHARGED`;
- rarity labels;
- NEW / DUPLICATE / RECYCLED;
- cache callouts;
- Secret `???`;
- progress counters;
- tear cue;
- dev/debug controls excluded from production UI.

Runtime FX include:

- rarity glow/flash/rings/sparkles;
- reveal backdrop separation;
- ambient particles;
- reward breathing;
- Signal fill/lock feedback;
- CHIPS token burst/flight;
- cache intensity scaling;
- Charged aura;
- Charged-ready milestone;
- completion burst.

---

# 7. Collectible processing / atlas policy

Canonical runtime remains one individual 1024×1024 WebP per collectible.

Pipeline:

```text
raw generated source
→ conservative background removal when needed
→ trim
→ normalized transparent canvas
→ WebP export
→ alpha/dimension/padding validation
→ optional Phaser atlas build artifact
```

Atlas generation remains profiling/inspection tooling, not an automatic runtime migration.

---

# 8. Public release content factory — DEFERRED UNTIL HANDS-ON + YANDEX DRAFT

Each future family normally adds:

```text
4 standard runtime collectible assets
+ 0..N Secrets according to content plan
+ canonical source master/contact sheet/log
```

Rules:

- recognizable Y2K archetype;
- 6–10 explorations;
- one master;
- rarity edits preserve geometry/camera/identity;
- runtime 1024 WebP alpha target;
- no baked reveal FX;
- no brand/logo/unnecessary 1:1 copy.

Candidate families:

- MP3 player;
- pager;
- mini camcorder;
- handheld console;
- PDA;
- portable disc/MiniDisc-like player;
- pocket radio;
- virtual-pet-like electronics;
- further researched Y2K devices.

Content should be grouped into themed Drops/loot pools rather than one global pool.

---

# 9. Release asset-loading implication

Current catalog can preload all reviewed assets.

A multi-Drop release may contain dozens of 1024 textures, so only after real expansion:

- profile decoded texture memory on real mobile;
- compare individual textures against family/Drop atlas residency;
- choose grouped/on-demand loading if measurements require it;
- derive smaller thumbnail/runtime variants if useful.

Do not build speculative streaming infrastructure before those measurements.

---

# 10. Store assets — PUBLIC RELEASE ONLY

Produce after expanded release content/key visual stabilize. Re-check Yandex requirements immediately before upload.

Do not build final promo art around the current two-family private catalog.

---

# 11. Performance targets

Useful current guardrails:

- collectible WebP ideally ~150–350 KB; investigate >500 KB;
- pouch layers compact;
- scene background around/below ~1 MB where quality permits;
- SFX set small;
- Phaser CHIPS/Charged visuals add no meaningful download burden.

For release, optimize from measured startup/download/GPU-memory behavior instead of an arbitrary speculative total budget.
