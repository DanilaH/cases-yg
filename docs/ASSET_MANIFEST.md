# Asset manifest

This manifest records the **actual current runtime asset state**, the evidence-backed Opening Feel Correction asset impact, and the deferred public content factory.

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

Runtime mapping:

```text
public/assets/package/pouch-body.webp
public/assets/package/pouch-tear-strip-compact.webp
public/assets/package/pouch-star-tab.webp
```

The source/original full strip also exists as `public/assets/package/pouch-tear-strip.webp`, but runtime uses the compact authored strip.

Accepted contract:

- independent reviewed transforms;
- body owns main silhouette;
- compact tear strip preserves authored art while trimming transparent padding;
- star tab has independent placement/scale + generous hit area;
- runtime owns shadow/highlight/motion;
- no synthetic dark slit/mouth.

Opening Feel Correction keeps this geometry and interaction contract.

---

# 3. Environment art — INTEGRATED

```text
public/assets/backgrounds/opening-bg.webp
public/assets/backgrounds/collection-bg.webp
public/assets/backgrounds/collection-foreground.webp
```

No environment redesign was part of the correction.

---

# 4. Audio

## Current integrated reviewed MP3 SFX

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

## Opening feel tactile cues — INTEGRATED AS SYNTH

Hands-on identified two tactile audio needs that are currently satisfied through the existing Web Audio controller without requiring new reviewed MP3 files.

Current contract:

- `chip-clack` is the short dry/percussive CHIPS-banking cue; audio density is throttled independently of the exact visual chip count;
- `pouch-grab` is a short plastic/zip-like pop on star grab;
- `src/game/data/audioAssets.ts` reserves possible `assets/audio/chip-clack.mp3` and `assets/audio/pouch-grab.mp3` paths, but synth-only cues remain absent from the available/preloaded MP3 manifest while those files do not exist;
- runtime therefore does not fetch missing MP3s for either cue;
- exact browser audits around the post-hands-on feel polish confirmed no missing `pouch-grab.mp3` request and no failed asset requests.

A reviewed physical sample may replace either synth later only if hands-on proves the current sound quality insufficient. `charged-ready.mp3` remains optional only; do not add it unless wallet count-up + CHIPS cue + Charged UI activation still fail the threshold moment.

---

# 5. Current Lite V2 UI/economy visuals — INTEGRATED

## CHIPS token

`src/game/ui/openingEconomyVisuals.ts` defines a reusable Phaser-rendered chip/token identity.

It is reused for HUD, payout, token flight, recycle and cache presentation. No CHIPS raster is currently required.

Visible token count is symbolic/bounded, never the economic amount.

## Signal

Segmented Signal/lock/waiting UI is Text/Graphics-driven. No raster pack is required.

## Charged

Current Charged uses the same pouch art with Phaser glow/rings/sparks/lavender-cyan accents.

The merged correction strengthens runtime differentiation, and the label-hidden r3 audit passed without new raster art.

---

# 6. Opening Feel Correction — INTEGRATED VISUAL ASSET IMPACT

Canonical behavior: `OPENING_FEEL_CORRECTION_SCOPE.md`.

## 6.1 Digital/pixel accent font — INTEGRATED

Current runtime bundles **Press Start 2P** through `@fontsource/press-start-2p` (`OFL-1.1`). It is used only for short electronic UI such as CHIPS/Signal/Charged system data; long instructions/navigation/body copy remain readable sans. Exact-revision 900/1024 RU/EN samples passed manual review.

## 6.2 Neon/glow/shimmer — RUNTIME FIRST

No bespoke raster pack is required for:

- CHIPS glow;
- Signal electronic pulse/glitch;
- Charged aura/contour/highlight;
- rarity shimmer hierarchy;
- button hover/press/selected feedback.

Use Phaser Text/Graphics, translucent duplicate layers, tint, blend, moving highlights, rings/sparks and tweens.

## 6.3 Custom shaders — NOT PART OF CURRENT PASS

No WebGL shader was added for the neon/iridescent correction.

Reason: the visual hypothesis was proved cheaply without creating a new mobile/WebGL compatibility surface.

A single local shader may be reconsidered later only if a reviewed no-shader result proves a specific effect cannot be sold convincingly.

## 6.4 Charged pouch raster fallback — NOT REQUIRED NOW

Default: reuse current pouch assets with much stronger runtime cyan/violet/iridescent treatment.

The label-hidden r3 audit passed with runtime treatment, so no recolored Charged pouch asset variant is required now. Re-open only if later hands-on contradicts that evidence.

Fallback constraints:

- exact same silhouette/geometry;
- same tear strip/tab mechanics;
- material/color treatment only;
- no new pouch redesign pipeline.

---

# 7. Corrected runtime UI / FX — CURRENT

The merged correction is implemented mostly with runtime primitives:

- larger CHIPS card + animated count-up;
- local CHIPS HUD punch/shake/glow;
- staged reward tray near hero with single-entry continuity into the later result panel;
- sequential CHIPS bank trajectories;
- Signal fragment flight + destination pulse;
- Basic/Charged left gameplay rail;
- selected/unavailable micro-interactions;
- stronger Charged contour/aura/sweep;
- digital/pixel accent typography;
- Common/Rare/Epic/Legendary escalating shimmer + larger rarity capsule/tinted result border;
- semantic reward-row colors including rarity-aware recycle copy;
- short Signal lock glitch;
- controlled tiny variation in spark/token trajectories.

Do not turn the entire illustrated scene into a fullscreen neon/CRT/VHS effect.

Visual rule:

> **Cozy Y2K world, electric digital UI.**

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

# 9. Public release content factory — DEFERRED

Content expansion remains blocked until corrected hands-on + real Yandex DRAFT pass.

Each future family normally adds:

```text
4 standard runtime collectible assets
+ 0..N Secrets according to content plan
+ canonical source master/contact sheet/log
```

Rules remain recognizable Y2K archetype, 6–10 explorations, one master, rarity edits preserving geometry/identity, runtime 1024 WebP alpha, no baked reveal FX, no unnecessary 1:1 brand copies.

Candidate families remain MP3 player, pager, mini camcorder, handheld console, PDA, portable disc/MiniDisc-like player, pocket radio, virtual-pet-like electronics and further researched Y2K devices.

---

# 10. Release loading / store assets

Current catalog can preload all reviewed assets. Release-scale loading remains a profiling decision after actual content expansion.

Store creative is public-release work only; do not build final promo art around the two-family private catalog.

---

# 11. Performance guardrails

- collectible WebP ideally ~150–350 KB; investigate >500 KB;
- pouch layers compact;
- scene backgrounds around/below ~1 MB where quality permits;
- reviewed MP3 SFX set stays small;
- the locally bundled accent font + synthesized CHIPS cue should not materially affect startup;
- runtime neon/iridescence must be bounded and tested on representative mobile landscape rendering;
- do not add shader/per-particle complexity without measured need.
