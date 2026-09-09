# Content Expansion Art Rules

Status: **LOCKED for new collectible families produced during content expansion.**

This document supersedes the old single-master-chassis rule in `ART_DIRECTION.md` and `ART_PRODUCTION.md` for **future families**. Existing Camera and Flip Phone art remains valid and does not need to be rebuilt.

---

## 1. Core collectible direction

Collectibles remain:

> **real Y2K device archetypes turned into highly desirable blind-box mini collectibles**

Target visual language remains:

- stylized 2D / painted 2.5D;
- front-facing or soft 3/4;
- chunky / softened toyified proportions;
- immediately readable gadget identity;
- large readable controls;
- candy / translucent plastics;
- pearlescent / iridescent materials where rarity calls for them;
- controlled chrome / metallic accents;
- soft illustrated highlights;
- no photoreal product-render drift;
- no generic glossy mobile-game 3D;
- no branded 1:1 copies.

Priority remains:

> **gadget identity first → collectible desirability second → kawaii garnish third**

---

## 2. Family identity no longer requires one chassis

For future families, Common / Rare / Epic / Legendary **may use different chassis / body geometry**.

The family is held together by shared design DNA rather than one exact shell:

- same device category / archetype;
- same overall painted 2.5D rendering language;
- comparable object scale;
- compatible front / soft-3/4 camera language;
- similar detail density;
- logically related hardware controls;
- repeated family cues where useful, without mechanically cloning one body;
- coherent Y2K blind-box collectible finish.

A rarity should feel like a **different desirable collectible in the same family**, not merely the same object with a material skin.

Different chassis must not become different art directions. Do not let one family drift into a random mix of unrelated eras, device categories, rendering styles, or control languages.

---

## 3. Rarity is primarily material grammar

The locked standard rarity grammar remains:

### Common

- solid / mostly solid candy plastic;
- simple, readable, already desirable;
- lower detail density without looking cheap or placeholder-like.

### Rare

- translucent / frosted material;
- restrained premium accent;
- may use a different chassis from Common.

### Epic

- pearlescent / iridescent premium surface;
- richer trim / accessory / screen treatment;
- may use a different chassis from Common and Rare.

### Legendary

- clear / near-clear shell;
- stylized visible internals;
- premium metallic / lens / screen treatment;
- may use a substantially different but clearly related chassis;
- premium without becoming detail soup.

Rarity must read in the item itself. Runtime glow, particles and shimmer are presentation, not substitutes for source-art material escalation.

---

## 4. Secret remains outside the standard ladder

Secret is not a fifth material tier.

It should feel like a prototype, strange limited edition or special run with one strong concept.

Allowed:

- more bespoke geometry and control treatment than standard rarities;
- roughly 15–25% detail / geometry divergence as a normal target, with judgment allowed when the family still reads instantly;
- a signature faceplate, screen, control, accessory or edition motif.

Secret must still be immediately recognizable as the same device family.

Avoid making Secret merely "more transparent, more gold, more glow" than Legendary.

---

## 5. Generation format — one collectible per slide/image

**Every collectible is generated as its own standalone image / slide.**

Do not generate Common / Rare / Epic / Legendary / Secret together on one shared production image.

Do not bake rarity labels, badges, captions, comparison text or UI into the collectible source.

A contact sheet may be assembled later for review from already-generated standalone candidates, but it is a review artifact only. It is not the generation source and never becomes a runtime asset.

This rule also applies to exploratory concepts when practical: prefer one candidate per generated image so each concept has full resolution, clean framing and can be reused directly if selected.

---

## 6. Family exploration workflow

For a future family:

```text
6–10 standalone exploratory concepts
→ review at beauty size + small in-game size
→ select the strongest chassis concepts
→ assign / adapt four chassis to Common / Rare / Epic / Legendary
→ apply the locked rarity material grammar
→ create Secret separately if assigned
→ cross-family style review
→ alpha / cleanup / runtime export
```

Unlike the old workflow, future families do **not** require one canonical body to be reference-locked across all standard rarities.

However, generation should still reuse successful concepts and edit them deliberately rather than redesigning every slot from zero without reference.

---

## 7. MP3 Player family — current working reference

The MP3 Player exploration established the current model:

- Common: simple chunky vertical candy-plastic player;
- Rare: different compact chassis using translucent / frosted material;
- Epic: different rounded / pebble-like chassis using pearlescent / iridescent treatment;
- Legendary: different clear-shell chassis with visible stylized internals;
- Secret: separate special-edition concept, still unmistakably an MP3 player.

Useful family cues:

- small Y2K screen;
- large readable playback controls;
- rounded toyified body language;
- pocket-device proportions;
- coherent painted 2.5D shading;
- similar perceived scale and framing.

Avoid excessive repeated star motifs, excessive kawaii drift, photoreal electronics rendering and later-era smartphone styling.

---

## 8. Production source / runtime contract remains unchanged

Preferred source:

- standalone PNG or WebP;
- meaningful alpha / transparent background when available;
- full object and accessories visible;
- no clipped extremities;
- no baked reveal glow, particles or drop shadow;
- no rarity badge / name / caption embedded in the image.

Runtime collectible export remains:

- 1024×1024 WebP with alpha;
- aspect ratio preserved;
- transparent excess trimmed before fitting;
- 64 px safe transparent margin;
- maximum fitted content box 896×896;
- geometric centering by default;
- only small optical offsets;
- comparable perceived scale across the family.

The same runtime asset is reused for Reveal, Shelf and Library.

---

## 9. Acceptance checklist for new families

Before acceptance:

- readable at Shelf / mobile size;
- device archetype immediately recognizable;
- style matches the existing catalog;
- each rarity feels like a genuinely desirable collectible;
- different chassis still read as one family;
- material grammar clearly communicates rarity;
- Common is attractive rather than intentionally dull;
- Rare / Epic escalation is visible;
- Legendary reads premium without detail soup;
- Secret is genuinely special if present;
- controls are not malformed;
- no accidental brand marks;
- no photoreal / CGI drift;
- clean transparent edges;
- full silhouette inside safe area;
- no baked runtime FX;
- no production contact sheet used as the source asset.
