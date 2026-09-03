# Art production pipeline

This file defines the repeatable collectible-production workflow for both the internal slice and later public content expansion.

---

# 1. Phase 1 — internal slice

Produce first:

- Digital Camera: Common / Rare / Epic / Legendary + Secret;
- Flip Phone: Common / Rare / Epic / Legendary + Secret.

Purpose is not to finish public content. It is to prove:

- the visual language;
- rarity derivation consistency;
- cleanup/export process;
- realistic time/iteration cost per family;
- how well the same asset survives reveal, Shelf and Library.

After direct user sign-off, move into batch production of additional families.

### Flip Phone — current locked slice direction

The accepted family uses one open, front-facing pink Y2K clamshell master with the same silhouette, hinge, screen frame, camera, circular navigation control and keypad across all standard rarities.

Standard progression:

- **Common** — solid glossy pink candy plastic, cream keypad, simple heart/star charm;
- **Rare** — translucent/frosted pink shell, restrained glitter/translucency, slightly richer accessory/trim;
- **Epic** — pearlescent/iridescent pink treatment, premium chrome/trim, richer but controlled accessory/detail layer;
- **Legendary** — clear/near-clear shell with stylized visible circuitry/internals and premium metallic treatment.

Secret:

- **Noir / Monochrome Edition** — smoked/piano-black shell, visible dark internal pattern, silver/chrome hinge/navigation/camera accents, monochrome Saturn-heart screen, black-heart + chrome-star charm, restrained star/crescent identity marks.

The Noir Secret is intentionally outside the pink material ladder. Do not turn it into a fifth standard rarity.

---

# 2. Canonical family workflow — LOCKED

For **every** gadget family:

1. generate roughly **6–10 exploratory candidates**;
2. inspect both beauty size and small in-game size;
3. select exactly one canonical master;
4. freeze silhouette, camera angle, major controls and proportions;
5. derive Common/Rare/Epic/Legendary from that selected master;
6. create Secret edition only if the content plan assigns one;
7. clean alpha/artifacts;
8. export runtime assets through the project asset pipeline;
9. log source/prompt/revision information;
10. compare the completed family against existing catalog before accepting it.

Exploration finds the base design. Do not independently redesign each rarity.

---

# 3. Rarity derivation

```text
canonical master
    ↓
Common
    ↓ reference-locked edits
Rare
Epic
Legendary
```

Consistency gate:

- same recognizable device;
- same camera angle;
- same broad geometry/proportions;
- controls remain logically aligned;
- rarity changes materials/color/detail hierarchy, not identity.

A 2×2 reference sheet is allowed as a production aid. Final runtime items remain separate exports.

---

# 4. Secrets

Secret is not a fifth material tier.

A Secret may alter ~15–25% of details/geometry while preserving family identity.

It should have one strong edition concept: cosmic, noir/monochrome, prototype, themed faceplate, unusual accessory system, etc.

The internal slice uses:

- Cosmic Camera;
- Noir / Monochrome Flip Phone.

Public release Secret distribution is decided with the expanded roster. Do not mechanically create exactly one Secret for every family unless later product design calls for that.

---

# 5. Dimensions / exports — LOCKED

Generation/source input:

- target ~1536×1536 where generation/editing quality permits;
- do not accept a visibly undersized or damaged source merely to hit a nominal dimension;
- **source canvases may have different aspect ratios and dimensions** — no manual squaring or stretching is required before ingestion;
- prefer already-transparent PNG/WebP sources when available;
- the full object, including charm/strap/antenna/accessories, must be present and unclipped.

Examples such as `1024×1536`, `1236×1273` or `1224×1285` are valid production inputs. The project pipeline owns normalization.

Canonical runtime hero export:

- **1024×1024 WebP with alpha**;
- aspect ratio preserved; non-uniform stretch is forbidden;
- transparent excess trimmed before fitting;
- **64 px safe transparent margin on every side**;
- therefore maximum fitted content box is **896×896**;
- geometric centering by default;
- small per-item optical `offsetX` / `offsetY` corrections only where needed;
- all variants in one family must have comparable perceived scale and the same canonical angle;
- enough transparent space for runtime glow/settle;
- no baked reveal effects or conflicting drop shadows.

