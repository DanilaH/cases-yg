# Signal 2000 — Agent Operating Rule

This repository is the production implementation of **Signal 2000**. Project-local code and invariants live here; cross-project Yandex Games production knowledge lives in `DanilaH/decisions`.

## Required context before material changes

For gameplay, architecture, feel, presentation or reusable-mechanics work:

1. Read `Yandex Games/AGENTS.md` in `DanilaH/decisions`.
2. Read `Yandex Games/GAME_FEEL_DOCTRINE.md` there.
3. Read the Signal 2000 entry in `Yandex Games/YANDEX_GAMES_DECISIONS.md` when scope/product direction is relevant.
4. Load `FEEL_PATTERNS.md`, `POLISH_ACCEPTANCE.md`, `REUSABLE_MECHANICS.md` and prior project learnings only when the task needs them.
5. For code-reuse work in this repository, read `docs/REUSABLE_MECHANICS_INVENTORY_2026-09-13.md`.

Do not duplicate the shared doctrine into this repository. Shared knowledge must remain canonical in `DanilaH/decisions`; this repository records implementation-specific evidence and constraints.

## Hard project invariants

Unless the task explicitly reopens one of these decisions, preserve them:

- Phaser `4.2.1`, Vite and strict TypeScript remain the runtime/tooling baseline.
- The durable pending-reveal transaction remains the source of truth for a resolved-but-not-yet-committed opening.
- Presentation, animation, audio and particles never own CHIPS, Signal, Overcharge, collection ownership, Hidden Pocket resolution or save mutation.
- Cosmetic/presentation randomness must not consume or alter gameplay/economy randomness.
- Skip, recovery, resize, mute and scene teardown must not duplicate acquisition or banking semantics.
- Do not change reward probabilities, economy values, Signal/Overcharge rules, Hidden Pocket chances/rewards, pouch costs, tear geometry/thresholds or save semantics as a side effect of reuse/refactoring work.
- Do not perform a broad `OpeningScene` rewrite merely to create a reusable framework.
- Preserve mobile/desktop frame stability and input responsiveness over decorative richness.

## Reuse rule

The current goal is **not** to turn Signal 2000 into a generic engine.

- Reuse knowledge immediately.
- Record a semantic capability separately from its Signal-specific policy.
- Prefer pure/testable seams when a local refactor is independently useful.
- Do not invent a package/public API only because one implementation looks generic.
- A second real consumer should normally define the shared contract before code is moved to a common library.
- If a module is already generic and isolated, leaving it in place is acceptable; “extractable” does not mean “must extract now”.

Classify reuse candidates with the shared vocabulary:

- `GAME_SPECIFIC`
- `REUSABLE_CANDIDATE`
- `EXTRACT_NOW`
- `WAIT_FOR_SECOND_CONSUMER`

Any refactor in this track must be behavior-preserving unless the user separately approves a gameplay/product change.

## Validation

For code changes run, at minimum:

```bash
npm run typecheck
npm test
npm run build
```

Use focused tests while iterating, but do not replace the full suite with focused tests before merge.

For feel/presentation changes, automated green is necessary but not sufficient; apply the hands-on acceptance rules from `DanilaH/decisions`.

## Knowledge write-back

If work in this repository materially changes what appears reusable, what failed, or where a stable seam exists, update the corresponding Yandex Games knowledge in `DanilaH/decisions` in the same workstream. Chat history is not the durable source of truth.
