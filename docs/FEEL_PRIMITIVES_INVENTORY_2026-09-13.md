# Signal 2000 — Feel / Polish Primitive Inventory

**Status:** implementation-side inventory complete; no shared feel package justified yet.  
**Reference revision reviewed:** `5450957d3e63107c5717c91fc7b92e2cb995d60c`.  
**Scope:** presentation/feel implementation only. Gameplay, economy, reward probabilities, save semantics, tear geometry and content are out of scope.

This document maps the high-value feel work in Signal 2000 back to concrete code and separates reusable production knowledge from code that should remain project-specific.

The classification vocabulary is the same as the mechanics inventory:

- `GAME_SPECIFIC`
- `REUSABLE_CANDIDATE`
- `EXTRACT_NOW`
- `WAIT_FOR_SECOND_CONSUMER`

The key rule remains:

> Reuse the production lesson immediately. Generalize code only after another real project proves the same implementation need.

---

# Executive conclusion

The most valuable reusable output of the Signal 2000 polish work is **not a set of exact numbers or one giant presentation framework**. It is a set of state-ownership boundaries and small implementation shapes:

1. continuous interaction state can drive several restrained feedback channels;
2. pointer-responsive planar depth can create tactile hero presentation without 3D;
3. persistent environment objects should survive foreground state changes;
4. reveal impact and stable result presence are separate presentation states;
5. persistent audio needs explicit ownership, baseline ducking and deterministic retirement;
6. reward transfer presentation must visualize already-owned durable value;
7. repeated cues and long transfers need bounded variation/density control;
8. expensive visual/audio work must have explicit lifetime and density limits.

There are several strong reusable candidates, but **`EXTRACT_NOW`: none**.

That is intentional. The current implementation contains important Signal 2000 policy and several one-project assumptions that a second consumer should expose before any shared API is frozen.

---

# Classification summary

| Capability / implementation area | Classification | Current decision |
| --- | --- | --- |
| Pointer-driven planar perspective + material response | `REUSABLE_CANDIDATE` + `WAIT_FOR_SECOND_CONSUMER` | Strong low-content-burden depth primitive; current shader/API contains pouch-specific assumptions |
| Pointer normalization + smoothing + idle drift | `REUSABLE_CANDIDATE` + `WAIT_FOR_SECOND_CONSUMER` | Reuse the control law/pattern; do not extract the current `OpeningScene` code wholesale |
| Environment parallax / idle micro-life | `REUSABLE_CANDIDATE` | Pattern is strong; current scene values and object graph are project-specific |
| Persistent environment ownership across reveal/result | `REUSABLE_CANDIDATE` | Architectural rule, not necessarily a package |
| Continuous drag texture audio | `REUSABLE_CANDIDATE` + `WAIT_FOR_SECOND_CONSUMER` | Progress/velocity → bounded tactile texture is reusable; current timbre/profile is Signal-specific |
| Audio base/persistent-state ownership lifecycle | `REUSABLE_CANDIDATE` + `WAIT_FOR_SECOND_CONSUMER` | One of the strongest feel-side architecture candidates; current controller assumes app-lifetime singleton and rarity policy |
| Baseline ducking / anticipation subtraction | `REUSABLE_CANDIDATE` | Reuse semantics and envelopes; exact cue table is game-specific |
| Persistent rarity/result ambience synthesis | `GAME_SPECIFIC` implementation with reusable lifecycle grammar | Exact harmonic families, gains and rarity hierarchy must stay local |
| Repeated one-shot pitch variation | `WAIT_FOR_SECOND_CONSUMER` | Generic idea; implementation is tiny and cue-name-specific, package would add more overhead than value |
| Accumulation pitch contour | `REUSABLE_CANDIDATE` + `WAIT_FOR_SECOND_CONSUMER` | Useful semantic primitive; current CHIPS voicing and bounds are local |
| Reward token flight scheduling | `REUSABLE_CANDIDATE` + `WAIT_FOR_SECOND_CONSUMER` | Pure/testable timing plan; current one-token-per-unit assumption may not generalize |
| Reveal FX hierarchy / rarity mass | `GAME_SPECIFIC` data with reusable schema/pattern | Reuse the dimensions of hierarchy, not exact presets |
| Stable result breathing / presence | `REUSABLE_CANDIDATE` | Presentation-state concept; current values and Phaser choreography stay local |
| Silhouette-following item acknowledgement | `REUSABLE_CANDIDATE` + `WAIT_FOR_SECOND_CONSUMER` | Duplicate-image technique is cheap and effective; helper shape should be proven by another art pipeline |
| Contextual milestone placement from subject bounds | `REUSABLE_CANDIDATE` + `WAIT_FOR_SECOND_CONSUMER` | Useful layout primitive, but current safe bounds/result panel assumptions are scene-specific |
| HUD shimmer / Charged aura / Y2K color language | `GAME_SPECIFIC` | Visual identity, not infrastructure |
| Pouch optical sizing / offsets / tear visuals | `GAME_SPECIFIC` | Authored-asset correction and interaction geometry must stay local |
| `OpeningScene` presentation orchestrator | `GAME_SPECIFIC` | Never extract wholesale; split only when a second project proves a real seam |
| Render pixel-ratio cap / filter supersampling | `REUSABLE_CANDIDATE` | Technical production pattern; Phaser/filter assumptions prevent blind extraction |

