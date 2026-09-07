from pathlib import Path


def replace(path: str, old: str, new: str) -> None:
    p = Path(path)
    text = p.read_text(encoding='utf-8')
    if old in text:
        p.write_text(text.replace(old, new), encoding='utf-8')


def insert_after(path: str, marker: str, addition: str) -> None:
    p = Path(path)
    text = p.read_text(encoding='utf-8')
    if addition.strip() in text:
        return
    if marker not in text:
        raise SystemExit(f'missing marker in {path}: {marker[:100]!r}')
    p.write_text(text.replace(marker, marker + addition, 1), encoding='utf-8')

# FINAL_HANDS_ON_OVERCHARGE_PLAN.md — make durable vs visual timing unambiguous.
replace(
    'docs/FINAL_HANDS_ON_OVERCHARGE_PLAN.md',
    '> the multiplier used for an opening is the multiplier that existed **before that opening\'s reward was calculated**. Any gain or reset caused by that opening happens only after the reward is shown.',
    '> the multiplier used for an opening is the multiplier that existed **before that opening\'s reward was calculated**. The complete Overcharge transition for that opening is predetermined and persisted inside the same recoverable reveal transaction; only its **player-facing gain/reset presentation** happens after the reward is shown.',
)
replace(
    'docs/FINAL_HANDS_ON_OVERCHARGE_PLAN.md',
    '- Signal resets to `0/4` only after the current reward/Overcharge cash-out semantics have been presented.',
    '- the durable transaction may already contain Signal `0/4`; the **displayed** Signal reset/discharge is staged only after the current reward/Overcharge cash-out has been presented.',
)
insert_after(
    'docs/FINAL_HANDS_ON_OVERCHARGE_PLAN.md',
    '- if Overcharge is already at cap and the lock is retained, the multiplier still applies but no fake `+gain` mutation/flight is shown.\n',
    '\nAtomicity requirement:\n\n- `pendingReveal` must persist multiplier-before, actual bonus CHIPS, multiplier-after and whether the transition was retained/consumed/capped;\n- refresh/recovery must replay the exact economic outcome without recalculating Overcharge from current UI state;\n- tweens/count-ups/token flights never mutate the durable multiplier.\n',
)
insert_after(
    'docs/FINAL_HANDS_ON_OVERCHARGE_PLAN.md',
    'Future pouch types may use different gains. The gain is a balance lever and must be simulated before implementation is considered tuned.\n',
    '\nWhen a pouch gain would cross the cap, apply only the real clamped delta. Example: `x1.40 + 0.50` with cap `x1.50` resolves as actual gain `+0.10`, not `+0.50`. Presentation must report the actual applied delta.\n',
)
replace(
    'docs/FINAL_HANDS_ON_OVERCHARGE_PLAN.md',
    'If lock is retained and multiplier is below cap, the final reward-tray beat shows the pouch contribution, for example:',
    'If lock is retained and multiplier is below cap, the final reward-tray beat shows the **actual applied** pouch contribution after clamping to cap, for example:',
)
insert_after(
    'docs/FINAL_HANDS_ON_OVERCHARGE_PLAN.md',
    'This happens **after** the current reward calculation/presentation.\n',
    '\nIf the configured pouch gain is larger than the remaining headroom, show only the applied delta and then enter MAX (for example `+0.10 → MAX`). Never show the nominal `+0.50` when only `+0.10` was persisted.\n',
)

# DECISIONS.md — remove old "presentation-only" contradiction and stage drift.
replace(
    'docs/DECISIONS.md',
    'The mechanics remain accepted. The current correction is presentation/interaction work and must not silently redesign the economy.',
    'The Lite V2 baseline remains accepted. Phase 2.6 contains one explicit bounded economy extension — Signal Overcharge — and otherwise must not silently redesign legacy CHIPS, rarity, cache, recycle or pouch-cost economics.',
)
replace(
    'docs/DECISIONS.md',
    '| Real hosted validation | OPEN | Yandex DRAFT follows final hands-on acceptance of the latest merged/audited build |',
    '| Real hosted validation | OPEN | Yandex DRAFT follows Phase 2.6 implementation + exact audit + direct regression acceptance |',
)
replace(
    'docs/DECISIONS.md',
    '| Drop/odds/progress info surface | PARKED NEXT CANDIDATE | after final hands-on acceptance, consider one on-demand drawer reading exact odds from typed config and showing family/discovered/unknown state |',
    '| Drop/odds/progress info surface | PARKED NEXT CANDIDATE | revisit after Phase 2.6 + hosted DRAFT evidence; candidate remains one on-demand drawer reading exact odds from typed config and showing family/discovered/unknown state |',
)
insert_after(
    'docs/DECISIONS.md',
    '| Recovery | CURRENT RUNTIME | original pouch/result/cache/Signal/Hidden outcome preserved; no duplicate reward |\n',
    '| Overcharge transaction extension | LOCKED NEXT | multiplier-before, bonus CHIPS, actual clamped gain/reset and multiplier-after are predetermined in `pendingReveal`; visual gain/discharge occurs later and never owns durable state |\n',
)

