# Asset manifest

This manifest separates three scopes:

1. **Integrated current runtime assets** — already present in the two-family build.
2. **Gameplay Loop Lite V2 additions** — the minimal new visual/audio assets required by the agreed loop.
3. **Public content expansion** — repeatable per-family production after Lite V2 + Yandex DRAFT validation.

The executable collectible processing manifest remains `assets-src/collectibles.manifest.json`; production commands and constraints remain in `docs/ASSET_PIPELINE.md`.

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

All ten are enabled in the current runtime art allowlist.

Per-family source workflow remains:

```text
6–10 explorations
1 contact sheet
1 canonical master
prompt/revision log
4 standard rarity derivations
Secret derivation where planned
```

---

# 2. Current Mystery Pouch — INTEGRATED

Canonical visual reference remains:

`docs/assets/package-mystery-pouch-v1.webp`

Current runtime mapping is:

```text
public/assets/package/pouch-body.webp
public/assets/package/pouch-tear-strip-compact.webp   # actual runtime tear strip
public/assets/package/pouch-star-tab.webp
```

The source/original full strip also exists as:

```text
public/assets/package/pouch-tear-strip.webp
```

but runtime `pouch-tear-strip` resolves to the compact authored crop.

### Current pouch contract — IMPORTANT

The old documentation requirement that all three runtime layers must share the exact same untrimmed transparent canvas is **obsolete**.

The accepted implementation intentionally uses independent presentation transforms:

- body has its own placement/scale;
- compact authored tear strip preserves the real top-strip art but trims transparent padding;
- star-tab has its own placement/scale and generous interaction hit area;
- runtime owns shadow, tear-edge highlights and motion;
- layers are composed by reviewed presentation coordinates, not by a mandatory shared-canvas origin.

Do not restore the old same-canvas rule or the rejected synthetic dark slit/mouth.

---

# 3. Current environment art — INTEGRATED

```text
public/assets/backgrounds/opening-bg.webp
public/assets/backgrounds/collection-bg.webp
public/assets/backgrounds/collection-foreground.webp
```

Opening background uses cover scaling. Collection rear + foreground are an aligned pair; foreground is Shelf-only and remains below Collection chrome.

---

# 4. Current audio — INTEGRATED

Current SFX paths:

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

---

# 5. Gameplay Loop Lite V2 — NEW ASSET COMMITMENT

Lite V2 should add as little bespoke art as possible.

## 5.1 CHIPS token/icon — REQUIRED

One reusable visual identity for CHIPS is required for:

- CHIPS HUD counter;
- token burst from pouch;
- token flight into HUD;
- duplicate recycle payout;
- Charged affordability/ready UI.

Preferred asset:

```text
public/assets/ui/chip-token.webp
```

Target guidance:

- transparent square canvas;
- 256×256 is sufficient; no need for collectible-scale 1024 source at runtime;
- strong silhouette at ~18–32 px HUD size;
- readable as a tiny Y2K electronic chip/token, not a generic gold coin;
- no baked text/value;
- restrained lavender/cyan/silver family so it belongs to the existing UI;
- usable both as one HUD icon and as many small reward particles.

A reviewed vector/SVG/Phaser-shape implementation is also acceptable if it looks as good; do not generate a whole UI sprite pack for one token.

## 5.2 Charged Pouch — NO NEW RASTER SET REQUIRED FOR LITE

Do **not** create a second body/strip/star art set by default.

Lite target:

- reuse current pouch layers;
- distinguish Charged using runtime glow/electric halo/accent/ring/label treatment;
- stronger reveal anticipation/FX;
- add bespoke Charged pouch raster art only if visual review proves runtime treatment cannot communicate the state.

This keeps the gameplay experiment cheap and avoids duplicating the most fragile pouch asset pipeline.

## 5.3 Signal meter — RUNTIME UI

The new 4-segment Signal presentation should be Phaser Graphics/Text/vector-first.