**`EXTRACT_NOW`: none.**

---

# 1. Pointer-responsive planar depth

## Sources

- `src/game/ui/pouchPerspective.ts`
- `src/game/ui/openingVisuals.ts`
- pointer-follow logic in `src/game/scenes/OpeningScene.ts`

## What the implementation actually does

Signal 2000 does not fake depth with simple rotation. The pouch/collectible art is rendered through a projective homography so the image remains a planar surface whose straight lines stay straight while yaw/pitch changes.

The shader then layers material response on top of that projection:

- pose-dependent sheen;
- edge/rim response;
- optional outline contribution;
- tint/material response;
- alpha-aware sampling so transparent collectible silhouettes remain intact.

The scene converts pointer position into bounded yaw/pitch, smooths the response exponentially, and returns the object toward rest when pointer-follow is not active. A low-amplitude idle drift appears only after the pointer has been still for a delay.

The same controller is used for the pouch and result collectible, but with different material profiles and different yaw/pitch limits.

## Why this is reusable

This is a high-value solution for small 2D games because it produces a tactile premium hero object without:

- modelling a 3D asset;
- authoring multiple view angles;
- maintaining a real 3D scene;
- increasing content burden for every collectible.

The reusable semantic capability is approximately:

`normalized pointer pose → bounded planar projection → material/light response → smooth rest`

## Why the current file must not become a shared API unchanged

`pouchPerspective.ts` still contains one-project assumptions:

- the filter node is named around the pouch;
- base filter dimensions are tuned to the current presentation;
- warp magnitude is hard-coded inside `buildInverseHomography`;
- supersampling mutates child container scale to work around Phaser internal filter rasterization;
- the shader distinguishes the stronger pouch material from collectible material by inferring a `pouchMaterial` factor from `sheenStrength` around the current pouch profile threshold;
- current material tint/strength semantics are tuned to Signal 2000 art.

That `sheenStrength → pouchMaterial` inference is especially important: it is a useful current-project optimization, but it is not a generic material API.

## Second-consumer extraction trigger

A second project needs a flat image/container to behave like a pointer-responsive planar hero.

At that point compare both implementations and likely separate:

- projection geometry profile;
- smoothing/control profile;
- material profile;
- render-density/supersampling policy;
- engine-specific filter lifecycle.

Do not export `attachPouchPerspective` as the generic contract merely by renaming it.

---

# 2. Pointer normalization, smoothing and idle drift

## Sources

- `OpeningScene.update()`
- `OpeningScene.drivePerspective()`
- `OpeningScene.syncDepthShadow()`

## Current behavior

