# Independent Review — Final Audio Feel Correction Workflow — 2026-09-09

Status: **REVIEWED / APPROVED WITH IMPLEMENTATION CONSTRAINTS**

Reviewed source:

- `FINAL_AUDIO_FEEL_CORRECTION_WORKFLOW_2026-09-09.md`;
- current `main = 117515134f530714403757895a23703a79bbb05d`;
- `HANDS_ON_FEEL_CORRECTIONS_2026-09-09.md`;
- `HANDS_ON_FEEL_CORRECTIONS_REVIEW_2026-09-09.md`;
- current audio presentation/runtime code;
- current Hidden Pocket / reward banking code;
- current audio tests;
- external GDC references listed in the workflow.

The work order is coherent and remains a bounded correction of the existing loop. No blocking product question remains. The following constraints are required before implementation.

---

# 1. Star regression: rollback the proven code delta first

The subjective symptom is real, but the exact acoustic root cause is not proven.

Code evidence shows that PR #87 changed `pouch-grab` from fixed authored playback to the generic one-shot pitch factor. The asset itself was not changed in that PR. The synth fallback's filtered-noise character existed before the regression.

Therefore the first correction must be conservative:

1. set `pouch-grab` pitch variation to zero;
2. do not replace the sample;
3. do not simultaneously redesign the grab transient;
4. raise only the separate continuous drag texture modestly.

If subjective A/B still reports TV/static character after this rollback, then inspect/retune the grab sample/fallback as a **second evidence-backed change**. Mixing both changes now would destroy causal information.

Approved.

---

# 2. Drag texture gain increase must stay bounded

Current drag max gain is `0.0085` and the existing test constrains it to `<= 0.01`.

A target around `0.0100` is enough for the requested “slightly louder” correction while retaining the existing test ceiling and avoiding a second noise-heavy regression.

Do not raise resonance/Q or top frequency in the same pass. The user asked for more audibility, not more brightness.

Approved target:

- keep current frequency/Q mapping;
- `maxGain ≈ 0.0100`;
- preserve release/cancel lifecycle.

---

# 3. Base ambience dynamics should reuse the existing architecture

The base bed already has a slow pad-filter LFO. The workflow correctly proposes turning this into explicit presentation data and adding only one separate slow shimmer movement.

Do not add per-voice LFOs, random timers or a new ambience scheduler.

Implementation constraint:

- existing pad LFO remains one source;
- add at most one additional slow base motion source;
- use incommensurate slow rates so the combined bed does not expose a short cycle;
- keep `humGain = 0`;
- no new low-frequency oscillator.

This achieves “alive” without rebuilding the audio engine.

---

# 4. Rarity micro-dynamics should change colour, not melody

The current rarity controller already creates:

- a shared tone bus;
- fixed sine harmonics;
- a slow tone-gain pulse;
- shimmer noise through a bandpass;
- one persistent bus per active rarity.

The lowest-risk improvement is one additional slow **spectral-colour** oscillator per rarity state, routed through bounded depth gains into existing filter/shimmer parameters.

Do not create an LFO per harmonic in this pass.

Preferred controlled parameters:

- tone lowpass cutoff;
- shimmer band centre;
- shimmer gain.

This directly produces the requested perception that some frequencies appear/recede over time without introducing an audible tune.

The new motion source must be included in deterministic teardown/source-count expectations.

Approved.

---

# 5. Result intro crest is currently missing and is worth adding

Current runtime fades the persistent rarity bus from near-zero directly to steady gain. There is no peak-and-settle envelope.

A small overshoot is a genuine new feel behaviour, but it is consistent with the existing stable-state ownership model.

Constraint:

- persistent ambience still starts only from stable result ownership;
- intro crest must not be scheduled from the transient rarity cue;
- peak should remain roughly `<= 1.2 ×` steady bus energy;
- settle to steady within sub-second timing;
- any filter/shimmer crest remains bounded and does not alter gameplay timing.

Approved.

---

# 6. Legendary should inherit Secret's successful character, not merely its volume

The user's strongest subjective evidence is:

- Epic is good;
- Legendary is weak;
- Secret is excellent.

It is therefore wasteful to invent an unrelated new Legendary family.

However, literal copy/paste of the entire current Secret profile into Legendary and then only raising Secret bus gain would collapse hierarchy into loudness.

Implementation requirement:

- use current Secret harmonic/spectral family as the **Legendary reference**;
- Legendary may move very close to today's Secret character;
- new Secret must extend through at least one additional dimension such as upper harmonic detail, shimmer motion or width;
- preserve monotonic hierarchy for bus/density/base ducking where tests rely on it;
- do not restore low ominous frequencies from the pre-#87 profile.

Approved with this distinction.

---

# 7. Banking ambience must not restart from silence

The conversation clarified two separate envelopes:

### Result arrival

`0 → intro crest → steady hold`

### Collect/banking

`steady hold → banking lift → final peak → fade to 0`

Do not reset the persistent ambience to zero when Collect is pressed. That would create an audible hole and contradict temporal continuity.

The current problem is exactly that `continueFromResult()` calls `clearResultAmbience()` before banking. Remove that early clear and move cleanup to the end of banking / exceptional banking exits.

Approved.

---

# 8. Banking progress needs two semantics in Hidden Pocket

The workflow correctly distinguishes:

- **global transaction progress** for the CHIPS pitch contour;
- **page-local progress** for the active item's ambience lift.

This is important.

If the second page starts halfway through the total CHIPS transaction and its new ambience immediately inherits 60–80% global energy, the page may appear to start already near its peak. That weakens the “this item is now being accepted” beat.

Implementation requirement:

- global CHIPS clack pitch remains continuous across all pages;
- each active page's ambience banking lift starts from that page's steady state and rises through its own associated reward amount;
- automatic page switch may crossfade old/new rarity ambience through existing ownership semantics;
- final page completion performs the terminal rarity fade.

Approved.

---

# 9. Hidden Pocket reward ownership split is semantically sound

Current reward data cleanly supports a presentation-only split:

Standard-owned CHIPS:

- `base`;
- `cacheBonus`;
- `recycle`;
- `overchargeBonus`.

Secret-owned CHIPS:

- `secretBonus`.

`hiddenPocket.bonusChips` is persisted as the Secret jackpot and feeds `chips.secretBonus`, so this mapping does not invent economy semantics.

Signal and Overcharge state presentation already occurs earlier in the opening flow. Do **not** move those state transitions back into collect in order to make each carousel page look busier.

Approved.

---

# 10. Hidden Pocket one-tap acceptance does not violate the gesture invariant

The existing interaction invariant is “one physical gesture = one semantic action.”

One Collect tap on a Hidden Pocket result already means “accept this completed opening transaction.” Automatically sequencing its two presentation owners does not create a second semantic user action.

Constraints:

- the same tap must not accidentally start the next pouch;
- carousel input becomes disabled once banking begins;
- automatic switch is presentation only;
- no second commit, no second collection mutation, no second analytics acquisition event.

Approved.

---

# 11. Use a pure reward-banking plan helper

The work order's suggestion to avoid burying reward ownership branching inside `OpeningScene` is correct.

A tiny helper is justified because it makes the most important new semantic directly unit-testable:

- no Hidden Pocket → one standard page;
- Hidden Pocket + active standard → standard then Secret;
- Hidden Pocket + active Secret → Secret then standard;
- standard page legs exclude `secretBonus`;
- Secret page owns only `secretBonus`;
- total amount remains unchanged.

This is not a new framework. It is a small typed plan boundary for presentation.

Approved.

---

# 12. Automatic carousel switching must reuse existing ownership

Do not create a separate “banking carousel” state machine.

Use the existing:

- `resultCarouselIndex`;
- `positionResultCarousel()`;
- active-page reward tray rendering;
- `setResultAmbience()` ownership.

Add only the minimum banking orchestration needed around them.

If automatic switching calls the existing carousel-switch cue, fire it once per actual index change exactly like manual gesture switching.

Approved.

---

# 13. Fast-forward, resize and cleanup are the highest implementation risk

The largest risk in this work order is not tuning values; it is moving persistent ambience lifetime later into banking while also adding multi-page choreography.

Required explicit cleanup paths:

- normal bank completion;
- presentation fast-forward;
- deferred resize during banking;
- scene shutdown;
- mute/block suspension;
- unexpected banking presentation exception.

`finishDeferredBankingResize()` currently returns to idle. If rarity ambience is no longer cleared at collect start, this path must explicitly clear/release result ambience before idle restoration.

No branch may leave an old rarity bus alive underneath idle base.

Approved only with this lifecycle gate.

---

# 14. Source-count tests/audits must expect legitimate new sources

Adding one base shimmer-motion oscillator and one rarity spectral-motion oscillator changes raw persistent source counts.

Old observed counts such as base `6` and Secret `13` are historical evidence, not eternal product requirements.

Acceptance should become:

- source count is stable for a given state;
- repeated page switching returns to the same count;
- source count does not grow cycle-over-cycle;
- collect returns to the new base count;
- mute/unmute does not duplicate the stack.

Do not “fix” a source-count mismatch by removing useful modulation if the lifecycle remains bounded.

Approved.

---

# 15. Signal / Charged continuous ambience remains rejected for this pass

The work order correctly marks these as future candidates only.

A permanent Signal or Charged state bed would add another continuously owned layer before the newly expanded base/result/banking mix has passed ear-check.

This would be premature and directly conflicts with the lesson that continuous sound stacks caused fatigue earlier.

Keep existing transient Signal/Overcharge/Charged feedback. Revisit only if the final corrected loop still feels semantically weak in those moments.

Approved rejection.

---

# 16. Reference review

The external references support the **principles** used by the plan:

- emotional effect is affected by frequency range, density, loudness and balance;
- temporal continuity matters to suspense/release;
- audio should follow game semantics;
- procedural systems are valuable when they react to game parameters;
- adaptive ambience should be stateful rather than a fixed monolithic loop.

They do not prescribe our exact frequencies, gains or implementation. Those remain product-specific hypotheses requiring hands-on validation.

This distinction is correct and avoids cargo-culting another game's sound palette.

---

# 17. Final reviewed implementation order

1. **Star rollback + drag gain** — smallest causal correction first.
2. **Base/rarity micro-dynamics + rarity ladder + intro crest** — tune stable state before changing collect lifetime.
3. **Banking ambience lifetime/progress** — keep rarity alive through collect and prove cleanup.
4. **Hidden Pocket page-owned banking** — add active-page sequencing after the single-page banking envelope is stable.
5. **Combined exact-revision acceptance** — lifecycle + subjective listening.

Do not collapse these into one unreviewable mega-commit even if they share files.

---

# 18. Final decision

**APPROVED TO IMPLEMENT.**

There is no blocking product question.

The work remains bounded because it:

- changes presentation only;
- preserves durable transaction ownership;
- reuses the existing audio controller and carousel ownership;
- adds only small parameterised modulation rather than a new audio framework;
- explicitly rejects low-ROI continuous Signal/Charged layers;
- requires ear-check rather than declaring success from tests.

After the final combined subjective acceptance, move to hosted Yandex DRAFT. Do not reopen content/meta scope before that gate.