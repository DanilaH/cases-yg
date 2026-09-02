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

What it validates:

> very low-input mystery reveal + rarity + collection can work as a game skeleton.

What not to copy:

- dumpling/squish theme;
- any assumption that the skeleton alone creates demand.

Product lesson:

> theme and presentation matter enormously.

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

### Steal/transform

**Luck meter → SIGNAL meter**

Reason: bad random results still create forward movement.

**Duplicate crafting → Tech Parts + Mod Bench**

Reason: duplicate becomes deterministic progress.

### Do not imitate directly

- 7 normal rarity tiers;
- 7 biomes;
- feature-count arms race.

Our intended advantage is stronger object desirability and lower production burden, not more systems.

---

## 3. Самодельные боксы: распаковка

https://yandex.ru/games/app/samodelnye-boksy-raspakovka-557788

Research interest:

- opening UX;
- secret compartments / double-bottom surprise;
- duplicate recycling/upgrading.

### Transform

**Secret compartment → Hidden Pocket**

Do not add a long search/manipulation sequence. Instead, after an apparently completed reveal, occasionally trigger a tiny second surprise beat.

Potential use:

- bonus item;
- special package insert;
- Secret/Chase acquisition path.

### Duplicate lesson

Duplicate value should be tangible and deterministic rather than “another useless copy.”

---

## 4. Кейс-батл

https://yandex.ru/games/app/434649

Useful as a warning/reference for case-meta growth:

- fast opening;
- upgrades;
- contracts;
- economy/farming layers.

### Steal

**Fast/quick reveal** as eventual QoL if repeated opening becomes slow.

### Avoid

- importing the whole meta stack;
- building contracts/farm systems merely because mature case games have them.

---

## 5. Кейс симулятор Станд Бокс 2 — 3D

https://yandex.ru/games/app/436125

Use as a warehouse of mature retention ideas, not as a scope reference.

The class of systems to avoid for the first probe includes:

- market/trading;
- 3D inspection;
- clicker/farm loops;
- minigames;
- deep crafting/customization;
- large economy.

Lesson:

> a case simulator can become huge very quickly; that does not mean our product should.

---

## 6. Стандофф 2 Симулятор: Кейсы

https://yandex.ru/games/app/427908

Research interest:

- timer-based gifts;
- persistent reason to return/open again.

Potential transformation later:

- free Daily Spotlight package;
- timed free delivery.

Do not block the first probe with this.

---

## 7. Симулятор Кейсов: Открой Все Стэнд Боксы

https://yandex.ru/games/app/simuliator-keisov-otkroi-vse-stend-boksy-524218

Research interest:

- single vs multi-open;
- speeding up repeated openings.

Current decision:

- consider **Quick Reveal** later;
- do not default to x5 opening because our object art/reveal is a bigger part of the value proposition.

---

## 8. Geometry Dash — Открытие кейсов

https://yandex.ru/games/app/423078

Research interest:

- collection/value framing;
- duplicate/value loop.

Potential lesson:

- collection can have an aggregate score/value later;
- not required for the probe.

---

## 9. Case Opener — Google Play

https://play.google.com/store/apps/details?id=com.jakpok.casesimulator

Use as a mature external reference for the long tail of case-sim meta:

- upgrader;
- contracts;
- achievements;
- leaderboards;
- broad case variety;
- many additional economy/minigame systems.

### Important conclusion

Do **not** turn Mystery Pocket Tech into a simulated-gambling ecosystem.

The valuable reusable pattern is:

> **random acquisition → duplicate/bad roll → deterministic progress → another reason to open**

Our version should remain themed around nostalgic technology collection rather than betting.

---

# Cross-competitor synthesis

## Accepted high-leverage primitives

### 1. Pity/progress protection

Transform into **SIGNAL**.

### 2. Duplicate utility

Transform into **Tech Parts + Mod Bench**.

### 3. Rare second surprise

Transform into **Hidden Pocket** if it stays cheap.

### 4. Repeated-open friction reduction

Park **Quick Reveal** for later.

### 5. Return hooks through content rotation

Park **Daily Spotlight** rather than building large daily-reward tables/content worlds.

### 6. Visual long-term progression

Use one **evolving shelf/desk scene** rather than 7+ biomes.

---

# Explicit anti-patterns

Do not compete on:

- raw number of systems;
- number of rarity labels;
- worlds/biomes;
- simulated betting;
- markets;
- trading;
- minigame count;
- 3D complexity;
- hundreds of unrelated base items.

Compete on:

- theme fit;
- collectible art desirability;
- fast opening UX;
- satisfying rarity/material escalation;
- useful duplicates;
- visible collection progress;
- low-cost surprise/retention mechanics.
