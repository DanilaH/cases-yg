from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    p = Path(path)
    text = p.read_text(encoding="utf-8")
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{path}: expected exactly one match, got {count}: {old[:100]!r}")
    p.write_text(text.replace(old, new, 1), encoding="utf-8")


def replace_between(path: str, start: str, end: str, replacement: str) -> None:
    p = Path(path)
    text = p.read_text(encoding="utf-8")
    i = text.find(start)
    if i < 0:
        raise SystemExit(f"{path}: start marker not found: {start!r}")
    j = text.find(end, i)
    if j < 0:
        raise SystemExit(f"{path}: end marker not found: {end!r}")
    p.write_text(text[:i] + replacement + text[j:], encoding="utf-8")


# README — current product state, runtime cues and acceptance order.
replace_once(
    "README.md",
    "**Gameplay Loop Lite V2 and the Opening Feel Correction are implemented, exact-revision audited, manually reviewed, and merged. The current product gate is the second 20–30 opening hands-on; real Yandex DRAFT follows if that corrected loop is accepted.**",
    "**Gameplay Loop Lite V2, the Opening Feel Correction and the bounded post-hands-on UI/feel follow-ups are implemented, exact-revision audited, manually reviewed, and merged. The second repeated-use hands-on produced narrow findings that are now fixed. The current product gate is final hands-on acceptance of the latest merged build; real Yandex DRAFT follows if accepted.**",
)
replace_once("README.md", "- one dedicated `chips-collect` SFX;", "- synthesized `chip-clack` banking cue plus a synth-only `pouch-grab` cue;")
replace_once("README.md", "**after the second corrected hands-on**", "**after final hands-on acceptance**")
replace_once("README.md", "- 91-test current suite + typecheck/assets/build;", "- 108-test current suite + typecheck/assets/build;")
replace_between(
    "README.md",
    "Completed:\n",
    "\n## Production-grade boundaries already present",
    """Completed:\n\n- Lite V2 engine/save/recovery;\n- Opening economy presentation;\n- 108-test current suite + typecheck/assets/build;\n- original exact-revision browser/video audit + manual review;\n- Opening Feel Correction + Charged-ready correction;\n- first repeated hands-on;\n- second repeated hands-on — complete with narrow follow-up findings;\n- bounded follow-up fixes through PR #45, exact-revision audited and merged;\n- latest audited product tree verified identical to merged `main`;\n- post-merge CI #248 — PASS.\n\nCurrent order:\n\n1. final hands-on acceptance on the latest merged build;\n2. if accepted, real hosted Yandex DRAFT;\n3. decide the deferred Drop/odds/progress info surface from evidence;\n4. content expansion only after hosted validation.\n\nDo not add new meta systems/content or tune the economy before final hands-on acceptance and hosted DRAFT provide evidence.\n""",
)