# GAMEPLAY_SYSTEMS.md — clarify transaction extension and stale info timing.
insert_after(
    'docs/GAMEPLAY_SYSTEMS.md',
    '- exact Basic/Charged gains and cap remain open for simulation/tuning.\n',
    '\nDurable truth remains transaction-first: the Overcharge before/bonus/after transition is prepared with `pendingReveal`; reward-tray/HUD gain or discharge is only delayed presentation of that stored result. Near cap, the persisted/displayed gain is the actual clamped delta, not the pouch\'s nominal configured gain.\n',
)
insert_after(
    'docs/GAMEPLAY_SYSTEMS.md',
    'final snapshot\n```\n',
    '\nApproved Phase 2.6 extends this transaction with Overcharge multiplier-before, bonus CHIPS, actual applied gain/reset and multiplier-after. Those fields must be recoverable/idempotent before presentation work is considered valid.\n',
)
replace(
    'docs/GAMEPLAY_SYSTEMS.md',
    'After corrected hands-on, consider an on-demand drawer reading exact values from typed config and showing discovered/unknown items.',
    'After Phase 2.6 and hosted DRAFT evidence, consider an on-demand drawer reading exact values from typed config and showing discovered/unknown items.',
)

# OPEN_QUESTIONS.md — current gate wording.
replace(
    'docs/OPEN_QUESTIONS.md',
    'Canonical correction scope: `OPENING_FEEL_CORRECTION_SCOPE.md`.',
    'Current approved correction/extension scope: `FINAL_HANDS_ON_OVERCHARGE_PLAN.md`. `OPENING_FEEL_CORRECTION_SCOPE.md` remains the historical contract for the already-merged feel correction.',
)
replace(
    'docs/OPEN_QUESTIONS.md',
    'Remaining items here are evidence/tuning questions for the second hands-on and later hosted/content-scale work.',
    'Remaining items here are evidence/tuning questions for Phase 2.6, its direct regression, and later hosted/content-scale work.',
)
replace(
    'docs/OPEN_QUESTIONS.md',
    'Keep them unchanged through final hands-on acceptance; after hosted/content-scale simulation, evidence questions remain:',
    'Keep these legacy values unchanged during Phase 2.6 except for the explicitly new Overcharge parameters; after hosted/content-scale simulation, evidence questions remain:',
)
replace(
    'docs/OPEN_QUESTIONS.md',
    'Candidate solution after final hands-on acceptance:',
    'Candidate solution after Phase 2.6 + hosted DRAFT evidence:',
)

