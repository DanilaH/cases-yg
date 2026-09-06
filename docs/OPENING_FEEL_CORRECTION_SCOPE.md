# Opening Feel Correction — implementation scope

Status: **LOCKED IMPLEMENTATION SCOPE — NEXT PRODUCT PASS**

This pass is the direct response to the first real repeated-use hands-on of the merged Gameplay Loop Lite V2 build. The Lite V2 mechanics, transaction model and first-pass balance remain intact. The problem exposed by hands-on is primarily **feel, pacing, hierarchy and feedback**, not missing economy systems.

The target is:

> **Make the same opener feel more tactile, responsive, readable and electrically Y2K without adding another gameplay system.**

The visual-language rule for this pass is:

> **Cozy Y2K world, electric digital UI.**

Hotline Miami is a reference for energetic neon/digital emphasis, not a target to copy wholesale. The illustrated background, pouch fantasy and collectible art remain softer and more toy-like; CHIPS, Signal, Charged, rarity and interactive states carry the stronger electronic language.

A second implementation principle is now locked:

> **Every new animation must either provide tactile/input feedback or make a cause → effect / state transition easier to feel and understand.**

Do not add motion only because motion looks decorative. Reward celebration is valid when it strengthens perceived impact; ambient spectacle that does not serve interaction, hierarchy or causality is not a reason to expand scope.

---

# 1. Evidence from hands-on

Observed friction / opportunities:

1. CHIPS transfer lacks a dedicated satisfying collection sound.
2. CHIPS HUD is too visually small for the importance of the resource.
3. Wallet changes need animated count-up and physical HUD reaction.
4. Basic/Charged controls are cramped and selected state is not obvious enough.
5. Important transient callouts disappear too quickly to read comfortably.
6. Exact rarity/drop information and collection contents are desirable, but are a separate information-design problem rather than core feel work.
7. CHIPS currently bank visually too early; reward components should first read beside the revealed item and transfer to HUD after the result is accepted.
8. Charged needs substantially stronger visual differentiation than the current aura alone.
9. `RESULT LOCKED` / non-responsive tapping is frustrating; the game should respect attempts to accelerate presentation.
10. The overall UI works functionally but does not yet have enough distinctive Y2K/electronic character.

Additional reviewer observation from exact-revision videos: several sequences still read as discrete state changes rather than one physically connected chain. The correction should make **action → reward → HUD progress** feel causally connected through motion and audio.

---

# 2. Scope boundaries

This is one integrated presentation/interaction pass, implemented in small internal commits but validated as one combined experience.

## In scope

- input responsiveness and click/tap fast-forward;
- pouch grab/tear tactile feedback;
- reward arrival/settle polish;
- staged CHIPS presentation and delayed visual banking;
- CHIPS count-up, HUD punch/shake and dedicated SFX;
- duplicate → recycle → CHIPS + Signal physical transfer;
- longer/readable callouts without slowing expert play;
- Basic/Charged selector hierarchy and interaction states;
- larger/more important resource HUD;
- stronger **runtime** Charged differentiation using current pouch art;
- restrained neon, iridescence and digital/pixel typography;
- rarity-specific escalating shimmer/glow treatment;
- bounded controlled micro-variation;
- exact-revision screenshot/video + manual visual review.

Small utility assets directly required by feel are allowed: the chosen bundled accent font and one concise `chips-collect` SFX. This is **not** a new art-production pass.

## Explicitly out of scope

- changing CHIPS cost/payout/cache/rarity/Hidden Pocket numbers;
- new/recolored/redrawn pouch raster art in this pass;
- new collectible/environment illustration assets;
- third gadget family or Drop #2;
- player-facing Drop selector;
- odds/loot-table drawer;
- permanent collection sidebar;
- silhouette/progress grid on the main Opening screen;
- new currencies or progression systems;
- Quick Reveal as a separate toggle/mode;
- x5/auto-open;
- custom WebGL shaders;
- fullscreen CRT/VHS/noise/chromatic-aberration treatment;
- generalized animation/economy framework.

The desired information surface for odds + Drop contents remains a **separate follow-up candidate after this feel pass is re-tested**. Bespoke pouch/content art work also remains a later asset pass; this correction must first prove that the existing game can feel good through interaction, choreography, UI and lightweight runtime FX.

---

# 3. Input and pacing — highest priority

## 3.1 Reveal fast-forward

Current player-facing `RESULT LOCKED` behavior is removed.

During `revealing`:

- a deliberate tap/click requests fast-forward of the **current presentation beat only**;
- fast-forward lands that beat in its deterministic final visual state and lets the next beat continue at normal speed;
- repeated deliberate taps may fast-forward later beats one by one;
- one click does **not** teleport through the entire reveal chain;
- the complete economic transaction is unchanged;
- no reroll, re-prepare, second commit or alternate outcome is allowed;
- skip affects presentation only;
- a short post-tear input guard prevents the pointer release that completed the drag from accidentally skipping the next beat.

At resolved result:

- once the result is visible, a distinct later tap accepts it;
- if a short result readability hold is still running, an intentional tap may finish that hold rather than doing nothing;
- once actionable, tap/click continues normally;
- acceptance may start the short visual bank sequence; that sequence is itself fast-forwardable and then returns to the next idle state automatically rather than demanding another confirmation click.

Do not globally accelerate the Phaser tween manager: ambient loops and unrelated UI motion must not speed up. Fast-forward should target only active reveal/payout presentation.

## 3.2 No separate Quick Reveal mode

This pass solves the observed responsiveness problem directly. Do not add a setting, toggle or x5 path unless a later repeated-use test proves that per-beat fast-forward is still insufficient.

---

# 4. Pouch tactile response

Improve the physical chain before adding spectacle.

## Grab

On star-tab pointer down:

- immediate clearly perceptible small scale/punch response on the tab;
- subtle pouch/strip tension response;
- idle attraction tween stops immediately;
- response must be visible within the same interaction frame rather than waiting for drag distance.

## Drag

As drag progresses:

- tab follows existing deterministic path;
- strip/tension response increases slightly with progress;
- optional tiny pouch lean/compression may follow progress if it remains readable and cheap;
- no physics.

## Tear threshold

At completion:

- short snap/recoil from pouch/strip;
- very small impact pause/anticipation is allowed if it increases the hit rather than creating perceived latency;
- existing tear SFX remains authoritative;
- Charged may use a slightly stronger visual recoil, not a different interaction mechanic.

Juice should be **noticeable enough to feel**. Do not spend implementation time on 1–2% micro-tweens that disappear in normal play. At the same time, do not escalate to whole-screen shake or constant motion that competes with the collectible.

All motion must reset correctly on aborted drag, resize and scene recreation.

---

# 5. Reward arrival and rarity impact

The standard collectible already has emerge/overshoot/settle. This pass may tune that choreography but should not replace the established reveal system.

Target order:

```text
tear snap
→ short anticipation
→ collectible arrival / overshoot
→ rarity bloom catches the item
→ readable reward state
```

Rules:

- item arrival should have clear acceleration → overshoot → settle;
- rarity energy may land a fraction after the item's first appearance so rarity feels like an event, not merely a static label;
- Common remains restrained;
- Rare gets a small cyan/electronic shimmer;
- Epic gets a stronger lavender/cyan sweep;
- Legendary gets the strongest standard iridescent sweep/bloom;
- Secret remains a distinct stronger surprise and should not be visually flattened by the new standard effects.

Use existing Phaser shapes/text/tint/blend/tweens first. Do not bake new FX into collectible rasters.

---

# 6. CHIPS staging and banking

This is the main choreography change.

## 6.1 Visual staging before acceptance

Base/cache/recycle CHIPS remain economically predetermined and may already be durably committed according to the existing transaction contract, but the **displayed reward** should first live with the result.

Create a compact reward staging area near the lower-left side of the hero collectible, using a stable semantic position rather than random screen placement.

Conceptually it can contain aggregate lines such as:

```text
◆ +8 CHIPS
MEGA CACHE +142
RECYCLED +4
```

Only applicable components appear. The panel must remain secondary to the collectible.

The tray is positioned relative to the hero collectible but must clamp away from the left gameplay rail and safe area on compact 900/1024 layouts. If the preferred lower-left position collides, move it lower/closer to the hero rather than overlapping persistent controls.

Visible chip-token count remains bounded and symbolic; numeric values remain the truth.

## 6.2 Bank after result acceptance

On result acceptance:

1. base CHIPS transfers to HUD;
2. optional cache CHIPS follows;
3. optional recycle CHIPS follows;
4. Signal transfer resolves in its own destination;
5. HUD finishes at the deterministic committed snapshot;
6. next idle/result transition continues automatically.

The order makes each source legible and gives the HUD a physical receiving role.

Charged cost remains visually communicated at opening time; earned CHIPS are the amounts delayed for visual banking.

The bank sequence must be compact, bounded and fast-forwardable. A Mega reward may get stronger impact but must not take proportionally longer because the number is larger.

