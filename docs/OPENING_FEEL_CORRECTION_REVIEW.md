# Opening Feel Correction — independent scope review

Status: **REVIEWED / APPROVED WITH CONSTRAINTS**

Reviewed against:

- first direct hands-on findings;
- current `OpeningScene` implementation shape;
- existing Lite V2 transaction/recovery invariants;
- current product/art/architecture guardrails;
- exact-revision visual-QA workflow;
- low-production-burden project strategy.

Canonical implementation scope remains `OPENING_FEEL_CORRECTION_SCOPE.md`. The constraints below are implementation-review corrections and should be treated as normative where they make the scope more precise.

---

# 1. Coverage of hands-on feedback

| Hands-on finding | Scope result |
|---|---|
| dedicated CHIPS sound | INCLUDED — one reusable `chips-collect` cue |
| CHIPS panel too small | INCLUDED — larger resource card/hierarchy |
| smooth count-up + shake | INCLUDED — bounded count-up + local card punch/shake/glow |
| pouch selector cramped / selected unclear | INCLUDED — left gameplay rail + explicit selected state + input feedback |
| callouts too short | INCLUDED — longer readable holds + tap fast-forward |
| show rarity probabilities | DEFERRED — on-demand info drawer candidate after corrected hands-on |
| show Drop contents / collection silhouettes | DEFERRED — same information pass; rejected as permanent main-screen sidebar |
| CHIPS bank only after accepting result | INCLUDED — staged reward + bank-on-accept presentation |
| stronger Charged colors | INCLUDED — stronger runtime cyan/violet/iridescent treatment; raster fallback conditional |
| `RESULT LOCKED` frustrating | INCLUDED — remove dead state; direct presentation fast-forward |
| more neon / digital / pixel character | INCLUDED — restrained electronic UI layer, no full-scene synthwave conversion |

Verdict: all direct feel issues are either in scope or deliberately deferred for a clear scalability/product reason. No feedback item was silently dropped.

---

# 2. Fit with project guardrails

## Pass

The scope remains consistent with:

- low production burden;
- no third family before validation;
- no new economy/meta system;
- no balance tuning mixed into presentation work;
- no shop / multi-standard drops / x5 / idle systems;
- `pendingReveal` as economic truth;
- tween completion never owning economy;
- exact-revision screenshot/video + manual review;
- Yandex DRAFT remaining after local/hands-on approval.

## Important interpretation

This is a larger presentation pass than the original “smallest fix” wording suggested, but it is still justified because the findings are **one coupled problem**: the opener does not yet feel tactile/legible/premium enough. Splitting CHIPS, selector, input and visual-language work into unrelated branches would touch the same choreography repeatedly and make integration harder to judge.

The scope is therefore acceptable as one combined feature branch with small internal commits.

---

# 3. Technical feasibility from current source

Current `OpeningScene` already provides useful primitives:

- distinct `idle / dragging / revealing / result` phases;
- deterministic prepared transaction before reveal;
- separate visual HUD state (`chipsHudValue`);
- Phaser-rendered CHIPS tokens;
- existing CHIPS flight functions;
- existing duplicate Signal spark;
- existing rarity overshoot/settle presets;
- existing Charged aura;
- existing result hold + result panel;
- existing pointer gesture handling.

Therefore the correction does **not** require a new game architecture.

However, current reveal methods frequently await tween `onComplete` callbacks. That creates a specific implementation hazard for fast-forward.

---

# 4. Review correction: fast-forward must resolve async beats

Do not implement fast-forward as:

```text
kill current tween
```

if the caller is awaiting that tween's `onComplete`, because the promise may never resolve and the reveal chain can hang.

Required behavior:

- active reveal-owned beat has an explicit completion/skip path;
- skip drives the beat to its deterministic visual end state;
- any awaiting promise resolves exactly once;
- cleanup/destroy callbacks remain safe/idempotent;
- ambient/carousel/other scene tweens are not affected;
- repeated tap requests cannot resolve the same beat twice.

A small local reveal-presentation helper/controller is justified if it makes this safe. A generic animation framework is not.

This is the highest technical risk in the correction.

---

# 5. Review correction: reward tray must be adaptive

“Lower-left of the collectible” is a semantic anchor, not one absolute coordinate.

Required layout rule:

- derive tray position from the active hero presentation;
- bias to hero lower-left as requested;
- clamp so it does not enter the left gameplay rail/safe area;
- if 900px layout leaves insufficient lateral room, prefer a compact below-left/below-hero variant rather than overlap;
- Hidden Pocket/carousel states must not leave a stale tray in an invalid position.

