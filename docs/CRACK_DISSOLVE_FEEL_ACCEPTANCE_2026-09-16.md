# Crack dissolve — Signal 2000 feel acceptance (2026-09-16)

Scope: visual polish for the existing pouch-opening transition only. The already-resolved `PendingReveal` remains the source of truth; cosmetics never choose or change a reward. A secret Hidden Pocket is a subsequent separate beat and does not retroactively change the standard pouch crack color.

## Intended language

- Basic/rare: a clear cyan fracture network spreads across the foil, then a few small fragments fall downward. No sideways spark emitter.
- Charged/legendary: the cracks burn gold; foil flakes fall while a short, bounded set of yellow sparks shoots sideways. The burst must not compete with the revealed item or occlude HUD chrome.
- Common is brief and restrained; epic sits between rare and legendary. No added fullscreen post-processing, texture loads or extra gameplay RNG draws.

## Acceptance evidence and limitations

- Source verification: `npm run typecheck`, full `npm test`, and `npm run build` passed in the isolated implementation and lifecycle-fix workflows; PR CI also checks assets and build. A final PR CI run must succeed on the exact cleaned head before merge.
- Actual drag-to-tear of Basic/rare and Charged/legendary, committed rewards, and no JS/console errors passed in browser QA (Actions runs `35120563602` and `35119909436`). Recorded frames were reviewed: the cracks grow before the foil erodes; rare debris falls and legendary gold sparks also move laterally.
- Lifecycle QA on the source branch: repeated Basic/rare tear with 13 fast-forward taps committed the first reward exactly once, then successfully committed one further opening; no browser errors (run `35130546005`). The code now registers crack debris before the first skippable tween so a skip cannot clear it and then cause a later continuation to respawn it.
- Charged/legendary tear with refresh during a durable pending reveal and resize to 1848 × 635 completed with exactly one committed reward and no browser errors (run `35130889390`). The authored first-Charged onboarding reward is legendary even when generic runner-only rarity weights request rare. A combined QA run intermittently missed the Charged tear input and timed out waiting for `pendingReveal`; the charged scenario passed when run independently. These browser checks do not establish zero flakiness on all devices.
- To force tiers for browser footage, the QA runner **temporarily modifies its own uncommitted `src/game/data/balance.ts` checkout**; these weights are never committed, deployed, or used for player-facing odds. The production diff does not modify the loot tables, RNG, or save-state implementation. Do not override global `Math.random` for Phaser tests: it can collide with Phaser texture IDs.
- Chromium/SwiftShader footage and static frames are automated visual evidence, **not** proof of frame pacing or feel on a physical Android device. Repeated actual-device opening, mute, skip, orientation changes and recovery remain physical-device acceptance tasks, not claimed as completed here.
