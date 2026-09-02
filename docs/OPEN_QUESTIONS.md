# Open questions / post-validation queue

The first behavioral probe is now **implementation-ready**. There are no remaining product decisions that should block coding.

This file now tracks only post-validation questions, submission checks, and explicitly parked systems.

---

# 1. First-probe decisions — RESOLVED

Locked in the source-of-truth docs:

- one silver/lavender Mystery Pouch;
- one left-to-right star-tab tear gesture;
- ~1.0–1.4 s full reveal, no skip in initial probe;
- Opening + Collection only; reveal remains inside Opening;
- adaptive landscape layout;
- exactly Camera + Flip Phone;
- 4 standard rarities each = 8 standard variants;
- one free unlimited package type;
- standard odds 60 / 28 / 10 / 2;
- first-three undiscovered onboarding protection;
- Signal duplicate pity system;
- Tech Parts / Mod Bench parked;
- 2 Secrets;
- 3% Hidden Pocket from opening #4 while an undiscovered Secret remains;
- Hidden Pocket always gives an undiscovered Secret, then disables after 2/2;
- Shelf + Library collection model;
- standard completion = 8/8, Secrets separate 0/2;
- no ads in first behavioral probe;
- Yandex built-in metrics + Yandex Metrica custom events;
- operational art pipeline;
- rebased 5–8 focused-day submission target.

See:

- `DECISIONS.md`;
- `GAMEPLAY_SYSTEMS.md`;
- `TECHNICAL_DIRECTION.md`;
- `ART_DIRECTION.md`;
- `ART_PRODUCTION.md`;
- `PROBE_VALIDATION.md`.

---

# 2. Quick Reveal — REQUIRED POST-DATA REVIEW

Do not implement in the initial probe.

Review when repeated-opening data/playtests show enough depth that the full reveal becomes friction.

Candidate if needed:

- ~0.4–0.6 s fast mode;
- same state/drop semantics;
- preserve rarity readability;
- no mass/x5 opening by default.

This question must not be silently forgotten.

---

# 3. Monetization — POST-VALIDATION

No ads in first behavioral probe.

If the continuation gates are met, separately decide:

- interstitial vs rewarded strategy;
- natural placement that does not damage the opener loop;
- whether any rewarded progression benefit is useful without inventing artificial scarcity;
- ad-frequency test plan.

Do not add energy/package limits merely to make an ad reward valuable.

---

# 4. Content expansion — POST-VALIDATION

Do not add more families until core behavior validates.

If validated, candidate next families include:

- MP3 player;
- pager;
- mini camcorder;
- handheld console;
- PDA;
- MiniDisc/player archetype;
- pocket radio;
- virtual-pet-like electronics.

Expansion should happen in small waves, not by jumping straight to the old ~24-family planning model.

---

# 5. Tech Parts / Mod Bench — PARKED

Only reconsider if real data shows Signal does not provide enough meaning to duplicates.

Before bringing it back, answer:

- what distinct problem does it solve that Signal does not?
- does the larger content pool justify deterministic upgrade agency?
- can it stay cheap without becoming a crafting/economy game?

Do not scaffold it in advance.

---

# 6. Package tiers / Daily Spotlight — PARKED

One free package is correct for the probe.

Only revisit multiple package types or rotating family boosts after more gadget families exist and there is a concrete choice to offer.

---

# 7. Shelf evolution / streaks / leaderboard — PARKED

These remain optional retention layers after the loop validates.

Priority if needed:

1. cheap shelf/environment milestone evolution;
2. Daily Spotlight when enough families exist;
3. streak/leaderboard only if actual retention/social data justifies them.

---

# 8. Store submission checks — REQUIRED BEFORE MODERATION

These are operational verification tasks rather than game-design questions:

- verify chosen RU/EN title uniqueness in the Yandex Games Console;
- produce 512×512 PNG icon;
- produce 800×470 PNG cover;
- add at least two valid 16:9 screenshots for each selected platform;
- verify title consistency across game and draft materials;
- run resize/moderation viewport checks;
- verify sound pauses on minimize/platform pause;
- verify `LoadingAPI.ready()` fires only when interactive;
- verify gameplay start/stop lifecycle;
- verify local save and interrupted `pendingReveal` recovery;
- verify Yandex Metrica custom events in draft mode.

---

# 9. Behavioral decision point

Do not expand scope immediately after release.

Wait for the first serious sample defined in `PROBE_VALIDATION.md`:

> at least **500 first-package interactions + 7 calendar days**, provided instrumentation and technical health are sound.

Then choose one of:

- continue/expand;
- tune reveal/Collection/Signal;
- re-theme;
- kill.

New features are not the default response to weak continuation.
