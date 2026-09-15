# Startup art diagnostics / loader concurrency experiment

Issue: #178

## Objective

Explain the real-device startup sample where `platformToArtMs` accounts for essentially the whole boot (`~33.95s / ~34.16s`) and identify whether Phaser loader concurrency can reduce that wall time without changing the zero-runtime-loader product contract.

## Guardrails

- No runtime loading after Game Ready.
- No gameplay/RNG/economy/save/monetization changes.
- No asset quality/format/resolution changes in this experiment.
- Keep the current loader behavior as the control.
- Any concurrency override must be debug/experiment-only until a same-device A/B proves a win.

## Plan

1. Inspect the current Boot preload path and existing startup diagnostics.
2. Add art-load observability around the actual Phaser loader path: selected concurrency, aggregate timing, per-file timing where the loader exposes enough signal, and a compact slowest-assets summary suitable for phone DEBUG output.
3. Add an explicit debug-only concurrency override for controlled A/B candidates `4, 8, 12, 16, 24, 32`; invalid values fall back to current behavior.
4. Preserve default production behavior when no override is supplied.
5. Run typecheck/tests/assets validation/build, then review the final diff for accidental product/runtime changes.
6. Use the resulting Pages build for same-device cold-start samples. Only a proven winner should be reconstructed into a clean production PR.

## Critical review before implementation

The initial idea "art takes 34s, therefore increase concurrency" is not sufficient. The metric combines request scheduling, network transfer, browser decode and Phaser completion. Changing concurrency blindly can make mobile decode contention worse, and prior bundle work already showed that fewer requests can be slower. Therefore instrumentation and an unchanged control are mandatory. We also avoid changing WebP quality or asset layout in this branch so any timing delta remains attributable to scheduling/loader behavior.
