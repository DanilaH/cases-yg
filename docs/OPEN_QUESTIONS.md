# Open questions / decision queue

This file contains only questions that are **actually unresolved now**. Lite V2 mechanics and the Opening Feel Correction are implemented; do not treat merged behavior as TODO design debate.

Phase 2.6 correction/Overcharge is implemented, exact-audited and repeated-use accepted under `FINAL_HANDS_ON_OVERCHARGE_PLAN.md`. The later Secret reward/reward-tray correction is also implemented and merged under `SECRET_REWARD_CORRECTION.md`; its exact browser acceptance passed 34/34. Because that correction changed runtime after the earlier repeated-use gate, one fresh merged-main repeated-use regression is the only remaining internal gate before Yandex DRAFT. `OPENING_FEEL_CORRECTION_SCOPE.md` remains the historical feel-correction contract.

---

# 1. Post-correction evidence question set

The repeated hands-on passes justified the bounded corrections, which are now merged and reviewed. Remaining items here are evidence/tuning questions for the current final merged-main regression and later hosted/content-scale work.

## 1.1 Accent digital/pixel font — RESOLVED FOR CURRENT BUILD

Current implementation uses locally bundled **Press Start 2P** for short electronic UI only. The package is license-safe (`OFL-1.1`), exact-revision RU/EN 900/1024 review passed, and long instructions/navigation remain in readable sans. Re-open only if final hands-on finds an actual readability/fatigue problem.

## 1.2 Charged palette / iridescence intensity — RESOLVED FOR CURRENT BUILD

The merged cyan/violet runtime treatment with restrained iridescent accents passed the label-hidden exact-revision comparison and did not require new pouch art. Re-open intensity only if final hands-on finds Charged unclear, visually tiring, or in conflict with rarity hierarchy.

## 1.3 Dedicated Charged pouch raster — NOT REQUIRED NOW

Default remains current pouch art + stronger runtime treatment.

The r3 label-hidden audit passed, so do not create a dedicated recolored Charged raster now. Re-open only if later hands-on contradicts that reviewed result.

If needed:

- preserve exact silhouette/geometry;
- preserve tear strip/tab interaction;
- recolor/material treatment only;
- do not restart pouch design.

## 1.4 `charged-ready` SFX — PARKED

The current CHIPS banking cue is synthesized `chip-clack`; star grab also has a synth-only `pouch-grab` cue from later hands-on evidence.

A separate readiness sting remains open only if:

> wallet count-up + CHIPS sound + Charged control activation still fail to make threshold crossing feel satisfying.

Do not add it automatically.

## 1.5 Exact presentation timings — OPEN FOR TUNING

Semantics are locked, milliseconds are not.

Tune from captured video + final hands-on:

- callout readable hold;
- count-up duration bounds;
- payout transfer spacing;
- fast-forward response;
- post-tear input guard;
- tear anticipation/recoil;
- Charged/rarity shimmer duration.

Goal: readable at normal pace, fast when the player taps, never sluggish by default.

---

# 2. Lite V2 balance — OPEN FOR TUNING, UNCHANGED THROUGH FEEL CORRECTION

Current values:

```text
Basic
  cost: 0
  base CHIPS: 6–10
  cache weights none/cache/big/mega: 90/7/2.5/0.5
  rarity C/R/E/L: 72/25/3/0
  Hidden Pocket: 1.5%

Charged
  cost: 60
  base CHIPS: 18–24
  cache weights none/cache/big/mega: 78/15/5.5/1.5
  rarity C/R/E/L: 35/40/20/5
  Hidden Pocket: 6%

Cache payouts
  0 / 20–35 / 45–75 / 120–180

Duplicate recycle C/R/E/L
  2/4/8/15
```

Current deterministic analysis satisfies the Charged net-sink invariant.

Legacy pouch/cache/rarity/recycle numbers did not change in the feel-correction, Phase 2.6, or Secret correction. Phase 2.6 added only its explicit Overcharge parameters, and the later approved Secret correction added one separate fixed `+40 CHIPS` jackpot. Current economy analysis includes the Hidden Pocket expected value and still keeps Charged a net CHIPS sink. After hosted/content-scale simulation, evidence questions remain:

- is 60 CHIPS reached at a satisfying cadence?
- are Basic payouts meaningful without feeling grindy?
- are cache spikes memorable but not dominant?
- is Charged's stronger rarity profile perceptible?
- are recycle rebates useful without making duplicates preferable?
- do 1.5% vs 6% Hidden Pocket chances create the intended relationship?
- does Signal threshold `4` feel relevant without becoming constant?

## 2.1 Signal Overcharge tuning — RESOLVED FOR CURRENT VALIDATION BUILD

Current Phase 2.6 candidate uses:

```text
Basic retained-lock gain:   +0.10
Charged retained-lock gain: +0.50
Overcharge cap:             x1.50
```

The mechanic and these values are implemented, transaction-tested and exact-browser-audited. Legacy Lite V2 pouch/cache/rarity/recycle values were not changed. Re-open Overcharge tuning only if the fresh merged-main regression, hosted DRAFT, or later content-scale economy evidence shows a concrete problem.

