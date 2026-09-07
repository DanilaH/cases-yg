from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    file = Path(path)
    text = file.read_text()
    if old not in text:
        raise SystemExit(f'{path}: expected text not found: {old[:140]!r}')
    file.write_text(text.replace(old, new, 1))


# README — current lifecycle, runtime feedback contract and evidence.
replace_once(
    'README.md',
    '**Gameplay Loop Lite V2 and the Opening Feel Correction are implemented, exact-revision audited, manually reviewed, and merged. The current product gate is the second 20–30 opening hands-on; real Yandex DRAFT follows if that corrected loop is accepted.**',
    '**Gameplay Loop Lite V2, the Opening Feel Correction, and the evidence-backed second hands-on Feel V2 polish are implemented, exact-revision audited, manually reviewed, and merged. The current product gate is to continue the 20–30 opening hands-on on this Feel V2 build; real Yandex DRAFT follows if repeated use is accepted.**',
)
replace_once(
    'README.md',
    '- one dedicated `chips-collect` SFX;\n- duplicate → recycle CHIPS + Signal physical transfer;\n- clearer left-side Basic/Charged gameplay rail;',
    '- exact-N visual CHIPS banking in normal flow, with every chip reaching the HUD;\n- sequenced `chip-clack` feedback plus semantic UI/select/skip/denied/spend cues;\n- duplicate → recycle CHIPS + Signal physical transfer;\n- compact left-side Basic/Charged gameplay rail with geometry-safe reward staging;',
)
replace_once(
    'README.md',
    '- 91-test current suite + typecheck/assets/build;\n- original exact-revision browser/video audit + manual review;\n- final Charged-ready correction + re-audit;\n- first repeated hands-on.\n\nCurrent order:\n\n1. second 20–30 opening hands-on on the merged corrected build;\n2. if accepted, real hosted Yandex DRAFT;\n3. decide the deferred Drop/odds/progress info surface from evidence;\n4. content expansion only after hosted validation.',
    '- 108-test current suite + typecheck/assets/build;\n- original exact-revision browser/video audit + manual review;\n- final Charged-ready correction + re-audit;\n- first repeated hands-on;\n- second hands-on first review with concrete audio/layout/banking/motion findings;\n- bounded Feel V2 polish + R3 exact browser/video/manual review;\n- merged product tree verified identical to the R3-audited tree.\n\nCurrent order:\n\n1. continue the 20–30 opening hands-on on the merged Feel V2 build, especially judging interaction/chip audio over repetition;\n2. if accepted, real hosted Yandex DRAFT;\n3. decide the deferred Drop/odds/progress info surface from evidence;\n4. content expansion only after hosted validation.',
)

