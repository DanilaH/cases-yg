# Gameplay Loop Lite V2 validation

This file is the direct/local validation gate for the next gameplay pass. Real hosted Yandex checks live separately in `YANDEX_SLICE_VALIDATION.md`.

The question is no longer whether the pouch/reveal art pipeline works; that baseline has already been proven. Lite V2 must answer:

> **Does Basic → CHIPS → Charged make repeated opening more rewarding without making the game feel slower, more confusing or system-heavy?**

---

# 1. Feel / pacing

Validate through repeated hands-on play:

- tear remains immediate and pleasant;
- CHIPS presentation adds reward richness without obscuring the hero collectible;
- token flight feels responsive and lands clearly in the wallet;
- duplicate recycle feels like useful compensation rather than an extra delay;
- Charged state is visibly more exciting than Basic;
- the full sequence remains tolerable after 20–50 openings;
- CTA/result timing remains clear;
- Hidden Pocket still reads as the strongest surprise beat.

If the added reward sequence makes ordinary openings tedious, reduce presentation duration before adding Quick Reveal or more systems.

---

# 2. Player comprehension

Without explanatory prose, a player should infer:

- CHIPS are earned from pouches;
- CHIPS accumulate toward Charged;
- Charged costs CHIPS and is a better opening;
- duplicate is automatically recycled rather than “lost”;
- duplicate gives CHIPS + one Signal segment;
- four Signal segments arm a guaranteed NEW standard collectible;
- Signal is pity, not spendable currency.

The intended mental model is:

> **“Every opening gives me progress; four dupes protect me; CHIPS get me to the better pouch.”**

---

# 3. Economy sanity

Before calling Lite V2 balanced enough for DRAFT:

- Charged is reachable often enough to be a visible near-term goal;
- Charged is not so cheap that Basic becomes meaningless;
- Charged still consumes net CHIPS over time unless a deliberate future design says otherwise;
- duplicate recycle helps but does not make duplicates economically preferable to NEW;
- rarity-dependent recycle payouts feel coherent;
- Signal 4/4 frequency is neither constant nor irrelevant;
- Charged rarity/Hidden Pocket profile feels materially better in hands-on testing.

Exact values must be backed by deterministic simulation + hands-on. Do not rely on intuition alone once numbers are chosen.

---

# 4. Transaction / recovery correctness

Must hold for Basic and Charged:

- no reroll on refresh;
- no double commit;
- no double CHIPS reward;
- no duplicate recycle payout twice;
- Signal increments once;
- Hidden Pocket outcome remains fixed;
- result recovery preserves the same pouch type + loot pool.

Charged-specific blocker:

> **The CHIPS cost and reward must be atomic.**

Test refresh/crash after selecting Charged, after tear, during chip presentation, during collectible reveal and before result-ready.

Final wallet must always match one deterministic transaction.

---

# 5. Legacy save migration

Before merge:

- existing discovered standard/Secret items survive migration;
- existing stats survive unless deliberately versioned away;
- old CHIPS-absent save initializes wallet deterministically;
- old Signal `0..100` converts through an explicit tested policy;
- a legacy fully armed Signal lock is not silently lost;
- migration is idempotent across multiple reloads.

The migration policy itself remains an explicit decision in `OPEN_QUESTIONS.md` until chosen.

---

# 6. Drop scoping

Even with only one player-visible Drop, automated/debug tests must prove:

- Basic resolves only within active loot pool;
- Charged resolves only within active loot pool;
- Signal Lock chooses an undiscovered standard item inside active loot pool;
- a complete active Drop does not consume armed Signal;
- CHIPS and Signal remain global;
- adding a fake second Drop in tests does not require scene/reward-engine rewrites.

No selector UI is required while there is only one production Drop.

---

# 7. Visual QA

Use the established exact-revision workflow.

Capture/review at minimum:

- Basic idle with CHIPS + Signal HUD;
- Basic chip burst/flight;
- NEW result;
- duplicate → RECYCLED → resource transfer;
- each Signal segment increment + 4/4 lock state;
- wallet crossing Charged threshold;
- Charged ready/selected state;
- Charged reveal;
- Hidden Pocket from Basic and Charged debug paths;
- recovered pending Basic;
- recovered pending Charged;
- 900, 1024, 1280 and 1728 logical-width representative states;
- RU copy at compact width.

Technical/browser errors must be empty, but generated captures do not count as passed until inspected.

---

# 8. Debug tooling

Lite V2 debug controls should be able to force/seed:

- CHIPS amount below/at/above Charged cost;
- Basic opening;
- Charged opening;
- NEW;
- duplicate for each rarity/recycle payout;
- Signal 0/4 through 4/4;
- Signal lock consumption;
- complete active Drop with armed lock;
- Hidden Pocket by pouch type;
- interrupted pending transaction recovery;
- fake second loot pool for logic tests.

The old `+25 Signal` rewarded probe is legacy and should disappear with the Signal migration.

---

# 9. GO / FIX

### GO to real Yandex DRAFT

Proceed when:

- all technical invariants pass;
- exact-revision visual review finds no blocker;
- user hands-on confirms the new loop feels better than the old one;
- Charged creates a genuine “one more pouch” goal;
- the extra sequence does not feel bloated.

### FIX before DRAFT

Blockers include:

- CHIPS/Signal meaning is unclear;
- Charged feels like the same pouch with a label;
- resource animation visibly lies about final wallet state;
- duplicates create too much presentation friction;
- Signal migration can lose/duplicate progress;
- Charged cost/reward is not crash-safe;
- compact layout becomes cluttered;
- repeated openings are materially slower/less pleasant.

Do not respond to these problems by adding offline income, Overcharge, Archive levels or another currency.

---

# 10. After Lite V2 approval

Next order is fixed:

1. real Yandex DRAFT validation;
2. first expanded content batch;
3. first real Drop grouping when enough families exist;
4. re-simulate/tune economy at content scale;
5. scale Collection only as required;
6. final monetization/store/release work.