# PRODUCT.md — sync staging and explicit bounded mechanic exception.
replace(
    'docs/PRODUCT.md',
    'The project is deliberately **not** a full idle/incremental economy. The correction and bounded post-hands-on follow-ups are merged; current work is final hands-on acceptance of the latest audited loop rather than adding another system.',
    'The project is deliberately **not** a full idle/incremental economy. Final direct hands-on exposed a bounded remaining finding set; current work is Phase 2.6: those fixes plus the explicitly approved Signal Overcharge extension, then exact/direct regression before Yandex DRAFT.',
)
replace(
    'docs/PRODUCT.md',
    'Implementation, repeated-use follow-up fixes, exact-revision video/screenshot audits and manual reviews are complete through PR #45. **Current gate: final hands-on acceptance on the latest merged build.**\n\n### Stage C — real Yandex DRAFT validation — NEXT AFTER FINAL HANDS-ON ACCEPTANCE',
    'Implementation, repeated-use follow-up fixes, exact-revision video/screenshot audits and manual reviews are complete through PR #45. The subsequent final direct hands-on completed with bounded findings.\n\n### Stage B3 — final-hands-on correction + Signal Overcharge — CURRENT APPROVED PASS\n\nCanonical contract: `FINAL_HANDS_ON_OVERCHARGE_PLAN.md`. Fix rarity/reward/Charged-denial issues, make Signal/Secret self-explanatory, add the deterministic recoverable Overcharge extension, simulate gain/cap tuning, then exact-audit and directly regress it. The future expensive pouch remains a hypothesis only.\n\n### Stage C — real Yandex DRAFT validation — NEXT AFTER STAGE B3 ACCEPTANCE',
)
replace(
    'docs/PRODUCT.md',
    'CHIPS = spendable progress toward Charged. Signal = non-spendable duplicate protection.\n\nNo mechanic changes here in the feel correction.',
    'CHIPS = spendable progress toward Charged. Current runtime Signal = non-spendable duplicate protection. Approved next: while an already-armed lock cannot be consumed, Signal also carries a capped Overcharge multiplier over earned `base + cache + recycle` CHIPS; cash-out occurs before a consuming lock visually discharges/reset.\n\nThe durable Overcharge transition remains part of the atomic reveal transaction, not a presentation-owned mutation.',
)
replace(
    'docs/PRODUCT.md',
    'No balance tuning was mixed into the presentation pass. Keep numbers unchanged through the second hands-on; revisit only from corrected hands-on/content-scale simulation evidence.',
    'No legacy balance tuning was mixed into the presentation pass. Keep existing pouch costs/base/cache/rarity/recycle values unchanged in Phase 2.6; only new Overcharge gain/cap values are simulation-driven tuning candidates.',
)
replace(
    'docs/PRODUCT.md',
    'After corrected hands-on, consider one on-demand Drop info drawer sourced from typed balance/content config.',
    'After Phase 2.6 + hosted DRAFT evidence, consider one on-demand Drop info drawer sourced from typed balance/content config.',
)
replace(
    'docs/PRODUCT.md',
    '- Overcharge / Archive levels;',
    '- Archive levels;\n- any Overcharge expansion beyond the bounded Signal extension in `FINAL_HANDS_ON_OVERCHARGE_PLAN.md`;',
)

# TECHNICAL_DIRECTION.md — current stage, atomic extension, test/audio truth.
replace(
    'docs/TECHNICAL_DIRECTION.md',
    'Gameplay Loop Lite V2 and the bounded **Opening Feel Correction** are implemented in current `main`. Exact-revision browser/video and manual visual review passed; the immediate gate is second repeated hands-on, not more architecture work.',
    'Gameplay Loop Lite V2 and the bounded **Opening Feel Correction** are implemented in current `main`. Final direct hands-on completed with bounded findings. The immediate gate is Phase 2.6: targeted fixes plus the approved Signal Overcharge transaction extension, followed by exact/direct regression — not broad architecture work.',
)
replace(
    'docs/TECHNICAL_DIRECTION.md',
    '## 5. Content / balance boundaries — UNCHANGED',
    '## 5. Content / balance boundaries — LEGACY VALUES UNCHANGED',
)
insert_after(
    'docs/TECHNICAL_DIRECTION.md',
    '- balance numbers stayed unchanged through the feel correction and remain provisional pending later evidence.\n',
    '- Phase 2.6 may add only Overcharge-specific pouch gain/cap tuning; legacy pouch cost/base/cache/rarity/recycle numbers do not move by intuition.\n',
)
replace(
    'docs/TECHNICAL_DIRECTION.md',
    '## 6. Save / atomic reveal contract — CRITICAL AND UNCHANGED',
    '## 6. Save / atomic reveal contract — CRITICAL BASELINE + PHASE 2.6 EXTENSION',
)
insert_after(
    'docs/TECHNICAL_DIRECTION.md',
    '- presentation tweens, fast-forward and visual banking never determine durable state.\n',
    '\nPhase 2.6 must extend this same boundary rather than bypass it:\n\n- persist Overcharge multiplier-before, bonus CHIPS, actual clamped gain/reset and multiplier-after in the prepared reveal;\n- migrate existing saves to an inactive `x1.00` Overcharge state without losing pending-reveal safety;\n- recovery must never recalculate a different multiplier transition;\n- reward count-up, gain flight, MAX pulse and discharge are presentation-only views of the stored transition.\n',
)
replace(
    'docs/TECHNICAL_DIRECTION.md',
    'Signal resolver semantics stay unchanged.',
    'Current Signal pity resolver semantics remain the baseline. Phase 2.6 extends the same pure/domain layer with Overcharge; scene tweens remain non-authoritative.',
)
replace(
    'docs/TECHNICAL_DIRECTION.md',
    'Do not turn Signal into a spendable animation/state machine. Resolver + pending transaction remain authoritative.',
    'Do not turn Signal into a scene-owned/spendable animation state machine. Signal + Overcharge resolver state and the pending transaction remain authoritative.',
)
replace('docs/TECHNICAL_DIRECTION.md', 'Current suite is 91 tests plus typecheck/assets/build.', 'Current suite baseline is 108 tests plus typecheck/assets/build.')
replace(
    'docs/TECHNICAL_DIRECTION.md',
    '```text\nchips-collect\n```\n\nDo not add one cue per cache tier. Optional `charged-ready` cue is conditional on review.',
    'Current integrated cues include synthesized `chip-clack` for CHIPS banking and synth-only `pouch-grab` for star grab. Do not add one cue per cache tier. Optional `charged-ready` cue remains conditional on review.',
)
replace(
    'docs/TECHNICAL_DIRECTION.md',
    'Real hosted Yandex DRAFT remains required **after** corrected exact-revision + second hands-on approval.',
    'Real hosted Yandex DRAFT remains required **after Phase 2.6 implementation + exact audit + direct regression approval**.',
)
replace(
    'docs/TECHNICAL_DIRECTION.md',
    '- abstractions for parked Overcharge/Archive/prestige ideas.',
    '- generalized abstractions for Archive/prestige or future Overcharge expansion beyond the approved small Signal extension.',
)
replace(
    'docs/TECHNICAL_DIRECTION.md',
    'The correction should primarily be a better choreography of systems already present.',
    'Phase 2.6 should stay narrow: preserve existing boundaries, add only the smallest pure-state/save fields needed for deterministic Overcharge, and keep presentation helpers local.',
)

