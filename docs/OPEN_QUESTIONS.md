# Open questions / documentation pass checklist

This is the queue for the next discussion. Work through it deliberately and move resolved answers into `DECISIONS.md` and the relevant source-of-truth document.

---

# 1. Package and opening UX

Need to decide:

- package visual type: foil blind pouch, anti-static-style pouch, small box, capsule, blister-like tech pack, etc.;
- whether there is one package appearance or several tiers;
- exact single interaction: tap, short pull, swipe tear, tab drag, etc.;
- reveal timing;
- skip/fast behavior;
- whether package remains visually present during reveal;
- how Hidden Pocket would physically fit the package if included.

This is the next major product/UX block.

---

# 2. Screen flow / state machine

Need to freeze exact flow:

```text
Boot
→ Opening
→ Reveal
→ resolve new/duplicate
→ Opening
↘ Collection
↘ Mod Bench
```

Questions:

- Is Collection a separate scene or overlay?
- When does the player first see Signal?
- When is Mod Bench introduced?
- Where is Tech Parts balance shown?
- How many persistent HUD elements are acceptable before opener becomes cluttered?
- What happens on the very first session/tutorial?

---

# 3. Orientation / responsive composition

Must decide before implementation:

- portrait vs landscape primary target;
- logical Phaser resolution;
- desktop presentation;
- mobile/tablet safe areas;
- collection layout at different aspect ratios.

This affects every art/layout decision and is a true blocker.

---

# 4. Content matrix

Working model is around 24 base gadgets, likely including families such as:

- digicam;
- flip phone;
- MP3 player;
- pager;
- mini camcorder;
- handheld console;
- PDA;
- MiniDisc/cassette-style player;
- pocket radio;
- tiny keyboard/synth;
- virtual-pet-like electronics;
- novelty memory/USB device.

Need to decide:

- exact 24 base models;
- whether each base model truly has all four standard rarity variants;
- family distribution;
- color/material matrix;
- 2–3 Secret concepts;
- naming rules;
- shelf-slot structure.

Do not mass-produce all art until the final asset grammar survives at least one more category beyond camera/flip phone.

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
- Hidden Pocket if included;
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
- unlock timing.

---

# 9. Hidden Pocket decision

Currently provisional.

Need explicit yes/no after package UX is designed.

If yes, decide:

- trigger chance;
- allowed rewards;
- Secret relationship;
- animation budget;
- whether event is visible in collection/analytics.

Kill it if it complicates the one-action opener materially.

---

# 10. Collection screen

Need a concrete mock/spec:

- shelf/desk composition;
- number of visible slots per screen;
- how 96 potential rarity variants are represented without visual overload;
- whether the shelf displays best-owned rarity per base gadget or every variant separately;
- how completion is counted;
- how Secrets are shown/hidden;
- whether a detail view exists;
- how the player returns to opening.

This is especially important: `24 base gadgets × 4 rarity variants` can mean very different UX depending on whether all 96 get dedicated slots.

---

# 11. Collection completion semantics

Need to define exactly what “complete” means.

Possible models:

### A. Base-family completion

Own at least one version of each of the 24 gadgets.

### B. Full rarity completion

Own all 96 standard variants.

### C. Two-layer completion

- Main shelf completion = 24/24 gadget families;
- Collector mastery = 96/96 standard variants;
- Secrets tracked separately.

Model C currently looks promising but is **not yet locked**.

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

Need to choose and document:

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

The visual risk is higher than the engineering risk, so this deserves a real production rule-set.

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