# DECISIONS — canonical current state.
replace_once(
    "docs/DECISIONS.md",
    "| Current stage | LOCKED | Opening Feel Correction is merged and exact-revision/manual-review approved; current gate is the second **20–30 opening hands-on**, then real Yandex DRAFT if accepted |",
    "| Current stage | LOCKED | Second repeated-use hands-on completed with narrow findings; bounded follow-up polish through PR #45 is merged and exact-revision/manual-review approved. Current gate is **final hands-on acceptance** of the latest build, then real Yandex DRAFT if accepted |",
)
replace_once(
    "docs/DECISIONS.md",
    "| Pouch tactile feel | CURRENT RUNTIME | immediate grab response, progressive tension, short tear recoil/snap; no physics |",
    "| Pouch tactile feel | CURRENT RUNTIME | immediate grab response with synth-only `pouch-grab` pop/zip cue, progressive tension, short tear recoil/snap; no physics |",
)
replace_once(
    "docs/DECISIONS.md",
    "| Reward arrival | CURRENT RUNTIME | preserve established emerge/overshoot/settle, improve anticipation/rarity impact where useful |",
    "| Reward arrival | CURRENT RUNTIME | preserve established emerge/overshoot/settle; reward tray enters once and remains visually continuous while the result panel arrives on a later beat |\n| Result rarity hierarchy | CURRENT RUNTIME | larger rarity capsule + rarity-tinted result border; rarity remains secondary to item name but no longer reads as incidental metadata |",
)
replace_once(
    "docs/DECISIONS.md",
    "| CHIPS staging | CURRENT RUNTIME | earned base/cache/recycle first read beside result; visual banking occurs on result acceptance |",
    "| CHIPS staging | CURRENT RUNTIME | earned base/cache/recycle first read beside result in a persistent tray; visual banking occurs on result acceptance |",
)
replace_once(
    "docs/DECISIONS.md",
    "| CHIPS sound | CURRENT RUNTIME | add one concise reusable `chips-collect` cue; no sound per cache tier |",
    "| CHIPS sound | CURRENT RUNTIME | synthesized percussive `chip-clack` follows CHIPS banking with bounded audio density; no sound per cache tier |",
)
replace_once(
    "docs/DECISIONS.md",
    "| Duplicate tactile conversion | CURRENT RUNTIME | duplicate visibly converts into recycle CHIPS + one Signal transfer after collectible reveal |",
    "| Duplicate tactile conversion | CURRENT RUNTIME | duplicate visibly converts into rarity-aware recycle feedback + CHIPS + one Signal transfer after collectible reveal |",
)
replace_once(
    "docs/DECISIONS.md",
    "| Drop/odds/progress info surface | PARKED NEXT CANDIDATE | after corrected hands-on, consider one on-demand drawer reading exact odds from typed config and showing family/discovered/unknown state |",
    "| Drop/odds/progress info surface | PARKED NEXT CANDIDATE | after final hands-on acceptance, consider one on-demand drawer reading exact odds from typed config and showing family/discovered/unknown state |",
)
replace_once(
    "docs/DECISIONS.md",
    "| Real hosted validation | OPEN | Yandex DRAFT follows corrected hands-on and exact-revision approval |",
    "| Real hosted validation | OPEN | Yandex DRAFT follows final hands-on acceptance of the latest merged/audited build |",
)
replace_once(
    "docs/DECISIONS.md",
    "| Second repeated hands-on | OPEN | **current product gate**: 20–30 normal openings on the merged corrected build before hosted DRAFT |\n| Real Yandex DRAFT | OPEN | next external gate after second hands-on acceptance |",
    "| Second repeated hands-on | COMPLETE WITH FINDINGS | repeated-use feedback exposed narrow UI/feel issues; no economy/content expansion was justified |\n| Post-hands-on follow-up polish | COMPLETE | transition/input/resize/error-state fixes plus reward continuity, `pouch-grab`, stronger rarity hierarchy and semantic reward colors were independently audited and merged through PR #45 |\n| Final hands-on acceptance | OPEN | **current product gate**: play the latest merged build and judge the corrected tactile/audio/result feel in normal repetition |\n| Real Yandex DRAFT | OPEN | next external gate after final hands-on acceptance |",
)
replace_once("docs/DECISIONS.md", "- odds/Drop-info drawer until the feel correction is re-tested.", "- odds/Drop-info drawer until final hands-on acceptance.")
replace_once(
    "docs/DECISIONS.md",
    "> **GO: run the second 20–30 opening hands-on on the merged/audited correction. If accepted, proceed to real Yandex DRAFT. Do not add mechanics/content or tune balance before that evidence.**",
    "> **GO: run final hands-on acceptance on the latest merged/audited build. If accepted, proceed to real Yandex DRAFT. Do not add mechanics/content or tune balance before that evidence.**",
)

