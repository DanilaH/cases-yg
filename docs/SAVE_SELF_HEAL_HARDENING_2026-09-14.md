# Signal 2000 — Save self-heal hardening

**Date:** 2026-09-14  
**Status:** IMPLEMENTED — AWAITING FINAL PR GATE / REAL-PHONE ACCEPTANCE  
**Trigger:** real-phone Pages build only became playable after manually resetting/repairing the persisted save.

## Finding

Startup routes through `SaveRepository.load()`, and the current v5 parser validates both durable progression and transient state (`pendingReveal`, onboarding receipt) as one strict object. Any mismatch in transient evidence therefore turns the entire save into a load failure even when CHIPS, collection, Signal, Overcharge and opening count are still structurally valid. `OpeningScene` then stays in its save-load failure state. Clearing the save appears to “fix” the game only because it removes the rejected payload.

We cannot inspect the reporter's browser-local raw payload from the repository, so this pass does not claim which exact transient field was stale. It fixes the architectural failure mode instead.

## Repair contract

Automatic repair is intentionally narrow:

- only current-version v5 payloads are eligible;
- the durable `ProgressSnapshot` and `muted` field must already validate exactly;
- a staged reveal is retained only if it is structurally valid and still matches the durable base state;
- otherwise the staged reveal is discarded and the durable base state wins, preventing duplicate/guessed rewards;
- onboarding metadata is retained only when it validates against the repaired state and carries enough exact evidence to resume the authored first-result flow;
- if exact onboarding evidence is unavailable, `totalOpens > 0` is conservatively grandfathered complete, matching the existing v4→v5 migration policy; a zero-open save returns to unfinished onboarding;
- malformed JSON, unknown versions and invalid durable progression remain hard failures;
- before replacing a recoverable payload, the exact raw value is copied to `<save-key>.recovery` locally for diagnosis.

## Guardrails

The repair path must never invent collection ownership, CHIPS, Signal, Overcharge, opening count or a reward transaction. It may only discard transient evidence that cannot be reconciled with an already-valid durable snapshot.

## Independent review

The first review follow-up tried to make `totalOpens > 0 + primaryCompleted=false + receipt=null` globally invalid. The full test suite rejected that approach because debug/test helpers and ordinary state construction legitimately use progressed states that are not authored onboarding recovery records. That global invariant was not kept.

The final design scopes the stricter rule to `repairCurrentSave()` only. A normal strictly valid save is never normalized. A save already entering self-heal keeps exact onboarding state when it has a valid receipt or is explicitly complete; otherwise progressed saves fall back to the same conservative completion rule as the v4→v5 migration.

A focused regression test also proves that a structurally valid pending transaction survives repair byte-for-object-equivalent, including the same transaction id and reward; no reroll is permitted.

## Validation

The implementation branch passed typecheck, the complete unit suite, asset self-test, asset validation and production build after both the initial implementation and the repair-only review correction. Final PR CI must pass on the exact final head before merge. Real-phone Pages startup without manual reset/repair remains the final acceptance gate.