Needed presentation:

```text
◇ ◇ ◇ ◇
◆ ◇ ◇ ◇
...
◆ ◆ ◆ ◆  → SIGNAL LOCK
```

No raster asset pack required unless later visual polish demonstrates a clear need.

## 5.4 Lite V2 SFX — MINIMAL

Existing cues should be reused wherever they remain semantically good:

- `duplicate.mp3` can support the duplicate/recycle identification beat;
- `signal-gain.mp3` / `signal-lock.mp3` can remain if they suit the new segmented presentation;
- existing tear/reveal/rarity/Hidden Pocket cues remain.

Potential new cues, only if existing/re-pitched cues are insufficient:

```text
public/assets/audio/chips-collect.mp3
public/assets/audio/charged-ready.mp3
```

Jobs:

- `chips-collect`: concise multi-token collect/transfer sound as tokens hit the wallet;
- `charged-ready`: short satisfying readiness sting when wallet crosses the Charged threshold.

Do not add separate sounds for every chip particle, Basic payout tier or Charged button state.

---

# 6. Lite V2 asset count impact

Required new bespoke runtime image commitment:

```text
1 CHIPS token/icon
```

Optional only if runtime reuse is insufficient:

```text
0..2 concise SFX
0 Charged pouch raster layers by default
```

This is intentional. The gameplay loop should earn its complexity through behavior/presentation, not a new asset-production branch.

---

# 7. Runtime UI / FX inventory after Lite V2

Prefer Phaser Graphics/Text and reusable existing assets for:

- Collection navigation;
- Shelf / Library switch;
- Back / Open More;
- mute;
- CHIPS HUD;
- Charged affordability/ready state;
- 4-segment Signal meter;
- rarity labels;
- NEW / DUPLICATE / RECYCLED;
- Secret `???`;
- progress counters;
- tear gesture cue;
- dev/debug controls excluded from production UI.

Runtime FX now include:

- rarity glow;
- radial pouch flash;
- sparkles;
- ring pulse;
- ambient particles;
- reward breathing;
- Signal fill/lock feedback;
- CHIPS token burst/flight;
- Charged runtime accent/ready feedback;
- completion burst.

---

# 8. Collectible processing / atlas policy

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

# 9. Public release content factory

After Lite V2 + hosted Yandex validation, each new family normally adds:

```text
4 standard runtime collectible assets
+ 0..N Secrets according to content plan
+ canonical source master/contact sheet/log
```

Rules remain:

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

Content should be grouped into themed Drops/loot pools rather than one global pool.

---

# 10. Release asset-loading implication

The current catalog can preload all reviewed production assets.

A multi-Drop release may contain dozens of 1024 textures, so before release:

- profile decoded texture memory on real mobile;
- compare individual textures against family/Drop atlas residency;
- choose grouped/on-demand loading if profiling requires it;
- derive smaller thumbnail/runtime variants if useful;
- keep Opening ↔ current Collection transitions fast.

Do not build speculative streaming infrastructure before real expanded catalog measurements.

---

# 11. Store assets — PUBLIC RELEASE ONLY

Produce only after expanded release content/key visual are stable.

Re-check Yandex requirements immediately before upload. Current planning targets remain:

- icon 512×512 PNG;
- cover 800×470 PNG;
- optional maskable icon 512×512;
- optional hero 1560×520;
- actual localized gameplay screenshots.

Do not build final promo art around the two-family internal catalog.

---

# 12. Performance targets

Current small-build targets remain useful for catching accidental bloat:

- collectible WebP ideally ~150–350 KB; investigate >500 KB;
- pouch layers should remain compact;
- scene background layer around/below ~1 MB where quality permits;
- SFX set should remain small.

The Lite CHIPS token should be tiny relative to collectible assets and must not materially affect load time.

For release, profile startup download time, Yandex archive limits, decoded GPU texture memory and grouped/lazy behavior rather than enforcing an arbitrary total asset budget.
