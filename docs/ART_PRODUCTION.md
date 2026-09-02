# Art production pipeline

This file defines the operational asset workflow for the first behavioral probe. The visual system itself lives in `ART_DIRECTION.md`.

---

# 1. Probe asset scope — LOCKED

Standard collectible art:

- Digital Camera: Common / Rare / Epic / Legendary;
- Flip Phone: Common / Rare / Epic / Legendary;
- 8 standard collectible assets total.

Secret art:

- 1 Secret Camera;
- 1 Secret Flip Phone;
- 2 Secret assets total.

Do not generate additional gadget families before the behavioral probe validates.

---

# 2. Base-gadget exploration — LOCKED

For each gadget family:

1. generate **6–10 exploratory candidates** using the shared art-direction prompt and family-specific archetype cues;
2. compare candidates at small in-game size, not only as large beauty renders;
3. select exactly **one canonical master**;
4. freeze its silhouette, camera angle, major controls and proportions;
5. derive all standard rarity variants from that canonical master.

Exploration is for finding the base design. Do not independently redesign Common, Rare, Epic and Legendary.

---

# 3. Rarity derivation — LOCKED

Derive variants in this order:

```text
canonical master
    ↓
Common
    ↓ reference-locked edits
Rare
Epic
Legendary
```

A 2×2 rarity reference sheet is allowed when it improves consistency, but final runtime items remain separate assets.

Consistency gate:

- same recognizable device identity;
- same camera angle;
- same broad geometry and proportions;
- controls remain in the same logical locations;
- rarity changes material/color/detail hierarchy rather than replacing the device.

Legendary may add the strongest detail changes, but must still clearly be the same base gadget.

---

# 4. Secret production — LOCKED

Probe Secrets are bespoke special editions outside the standard rarity ladder:

- **Secret Camera:** cold cyan/cosmic translucent edition with a distinctive Saturn/planet charm and altered lens/face details;
- **Secret Flip Phone:** purple/music-edition direction with altered faceplate/controls/accessory language.

Each Secret may alter roughly **15–25%** of geometry/details while preserving family identity.

Secrets must look like unusual limited editions, not Legendary recolors.

---

# 5. Source and runtime dimensions — LOCKED

Collectible source masters:

- square transparent canvas;
- target source size: **1536×1536 px** when the generation/editing tool supports it cleanly;
- never accept a source master below **1024×1024 px**.

Runtime collectible export:

- **1024×1024 WebP with alpha**;
- crop/pad consistently around the object so rarity variants do not jump in scale during reveal;
- preserve transparent margins needed for glow/settle animation.

If a 1024 runtime asset is materially wasteful after profiling, produce a 768 or 512 derivative; keep the higher-resolution source master rather than regenerating.

Package and major illustrated scene assets may use non-square dimensions appropriate to their composition.

---

# 6. Background cleanup — LOCKED

Final collectible assets must have:

- transparent background;
- clean smooth edges;
- no accidental halo from removed backgrounds;
- no baked drop shadow that fights runtime placement;
- no cropped charm/antenna/strap;
- no generation artifacts or malformed controls.

Prefer generation/editing with transparent output where possible. Manual cleanup is acceptable for edge defects; do not repaint the whole asset into a new style during cleanup.

---

# 7. Runtime-vs-baked effects — LOCKED

Do not bake reveal juice into collectible exports.

Keep these runtime-only:

- rarity glow;
- radial flash;
- sparkles/particles;
- outline/ring pulse;
- camera bump;
- NEW/duplicate labels;
- Signal effects.

The same collectible export must work in reveal hero presentation and on the Collection Shelf/Library.

---

# 8. File naming — LOCKED

Use lowercase kebab-case and stable semantic IDs.

Examples:

```text
camera-common.webp
camera-rare.webp
camera-epic.webp
camera-legendary.webp
camera-secret-cosmic.webp

flip-phone-common.webp
flip-phone-rare.webp
flip-phone-epic.webp
flip-phone-legendary.webp
flip-phone-secret-music.webp
```

Source/working files may add revision suffixes, e.g. `camera-master-v03.png`, but runtime IDs must not contain arbitrary generation numbers.

---

# 9. Generation log — LOCKED

Keep a tiny text/JSON record for each final family containing:

- canonical master filename;
- generation/edit prompt used for the selected master;
- key reference/archetype notes;
- accepted rarity-edit instructions;
- Secret-edit instructions;
- date/revision;
- any manual cleanup notes.

Do **not** commit dozens of rejected high-resolution exploration files to Git just for provenance. A contact sheet plus the selected master and prompt log is enough unless a rejected source is specifically worth preserving.

---

# 10. Acceptance checklist

Before an asset enters runtime, verify:

- readable at approximately shelf-thumbnail size;
- no brand/logo/1:1 model copying;
- family identity is obvious;
- style matches the other gadget family;
- no accidental photoreal/CGI drift;
- Common is still attractive;
- rarity escalation is visible without runtime FX;
- Legendary detail does not become noise;
- transparent edges are clean;
- rarity variants align closely enough that reveal scale does not jump;
- Secret clearly feels outside the standard ladder.

If consistency fails, fix the family before generating more content. Do not solve inconsistency by adding more assets.