# INFRASTRUCTURE_STATUS.md — factual current baseline and next gate.
replace('docs/INFRASTRUCTURE_STATUS.md', '- 91-test current suite;', '- 108-test current suite;')
replace('docs/INFRASTRUCTURE_STATUS.md', '- one `chips-collect` SFX;', '- synthesized `chip-clack` CHIPS cue + synth-only `pouch-grab` interaction cue;')
insert_after(
    'docs/INFRASTRUCTURE_STATUS.md',
    'This keeps feel work from weakening recovery correctness.\n',
    '\nThe approved Phase 2.6 Overcharge extension must obey the same rule: multiplier/bonus/gain/reset are persisted in the reveal transaction first; later count-up, gain flight and discharge are cosmetic staging only.\n',
)
replace(
    'docs/INFRASTRUCTURE_STATUS.md',
    '1. second 20–30 opening hands-on on merged corrected `main`;\n2. if accepted, real Yandex DRAFT;\n3. fix only hosted-platform defects;\n4. content expansion.',
    '1. implement the bounded final-hands-on fixes + Signal Overcharge;\n2. run exact browser/video audit + direct repeated-use regression;\n3. if accepted, real Yandex DRAFT;\n4. fix only hosted-platform defects;\n5. content expansion.',
)
replace(
    'docs/INFRASTRUCTURE_STATUS.md',
    '- Overcharge / Archive / upgrades;',
    '- Archive / upgrades;\n- any Overcharge expansion beyond the approved bounded Signal extension;',
)
replace(
    'docs/INFRASTRUCTURE_STATUS.md',
    '> **Second hands-on → real Yandex DRAFT → content expansion.**',
    '> **Phase 2.6 implementation → exact/direct regression → real Yandex DRAFT → content expansion.**',
)
replace(
    'docs/INFRASTRUCTURE_STATUS.md',
    'Runtime architecture remains outside the critical bottleneck; the current gates are repeated-use product acceptance and real hosted-platform validation.',
    'Runtime architecture remains intentionally small; the current gates are the bounded Overcharge/save extension, direct product acceptance and real hosted-platform validation.',
)