The scene:

- follows only a real mouse/hover pointer when appropriate;
- normalizes pointer position around viewport center;
- records last meaningful pointer movement;
- delays idle drift so it cannot fight active player intent;
- blends yaw/pitch toward a target using a delta-time-based exponential response;
- drives a small shadow offset from the same semantic pose;
- reuses the same normalized pose for subtle environment parallax at lower visual priority.

This is better than directly assigning object angle/position from raw pointer coordinates because it creates a semantic pose that multiple effects can consume consistently.

## Reusable seam

A future generic seam may be something like:

`PointerPoseState { x, y, idleWeight, active }`

plus target-specific response profiles.

However, there is not enough evidence yet to know whether the shared primitive should own:

- pointer event policy;
- smoothing;
- idle drift;
- pose derivation;
- or only the normalized state.

The next materially different game should answer that.

## Do not refactor now

Current behavior is stable and directly tied to a polished high-frequency interaction. Moving it only to make the code look reusable would create risk with no user-facing gain.

---

# 3. Environment continuity and idle micro-life

## Sources / evidence

- persistent environment layers in `OpeningScene`
- `AMBIENT_PRESENTATION` in `src/game/data/presentation.ts`
- `docs/HANDS_ON_FEEL_CORRECTIONS_REVIEW_2026-09-09.md`

## Important production lesson

The expensive mistake was not merely “too much flash”. The old result path recreated the root/environment during reveal → result, which regenerated ambient positions and made the authored room appear to jump.

The correction was architectural:

- persistent environment identity lives separately from foreground/chrome recreation;
- normal reveal/result/collect transitions preserve environment objects;
- broad reveal tint lives inside the persistent environment stack rather than replacing the world;
- ambient motes/glows survive foreground state changes;
- resize may legitimately rebuild for new layout metrics, ordinary state changes may not.

The repeated-use browser gate later verified the same environment root and the same 27 ambient objects survived reveal → result → idle.

## Reusable classification

This is a `REUSABLE_CANDIDATE` as an ownership rule, but probably **not** a code package.

A useful future scene architecture is:

- `environment layer`: long-lived;
- `state foreground`: replaceable;
- `transient impact layer`: bounded lifetime;
- `UI/chrome`: stable or separately owned.

The lesson is more valuable than extracting Signal 2000's ambient-particle code.

---

# 4. Ambient visual density

## Source

`AMBIENT_PRESENTATION` in `src/game/data/presentation.ts`.

The current implementation deliberately bounds:

- object count;
- alpha;
- glow count/radius;
- drift range;
- movement duration.

This matters because idle life is an always-running cost. The shared polish acceptance order is still:

`input responsiveness > frame stability > semantic readability > decorative richness`

## Classification

The exact particle/glow recipe is `GAME_SPECIFIC` presentation data.

The reusable rule is:

- asynchronous;
- low amplitude;
- bounded count;
- slow enough not to read as active gameplay;
- persistent across foreground transitions;
- removable without harming the core loop.

No shared particle system is justified.

---

# 5. Continuous interaction → tactile drag audio

## Sources

- `DRAG_TEXTURE_PROFILE`
- `getDragTextureMix()`
- `GameAudioController.primeDragTexture()`
- `GameAudioController.setDragTexture()`
- `updateDragTexture()` / idle decay / stop logic
- drag progress/velocity calculation in `OpeningScene`
- `tests/audio-presentation.test.ts`

## Current shape

Raw drag movement is reduced to two semantic inputs:

- progress;
- normalized velocity.

Those inputs drive a bounded audio texture:

- gain/intensity;
- band-pass center frequency;
- filter Q.

The implementation also has a startup envelope/cap so the first pointer delta cannot create a harsh burst, plus an idle-release timer so the texture drops out when the pointer stops moving even if the drag state still exists.

Release/cancel/scene shutdown explicitly stop the texture.

## Why this is a strong candidate

The reusable capability is not “foil ripping sound”. It is:

`continuous interaction state → low-latency bounded texture feedback`

This could apply to:

- dragging;
- scraping;
- charging;
- drilling;
- winding;
- pouring;
- placing;
- steering;
- other one-input tactile loops.

## What must remain local

Current:

- filter frequencies;
- gain ceiling;
- Q range;
- startup tuning;
- noise character;
- progress-vs-velocity weights

are all game/timbre policy.

A second consumer should define whether the shared thing is only a normalized interaction state, a generic parameter mapper, or an audio-node controller.

---

# 6. Audio ownership architecture

## Sources

- `src/game/systems/audio.ts`
- `src/game/data/audioPresentation.ts`
- `tests/audio-presentation.test.ts`
- `tests/audio-runtime-contract.test.ts`
- browser/lifecycle evidence in the final audio acceptance docs

## This is the strongest feel-side architecture candidate

The controller separates several concepts that were easy to accidentally stack during polish:

- a long-lived base ambience;
- a currently active persistent result state;
- a desired persistent result state;
- queued state transition;
- one-shot foreground cues;
- temporary base ducking;
- result-state banking lift;
- continuous drag texture;
- mute/platform-blocked lifecycle.

The important semantic ownership is explicit:

- a persistent result state has one owner;
- switching owner retires the previous owned graph;
- foreground cues can temporarily duck the base without taking permanent ownership;
- entering a new physical/reveal cycle clears stale result ownership;
- mute suspends rather than rebuilding the graph;
- result banking modulates the currently owned result state instead of spawning a second soundtrack.

This architecture was validated through repeated holds, result page switching, mute/unmute, banking and resize without source-count growth.

## Why current `GameAudioController` is not a shared library yet

It still bakes in important assumptions:

- global singleton lifetime (`gameAudio`);
- one browser `AudioContext` for the whole game lifetime;
- rarity-specific state names/types;
- cue-name switch tables;
- exact synth graphs and harmonic families;
- no public explicit `dispose()` for the base graph because the current singleton is expected to live for the page lifetime;
- direct `window.setTimeout` ownership;
- direct connection to `context.destination` rather than an injected master bus;
- Signal 2000-specific result/banking vocabulary.

A shared component would need explicit lifecycle ownership instead of inheriting the current page-lifetime singleton assumption.

## Likely future abstraction boundary

If another project needs persistent owned audio states, compare both and consider a core roughly shaped around:

- `setOwnedState(key | null)`;
- `duck(envelope)`;
- `setOwnedStateProgress(0..1)`;
- `setMuted()` / `setBlocked()`;
- deterministic retirement/dispose;
- injected profile/factory functions that create project-specific audio graphs.

The shared core should not know what `rare`, `secret`, `chip-clack` or `pouch-grab` mean.

---

# 7. Anticipation through temporary subtraction

## Sources

- `REVEAL_ANTICIPATION_AUDIO`
- `getAudioCuePresentationDirective()`
- `beginRevealAnticipation()`
- base ducking logic in `audio.ts`

## Current design

Signal 2000 reserves deliberate pre-reveal subtraction for Epic and above. Higher-value states suppress the baseline more strongly and for a slightly longer recovery.

Foreground cues also have explicit duck envelopes. This means hierarchy is not produced only by adding louder/more layers.

## Reusable lesson

`value event → temporarily reduce lower-priority baseline → impact → restore/hand off to persistent state`

The exact rarity thresholds and multipliers are game-specific.

## Extraction decision

Do not create a generic “rarity duck engine”.

If a second project needs attention ownership, the reusable interface should speak in generic focus/duck envelopes, supplied by project policy.

---

# 8. Persistent result presence

## Visual sources

- `MOTION_PRESENTATION.rewardBreath*`
- result presence profiles in `presentation.ts`
- result choreography in `OpeningScene`

## Audio sources

- rarity ambience profiles
- `setResultAmbience()` / `clearResultAmbience()`
- `setResultBankingProgress()`

## Architecture

Signal 2000 separates:

1. anticipation;
2. transient impact/reveal;
3. settled persistent result;
4. accept/banking;
5. cleanup/return to idle.

This is one of the most important boundaries discovered in the project. Premium presentation does not end when the reveal tween ends. The result remains subtly alive while the player reads it.

The stable state is intentionally held to a different standard than the impact burst: it must survive a 30-second hold without obvious lifecycle growth and should remain subjectively comfortable.

## Reuse decision

The state model is reusable; exact rarity presentation is not.

Do not export `REVEAL_FX_PRESETS` as a universal rarity system.

---

# 9. Rarity/value hierarchy through multiple dimensions

## Source

`REVEAL_FX_PRESETS` plus material/audio profiles.

The current tiers differ across more than simple magnitude:

- backdrop contribution;
- flash/glow;
- ring scale;
- particle density and travel;
- overshoot;
- intro/settle timing;
- anticipation hold;
- optional secondary ring;
- aftershock;
- camera shake;
- material sheen/rim;
- persistent audio density, width and baseline ducking.

## Reusable rule

Value hierarchy should be compositional and bounded, not `same animation × louder/bigger`.

## Why the data should stay local

These presets encode the actual emotional language of Signal 2000. Another game's “legendary” may be heavy, quiet, violent, soft, mechanical, organic or comic.

The potentially reusable artifact is a schema/checklist of hierarchy dimensions, not these exact numbers.

---

# 10. Repeated one-shot variation

## Sources

- `ONE_SHOT_PITCH_VARIATION`
- `getOneShotPitchVariation()`
- `GameAudioController.schedule()`

## Current implementation

Small playback-rate/pitch variation is applied only as presentation randomness. Gameplay RNG is not consumed.

Variation amounts differ by semantic cue family; some highly authored/timing-sensitive sounds such as `chip-clack` and `pouch-grab` explicitly opt out.

## Classification

`WAIT_FOR_SECOND_CONSUMER`.

This is already trivial to reproduce and the current helper is keyed to Signal-specific cue names. A shared package would not save meaningful code yet.

Future reusable shape, if needed:

`playOneShot(asset, { pitchVariation })`

rather than a switch over game cue names.

---

# 11. Accumulation contour

## Sources

- `CHIP_PITCH_PROFILE`
- `getChipPitchMultiplier()`
- `OpeningScene` banking progression
- `playChipClack(progress)`
- reward-banking/audio acceptance evidence

## Current behavior

One rising contour spans the entire durable banking transaction, including multi-page Hidden Pocket banking. It does **not** reset for every reward leg or every carousel owner.

Small local jitter sits around the global contour.

The important semantic input is therefore:

`progress through total accepted transfer`

not `progress through current animation leg`.

## Reusable candidate

This can generalize to any bounded transfer where pitch/brightness/scale should communicate accumulation.

The current CHIPS frequencies, curve and ceiling are local presentation policy.

---

# 12. Reward token flight planning

## Sources

- `src/game/systems/chipFlight.ts`
- `tests/chip-flight.test.ts`

## Positive properties

The planner is already pure and testable:

- normalizes amount;
- bounds total duration;
- distributes token emission over a window;
- caps audio density independently from visual token count;
- ensures the final clack still lands.

That is a good architecture shape: presentation density policy is computed before the scene starts scheduling individual effects.

## Important non-generic assumption

The current plan creates one visual token per CHIPS unit. That is acceptable for current reward magnitudes but may be wrong for a second game with values in hundreds/thousands/millions.

A generic transfer system may need to separate:

- semantic amount;
- displayed token count;
- counter interpolation;
- audio event count.

Therefore this is `WAIT_FOR_SECOND_CONSUMER`, not `EXTRACT_NOW`.

---

# 13. Silhouette-following acknowledgement

## Sources / evidence

- image-backed collectible construction in `openingVisuals.ts`
- NEW/discovery presentation in `OpeningScene`
- `OPENING_FEEL_PRESENTATION` outline settings
- hands-on correction review

## Production lesson

