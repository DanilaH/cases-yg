# Art direction

## 1. Core visual thesis

Collectibles should feel like:

> **real Y2K device archetypes turned into highly desirable blind-box mini collectibles**

Target: **stylized 2D / painted 2.5D**, not photoreal product rendering and not generic glossy mobile-game 3D.

Priority:

> **gadget identity first → collectible desirability second → kawaii garnish third**

---

## 2. Shared visual language — LOCKED

Camera and flip-phone explorations established the probe language:

- recognizable early-2000s silhouettes;
- front-facing or very soft 3/4 presentation;
- rounded/chunky proportions;
- large readable controls;
- simplified hardware cues;
- candy/translucent plastics;
- soft illustrated highlights;
- restrained charms/lanyards;
- enough tactility to feel collectible without photorealism.

One fixed camera angle is not mandatory across different families. Within a single family, all rarity variants must preserve the same angle and core geometry.

---

## 3. Perspective / shape

Preferred:

- almost front-facing or soft 3/4;
- clean isolated silhouette;
- enough transparent negative space around asset;
- compact/chunky/softened proportions;
- roughly 3–6 iconic hardware cues per archetype.

Avoid:

- deep perspective;
- dramatic lens distortion;
- micro-detail that disappears at shelf size;
- inconsistent angle across rarity variants;
- 1:1 branded product copying.

Useful cues include lens ring, viewfinder, flash, hinge, antenna nub, outer display, speaker grille, strap loop and large navigation controls.

---

## 4. Material language

Core materials:

- solid candy plastic;
- frosted plastic;
- translucent jelly plastic;
- pearlescent / iridescent faceplates;
- crystal-clear shell;
- controlled chrome / metallic trim;
- stylized fake internals for highest standard rarity.

Lighting:

- soft illustrated highlights;
- clear material separation;
- polished painted feel;
- no hard CGI/studio-render look.

---

## 5. Decoration

Allowed sparingly:

- charm;
- strap/lanyard;
- bead;
- tiny sticker/decal;
- star/heart/planet/music motif where appropriate.

Do not repeat the same star/charm template across every item.

---

# 6. Standard rarity grammar — LOCKED

> **Common → Rare → Epic → Legendary**

## Common

- solid/mostly solid candy plastic;
- simple attractive colorway;
- restrained accessory;
- no magical baked glow;
- must already be desirable.

## Rare

- clearly upgraded material;
- translucent/frosted shell default;
- one restrained premium accent.

## Epic

- pearlescent/iridescent premium surface;
- richer trim/accessory;
- more expressive material/color combination.

## Legendary

- clear/near-clear shell;
- stylized visible internals/circuitry;
- premium metallic treatment;
- distinctive lens/screen/trim treatment;
- instantly jackpot-tier among standard variants.

Legendary internals should be readable decoration, not realistic PCB noise.

---

# 7. Runtime reveal vs item art — LOCKED

Item-level rarity may change:

- body material;
- transparency;
- faceplate;
- colorway;
- accessory;
- visible internals;
- lens/screen treatment;
- metallic trim.

Keep these primarily runtime-only:

- glow;
- particles;
- radial flash;
- sparkle burst;
- outline/ring pulse;
- camera bump;
- NEW/duplicate labels;
- Signal effects.

The same collectible asset must work in reveal, Shelf and Library.

---

# 8. Probe content — LOCKED

Only two standard families:

1. **Digital Camera**;
2. **Flip Phone**.

Each receives four standard rarity variants: **8 standard assets total**.

Do not validate/generate MP3 players, pagers, handhelds, camcorders or other families before the behavioral probe proves the loop. Those are post-validation candidates, not required art-system tests anymore.

Production workflow is defined in `ART_PRODUCTION.md`.

---

# 9. Secret / Chase editions — LOCKED FOR PROBE

Secrets are outside the standard ladder and do not count toward 8/8 standard completion.

Exactly two probe Secrets:

## Secret Camera

Direction:

- cold cyan/cosmic translucent body;
- distinctive Saturn/planet charm;
- altered lens ring/face detail;
- unusual limited-edition feeling;
- not simply a cyan Legendary.

## Secret Flip Phone

Direction:

- purple/music-edition theme;
- altered faceplate/controls/accessory language;
- recognizable as the same flip-phone family;
- not simply a purple Legendary.

Secret rules:

- roughly 15–25% geometry/detail change allowed;
- same overall product-line style;
- stronger bespoke identity than standard rarity variants;
- special reveal treatment allowed.

Desired reaction:

> **“What the hell is THAT?”**

---

# 10. Palette

Do not make the whole product pink/violet.

Useful directions:

- transparent violet;
- ice blue + silver;
- mint + cream;
- bubblegum pink;
- translucent orange;
- smoky graphite + lime;
- milky white + aqua;
- metallic cyan;
- ruby clear;
- lavender + pearl;
- clear shell + colored internals.

Camera and Flip Phone should feel related but not like identical recolored shells.

---

# 11. Mystery Pouch — LOCKED

Canonical reference:

![Locked mystery pouch reference](assets/package-mystery-pouch-v1.webp)

Repository path: `docs/assets/package-mystery-pouch-v1.webp`

Visual grammar:

- silver foil / anti-static base;
- translucent lavender accents;
- large circular `?` mystery badge;
- three small gadget silhouettes;
- restrained circuit traces;
- large star-shaped functional tear-tab;
- horizontal dashed tear line, left-to-right;
- minimal/no baked title text.

Interaction:

> **grab star tear-tab → drag left-to-right → deterministic opening completes**

Reveal continuity:

- pouch remains visible as the physical source for ~0.3–0.4 s;
- collectible visibly emerges;
- pouch then slides/scales/fades away;
- final reward state belongs to the collectible.

Hidden Pocket reuses this same pouch language rather than introducing another container.

---

# 12. Collection environment — LOCKED

Default Collection view is a cozy illustrated **Y2K shelf / desk / display**.

Probe composition:

- one Camera hero position;
- one Flip Phone hero position;
- enough decorative desk/shelf context that two items feel intentional rather than empty;
- fixed positions, no free placement.

Each position shows best owned visual with priority:

> Secret → Legendary → Epic → Rare → Common

Missing family uses a tasteful silhouette/empty stand.

The scene can use small environmental props (CDs, beads, tiny stickers, cables, lamp glow) as atmosphere, but they must not look like additional collectible slots.

Library is a cleaner catalog subview of the same Collection scene.

---

# 13. Store visual materials — LOCKED DIRECTION

Current Yandex Games draft requirements to design for:

- icon: **512×512 PNG**;
- cover: **800×470 PNG**;
- optional hero image: **1560×520 PNG/JPG**;
- required landscape screenshots: **16:9**, long side 1280–2560 px, with at least two per selected platform.

Do not use a raw gameplay screenshot as icon/cover.

## Icon composition

Use one immediately legible object hook:

> **partly torn silver/lavender Mystery Pouch + one bright retro gadget emerging + large `?` cue**

Prefer Camera as the hero for the first icon because lens silhouette reads better at tiny size. Keep Flip Phone for cover/supporting composition.

No small text.

## Cover composition

- torn Mystery Pouch near center;
- Camera and Flip Phone emerging/hovering as the two recognizable rewards;
- material contrast that hints at rarity (e.g. translucent/pearl) without showing every tier;
- cozy Y2K background language;
- no fake platform badges/UI;
- title only if it remains readable and does not crowd the object hook.

## Screenshot set

Minimum first set should demonstrate:

1. active pouch tear/reveal;
2. Collection Shelf with Camera + Flip Phone;
3. Library/rarity progress if a third screenshot is cheap.

Use actual gameplay screenshots for screenshots; do not substitute promotional illustrations.

---

# 14. Generator-facing prompt seed

> Generate a stylized collectible mini Y2K gadget inspired by real early-2000s pocket electronics. Use a front-facing or very soft 3/4 presentation, chunky simplified forms, soft painted 2.5D shading, large readable controls, and a cute but tasteful collectible finish. Prioritize recognizable gadget identity over kawaii decoration. Use candy plastic, translucent/frosted shells, pearlescent surfaces, restrained metallic accents, and stylized visible internals only where rarity calls for them. Keep the object consistent with a coherent blind-box mini gadget product line and readable at small in-game size. Avoid photoreal product rendering, generic glossy mobile 3D, excessive sparkles, and branded 1:1 product copies.