# Decision ledger — make the current runtime/evidence explicit.
replace_once(
    'docs/DECISIONS.md',
    '| Current stage | LOCKED | Opening Feel Correction is merged and exact-revision/manual-review approved; current gate is the second **20–30 opening hands-on**, then real Yandex DRAFT if accepted |',
    '| Current stage | LOCKED | Second hands-on produced a bounded Feel V2 polish that is merged and R3 exact-revision/manual-review approved; current gate is to continue the same **20–30 opening hands-on** on Feel V2, then real Yandex DRAFT if accepted |',
)
replace_once(
    'docs/DECISIONS.md',
    '| CHIPS staging | CURRENT RUNTIME | earned base/cache/recycle first read beside result; visual banking occurs on result acceptance |\n| Charged cost presentation | CURRENT RUNTIME | cost remains communicated at opening time; only earned CHIPS are visually staged for later banking |\n| CHIPS bank order | CURRENT RUNTIME | base → optional cache → optional recycle; Signal has its own destination transfer |\n| CHIPS HUD | CURRENT RUNTIME | larger resource card, clearer token, larger digital number, animated count-up and bounded local punch/shake |\n| CHIPS sound | CURRENT RUNTIME | add one concise reusable `chips-collect` cue; no sound per cache tier |\n| Charged-ready feedback | CURRENT RUNTIME | trigger when displayed wallet actually crosses cost during banking; activate CHIPS/Charged UI without a mandatory blocking banner |',
    '| CHIPS staging | CURRENT RUNTIME | earned base/cache/recycle first read in a geometry-safe reward tray; visual banking occurs on result acceptance |\n| Charged cost presentation | CURRENT RUNTIME | Charged tear shows an anchored `−60` beside the CHIPS HUD, counts the displayed wallet down, and sends a short outbound chip cue before reveal continues |\n| CHIPS bank order | CURRENT RUNTIME | base → optional cache → optional recycle; Signal has its own destination transfer |\n| CHIPS HUD | CURRENT RUNTIME | compact resource card, clear token/digital number, exact arrival-driven count-up, bounded local punch/glow and controlled cyan shimmer |\n| CHIPS visual amount | CURRENT RUNTIME | normal banking emits exactly one lightweight visual chip per awarded CHIPS; fast-forward may collapse remaining cosmetic particles to the deterministic endpoint |\n| CHIPS sound | CURRENT RUNTIME | sequenced `chip-clack` feedback follows banking with bounded audio density; UI/select/skip/denied/Charged-spend use separate semantic cues |\n| Charged-ready feedback | CURRENT RUNTIME | threshold crossing pulses the actual Charged selector card directly; no separate floating/blocking readiness banner |',
)
replace_once(
    'docs/DECISIONS.md',
    '| Signal presentation | CURRENT RUNTIME | stronger electronic/digital segmented HUD with destination pulse/brief lock glitch |',
    '| Signal presentation | CURRENT RUNTIME | compact electronic segmented HUD; destination spark, segment fill sweep and lock pulse make `+1`/`4/4` transitions explicit |',
)
replace_once(
    'docs/DECISIONS.md',
    '| Feel correction exact-revision audit | COMPLETE | r3 exact-revision browser/video audit + manual artifact review passed on the audited product tree |\n| Second repeated hands-on | OPEN | **current product gate**: 20–30 normal openings on the merged corrected build before hosted DRAFT |\n| Real Yandex DRAFT | OPEN | next external gate after second hands-on acceptance |',
    '| Feel correction exact-revision audit | COMPLETE | original correction exact-revision browser/video audit + manual artifact review passed |\n| Second hands-on first review | COMPLETE WITH FINDINGS | exposed missing interaction sounds, reward-tray collisions, weak HUD composition, non-physical CHIPS banking/audio, weak Charged spend visibility and abrupt transient UI |\n| Feel V2 correction + exact audit | COMPLETE | merged runtime uses compact HUD, geometry-driven 1–4 row tray, exact-N CHIPS flight, semantic audio cues, stronger Charged debit, fades/shimmer and Signal juice; R3 exact browser/video/manual review passed on tree `755a63c205faf5bb5d0f1441b8fe2e2aa69a029d` |\n| Second repeated hands-on continuation | OPEN | **current product gate**: continue toward 20–30 normal openings on Feel V2, with subjective audio/repetition quality explicitly judged before hosted DRAFT |\n| Real Yandex DRAFT | OPEN | next external gate after Feel V2 hands-on acceptance |',
)
replace_once(
    'docs/DECISIONS.md',
    '> **GO: run the second 20–30 opening hands-on on the merged/audited correction. If accepted, proceed to real Yandex DRAFT. Do not add mechanics/content or tune balance before that evidence.**',
    '> **GO: continue the second 20–30 opening hands-on on the merged/audited Feel V2 build. Judge interaction/chip audio and repeated reward flow by ear/hand; if accepted, proceed to real Yandex DRAFT. Do not add mechanics/content or tune balance before that evidence.**',
)

# Roadmap — record the already-consumed second-hands-on feedback and bounded V2 response.
replace_once(
    'docs/IMPLEMENTATION_ROADMAP.md',
    '1. **Opening Feel Correction — COMPLETE**\n2. **Exact-revision combined visual/video audit + manual review — COMPLETE**\n3. **Second direct 20–30 opening hands-on — CURRENT REQUIRED GATE**\n4. **Real Yandex DRAFT validation — NEXT EXTERNAL GATE**\n5. **Content/release expansion — BLOCKED until draft passes**\n6. **Public release hardening**',
    '1. **Opening Feel Correction — COMPLETE**\n2. **Original exact-revision combined visual/video audit + manual review — COMPLETE**\n3. **Second hands-on first review — COMPLETE WITH FINDINGS**\n4. **Bounded Feel V2 polish + R3 exact browser/video/manual review — COMPLETE**\n5. **Continue second 20–30 opening hands-on on Feel V2 — CURRENT REQUIRED GATE**\n6. **Real Yandex DRAFT validation — NEXT EXTERNAL GATE**\n7. **Content/release expansion — BLOCKED until draft passes**\n8. **Public release hardening**',
)
replace_once(
    'docs/IMPLEMENTATION_ROADMAP.md',
    '- 91 unit tests;',
    '- 108 unit tests in the current suite;',
)
replace_once(
    'docs/IMPLEMENTATION_ROADMAP.md',
    '# Phase 2.3 — second hands-on — CURRENT REQUIRED GATE\n\nThe corrected exact revision is merged and approved. Now run **20–30 normal openings**.',
    '# Phase 2.3 — second hands-on / Feel V2 — CURRENT REQUIRED GATE\n\nThe second hands-on has started and its first review produced concrete presentation/audio findings. The bounded Feel V2 response is merged and R3-audited. Continue toward **20–30 normal openings** on this latest build rather than reopening product scope.',
)
replace_once(
    'docs/IMPLEMENTATION_ROADMAP.md',
    'If this passes, stop polishing the same loop and go to hosted DRAFT.\n\nIf a narrow defect remains, make the smallest correction and re-audit only the affected behavior plus regression essentials.',
    'The first review already justified and completed one narrow Feel V2 correction: interaction audio, compact HUD/reward layout, exact-N CHIPS banking, stronger Charged spend, transient fades/shimmer and Signal fill feedback.\n\nIf repeated Feel V2 use now passes, stop polishing the same loop and go to hosted DRAFT. If a narrow defect remains, make the smallest correction and re-audit only the affected behavior plus regression essentials.',
)

