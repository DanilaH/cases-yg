# Product direction

## 1. Product thesis

**Mystery Pocket Tech** / RU working title **«Мистери Гаджеты: Ретро Распаковка»** is a Yandex Games collectible opener built around one strong object fantasy:

> **Open mystery tech → reveal a stylized Y2K gadget → discover rarity → improve a visible collection → repeat.**

The implemented lightweight meta-loop is:

> **Basic Pouch → collectible + CHIPS → duplicate recycle + SIGNAL → Charged Pouch → better roll → repeat.**

The project is deliberately **not** a full idle/incremental economy. Phase 2.6 Signal Overcharge, the bounded feel corrections, final repeated-use regression, seven-Drop content expansion, content-scale economy audit and directed first-run onboarding design are complete/locked. The next evidence gate after the onboarding implementation is the real hosted Yandex DRAFT.

---

## 2. Current execution stages — LOCKED

### Stage A — internal vertical slice baseline — COMPLETE

Camera + Flip Phone established pouch/reveal interaction, rarity/Hidden Pocket presentation, Collection, transactional save/recovery, responsive landscape, asset production, platform boundaries and exact-revision visual QA.

The two-family build remains private and is not the public release.

### Stage B — Gameplay Loop Lite V2 — IMPLEMENTED

Current runtime contains CHIPS, cache, recycle, segmented Signal, Basic/Charged profiles, Drop-aware resolution, save migration, atomic recovery, Opening economy UI and deterministic tests/debug paths.

Technical + original exact-revision visual gates passed.

### Stage B2 — Opening Feel Correction + bounded follow-up polish — COMPLETE

The first real repeated-use hands-on is complete and found specific evidence-backed problems:

- CHIPS do not feel tactile enough;
- resource HUD is visually too weak;
- Basic/Charged selection is cramped/ambiguous;
- important feedback disappears too quickly;
- earned CHIPS should visually remain with the result before banking;
- Charged visual identity is too close to Basic;
- dead `RESULT LOCKED` tapping is frustrating;
- the UI needs a stronger distinctive Y2K/electronic visual language.

Canonical implementation scope: `OPENING_FEEL_CORRECTION_SCOPE.md`.

This pass adds **presentation quality**, not new gameplay rules:

- input fast-forward;
- tactile grab/tear response;
- staged reward → HUD banking;
- CHIPS count-up / local HUD reaction / synthesized `chip-clack`;
- synth-only `pouch-grab` feedback on star grab;
- duplicate + Signal physical transfer;
- clearer left-side pouch-selection hierarchy;
- stronger Charged presentation;
- restrained digital/pixel typography + neon/iridescent accents.

Visual rule:

> **Cozy Y2K world, electric digital UI.**

Implementation, repeated-use follow-up fixes, exact-revision video/screenshot audits and manual reviews are complete through PR #45. The subsequent final direct hands-on completed with bounded findings.

### Stage B3 — final-hands-on correction + Signal Overcharge — IMPLEMENTED / EXACT-AUDITED

Canonical contract: `FINAL_HANDS_ON_OVERCHARGE_PLAN.md`. The rarity/reward/Charged-denial fixes, Signal/Secret clarity work and deterministic recoverable Overcharge extension are implemented and exact-audited. Final direct repeated-use regression is accepted. Current tuning is Basic `+0.10`, Charged `+0.50`, cap `x1.50`; the later economy audit also accepted these values unchanged. The future expensive pouch remains a hypothesis only.

### Stage C — expanded content + economy scale — COMPLETE / AUDITED

The runtime now contains seven themed Drops / fourteen families / seventy authored collectibles with Drop-aware Collection navigation and on-demand art loading. The historical six-Drop full-game economy audit accepted the existing steady-state balance unchanged after multi-strategy simulation and focused cross-Drop Signal/Overcharge stress; the later Airwaves content addition did not intentionally retune the core economy.

### Stage C2 — directed onboarding — LOCKED NEXT

Canonical contract: `ONBOARDING.md`.

The new-player path is intentionally a **directed version of normal gameplay**, not a tutorial screen:

- first Basic pouch physically enters/lands before normal chrome appears;
- star gesture pointer teaches the existing tear interaction;
- brand-new save receives a one-time 10-CHIPS starting wallet;
- first Basic is authored to NEW Rare + normal base payout + exactly +20 cache;
- the existing durable pending transaction remains authoritative across refresh/recovery;
- first affordability at 60 CHIPS points to Charged;
- first Charged is authored to NEW Legendary and may satisfy an already-armed Signal;
- first duplicate / first full Signal get short contextual explanations only.

Hidden Pocket, Overcharge, cache taxonomy and the rarity ladder remain discovery, not tutorial content.

This is a bounded early-progression exception. Normal Basic/Charged costs, cache tables, rarity tables, Signal, Hidden Pocket and Overcharge remain unchanged after the two authored onboarding beats.

### Stage D — real Yandex DRAFT validation — NEXT AFTER C2

Upload the exact expanded candidate and validate hosted SDK boot/Game Ready/gameplay markup, lifecycle/audio, onboarding refresh/recovery, safe storage, interrupted Basic/Charged recovery, seven-Drop loading/navigation, ads debug probes and analytics/Metrica where configured.

CI/local browser automation cannot replace this gate.

### Stage E — public-release hardening

After hosted platform behavior is proven:

- fix only demonstrated hosted defects;
- finalize rewarded/interstitial/sticky monetization decisions;
- finalize Metrica/CSP choice;
- finalize store metadata and seven-Drop release creative;
- run declared-device/browser/moderation self-check;
- submit the expanded candidate for public moderation.

---

## 3. Player fantasy

> **“I’m opening tiny mystery tech from the early 2000s and building a dream collection of nostalgic pocket gadgets.”**

The product is a collectible-toy fantasy, not repair simulation, electronics inventory management, gambling simulation or a spreadsheet-heavy idle game.

Target visual hypothesis remains:

- primary ~14–27, likely female-skewed but not exclusive;
- secondary ~25–35 nostalgia audience;
- recognizable Y2K electronics + blind-box desirability + tasteful cute finish.

The merged correction makes the electronic part of that fantasy more explicit without losing the soft toy/nostalgia layer.

---

## 4. Core interaction — mechanics unchanged, corrected choreography integrated

Economic/interaction truth remains:

1. choose Basic or affordable Charged;
2. grab star tear-tab;
3. deterministic short left-to-right tear;
4. complete reward transaction is predetermined/persisted;
5. one standard collectible resolves;
6. duplicate may recycle into CHIPS + Signal;
7. Hidden Pocket may add one Secret;
8. result resolves and player repeats or opens Collection.

The merged feel correction changed the presentation chain to read more physically:

```text
grab response
→ tear tension/snap
→ collectible arrival + rarity impact
→ reward components staged with result
→ accept
→ CHIPS/Signal physically bank into HUD
→ next action
```

Tap/click during active presentation can accelerate it without changing the transaction.

For an untouched save, `ONBOARDING.md` directs the first pass through the same mechanics with a pre-UI pouch entrance and two authored reward milestones. Tutorial presentation never substitutes for or owns the transaction.

---

## 5. Progression model — CURRENT RUNTIME

Basic always gives one standard collectible + base CHIPS + independent cache chance. Duplicates additionally give rarity-dependent recycle CHIPS + one Signal segment.

At `4/4`, Signal guarantees NEW only among selected-pouch-eligible missing standard items. If only Legendary remains, Basic resolves normally and Signal stays armed until Charged.

CHIPS = spendable progress toward Charged. Signal remains non-spendable duplicate protection and, while an already-armed lock cannot be consumed, also carries the capped Overcharge multiplier over earned `base + cache + recycle` CHIPS. Current Phase 2.6 tuning: Basic retained-lock gain `+0.10`, Charged `+0.50`, cap `x1.50`; consuming lock cashes out the current multiplier before the staged discharge/reset.

The durable Overcharge transition remains part of the atomic reveal transaction, not a presentation-owned mutation.

---

## 6. Current release-candidate tuning — ECONOMY-AUDITED

### Basic

- cost `0`;
- base `6–10 CHIPS`;
- rarity C/R/E/L `72 / 25 / 3 / 0`;
- Hidden Pocket `1.5%` from opening #4.

### Charged