If the scene is recovered/reloaded after durable commit, presentation may collapse to the safe current wallet state rather than attempting to reconstruct cosmetic banking that no longer has a pending transaction. No cosmetic replay may grant currency.

## 6.3 CHARGED READY moves to the actual threshold moment

The readiness beat should be causally connected to the wallet crossing the Charged threshold during banking/count-up.

Prefer:

- wallet crosses cost;
- CHIPS HUD gives a stronger pulse;
- Charged selector/card lights up;
- concise `CHARGED POUCH READY` feedback appears without blocking progression.

Do not preserve a mandatory isolated 850 ms blocking banner if the new banking choreography makes it unnecessary.

---

# 7. CHIPS HUD feedback

CHIPS is a primary progression resource and must have more visual weight.

Required:

- larger card/surface, not only small text + icon;
- clearer token identity;
- `CHIPS` label separated from a larger numerical value;
- digital/accent typography for the number;
- animated count-up between displayed values;
- bounded duration so large payouts do not become slow;
- small pulse on ordinary intake;
- stronger but restrained punch/shake/glow on Big/Mega or Charged-ready threshold crossing.

HUD shake must move the CHIPS card/container, not the entire camera. Camera shake remains rarity/reveal-specific.

---

# 8. CHIPS audio

Add **one concise reusable `chips-collect` SFX** because hands-on identified a real feedback gap.

Desired character:

- fast electronic token/chip cascade or light clatter;
- satisfying but not casino/slot-machine coded;
- short enough for repeated play;
- aligned with the visual bank/count-up.

Normal / Cache / Big / Mega should reuse the same sonic identity through timing, bounded repetition, playback variation or layering where supported. Do not create one new file per cache tier.

A dedicated `charged-ready` SFX remains optional; first test whether the CHIPS intake cue + UI activation is sufficient.

---

# 9. Signal feedback

Signal should share the digital/electronic language while remaining distinct from spendable CHIPS.

Presentation target:

```text
SIGNAL
◆ ◆ ◆ ◇
03 / 04
```

At lock:

```text
SIGNAL LOCK
```

For a duplicate:

- collectible reveals first;
- `DUPLICATE` / `RECYCLED` remains readable;
- recycle CHIPS visibly separate from the item;
- one small Signal fragment/spark travels from the result toward Signal HUD;
- the destination segment lights/pulses;
- at `4/4`, use a brief electronic flicker/glitch/pulse, not a long blocking animation.

`SIGNAL LOCK · CHARGED` remains required for the Legendary-only edge.

---

# 10. Opening UI hierarchy

The existing centered Basic/Charged text buttons are replaced by a clearer layout pass.

## Left-side gameplay rail

Preferred structure:

```text
CHIPS card
SIGNAL card

POUCH
[ BASIC     FREE ]
[ CHARGED   60   ]
```

The exact dimensions remain responsive and must survive 900 logical width.

The rail is for current gameplay controls only. Do not add fake future Drop controls just to reserve space.

## Selected state

Selection must remain obvious even if color is ignored:

- stronger border/surface contrast;
- marker/check/indicator or equivalent non-color cue;
- selected card can use a small scale/depth emphasis;
- center pouch immediately reflects Basic vs Charged visual mode through runtime treatment.

## Interaction feel

Available cards/buttons:

- hover / pointer-over: clear but bounded lift/scale/glow;
- pointer-down: small compression;
- release: quick overshoot/settle;
- selection transition animates rather than hard-swapping.

Unavailable Charged remains non-selectable but should still acknowledge a deliberate attempt:

- small horizontal wiggle or pulse;
- required cost flashes;
- CHIPS HUD may answer with a small pulse;
- no mutation and no modal.

This turns “nothing happened” into clear feedback.

---

# 11. Charged visual identity

Hands-on evidence supersedes the previous assumption that the existing aura is sufficient.

Charged must be distinguishable from Basic before reading the label, but **this pass does not start a new pouch/art-asset production cycle**.

Current feel-pass implementation is runtime-only:

- stronger cyan/violet electric palette with restrained pink/iridescent accents;
- brighter star-tab/seal emphasis;
- animated contour/aura/ring/spark treatment;
- slow holographic/iridescent sweep on selected Charged presentation where it can be done with ordinary Phaser objects/tint/blend/tweens;
- selector and pouch change together.

Do **not** create a new/recolored Charged raster set in this correction.

If the final label-hidden visual audit still reads as “Basic with a glow,” record that result as a concrete requirement for the later asset pass. Do not block the current feel pass by starting bespoke pouch production midstream.

---

# 12. Digital / neon visual language

Use one accent digital/pixel-like typeface for short electronic information only:

- CHIPS numeric value;
- Signal label/value/lock;
- Cache/Big/Mega short labels where appropriate;
- selected Charged/system accents if readability remains good.

## Accent-font selection rule

Priority order is locked:

1. first evaluate strong digital/pixel/Y2K candidates with **usable Cyrillic + Latin + digits**;
2. prefer a Cyrillic-capable candidate when its numeric forms and overall character fit the UI;
3. if no Cyrillic-capable candidate is visually good enough, restrict the accent font to **numbers and universal short ASCII/symbolic system elements** rather than forcing bad Cyrillic;
4. RU labels then stay in the main readable sans, but the chosen numeric accent must still harmonize with that sans and the rest of the HUD so numbers do not look pasted in from another game.

The font must be license-safe, bundled locally and loaded deterministically before layout/text measurement. Do not rely on late web-font swap that changes control widths after first render.

Do not switch long copy, instructions, Collection prose or all buttons to a pixel font. Main UI copy remains the clean readable sans system.

## Neon without shaders

Preferred tools:

- duplicate translucent Text/Graphics layers behind bright foreground text;
- stroke/shadow;
- alpha/scale/tint tweens;
- additive/screen-like blend modes where safe;
- moving translucent highlight/gradient strips;
- bounded rings/sparks/particles;
- brief cyan/magenta offset copies for Signal glitch moments.

## No custom shader in this pass

A custom shader is explicitly out of scope because the required character can be tested much more cheaply with the current renderer. Shader work introduces a separate mobile/WebGL QA surface without a proven visual need.

Revisit exactly one local shader only if a later reviewed no-shader implementation proves that a specific effect cannot be sold otherwise.

---

# 13. Callout readability

The current feedback sometimes disappears before a player can comfortably parse it.

Rules:

- increase default readable hold for important reward labels;
- fast-forward allows experienced players to remove the added wait;
- do not randomize callouts across arbitrary screen positions;
- give event classes stable semantic zones;
- small controlled positional jitter is allowed for juice, not layout.

Suggested semantic zones:

- rarity / NEW / DUPLICATE: around the hero result;
- CHIPS/cache/recycle: reward staging area near hero lower-left;
- Signal: destination HUD + local duplicate origin cue;
- Charged readiness: CHIPS/Charged UI area.

Readability beats novelty.

---

# 14. Controlled micro-variation

Repeated openings should not look frame-identical, but variation must not reduce clarity.

Cheap allowed variation:

- tiny reward rotation variance;
- small overshoot-amplitude variance;
- sparkle start/distance variation;
- bounded token trajectory variation;
- small audio playback variation if supported safely.

Do not randomize core timings so strongly that players cannot learn the rhythm.

Debug/audit scenarios must seed, freeze or disable this variation so exact-revision screenshots/videos remain reproducible enough for comparison.

---

# 15. Architecture constraints

This correction is presentation-heavy but remains subordinate to existing transactional truth.

Locked constraints:

- `pendingReveal` remains the economic source of truth;
- presentation never changes pouch result, cost, cache, recycle, Signal or Hidden Pocket outcome;
- fast-forward cannot perform an economic transition;
- tween completion cannot grant currency;
- displayed count-up ends at stored deterministic values;
- no global tween-speed hack that alters ambient/scene lifecycle behavior;
- recovery remains idempotent;
- existing Basic Legendary gate / Signal-retain edge remain unchanged;
- existing Charged selection continuity remains unchanged;
- no balance changes in the same correction PR unless a separate explicit tuning decision is made.

### Skippable tween contract

Do **not** implement fast-forward by blindly killing an awaited tween. Existing reveal code frequently awaits tween `onComplete` callbacks; killing one without resolving the associated beat can deadlock the reveal chain.

Every skippable presentation beat must therefore expose one deterministic completion path that:

- applies the final visual state;
- performs cosmetic cleanup exactly once;
- resolves the awaiting beat exactly once;
- is safe whether reached naturally or by player fast-forward;
- never owns durable reward mutation.

Small presentation helpers/modules are allowed if they reduce `OpeningScene` complexity. Do not create a generic animation framework for hypothetical future scenes.

---

# 16. Implementation order

Use one feature branch with reviewable internal commits/subpasses:

## Pass A — input + reward choreography

- reveal per-beat fast-forward contract;
- post-tear input guard;
- grab/tension/tear recoil;
- callout hold/readability;
- reward staging;
- bank-on-accept sequence.

## Pass B — resource tactile feedback