# README.md — public entry point current stage/source-of-truth.
replace(
    'README.md',
    '**Gameplay Loop Lite V2, the Opening Feel Correction and the bounded post-hands-on UI/feel follow-ups are implemented, exact-revision audited, manually reviewed, and merged. The second repeated-use hands-on produced narrow findings that are now fixed. The current product gate is final hands-on acceptance of the latest merged build; real Yandex DRAFT follows if accepted.**\n\nCanonical scope: [`docs/OPENING_FEEL_CORRECTION_SCOPE.md`](docs/OPENING_FEEL_CORRECTION_SCOPE.md).',
    '**Gameplay Loop Lite V2 and the previous feel-correction passes are implemented/audited. Final direct hands-on completed with a bounded new finding set. The current product gate is Phase 2.6: fix those issues and implement the approved deterministic Signal Overcharge extension, then exact/direct regression; real Yandex DRAFT follows only if accepted.**\n\nCurrent approved scope: [`docs/FINAL_HANDS_ON_OVERCHARGE_PLAN.md`](docs/FINAL_HANDS_ON_OVERCHARGE_PLAN.md). Historical feel-correction contract: [`docs/OPENING_FEEL_CORRECTION_SCOPE.md`](docs/OPENING_FEEL_CORRECTION_SCOPE.md).',
)
replace(
    'README.md',
    'The player request for exact odds + Drop contents + discovered/unknown items is valid but deliberately deferred to a possible on-demand info drawer **after final hands-on acceptance**.',
    'The player request for exact odds + Drop contents + discovered/unknown items is valid but deliberately deferred to a possible on-demand info drawer **after Phase 2.6 + hosted DRAFT evidence**.',
)
replace(
    'README.md',
    '1. final hands-on acceptance on the latest merged build;\n2. if accepted, real hosted Yandex DRAFT;\n3. decide the deferred Drop/odds/progress info surface from evidence;\n4. content expansion only after hosted validation.\n\nDo not add new meta systems/content or tune the economy before final hands-on acceptance and hosted DRAFT provide evidence.',
    '1. implement final-hands-on fixes + Signal Overcharge;\n2. simulate Overcharge gain/cap, then exact-audit + directly regress;\n3. if accepted, real hosted Yandex DRAFT;\n4. decide deferred Drop/odds/progress work from evidence;\n5. content expansion only after hosted validation.\n\nDo not add unrelated meta systems/content or tune legacy economy values by intuition. Overcharge-specific gain/cap tuning is the explicit bounded exception and must be simulation-driven.',
)
insert_after(
    'README.md',
    '- [`docs/DECISIONS.md`](docs/DECISIONS.md) — decisions/current state;\n',
    '- [`docs/FINAL_HANDS_ON_OVERCHARGE_PLAN.md`](docs/FINAL_HANDS_ON_OVERCHARGE_PLAN.md) — current Phase 2.6 mechanic/presentation/validation contract;\n',
)

# PROBE_VALIDATION.md — keep it as baseline history, point current delta to Phase 2.6 spec.
replace(
    'docs/PROBE_VALIDATION.md',
    '- final hands-on acceptance: **CURRENT / PENDING**;\n- real Yandex DRAFT: **BLOCKED until final hands-on acceptance**.\n\nCanonical correction scope: `OPENING_FEEL_CORRECTION_SCOPE.md`.',
    '- final direct hands-on: **COMPLETE WITH BOUNDED FINDINGS**;\n- Phase 2.6 final-hands-on correction + Signal Overcharge: **CURRENT APPROVED PASS**;\n- real Yandex DRAFT: **BLOCKED until Phase 2.6 exact/direct acceptance**.\n\nHistorical correction scope: `OPENING_FEEL_CORRECTION_SCOPE.md`. Current delta/acceptance contract: `FINAL_HANDS_ON_OVERCHARGE_PLAN.md`.',
)
replace(
    'docs/PROBE_VALIDATION.md',
    'The remaining question is no longer whether the Lite mechanics work. It is:\n\n> **Can the same loop feel tactile, responsive, readable and rewarding enough to repeat without adding more systems?**',
    'The Lite baseline is proven. Current validation must preserve it while proving the bounded Phase 2.6 fixes and Signal Overcharge extension are understandable, deterministic/recoverable and pleasant in repetition.',
)
replace(
    'docs/PROBE_VALIDATION.md',
    '# 8. Second hands-on — GO / FIX\n\nExact-revision visual approval is complete. Current gate: run **20–30 normal openings**.',
    '# 8. Historical second hands-on gate — COMPLETE WITH FINDINGS\n\nThis gate produced the findings now captured in `FINAL_HANDS_ON_OVERCHARGE_PLAN.md`. Do not use this section as the current GO-to-DRAFT decision by itself.',
)
insert_after(
    'docs/PROBE_VALIDATION.md',
    'Fix only the observed problem; do not add another progression system.\n',
    '\n## Current Phase 2.6 delta gate\n\nIn addition to preserving every baseline invariant above, current acceptance must cover rarity-badge cleanup, reward overflow, 20+ denial clicks without drift, Signal gain/ready/retain/consume clarity, Secret collection meaning + celebration, Overcharge persisted/recovered transitions, bonus count-up, actual clamped gain near cap, MAX behavior, cash-out/reset and complete-Drop behavior. The canonical detailed matrix is `FINAL_HANDS_ON_OVERCHARGE_PLAN.md`.\n',
)
replace(
    'docs/PROBE_VALIDATION.md',
    'After corrected hands-on, separately decide whether to implement an on-demand Drop info drawer containing:',
    'After Phase 2.6 + hosted DRAFT evidence, separately decide whether to implement an on-demand Drop info drawer containing:',
)

