# Open questions / documentation pass checklist

This is the queue for the next discussion. Work through it deliberately and move resolved answers into `DECISIONS.md` and the relevant source-of-truth document.

---

# 1. Package and opening UX — RESOLVED

Locked direction:

- silver/translucent-lavender anti-static / foil mystery pouch;
- star-shaped tear-tab with one short left-to-right drag;
- deterministic one-action opening, no physics or multistage manipulation;
- ~1.0–1.4 s full reveal after tear;
- package remains the physical source for the first ~0.3–0.4 s, then exits so the gadget owns the frame;
- cheap runtime rarity FX only;
- no skip in first probe; Quick Reveal must be revisited after repeated-opening tests;
- Hidden Pocket accepted for probe as a rare automatic second reveal without additional player input.

See `DECISIONS.md`, `GAMEPLAY_SYSTEMS.md`, and `ART_DIRECTION.md`.

---

# 2. Screen flow / state machine — RESOLVED FOR PROBE

Locked probe direction:

```text
Boot
→ Opening
→ Reveal
→ resolve new/duplicate
→ Opening
↘ Collection
```

- Opening is the clean primary scene;
- Collection is the only separate persistent gameplay surface required by the probe;
- scene navigation must feel effectively instant;
- opener HUD budget is Signal + Collection navigation only;
- HUD is introduced progressively when systems become meaningful;
- first-session teaching is contextual, not a modal tutorial;
- Mod Bench / Tech Parts are parked and are not part of the probe architecture.

See `DECISIONS.md` and `TECHNICAL_DIRECTION.md`.

---

# 3. Orientation / responsive composition — RESOLVED

Locked direction:

- landscape-only first probe;
- true adaptive canvas/layout, not fixed 1280×720 `FIT`;
- 16:9 reference composition;
- coherent target range approximately 5:4 through 12:5;
- modes: compact 1.25–1.50, standard >1.50–1.95, wide >1.95–2.40;
- stable logical height 720 with derived/clamped logical width ~900–1728;
- anchor/constraint layout with shared `LayoutMetrics`;
- safe insets + responsive internal margins;
- ~44 CSS px minimum effective touch targets;
- decorative background absorbs extra space; critical UI/content never stretches or crops;
- no separate portrait composition in the first probe.

See `DECISIONS.md` and `TECHNICAL_DIRECTION.md`.

---

# 4. Content matrix — RESOLVED FOR PROBE

Locked probe content:

- exactly **2 base gadget collections**: **Digital Camera** and **Flip Phone**;
- each has Common / Rare / Epic / Legendary;
- total standard probe content = **8 rarity variants**;
- add **1–2 Secrets** outside the standard ladder;
- do not expand to more gadget families until the behavioral probe validates the core loop.

Locked art-production rule per base gadget:

1. generate roughly 6–10 exploratory base concepts;
2. select one canonical master;
3. derive all four rarity variants from that selected design;
4. preserve core geometry, camera angle and device identity across rarity variants;
5. a 2×2 rarity sheet is allowed as a production convenience when consistency holds.

Locked collection representation:

- Shelf has **2 primary slots**, one Camera and one Flip Phone;
- each slot shows the best/highest-rarity version owned;
- Library/Catalog shows all 8 standard variants and Secret discovery state.

Still-open visual details such as exact Secret concepts and final naming can be resolved during art-production work; they do not justify adding more base gadgets to the probe.

---

# 5. Package tiers / package economy — RESOLVED FOR PROBE

Locked direction:

- exactly **one Mystery Pouch type**;
- package is always available;
- openings are unlimited and free;
- no package currency;
- no energy;
- no package inventory;
- no store gating;
- no Basic/Premium/Legendary package tiers;
- rarity odds do not vary by package because there is only one package type.

Reason: with only Camera + Flip Phone, package tiers create economy/UI complexity without meaningful choice. The behavioral probe must test whether the opening/reward loop is enjoyable when friction is removed.

Multiple package types may be reconsidered only after validation and only if a larger content/economy model gives them a concrete purpose.

---

# 6. Standard drop odds — RESOLVED FOR PROBE

Locked baseline:

| Rarity | Chance |
|---|---:|
| Common | **60%** |
| Rare | **28%** |
| Epic | **10%** |
| Legendary | **2%** |

Roll Camera / Flip Phone at **50/50**, independently from rarity. Therefore each specific raw Legendary family result is approximately **1% per standard opening**.

Onboarding protection:

- first 3 standard openings are guaranteed undiscovered standard variants;
- opening #2 must use the opposite gadget family from opening #1;
- after opening #3, normal RNG begins;
- no permanent hidden anti-duplicate reroll after onboarding; Signal owns duplicate mitigation.

Secret/Hidden Pocket remains a separate post-standard roll and does not dilute this 100% standard rarity table.

Still open under section 9: exact Hidden Pocket / Secret probability.

---

# 7. Signal specification — RESOLVED FOR PROBE

Locked rules:

- Signal is global;
- only standard duplicates add Signal;
- Common duplicate `+25`;
- Rare duplicate `+20`;
- Epic duplicate `+15`;
- Legendary duplicate `+10`;
- new discoveries add no Signal;
- meter caps at 100 until consumed;
- at 100, `SIGNAL LOCK` arms the next standard reveal;
- if any undiscovered Common/Rare/Epic variant remains, the next standard reveal is forced to one of those missing non-Legendary variants;
- if all six non-Legendary standard variants are already discovered, SIGNAL LOCK instead forces a Rare/Epic standard result;
- Signal never guarantees Legendary;
- Hidden Pocket / Secret roll is independent from Signal;
- after the forced result commits, Signal resets to 0.

Presentation direction:

- compact old-LCD / antenna meter;
- progressively disclosed on first Signal gain;
- explicit `+Signal` feedback on duplicate;
- short `SIGNAL LOCK` pulse/glitch when full;
- restrained scan/lock treatment on the armed next pouch.

See `DECISIONS.md` and `GAMEPLAY_SYSTEMS.md`.

---

# 8. Tech Parts / Mod Bench — PARKED

Resolved for the first behavioral probe:

- no Tech Parts currency;
- no duplicate-to-parts conversion;
- no Mod Bench scene/nav;
- no upgrade recipes/economy;
- duplicate resolution is **duplicate → Signal progress → repeat**.

Reason: with eight standard variants, Signal already provides visible duplicate mitigation. A second progression currency and deterministic upgrade surface would add scope and make the behavioral test less clean.

Revisit after validation only if repeated-opening data shows a distinct problem that Signal alone does not solve.

---

# 9. Hidden Pocket tuning — NEXT

Hidden Pocket is accepted for the probe. Remaining tuning:

- trigger chance;
- whether it is disabled during the first-three protected onboarding opens;
- exact Secret reward rule;
- whether the probe uses one or two Secrets;
- whether Secrets are protected from duplicate Hidden Pocket results;
- what happens after all probe Secrets are discovered;
- final animation budget;
- analytics representation.

Keep it cheap and automatic; kill any implementation that turns it into a second unpacking mechanic.

---

# 10. Collection screen — CORE MODEL RESOLVED

Locked direction:

- **Main Shelf** is the attractive collection display;
- probe Shelf has one Camera slot and one Flip Phone slot;
- each slot shows the best/highest-rarity version currently owned;
- **Library / Catalog** is a separate nearby collection sub-surface showing all 8 standard rarity variants plus Secret discovery state;
- Secrets are tracked separately from the standard rarity ladder.

Still need a concrete visual/UI spec for:

- shelf/desk composition with only two hero slots;
- locked-slot appearance;
- Library navigation and density;
- item detail behavior, if any;
- Secret visibility before discovery;
- return/navigation affordances.

---

# 11. Collection completion semantics — PARTIALLY RESOLVED

The UI structure naturally supports:

- base-gadget ownership: Camera / Flip Phone;
- Library rarity mastery: 8 standard variants;
- Secrets tracked separately.

Still need to explicitly decide which state is the headline `collection complete` state and how the progress numbers are presented. Secrets remain outside main completion.

---

# 12. Rewarded ads

Need exact first-probe use.

Because base packages are unlimited and free, **do not use rewarded ads merely to grant another ordinary opening**.

Possible low-distortion option:

- Signal boost or another simple progression benefit compatible with the tiny content pool.

Avoid:

- mandatory ads to continue;
- fake near-win framing;
- artificially restricting free packages just to create an ad reward;
- ad loops that overwhelm opening/collection fantasy.

---

# 13. Analytics and kill criteria

Need explicit event names and quantitative/qualitative thresholds for:

- first reveal completion;
- second open rate;
- N-open continuation;
- collection visit;
- return from collection;
- Signal consumption;
- Hidden Pocket / Secret behavior;
- rewarded completion;
- session return if measured.

Also define what evidence causes:

- continue;
- tune;
- re-theme;
- kill.

---

# 14. Art production pipeline

The base-gadget exploration → canonical master → four derived rarity variants rule is now locked.

Still need to choose/document operational details:

- generator/tool workflow;
- prompt templates;
- reference handling;
- consistency checks;
- transparent-background cleanup;
- output dimensions;
- naming convention;
- compression format;
- retouch policy;
- how source prompts/seeds/versions are tracked.

The visual risk is higher than the engineering risk, so this still deserves a real production rule-set.

---

# 15. Store thumbnail / title

Do after package and key visual are stable.

Need:

- high-CTR thumbnail composition;
- Russian/English naming choice;
- title that communicates mystery + gadgets + collectible reward;
- icon/card readability at small size.

Do not spend time naming before the visual hook is stable.

---

# 16. Scope re-estimation

After sections 1–10 are locked, recalculate MVP/probe effort.

The content scope is now aggressively reduced to **2 base gadgets / 8 standard rarity assets + 1–2 Secrets**, with Tech Parts / Mod Bench parked. Preserve this low-burden probe unless behavioral evidence justifies expansion.
