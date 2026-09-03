# Asset manifest

This manifest has two scopes:

1. **Internal vertical slice** — the concrete Camera + Flip Phone assets needed now.
2. **Public release expansion** — a repeatable per-family asset factory; exact final count depends on the launch roster.

The internal slice is not submitted publicly, so final store creatives are not a slice blocker.

The executable collectible processing manifest lives at `assets-src/collectibles.manifest.json`; production commands and constraints are documented in `docs/ASSET_PIPELINE.md`.

---

# 1. Internal slice collectible art — 10 runtime assets

Runtime target:

- transparent WebP;
- 1024×1024;
- consistent framing/margins;
- no baked reveal glow/particles/drop shadow;
- same asset reused for reveal, Shelf and Library.

Generation/source target: ~1536×1536 where practical; never accept a final source below 1024×1024. Raw generated art may arrive on a clean smooth background; accepted runtime output must have clean alpha.

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

Runtime URLs remain `assets/collectibles/...` because Vite serves `public/` as the web root.

After an export is reviewed, enable its collectible id in `AVAILABLE_COLLECTIBLE_ART_IDS` in `src/game/data/artAssets.ts`. Until then the procedural item remains the fallback.

Per family working material:

```text
6–10 explorations
1 contact sheet
1 canonical master
prompt/revision log
4 standard rarity derivations
Secret derivation where planned
```

### Flip Phone slice family — locked

```text
Common     solid glossy pink
Rare       translucent/frosted pink
Epic       pearlescent/iridescent pink
Legendary  clear shell + visible circuitry/internals
Secret     Noir / Monochrome Edition
```

The Secret uses smoked/piano black + silver/chrome + monochrome Saturn-heart screen language and sits outside the standard material ladder.

---

# 2. Mystery Pouch — 3 runtime layers

Existing visual reference:

`docs/assets/package-mystery-pouch-v1.webp`

Required runtime files:

```text
public/assets/package/pouch-body.webp
public/assets/package/pouch-tear-strip.webp
public/assets/package/pouch-star-tab.webp
```

**Layer export contract:**

- all three WebPs use the **same transparent canvas dimensions**;
- all three are exported from the exact same registration/origin — no per-layer trim, crop, resize or re-centering;
- body contains only the persistent pouch body;
- tear-strip contains only the detachable top strip/tear-line art;
- star-tab contains only the movable star/tab art;
- do not bake an external drop shadow into these layers; runtime owns the grounding shadow;
- the runtime applies one shared scale to the aligned canvas, then translates the tab and strip containers independently.

This common-canvas contract is what lets a new reviewed pouch set drop in without changing interaction math. The slit/light remains runtime-generated.

Enable reviewed layers individually through `AVAILABLE_STATIC_ART_IDS` in `src/game/data/artAssets.ts`. Missing layers continue using procedural fallback.

---

# 3. Internal scene/environment art — 3 runtime assets

```text
public/assets/backgrounds/opening-bg.webp
public/assets/backgrounds/collection-bg.webp
public/assets/backgrounds/collection-foreground.webp
```

Opening background: center-safe, decorative sides may crop. Runtime uses cover scaling across supported landscape ratios.

Collection rear + foreground should be authored as an aligned pair so items feel placed inside a Y2K desk/shelf environment rather than pasted over one image. The foreground is a transparent **Shelf-only** depth layer and should keep the upper title/tab area transparent; it is rendered above Shelf collectibles but below Collection chrome. Library intentionally does not use this foreground so catalog cards cannot be obscured by shelf furniture/decor.

Enable reviewed environment layers through `AVAILABLE_STATIC_ART_IDS`.

The slice environment may be composed for two hero items, but do not make final release architecture dependent on only two fixed slots. The release Collection environment/grouping may change after the public family count is chosen.

---

# 4. UI / FX

Prefer Phaser Graphics/Text and tiny custom SVG/path icons rather than a generated raster UI pack.

Needed now:

- Collection navigation;
- Shelf / Library switch;
- Back / Open More;
- mute;
- Signal LCD;
- rarity labels;
- NEW / duplicate;
- Secret `???`;
- slice progress counters;
- tear gesture cue;
- dev/debug controls, including ad tests, excluded from production UI.

