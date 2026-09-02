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

# 2. Screen flow / state machine — RESOLVED

Locked direction:

```text
Boot
→ Opening
→ Reveal
→ resolve new/duplicate
→ Opening
↘ Collection
↘ Mod Bench
```

- Opening is the clean primary scene;
- Collection and Mod Bench are separate fast scenes/surfaces;
- scene navigation must feel effectively instant;
- opener HUD budget is Signal + Tech Parts + Collection + Mod Bench only;
- HUD is introduced progressively when systems become meaningful;
- first-session teaching is contextual, not a modal tutorial.

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

# 4. Content matrix — STRUCTURE RESOLVED, LINEUP NEXT

Locked structural model:

- first behavioral probe = **12 base gadgets**;
- split into **2 mini-collections of 6 gadgets**;
- every base gadget has Common / Rare / Epic / Legendary variants;
- total probe standard content = **48 rarity variants**;
- add **1–2 Secrets** outside the standard ladder;
- fuller post-validation target may grow toward ~24 base gadgets, but the probe does not wait for that volume.

Locked art-production rule per base gadget:

1. generate roughly 6–10 exploratory base concepts;
2. select one canonical master;
3. derive all four rarity variants from that selected design;
4. preserve core geometry, camera angle and device identity across rarity variants;
5. a 2×2 rarity sheet is allowed as a production convenience when consistency holds.

Still need to decide:

- themes/names of the two six-item mini-collections;
- exact 12 base gadget lineup;
- family distribution across those collections;
- final color/material assignments where rarity grammar leaves freedom;
- 1–2 exact Secret concepts;
- naming rules for devices/variants.

Do not mass-produce final art until the 12-item lineup is locked.

---

# 5. Package tiers

Old handoff assumed roughly 3 package tiers. This needs fresh review now that Signal and Mod Bench exist.

Questions:

- Is a free/basic package always available?
- Are there 2 or 3 tiers?
- What differentiates tiers: rarity odds, family targeting, Signal gain, price?
- Does Daily Spotlight replace some tier complexity?
- Can the economy deadlock?

Goal: smallest package model that creates meaningful choice without turning into a store simulator.

---

# 6. Drop odds

Need final probability model for:

- Common;
- Rare;
- Epic;
- Legendary;
- Secret acquisition;
- Hidden Pocket;
- new-item protection;
- package-tier modifiers.

Do not choose percentages in isolation. Balance against:

- average time per opening;
- expected session length;
- collection size;
- duplicate conversion;
- Signal fill speed.

---

# 7. Signal specification

Accepted concept, unresolved mechanics.

Decide:

- what increases Signal;
- exact increments;
- global vs per package;
- full-meter reward;
- reset rules;
- interaction with Legendary/Secret;
- whether `SIGNAL LOCK` guarantees `NEW`, `Rare+`, or both;
- how it is communicated without clutter.

---

# 8. Tech Parts / Mod Bench specification

Accepted concept, unresolved mechanics.

Decide:

- duplicate-to-parts values by rarity;
- whether extra copies are stored or immediately recycled;
- upgrade model;
- 3-choice offer vs direct same-item rarity upgrade;
- costs;
- whether lower-rarity item is consumed;
- how to prevent Mod Bench from trivializing collection completion;
- exact unlock timing after the first duplicate introduction.

---

# 9. Hidden Pocket tuning

Hidden Pocket is accepted for the probe. Remaining tuning:

- trigger chance;
- allowed rewards;
- exact Secret relationship;
- final animation budget;
- analytics representation.

Keep it cheap and automatic; kill any implementation that turns it into a second unpacking mechanic.

---

# 10. Collection screen — CORE MODEL RESOLVED

Locked direction:

- **Main Shelf** is the attractive collection display;
- one shelf slot per base gadget;
- each slot shows the best/highest-rarity version currently owned for that gadget;
- **Library / Catalog** is a separate nearby collection sub-surface showing all gadgets and Common/Rare/Epic/Legendary discovery states;
- Secrets are tracked separately from the standard rarity ladder;
- first probe shelf therefore has 12 base slots rather than 48 rarity slots.

Still need a concrete visual/UI spec for:

- shelf/desk composition;
- how the two six-item mini-collections are arranged;
- locked-slot appearance;
- Library navigation and density;
- item detail behavior, if any;
- Secret visibility before discovery;
- return/navigation affordances.

---

# 11. Collection completion semantics — PARTIALLY RESOLVED

The UI structure now naturally supports two layers:

- Shelf/base-gadget progress;
- Library rarity-variant mastery;
- Secrets tracked separately.

Still need to explicitly decide which of these counts as the game's headline `collection complete` state and how the progress numbers are presented. Do not assume Secrets are required; the existing rarity decision says they are outside main completion.

---

# 12. Rewarded ads

Need exact first-probe use.

Possible low-distortion options:

- bonus Tech Parts;
- one extra package;
- temporary Spotlight/family boost.

Avoid:

- mandatory ads to continue;
- fake near-win framing;
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
- Mod Bench use;
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

The previous ~7 focused-day kill boundary predates the accepted Signal/Mod Bench/Secret direction. Preserve the **low-burden constraint**, but do not pretend the old number is still validated.
