# Signal 2000 — Agent Operating Rule

This repository is the production implementation of **Signal 2000**. Project-local code and invariants live here; cross-project Yandex Games production knowledge lives in `DanilaH/decisions`, and extracted reusable code lives in `DanilaH/mini-games-kit`.

## Required context before material changes

For gameplay, architecture, feel, presentation or reusable-mechanics work:

1. Read `Yandex Games/AGENTS.md` in `DanilaH/decisions`.
2. Read `Yandex Games/GAME_FEEL_DOCTRINE.md` there.
3. Read the Signal 2000 entry in `Yandex Games/YANDEX_GAMES_DECISIONS.md` when scope/product direction is relevant.
4. Load `FEEL_PATTERNS.md`, `POLISH_ACCEPTANCE.md`, `REUSABLE_MECHANICS.md` and prior project learnings only when the task needs them.
5. For code-reuse work, inspect the current public surface and docs in `DanilaH/mini-games-kit` before proposing a new local implementation.
6. Treat `docs/REUSABLE_MECHANICS_INVENTORY_2026-09-13.md` as the historical pre-kit inventory, not as current extraction policy.

Do not duplicate the shared doctrine into this repository. Shared knowledge must remain canonical in `DanilaH/decisions`; reusable production code belongs in `DanilaH/mini-games-kit`; this repository records Signal-specific implementation evidence and constraints.

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
- Before implementing a reusable-looking capability locally, inspect `DanilaH/mini-games-kit` and reuse or extend an applicable primitive when doing so does not distort the game design.
- Record a semantic capability separately from Signal-specific policy, naming, balance, content and aesthetics.
- Prefer small semantic APIs over scene/framework abstractions.
- Keep gameplay/durable state independent from presentation.
- Preserve deterministic lifecycle cleanup and repeated-use performance.
- An expensive, sufficiently isolated mechanism may be extracted to the kit as an experimental `0.x` API **before** a second consumer exists when doing so meaningfully reduces future extraction cost.
- A second real consumer validates, reshapes or rejects that experimental API; it is not a prerequisite for extraction.
- Do not force Signal 2000 to consume a newly extracted package merely to prove reuse. Production migration needs its own value/risk justification.
- If a supposedly generic primitive repeatedly needs Signal-specific exceptions, move policy back into this repository instead of broadening the shared API.

Classify reuse candidates with the shared vocabulary, but do not treat the historical 2026-09-13 inventory classifications as immutable:

- `GAME_SPECIFIC`
- `REUSABLE_CANDIDATE`
- `EXTRACT_NOW`
- `EXPERIMENTAL_EXTRACTED`
- `WAIT_FOR_CONSUMER_VALIDATION`

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

If work in this repository materially changes what appears reusable, what failed, where a stable seam exists, or how an extracted API behaves in a real consumer:

1. update the corresponding Yandex Games knowledge in `DanilaH/decisions`;
2. update `DanilaH/mini-games-kit` docs/tests when the reusable API itself changed;
3. record project-specific evidence here only when it is useful for understanding Signal 2000.

Chat history is not the durable source of truth.