Do **not** hand-edit a final WebP to compensate for inconsistent framing. Fix the source/manifest offset and rerun the pipeline so the result remains reproducible.

Use `docs/ASSET_PIPELINE.md` and the project commands for background cleanup, normalization, WebP export, validation and optional atlas inspection.

For the expanded release, create 512/768 derivatives from masters if profiling shows that full 1024 assets are wasteful for Collection thumbnails/mobile memory.

---

# 6. Cleanup

Final assets require:

- clean alpha edges;
- no background halo;
- no cropped charm/antenna/strap;
- no malformed controls/AI artifacts;
- no accidental logo/brand mark;
- no photoreal/CGI drift;
- no repaint during cleanup that changes the family style.

The project has two cleanup paths. Use deterministic corner/background modeling for clean isolated sources; use per-item `backgroundRemoval: "ai"` only when a real source visually proves that deterministic cleanup is not sufficient. Already-transparent source art is preferred and is preserved without unnecessary segmentation.

Neither path replaces visual review. If AI segmentation eats a pale/translucent panel or a small accessory, use a cleaner/already-transparent source rather than endlessly tuning one pathological image.

---

# 7. Naming — LOCKED

Lowercase kebab-case stable semantic IDs.

Canonical runtime scheme:

```text
<family>-common.webp
<family>-rare.webp
<family>-epic.webp
<family>-legendary.webp
<family>-secret-<edition>.webp
```

Slice examples:

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
flip-phone-secret-noir.webp
```

Raw generated/exported filenames containing timestamps or arbitrary generation numbers are **not** production IDs. Map/rename them to the semantic source slots declared in `assets-src/collectibles.manifest.json` before processing.

Future family names follow the same pattern.

Working/source files may use revision suffixes in an external archive, but runtime IDs should not contain arbitrary generation numbers.

---

# 8. Generation log

Per accepted family keep a compact record with:

- family ID;
- selected master filename;
- prompt/instructions used for master;
- archetype/reference notes;
- rarity-edit instructions;
- Secret instructions if any;
- date/revision;
- cleanup notes;
- approximate hands-on production time / iteration count.

That last field matters because it informs the **public launch family count** after the slice.

Do not commit every rejected high-resolution exploration. Contact sheet + selected master + log is enough unless a rejected concept is specifically useful.

---

# 9. Batch expansion rule

Do not produce the entire public roster in one blind pass.

Recommended release workflow:

1. slice families: Camera + Flip Phone;
2. first expansion batch: ~3–5 diverse silhouettes;
3. cross-family style review;
4. correct prompt/edit rules;
5. next batch;
6. repeat until target roster is reached.

This limits style drift and lets the target roster grow beyond old estimates if AI-assisted throughput remains strong.

---

# 10. Family acceptance checklist

Before a family enters runtime/release content:

- readable at Shelf/mobile size;
- archetype is immediately recognizable;
- no 1:1 branded copying;
- style matches existing catalog;
- Common is desirable;
- Rare/Epic escalation is visible;
- Legendary is obviously premium without detail soup;
- variants align in scale/angle;
- transparent edges are clean;
- full silhouette/accessories stay inside the locked safe area;
- motifs/charms do not mechanically repeat previous families;
- Secret, if present, feels genuinely special;
- asset weight is reasonable.

If a family fails consistency, fix it before producing more families from a broken rule set.

---

# 11. Release-scale performance checkpoint

Once a real launch roster exists, profile before final export freeze:

- total encoded asset size;
- decoded GPU memory;
- startup preload;
- Collection loading strategy;
- mobile texture quality;
- whether thumbnails should use derivatives;
- whether individual textures, per-family atlases or grouped/on-demand assets produce the best real-device result.

The internal slice can preload everything; the public catalog should use the simplest loading plan that remains fast on real devices.
