# Audio + Reward Feel Polish Plan

Status: **IMPLEMENTED / COMBINED-AUDITED / FINAL HEADPHONE HANDS-ON PENDING**

This document captures the full bounded polish direction discussed after the current result-grid and rarity-presence work. It is intentionally about **feel, tactility, reward readability and audio presence**. It is not permission to expand the game into new meta systems.

The bounded implementation in this plan was deliberately pulled forward and is now merged. The current external gate still remains hosted Yandex DRAFT unless explicitly reprioritized. Automated and browser acceptance are green, but the subjective final headphone check required by this document has not been replaced by automation.

## Product principle

The goal is to make the existing short loop feel more expensive and alive without adding production-heavy content:

`idle ambience → pouch interaction → anticipation → reveal → rarity state → discovery/duplicate meaning → collect/banking → return to idle`

Core visual/audio identity remains:

> **Cozy Y2K world, electric digital UI.**

The important shift is from “more effects” to a coherent **stateful presentation system**: the game should always have a readable acoustic/visual state, stronger rewards should stay present after their transient reveal, and every transition should explain what just happened through feel rather than extra systems.

---

# 1. Base gameplay ambience

## Why

The ordinary Opening scene is currently too empty in headphones when no foreground SFX is playing. Silence should become an intentional effect, not the default background state.

## Direction

Use a restrained hybrid bed rather than a conventional song loop:

- very quiet room/device ambience;
- soft electronics/transformer/CRT-like hum;
- faint air/noise texture;
- rare subtle digital shimmer/flicker;
- an extremely slow warm ambient music layer/pad;
- little or no memorable melody;
- avoid an obvious 30–60 second loop that the player learns immediately.

Preferred musical behavior:

- almost structureless ambient;
- ideally 2–4 minutes before any obvious repeat, or multiple asynchronous layers that produce an effectively non-repeating bed;
- warm/nostalgic rather than dramatic;
- Y2K/digital character should come from timbre and small accents, not aggressive synthwave.

The desired idle perception is approximately:

`soft room air + faint electronics hum + sparse digital shimmer + slow warm pad`

This layer exists to remove digital vacuum, not to demand attention.

---

# 2. Persistent rarity ambience in result state

## Core behavior

After the transient reveal SFX finishes and the collectible settles, higher rarities should continue to “sound alive” until the player accepts/closes the result.

Treat this as a **result-state ambience loop**, not a one-shot SFX.

Lifecycle:

`reveal transient ends → rarity ambience fades in over ~200–400 ms → seamless loop while result is open → fade out over ~150–300 ms on collect/exit`

It must also stop cleanly on scene teardown, recovery transitions, mute, resize-driven recreation and Hidden Pocket page changes.

## Rarity ladder

- **Common:** no persistent rarity loop. The base gameplay ambience remains the baseline.
- **Rare:** barely audible soft electrical hum/air layer. More felt than heard.
- **Epic:** stronger version of the same family with light high-frequency modulation / digital shimmer.
- **Legendary:** richer layered hum, more width and slow modulation/pulse; optional very sparse tonal sparkle.
- **Secret:** separate premium/anomalous identity; wider, deeper, more uncanny/premium drone with its own sparse accents. Secret must remain clearly above Legendary.

Do not scale rarity only by loudness. Intensity should come from a bounded combination of:

- volume;
- number of layers;
- modulation depth/density;
- stereo width;
- filter/pitch movement;
- sparse tonal accents;
- pulse character.

Starting mix targets are only rough references and must be tuned by ear, not treated as locked numbers:

- Rare around `-28 dB`;
- Epic around `-24 dB`;
- Legendary around `-21 dB`;
- Secret around `-19 dB`.

Persistent rarity ambience must remain below important foreground SFX and should duck subtly when stronger transients play.

## Audio/visual coupling

Where possible, the slow rarity ambience modulation should loosely share the rhythm of the persistent visual rarity presence/breathing. Do not hard-sync every visual pulse; the goal is one coherent state, not a metronome.

---

# 3. Audio state machine and mixing rules

Do not implement the new layers as unrelated `.play()` calls. Define a small explicit presentation state/mix policy.