# Validation — current evidence and changed CHIPS/audio contract.
replace_once(
    'docs/PROBE_VALIDATION.md',
    '- second 20–30 opening hands-on: **CURRENT / PENDING**;\n- real Yandex DRAFT: **BLOCKED until corrected hands-on acceptance**.',
    '- second hands-on first review: **COMPLETE WITH FINDINGS**;\n- bounded Feel V2 correction: **COMPLETE / MERGED**;\n- Feel V2 R3 exact browser/video + manual review: **PASS** on tree `755a63c205faf5bb5d0f1441b8fe2e2aa69a029d`;\n- R3 artifact digest: `sha256:b86c7835ea1c3a8535d00735a9abede324863eb7c2a5b2f6ecd3b13ae6330dc0`;\n- post-merge main CI #234: **PASS**;\n- continue second 20–30 opening hands-on: **CURRENT**;\n- real Yandex DRAFT: **BLOCKED until Feel V2 hands-on acceptance**.',
)
replace_once(
    'docs/PROBE_VALIDATION.md',
    'Current suite baseline: **91 unit tests** plus typecheck, asset self-test/validation and production build.',
    'Current suite baseline: **108 unit tests** plus typecheck, asset self-test/validation and production build.',
)
replace_once(
    'docs/PROBE_VALIDATION.md',
    '- reward amounts remain aggregate truth; visible token count remains symbolic/bounded.',
    '- reward amounts remain authoritative truth; in normal banking the visual emission count equals the awarded CHIPS amount exactly, while fast-forward may collapse unfinished cosmetic particles.',
)
replace_once(
    'docs/PROBE_VALIDATION.md',
    '- `chips-collect` SFX is satisfying over repetition and not casino-like.',
    '- sequenced `chip-clack` banking audio reads as tactile game/casino-style chips rather than a soft electronic tone, and remains pleasant over repetition; semantic UI/select/skip/denied/spend cues are distinct.',
)
replace_once(
    'docs/PROBE_VALIDATION.md',
    '# 8. Second hands-on — GO / FIX\n\nExact-revision visual approval is complete. Current gate: run **20–30 normal openings**.',
    '# 8. Second hands-on continuation — GO / FIX\n\nThe first second-hands-on review has already happened and produced the bounded Feel V2 correction. R3 exact-revision visual approval is complete. Current gate: continue toward **20–30 normal openings** on Feel V2, with special attention to audio feel over repetition.',
)

