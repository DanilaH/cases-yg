# Art production pipeline

This file defines the repeatable collectible-production workflow for the integrated current catalog and later public content expansion.

---

# 1. Current production baseline — COMPLETE

The first two families are already produced/integrated:

- Digital Camera: Common / Rare / Epic / Legendary + Secret;
- Flip Phone: Common / Rare / Epic / Legendary + Secret.

They established:

- the visual language;
- rarity derivation consistency;
- cleanup/export process;
- realistic iteration cost per family;
- how the same asset survives reveal, Shelf and Library.

Do **not** start mass-producing new families during Gameplay Loop Lite V2. The next content batch begins after Lite V2 hands-on and real Yandex DRAFT validation.

### Flip Phone — locked direction

The accepted family uses one open, front-facing pink Y2K clamshell master with the same silhouette, hinge, screen frame, camera, circular navigation control and keypad across all standard rarities.

Standard progression:

- **Common** — solid glossy pink candy plastic, cream keypad, simple heart/star charm;
- **Rare** — translucent/frosted pink shell, restrained glitter/translucency, slightly richer accessory/trim;
- **Epic** — pearlescent/iridescent pink treatment, premium chrome/trim, richer but controlled accessory/detail layer;
- **Legendary** — clear/near-clear shell with stylized visible circuitry/internals and premium metallic treatment.

Secret:

- **Noir / Monochrome Edition** — smoked/piano-black shell, visible dark internal pattern, silver/chrome hinge/navigation/camera accents, monochrome Saturn-heart screen, black-heart + chrome-star charm, restrained star/crescent identity marks.

---

# 2. Canonical family workflow — LOCKED

For every future gadget family:

1. generate roughly **6–10 exploratory candidates**;
2. inspect beauty size + small in-game size;
3. select exactly one canonical master;
4. freeze silhouette, camera angle, major controls and proportions;
5. derive Common/Rare/Epic/Legendary from that master;
6. create Secret only if the content plan assigns one;
7. clean alpha/artifacts;
8. export through project asset pipeline;
9. log source/prompt/revision information;
10. compare completed family against existing catalog before acceptance.

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

Current Secrets:

- Cosmic Camera;
- Noir / Monochrome Flip Phone.

Public release Secret distribution is decided with expanded roster. Do not mechanically create exactly one Secret for every family unless later content design calls for it.

---

# 5. Dimensions / exports — LOCKED

Generation/source input:

- target ~1536×1536 where generation/editing quality permits;
- source canvases may have different aspect ratios/dimensions;
- prefer already-transparent PNG/WebP sources;
- full object including charm/strap/antenna/accessories must be intact.

Canonical runtime hero export:

- **1024×1024 WebP with alpha**;
- aspect ratio preserved; no non-uniform stretch;
- transparent excess trimmed before fitting;
- **64 px safe transparent margin on every side**;
- maximum fitted content box **896×896**;
- geometric centering by default;
- only small per-item optical `offsetX` / `offsetY` corrections;
- variants in one family use comparable perceived scale and the same canonical angle;
- enough transparent space for runtime glow/settle;
- no baked reveal effects or conflicting drop shadows.

Fix source/manifest offsets and rerun pipeline rather than hand-editing final WebPs.

Use `docs/ASSET_PIPELINE.md` for cleanup/normalize/WebP/validation/atlas workflow.

---

# 6. Cleanup

Final assets require:

- clean alpha edges;
- no background halo;
- no cropped accessories;
- no malformed controls/AI artifacts;
- no accidental logo/brand mark;
- no photoreal/CGI drift;
- no cleanup repaint that changes family style.

Use deterministic background cleanup for clean isolated sources; use per-item AI cutout only where necessary. Already-transparent source art is preferred.

Neither path replaces visual review.

---

# 7. Naming — LOCKED

Lowercase kebab-case stable semantic IDs:

```text
<family>-common.webp
<family>-rare.webp
<family>-epic.webp
<family>-legendary.webp
<family>-secret-<edition>.webp
```

Current examples:

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

Raw generation filenames/timestamps are not runtime IDs.

---

# 8. Generation log

Per accepted family keep:

- family ID;
- selected master filename;
- prompt/instructions;
- archetype/reference notes;
- rarity-edit instructions;
- Secret instructions if any;
- date/revision;
- cleanup notes;
- approximate hands-on production time / iteration count.

Do not commit every rejected high-resolution exploration. Contact sheet + selected master + log is enough unless a rejected concept is specifically useful.

---

# 9. Drop-aware expansion workflow

Future content is organized into themed Drops/loot pools rather than one global pool.

Recommended release workflow:

1. Lite V2 + real Yandex DRAFT complete;
2. choose first expanded Drop/theme and ~3–5 diverse families as a starting batch;
3. produce families through canonical workflow;
4. cross-family + cross-Drop style review;
5. correct prompt/edit rules;
6. produce next batch;
7. repeat until release roster is sufficient.

A Drop theme may influence motif/palette lightly, but do not make each Drop look like a different game or force all devices in it into one color.

---

# 10. Lite V2 non-collectible asset rule

Gameplay Loop Lite V2 should not interrupt collectible production with a new art branch.

Only required new identity is the CHIPS token/icon described in `ASSET_MANIFEST.md`.

Charged Pouch should reuse current pouch art with runtime treatment first. Do not create a second pouch layer set unless visual QA proves reuse cannot communicate Charged state.

Potential `chips-collect` / `charged-ready` SFX are optional and should be created only if existing/re-pitched audio is insufficient.

---

# 11. Family acceptance checklist

Before a future family enters runtime/release content:

- readable at Shelf/mobile size;
- archetype immediately recognizable;
- no 1:1 branded copying;
- style matches existing catalog;
- Common desirable;
- Rare/Epic escalation visible;
- Legendary obviously premium without detail soup;
- variants align in scale/angle;
- transparent edges clean;
- full silhouette/accessories inside safe area;
- motifs/charms do not mechanically repeat previous families;
- Secret, if present, genuinely special;
- asset weight reasonable.

Fix consistency before producing more families from a broken rule set.

---

# 12. Release-scale performance checkpoint

Once a real expanded roster exists, profile:

- total encoded asset size;
- decoded GPU memory;
- startup preload;
- Collection loading strategy;
- mobile texture quality;
- thumbnail derivatives;
- individual textures vs per-family/Drop atlases or grouped/on-demand loading.

The current small catalog can preload everything; the public catalog should use the simplest loading plan that remains fast on real devices.
