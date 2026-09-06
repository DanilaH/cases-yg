from pathlib import Path
import re


def replace(path: str, old: str, new: str, *, required: bool = True) -> None:
    p = Path(path)
    text = p.read_text()
    count = text.count(old)
    if required and count == 0:
        raise SystemExit(f"{path}: missing expected text: {old[:120]!r}")
    if count:
        p.write_text(text.replace(old, new))


def sub(path: str, pattern: str, repl: str, *, required: bool = True) -> None:
    p = Path(path)
    text = p.read_text()
    updated, count = re.subn(pattern, repl, text, count=1, flags=re.S)
    if required and count != 1:
        raise SystemExit(f"{path}: expected one regex match, got {count}: {pattern[:120]!r}")
    if count:
        p.write_text(updated)


# README: current lifecycle and gate.
replace(
    "README.md",
    "**Gameplay Loop Lite V2 is implemented and technically/visually validated. The first repeated hands-on is complete and exposed evidence-backed feel/UI friction. The current pass is the Opening Feel Correction.**",
    "**Gameplay Loop Lite V2 and the Opening Feel Correction are implemented, exact-revision audited, manually reviewed, and merged. The current product gate is the second 20–30 opening hands-on; real Yandex DRAFT follows if that corrected loop is accepted.**",
)
replace("README.md", "Implemented Lite V2 behavior remains unchanged during the correction:", "Implemented Lite V2 mechanics retained through the correction:")
replace("README.md", "Current correction therefore adds **feel, not mechanics**:", "The merged correction adds **feel, not mechanics**:")
replace("README.md", "- 87-test baseline + typecheck/assets/build;", "- 91-test current suite + typecheck/assets/build;")
sub(
    "README.md",
    r"Current order:\n\n1\. implement Opening Feel Correction;\n2\. exact-revision screenshot/video audit \+ manual review;\n3\. second 20–30 opening hands-on;\n4\. real hosted Yandex DRAFT;\n5\. content expansion\.",
    "Current order:\n\n1. second 20–30 opening hands-on on the merged corrected build;\n2. if accepted, real hosted Yandex DRAFT;\n3. decide the deferred Drop/odds/progress info surface from evidence;\n4. content expansion only after hosted validation.",
)
replace(
    "README.md",
    "These are starting values, not final release balance, and are **frozen during the feel-correction branch**.",
    "These are starting values, not final release balance. They stayed unchanged through the feel-correction pass and remain provisional pending repeated-use/content-scale evidence.",
)

# Decision ledger: merged correction is runtime truth; hands-on is the open gate.
replace(
    "docs/DECISIONS.md",
    "| Current stage | LOCKED | First direct hands-on found presentation/input friction; run the evidence-backed **Opening Feel Correction** defined in `OPENING_FEEL_CORRECTION_SCOPE.md`, re-audit, re-test hands-on, then real Yandex DRAFT |",
    "| Current stage | LOCKED | Opening Feel Correction is merged and exact-revision/manual-review approved; current gate is the second **20–30 opening hands-on**, then real Yandex DRAFT if accepted |",
)
replace("docs/DECISIONS.md", "## Opening Feel Correction — LOCKED NEXT", "## Opening Feel Correction — CURRENT RUNTIME")
labels = [
    "Player-facing `RESULT LOCKED`", "Reveal acceleration", "Tear-release safety", "Pouch tactile feel", "Reward arrival",
    "CHIPS staging", "Charged cost presentation", "CHIPS bank order", "CHIPS HUD", "CHIPS sound", "Charged-ready feedback",
    "Duplicate tactile conversion", "Signal presentation", "Basic/Charged selector", "Unaffordable Charged attempt", "Charged differentiation",
    "Callout readability", "Controlled micro-variation", "Art-language principle", "Hotline Miami reference", "Accent typography",
    "Neon implementation", "Rarity shimmer",
]
p = Path("docs/DECISIONS.md")
lines = p.read_text().splitlines()
for i, line in enumerate(lines):
    for label in labels:
        if line.startswith(f"| {label} | LOCKED NEXT |"):
            lines[i] = line.replace("| LOCKED NEXT |", "| CURRENT RUNTIME |", 1)
            break
