from pathlib import Path


def rep(path: str, old: str, new: str) -> None:
    p = Path(path)
    text = p.read_text()
    if old not in text:
        raise SystemExit(f"{path}: missing expected text: {old[:100]!r}")
    p.write_text(text.replace(old, new, 1))

# README lifecycle wording.
rep(
    "README.md",
    "Do not add new meta systems/content or tune the economy inside the current correction branch.",
    "Do not add new meta systems/content or tune the economy before the second hands-on and hosted DRAFT provide evidence.",
)

# Asset manifest should describe integrated state, not a future asset request.
rep(
    "docs/ASSET_MANIFEST.md",
    "First hands-on identified a concrete CHIPS feedback gap, so one new cue is now justified:",
    "First hands-on identified a concrete CHIPS feedback gap; the merged correction now includes:",
)
rep(
    "docs/ASSET_MANIFEST.md",
    "Hands-on now proves the **strength** of differentiation needs improvement, but not yet that new raster art is required.",
    "The merged correction strengthens runtime differentiation, and the label-hidden r3 audit passed without new raster art.",
)
rep(
    "docs/ASSET_MANIFEST.md",
    "Only if label-hidden audit still reads as “Basic with glow,” a recolored Charged pouch asset variant becomes allowed.",
    "The label-hidden r3 audit passed with runtime treatment, so no recolored Charged pouch asset variant is required now. Re-open only if later hands-on contradicts that evidence.",
)

# Decisions: close correction-only tuning/raster statuses.
rep(
    "docs/DECISIONS.md",
    "| Balance during feel correction | LOCKED | no tuning-number changes in the correction pass unless separately approved from evidence |",
    "| Balance through feel correction | COMPLETE | no tuning-number changes occurred; current provisional values remain unchanged pending later evidence |",
)
rep(
    "docs/DECISIONS.md",
    "| Charged raster fallback | CONDITIONAL | allowed only if label-hidden visual audit still reads as “Basic with glow” |",
    "| Charged raster fallback | NOT REQUIRED NOW | r3 label-hidden review passed with runtime treatment; reopen only if later hands-on contradicts it |",
)

# Gameplay: describe current behavior rather than targets.
rep(
    "docs/GAMEPLAY_SYSTEMS.md",
    "The correction keeps exactly the same mechanic/result contract but changes how the sequence reads:",
    "The merged correction keeps exactly the same mechanic/result contract and changes how the sequence reads:",
)
rep(
    "docs/GAMEPLAY_SYSTEMS.md",
    "Hands-on proved the current immediate-flight presentation is too weak/early.\n\nTarget:",
    "Hands-on proved the old immediate-flight presentation was too weak/early. The merged correction now uses:\n\nCurrent contract:",
)
rep("docs/GAMEPLAY_SYSTEMS.md", "Correction rules:", "Current rules:")
rep(
    "docs/GAMEPLAY_SYSTEMS.md",
    "Only if runtime treatment still fails may a recolored Charged raster variant be added. Preserve geometry, silhouette and tear mechanics.",
    "The label-hidden r3 audit passed with runtime treatment, so a recolored Charged raster is not required now. Preserve geometry, silhouette and tear mechanics if later evidence ever reopens it.",
)

# Infrastructure: correction is no longer the active engineering branch.
rep(
    "docs/INFRASTRUCTURE_STATUS.md",
    "This file states what is **actually present in current `main`** and what the current evidence-backed correction changes.",
    "This file states what is **actually present in current `main`** after the merged evidence-backed Opening Feel Correction.",
)
rep(
    "docs/INFRASTRUCTURE_STATUS.md",
    "The response is the bounded `OPENING_FEEL_CORRECTION_SCOPE.md`.",
    "The response was the bounded `OPENING_FEEL_CORRECTION_SCOPE.md`; that correction is now integrated and validated.",
)
rep(
    "docs/INFRASTRUCTURE_STATUS.md",
    "Do not tune these values in the feel-correction branch. Current deterministic analysis already keeps Charged below break-even.",
    "No tuning occurred in the feel-correction pass. Keep these provisional values unchanged until repeated-use/content-scale evidence justifies a separate balance decision; current deterministic analysis keeps Charged below break-even.",
)
rep(
    "docs/INFRASTRUCTURE_STATUS.md",
    "Runtime architecture is still not the bottleneck; presentation quality is.",
    "Runtime architecture remains outside the critical bottleneck; the current gates are repeated-use product acceptance and real hosted-platform validation.",
)