Required states/transitions:

1. **Idle**
   - base room/device ambience active;
   - ambient music bed active.

2. **Grab / drag / tear**
   - base bed remains but ducks slightly;
   - tactile foreground interaction takes priority.

3. **Reveal anticipation**
   - ambience/music may dip more strongly;
   - high-rarity anticipation may use a very short near-silence window.

4. **Reveal transient**
   - reveal SFX owns the foreground;
   - base ambience/music is clearly ducked.

5. **Result / Common**
   - base ambience/music returns toward normal;
   - no additional persistent rarity loop.

6. **Result / Rare–Legendary**
   - base ambience/music returns partially;
   - rarity ambience fades in and occupies the reward state.

7. **Result / Secret**
   - Secret ambience overrides/supersedes ordinary standard rarity presence;
   - background may remain more strongly ducked so Secret owns the scene.

8. **Collect / banking**
   - rarity ambience fades out;
   - banking/transfers own the foreground;
   - idle bed returns fully after the next pouch state is ready.

9. **Mute / scene exit / teardown**
   - all persistent loops stop deterministically;
   - no orphaned loop may survive root recreation or scene shutdown.

## Transient priority

Avoid everything firing at equal importance. Suggested hierarchy:

`Secret reveal > Legendary reveal > NEW discovery > Signal > CHIPS/recycle > ordinary UI`

Only one or two events should read as foreground peaks at a time. Use ducking/staggering instead of stacking many equally loud cues.

---

# 4. Silence as a deliberate high-rarity effect

Once a base ambient bed exists, short silence becomes valuable.

For Epic/Legendary/Secret, especially Legendary/Secret, consider a brief `~150–300 ms` collapse of the ambient bed immediately before the reveal impact. The absence of sound should create anticipation, followed by the transient hit.

Do not use this on every opening. If silence becomes routine, it loses its effect.

---

# 5. NEW discovery vs DUPLICATE feel

Rarity and newness are **independent axes**.

A Legendary duplicate must still feel Legendary. A new Common should still receive a discovery acknowledgement even though its rarity presentation is modest.

## NEW / first discovery

After rarity reveal/settle, add one brief discovery beat:

- short `NEW DISCOVERY` / `ADDED TO COLLECTION` style acknowledgement;
- small outline sweep or light burst around the collectible;
- separate bright discovery chime;
- tiny scale/pop around `1.02–1.04`;
- approximately `350–600 ms` total extra emphasis;
- then settle into the ordinary rarity result state.

Prefer an “item has been registered into the collection/catalogue” feeling over another giant celebration screen. This fits the Y2K/digital identity and keeps the loop compact.

Suggested semantic order:

`rarity reveal → item settles → NEW discovery ping → stable result state`

## DUPLICATE

Do **not** replay the NEW/discovery accent.

A duplicate should have a different satisfaction identity:

- ordinary rarity reveal still plays in full;
- no discovery burst/chime;
- communicate `DUPLICATE` clearly;
- make recycle/conversion feel satisfying instead of disappointing;
- a tighter digital/mechanical recycle snap or crackle is appropriate;
- visually emphasize `RECYCLED +X`, Signal gain and any relevant Overcharge state;
- transition toward economy meaning rather than collection meaning.

The target distinction is:

- NEW = **discovery satisfaction**;
- duplicate = **conversion/progression satisfaction**.

---

# 6. Anticipation before reveal

The moment before the collectible appears is an underused source of feel.

Potential bounded ingredients:

- short pause after complete tear;
- slight ambience duck;
- tiny pitch/tension rise;
- `~100–200 ms` hold before emergence;
- stronger version only for higher rarities.

Do not turn every opening into a long suspense animation. The player already has fast-forward; anticipation should intensify the reveal without slowing the normal loop materially.

---

# 7. Rarity-specific settle / perceived mass

Different rarities should not only have different particles/glow. The collectible itself can settle differently.

Direction:

- **Common:** quick, clean, relatively dry settle;
- **Rare:** slightly softer/longer settle;
- **Epic:** visible but restrained overshoot;
- **Legendary:** heavier settle with a secondary micro-pulse/aftershock;
- **Secret:** remains its own strongest bespoke treatment.