p.write_text("\n".join(lines) + "\n")
replace(
    "docs/DECISIONS.md",
    "| Feel correction exact-revision audit | LOCKED NEXT | combined branch must receive screenshot/video + manual visual review |",
    "| Feel correction exact-revision audit | COMPLETE | r3 exact-revision browser/video audit + manual artifact review passed on the audited product tree |",
)
replace(
    "docs/DECISIONS.md",
    "| Second repeated hands-on | LOCKED NEXT | 20–30 openings after correction before hosted DRAFT |",
    "| Second repeated hands-on | OPEN | **current product gate**: 20–30 normal openings on the merged corrected build before hosted DRAFT |",
)
replace(
    "docs/DECISIONS.md",
    "> **GO: implement the evidence-backed Opening Feel Correction, exact-revision audit it, then run 20–30 repeated openings. If accepted, proceed to real Yandex DRAFT. Do not add new mechanics/content in this pass.**",
    "> **GO: run the second 20–30 opening hands-on on the merged/audited correction. If accepted, proceed to real Yandex DRAFT. Do not add mechanics/content or tune balance before that evidence.**",
)

# Roadmap.
replace(
    "docs/IMPLEMENTATION_ROADMAP.md",
    "1. **Opening Feel Correction — CURRENT, EVIDENCE-BACKED**\n2. **Exact-revision combined visual/video audit — REQUIRED**\n3. **Second direct 20–30 opening hands-on — REQUIRED**",
    "1. **Opening Feel Correction — COMPLETE**\n2. **Exact-revision combined visual/video audit + manual review — COMPLETE**\n3. **Second direct 20–30 opening hands-on — CURRENT REQUIRED GATE**",
)
replace("docs/IMPLEMENTATION_ROADMAP.md", "- 87 unit tests;", "- 91 unit tests;")
replace("docs/IMPLEMENTATION_ROADMAP.md", "# Phase 2.1 — Opening Feel Correction — CURRENT", "# Phase 2.1 — Opening Feel Correction — COMPLETE")
replace("docs/IMPLEMENTATION_ROADMAP.md", "# Phase 2.2 — combined correction validation — REQUIRED", "# Phase 2.2 — combined correction validation — COMPLETE")
replace("docs/IMPLEMENTATION_ROADMAP.md", "# Phase 2.3 — second hands-on — REQUIRED", "# Phase 2.3 — second hands-on — CURRENT REQUIRED GATE")
replace(
    "docs/IMPLEMENTATION_ROADMAP.md",
    "After the corrected exact revision is merged, run another **20–30 normal openings**.",
    "The corrected exact revision is merged and approved. Now run **20–30 normal openings**.",
)
replace(
    "docs/IMPLEMENTATION_ROADMAP.md",
    "> **Current next action: improve feel of the existing loop, prove the combined correction, re-test it, then go to Yandex DRAFT.**",
    "> **Current next action: re-test the merged corrected loop with 20–30 normal openings; if accepted, go to Yandex DRAFT.**",
)

# Validation evidence.
sub(
    "docs/PROBE_VALIDATION.md",
    r"- Opening Feel Correction: \*\*LOCKED NEXT\*\*;\n- corrected exact-revision browser/video review: \*\*PENDING\*\*;\n- second 20–30 opening hands-on: \*\*PENDING\*\*;\n- real Yandex DRAFT: \*\*BLOCKED until corrected hands-on acceptance\*\*\.",
    "- Opening Feel Correction: **COMPLETE / MERGED**;\n- corrected exact-revision browser/video audit: **PASS**;\n- corrected manual screenshot/video review: **PASS**;\n- audited product head: `89f2a722942886cf5a5aae3acfaf5b70e15c98e3`;\n- r3 audit artifact digest: `sha256:7e352be95a2eea913ab713bcdce05107d3f3df38a7acb93ca44072ceb82d0a41`;\n- squash-merge product tree verified identical to the audited tree;\n- post-merge main CI #170: **PASS**;\n- second 20–30 opening hands-on: **CURRENT / PENDING**;\n- real Yandex DRAFT: **BLOCKED until corrected hands-on acceptance**.",
)
replace("docs/PROBE_VALIDATION.md", "Current suite baseline: **87 unit tests**", "Current suite baseline: **91 unit tests**")
replace("docs/PROBE_VALIDATION.md", "After exact-revision visual approval, run **20–30 normal openings**.", "Exact-revision visual approval is complete. Current gate: run **20–30 normal openings**.")

