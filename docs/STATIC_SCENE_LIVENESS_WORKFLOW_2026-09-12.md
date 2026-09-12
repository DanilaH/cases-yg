# Static Scene Liveness Workflow — 2026-09-12

## Goal

Increase perceived life, depth, and material response in the Opening scene without making the UI feel unstable, noisy, or gamey-for-the-sake-of-it.

The successful reference is the new planar mouse-follow perspective already used by the pouch and the active result collectible. The next pass should add secondary depth cues around that motion rather than simply increasing the skew strength.

## Current state

- Pouch art uses a planar homography filter with mouse-follow yaw/pitch.
- Active result collectible uses the same planar homography at slightly softer strength.
- Pouch and collectible floor shadows are intentionally outside the warped render target.
- Opening already has slow ambient glows/particles.
- Rare/Epic/Legendary/Secret result states already have persistent glow/ring/sparkle treatment.
- HUD already has restrained shimmer motion.

This means the scene is not actually motionless anymore; the problem is that several existing motion systems are still visually independent. The next pass should make them reinforce one coherent 3D/material read.

## Independent review of candidate ideas

### Keep — high ROI

1. **Pointer-driven material sheen**
   - Reuse the existing homography filter and add a soft moving specular band.
   - Strongest on Charged / Epic / Legendary / Secret, restrained on Basic/Common.
   - No extra textures or asset production.

2. **Directional edge light**
   - Use the same yaw/pitch to brighten the near edge and slightly suppress the far edge.
   - Gives the tilt a physical lighting consequence instead of looking like geometry-only distortion.

3. **Shadow parallax**
   - Keep shadow unwarped, but offset and subtly reshape it opposite the visual tilt.
   - Very small displacement only; this is a depth cue, not an animation beat.

4. **Background / ambience parallax**
   - Background moves around 1–2 logical px; ambient layer around 3–5 px.
   - Gameplay/UI chrome stays fixed.
   - Use containers so existing particle tweens keep their local motion.

5. **Idle micro-drift**
   - After pointer inactivity, add tiny slow yaw/pitch oscillation to the hero object.
   - Must be additive to the homography, not group position/rotation, so hitboxes and layout stay untouched.
   - Pointer input immediately takes authority again.

6. **Rarity-reactive material response**
   - Common: almost none.
   - Rare: cool restrained sheen.
   - Epic: stronger violet/iridescent response.
   - Legendary: warm gold response.
   - Secret: strongest premium response, still below reveal-flash intensity.

### Do not add as separate systems

1. **More local motes around the collectible** — rejected as a new system.
   - Existing rarity/Secret persistent FX already provide local sparkles and glow.
   - Adding another particle layer would duplicate the same visual job.

2. **Micro-perspective on result UI chrome** — rejected for now.
   - Result title, rarity badge, reward tray, and CTA should remain stable anchors.
   - Moving them weakens readability and makes the whole screen feel like a floating HUD.

3. **Stronger skew** — explicitly out of scope.
   - Current geometry is already doing its job; secondary cues should create the additional richness.

## Motion hierarchy

The scene should read as four depth layers:

1. **Stable UI layer** — HUD, labels, result panel, controls: no parallax.
2. **Hero layer** — pouch or active collectible: homography + material response.
3. **Contact layer** — floor shadow: small opposite parallax and shape response.
4. **Environment layer** — authored background and ambient particles: tiny camera-like parallax.

No two layers should move at the same amplitude.

## Implementation phases

### Phase A — spatial depth cues

- Add background and ambient parallax containers.
- Add pointer-idle micro-drift to the existing planar controller targets.
- Add pouch shadow parallax.
- Add active collectible shadow parallax.
- Ensure all effects return to neutral during drag, banking, switching, loading, or when the relevant hero object is inactive.

### Phase B — material response

- Extend the existing planar fragment shader instead of adding a second post-process.
- Add uniforms for yaw/pitch, sheen strength, rim strength, and material tint.
- Add a broad soft specular band that moves with the pointer.
- Add directional near-edge light.
- Configure pouch Basic/Charged profiles.
- Configure collectible Common/Rare/Epic/Legendary/Secret profiles.
- Keep alpha-safe math so transparent asset regions do not glow.

### Phase C — integration polish

- Verify carousel switching resets the previous collectible material pose.
- Verify reveal/banking transitions do not leave displaced shadows or parallax layers.
- Verify resize recreates environment layers cleanly.
- Verify no filter-size regression or new blur is introduced.
- Keep touch/no-hover behavior safe and non-dependent on pointer motion.

## Guardrails

- No economy, loot, progression, rarity probability, reward, or save-state changes.
- No tear travel, drag threshold, hitbox, or pouch silhouette changes.
- No new external assets.
- No changes to collectible art files.
- No layout movement for interactive UI.
- No more than one hero object receives active pointer-driven material motion at a time.
- No per-frame object allocation in the hot path.
- Existing supersampling remains the quality baseline.

## Acceptance criteria

- Pouch and active result collectible feel more dimensional without looking rubbery or curved.
- Shadow movement is perceptible only when comparing motion, not as an independent effect.
- Background motion is weaker than ambient-particle motion, both weaker than hero motion.
- Legendary/Secret material response is clearly richer than Common without obscuring artwork.
- Result text and CTA remain visually stationary.
- Carousel side item remains neutral.
- Pointer release / hover loss / phase transition returns effects smoothly to neutral.
- Typecheck, tests, asset validation, and production build are green.

## Visual QA checklist

CI cannot validate perceived motion quality. Browser eyeball-check after each phase:

- mouse center / corners / rapid side-to-side;
- Basic and Charged pouch;
- Common, Rare, Epic, Legendary, Secret result;
- standard-only result and standard+Secret carousel;
- carousel switch while pointer is off-center;
- idle pointer for 3–10 seconds;
- tear start and pouch exit;
- banking/collection acceptance;
- desktop at normal and HiDPI scaling;
- verify no edge clipping, framebuffer softness, or background exposure.

## Execution / independent review outcome

Implemented Phase A and Phase B, then independently re-reviewed the actual diff before merge.

Three issues were caught during that review and corrected:

1. **Reveal backdrop compositing order**
   - Splitting the environment into background and ambient parallax containers initially made the reveal backdrop sit above the ambient layer.
   - The original visual hierarchy was restored: background → reveal backdrop → ambient motes.

2. **Edge-light implementation**
   - A first-pass rim based on render-target UV borders would only light the filter rectangle, not the actual collectible/pouch silhouette.
   - Replaced it with alpha-neighbour sampling around the warped source UV so rim light follows real transparent silhouette edges and internal cutouts.

3. **Per-frame helper allocation**
   - The first integration declared perspective/shadow helper closures inside `update()`.
   - Moved those helpers to class methods so the liveness hot path does not allocate new functions every frame.

Final scope remains intentionally limited to hero/material/depth cues. Extra particle systems and moving UI chrome remain rejected because the project already has sufficient rarity particles and stable UI anchors are more valuable than additional motion.
