# Hands-on Feel Corrections — 2026-09-09

Status: **APPROVED CORRECTION PASS / HANDS-ON FINDINGS**

This document records the first real repeated-use hands-on corrections after the implemented `AUDIO_AND_REWARD_FEEL_POLISH_PLAN.md` and the independent visual/feel pass merged through PR #85.

It does **not** reopen gameplay scope. These are corrections to presentation continuity, sound character, repeated-use variation and readability inside the existing opening loop.

Canonical product/architecture invariants remain unchanged:

- `pendingReveal` remains the durable reveal source of truth;
- presentation randomness must never participate in loot/drop/economy resolution;
- animation/audio never owns CHIPS, Signal, Overcharge, collection or save mutation;
- no new currency, meta, Drop, family, shop, progression system or large `OpeningScene` rewrite;
- Hidden Pocket page ownership and recovery/skip semantics remain intact.

---

# 1. NEW discovery frame must follow the collectible silhouette

## Hands-on finding

The current rectangular `ADDED TO COLLECTION` discovery frame is authored at one generic size. On tall/narrow art such as Flip Phone it visibly extends far beyond the collectible, reading as a misplaced UI rectangle instead of an item-registration effect.

## Approved correction

Remove the large universal rectangular frame.

For production collectible art, build a short **silhouette outline** from the collectible texture itself:

- reuse the same collectible image/texture already rendered for the result;
- create several tinted copies behind the original image, offset by a small radius in 8–12 directions;
- preserve source alpha so the accent follows the real transparent silhouette, including body/charm/profile details;
- original art stays above the copies, hiding their interior and leaving only the outer edge visible;
- keep the treatment short and subtle: fade in, one restrained pulse, fade out;
- use a small local fallback glow only if no image-backed collectible exists; never fall back to the oversized generic rectangle.

Suggested first-pass bounds:

- outline radius: about `2–4 px` in local rendered space;
- outline copies: `8–12`;
- intro/fade: about `220–300 ms`;
- no permanent outline in stable result state.

This is a discovery acknowledgement, not a new rarity system.

---

# 2. Collection milestone stays a toast, but becomes contextual and readable

## Hands-on finding

The current collection milestone toast appears near the global top-center and disappears too quickly to register during the result sequence.

## Approved correction

Keep it non-blocking, but place it **near the active collectible** rather than as a distant global notification.

Preferred placement:

- right side of active collectible bounds, with approximately `24–32 px` visual gap;
- vertically around the collectible center / slightly above center;
- clamp to safe viewport bounds and avoid the reward tray + result panel;
- if there is not enough room on the right, fall back to the left;
- position is derived from the active collectible/result bounds, not hard-coded specifically for Flip Phone.

The toast must live in UI space after placement; it should not wobble with reward breathing or collect motion.

Timing target:

- intro: `~220–280 ms`;
- readable hold: `~1.7–2.0 s`;
- exit: `~300–350 ms`;
- total visible beat: roughly `2.3–2.6 s`;
- completion milestones may be allowed slightly longer if hands-on proves useful.

It remains non-modal and must never block Collect.

---

# 3. Base ambience direction is currently wrong

## Hands-on finding

The current procedural bed reads as a **server-room / fan / machine hum**: continuous, pressurised and fatiguing instead of cozy. Lowering volume alone is not enough because the timbral direction itself is wrong.

## New sound direction

Base ambience should support the visual identity:

> **cozy room / soft air / dreamy Y2K desk / gentle magical electronics**

Avoid:

- dominant low electrical hum;
- fan-like broadband noise;
- constant industrial drone;
- dense low-mid energy that creates pressure;
- sci-fi engine-room character.

Prefer:

- much lighter room/air noise;
- reduced or removed 50/60-Hz-like machine-hum impression;
- warmer, softer pad voicing with less low-mid pressure;
- very sparse high soft shimmer / tiny room details;
- motion from slow asynchronous modulation rather than a constant audible fan layer;
- enough silence/headroom that foreground interaction remains pleasant.

