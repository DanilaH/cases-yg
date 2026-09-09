# Final Audio Feel Correction Workflow — 2026-09-09

Status: **APPROVED WORK ORDER / SECOND SUBJECTIVE EAR-CHECK FINDINGS / IMPLEMENTATION PENDING**

This document is the latest bounded feel work order after the structurally successful PR #88 combined audit and a second real subjective listening pass. It supersedes older audio-tuning details where they conflict, but it does **not** reopen gameplay, economy or content scope.

Current validated baseline before this work:

- `main = 117515134f530714403757895a23703a79bbb05d`;
- structural browser/lifecycle acceptance is green;
- `pendingReveal`, save/economy ownership, Hidden Pocket page ownership, mute lifecycle, resize recovery and CHIPS global pitch contour are already validated;
- the remaining work exists because subjective listening found concrete feel issues that automation cannot judge.

The product identity remains:

> **Cozy Y2K world + electric digital UI.**

The governing question remains:

> **Does this make the existing short opening loop more tactile, coherent and repeatable, or does it merely add more sound?**

If it merely adds more sound, do not implement it.

---

# 1. New subjective findings

## 1.1 Star / pouch-grab sound regressed

### Finding

After the latest audio correction, the short sound associated with grabbing the star/tab became unpleasant and can read like old-TV static / interference.

The continuous friction texture that appears while physically dragging the star is a separate effect and was positively received. That layer should become slightly more audible.

### Code evidence

The only direct PR #87 runtime change to the `pouch-grab` cue was that it began receiving the generic UI one-shot pitch variation. Before #87, the cue played at its authored pitch. After #87, both decoded-sample playback and synth fallback receive a bounded pitch factor.

However, the observed perceptual failure must **not** be declared proven to be caused by pitch alone. A ±3.2% playback-rate change is small. The cue/fallback also contains a short filtered noise transient, and the newer calmer mix may expose noisy material more clearly.

### Approved correction

- restore `pouch-grab` to **no random pitch variation** so the loaded sample behaves exactly as it did before #87;
- do not redesign or replace the authored sample unless a focused A/B still reproduces the failure after the pitch rollback;
- keep synth fallback available, but do not make its noisy transient brighter as part of this pass;
- treat `pouch-grab` and drag friction as separate layers;
- raise only the continuous drag texture slightly, approximately from current `maxGain 0.0085` toward `~0.0100`, keeping the same progress/velocity mapping and bounded release semantics.

Acceptance:

- star grab no longer reads as TV/static noise;
- drag retains the liked material rustle and is easier to hear;
- drag does not become a broadband hiss during slow movement;
- release/cancel/complete still silence the texture deterministically.

---

## 1.2 Persistent rarity ambience is slightly too quiet

### Finding

Rare/Epic/Legendary persistent ambience can come forward a little more. Epic is currently more satisfying than Legendary. Current Secret ambience is subjectively excellent.

### Approved ladder direction

Do not solve this by a flat global volume increase.

Use the current ear-check anchors:

- **Rare:** slightly more present, still restrained;
- **Epic:** current character is good; preserve it and only modestly increase presence;
- **Legendary:** replace the weak current character with the **current Secret timbral direction** as the primary reference;
- **Secret:** preserve the successful current identity, but extend it upward into a richer premium state rather than merely turning it much louder.

In practice:

- the current Secret harmonic family may be promoted toward Legendary;
- new Secret should gain additional upper harmonic colour, shimmer motion and/or width;
- Secret must remain clearly above Legendary through **richness, motion and spectral detail**, not only bus gain;
- do not reintroduce the old low ominous/server-room drone family.

The intended perceptual ladder becomes:

`Rare = presence`

`Epic = rich`

`Legendary = wow`

`Secret = premium anomaly / “what was that?”`

---

# 2. Add slow procedural micro-dynamics to ambience

## 2.1 Why

The current base and rarity beds are already procedural, but sustained layers still expose a degree of staticness during long holds.

The desired correction is not melody and not a noticeable LFO effect. The ambience should change slowly enough that the player experiences it as **alive**, not as an audible looping modulation.

## 2.2 Base location ambience

Keep the current calm profile and `humGain = 0`.

Add bounded asynchronous movement to existing material:

- keep slow pad-filter movement;
- make its rate/depth explicit presentation data rather than unexplained runtime magic numbers;
- add a separate slow shimmer gain movement with a different period;
- avoid synchronising all layers to one cycle;
- no new low machine hum;
- no obvious stereo wobble or musical phrase.

Desired percept:

`soft room → slightly brighter → upper air recedes → another colour becomes visible → back`

The change should take roughly tens of seconds, not a few beats.

## 2.3 Rarity ambience

