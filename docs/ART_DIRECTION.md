# Art direction

## 1. Core visual thesis

Collectibles should feel like:

> **real Y2K device archetypes turned into highly desirable blind-box mini collectibles**

Target: stylized 2D / painted 2.5D. Avoid photoreal product rendering and generic glossy mobile-game 3D.

Priority:

> **gadget identity first → collectible desirability second → kawaii garnish third**

The Opening UI now adds a complementary rule:

> **Cozy Y2K world, electric digital UI.**

The illustrated world/collectibles remain soft, toy-like and nostalgic. CHIPS, Signal, Charged, rarity/system moments and interactive states may carry stronger neon/digital energy.

Hotline Miami is an **energy/reference point only** for bold neon/digital emphasis. Do not copy its full palette, typography density, violence/grit, VHS treatment or overall visual identity.

---

# 2. Shared collectible visual language — LOCKED

- recognizable early-2000s silhouettes;
- front-facing or soft 3/4;
- chunky/softened toyified proportions;
- readable hardware cues;
- candy/translucent plastics;
- pearlescent/iridescent and controlled chrome accents;
- restrained charms/lanyards;
- soft illustrated highlights;
- no logos/model names/unnecessary 1:1 copies.

Within one family, all standard rarity variants preserve core geometry, camera angle and control layout.

---

# 3. Standard rarity grammar — LOCKED

> **Common → Rare → Epic → Legendary**

### Common

Solid/mostly solid candy plastic; simple but already desirable.

### Rare

Translucent/frosted material + restrained premium accent.

### Epic

Pearlescent/iridescent premium surface + richer trim/accessory.

### Legendary

Clear/near-clear shell + stylized visible internals + premium metallic/lens/screen treatment.

Rarity must read in the item itself; runtime glow/particles are presentation, not a substitute for material escalation.

### Runtime rarity emphasis — Opening Feel Correction

The correction may add a matching electronic hierarchy around the existing art:

- Common: restrained glow only;
- Rare: light cyan shimmer;
- Epic: stronger lavender/cyan sweep;
- Legendary: strongest standard iridescent bloom/sweep;
- Secret: remains visually distinct and stronger than the standard ladder.

Do not recolor collectible source art just to create the runtime shimmer.

---

# 4. Secret / Chase rule — LOCKED

Secrets sit outside the standard ladder.

They should feel like special editions/prototypes/strange limited runs rather than “Legendary in another color.”

Allowed:

- roughly 15–25% geometry/detail change;
- signature faceplate/lens/control/accessory theme;
- stronger bespoke identity while remaining recognizable as the family.

Current examples:

- Camera Secret: cold cyan/cosmic translucent edition + Saturn/planet charm;
- Flip Phone Secret: Noir / Monochrome Edition — smoked/piano-black shell, silver/chrome hardware, visible dark internals, monochrome Saturn-heart screen and restrained star/crescent identity marks.

Public release Secret count/distribution is decided with the expanded roster.

---

# 5. Current content / stage

Integrated production catalog:

1. Digital Camera;
2. Flip Phone.

Gameplay Loop Lite V2 is implemented. First repeated hands-on found presentation/input/UI feel issues; the current pass is the bounded `OPENING_FEEL_CORRECTION_SCOPE.md`.

Do not mass-produce new families during this pass.

After corrected hands-on + real Yandex DRAFT validation, resume content production.

Candidate future families remain MP3 player, pager, mini camcorder, handheld console, PDA, portable disc player, pocket radio, virtual-pet-like electronics and other suitable Y2K archetypes.

---

# 6. Drops / themed content grouping

As the catalog grows, families will be grouped into themed Drops/loot pools.

Art implications:

- each Drop may have a loose thematic identity without requiring a separate full UI skin;
- families still belong to one coherent overall product line;
- do not force one palette across a whole Drop;
- rough 3–5-family Drop is a planning heuristic, not a hard art rule.

No player Drop selector is needed before Drop #2 exists.

---

# 7. Family production consistency

For every family:

```text
6–10 exploratory base concepts
→ choose one canonical master
→ freeze silhouette / angle / core controls
→ derive Common / Rare / Epic / Legendary
→ derive Secret only if assigned
```

Batch review checks scale/proportion, painting/shading, detail density, Common attractiveness, Legendary readability, motif repetition and small-size readability.

Do not mass-produce through a known style drift.

---

# 8. Palette / decoration

Do not make the entire catalog pink/violet.

Useful directions include ice blue/silver, mint/cream, bubblegum, translucent orange, smoky graphite/lime, milky white/aqua, metallic cyan, ruby clear, lavender/pearl and clear shell with colored internals.

Charms/stickers/straps are garnish; avoid repeating one motif across the catalog.

---

# 9. Runtime art vs effects

The same transparent collectible export is reused for reveal, Shelf and Library.

Item art encodes material/color/accessory/internals differences.

Keep primarily runtime-only:

- rarity glow/shimmer;
- flash;
- particles;
- ring/outline pulse;
- small camera bump where appropriate;
- NEW/duplicate/recycle labels;
- Signal effects;
- CHIPS token motion;
- Charged pouch electric/iridescent treatment;
- interactive hover/press/selected state;
- digital UI glow.

No fullscreen shader/CRT/VHS treatment in the current correction.

---

# 10. Mystery Pouch — LOCKED GEOMETRY

Canonical reference:

`docs/assets/package-mystery-pouch-v1.webp`

Visual grammar:

- silver foil / anti-static base;
- translucent lavender accents;
- large circular `?`;
- small gadget silhouettes;
- restrained circuit traces;
- star-shaped tear-tab;
- horizontal left-to-right tear line;
- minimal/no baked title text.

Runtime uses body + compact authored tear strip + star tab with independent transforms.

### Basic tactile correction

Keep geometry. Add cheap physical response:

- immediate star grab punch;
- subtle drag/tension reaction;
- short tear recoil/snap;
- no physics.

### Charged treatment — stronger direction

Direct hands-on shows the current aura is not enough by itself.

Default correction:

- preserve exact pouch silhouette/tear interaction;
- stronger cyan/violet electric palette;
- restrained pink/iridescent accents;
- brighter star/seal emphasis;
- stronger contour/aura/rings/sparks;
- moving highlight/holographic-like sweep using runtime rendering.

Acceptance test: hide/ignore the `Basic`/`Charged` labels. Charged should still read immediately.

Only if runtime treatment fails that test may a **recolored Charged pouch raster variant** be produced. Do not redesign geometry.

---

# 11. CHIPS visual identity

CHIPS remain tiny Y2K electronic tokens/components, not fantasy gold coins.

Target:

- tiny readable chip/circuit silhouette;
- silver/lavender/cyan family;
- readable in larger resource card and reward flights;
- no baked numeric value;
- restrained enough not to compete with collectible art.

Current Phaser-rendered token remains valid.

Opening Feel Correction strengthens its **context** rather than replacing it:

- larger CHIPS card;
- bigger digital numeric value;
- count-up;
- local glow/pulse/shake on intake;
- staged CHIPS beside hero before banking.

---

# 12. Digital typography — LOCKED DIRECTION, FONT OPEN

Use one accent digital/pixel-like typeface for short electronic data:

- CHIPS label/numerals;
- Signal label/value/lock;
- Cache/Big/Mega labels where useful;
- selected Charged/system accents where legible.

Keep long instructions, navigation, Collection copy and general UI in clean readable sans.

The exact bundled font remains an implementation visual choice and must be tested at real 900/1024 widths and any RU characters actually needed.

Avoid making the whole game look like a pixel-art title when the collectible/environment art is painted 2D/2.5D.

---

# 13. Neon / iridescence without shaders

Preferred tools:

- duplicate translucent text/shape glow layers;
- stroke/shadow;
- alpha/scale/tint tweens;
- safe blend modes;
- moving translucent highlight strips;
- rings/sparks/particles;
- short cyan/magenta offset flicker for Signal lock;
- controlled iridescent sweep for Charged/rarity moments.

No custom shader in the current pass.

Only reconsider one local shader if a finished no-shader visual audit proves a specific effect cannot be achieved convincingly enough.

---

# 14. UI density / information hierarchy

Opening remains collectible-first.

The new left gameplay rail may contain:

```text
CHIPS
SIGNAL
POUCH selector
```

Do not turn it into a permanent database sidebar.

The player request for exact odds + Drop contents + discovered/unknown items is valid, but belongs to a later on-demand info drawer after the feel correction is re-tested.

Reject for current main screen:

- permanent giant collection grid;
- always-visible probability table;
- arbitrary random floating labels.

---

# 15. Collection environment

Core mood remains a cozy illustrated Y2K shelf/desk/display.

Current two-family composition is accepted. Scale only when real content density requires it.

---

# 16. Store visual direction — PUBLIC RELEASE ONLY

Do not finalize store creatives from the current two-family catalog.

After expanded content stabilizes, use strongest gadgets + Mystery Pouch cue, actual release art quality and small-size readability.

---

# 17. Generator-facing collectible prompt seed

> Generate a stylized collectible mini Y2K gadget inspired by real early-2000s pocket electronics. Use a front-facing or very soft 3/4 presentation, chunky simplified forms, soft painted 2.5D shading, large readable controls, and a cute but tasteful collectible finish. Prioritize recognizable gadget identity over kawaii decoration. Use candy plastic, translucent/frosted shells, pearlescent surfaces, restrained metallic accents, and stylized visible internals only where rarity calls for them. Keep the object consistent with a coherent blind-box mini gadget product line and readable at small in-game size. Avoid photoreal product rendering, generic glossy mobile 3D, excessive sparkles, and branded 1:1 product copies.