# Infrastructure current state.
replace("docs/INFRASTRUCTURE_STATUS.md", "- 87-test baseline;", "- 91-test current suite;")
replace("docs/INFRASTRUCTURE_STATUS.md", "## Opening Feel Correction — NEXT IMPLEMENTATION", "## Opening Feel Correction — INTEGRATED")
replace("docs/INFRASTRUCTURE_STATUS.md", "Infrastructure impact is deliberately small.", "Infrastructure impact was deliberately small and is now integrated.")
replace("docs/INFRASTRUCTURE_STATUS.md", "### Small additions/changes allowed", "### Integrated additions/changes")
replace("docs/INFRASTRUCTURE_STATUS.md", "## Current provisional runtime tuning — FROZEN FOR THIS PASS", "## Current provisional runtime tuning — UNCHANGED THROUGH CORRECTION")
sub(
    "docs/INFRASTRUCTURE_STATUS.md",
    r"1\. implement Opening Feel Correction;\n2\. full typecheck/tests/assets/build;\n3\. exact-revision screenshot/video audit;\n4\. manual artifact review;\n5\. second 20–30 opening hands-on;\n6\. real Yandex DRAFT;\n7\. content expansion\.",
    "1. second 20–30 opening hands-on on merged corrected `main`;\n2. if accepted, real Yandex DRAFT;\n3. fix only hosted-platform defects;\n4. content expansion.",
)
replace(
    "docs/INFRASTRUCTURE_STATUS.md",
    "> **Opening Feel Correction → exact-revision review → second hands-on → real Yandex DRAFT → content expansion.**",
    "> **Second hands-on → real Yandex DRAFT → content expansion.**",
)

# Product lifecycle.
replace("docs/PRODUCT.md", "### Stage B2 — Opening Feel Correction — CURRENT", "### Stage B2 — Opening Feel Correction — COMPLETE")
replace(
    "docs/PRODUCT.md",
    "After implementation: exact-revision video/screenshot review → second 20–30 opening hands-on.",
    "Implementation, exact-revision video/screenshot audit and manual review are complete. **Current gate: second 20–30 opening hands-on.**",
)
replace("docs/PRODUCT.md", "## 4. Core interaction — mechanics unchanged, choreography improving", "## 4. Core interaction — mechanics unchanged, corrected choreography integrated")
replace("docs/PRODUCT.md", "The feel correction changes the presentation chain to read more physically:", "The merged feel correction changed the presentation chain to read more physically:")
replace("docs/PRODUCT.md", "## 6. Current provisional tuning — FROZEN DURING CORRECTION", "## 6. Current provisional tuning — UNCHANGED THROUGH CORRECTION")
replace(
    "docs/PRODUCT.md",
    "Only if label-hidden visual audit still fails may a recolored Charged raster variant be produced. Do not redesign pouch geometry.",
    "The label-hidden exact-revision audit passed with runtime treatment, so no recolored Charged raster is required now. Re-open that asset only if later hands-on contradicts the audit. Do not redesign pouch geometry.",
)

# Gameplay systems: implemented presentation contract.
replace(
    "docs/GAMEPLAY_SYSTEMS.md",
    "This is the canonical specification for the implemented gameplay loop plus the evidence-backed Opening Feel Correction currently queued for implementation.",
    "This is the canonical specification for the implemented gameplay loop plus the evidence-backed Opening Feel Correction now merged in current `main`.",
)
for old, new in [
    ("## Locked-next feel choreography", "## Current feel choreography"),
    ("## 3.2 Locked-next CHIPS presentation", "## 3.2 Current CHIPS presentation"),
    ("## Locked-next Signal presentation", "## Current Signal presentation"),
    ("# 9. Input / pacing — LOCKED NEXT", "# 9. Input / pacing — CURRENT RUNTIME"),
    ("# 10. Opening UI — LOCKED NEXT", "# 10. Opening UI — CURRENT RUNTIME"),
    ("# 11. Charged presentation — LOCKED NEXT", "# 11. Charged presentation — CURRENT RUNTIME"),
    ("# 12. Digital / neon visual language — LOCKED NEXT", "# 12. Digital / neon visual language — CURRENT RUNTIME"),
    ("# 13. Callouts / variation — LOCKED NEXT", "# 13. Callouts / variation — CURRENT RUNTIME"),
]:
    replace("docs/GAMEPLAY_SYSTEMS.md", old, new)
