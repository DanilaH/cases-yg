# Final Audio Feel Acceptance — 2026-09-09

Status: **AUTOMATED / STRUCTURAL ACCEPTANCE PASSED — SUBJECTIVE EAR-CHECK PENDING**

This document records the exact-revision acceptance of the final bounded audio/feel correction workflow. It closes the implementation and automated lifecycle gates from `FINAL_AUDIO_FEEL_CORRECTION_WORKFLOW_2026-09-09.md` without pretending that headless automation can judge timbre, fatigue or subjective musical/sonic quality.

## Exact validated product revision

- validated `main`: `f194800e17f5c9c6abf929f09c4a47b148c1ecab`;
- product work included PRs #90, #91, #92 and #93 on top of the reviewed workflow/docs PR #89;
- final combined audit run: GitHub Actions `34333593406`;
- temporary audit head: `372d23859afc40215aa20cd8d96980841f2dd0d8`;
- the audit workflow asserted that the branch differed from validated product only by the temporary audit workflow itself;
- after evidence capture, the temporary audit branch was reset back to the validated product SHA;
- retained audit artifact: `final-audio-feel-combined-r1`, artifact id `10097073987`, SHA-256 `4d336c1847e51b14f4a7a8474f65a9efbca034c5bf9ea188f34378093292208c`.

## Static gates

All passed on the exact validated product revision:

- `npm run typecheck`;
- `npm test`: **162/162 tests, 20/20 test files**;
- `npm run assets:selftest`;
- `npm run assets:validate`: 10 collectible runtime assets checked, 0 skipped;
- `npm run build`.

The existing large-chunk Vite warning remains informational and was not introduced by this workstream.

---

# 1. Combined browser/lifecycle result

The expanded final audit passed **76/76 assertions** with:

- `fatal = null`;
- runtime/page errors: `0`;
- failed requests: `0`;
- local HTTP >=400 responses: `0`;
- real repeated openings completed: `12`;
- every real opening settled with `pendingReveal = null`;
- Opening → Collection → Opening round-trip remained healthy;
- resize-during-reveal recovered to a ready result;
- environment root and all 27 ambient particle object identities survived reveal → result → idle rather than being recreated.

This preserves the previously accepted environment/runtime continuity while adding the new audio lifecycle coverage.

---

# 2. Long idle ownership

A real idle scene was held for **2 minutes**.

Observed persistent audio graph:

- start: 5 alive oscillators + 2 alive loop buffers = **7**;
- end: 5 alive oscillators + 2 alive loop buffers = **7**;
- AudioContext remained `running`;
- scene remained `idle`;
- environment remained active with 27 ambient particles.

Decision: **PASS**.

The new base shimmer motion source is therefore part of the stable base graph rather than a source leak.

---

# 3. Deterministic 30-second rarity holds

Each stable result state was forced through the existing debug scenario system and held for 30 seconds without interaction.

| State | Persistent sources at start | Persistent sources at 30 s | Result state |
| --- | ---: | ---: | --- |
| Common | 7 | 7 | ready / stable |
| Rare | 12 | 12 | ready / stable |
| Epic | 13 | 13 | ready / stable |
| Legendary | 15 | 15 | ready / stable |
| Secret | 16 | 16 | ready / stable |

The hierarchy is structurally monotonic:

`Common 7 < Rare 12 < Epic 13 < Legendary 15 < Secret 16`

Decision: **PASS**.

This validates the intended density/source hierarchy and proves that the new slow base/rarity modulation does not grow the graph over time. It does **not** prove that any state sounds subjectively pleasant; that remains the ear-check gate below.

---

# 4. NEW / duplicate semantics

Deterministic Common/Rare/Epic/Legendary debug scenarios all reached result as `isNew = true` with the requested rarity.

The forced duplicate scenario reached result with:

- `isNew = false`;
- recycle reward = `2` CHIPS.

Decision: **PASS**.

The final audio work did not collapse NEW/duplicate semantics or reward ownership.

---

# 5. Hidden Pocket result ownership

The first targeted Hidden Pocket opened on Secret, as intended.

Manual result navigation verified:

- Secret → Standard changes the active carousel owner;
- Standard → Secret returns to the original owner;
- each real page change emits exactly **one** carousel-switch cue;
- returning to Secret restores the same stable persistent source count (`16`), despite old sources having been created and retired during the intervening switch;
- Secret owns more persistent audio sources than the Standard page.

Result-state mute/unmute on Secret also passed:

- before mute: `16` persistent sources;
- muted context: `suspended`, still `16` owned sources;
- resumed context: `running`, still `16` owned sources;
- no duplicate stack appeared.

Decision: **PASS**.

---

# 6. Hidden Pocket collect — Secret-first

Collect was accepted while Secret was active.

Observed choreography:

1. phase entered `banking`;
2. Secret-owned reward banked first;
3. carousel automatically switched to Standard while still in `banking`;
4. the automatic switch emitted exactly **one** carousel-switch cue;
5. Standard-owned reward completed;
6. result presentation targets were removed;
7. scene returned to idle;
8. persistent audio returned to the stable base graph of **7** sources.