# YANDEX_SLICE_VALIDATION.md — hosted gate must include the new persisted mechanic once Phase 2.6 passes locally.
replace(
    'docs/YANDEX_SLICE_VALIDATION.md',
    'This checklist is the hosted-platform gate that runs **after Gameplay Loop Lite V2 hands-on acceptance**.',
    'This checklist is the hosted-platform gate that runs **after Phase 2.6 final-hands-on correction + Signal Overcharge exact/direct acceptance**.',
)
insert_after(
    'docs/YANDEX_SLICE_VALIDATION.md',
    '- pending reveal recovery/idempotency with wallet/cache/Signal-retention fields;\n',
    '- save migration into inactive Overcharge state plus pending-reveal recovery/idempotency for multiplier-before, bonus CHIPS, actual gain/reset and multiplier-after;\n',
)
insert_after(
    'docs/YANDEX_SLICE_VALIDATION.md',
    'Repeat with a forced large cache outcome, duplicate/recycle and Hidden Pocket paths through debug tooling. Also repeat a Basic opening while Signal is armed and only Legendary remains; after recovery the same Basic result must be preserved and Signal must still be `4/4`.\n',
    '\nAfter Phase 2.6, also interrupt retained-lock Overcharge openings before/after visible bonus/gain staging. Reload must preserve the same multiplier-before, bonus CHIPS and multiplier-after without double gain.\n',
)
insert_after(
    'docs/YANDEX_SLICE_VALIDATION.md',
    '- active Drop/profile remains the one stored in transaction.\n',
    '- if the opening cashes out Overcharge through a consuming lock, the same bonus CHIPS and reset-to-`x1.00` outcome are recovered exactly once.\n',
)
insert_after(
    'docs/YANDEX_SLICE_VALIDATION.md',
    '- complete active Drop does not consume/waste armed lock.\n',
    '- with an armed retained lock, Overcharge applies the persisted multiplier to `base + cache + recycle`, then persists only the actual clamped pouch gain for the next opening;\n- at cap, the multiplier still applies while no fake gain is persisted;\n- an eligible consuming lock cashes out the current multiplier and persists reset to `x1.00`;\n- reload cannot recalculate or double-apply any Overcharge transition.\n',
)
insert_after(
    'docs/YANDEX_SLICE_VALIDATION.md',
    '- no modal/store is required for Basic/Charged choice.\n',
    '- when Overcharge is active, hosted reward UI shows raw earned CHIPS, multiplier contribution and final total without overflow; inactive `x1.00` remains visually dormant and MAX remains clearly saturated rather than error-like.\n',
)
replace(
    'docs/YANDEX_SLICE_VALIDATION.md',
    'signal_lock_consumed\ncharged_ready',
    'signal_lock_consumed\novercharge_bonus_applied\novercharge_gain\novercharge_max\novercharge_discharged\ncharged_ready',
)
replace(
    'docs/YANDEX_SLICE_VALIDATION.md',
    '> **SDK boot + lifecycle + storage migration + Basic/Charged atomic recovery + cache persistence + strict Signal gating + ads + audio + analytics are all safe in the real Yandex environment.**',
    '> **SDK boot + lifecycle + storage migration + Basic/Charged atomic recovery + cache/Signal/Overcharge persistence + ads + audio + analytics are all safe in the real Yandex environment.**',
)
