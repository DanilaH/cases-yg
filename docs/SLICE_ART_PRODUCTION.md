# PR-6 slice art production contract

This file turns the locked art direction into an export/integration contract for the private Camera + Flip Phone vertical slice.

## Runtime exports

All collectible exports are transparent WebP images, visually centered, with consistent empty padding and no baked rarity glow/particles/text.

Expected runtime paths are already defined by `src/game/data/collectibles.ts`:

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
public/assets/collectibles/flip-phone-secret-music.webp
```

Canonical pouch reference is copied into runtime at:

```text
public/assets/pouch/package-mystery-pouch-v1.webp
```

## Export frame

For each collectible:

- square transparent canvas;
- recommended master/export size: 1024 × 1024;
- device occupies roughly 72–82% of the shorter dimension;
- no cast shadow baked into the alpha export; runtime owns the grounding shadow;
- no labels, logos, model names, rarity badges or background;
- preserve the same device position, angle and scale across the four standard rarity variants of one family.

## Camera family

### Exploration objective

Generate 6–10 base digital-camera concepts. The selected canonical master should read instantly as an early-2000s compact digital camera at Library size: chunky pocket body, oversized circular lens, small flash, tactile shutter/button cues, restrained strap/lanyard attachment. Avoid DSLR proportions and modern mirrorless minimalism.

### Standard rarity derivation

- Common — desirable solid candy-plastic master; simple two-tone finish.
- Rare — same geometry/angle/control layout; translucent or frosted shell plus one restrained premium accent.
- Epic — same geometry; pearlescent/iridescent body, richer lens trim and one tasteful accessory detail.
- Legendary — same geometry; clear/crystal shell with stylized readable internals plus premium metallic lens treatment.

### Secret

`camera-secret-cosmic`: cold cyan/cosmic translucent special edition, altered lens/face treatment and Saturn/planet charm. It may change roughly 15–25% of details but must still read as the same Camera family.

## Flip Phone family

### Exploration objective

Generate 6–10 base clamshell concepts with unmistakable Y2K flip-phone proportions. Keep the open clamshell readable, compact and toyified; large screen, visible hinge and simplified keypad/nav control. Avoid smartphone-like slabs and over-detailed real-phone replicas.

### Standard rarity derivation

- Common — pastel lilac/cream or similarly attractive solid candy plastic.
- Rare — same geometry; translucent orange/frosted Y2K shell with restrained premium trim.
- Epic — same geometry; pearlescent/iridescent finish and slightly richer hinge/control/accessory treatment.
- Legendary — same geometry; clear shell with stylized visible internals and premium metallic/chrome treatment.

### Secret

`flip-phone-secret-music`: purple/music special edition with altered faceplate/screen/control/accessory language. Do not reuse the Camera's Saturn/star garnish.

## Shared generation prompt grammar

Use this as the base prompt for exploration and derivation:

> Stylized collectible mini Y2K pocket electronic, inspired by real early-2000s hardware archetypes but not copying any specific branded model. Front-facing or very soft 3/4, chunky softened toy proportions, painted 2D / 2.5D illustration, crisp silhouette and readable hardware controls, desirable blind-box collectible finish. Gadget identity first, collectible desirability second, decoration third. Soft illustrated highlights, controlled material detail, no photorealism, no generic glossy mobile-game 3D, no logos, no model text, no busy background. Transparent background, centered object, clean alpha edges, readable at small game-UI size.

## Selection criteria

The canonical master wins on:

1. instant family recognition at small size;
2. attractive Common potential before premium materials are added;
3. silhouette distinct from the other family;
4. enough simple surfaces to communicate all four rarity materials without changing geometry;
5. no detail density that will collapse in Library cards;
6. generation consistency across derived variants.

Do not choose a master because it is the most ornate. The best master is the one that can survive the whole rarity ladder cleanly.

## Runtime integration contract

`src/game/data/artAssets.ts` is the explicit reviewed-art allowlist. A collectible ID is added to `AVAILABLE_COLLECTIBLE_ART_IDS` only after its final export is committed. Until then the existing procedural device remains as a fallback, so an unfinished PR-6 asset can never create a runtime 404 or blank reward.

`createCollectibleVisual` receives the real collectible ID and automatically chooses the reviewed texture when preloaded. Reveal, Shelf and Library therefore reuse exactly the same export.

The pouch uses the committed canonical reference immediately, with the deterministic runtime tear strip/star interaction kept as a separate layer.

## PR-6 visual completion gate

PR-6 is not visually complete until all ten collectible exports are reviewed, committed and enabled in the allowlist, and the Opening/Collection environment has enough final-ish depth to judge the slice hands-on. Production SFX must also replace or intentionally sign off the oscillator placeholders before direct user review.
