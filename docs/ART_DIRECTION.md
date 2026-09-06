# Art direction

## 1. Core visual thesis

Collectibles should feel like:

> **real Y2K device archetypes turned into highly desirable blind-box mini collectibles**

Target: stylized 2D / painted 2.5D. Avoid photoreal product rendering and generic glossy mobile-game 3D.

Priority:

> **gadget identity first → collectible desirability second → kawaii garnish third**

---

# 2. Shared visual language — LOCKED

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

# 5. Current content vs public content

The integrated production catalog currently contains:

1. Digital Camera;
2. Flip Phone.

This proves the opener and family-production pipeline. It is not the final content scope.

The next development pass is **Gameplay Loop Lite V2**, not mass content production. After Lite V2 hands-on + real Yandex DRAFT validation, resume batch production of a substantially larger catalog.

Candidate next families include MP3 player, pager, mini camcorder, handheld console, PDA, portable disc player, pocket radio, virtual-pet-like electronics and other suitable Y2K gadget archetypes.

The release should gain variety through different silhouettes/functions, not many nearly identical rectangular devices.

---

# 6. Drops / themed content grouping

As the catalog grows, families will be grouped into themed Drops/loot pools.

Art implication:

- each Drop should have a loose thematic identity without requiring a separate full UI skin;
- individual collectible families must still feel like one coherent overall product line;
- do not force every family in a Drop into the same color palette;
- a rough 3–5-family Drop is a useful planning unit, not a hard art rule.

Potential theme names such as `Y2K Essentials`, `Pocket Gaming` or `Music Tech` are placeholders until the real roster is locked.

---

# 7. Family production consistency

For every family:

```text
6–10 exploratory base concepts
→ choose one canonical master
→ freeze silhouette / angle / core controls
→ derive Common / Rare / Epic / Legendary
→ derive Secret only if assigned in content plan
```

Batch review must check:

- scale/proportion consistency;
- similar painting/shading language;
- comparable detail density;
- Common attractiveness;
- Legendary readability;
- motif repetition;
- small-size Shelf/Library readability.

Do not mass-produce dozens of families before correcting style drift discovered in early batches.

---

# 8. Palette / decoration

Do not make the entire catalog pink/violet.

Useful directions include ice blue/silver, mint/cream, bubblegum, translucent orange, smoky graphite/lime, milky white/aqua, metallic cyan, ruby clear, lavender/pearl, clear shell with colored internals.

Charms/stickers/straps are garnish. Avoid repeating the same star charm or decal template across the catalog.

---

# 9. Runtime art vs effects

The same transparent collectible export is reused for reveal, Shelf and Library.

Item art may encode material/color/accessory/internals differences.

Keep primarily runtime-only:

- rarity glow;
- flash;
- particles;
- ring/outline pulse;
- camera bump;
- NEW/duplicate/recycle labels;
- Signal effects;
- CHIPS token motion;
- Charged pouch glow/electric treatment.

---

# 10. Mystery Pouch — LOCKED

Canonical reference:

`docs/assets/package-mystery-pouch-v1.webp`

Visual grammar:

- silver foil / anti-static base;
- translucent lavender accents;
- large circular `?`;
- three small gadget silhouettes;
- restrained circuit traces;
- large star-shaped tear-tab;
- horizontal left-to-right tear line;
- minimal/no baked title text.

Current runtime uses the existing body, compact authored tear strip and star-tab with independent presentation transforms.

### Charged treatment

Lite V2 should **reuse this same pouch art first**.

Charged distinction should come from runtime treatment such as controlled electric/cyan-lavender glow, pulse/rings and clear status copy. Do not commission a second full pouch raster set unless visual review proves the runtime treatment is insufficient.

---

# 11. CHIPS visual identity — LITE V2

CHIPS should look like tiny Y2K electronic tokens/components, not generic fantasy gold coins.

Target:

- tiny readable chip/circuit silhouette;
- silver/lavender/cyan family;
- usable at ~18–32 px HUD scale;
- also readable when several tokens fly from reward to wallet;
- no baked numeric value/text;
- restrained enough not to compete with collectible rarity art.

One reusable token/icon is enough. Do not create a large currency asset pack.

---

# 12. Collection environment

Core mood remains a cozy illustrated Y2K shelf/desk/display.

Current two-family composition is accepted for current content.

Public content will have many families and multiple Drops, so final environment may evolve into themed shelves/pages/groups. Preserve:

- collectible-first presentation;
- curated display rather than free room editing;
- enough atmospheric props to feel lived-in;
- props must not masquerade as collectible slots.

Exact multi-Drop Collection composition is decided only when expanded content exists.

---

# 13. Store visual direction — PUBLIC RELEASE ONLY

Do not finalize store creatives from the current two-family catalog.

Once expanded release content is stable:

- choose strongest 1–3 gadget heroes for icon/cover;
- use Mystery Pouch as recurring acquisition cue;
- show actual release art/material quality;
- avoid fake platform UI/badges;
- keep small-size readability first.

Re-check Yandex media dimensions immediately before production/upload.

---

# 14. Generator-facing prompt seed

> Generate a stylized collectible mini Y2K gadget inspired by real early-2000s pocket electronics. Use a front-facing or very soft 3/4 presentation, chunky simplified forms, soft painted 2.5D shading, large readable controls, and a cute but tasteful collectible finish. Prioritize recognizable gadget identity over kawaii decoration. Use candy plastic, translucent/frosted shells, pearlescent surfaces, restrained metallic accents, and stylized visible internals only where rarity calls for them. Keep the object consistent with a coherent blind-box mini gadget product line and readable at small in-game size. Avoid photoreal product rendering, generic glossy mobile 3D, excessive sparkles, and branded 1:1 product copies.
