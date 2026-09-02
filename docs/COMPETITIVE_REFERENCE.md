# Competitive reference notes

Purpose: extract **cheap, high-leverage retention primitives** without copying the production burden of mature case simulators.

These notes are directional. Exact live feature sets can change and should be re-checked before implementation decisions that depend on them.

---

## 1. Сквиш Мистери Дамплинги: Открой Пельмень

https://yandex.ru/games/app/skvish-misteri-damplingi-otkroi-pelmen-533677

Useful as the simplest structural reference:

- opener;
- rarity;
- collection;
- low interaction burden.

Lesson:

> very low-input mystery reveal + rarity + collection can work as a skeleton, but theme/presentation carry much of the value.

---

## 2. Сундук Удачи: пиксельный лут-симулятор

https://yandex.ru/games/app/sunduk-udachi-pikselnyi-lut-simuliator-560153

Observed/reference feature set discussed during research:

- 144 items;
- 7 rarities;
- luck meter;
- duplicate crafting;
- 7 biomes;
- daily rewards;
- rewarded ads;
- leaderboard.

### What we kept

**Luck/pity → SIGNAL**.

Reason: ordinary duplicates create visible progress without adding another economy.

### What we learned but parked

**Duplicate crafting → Tech Parts / Mod Bench** was initially accepted as a transformation, then deliberately parked after the probe content shrank to Camera + Flip Phone. With only eight standard variants, Signal already solves the duplicate-frustration job and a second currency/upgrade scene would muddy the test.

### Do not imitate

- 7 normal rarities;
- 7 biomes;
- feature-count arms race.

---

## 3. Самодельные боксы: распаковка

https://yandex.ru/games/app/samodelnye-boksy-raspakovka-557788

Research interest:

- opening UX;
- secret compartments / double-bottom surprise;
- duplicate recycling/upgrading.

### Kept transformation

**Secret compartment → Hidden Pocket**.

Our version is an automatic post-reveal surprise, not a search/manipulation sequence.

For the probe it has one job:

> **rare Secret acquisition**

No generic bonus table and no second input.

---

## 4. Кейс-батл

https://yandex.ru/games/app/434649

Useful as a warning/reference for case-meta growth:

- fast opening;
- upgrades;
- contracts;
- economy/farming layers.

### Keep in reserve

**Quick Reveal** as eventual QoL if repeated opening becomes slow.

### Avoid

- importing the whole meta stack;
- contracts/farm systems merely because mature case games have them.

---

## 5. Кейс симулятор Станд Бокс 2 — 3D

https://yandex.ru/games/app/436125

Use as a warehouse of mature retention ideas, not a scope reference.

Avoid in first probe:

- market/trading;
- 3D inspection;
- clicker/farm loops;
- minigames;
- deep crafting/customization;
- large economy.

---

## 6. Стандофф 2 Симулятор: Кейсы

https://yandex.ru/games/app/427908

Research interest:

- timer-based gifts;
- persistent return hooks.

Potential later transformation:

- Daily Spotlight / timed content boost after there are enough gadget families.

Do not block first probe with it.

---

## 7. Симулятор Кейсов: Открой Все Стэнд Боксы

https://yandex.ru/games/app/simuliator-keisov-otkroi-vse-stend-boksy-524218

Research interest:

- single vs multi-open;
- speeding repeated openings.

Current decision:

- **Quick Reveal is parked but must be revisited from real repeated-opening data**;
- no x5 opening in first probe.

---

## 8. Geometry Dash — Открытие кейсов

https://yandex.ru/games/app/423078

Research interest:

- collection/value framing;
- duplicate/value loop.

Potential later lesson:

- aggregate collection score/value may exist after validation;
- not required now.

---

## 9. Case Opener — Google Play

https://play.google.com/store/apps/details?id=com.jakpok.casesimulator

Mature external reference for the long tail of case-sim meta:

- upgrader;
- contracts;
- achievements;
- leaderboards;
- broad case variety;
- many economy/minigame systems.

Important conclusion:

> **Do not turn Mystery Pocket Tech into a simulated-gambling ecosystem.**

The reusable pattern is acquisition → bad/duplicate outcome → visible progress → repeat. In the probe, **Signal alone** owns that visible-progress job.

---

# Cross-competitor synthesis — CURRENT

## Included in first probe

### 1. Pity/progress protection

**SIGNAL**.

### 2. Rare second surprise

**Hidden Pocket**, simplified to a 3% post-standard Secret event after onboarding while an undiscovered Secret remains.

### 3. Visible collection payoff

**Shelf + Library** rather than a giant inventory grid.

## Explicitly parked

### 4. Duplicate crafting / deterministic upgrades

**Tech Parts / Mod Bench** — only revisit if real data shows Signal is insufficient.

### 5. Repeated-open friction reduction

**Quick Reveal** — required post-data review, not initial scope.

### 6. Return hooks

**Daily Spotlight / streaks / timed gifts** — only after core continuation validates and there is enough content.

### 7. Visual environment evolution

Potential later shelf/desk milestones, not first probe.

---

# Explicit anti-patterns

Do not compete on:

- raw system count;
- rarity-label count;
- worlds/biomes;
- simulated betting;
- markets/trading;
- minigame count;
- 3D complexity;
- hundreds of unrelated base items.

Compete on:

- theme fit;
- collectible art desirability;
- fast opening UX;
- satisfying rarity/material escalation;
- visible duplicate mitigation;
- collection progress;
- low-cost surprise.