Preserve stable pitch identity but slowly change **spectral balance**.

Preferred implementation:

- existing slow tone breathing remains;
- strengthen it enough to become perceptible without pulsing like a siren;
- add one additional very slow motion oscillator per rarity state;
- use it to move tone-filter cutoff and shimmer colour/gain within safe bounds;
- this causes higher harmonics to fade in/out naturally without turning the ambience into a melody;
- use different rates between the tone pulse and colour movement so the state does not reveal a short loop.

Do **not** add an oscillator per harmonic unless later evidence proves the simpler spectral-motion approach insufficient. One shared slow colour-motion source is lower complexity and easier to audit.

---

# 3. Result ambience arrival should have a stronger envelope

## Current behavior

Persistent rarity ambience currently fades from near-zero to its steady bus gain over roughly `320–360 ms` and then remains in its slow hold state.

There is no deliberate intro overshoot/settle.

## Approved behavior

When a stable Rare/Epic/Legendary/Secret result first becomes owned by the result state:

`0 → small intro crest → normal hold level → slow micro-dynamics`

Directionally:

- fade from silence into roughly `110–120%` of the steady ambience energy;
- settle gently back to `100%`;
- use spectral/shimmer lift as part of the crest so it is not perceived as a simple volume spike;
- total arrival should remain short, roughly sub-second;
- Common remains the calm base-only state.

The intro crest belongs to **stable result-state ownership**, never to the transient rarity cue.

---

# 4. Keep rarity ambience alive through collect/banking

## Current problem

`continueFromResult()` currently clears persistent result ambience immediately before `animateRewardBanking()` begins. That means the rarity state disappears before the value leaves the result.

This is structurally safe but emotionally weak.

## Approved behavior

Do not clear rarity ambience at collect start.

Instead:

`stable hold 100% → banking energy rises with reward movement → final peak → smooth release to zero → idle base restored`

Recommended character:

- banking increases perceived rarity energy by only about `10–20%`;
- lift comes from bus + tone-filter opening + shimmer richness, not raw volume alone;
- CHIPS keep their already validated **global rising pitch contour**;
- ambience lift may use page-local progress while CHIPS pitch uses global transaction progress;
- after the final reward reaches its destination, persistent rarity ambience fades out cleanly and base returns;
- no new persistent source may survive the banking state.

This produces one coherent arc:

`reveal → rarity arrives → rarity breathes while waiting → collect energises it → value lands → rarity releases → room remains`

---

# 5. Hidden Pocket collect must follow active carousel ownership

## Current problem

The stable Hidden Pocket carousel correctly changes visual/audio ownership between standard and Secret pages, but collect/banking currently behaves as one undifferentiated reward source.

The CHIPS sequence runs:

`base → cache → recycle → Overcharge bonus → Secret bonus`

and the flight origin comes from the currently rendered reward tray. As a result, a large reward sequence can visibly appear to originate from one active item even when part of that reward semantically belongs to the other carousel item.

## Approved presentation ownership

A single collect gesture still accepts the whole already-committed opening transaction, but presentation should process each carousel item separately.

### Standard page owns

- base CHIPS;
- cache bonus;
- duplicate recycle CHIPS;
- Overcharge CHIPS bonus.

Signal and Overcharge state transitions retain their existing timing contracts and are **not** moved into collect merely to make this animation easier.

### Secret page owns

- `secretBonus` / Hidden Pocket jackpot CHIPS.

### Order

Start from whichever page is active when the player presses Collect.

If standard is active:

`standard acknowledgement → standard CHIPS bank → auto-switch → Secret acknowledgement → Secret CHIPS bank`

If Secret is active:

`Secret acknowledgement → Secret CHIPS bank → auto-switch → standard acknowledgement → standard CHIPS bank`

Rules:

- only the active item receives the collect contraction/acknowledgement for its reward phase;
- after its associated reward reaches the HUD, automatically move to the other page;
- rerender the reward tray for the newly active page before its banking begins;
- page ambience follows the page exactly during this process;
- one quiet carousel-switch cue on the actual automatic index change is acceptable;
- global CHIPS pitch progress must **not reset** between pages;
- durable economy/save state is untouched: this is presentation ordering only;
- fast-forward must still end at the same committed final state without double-paying or skipping cleanup.

This preserves the transactional invariant:

`one opening transaction / one durable commit / two presentation owners`

---

# 6. Procedural vs authored SFX policy

Use procedural audio when a sound should continuously react to a parameter or state. Use authored samples for short identity-bearing transients where texture/material realism matters more than continuous reactivity.

## Procedural is preferred for

### Implement / strengthen now

