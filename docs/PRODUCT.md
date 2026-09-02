# Product direction

## 1. Product thesis

**Mystery Pocket Tech** is a tiny Yandex Games collectible opener built around one strong object fantasy:

> **Open mystery package → reveal a stylized Y2K pocket gadget → discover rarity → add it to a visible collection → repeat.**

The project is deliberately not trying to become a large case simulator. Its asymmetric bet is:

- tiny production burden;
- immediately readable interaction;
- strong visual reward;
- recognizable/trendy object theme;
- visible collection payoff;
- a few cheap systems that make bad rolls and duplicates still feel productive.

The theme matters more than mechanical complexity. Earlier research already showed that bare `open box → random item → collection` is not enough by itself; theme and presentation carry a large share of the product value.

---

## 2. Player fantasy

The intended fantasy is:

> **“I’m opening tiny mystery tech from the early 2000s and slowly building a dream shelf of nostalgic pocket gadgets.”**

This is a **collectible toy fantasy**, not:

- repair simulation;
- technology education;
- realistic electronics collecting;
- hardcore inventory management;
- room-building game;
- casino/case economy simulator.

---

## 3. Audience hypothesis

This is currently a **working hypothesis**, not a validated demographic truth.

### Primary visual target

Approx. **14–27**, likely female-skewed but not female-exclusive.

Likely hooks:

- Y2K/retro-tech aesthetics;
- digicams and old phones as fashion/identity objects;
- translucent plastics;
- charms/straps;
- blind-box surprise;
- cute but tasteful collectible presentation.

### Secondary target

Approx. **25–35**, more gender-neutral and nostalgia-led.

Desired reaction:

> “I remember gadgets like this.”

### Design implication

Do not make the art so sugary/childlike that the gadget identity disappears. The product should combine:

> **recognizable old-tech archetype + collectible desirability + stylized cute finish**

---

## 4. Core interaction

Target interaction:

1. Player sees a mystery package.
2. Player chooses/activates it.
3. One short deterministic pointer/touch interaction opens it.
4. ~0.5–1.5 seconds of anticipation.
5. Gadget reveal.
6. Rarity reveal.
7. Resolve `NEW` vs duplicate.
8. Update collection / progression systems.
9. Return immediately to opening.

Compact form:

> **PACKAGE → OPEN → ANTICIPATION → GADGET → RARITY → RESOLVE → REPEAT**

Avoid:

- multi-stage tactile simulation;
- physics-driven tearing;
- finicky gestures;
- long cinematic transitions;
- tutorials for basic manipulation.

---

## 5. Progression horizons

The current product direction intentionally creates several different reasons to continue without turning into a large meta game.

### Immediate

**What drops from this package?**

### Short horizon

**Signal meter** advances even when a roll is disappointing/duplicate, leading toward a guaranteed useful result.

### Medium horizon

**Duplicates → Tech Parts → Mod Bench** creates deterministic progress rather than dead inventory.

### Long horizon

**Visible collection completion** and rare **Secret/Chase editions** provide the collector goal.

Potential future layer:

- shelf/desk scene visually evolves at collection milestones;
- Daily Spotlight rotates boosted gadget families.

These future layers are parked and must not block the first probe.

---

## 6. Collection fantasy

Preferred collection presentation:

> **cozy Y2K shelf / desk / display case**

Implementation should remain cheap:

- fixed predefined slots;
- static or lightly animated background;
- each collectible is visible/unlocked vs silhouette/empty slot;
- no free placement;
- no room editor;
- no drag-and-drop inventory arrangement.

The scene itself is part of the reward: the player should be able to visually see their collection becoming richer.

---

## 7. Monetization philosophy

The project is intended to become an ad-supported Yandex Games title, but the first probe is for **behavior validation**, not maximum ad yield.

Accepted direction:

- one optional rewarded flow is enough initially;
- reward only after the actual rewarded callback;
- do not distort the core loop around aggressive ad placement;
- no casino framing or simulated-betting minigames.

Monetization depth comes **after** evidence that players repeatedly open packages and care about the collection.

---

## 8. Behavioral validation

The first version is successful only if players show repeat behavior, not merely if the build runs.

Key questions:

- Do players complete the first reveal?
- Do they open a second package?
- Do they continue through multiple openings?
- Do they visit the collection?
- Do they return from collection to opening?
- Do Signal / duplicate progression reduce frustration and sustain the loop?
- Do players care about higher rarities / Secrets?

If the tiny loop does not work, do **not** fix it by adding:

- quests;
- deep upgrades;
- multiple worlds;
- crafting trees;
- minigames;
- 3D exploration;
- multiplayer;
- narrative.

First improve:

- reveal quality;
- theme desirability;
- package/opening presentation;
- collection payoff;
- progression clarity.

---

## 9. Scope guardrails

Explicitly avoid for the probe:

- real-time 3D world;
- physics;
- character movement;
- NPCs;
- multiple biomes/worlds;
- free room placement;
- backend/account system;
- trading/market;
- gambling-style `crash`, `double`, `jackpot`;
- live-service architecture;
- large minigame suite;
- elaborate social systems.

The project should remain closer to a **highly polished web toy with retention primitives** than to a full service game.