This should be implemented through bounded easing/duration/overshoot differences, not a new animation framework.

The goal is perceived rarity “mass”, not random motion.

---

# 8. Collect / banking choreography

Reveal quality alone is not enough. The reward state must also leave the screen satisfyingly.

Review the entire acceptance transition frame-by-frame:

`tap collect → result acknowledges input → collectible/reward state resolves → CHIPS/Signal move to destinations → result clears → next pouch becomes ready`

Questions to solve through feel:

- does the collectible look collected rather than merely hidden?
- do CHIPS visibly finish their journey into the wallet?
- does Signal clearly land independently?
- does rarity ambience fade before/through banking rather than cut abruptly?
- does the next pouch arrive as a fresh loop beat rather than a UI reset?

Candidate motion language:

- slight collectible contraction / pull toward Collection identity;
- reward sources fly to their real HUD destinations;
- controlled fade/slide of result chrome;
- clean return of idle ambience when the next pouch is actually ready.

No animation may own durable economy state.

---

# 9. Drag / tear tactility

The tear interaction can support a continuous material layer, not only grab and tear-end one-shots.

Candidate:

- very quiet friction/zip/grain texture while the tab is moving;
- pitch/brightness/volume can respond to normalized drag progress or velocity;
- stop immediately and cleanly on release/cancel/complete;
- remain subtle enough not to become irritating over repeated openings.

This is a likely high-ROI improvement because it makes the physical interaction itself feel materially responsive without new art.

Do not add physics or procedural simulation just to support this.

---

# 10. Collection milestone moments

Use rare milestones as one-shot celebration opportunities without adding a new meta system.

Candidates already discussed:

- `4/8` standards;
- `8/8` standards complete;
- first Secret discovered;
- `2/2` Secrets complete.

These may receive a slightly stronger one-off audiovisual beat because they occur rarely.

Constraints:

- no new currency;
- no new reward economy;
- no new upgrade tree;
- no extra permanent screen required;
- do not block the opening loop with a large modal unless later hands-on proves it necessary.

---

# 11. Near-completion tension

Without changing drop probabilities or adding targeting, the UI may help the player feel that completion is close.

Example state:

- `7/8` standards collected;
- one missing slot remains visible/recognizable in Collection;
- post-duplicate copy/presentation may subtly reinforce that the set is nearly complete.

This is presentation only. Do not silently alter loot resolution or add a hidden pity rule.

---

# 12. What not to add in this polish track

This plan does **not** justify:

- new currencies;
- shop/crafting/prestige;
- idle/offline systems;
- new family/Drop content;
- permanent giant odds/progress UI;
- a new animation framework/ECS;
- a large `OpeningScene` rewrite;
- economy retuning by intuition;
- extra blocking tutorial/modals;
- random FX for their own sake.

The target remains a better existing 20–30 second loop, not a larger game.

---

# 13. Recommended implementation order by ROI

1. **Base ambience + persistent rarity ambience + explicit audio-state/mix rules**
2. **NEW discovery vs DUPLICATE conversion feel**
3. **Collect/banking exit choreography**
4. **Drag/tear continuous tactility**
5. **High-rarity anticipation + deliberate silence + rarity-specific settle**
6. **Collection milestones**
7. **Near-completion presentation**

Do not implement all seven blindly in one giant patch. Each pass should remain bounded and independently reviewable, while final approval must judge the combined loop because feel depends on choreography across states.

## Implementation status — 2026-09-08

All seven bounded passes are implemented and merged without expanding the economy/content scope:

- **#75–#76 — audio presence/state ownership:** base gameplay ambience, persistent Rare/Epic/Legendary/Secret result ambience, explicit duck/mix policy, Hidden Pocket active-page ownership, mute/block/teardown handling, and stable-result ownership correction;
- **#77 — NEW vs DUPLICATE:** catalogue-registration discovery beat for NEW and a separate recycle/conversion beat for duplicates;
- **#78 — collect/banking handoff:** short collection acknowledgement, item contraction/nudge, controlled result exit and existing destination-based banking;
- **#79 — drag/tear tactility:** quiet reusable filtered-noise texture driven by drag progress/velocity with deterministic release/cancel/mute/teardown cleanup;
- **#80 — high-rarity anticipation/settle:** Common/Rare remain fast, Epic/Legendary/Secret receive bounded anticipation collapse and rarity-specific settle mass, with the secondary micro-aftershock reserved for Legendary;
- **#81 — collection milestones:** one-shot `4/8`, `8/8`, first Secret and `2/2` Secret milestones, resolved only after durable commit and presented non-blockingly;
- **#82 — near-completion tension:** typed `7/8` read state, subtle Collection reinforcement, actual final missing-slot emphasis and low-priority result-tray copy, with Hidden Pocket page semantics preserved.

Final combined automated/browser acceptance was run from exact merged `main` `60432c8d7da1049bff9ec9230527a67b4e5b3cb0` in workflow run `34266189951`. Typecheck, full tests, asset self-test/validation, production build, source-contract guard and the combined browser lifecycle all passed. The combined artifact `final-feel-combined-audit-r1` has digest `sha256:52b15131f568eed1319ce962b00b6f4d8a694096f28c64612f91896938617ca4`; it covered base ambience unlock, Common/Rare/Epic/Legendary/Secret result ownership, mute/unmute, high-rarity anticipation cleanup, Hidden Pocket standard↔Secret audio/visual state, repeated-loop source counts, drag texture teardown, collect/banking return to idle, near-completion presentation and one-shot milestones with zero runtime or failed-request diagnostics. Key screenshots were manually reviewed after the run.

This closes the implementation backlog and automated combined regression. It does **not** waive the acceptance principle below: final subjective repeated-use listening in headphones (and, ideally, ordinary speakers) is still required to judge annoyance, loudness, timbre and whether the scene became meaningfully better rather than merely busier.

---

# 14. Validation matrix

For any implementation from this plan, validate more than isolated screenshots.

## Audio lifecycle

- Common result held open for at least 30 seconds: no unintended rarity loop;
- Rare/Epic/Legendary held open: seamless persistent loop, no seam/click/pop;
- Secret result held open: Secret state clearly stronger than Legendary;
- collect from every rarity: clean fade, no orphan loop;
- Hidden Pocket Secret ↔ standard carousel: correct ambience follows active page/state;
- fast-forward reveal: audio state still resolves correctly;
- pending-reveal recovery: no duplicate persistent loop;
- scene exit/Collection return: no old loop survives;
- mute before/during result: immediate coherent state, no restart bug;
- repeated openings: no stacked loops and no progressive loudness increase.

## Mix/readability

- headphones at normal listening volume;
- laptop/phone speakers;
- foreground tear/reveal/Signal/CHIPS remain legible over ambience;
- ambience removes emptiness but does not become the subject;
- Rare < Epic < Legendary < Secret reads through timbre/density, not only loudness;
- NEW chime reads without masking rarity reveal;
- duplicate recycle cue reads without sounding like a failed reward.

## Visual + motion

- NEW and duplicate are distinguishable without reading every line of text;
- Rare/Epic/Legendary settle ladder is perceptible but not cartoonishly different;
- collect/banking transition looks like one continuous action;
- anticipation does not materially slow experienced repeated use;
- milestone effects remain rare and non-blocking;
- compact/RU layouts remain unaffected by presentation additions.

## Architecture invariants

- persistent sound state is presentation-only;
- no audio callback owns CHIPS/Signal/collection/save mutation;
- no duplicated economy on skip/recovery;
- no sound/tween survives scene teardown unintentionally;
- no large architecture rewrite is introduced for polish.

---

# 15. Acceptance principle

Technical green is necessary but insufficient.

For this track, approval requires:

1. typecheck/tests/assets/build green where applicable;
2. targeted lifecycle/browser assertions for state transitions;
3. recorded or directly reviewed audio/visual states;
4. repeated hands-on in headphones;
5. independent check that additional layers improved reward feel rather than merely making the scene busier.

The final criterion is simple:

> The opener should feel continuously alive, tactile and rewarding, while still being calm enough to repeat many times.