- larger CHIPS HUD;
- count-up + punch/shake;
- `chips-collect` SFX;
- duplicate recycle transfer;
- Signal fragment/destination response;
- Charged-ready threshold response moved into bank/HUD flow.

## Pass C — UI + visual language

- left-side Basic/Charged rail;
- obvious selected / unavailable interaction states;
- stronger runtime Charged color/iridescence using current art;
- digital accent font chosen with Cyrillic-first evaluation;
- neon Signal/CHIPS treatment;
- rarity shimmer hierarchy;
- controlled micro-variation.

Then validate the **combined branch**, because feel depends on choreography between these pieces.

---

# 17. Validation / Definition of Done

## Technical

Run:

- `npm run typecheck`;
- full unit tests;
- asset self-test/validation;
- production build.

Add/adjust focused tests where practical for:

- no double prepare/commit under fast-forward input;
- click during reveal changes presentation only;
- pointer release from tear cannot accidentally consume the next interaction because of the guard;
- skippable awaited beats always resolve and cannot deadlock reveal flow;
- displayed CHIPS endpoint equals transaction snapshot;
- Charged cost visual baseline + staged rewards end at correct wallet;
- existing Signal retain/consume and recovery behavior remains unchanged.

## Browser/video audit

Minimum reviewed scenarios:

- Basic idle new left rail + digital CHIPS/Signal;
- Basic selected vs Charged selected, labels mentally ignored;
- insufficient Charged attempt feedback;
- star grab → drag → tear recoil;
- ordinary reward staged before acceptance;
- accepted base CHIPS bank + count-up + HUD response;
- Cache / Big / Mega bank intensity;
- threshold crossing activates Charged without a blocking banner;
- duplicate → recycle CHIPS + Signal fragment;
- Signal `4/4` + lock / `LOCK · CHARGED`;
- Common/Rare/Epic/Legendary visual hierarchy;
- Charged runtime iridescent treatment;
- Hidden Pocket remains strongest surprise;
- deliberate tap fast-forwards one beat and later beats remain readable;
- repeated taps can accelerate successive beats without changing result;
- accidental drag-release does not instantly skip;
- recovered Basic/Charged paths;
- 900 / 1024 / representative wider layout;
- RU compact layout and Cyrillic font behavior;
- deterministic audit captures despite micro-variation in normal play.

Browser errors/failed requests must be empty. Screenshots/video must be manually inspected; green CI alone is not approval.

## Human gate

After merged exact-revision audit, repeat another 20–30 normal openings.

Pass questions:

- does grabbing/tearing feel more physical?
- does tapping always feel acknowledged?
- is the sequence faster when the player wants it faster?
- do CHIPS feel like a tangible reward rather than a number?
- is the wallet easy to notice without dominating the hero collectible?
- is Basic vs Charged obvious immediately?
- does Charged feel materially more desirable even without new pouch art?
- does neon/digital styling add identity without turning the whole game into generic synthwave?
- do duplicate/Signal events feel like progress rather than ceremony?
- is the loop still pleasant after repetition?

Only then proceed to hosted Yandex DRAFT.

---

# 18. Deferred information pass

The following hands-on request is valid but deliberately separated from this correction:

> show what can drop, exact rarity probabilities, active collection/Drop names and discovered vs unknown items.

Candidate later solution:

- compact `Drop name · discovered/total · info` entry point;
- on-demand drawer/panel;
- exact pouch odds read directly from typed balance config;
- family list;
- discovered items visible, unknown items silhouetted/obscured;
- no permanent giant sidebar;
- eventual Drop selector integrated only when Drop #2 exists.

Re-evaluate this after the feel/UI pass. The redesigned gameplay rail may reduce the amount of permanent information needed on the main opener.

---

# 19. Remaining visual decisions — resolve from implementation/audit

The product interaction direction is now sufficiently locked to start coding. Do not block implementation on additional product questions.

Remaining presentation choices are implementation/audit decisions:

1. **Accent font:** evaluate Cyrillic-capable candidates first; if none fit, choose the best harmonized numeric/ASCII accent rather than bad Cyrillic.
2. **Charged palette intensity:** cyan/violet is the base direction; tune exact pink/iridescence from video so it remains desirable without flattening rarity hierarchy.
3. **Optional Charged-ready SFX:** add only if CHIPS bank sound + UI activation does not sell the milestone.
4. **Exact callout/count-up timings:** tune from captured video and repeated-use feel; semantics above are locked, milliseconds are not.

Bespoke pouch/collectible art is **not** an unresolved decision for this pass: it is deferred to the later asset phase.

Any proposal that introduces a new mechanic, new major information surface or new art-production branch belongs outside this correction.