A universal rectangular “NEW” frame failed because collectible shapes differ materially. The successful direction derives acknowledgement from the actual rendered item alpha/silhouette by placing tinted image copies behind the source art.

This produces object-aware emphasis without a custom shader framework.

## Reusable candidate

Potential future helper:

`createImageSilhouetteAccent(image, profile)`

But a second project should prove:

- whether source art is also image-backed;
- acceptable duplicate count/performance;
- whether tint copies work with its blend/material pipeline;
- whether the accent should be transient, persistent or both.

Do not introduce a general outline shader into Signal 2000 merely for abstraction purity.

---

# 14. Contextual notification placement

## Sources / evidence

- collection milestone presentation in `OpeningScene`
- `COLLECTION_MILESTONE_PRESENTATION`
- hands-on correction review

## Current rule

Milestone UI is positioned from the active collectible's transformed bounds, then clamped into safe UI space and kept stable after placement. It does not blindly follow a breathing/animated subject every frame.

This is a good general UI principle:

`contextual event → resolve subject bounds once → choose nearby safe side → clamp → keep UI stable`

## Reusable candidate

A second consumer could justify a pure placement helper operating on logical rectangles and safe areas.

Current side preference, panel avoidance and exact offsets remain scene policy.

---

# 15. Render density and supersampling

## Sources

- `src/game/systems/renderDensity.ts`
- filter supersampling in `pouchPerspective.ts`

## Current production shape

There are two distinct controls:

1. the game-wide backing-store pixel ratio is capped to avoid unbounded HiDPI cost;
2. filtered hero art gets bounded local supersampling because Phaser rasterizes internal filters at raw object bounds before world scale.

This is a good example of targeted quality spending: the whole game is not rendered at an arbitrarily high DPR merely to keep one hero filter sharp.

## Reuse decision

The principle is reusable immediately.

The implementation remains Phaser/filter-specific and should not be promoted to a cross-project package until another project actually uses the same rendering path.

---

# 16. Pouch-specific visual implementation

## Sources

- `POUCH_PRESENTATION`
- `POUCH_VARIANT_PRESENTATION`
- `createPouchVisual()`
- `openingEconomyVisuals.ts`

These should remain `GAME_SPECIFIC`:

- authored pouch offsets;
- Basic/Charged optical corrections;
- themed-pouch body correction;
- star-tab position/travel;
- tear-strip cropping behavior;
- foil opening lip/glow;
- Charged aura geometry;
- Y2K colors and iconography.

Even where the code is parameterized, these values exist to correct specific production rasters and preserve the current interaction geometry.

Do not convert asset repair tables into a shared “pouch component”.

---

# 17. OpeningScene is an orchestrator, not a library candidate

`OpeningScene` contains the integrated choreography that made the project feel coherent:

- input;
- environment;
- pointer response;
- pouch interaction;
- reveal timing;
- result carousel;
- milestone UI;
- audio state transitions;
- reward banking presentation;
- skip/resize/recovery handling.

Its size does **not** mean the correct solution is a generic scene superclass.

The valuable reuse seams are the smaller semantic pieces identified above. A future project should compose only the pieces it actually needs.

A shared “OpeningScene framework” would force Signal 2000's exact interaction grammar onto unrelated games and create configuration complexity larger than the production burden it saves.

Classification: `GAME_SPECIFIC`.

---

# 18. Current test / acceptance boundary

## What unit tests protect well

Current tests protect several important quantitative contracts:

- base ambience avoids the rejected low machine-hum direction;
- slow ambient modulation remains bounded/asynchronous;
- persistent rarity state density/mix remains ordered;
- one-shot variation stays narrow;
- CHIPS pitch contour is monotonic and bounded;
- drag texture gain/frequency/startup burst are bounded;
- anticipation subtraction is reserved for higher-value states;
- persistent-state fade/mix ranges stay bounded;
- token-flight duration and audio density remain bounded.

## What browser/lifecycle gates proved historically

The retained acceptance evidence covers:

- repeated real tear loops;
- environment object continuity;
- stable persistent audio source counts;
- 30-second rarity holds without graph growth;
- result page ownership switches without stacking;
- mute/resume without duplicated audio graphs;
- banking across both Hidden Pocket owner orders;
- resize during reveal/result/banking;
- return to stable idle ownership.

## What automation cannot prove

It cannot prove:

- pleasant timbre;
- fatigue;
- emotional quality;
- visual taste;
- whether a material response feels physically convincing;
- whether exact intensity feels right after many minutes.

That remains hands-on acceptance, not a missing unit test.

---

# 19. Implementation risks to remember before extraction

These are not current bugs; they are assumptions that a shared implementation would have to make explicit.

## Audio controller lifetime

The base audio graph is designed around a page-lifetime singleton. A reusable component needs explicit creation/disposal ownership and should not assume a single game instance forever.

## Material mode inference

The current shader infers stronger pouch treatment from the numeric sheen-strength range. A generic material contract needs an explicit profile/mode instead of hidden threshold semantics.

## Filter supersampling mutation

Supersampling adjusts child/container scale to work around Phaser internals. A reusable API must guarantee it is applied exactly once or otherwise make the transformation idempotent.

## Scene-owned normalized gesture

Progress/velocity derivation currently lives close to pouch geometry. A generic gesture layer must not destabilize the tested tear threshold/travel just to expose a prettier API.

## Visual token count vs semantic amount

Current reward flight can afford one visible token per unit. Another economy may require compressed visual density while the counter still represents the full amount.

## Exact rarity vocabulary

Common/Rare/Epic/Legendary/Secret is Signal 2000 policy. Shared presentation-state ownership must use arbitrary semantic keys/profiles instead.

---

# 20. Recommended second-project reuse order

When the next low-burden Yandex game starts, reuse in this order:

1. inherit the **feel doctrine and acceptance rules**, not code;
2. identify its single highest-frequency interaction;
3. if the interaction is continuous, expose normalized progress/velocity/direction before adding effects;
4. try the pointer-depth/material pattern only if the hero object benefits from it;
5. preserve environment continuity from the first scene architecture pass;
6. model transient impact and stable result as separate states when the game has a held reward/result;
7. give persistent audio/visual states explicit owners and cleanup paths;
8. derive transfer animation from already-owned durable state;
9. apply bounded repetition/accumulation variation only after the core loop works;
10. after both projects exist, compare concrete code before extracting anything.

If the second project does not need a capability, that is evidence **against** generalizing it prematurely.

---

# 21. Extraction priority if a second consumer appears

If another project independently needs the same behavior, evaluate shared code in approximately this order:

1. **owned persistent audio-state lifecycle** — high lifecycle value, high bug-prevention value;
2. **planar pointer-depth/material controller** — high perceived value with low content burden, but engine-specific;
3. **continuous interaction semantic state / texture mapping** — high-frequency feel value;
4. **reward transfer scheduling/density plan** — pure/testable and presentation-only;
5. **contextual subject-bound placement** — small, useful pure layout seam;
6. **silhouette accent helper** — only if both projects use compatible image-backed art;
7. **one-shot variation / accumulation helpers** — likely too small to justify standalone packaging unless bundled into an already-proven audio layer.

Do not prioritize extracting particle presets, rarity constants, Y2K materials or `OpeningScene` choreography.

---

# 22. Stop rule

This inventory closes the implementation-side preservation pass for Signal 2000 feel/polish.

No further production refactor is justified solely by the desire to make the existing project reusable.

Reopen code extraction only when one of these becomes true:

- the current project has a concrete maintenance/performance/lifecycle problem;
- another real game needs the same semantic capability;
- repeated implementation shows a stable common contract;
- keeping two local implementations is demonstrably more expensive or risky than sharing one.

Until then:

- keep the current tuned production code stable;
- reuse the production lessons through `DanilaH/decisions`;
- preserve exact current behavior unless a user-facing defect justifies a bounded correction.
