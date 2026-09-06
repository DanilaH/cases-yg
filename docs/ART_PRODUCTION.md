# Art production pipeline

This file defines the repeatable collectible-production workflow for the integrated current catalog and later public content expansion.

---

# 1. Current production baseline — COMPLETE

The first two families are already produced/integrated:

- Digital Camera: Common / Rare / Epic / Legendary + Secret;
- Flip Phone: Common / Rare / Epic / Legendary + Secret.

They established the visual language, rarity derivation consistency, cleanup/export process, realistic iteration cost and how one asset survives reveal/Shelf/Library.

Do **not** start mass-producing new families during the current Opening Feel Correction. The next content batch begins only after corrected hands-on + real Yandex DRAFT validation.

### Flip Phone — locked direction

The accepted family uses one open, front-facing pink Y2K clamshell master with the same silhouette, hinge, screen frame, camera, circular navigation control and keypad across all standard rarities.

- **Common** — solid glossy pink candy plastic, cream keypad, simple charm;
- **Rare** — translucent/frosted pink shell, restrained glitter/translucency;
- **Epic** — pearlescent/iridescent pink, premium chrome/trim;
- **Legendary** — clear/near-clear shell with stylized visible circuitry/internals and premium metallic treatment;
- **Secret Noir / Monochrome** — smoked/piano-black shell, dark internals, silver/chrome hardware, monochrome Saturn-heart screen and restrained star/crescent marks.

---

# 2. Canonical family workflow — LOCKED

For every future family:

1. generate roughly **6–10 exploratory candidates**;
2. inspect beauty size + small in-game size;
3. select exactly one canonical master;
4. freeze silhouette, camera angle, major controls and proportions;
5. derive Common/Rare/Epic/Legendary from that master;
6. create Secret only if assigned;
7. clean alpha/artifacts;
8. export through project pipeline;
9. log source/prompt/revision information;
10. compare against existing catalog before acceptance.

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
- rarity changes material/color/detail hierarchy, not identity.

A 2×2 reference sheet is allowed as production aid. Runtime items remain separate exports.

---

# 4. Secrets

Secret is not a fifth material tier. It may alter roughly 15–25% of details/geometry while preserving family identity and should use one strong edition concept.

Current Secrets:

- Cosmic Camera;
- Noir / Monochrome Flip Phone.

Public Secret distribution is decided with expanded roster.

---

# 5. Dimensions / exports — LOCKED

Generation/source:

- target ~1536×1536 where quality permits;
- prefer already-transparent PNG/WebP;
- preserve full object/accessories.

Canonical runtime hero export:

- **1024×1024 WebP with alpha**;
- aspect ratio preserved;
- transparent excess trimmed before fitting;
- **64 px safe transparent margin**;
- maximum fitted content box **896×896**;
- geometric centering by default;
- only small optical offsets;
- comparable perceived scale/angle within family;
- no baked reveal FX/conflicting shadow.

Fix source/manifest and rerun pipeline rather than hand-editing final WebPs.

---

# 6. Cleanup / naming / logs

Final assets require clean alpha, intact accessories, no malformed controls, no accidental brand marks and no photoreal/CGI drift.

Naming:

```text
<family>-common.webp
<family>-rare.webp
<family>-epic.webp
<family>-legendary.webp
<family>-secret-<edition>.webp
```

Per family keep selected master, prompt/instructions, reference notes, rarity/Secret edit instructions, date/revision, cleanup notes and approximate production effort.

Do not commit every rejected high-resolution exploration.

---

# 7. Drop-aware expansion workflow

Future content is organized into themed Drops/loot pools rather than one global pool.

Recommended release workflow:

1. Opening Feel Correction + corrected hands-on complete;
2. real Yandex DRAFT complete;
3. choose first expanded Drop/theme and roughly 3–5 diverse families as starting batch;
4. produce families through canonical workflow;
5. cross-family/cross-Drop review;
6. correct prompt/edit rules;
7. produce next batch.

Drop theme may influence motif/palette lightly; do not make each Drop a different game.

---

# 8. Current non-collectible correction asset rule

The Opening Feel Correction is not a new art-production branch.

Current runtime already uses Phaser-rendered CHIPS identity and same authored pouch layers.

Evidence-backed additions:

- **one bundled digital/pixel-like accent font** after actual UI sample review;
- **one `chips-collect` SFX**;
- stronger runtime Charged/neon/iridescent treatment using Text/Graphics/tint/blend/highlight/tweens.

Conditional only:

- `charged-ready` SFX if existing threshold feedback remains weak;
- recolored Charged pouch raster only if label-hidden audit still cannot distinguish Charged from Basic.

Explicitly not required:

- new cache-tier raster assets;
- full UI sprite pack;
- second pouch geometry/design;
- custom shader asset/pipeline;
- fullscreen CRT/VHS asset set.

---

# 9. Family acceptance checklist

Before a future family enters runtime/release:

- readable at Shelf/mobile size;
- archetype immediately recognizable;
- no 1:1 branded copying;
- style matches catalog;
- Common desirable;
- Rare/Epic escalation visible;
- Legendary premium without detail soup;
- variants align in scale/angle;
- transparent edges clean;
- full silhouette/accessories inside safe area;
- motifs do not mechanically repeat;
- Secret genuinely special if present;
- asset weight reasonable.

---

# 10. Release-scale performance checkpoint

Once a real expanded roster exists, profile encoded size, decoded GPU memory, startup preload, Collection loading, mobile texture quality, thumbnails and individual textures vs grouped/on-demand loading.

The current small catalog can preload everything; use the simplest release loading plan that remains fast on real devices.
