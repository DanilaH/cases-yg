# Asset manifest

This manifest has two scopes:

1. **Internal vertical slice** — the concrete Camera + Flip Phone assets needed now.
2. **Public release expansion** — a repeatable per-family asset factory; exact final count depends on the launch roster.

The internal slice is not submitted publicly, so final store creatives are not a slice blocker.

---

# 1. Internal slice collectible art — 10 runtime assets

Runtime target:

- transparent WebP;
- ~1024×1024;
- consistent framing/margins;
- no baked reveal glow/particles/drop shadow;
- same asset reused for reveal, Shelf and Library.

Source master target: ~1536×1536 transparent where practical; never accept a final source below 1024×1024.

```text
assets/collectibles/camera-common.webp
assets/collectibles/camera-rare.webp
assets/collectibles/camera-epic.webp
assets/collectibles/camera-legendary.webp
assets/collectibles/camera-secret-cosmic.webp

assets/collectibles/flip-phone-common.webp
assets/collectibles/flip-phone-rare.webp
assets/collectibles/flip-phone-epic.webp
assets/collectibles/flip-phone-legendary.webp
assets/collectibles/flip-phone-secret-music.webp
```

Per family working material:

```text
6–10 explorations
1 contact sheet
1 canonical master
prompt/revision log
4 standard rarity derivations
Secret derivation where planned
```

---

# 2. Mystery Pouch — 3 runtime layers

Existing visual reference:

`docs/assets/package-mystery-pouch-v1.webp`

Required aligned runtime layers:

```text
assets/package/pouch-body.webp
assets/package/pouch-tear-strip.webp
assets/package/pouch-star-tab.webp
```

The slit/light is runtime-generated. Keep pivots/canvas alignment consistent so tab/strip can animate independently.

---

# 3. Internal scene/environment art — 3 runtime assets

```text
assets/backgrounds/opening-bg.webp
assets/backgrounds/collection-bg.webp
assets/backgrounds/collection-foreground.webp
```

Opening background: center-safe, decorative sides may crop.

Collection: rear + foreground depth layer so items feel placed inside a Y2K desk/shelf environment rather than pasted over one image.

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

Current SFX set:

```text
tear.mp3
reveal-pop.mp3
rarity-common.mp3
rarity-rare.mp3
rarity-epic.mp3
rarity-legendary.mp3
duplicate.mp3
signal-gain.mp3
signal-lock.mp3
hidden-pocket.mp3
secret-reveal.mp3
collection-complete.mp3
```

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

# 7. Public release content factory

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

# 8. Release asset-loading implication

The slice can preload all 10 collectibles.

A 10–24+ family release may contain 40–100+ collectible textures, so do not assume the same preload strategy scales.

Before release:

- profile mobile decoded texture memory;
- consider grouped/on-demand family loading;
- derive 512/768 thumbnail/runtime variants from source masters if useful;
- keep currently needed Opening/Collection transitions fast and avoid user-visible asset waits.

---

# 9. Store assets — PUBLIC RELEASE ONLY

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

# 10. Store text — PUBLIC RELEASE ONLY

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

# 11. Performance targets

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