This preserves the desired physical association without creating a new compact-layout defect.

---

# 6. Review correction: font loading must not cause layout shift

A locally bundled accent font is a good low-cost identity improvement, but it creates a loading/layout concern.

Required:

- preload/await the accent font before relying on its measured dimensions in Opening UI, or use an equivalent deterministic loading strategy;
- provide a safe fallback that does not block game boot permanently if font loading fails;
- test actual RU/EN glyphs used with the accent face;
- if Cyrillic coverage/readability is weak, limit accent face to numerals/ASCII system labels and leave localized copy in the normal font.

Do not accept a visible first-frame font swap that moves HUD/control geometry.

---

# 7. Review correction: micro-variation must not break deterministic QA

Controlled variation is useful for repeated feel, but unrestricted presentation randomness can make exact-revision screenshots/videos noisy and hard to compare.

Required:

- debug/audit scenarios use deterministic presentation variation, or disable the non-essential variation during deterministic capture;
- reward/economy RNG remains completely separate;
- visual variation never changes hitboxes, semantic positions or timing gates;
- normal gameplay may vary tiny rotations/spark/token trajectories within the approved bounds.

This preserves both freshness and reproducible QA.

---

# 8. Review correction: keep neon GPU cost bounded

No custom shader is the correct decision.

Even without shaders, avoid accidentally replacing shader complexity with excessive object count/blend overdraw.

Guidelines:

- reuse/bound glow layers;
- avoid fullscreen additive overlays;
- only a small number of iridescent/highlight elements animate simultaneously;
- cache magnitude scales effect intensity, not unbounded particle count;
- profile/check representative mobile landscape during browser/DRAFT validation.

No new performance framework is needed.

---

# 9. Product critique of bank-on-accept

The idea is good because it makes reward ownership physically legible, but it can create a **new delay after the player has already decided to continue**.

Therefore:

- banking should be quick by default;
- a large Mega count-up is duration-capped;
- repeated taps may accelerate active bank presentation as well;
- after the acceptance tap, next idle should follow automatically when banking completes; do not require another confirmation click;
- if banking itself becomes the new repetitive bottleneck in second hands-on, shorten choreography before considering another mode.

This keeps the idea without reproducing the original `RESULT LOCKED` frustration one step later.

---

# 10. Product critique of neon direction

The direction is strong and fits the game's retro-electronics identity, but the main risk is aesthetic incoherence.

The approved boundary is correct:

> **soft illustrated world + electric system UI**

Do not apply simultaneously to everything:

- pixel font;
- neon pink/cyan;
- glitch;
- scanlines;
- chromatic offsets;
- holographic sweep;
- heavy glow.

Use digital effects where they explain **system state or rarity**. The collectible/background remain the visual anchor.

The visual audit should explicitly reject a result that feels like a generic synthwave reskin.

---

# 11. Information UI critique

Deferring the odds/collection surface is the right sequencing decision.

Why:

- it does not solve current tactile/input friction;
- permanent sidebar does not scale to future 15–25-item Drops;
- exact probabilities are useful but need not dominate surprise fantasy;
- the new left gameplay rail should be evaluated first before deciding how much information can coexist with it.

After corrected hands-on, an on-demand drawer remains a strong candidate.

---

# 12. Remaining genuinely unresolved decisions

These should be resolved from real visual/audio samples rather than architecture debate:

1. **Exact accent font.** Need 2–4 in-game samples; choose for readability/character/license/glyph coverage.
2. **Exact Charged iridescence intensity.** Need Basic/Charged label-hidden comparison; avoid stealing Legendary/Secret hierarchy.
3. **Whether runtime Charged treatment is sufficient.** Dedicated recolored raster only if the comparison fails.
4. **Whether a separate Charged-ready SFX is necessary.** First hear the combined CHIPS bank sound + selector activation.
5. **Exact animation durations.** Tune from video + second hands-on rather than locking arbitrary milliseconds now.
6. **Information drawer details after correction.** Especially Secret visibility and whether odds show standard rarity and Hidden Pocket separately.

None of these blocks documenting or starting the implementation pass; they are bounded sample-driven choices inside/after it.

---

# 13. Final independent verdict

**GO.** The scope is coherent, evidence-backed and appropriately constrained.

It should materially improve perceived quality without expanding the gameplay system count. The largest engineering risk is safe fast-forward across currently awaited tween chains; the largest product risk is replacing current delay with overlong bank-on-accept choreography; the largest visual risk is over-applying neon/pixel/glitch treatment.

With the constraints above, none requires a scope redesign.