The goal is not “more ambient sound”; it is **less fatiguing acoustic presence**.

---

# 4. Base ambience must duck materially under rarity ambience

## Hands-on finding

Base and rarity ambience currently combine into too much continuous sound. The rarity state should replace part of the acoustic attention, not merely stack on top.

## Approved correction

When Rare/Epic/Legendary/Secret persistent ambience is active:

- base ambience remains alive;
- base ambience becomes materially quieter through a smooth ramp;
- no hard cut;
- restore base smoothly when rarity ambience ends.

Use the existing `baseMixMultiplier` ownership rather than introducing another audio subsystem.

Directionally, the current multipliers are too conservative. Start from a stronger ladder and tune by ear, approximately:

- Rare: base around `0.65–0.72` of idle;
- Epic: around `0.52–0.60`;
- Legendary: around `0.40–0.48`;
- Secret: around `0.28–0.36`.

Exact values are not acceptance criteria; perceived hierarchy and calmness are.

---

# 5. Environment continuity is an invariant during reveal

## Hands-on finding

During the reveal there is a visible perceived “jump” in the environment. Whatever reveal treatment is appearing/disappearing currently reads as if the room itself changed state.

## New invariant

**The authored room and its ambient environmental life never disappear because an item is revealing.**

- base background stays present;
- ambient motes/glow pools stay present;
- environment motion is not rebuilt or hard-hidden for a reveal;
- reveal-specific backdrop/flash/halo/rings/particles are additive layers only;
- reveal-only atmospheric layers fade in and fade out rather than appearing/disappearing abruptly.

Target transition for reveal-only broad atmospheric layers:

- fade in around `~300 ms`;
- fade out around `~300 ms`;
- transient flash/ring particles may retain their shorter impact timing, but they must not look like the environment itself vanished/reappeared.

If the perceived jump comes from a broad overlay rather than actual ambient-particle teardown, fix the overlay lifecycle instead of weakening the persistent environment.

---

# 6. Persistent rarity ambience also needs a calmer timbral family

## Hands-on finding

Rare/Epic/Legendary/Secret ambience currently feels oppressive/tense rather than rewarding and calm.

## New direction

Rarity ambience should read as **wonder / premium sparkle / gentle resonance**, not threat or machine pressure.

- Rare: almost imperceptible airy tonal colour, no obvious drone;
- Epic: gentle widened shimmer / soft harmonic motion;
- Legendary: richer and more luminous, but still comfortable to hold open;
- Secret: distinctly premium/anomalous, but fascinating rather than ominous.

Reduce low sustained pressure. Prefer upper-soft harmonics, gentle suspended intervals, sparse shimmer and slower envelopes.

A result held open for `30 s` must not become annoying or make the player want to mute the game.

---

# 7. Repeated one-shots need bounded pitch variation; CHIPS should climb

## Hands-on finding

Repeated pouch/reveal/UI sounds expose their exact repetition quickly. CHIPS arrival has an opportunity for stronger accumulation feel.

## Approved correction

Add small **presentation-only pitch variation** to repeated one-shots.

Rules:

- samples: vary `playbackRate`/detune in a narrow range;
- synth fallback: multiply oscillator start/end frequencies by the same bounded pitch factor;
- variation must be subtle enough to preserve cue identity;
- do not randomise duration/timing wildly;
- no gameplay RNG is consumed.

Suggested default pitch window for ordinary repeated UI/reveal cues: roughly `±2–4%`.

Likely candidates:

- tear / reveal-pop;
- pouch grab/select;
- ordinary UI click/skip;
- duplicate/recycle cue;
- Signal/UI transition clicks where repetition is obvious.

### CHIPS accumulation

CHIPS banking should use an **ascending pitch contour** across one bank leg/opening:

- early arrivals start near the base clack pitch;
- subsequent clacks rise gradually;
- clamp at a pleasant ceiling so large rewards do not become shrill;
- still retain a very small local variation around the contour;
- reset the contour for the next banking sequence.

The intended percept is `chips are filling / value is accumulating`, not a musical scale minigame.

---

# 8. Hidden Pocket carousel switch needs an audio acknowledgement

## Hands-on finding

Switching the active object/page in the result carousel has visible motion and ambience ownership changes, but no immediate tactile switch cue.

## Approved correction

Add a short, quiet `carousel-switch` / soft gadget-click cue when the selected carousel index actually changes.

- fire once after a completed index change, not continuously during drag;
- do not fire when a gesture resolves to the same index;
- small bounded pitch variation is appropriate;
- keep it below rarity/reveal/Secret foreground priority;
- ambience page ownership still follows the active item exactly as today.

Prefer a procedural soft click for the first pass unless a reviewed production sample already exists.

---

# 9. Implementation order

Treat this as a correction series, not one blind giant patch.

1. **Visual continuity + NEW silhouette outline**
   - replace generic discovery frame;
   - verify room/ambient layers never disappear;
   - fade broad reveal-only atmosphere in/out.
2. **Contextual milestone toast**
   - bounds-aware placement;
   - longer dwell;
   - no overlap/blocking regression.
3. **Audio direction + stronger rarity ducking**
   - calm base timbre;
   - calm rarity timbre;
   - stronger base duck under persistent rarity.
4. **Repeated SFX variation + CHIPS pitch climb + carousel click**
   - narrow random pitch;
   - bounded CHIPS contour;
   - actual-index-change carousel cue.
5. **Combined repeated-use acceptance**
   - headphones first;
   - normal speakers;
   - Common/Rare/Epic/Legendary/Secret;
   - Hidden Pocket page switching;
   - NEW/duplicate/milestones;
   - repeated fast-forward + collect;
   - recovery/resize/mute lifecycle.

---

# 10. Acceptance criteria

## Visual

- Flip Phone and Camera NEW discovery accent follows the art silhouette and never reads as an oversized generic rectangle;
- discovery treatment works with transparent padding/charm/art profile;
- no room/ambient mote/glow layer disappears or hard-jumps during reveal;
- broad reveal-only environment treatment fades in/out smoothly;
- milestone toast is noticed in ordinary viewing without searching for it;
- milestone toast stays near the active collectible, clamps safely and does not cover reward/result controls;
- Hidden Pocket standard/Secret pages keep correct presentation ownership.

## Audio

- idle no longer resembles a server room/fan at normal headphone volume;
- base ambience can remain on for several minutes without pressure/fatigue;
- rarity ambience is calmer and more rewarding than the current drone family;
- base ambience is clearly quieter while rarity ambience owns the result;
- no click/pop at rarity fade/switch/collect;
- repeated tear/reveal/UI cues no longer sound sample-identical;
- CHIPS clacks rise perceptibly but never become shrill;
- carousel switch gives one quiet tactile click per real page change;
- no persistent source stacking across repeated result/carousel cycles.

## Architecture / lifecycle

- presentation randomness never changes drop/save/economy outputs;
- skip/recovery does not replay acquisition semantics or duplicate reward ownership;
- mute/block/scene shutdown leaves no persistent ambience/drag/tween/audio orphan;
- resize during reveal/result remains recoverable;
- no new framework or large scene rewrite.

---

# 11. Explicit non-goals

Do not use this correction pass to add:

- new content/families;
- new currency/reward rules;
- music system/menu;
- settings screen beyond existing mute behavior;
- expensive shader framework solely for the discovery outline;
- particles everywhere just because presentation now supports randomness;
- full Collection-scene animation pass unless hands-on evidence later shows a real coherence problem.

The correction is successful when the existing loop feels calmer, more continuous, less stamped and easier to read repeatedly.