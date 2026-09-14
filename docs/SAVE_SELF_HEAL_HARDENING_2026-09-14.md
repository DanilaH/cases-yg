# Signal 2000 — Save self-heal hardening

**Date:** 2026-09-14  
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
- onboarding metadata is retained only when it validates against the repaired state;
- if exact onboarding evidence is unavailable, `totalOpens > 0` is conservatively grandfathered complete, matching the existing v4→v5 migration policy; a zero-open save returns to unfinished onboarding;
- malformed JSON, unknown versions and invalid durable progression remain hard failures;
- before replacing a recoverable payload, the exact raw value is copied to `<save-key>.recovery` locally for diagnosis.

## Guardrails

The repair path must never invent collection ownership, CHIPS, Signal, Overcharge, opening count or a reward transaction. It may only discard transient evidence that cannot be reconciled with an already-valid durable snapshot.

## Validation

Focused tests cover missing onboarding metadata, irreconcilable staged reveal, fresh-save onboarding fallback and refusal to repair invalid durable progression. Full merge gate remains `npm ci`, typecheck, unit tests, asset self-test, asset validation and production build.
