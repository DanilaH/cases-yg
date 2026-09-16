# Crack dissolve — Signal 2000 feel acceptance (2026-09-16)

Scope: visual polish for the existing pouch-opening transition only. The already-resolved `PendingReveal` remains the source of truth; cosmetics never choose or change a reward. A secret Hidden Pocket is a subsequent separate beat and does not retroactively change the standard pouch crack color.

## Intended language

- Basic/rare: a clear cyan fracture network spreads across the foil, then a few small fragments fall downward. No sideways spark emitter.
- Charged/legendary: the cracks burn gold; foil flakes fall while a short, bounded set of yellow sparks shoots sideways. The burst must not compete with the revealed item or occlude HUD chrome.
- Common is brief and restrained; epic sits between rare and legendary. No added fullscreen post-processing, texture loads or extra gameplay RNG draws.

## Acceptance evidence and limitations

- `npm run typecheck`, `npm test`, and `npm run build` executed in the isolated source-commit workflow. Real drag-to-tear, completed saves and no JS/console errors are checked in the temporary deterministic browser workflows.
- The deterministic browser build **temporarily modifies only the local `src/game/data/balance.ts` in the QA runner**, selecting 100% of the requested tier for both profiles. It is never committed, never deployed, never used for player-facing odds. Earlier attempts that tried to cycle `MathRandomSource` selected common instead, because RNG draws were consumed elsewhere in the reveal.
- Browser footage and static frames from Chromium/SwiftShader are automated acceptance evidence, **not** proof of hands-on frame pacing or visual appearance on a physical Android device.
- Recheck skip, refresh/recovery, resizing and long repeated use before claiming physical-device acceptance.