# Asset/runtime manifest — synth contract changed and visual count is no longer symbolic.
replace_once(
    'docs/ASSET_MANIFEST.md',
    '## Opening Feel Correction CHIPS cue — INTEGRATED AS SYNTH\n\nFirst hands-on identified a concrete CHIPS feedback gap. The merged correction adds the `chips-collect` cue through the existing Web Audio controller, but **there is no reviewed `public/assets/audio/chips-collect.mp3` in the current tree**.\n\nCurrent contract:\n\n- `src/game/systems/audio.ts` defines the short three-tone `chips-collect` synth cue;\n- `src/game/data/audioAssets.ts` reserves `assets/audio/chips-collect.mp3` as a possible sample path, but the cue is deliberately absent from `AVAILABLE_SFX_CUES` while that reviewed file does not exist;\n- runtime therefore does not fetch a missing CHIPS MP3 and uses the synth cue;\n- the r3 exact-revision browser audit confirmed no failed asset request from this path.\n\nThe cue is synchronized with visual CHIPS banking/count-up, stays short for repeated use, and is shared across normal/cache/big/mega presentation rather than creating one sound asset per tier.\n\nA physical reviewed CHIPS sample may replace the synth later if hands-on proves the current sound insufficient. `charged-ready.mp3` remains optional only; do not add it unless wallet count-up + CHIPS cue + Charged UI activation still fail the threshold moment.',
    '## Feel V2 interaction / CHIPS cues — INTEGRATED AS SYNTH\n\nSecond hands-on rejected the old smooth three-tone `chips-collect` sound and exposed missing interaction feedback. Feel V2 replaces that runtime contract with semantic Web Audio synth cues; there are still **no reviewed new MP3 files for these cues in the current tree**.\n\nCurrent contract:\n\n- `chip-clack` is a short percussive/noise transient sequenced across CHIPS banking; audio density is bounded even when the exact visual payout is large;\n- `ui-click`, `ui-skip`, `pouch-select`, `ui-denied` and `charged-spend` provide distinct interaction semantics;\n- reserved sample paths are not treated as available reviewed assets, so runtime does not fetch absent MP3 files;\n- Feel V2 R3 exact browser audit confirmed no failed request for these synth-only paths.\n\nA reviewed physical chip sample may replace `chip-clack` later only if repeated hands-on by ear proves the synthesized clatter insufficient. Browser video artifacts do not contain an audio stream, so subjective sound acceptance remains a hands-on requirement.',
)
replace_once(
    'docs/ASSET_MANIFEST.md',
    'Visible token count is symbolic/bounded, never the economic amount.',
    'During normal reward banking, the lightweight visual token count equals the awarded CHIPS amount exactly; fast-forward may collapse unfinished cosmetic particles while durable economy remains authoritative.',
)
replace_once(
    'docs/ASSET_MANIFEST.md',
    '- larger CHIPS card + animated count-up;\n- local CHIPS HUD punch/shake/glow;\n- staged reward tray near hero;\n- sequential CHIPS bank trajectories;\n- Signal fragment flight + destination pulse;',
    '- compact CHIPS card + arrival-driven animated count-up and controlled shimmer;\n- local CHIPS HUD punch/glow;\n- geometry-driven 1–4 row reward tray that avoids rail/hero/result collisions;\n- exact-N sequential CHIPS bank trajectories that visibly reach the HUD;\n- Signal fragment flight + destination fill/lock pulse;',
)

# Gameplay systems — actual Feel V2 presentation behavior.
replace_once(
    'docs/GAMEPLAY_SYSTEMS.md',
    '- reward amounts remain aggregate truth; visible tokens stay bounded;\n- player sees/accepts the result;\n- base banks to HUD;\n- cache banks next when present;\n- recycle banks next when present;\n- HUD number counts between displayed values;\n- local CHIPS card reacts with bounded pulse/shake/glow;\n- one `chips-collect` SFX sells the transfer;\n- final displayed wallet equals deterministic committed state.',
    '- reward amounts remain authoritative truth; normal banking emits exactly one lightweight visual chip per awarded CHIPS;\n- player sees/accepts the result;\n- base banks to HUD;\n- cache banks next when present;\n- recycle banks next when present;\n- every normal-flow chip visibly reaches the HUD and arrival drives the displayed count;\n- local CHIPS card reacts with bounded pulse/glow and controlled cyan shimmer;\n- sequenced `chip-clack` audio follows the flow with bounded sound density;\n- fast-forward may collapse remaining cosmetic chips directly to the deterministic endpoint;\n- final displayed wallet equals deterministic committed state.',
)
replace_once(
    'docs/GAMEPLAY_SYSTEMS.md',
    '## 3.3 Charged-ready threshold\n\nCurrent runtime uses a separate visible readiness beat. The correction changes the presentation relationship:\n\n- readiness should trigger when the **displayed** wallet count crosses Charged cost during banking;\n- CHIPS HUD and Charged control react together;\n- concise `CHARGED POUCH READY` feedback may appear;\n- it must not become a mandatory blocking pause.\n\nAffordability logic itself remains unchanged.',
    '## 3.3 Charged spend / ready threshold\n\nFeel V2 binds both moments to the controls that own them:\n\n- Charged tear shows `−60` at the CHIPS HUD, counts the displayed wallet down and sends a short outbound chip cue before reveal;\n- readiness triggers when the **displayed** wallet count crosses Charged cost during banking;\n- the Charged selector card itself receives the brief READY outline/pulse;\n- there is no separate floating readiness banner or mandatory blocking pause.\n\nAffordability logic itself remains unchanged.',
)

print('Opening Feel V2 docs sync applied.')