- base room ambience;
- persistent rarity ambience;
- drag friction tied to progress/velocity;
- CHIPS banking pitch/brightness contour;
- rarity banking energy envelope;
- high-rarity anticipation duck/spectral collapse.

### Hybrid

- reveal: authored foreground impact + procedural rarity tail/state;
- Secret reveal: authored impact + procedural premium ambience;
- star interaction: authored grab/pop + procedural continuous drag texture;
- collect: authored confirmation click + procedural rarity banking lift + procedural CHIPS contour.

## Authored SFX remain preferred for

- pouch/tear snap;
- reveal impact/pop;
- NEW discovery ping;
- duplicate/recycle transient;
- ordinary UI click/denied;
- carousel mechanical click;
- milestone sting.

These cues benefit from rich transient material and should not be converted into generic oscillator bleeps merely because procedural synthesis exists.

---

# 7. Signal / Overcharge / Charged procedural opportunities

These were reviewed because they are obvious candidates for parameter-driven sound, but **they are not automatically part of this implementation pass**.

## High-value future candidates

- Signal-lock consumption prelude could gain a short parameterised tonal charge tied to projectile progress;
- Overcharge cash-out could gain a brief spectral lift tied to its visual transfer;
- Charged pouch aura could support a very faint stateful tone that responds to selected/charged state.

## Independent scope decision

Do **not** add a permanent Signal HUD hum or always-on Charged-pouch drone in this pass.

Reasons:

- the scene already has base ambience + result ambience + tactile layers;
- another continuously owned sound risks rebuilding the exact “too much continuous sound” problem just corrected;
- the current user feedback identifies concrete defects elsewhere with higher ROI;
- Signal/Overcharge already have readable transient SFX and visual motion.

These remain evidence-gated enhancements after the final correction ear-check, not mandatory backlog.

---

# 8. Reference-backed design principles

The external references are used as principles, not as instructions to imitate another game's sound palette.

## Em Halberstadt — GDC 2024, “How Sound Can Make You Feel”

Relevant principle: frequency range, density, loudness and balance materially change agitation/relief and therefore must be tuned as emotional design variables, not only technical mix parameters.

Application here:

- avoid low sustained pressure;
- make rarity richer without simply making everything louder;
- preserve headroom around foreground interaction;
- judge long-hold comfort by ear.

Source: https://www.gdcvault.com/play/1034773/Audio-Summit-How-Sound-Can

## Martin Stig Andersen — GDC 2016, “A Game That Listens — The Audio of INSIDE”

Relevant principle: sound is temporal; transitions and feedback loops should preserve continuity through pace, suspense and release.

Application here:

- result ambience should not be abruptly cleared before banking;
- banking should be the release phase of the rarity state;
- carousel reward ownership should follow the active temporal state instead of presenting unrelated value from one visual source.

Source: https://www.gdcvault.com/play/1023731/A-Game-That-Listens-The

## Kevin Regamey — GDC 2023, “The TUNIC Audio Talk”

Relevant principle: game design should inform audio decisions and technical implementation; audio effects should reinforce actual interaction semantics.

Application here:

- drag texture follows physical movement;
- carousel switch cue follows actual index changes;
- reward origin follows actual active item ownership;
- samples and procedural layers are chosen by interaction role, not ideology.

Source: https://www.gdcvault.com/play/1029369/The-TUNIC-Audio

## Paul Weir — GDC 2017, “The Sound of No Man's Sky”

Relevant principle: procedural/generative audio is strongest when deeply connected to game logic and used to create variation/reactivity that conventional fixed playback cannot provide alone.

Application here:

- keep procedural audio for continuous state/progress dimensions;
- use slow parameter motion to avoid static/repetitive beds;
- do not proceduralise every transient.

Source: https://www.gdcvault.com/play/1024067/The-Sound-of-No-Man

## Sucker Punch — GDC 2021, scalable ambience system for Ghost of Tsushima

Relevant principle: ambience can be an adaptive system reacting to game parameters rather than one fixed loop.

Application here:

- base/result/banking states should drive mix and spectral behaviour;
- ownership remains explicit and bounded;
- procedural ambience is valuable because this game has a small number of meaningful parameters and repeated short loops.

Source: https://www.gdcvault.com/play/1027222/Big-World-Small-Team-Designing

## Joonas Turner — GDC Europe 2015, “Oh My! That Sound Made the Game Feel Better!”

Relevant principle: sound design should make gameplay feel tighter and more coherent, not merely decorate it.

Application here:

- every added layer must correspond to interaction/state meaning;
- no permanent sound just because the engine can generate one.

Source: https://gdcvault.com/play/1022843/Oh-My-That-Sound-Made

---

# 9. Implementation sequence

Keep each pass independently reviewable.