replace("docs/GAMEPLAY_SYSTEMS.md", "Locked-next presentation:", "Current presentation:")
replace("docs/GAMEPLAY_SYSTEMS.md", "Preferred gameplay hierarchy moves to a left-side rail:", "Current gameplay hierarchy uses a left-side rail:")
replace("docs/GAMEPLAY_SYSTEMS.md", "Use stronger runtime treatment first:", "Current merged runtime treatment uses:")
replace(
    "docs/GAMEPLAY_SYSTEMS.md",
    "One bundled digital/pixel-like accent font is used only for short electronic system information",
    "Bundled Press Start 2P accent typography is used only for short electronic system information",
)
sub(
    "docs/GAMEPLAY_SYSTEMS.md",
    r"Current gate:\n\n> implement `OPENING_FEEL_CORRECTION_SCOPE\.md` → exact-revision screenshot/video \+ manual review → second 20–30 opening hands-on\.",
    "Correction implementation + exact-revision screenshot/video + manual review are complete.\n\nCurrent gate:\n\n> **second 20–30 opening hands-on on merged `main`**.",
)

# Technical direction.
replace(
    "docs/TECHNICAL_DIRECTION.md",
    "Gameplay Loop Lite V2 is implemented. The first direct hands-on found presentation/input friction, so the immediate technical task is the bounded **Opening Feel Correction** in `OPENING_FEEL_CORRECTION_SCOPE.md`.",
    "Gameplay Loop Lite V2 and the bounded **Opening Feel Correction** are implemented in current `main`. Exact-revision browser/video and manual visual review passed; the immediate gate is second repeated hands-on, not more architecture work.",
)
replace("docs/TECHNICAL_DIRECTION.md", "      audio.ts\n    data/", "      audio.ts\n      presentationSkip.ts\n    data/")
replace("docs/TECHNICAL_DIRECTION.md", "## 7. Presentation correction boundary", "## 7. Current presentation boundary")
replace("docs/TECHNICAL_DIRECTION.md", "Preferred new gameplay hierarchy is a left-side rail:", "Current gameplay hierarchy is a left-side rail:")
replace("docs/TECHNICAL_DIRECTION.md", "## 15. Testing requirements for correction", "## 15. Current regression coverage")
replace(
    "docs/TECHNICAL_DIRECTION.md",
    "Keep existing 87-test baseline and add/adjust focused coverage where practical for:",
    "Current suite is 91 tests plus typecheck/assets/build. Focused coverage and the r3 exact-revision audit cover:",
)