- cost `60 CHIPS`;
- base `18–24 CHIPS`;
- rarity `35 / 40 / 20 / 5`;
- Hidden Pocket `6%` from opening #4.

Duplicate recycle C/R/E/L = `2 / 4 / 8 / 15 CHIPS`.

Cache remains independent; Mega pays `120–180 CHIPS` at current release-candidate tuning.

Normal pouch tuning remains unchanged. The onboarding contract introduces only these new-player exceptions:

- one-time start wallet `10 CHIPS` before opening #1;
- opening #1 Basic = NEW Rare + fixed `cache +20` while retaining normal Basic base CHIPS;
- first Charged = NEW Legendary when a missing eligible Legendary exists.

After those authored beats, the release-candidate distributions above apply normally. Reopen ordinary balance only from hosted/player evidence or a material mechanic/content change.

---

## 7. Feel principles — CURRENT

### Responsiveness

Every deliberate input should produce acknowledgement. A player should never be left repeatedly clicking a visibly complete state with no reaction.

### Physical causality

Motion should connect source and destination:

- first-run pouch arrival has approach sound, contracting landing shadow, material contact, squash and rebound;
- star pull affects pouch;
- tear produces recoil;
- reward emerges from pouch;
- CHIPS exist beside reward before traveling into wallet;
- Signal fragment travels into Signal HUD;
- Charged readiness occurs when displayed wallet crosses threshold.

### Readability without forced slowness

Important labels stay long enough to read at normal pace. Experienced players can fast-forward rather than being forced through every duration.

### Distinctive electronic identity

Use digital/pixel typography, neon glow and restrained iridescence mainly for CHIPS, Signal, Charged and rarity/system moments.

Do not apply aggressive synthwave/CRT treatment to the whole cozy scene.

---

## 8. Basic vs Charged presentation

Mechanically unchanged after onboarding, but Charged must become visually obvious before reading its label.

Current merged solution remains low-production:

- same pouch silhouette/tear geometry;
- stronger cyan/violet runtime treatment;
- restrained pink/iridescent sweep;
- star/seal emphasis;
- stronger contour/aura/sparks;
- selector + pouch transition together.

The first-ever Charged selection additionally gets one short non-blocking premium emphasis from `ONBOARDING.md`; it is milestone choreography, not a new permanent effect stack.

The label-hidden exact-revision audit passed with runtime treatment, so no recolored Charged raster is required now. Re-open that asset only if later hands-on contradicts the audit. Do not redesign pouch geometry.

---

## 9. Information visibility — VALID NEED, DEFERRED FROM FEEL PASS

Hands-on also produced a desire to see:

- rarity/drop probabilities;
- what can drop;
- collection/Drop names;
- discovered vs unknown items.

This is a valid progression-comprehension surface but is **not core feel choreography**.

After hosted DRAFT evidence, consider one on-demand Drop info drawer sourced from typed balance/content config. Avoid a permanent giant sidebar or permanently visible probability table.

Player-facing seven-Drop navigation already exists; richer odds/content-detail surfaces remain deferred until hosted/player evidence justifies them.

---

## 10. Content / Collection / monetization strategy — UNCHANGED

Camera and Flip Phone remain the historical validation catalog. Current production content is organized as seven themed Drops with two families per Drop rather than a global mega-pool.

Shelf = attractive best finds. Library = exhaustive ownership/completion view. Both operate against the real seven-Drop roster and active Drop context.

Ads remain optional/reasonable: rewarded explicit, interstitial outside active reveal, failures non-blocking, no artificial energy scarcity.

---

## 11. Scope guardrails

Still excluded from the current pre-DRAFT scope:

- speculative ordinary balance changes without new evidence;
- more family/Drop content beyond the current seven-Drop candidate;
- permanent odds/collection sidebar;
- Basic energy/timers;
- offline/passive income;
- Archive levels;
- any Overcharge expansion beyond the bounded Signal extension in `FINAL_HANDS_ON_OVERCHARGE_PLAN.md`;
- upgrades/set bonuses;
- shop;
- multiple currencies;
- multi-standard drops;
- prestige;
- x5/auto-open;
- crafting/merge/trading;
- custom WebGL shaders;
- speculative backend/live-service architecture.

> **Make the existing loop feel expensive before making the game structurally bigger.**