The CHIPS contour remained one transaction across both page owners. The audit detected 29 clack events in the sequence:

- first detected start frequency: ~`1098.8 Hz`;
- last detected start frequency: ~`1385.7 Hz`;
- maximum detected start frequency: ~`1406.2 Hz`;
- bounded ceiling used by the audit: `1180 × 1.21 = 1427.8 Hz`.

The contour therefore rose materially without resetting at the page boundary and remained inside the reviewed ceiling.

Decision: **PASS**.

---

# 7. Hidden Pocket collect — Standard-first

A second deterministic Hidden Pocket was moved to Standard before Collect.

Observed choreography:

1. Standard was confirmed as active owner before acceptance;
2. resize while the result was ready preserved the result state and Standard ownership;
3. Collect entered `banking`;
4. mute during banking suspended the AudioContext;
5. unmute resumed the same context;
6. carousel automatically switched Standard → Secret while still banking;
7. that automatic switch emitted exactly **one** carousel-switch cue;
8. resize during the Secret-side banking/release recovered safely to `idle`;
9. `pendingReveal` remained `null`;
10. Standard/Secret result presentation targets were cleared;
11. persistent audio returned to the same stable base graph of **7** sources.

Decision: **PASS**.

This proves both starting orders without introducing a second durable commit or changing the final saved transaction.

---

# 8. Mute and resize lifecycle

The combined gate now covers:

- mute/unmute during a persistent Secret result hold;
- mute/unmute during Hidden Pocket banking;
- final idle mute/unmute after all preceding cycles;
- resize during reveal;
- resize during stable result;
- resize during banking.

Final idle mute/resume remained:

- before mute: `7` persistent sources;
- muted: context `suspended`, `7` sources;
- resumed: context `running`, `7` sources.

Decision: **PASS**.

No path observed a duplicated base stack or stale rarity stack under idle.

---

# 9. What automation now proves

The final automated evidence supports all of the following:

- the implementation is bounded to presentation/audio ownership;
- save/economy transaction semantics remain intact;
- repeated real tearing remains healthy;
- long idle does not grow the base graph;
- every rarity hold owns a stable graph;
- rarity structural density rises through the hierarchy;
- result page switching retires/recreates owned rarity state without stacking;
- one Hidden Pocket Collect still represents one durable transaction;
- active-page reward ownership works in both starting orders;
- automatic collect page switching is deterministic and emits one switch cue;
- CHIPS pitch remains one global contour across both Hidden pages;
- page-local rarity ambience can restart its banking lift without resetting CHIPS progress;
- mute/resume does not duplicate sources;
- reveal/result/banking resize recovery does not strand stale state;
- runtime/network diagnostics remain clean.

No further product-code correction is justified by the automated evidence.

---

# 10. Remaining subjective ear-check — mandatory

Headless browser automation cannot evaluate whether a sound is pleasant, harsh, fatiguing, too quiet or emotionally convincing. Therefore the workflow is **not yet approved for hosted Yandex DRAFT** until a real listening pass approves the corrected build.

Use the exact validated revision `f194800e17f5c9c6abf929f09c4a47b148c1ecab` and listen on at least normal speakers or headphones.

Required listening checks:

1. **Star grab** — the short grab transient no longer reads as TV/static interference.
2. **Drag texture** — friction is slightly easier to hear, tactile, and not hissy/harsh.
3. **Idle** — leave the game open long enough to hear the slow movement; it should feel calm/alive rather than like a server room or an obvious repeating loop.
4. **Common → Rare → Epic → Legendary → Secret** — rarity should rise in presence/richness; Legendary must no longer feel weaker than Epic; Secret should remain the strongest/best reward state without becoming oppressive.
5. **30-second holds** — listen for fatigue, audible short cycles, accidental melody, piercing shimmer or low-frequency pressure.
6. **Result arrival** — the small intro crest should register as arrival, not a loudness jump.
7. **Ordinary Collect** — the held rarity should continue into banking, lift with the reward and release at the end; there should be no dead acoustic hole on click.
8. **Hidden Pocket, Secret-first** — Secret reward should audibly belong to Secret, then the Standard handoff should feel intentional; CHIPS should read as one transaction.
9. **Hidden Pocket, Standard-first** — same ownership logic in reverse; second page must not sound as though it starts already at its final peak.
10. **Mute/unmute** — no doubled ambience, restart pop or stale rarity after returning.

Suggested listening order: headphones first for noise/harshness and low-frequency pressure, then ordinary speakers for hierarchy and practical mix balance.

If this pass is approved, the next workflow step is **hosted Yandex DRAFT validation**. If it finds a concrete subjective failure, correct only that observed failure and repeat the relevant bounded acceptance; do not reopen gameplay/economy/content scope.

---

# 11. Final current decision

**AUTOMATED / STRUCTURAL WORKSTREAM: COMPLETE AND GREEN.**

**SUBJECTIVE AUDIO QUALITY: PENDING HUMAN EAR-CHECK.**

**YANDEX DRAFT: BLOCKED ONLY BY THAT EAR-CHECK.**