# Product lifecycle wording.
rep(
    "docs/PRODUCT.md",
    "The project is deliberately **not** a full idle/incremental economy. Current work is not to add another system; it is to make the existing loop feel materially better in the player's hands.",
    "The project is deliberately **not** a full idle/incremental economy. The correction is merged; current work is to validate the corrected loop in repeated hands-on rather than add another system.",
)
rep(
    "docs/PRODUCT.md",
    "The correction should make the electronic part of that fantasy more explicit without losing the soft toy/nostalgia layer.",
    "The merged correction makes the electronic part of that fantasy more explicit without losing the soft toy/nostalgia layer.",
)
rep(
    "docs/PRODUCT.md",
    "Do not mix balance tuning into the current presentation branch. Revisit numbers after corrected hands-on/content-scale simulation.",
    "No balance tuning was mixed into the presentation pass. Keep numbers unchanged through the second hands-on; revisit only from corrected hands-on/content-scale simulation evidence.",
)
rep("docs/PRODUCT.md", "Default solution remains low-production:", "Current merged solution remains low-production:")

# Open questions: leave only genuine future evidence questions.
rep(
    "docs/OPEN_QUESTIONS.md",
    "The first repeated hands-on is complete and has already justified the correction. The unresolved items inside that correction are presentation choices, not mechanics.",
    "The first repeated hands-on justified the correction, which is now merged and reviewed. Remaining items here are evidence/tuning questions for the second hands-on and later hosted/content-scale work.",
)
rep(
    "docs/OPEN_QUESTIONS.md",
    "Only create a dedicated recolored Charged raster if the exact-revision audit still reads as “Basic with glow” after the no-shader runtime pass.",
    "The r3 label-hidden audit passed, so do not create a dedicated recolored Charged raster now. Re-open only if later hands-on contradicts that reviewed result.",
)
rep(
    "docs/OPEN_QUESTIONS.md",
    "Do not change these numbers in the feel-correction branch. After corrected hands-on/content-scale simulation, evidence questions remain:",
    "No balance numbers changed in the feel-correction pass. Keep them unchanged through the second hands-on; after corrected hands-on/content-scale simulation, evidence questions remain:",
)

# Technical direction: current implementation and evidence, not planned correction work.
rep(
    "docs/TECHNICAL_DIRECTION.md",
    "The correction must improve choreography without moving economic truth back into `OpeningScene` tweens.",
    "The merged correction improves choreography without moving economic truth back into `OpeningScene` tweens.",
)
rep(
    "docs/TECHNICAL_DIRECTION.md",
    "- balance numbers are frozen during the feel correction unless separately approved.",
    "- balance numbers stayed unchanged through the feel correction and remain provisional pending later evidence.",
)
rep(
    "docs/TECHNICAL_DIRECTION.md",
    "Current `animateChipReward()` immediately flies tokens and updates HUD during prelude. The correction intentionally changes that presentation contract.\n\nTarget:",
    "The merged correction uses staged reward presentation and bank-on-accept while durable transaction truth remains unchanged.\n\nCurrent contract:",
)
rep(
    "docs/TECHNICAL_DIRECTION.md",
    "The current aura passed previous visual QA but direct hands-on says differentiation is still too weak.\n\nFirst correction remains runtime-driven:",
    "Direct hands-on required stronger differentiation. The merged runtime treatment passed the r3 label-hidden comparison without bespoke pouch raster art:",
)
rep(
    "docs/TECHNICAL_DIRECTION.md",
    "Only if label-hidden audit still reads as Basic should a recolored raster variant be added. Preserve geometry, silhouette and tear mechanics.",
    "No recolored raster is required by the current audit. Re-open one only if later hands-on contradicts the reviewed runtime result; preserve geometry, silhouette and tear mechanics.",
)
rep(
    "docs/TECHNICAL_DIRECTION.md",
    "One new evidence-backed cue is justified:\n\n```text\nchips-collect\n```\n\nIt should be routed through the existing audio abstraction and persistent mute behavior.",
    "The evidence-backed cue is integrated through the existing audio abstraction and persistent mute behavior:\n\n```text\nchips-collect\n```",
)
rep(
    "docs/TECHNICAL_DIRECTION.md",
    "Browser/video regression must cover the matrix in `PROBE_VALIDATION.md`, including grab/tear motion, staged CHIPS, bank/count-up, selector states, Charged differentiation, neon/digital treatment, fast-forward and compact RU layouts.",
    "The r3 browser/video regression covered the matrix in `PROBE_VALIDATION.md`, including grab/tear motion, staged CHIPS, bank/count-up, selector states, Charged differentiation, neon/digital treatment, fast-forward and compact RU layouts; manual artifact review passed.",
)