Runtime FX:

- rarity glow;
- radial pouch flash;
- sparkles;
- ring pulse;
- SIGNAL LOCK scan/glitch;
- completion burst.

---

# 5. Audio — internal slice

Final SFX paths:

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

Enable reviewed cues in `AVAILABLE_SFX_CUES` in `src/game/data/audioAssets.ts`. Enabled samples are prefetched/decoded before game ready and replace the synthesized cue one by one. Missing or failed samples retain the synth fallback, so integrating final sound does not require changing scene code.

No background music requirement. Reuse/pitch base sounds where quality remains good.

---

# 6. Internal-slice asset count

Bespoke runtime image files:

```text
10 collectibles
3 pouch layers
1 opening background
2 collection environment layers
= 16 images
```

Plus ~12 short SFX.

This is the complete **Phase 1 asset commitment**, not the final public-game content commitment.

No final icon/cover/localized store screenshots are required before internal review.

---

# 7. Collectible processing / atlas policy

Canonical slice runtime remains **one individual 1024×1024 WebP per collectible**.

Project tooling now supports:

```text
raw generated source
→ conservative background removal when needed
→ trim
→ normalized transparent canvas
→ WebP export
→ alpha/dimension/padding validation
→ optional Phaser atlas build artifact
```

Commands are documented in `docs/ASSET_PIPELINE.md`.

Atlas generation does **not** imply an immediate runtime migration. The optional atlas is used to measure packed dimensions/weight and prove the pipeline. A public build may later choose per-family/group atlases or individual/on-demand textures based on real mobile profiling.

---

# 8. Public release content factory

After slice approval, each new base family normally adds:

```text
4 standard runtime collectible assets
+ 0..N Secrets according to release content plan
+ one canonical source master/contact sheet/log
```

The same rules apply:

- recognizable Y2K archetype;
- 6–10 explorations;
- one master;
- rarity edits preserve geometry/camera/identity;
- runtime 1024 WebP alpha target;
- no baked reveal FX;
- no brand/logo/1:1 copy.

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

Exact final number is open; update this manifest when the release roster is locked.

---

# 9. Release asset-loading implication

The slice can preload all reviewed slice assets because the pool is tiny.

A 10–24+ family release may contain 40–100+ collectible textures, so do not assume the same preload strategy scales.

Before release:

- profile mobile decoded texture memory with the **real** expanded catalog;
- compare individual textures against family/group atlas residency rather than assuming atlases are automatically better;
- choose grouped/on-demand loading if profiling requires it;
- derive 512/768 thumbnail/runtime variants from source masters if useful;
- keep currently needed Opening/Collection transitions fast and avoid user-visible asset waits.

Do not build speculative streaming infrastructure before real asset dimensions/counts can be profiled.

---

# 10. Store assets — PUBLIC RELEASE ONLY

Produce only after expanded release content and key visual are stable.

Current Yandex-targeted deliverables to re-check before upload:

- icon 512×512 PNG;
- cover 800×470 PNG;
- optional maskable icon 512×512;
- optional hero 1560×520;
- actual gameplay screenshots for each selected platform/language.

Do not build final promo art around the two-family slice if the public game will contain a materially larger catalog.

Prefer object-led creatives without baked localized title text unless final marketing evidence says otherwise.

---

# 11. Store text — PUBLIC RELEASE ONLY

Prepare RU + EN after final title/content structure is chosen:

- title;
- SEO description;
- description;
- short description;
- How to play;
- categories/tags/keywords;
- age/platform settings.

The internal slice can use working names only.

---

# 12. Performance targets

Internal slice targets remain useful for catching bloat:

- collectible WebP ideally ~150–350 KB; investigate >500 KB;
- 10 slice collectibles preferably ≤4 MB encoded total;
- pouch layers preferably ≤750 KB combined;
- scene background layer preferably around/below ~1 MB encoded when quality permits;
- SFX preferably ≤1.5 MB total.

For the release, replace a fixed total-build micro-budget with profiling:

- Yandex archive limit;
- startup download time;
- decoded GPU texture memory on real mobile;
- cache/lazy-load behavior.

Do not sacrifice visible asset quality merely to hit an arbitrary number; do prevent accidental multiplication of 1024 textures in memory.
