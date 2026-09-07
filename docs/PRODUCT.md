# Product direction

## 1. Product thesis

**Mystery Pocket Tech** / RU working title **«Мистери Гаджеты: Ретро Распаковка»** is a Yandex Games collectible opener built around one strong object fantasy:

> **Open mystery tech → reveal a stylized Y2K gadget → discover rarity → improve a visible collection → repeat.**

The implemented lightweight meta-loop is:

> **Basic Pouch → collectible + CHIPS → duplicate recycle + SIGNAL → Charged Pouch → better roll → repeat.**

The project is deliberately **not** a full idle/incremental economy. Final direct hands-on exposed a bounded remaining finding set; current work is Phase 2.6: those fixes plus the explicitly approved Signal Overcharge extension, then exact/direct regression before Yandex DRAFT.

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

### Stage B3 — final-hands-on correction + Signal Overcharge — CURRENT APPROVED PASS

Canonical contract: `FINAL_HANDS_ON_OVERCHARGE_PLAN.md`. Fix rarity/reward/Charged-denial issues, make Signal/Secret self-explanatory, add the deterministic recoverable Overcharge extension, simulate gain/cap tuning, then exact-audit and directly regress it. The future expensive pouch remains a hypothesis only.

### Stage C — real Yandex DRAFT validation — NEXT AFTER STAGE B3 ACCEPTANCE

Validate hosted SDK boot/loading, lifecycle/audio, safe storage, interrupted Basic/Charged recovery, ads, rewarded exactly-once CHIPS probe and analytics/Metrica where configured.

CI/local browser automation cannot replace this gate.

### Stage D — content/release build — BLOCKED ON STAGE C

Only after corrected feel and hosted platform behavior are proven:

- materially expand gadget families;
- group content into themed Drops;
- expose Drop selection only when Drop #2 exists;
- scale Collection from real density;
- re-simulate/tune economy at content scale;
- finalize monetization/store creative.

### Stage E — public Yandex release

Final moderation/store/release hardening happens on the expanded content build.

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

---

## 5. Progression model — CURRENT RUNTIME

Basic always gives one standard collectible + base CHIPS + independent cache chance. Duplicates additionally give rarity-dependent recycle CHIPS + one Signal segment.

At `4/4`, Signal guarantees NEW only among selected-pouch-eligible missing standard items. If only Legendary remains, Basic resolves normally and Signal stays armed until Charged.

CHIPS = spendable progress toward Charged. Current runtime Signal = non-spendable duplicate protection. Approved next: while an already-armed lock cannot be consumed, Signal also carries a capped Overcharge multiplier over earned `base + cache + recycle` CHIPS; cash-out occurs before a consuming lock visually discharges/reset.

The durable Overcharge transition remains part of the atomic reveal transaction, not a presentation-owned mutation.

---

## 6. Current provisional tuning — UNCHANGED THROUGH CORRECTION

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

Cache remains independent; Mega pays `120–180 CHIPS` at current provisional tuning.

No legacy balance tuning was mixed into the presentation pass. Keep existing pouch costs/base/cache/rarity/recycle values unchanged in Phase 2.6; only new Overcharge gain/cap values are simulation-driven tuning candidates.

---

## 7. Feel principles — CURRENT

### Responsiveness

Every deliberate input should produce acknowledgement. A player should never be left repeatedly clicking a visibly complete state with no reaction.

### Physical causality

Motion should connect source and destination:

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

Mechanically unchanged, but Charged must become visually obvious before reading its label.

Current merged solution remains low-production:

- same pouch silhouette/tear geometry;
- stronger cyan/violet runtime treatment;
- restrained pink/iridescent sweep;
- star/seal emphasis;
- stronger contour/aura/sparks;
- selector + pouch transition together.

The label-hidden exact-revision audit passed with runtime treatment, so no recolored Charged raster is required now. Re-open that asset only if later hands-on contradicts the audit. Do not redesign pouch geometry.

---

## 9. Information visibility — VALID NEED, DEFERRED FROM FEEL PASS

Hands-on also produced a desire to see:

- rarity/drop probabilities;
- what can drop;
- collection/Drop names;
- discovered vs unknown items.

This is a valid progression-comprehension surface but is **not core feel choreography**.

After Phase 2.6 + hosted DRAFT evidence, consider one on-demand Drop info drawer sourced from typed balance/content config. Avoid a permanent giant sidebar or permanently visible probability table.

Player-facing Drop selector waits for Drop #2.

---

## 10. Content / Collection / monetization strategy — UNCHANGED

Camera and Flip Phone remain the private validation catalog. Future content belongs to themed Drops rather than a global mega-pool.

Shelf = attractive best finds. Library = exhaustive ownership/completion view. Scale only from real roster density.

Ads remain optional/reasonable: rewarded explicit, interstitial outside active reveal, failures non-blocking, no artificial energy scarcity.

---

## 11. Scope guardrails

Explicitly excluded from the current correction:

- balance changes;
- new family/Drop content;
- Drop selector;
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