# IMPLEMENTATION_ROADMAP — advance stage without erasing history.
replace_between(
    "docs/IMPLEMENTATION_ROADMAP.md",
    "## Current execution order\n",
    "\n# Phase 0 — established opener baseline — COMPLETE",
    """## Current execution order\n\n1. **Opening Feel Correction — COMPLETE**\n2. **Exact-revision combined visual/video audit + manual review — COMPLETE**\n3. **Second repeated-use hands-on — COMPLETE WITH FOLLOW-UP FINDINGS**\n4. **Bounded post-hands-on UI/feel polish — COMPLETE / AUDITED / MERGED**\n5. **Final hands-on acceptance on latest merged build — CURRENT REQUIRED GATE**\n6. **Real Yandex DRAFT validation — NEXT EXTERNAL GATE**\n7. **Content/release expansion — BLOCKED until draft passes**\n8. **Public release hardening**\n\nThe repeated-use passes have already produced and closed specific presentation/input findings. The correct response remains bounded correction of evidence-backed defects, not another gameplay-system pass.\n\nDo not change balance numbers, expand content or add new meta systems before final hands-on acceptance + hosted DRAFT provide evidence.\n\n---\n""",
)
replace_once("docs/IMPLEMENTATION_ROADMAP.md", "- 91 unit tests;", "- 108 unit tests;")
replace_once("docs/IMPLEMENTATION_ROADMAP.md", "- one `chips-collect` SFX;", "- one bounded synthesized `chip-clack` CHIPS-banking cue;")
replace_between(
    "docs/IMPLEMENTATION_ROADMAP.md",
    "# Phase 2.3 — second hands-on — CURRENT REQUIRED GATE\n",
    "# Deferred information pass — NOT PART OF 2.1",
    """# Phase 2.3 — second repeated-use hands-on — COMPLETE WITH FOLLOW-UP FINDINGS\n\nThe corrected opener was played again rather than being approved from automation alone. The repeated-use pass and the independent pre-hands-on reviews found narrow presentation/input issues, not a need for new mechanics or balance changes.\n\nEvidence-backed findings included:\n\n- abrupt result/banking → idle handoff;\n- resize during active banking leaving stale wide geometry;\n- weak portrait orientation blocker;\n- one-gesture → two-actions result input race;\n- mute unavailable before the first opening;\n- low-contrast load-failure UI;\n- reward tray replaying its entry when result UI appeared;\n- star grab lacking a material interaction cue;\n- rarity metadata under-emphasized in the result panel;\n- reward rows too visually uniform to communicate cache/recycle/Signal semantics.\n\nNo finding justified balance tuning, new content, odds UI, Quick Reveal, x5 or a larger scene architecture rewrite.\n\n---\n\n# Phase 2.4 — bounded post-hands-on polish — COMPLETE\n\nThe follow-up fixes were implemented in small patches and independently re-audited. Current merged runtime now includes:\n\n- smooth result/banking → idle handoff;\n- safe compact resize policy during banking;\n- polished orientation/load-failure states;\n- one physical gesture → one semantic action;\n- mute available before the first opening;\n- reward tray continuity: tray appears once, then result panel enters on a later beat;\n- synth-only `pouch-grab` pop/zip cue;\n- stronger rarity capsule + rarity-tinted result border;\n- semantic reward-row colors and rarity-aware recycle copy.\n\nLatest reward/result polish merged via PR #45. Audited product head `afeb2ac50cba02cec68dcabd60a18e16ced97094`; audited product tree `8a8375b27c2f4001ab4160922d447d7b56d5f36f`; R3 normal-flow browser/video audit passed; squash merge `2837872d6ff9ffb3f6e492725fb034bfc82f5f4a` has the identical tree; post-merge CI #248 passed.\n\nThe full current baseline remains 108 unit tests + typecheck + asset self-test/validation + production build.\n\n---\n\n# Phase 2.5 — final hands-on acceptance — CURRENT REQUIRED GATE\n\nPlay the latest merged build normally before moving to hosted validation. This is not another open-ended polish pass. The goal is to confirm that the fixes feel right in real repetition.\n\nJudge especially:\n\n- whether the new star-grab `pouch-grab` cue sounds satisfying rather than cheap or irritating;\n- whether reward tray → result panel staging now reads as one continuous composition;\n- whether rarity is easier to read without overpowering the collectible name;\n- whether cache/recycle/Signal colors improve scanning without turning the tray into a rainbow;\n- whether tap-to-speed-up → separate tap-to-collect remains natural;\n- whether CHIPS banking and `chip-clack` stay pleasant across repeated openings;\n- whether any remaining delay or animation becomes irritating over a normal session.\n\nIf this passes, stop polishing the same loop and go to hosted DRAFT. If one narrow issue remains, make the smallest correction and re-audit only the affected behavior plus regression essentials.\n\n---\n\n# Deferred information pass — NOT PART OF 2.1",
)
replace_once("docs/IMPLEMENTATION_ROADMAP.md", "After the feel correction is re-tested, consider an on-demand information drawer:", "After final hands-on acceptance, consider an on-demand information drawer:")
replace_once("docs/IMPLEMENTATION_ROADMAP.md", "Run `docs/YANDEX_SLICE_VALIDATION.md` only after Phase 2.3 acceptance.", "Run `docs/YANDEX_SLICE_VALIDATION.md` only after Phase 2.5 acceptance.")
replace_once(
    "docs/IMPLEMENTATION_ROADMAP.md",
    "> **Current next action: re-test the merged corrected loop with 20–30 normal openings; if accepted, go to Yandex DRAFT.**",
    "> **Current next action: run final hands-on acceptance on the latest merged/audited build; if accepted, go to Yandex DRAFT.**",
)

# OPENING_FEEL_CORRECTION_SCOPE — preserve original scope, append current follow-up record.
replace_once("docs/OPENING_FEEL_CORRECTION_SCOPE.md", "Status: **IMPLEMENTED / EXACT-REVISION VALIDATED**", "Status: **IMPLEMENTED / EXACT-REVISION VALIDATED / POST-HANDS-ON FOLLOW-UP MERGED**")
replace_once(
    "docs/OPENING_FEEL_CORRECTION_SCOPE.md",
    "Completion record: implementation merged via PR #34. Audited product head `89f2a722942886cf5a5aae3acfaf5b70e15c98e3`; r3 browser/video artifact + manual visual review passed; squash-merged `main` has the identical product tree; post-merge CI #170 passed. **Current gate: second 20–30 opening hands-on.**",
    "Completion record: the original correction merged via PR #34 and passed its exact-revision/manual-review gate. The second repeated-use hands-on then produced narrow follow-up findings. Those bounded fixes are now merged through PR #45; latest audited product head `afeb2ac50cba02cec68dcabd60a18e16ced97094`, audited product tree `8a8375b27c2f4001ab4160922d447d7b56d5f36f`, merged `main` `2837872d6ff9ffb3f6e492725fb034bfc82f5f4a` with identical tree, post-merge CI #248 PASS. **Current gate: final hands-on acceptance, then real Yandex DRAFT if accepted.**",
)
replace_once(
    "docs/OPENING_FEEL_CORRECTION_SCOPE.md",
    "Small utility assets directly required by feel are allowed: the chosen bundled accent font and one concise `chips-collect` SFX. This is **not** a new art-production pass.",
    "Small utility assets directly required by feel are allowed: the bundled accent font and concise audio feedback through the existing audio abstraction. Current runtime uses synthesized `chip-clack` for CHIPS banking and synth-only `pouch-grab` for star grab; no reviewed MP3 is required for either cue. This is **not** a new art-production pass.",
)
replace_once("docs/OPENING_FEEL_CORRECTION_SCOPE.md", "a **separate follow-up candidate after this feel pass is re-tested**", "a **separate follow-up candidate after final hands-on acceptance**")
insert_marker = "---\n\n# 3. Input and pacing — highest priority"
insert_text = """---\n\n## 2.1 Post-hands-on bounded follow-up — COMPLETE\n\nThe second repeated-use pass did not reopen mechanics or balance. It produced a bounded presentation/input cleanup that is now part of current runtime:\n\n- reward tray enters once and remains continuous while the result panel appears later;\n- result rarity is reinforced by a larger capsule and rarity-tinted border;\n- reward rows use semantic colors, including rarity-aware recycle copy;\n- star grab has a short synth-only `pouch-grab` material cue;\n- result/input/resize/error-state edge cases found by independent audits were corrected without changing transaction semantics.\n\nThe latest exact normal-flow audit explicitly covered fresh-save drag → reveal → reward staging → result on EN 1280 and RU 900, plus a dense four-row EPIC/cache/recycle/Signal stress case.\n\n---\n\n# 3. Input and pacing — highest priority"""
replace_once("docs/OPENING_FEEL_CORRECTION_SCOPE.md", insert_marker, insert_text)

# PROBE_VALIDATION — latest proof record + current gate.
replace_between(
    "docs/PROBE_VALIDATION.md",
    "Current status:\n",
    "Canonical correction scope: `OPENING_FEEL_CORRECTION_SCOPE.md`.",
    """Current status:\n\n- Lite V2 implementation: **COMPLETE**;\n- technical tests/build/assets: **PASS**;\n- original exact-revision browser audit + manual review: **PASS**;\n- first repeated-use hands-on: **COMPLETE WITH FINDINGS**;\n- Opening Feel Correction: **COMPLETE / MERGED**;\n- second repeated-use hands-on: **COMPLETE WITH NARROW FOLLOW-UP FINDINGS**;\n- bounded post-hands-on transition/input/error-state/UI polish: **COMPLETE / MERGED**;\n- latest reward/result feel polish PR #45: **MERGED**;\n- latest audited product head: `afeb2ac50cba02cec68dcabd60a18e16ced97094`;\n- latest audited product tree: `8a8375b27c2f4001ab4160922d447d7b56d5f36f`;\n- R3 normal-flow audit artifact digest: `sha256:86f19d7a564b10d5fdf6228b096084b6b8f7c82a823553647c0b4da0dec3bd83`;\n- squash-merged `main`: `2837872d6ff9ffb3f6e492725fb034bfc82f5f4a`, identical audited tree;\n- post-merge main CI #248: **PASS**;\n- current suite baseline: **108 unit tests** + typecheck + asset self-test/validation + production build;\n- final hands-on acceptance: **CURRENT / PENDING**;\n- real Yandex DRAFT: **BLOCKED until final hands-on acceptance**.\n\nCanonical correction scope: `OPENING_FEEL_CORRECTION_SCOPE.md`.""",
)
replace_once("docs/PROBE_VALIDATION.md", "Current suite baseline: **91 unit tests** plus typecheck, asset self-test/validation and production build.", "Current suite baseline: **108 unit tests** plus typecheck, asset self-test/validation and production build.")
replace_once("docs/PROBE_VALIDATION.md", "after corrected hands-on.", "after final hands-on acceptance.")

# PRODUCT — execution stage.
replace_once(
    "docs/PRODUCT.md",
    "The project is deliberately **not** a full idle/incremental economy. The correction is merged; current work is to validate the corrected loop in repeated hands-on rather than add another system.",
    "The project is deliberately **not** a full idle/incremental economy. The correction and bounded post-hands-on follow-ups are merged; current work is final hands-on acceptance of the latest audited loop rather than adding another system.",
)
replace_once("docs/PRODUCT.md", "### Stage B2 — Opening Feel Correction — COMPLETE", "### Stage B2 — Opening Feel Correction + bounded follow-up polish — COMPLETE")
replace_once(
    "docs/PRODUCT.md",
    "- CHIPS count-up / local HUD reaction / dedicated collect SFX;",
    "- CHIPS count-up / local HUD reaction / synthesized `chip-clack`;\n- synth-only `pouch-grab` feedback on star grab;",
)
replace_once(
    "docs/PRODUCT.md",
    "Implementation, exact-revision video/screenshot audit and manual review are complete. **Current gate: second 20–30 opening hands-on.**",
    "Implementation, repeated-use follow-up fixes, exact-revision video/screenshot audits and manual reviews are complete through PR #45. **Current gate: final hands-on acceptance on the latest merged build.**",
)
replace_once("docs/PRODUCT.md", "### Stage C — real Yandex DRAFT validation — NEXT AFTER CORRECTED HANDS-ON", "### Stage C — real Yandex DRAFT validation — NEXT AFTER FINAL HANDS-ON ACCEPTANCE")

# GAMEPLAY_SYSTEMS — actual current presentation contract.
replace_once(
    "docs/GAMEPLAY_SYSTEMS.md",
    "star grab response\n→ drag tension",
    "star grab response + `pouch-grab` material cue\n→ drag tension",
)
replace_once(
    "docs/GAMEPLAY_SYSTEMS.md",
    "→ earned CHIPS/cache/recycle staged beside result\n→ optional Hidden Pocket\n→ resolved readable result",
    "→ earned CHIPS/cache/recycle staged once beside result\n→ optional Hidden Pocket\n→ resolved readable result enters on a later beat while reward tray remains continuous",
)
replace_once("docs/GAMEPLAY_SYSTEMS.md", "- one `chips-collect` SFX sells the transfer;", "- synthesized `chip-clack` sells the transfer with bounded audio density;")
replace_once("docs/GAMEPLAY_SYSTEMS.md", "4. `RECYCLED +N CHIPS` stages near the item;", "4. rarity-aware `RECYCLED +N · RARITY` stages near the item;")

# OPEN_QUESTIONS — move evidence references forward and fix cue names.
replace_once("docs/OPEN_QUESTIONS.md", "Re-open only if second hands-on finds an actual readability/fatigue problem.", "Re-open only if final hands-on finds an actual readability/fatigue problem.")
replace_once("docs/OPEN_QUESTIONS.md", "Re-open intensity only if repeated hands-on finds Charged unclear, visually tiring, or in conflict with rarity hierarchy.", "Re-open intensity only if final hands-on finds Charged unclear, visually tiring, or in conflict with rarity hierarchy.")
replace_once(
    "docs/OPEN_QUESTIONS.md",
    "Dedicated `chips-collect` SFX is integrated from hands-on evidence.",
    "The current CHIPS banking cue is synthesized `chip-clack`; star grab also has a synth-only `pouch-grab` cue from later hands-on evidence.",
)
replace_once("docs/OPEN_QUESTIONS.md", "Tune from captured video + second hands-on:", "Tune from captured video + final hands-on:")
replace_once(
    "docs/OPEN_QUESTIONS.md",
    "No balance numbers changed in the feel-correction pass. Keep them unchanged through the second hands-on; after corrected hands-on/content-scale simulation, evidence questions remain:",
    "No balance numbers changed in the feel-correction or bounded follow-up passes. Keep them unchanged through final hands-on acceptance; after hosted/content-scale simulation, evidence questions remain:",
)
replace_once("docs/OPEN_QUESTIONS.md", "Candidate solution after second hands-on:", "Candidate solution after final hands-on acceptance:")
replace_once("docs/OPEN_QUESTIONS.md", "Revisit Quick Reveal only if the second 20–30 opening test says per-beat acceleration is still insufficient.", "Revisit Quick Reveal only if final hands-on says per-beat acceleration is still insufficient.")

# ASSET_MANIFEST — actual synth cue state.
replace_between(
    "docs/ASSET_MANIFEST.md",
    "## Opening Feel Correction CHIPS cue — INTEGRATED AS SYNTH\n",
    "\n# 5. Current Lite V2 UI/economy visuals — INTEGRATED",
    """## Opening feel tactile cues — INTEGRATED AS SYNTH\n\nHands-on identified two tactile audio needs that are currently satisfied through the existing Web Audio controller without requiring new reviewed MP3 files.\n\nCurrent contract:\n\n- `chip-clack` is the short dry/percussive CHIPS-banking cue; audio density is throttled independently of the exact visual chip count;\n- `pouch-grab` is a short plastic/zip-like pop on star grab;\n- `src/game/data/audioAssets.ts` reserves possible `assets/audio/chip-clack.mp3` and `assets/audio/pouch-grab.mp3` paths, but synth-only cues remain absent from the available/preloaded MP3 manifest while those files do not exist;\n- runtime therefore does not fetch missing MP3s for either cue;\n- exact browser audits around the post-hands-on feel polish confirmed no missing `pouch-grab.mp3` request and no failed asset requests.\n\nA reviewed physical sample may replace either synth later only if hands-on proves the current sound quality insufficient. `charged-ready.mp3` remains optional only; do not add it unless wallet count-up + CHIPS cue + Charged UI activation still fail the threshold moment.\n\n---\n\n# 5. Current Lite V2 UI/economy visuals — INTEGRATED""",
)
replace_once(
    "docs/ASSET_MANIFEST.md",
    "- staged reward tray near hero;",
    "- staged reward tray near hero with single-entry continuity into the later result panel;",
)
replace_once(
    "docs/ASSET_MANIFEST.md",
    "- Common/Rare/Epic/Legendary escalating shimmer;",
    "- Common/Rare/Epic/Legendary escalating shimmer + larger rarity capsule/tinted result border;\n- semantic reward-row colors including rarity-aware recycle copy;",
)

print("docs sync patch applied")
