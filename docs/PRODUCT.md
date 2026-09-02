# Product direction

## 1. Product thesis

**Mystery Pocket Tech** / RU store candidate **«Мистери Гаджеты: Ретро Распаковка»** is a tiny Yandex Games collectible opener built around one strong object fantasy:

> **Open mystery package → reveal a stylized Y2K pocket gadget → discover rarity → improve a visible collection → repeat.**

The asymmetric bet is deliberately small:

- tiny production burden;
- immediately readable one-gesture interaction;
- strong visual reward;
- recognizable/trendy object theme;
- visible collection payoff;
- one simple duplicate-mitigation system;
- one rare surprise/chase beat.

It is not trying to become a broad case simulator.

---

## 2. Player fantasy

> **“I’m opening tiny mystery tech from the early 2000s and building a dream shelf of nostalgic pocket gadgets.”**

This is a collectible-toy fantasy, not:

- repair simulation;
- technology education;
- realistic electronics collecting;
- inventory-management game;
- room builder;
- casino/case economy simulator.

---

## 3. Audience hypothesis

This remains a hypothesis to validate rather than a hard demographic requirement.

Primary visual target: roughly **14–27**, likely female-skewed but not exclusive.

Likely hooks:

- Y2K/retro-tech aesthetics;
- digicams and old phones as identity/fashion objects;
- translucent plastics;
- charms/straps;
- blind-box surprise;
- tasteful cute collectible presentation.

Secondary nostalgia target: roughly **25–35**, more gender-neutral.

Design implication:

> **recognizable old-tech archetype + collectible desirability + stylized cute finish**

Do not make the art so sugary/childlike that gadget identity disappears.

---

## 4. First-probe content — LOCKED

The first behavioral/public probe contains exactly two gadget families:

- **Digital Camera**;
- **Flip Phone**.

Each has:

- Common;
- Rare;
- Epic;
- Legendary.

Standard content total: **8 variants**.

Chase content:

- one Secret Camera;
- one Secret Flip Phone;
- **2 Secrets total**, outside standard completion.

Do not add more gadget families until behavior validates.

---

## 5. Core interaction — LOCKED

1. Player sees one always-available Mystery Pouch.
2. Player grabs the star tear-tab.
3. One short left-to-right drag opens the pouch.
4. Standard result is transactionally fixed.
5. ~1.0–1.4 s reveal plays.
6. Gadget + rarity + `NEW`/duplicate resolves.
7. Duplicate may advance Signal.
8. Rarely, Hidden Pocket triggers a second Secret reveal.
9. The next free pouch is immediately available.

Compact form:

> **TEAR → REVEAL → COLLECT/SIGNAL → REPEAT**

There is:

- no package currency;
- no energy;
- no store gate;
- no multi-stage unpacking;
- no physics tearing;
- no first-probe skip/x5.

---

## 6. Progression horizons

### Immediate

**What drops now?**

### Short horizon

**Signal** turns ordinary duplicates into visible pity progress.

Before all non-Legendary variants are owned, SIGNAL LOCK guarantees one missing Common/Rare/Epic variant.

After all six non-Legendary variants are owned, SIGNAL LOCK becomes a boosted chase roll rather than guaranteeing a pointless duplicate.

### Medium horizon

**Standard Collection 8/8**.

The Shelf visually upgrades to the best owned Camera and Flip Phone while Library records every standard rarity variant.

### Chase horizon

- two 2%-rarity Legendary variants in the normal table;
- two Hidden-Pocket Secrets outside the standard ladder.

Tech Parts / Mod Bench are parked. They are not needed to prove the loop.

---

## 7. Hidden Pocket fantasy

From opening #4 onward, while a Secret remains undiscovered, each normal reveal has a separate **3%** chance to trigger Hidden Pocket.

Hidden Pocket:

- requires no extra input;
- always yields an undiscovered Secret;
- never duplicates a Secret;
- stops after both Secrets are found.

Its job is surprise and chase, not a second economy.

---

## 8. Collection fantasy — LOCKED

Preferred environment:

> **cozy illustrated Y2K shelf / desk / display**

Collection has two internal views.

### Shelf

Two hero positions:

- Camera;
- Flip Phone.

Each displays the best owned visual:

> Secret → Legendary → Epic → Rare → Common

Missing family uses a silhouette/empty stand.

### Library

Exhaustive checklist:

- Camera: Common / Rare / Epic / Legendary + Secret;
- Flip Phone: Common / Rare / Epic / Legendary + Secret.

Headline completion is **8/8 standard variants**.

Secrets use a separate **0/2** counter and are never required for standard completion.

No free placement, room editor or item-detail subsystem in the probe.

---

## 9. Monetization philosophy — LOCKED FOR PROBE

The project ultimately targets ad-supported Yandex Games distribution, but the first behavioral probe ships **without rewarded/interstitial advertising**.

Reason:

- packages are intentionally free/unlimited;
- ad-for-Signal would distort the pity behavior being measured;
- monetization integration introduces pause/resume/failure paths before the core loop proves itself.

After continuation validates, run a separate monetization pass.

Do not create artificial energy/package scarcity merely to make advertising valuable.

---

## 10. Behavioral validation

Primary question:

> **When opening is free and frictionless, do players voluntarily keep doing it?**

The first serious decision point is after at least **500 first-package interactions and 7 calendar days**, provided instrumentation/technical health is good.

Key internal gates live in `PROBE_VALIDATION.md`.

If the loop underperforms, improve in this order:

1. reveal feel/timing;
2. package interaction clarity;
3. rarity desirability/readability;
4. Collection payoff/navigation;
5. Signal pacing;
6. theme if necessary.

Do not rescue weak behavior by adding quests, crafting, worlds, minigames or a larger economy.

---

## 11. Scope guardrails

Explicitly excluded from the first probe:

- Tech Parts / Mod Bench;
- multiple package tiers;
- package currency / energy;
- ads;
- real-time 3D;
- physics;
- character movement / NPCs;
- multiple worlds/biomes;
- free room placement;
- backend/account requirement;
- trading/market;
- gambling-style crash/double/jackpot;
- live-service architecture;
- large minigame suite;
- Daily Spotlight/streaks/leaderboard;
- additional gadget families.

The first build should feel like a **small polished complete web toy**, not an unfinished slice of a much larger game.

---

## 12. Delivery target

Current rebase:

> **~5–8 focused days to submission-ready probe**, excluding moderation waiting time.

Art consistency is the largest uncertainty.

If the build exceeds roughly 8 focused days because scope is expanding, review scope instead of silently accepting the expansion.