## 2.2 Secret jackpot tuning — RESOLVED FOR CURRENT VALIDATION BUILD

Current approved Secret payout is a fixed `+40 CHIPS` per successful Hidden Pocket, for both NEW and duplicate Secret outcomes after collection completion. It is persisted as its own transaction component and is never multiplied by Overcharge. Save V4 compatibility preserves pre-correction staged V3 Hidden Pockets at their original `+0` Secret bonus. Re-open `+40` only from hosted/content-scale economy evidence, not intuition.

---

# 3. Odds / Drop contents / collection-progress surface — DEFERRED NEXT CANDIDATE

Hands-on produced a valid information need:

- show exact rarity/drop probabilities;
- show what can come from the active pouch/Drop;
- show active collection/Drop names;
- show discovered vs undiscovered items.

This is deliberately **not** in the current feel correction.

Candidate solution after Phase 2.6 + hosted DRAFT evidence:

```text
Drop name · discovered/total · info
→ on-demand drawer
→ Basic/Charged exact odds from typed config
→ family list
→ discovered items visible
→ undiscovered items obscured/silhouetted
```

Still unresolved after correction:

- exact entry-point placement;
- whether Secret count/slots are concealed;
- whether odds show normalized standard-rarity percentages only or also Hidden Pocket separately;
- whether the drawer previews all collectible art or silhouette-only for missing items.

Rejected for now:

- permanent giant sidebar;
- permanently visible odds table on the main opener;
- fake Drop selector before Drop #2 exists.

---

# 4. Quick Reveal / mass opening — PARKED

The first hands-on proves pacing friction, but the approved fix is **direct tap-to-fast-forward**, not another mode.

Revisit Quick Reveal only if final hands-on says per-beat acceleration is still insufficient.

No x5/auto-open is implied.

---

# 5. Shader work — PARKED

No custom WebGL shader was added in the correction.

Use Phaser Text/Graphics/tint/blend/highlight/tweens first.

Re-open exactly one local shader only if a reviewed no-shader result proves a specific effect cannot be achieved convincingly enough — likely Charged or Legendary holography. Do not create a shader system for general polish.

---

# 6. Real Yandex DRAFT findings — NEXT EXTERNAL QUESTION SET

After the current fresh merged-main repeated-use regression passes, hosted validation may reveal issues local CI cannot:

- SDK boot/loading timing;
- safe storage behavior;
- pause/resume/audio lifecycle;
- ad no-fill/throttle/close behavior;
- interrupted Basic/Charged recovery in hosted runtime;
- rewarded exactly-once CHIPS persistence;
- Metrica visibility.

Do not invent fixes before the draft exposes a problem.

---

# 7. First expanded content roster / Drop grouping — OPEN AFTER DRAFT

Only after the final merged-main regression + real Yandex DRAFT validation, lock:

- first additional gadget families;
- first real Drop name/theme;
- when Drop #2 exists;
- exact grouping and Secret count.

Candidate families remain MP3 player, pager, mini camcorder, handheld console, PDA, portable disc/MiniDisc-like player, pocket radio, virtual-pet-like electronic and other suitable Y2K archetypes.

Rough 3–5 families per Drop remains a heuristic, not a commitment.

---

# 8. Collection at multi-Drop scale — OPEN LATER

Current Shelf/Library stays.

When Drop #2 exists, decide from real density:

- where compact Drop selection belongs;
- whether Shelf is global or Drop-scoped;
- Library grouping/filtering;
- completion headline semantics;
- Secret grouping.

Do not redesign Collection before the content exists.

---

# 9. Additional meta systems — PARKED

Not backlog commitments:

- timed Basic charges;
- offline income;
- passive Collection CHIPS/min;
- Archive levels;
- upgrade/set-bonus trees;
- prestige;
- auto-open/x5;
- crafting/merge;
- family-targeted acquisition.

Re-open exactly one only if the proven loop has a specific retention/progression problem that it solves cheaply.

## 9.1 Future expensive pouch — HYPOTHESIS AFTER OVERCHARGE VALIDATION

A several-hundred-CHIPS pouch may later provide a high-tier collection sink, stronger Secret access or another premium pool. Overcharge may make that target more reachable, but price/content/guarantee rules are deliberately unresolved until Overcharge simulation + hosted/content-scale evidence.

Do not implement it in the current bounded pass.

---

# What is NOT open anymore

Do not re-litigate without contradictory evidence:

- one global CHIPS currency;
- Basic free/unlimited;
- Basic always gives one standard collectible;
- independent base CHIPS + cache luck;
- Basic C/R/E only, no standard Legendary;
- Charged stronger top-end + Legendary access;
- duplicate auto-recycle into CHIPS + Signal;
- Signal threshold `4` and selected-pouch eligibility;
- atomic recoverable reveal transaction;
- CHIPS/Signal global across Drops;
- no shop scene;
- no multi-standard drop;
- tap-to-fast-forward presentation is the current pacing fix;
- earned CHIPS visually bank after result acceptance in the correction;
- larger tactile CHIPS HUD + dedicated CHIPS SFX;
- stronger Charged runtime differentiation;
- digital/neon accents limited to electronic UI;
- no arbitrary random callout placement;
- no custom shader in the current pass.