# Open questions: resolve choices proven by r3, leave genuine future evidence questions open.
replace(
    "docs/OPEN_QUESTIONS.md",
    "This file contains only questions that are **actually unresolved now**. Lite V2 mechanics and the Opening Feel Correction scope are already decided; do not treat implemented or locked-next behavior as TODO design debate.",
    "This file contains only questions that are **actually unresolved now**. Lite V2 mechanics and the Opening Feel Correction are implemented; do not treat merged behavior as TODO design debate.",
)
replace("docs/OPEN_QUESTIONS.md", "# 1. Opening Feel Correction — CURRENT IMPLEMENTATION QUESTION SET", "# 1. Post-correction evidence question set")
replace("docs/OPEN_QUESTIONS.md", "## 1.1 Accent digital/pixel font — OPEN VISUAL CHOICE", "## 1.1 Accent digital/pixel font — RESOLVED FOR CURRENT BUILD")
sub(
    "docs/OPEN_QUESTIONS.md",
    r"Need one bundled accent typeface for short electronic UI only:.*?Resolve by rendering real game states, not by choosing from a font specimen alone\.",
    "Current implementation uses locally bundled **Press Start 2P** for short electronic UI only. The package is license-safe (`OFL-1.1`), exact-revision RU/EN 900/1024 review passed, and long instructions/navigation remain in readable sans. Re-open only if second hands-on finds an actual readability/fatigue problem.",
)
replace("docs/OPEN_QUESTIONS.md", "## 1.2 Charged palette / iridescence intensity — OPEN VISUAL CHOICE", "## 1.2 Charged palette / iridescence intensity — RESOLVED FOR CURRENT BUILD")
sub(
    "docs/OPEN_QUESTIONS.md",
    r"Direction is locked: stronger cyan/violet electronic treatment with restrained pink/iridescent accents\..*?Use label-hidden Basic vs Charged comparison as the acceptance test\.",
    "The merged cyan/violet runtime treatment with restrained iridescent accents passed the label-hidden exact-revision comparison and did not require new pouch art. Re-open intensity only if repeated hands-on finds Charged unclear, visually tiring, or in conflict with rarity hierarchy.",
)
replace("docs/OPEN_QUESTIONS.md", "## 1.3 Dedicated Charged pouch raster — CONDITIONAL ONLY", "## 1.3 Dedicated Charged pouch raster — NOT REQUIRED NOW")
replace("docs/OPEN_QUESTIONS.md", "## 1.4 `charged-ready` SFX — OPTIONAL", "## 1.4 `charged-ready` SFX — PARKED")
replace("docs/OPEN_QUESTIONS.md", "Dedicated `chips-collect` SFX is now **required** from hands-on evidence.", "Dedicated `chips-collect` SFX is integrated from hands-on evidence.")
replace("docs/OPEN_QUESTIONS.md", "# 2. Lite V2 balance — OPEN FOR TUNING, FROZEN DURING FEEL CORRECTION", "# 2. Lite V2 balance — OPEN FOR TUNING, UNCHANGED THROUGH FEEL CORRECTION")
replace("docs/OPEN_QUESTIONS.md", "No custom WebGL shader in the current correction.", "No custom WebGL shader was added in the correction.")

# Asset manifest: actual integrated asset truth.
replace("docs/ASSET_MANIFEST.md", "public/assets/audio/duplicate.mp3\npublic/assets/audio/signal-gain.mp3", "public/assets/audio/duplicate.mp3\npublic/assets/audio/chips-collect.mp3\npublic/assets/audio/signal-gain.mp3")
replace("docs/ASSET_MANIFEST.md", "## Opening Feel Correction — REQUIRED NEW AUDIO", "## Opening Feel Correction audio — INTEGRATED")
replace("docs/ASSET_MANIFEST.md", "# 6. Opening Feel Correction — VISUAL ASSET IMPACT", "# 6. Opening Feel Correction — INTEGRATED VISUAL ASSET IMPACT")
replace("docs/ASSET_MANIFEST.md", "## 6.1 Digital/pixel accent font — REQUIRED DESIGN ASSET", "## 6.1 Digital/pixel accent font — INTEGRATED")
sub(
    "docs/ASSET_MANIFEST.md",
    r"Add one locally bundled, license-safe accent font after visual comparison\..*?Exact font file/name is intentionally unresolved until real 900/1024 RU/EN samples are reviewed\.",
    "Current runtime bundles **Press Start 2P** through `@fontsource/press-start-2p` (`OFL-1.1`). It is used only for short electronic UI such as CHIPS/Signal/Charged system data; long instructions/navigation/body copy remain readable sans. Exact-revision 900/1024 RU/EN samples passed manual review.",
)
replace("docs/ASSET_MANIFEST.md", "## 6.4 Charged pouch raster fallback — CONDITIONAL", "## 6.4 Charged pouch raster fallback — NOT REQUIRED NOW")
replace("docs/ASSET_MANIFEST.md", "# 7. Corrected runtime UI / FX target", "# 7. Corrected runtime UI / FX — CURRENT")
replace("docs/ASSET_MANIFEST.md", "The correction should be achievable mostly with runtime primitives:", "The merged correction is implemented mostly with runtime primitives:")

# Scope contract becomes historical/current implementation record without rewriting the contract itself.
replace(
    "docs/OPENING_FEEL_CORRECTION_SCOPE.md",
    "Status: **LOCKED IMPLEMENTATION SCOPE — NEXT PRODUCT PASS**",
    "Status: **IMPLEMENTED / EXACT-REVISION VALIDATED**\n\nCompletion record: implementation merged via PR #34. Audited product head `89f2a722942886cf5a5aae3acfaf5b70e15c98e3`; r3 browser/video artifact + manual visual review passed; squash-merged `main` has the identical product tree; post-merge CI #170 passed. **Current gate: second 20–30 opening hands-on.**",
)