## Pass A — star regression + tactile drag

Files expected:

- `src/game/data/audioPresentation.ts`;
- tests around audio presentation.

Changes:

1. exclude `pouch-grab` from random pitch variation;
2. raise continuous drag max gain slightly;
3. do not change economy, input semantics or drag lifecycle.

Gate:

- CI;
- focused hands-on A/B of grab + slow/fast drag if a browser audit is available.

## Pass B — ambience dynamics + rarity ladder

Files expected:

- `src/game/data/audioPresentation.ts`;
- `src/game/systems/audio.ts`;
- audio tests.

Changes:

1. make base pad motion parameters explicit;
2. add slow base shimmer breathing;
3. add one slow spectral-motion source per persistent rarity state;
4. add stronger result intro crest/settle;
5. modestly raise rarity presence;
6. preserve Epic as anchor;
7. move current Secret timbral family toward Legendary;
8. extend Secret through additional upper richness/motion rather than raw loudness.

Gate:

- CI;
- source-count lifecycle check because persistent source counts will legitimately change;
- 30-second hold per rarity;
- headphone and ordinary-speaker ear-check remains mandatory.

## Pass C — banking ambience envelope

Files expected:

- `src/game/systems/audio.ts`;
- `src/game/scenes/OpeningScene.ts`;
- audio/runtime tests.

Changes:

1. do not clear result ambience at collect start;
2. expose bounded result-banking progress to audio controller;
3. use progress to lift bus/spectral energy;
4. clear/fade only after final banking completes;
5. ensure deferred resize/scene shutdown/fast-forward always cleanup.

Gate:

- CI;
- banking completion and fast-forward lifecycle;
- mute during result/banking;
- no source leak.

## Pass D — Hidden Pocket active-page reward banking

Prefer a tiny pure plan helper rather than embedding hard-to-test reward ownership branching into animation code.

Suggested helper:

- returns standard/Secret presentation pages in the order determined by active carousel index;
- standard page contains base/cache/recycle/Overcharge CHIPS legs;
- Secret page contains Secret bonus;
- total/global amount remains available for one CHIPS pitch contour.

Scene choreography:

1. disable result input;
2. accept current page only;
3. bank that page's CHIPS from its current reward tray;
4. auto-switch if another page remains;
5. rerender tray + sync ambience;
6. accept/bank second page;
7. final fade/cleanup;
8. render idle.

Gate:

- both starting orders: standard-first and Secret-first;
- each page pays only its own semantic legs;
- global CHIPS total and final HUD value unchanged;
- one global clack contour;
- fast-forward and resize remain safe;
- no second durable commit.

## Pass E — combined repeated-use acceptance

Required final manual/automated coverage:

- idle several minutes;
- star grab + slow/fast drag;
- Common baseline;
- Rare/Epic/Legendary/Secret 30-second holds;
- NEW and duplicate;
- ordinary banking;
- Hidden Pocket starting from standard;
- Hidden Pocket starting from Secret;
- automatic page switch during collect;
- CHIPS contour across both Hidden Pocket pages;
- mute/unmute during hold and banking;
- resize during reveal/result/banking;
- Opening → Collection → Opening;
- repeated real tears;
- runtime/page/request diagnostics;
- source counts stable after repeated cycles.

Only after this subjective correction is approved does the project move to real hosted Yandex DRAFT validation.

---

# 10. Non-goals

Do not use this workflow to add:

- new currencies;
- shop/crafting/prestige;
- new Drop/family/content;
- full music system;
- permanent Signal soundtrack;
- permanent Charged soundtrack;
- new audio middleware/framework;
- large `OpeningScene` rewrite;
- hidden economy changes;
- new RNG that affects gameplay;
- large sample-library replacement;
- extra particles/visual juice unrelated to the findings.

---

# 11. Acceptance definition

This pass succeeds when:

- grabbing the star sounds clean again;
- drag rustle is slightly more tactile;
- location ambience remains calm but feels subtly alive;
- rarity ambience has slow spectral life rather than a static sustained tone;
- Rare/Epic/Legendary/Secret hierarchy reads through character and richness;
- current successful Secret character is not lost;
- Legendary no longer feels weaker than Epic;
- result ambience arrives with a small premium crest, then settles;
- collect energises the same rarity state instead of killing it before banking;
- Hidden Pocket rewards visibly belong to the active item that owns them;
- automatic page switching makes the two-part reward coherent;
- CHIPS still feel like one accumulating transaction;
- no persistent audio stack, economy ownership or recovery invariant regresses;
- after repeated openings, sound can remain enabled without fatigue.

That is the final feel gate. Anything beyond it requires new evidence rather than enthusiasm.