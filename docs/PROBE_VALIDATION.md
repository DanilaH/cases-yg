# Gameplay Loop Lite V2 validation

This file is the direct/local validation gate for the next gameplay pass. Real hosted Yandex checks live separately in `YANDEX_SLICE_VALIDATION.md`.

The question is no longer whether the pouch/reveal art pipeline works; that baseline has already been proven. Lite V2 must answer:

> **Does Basic → CHIPS → Charged make repeated opening more rewarding without making the game feel slower, more confusing or system-heavy?**

---

# 1. Feel / pacing

Validate through repeated hands-on play:

- tear remains immediate and pleasant;
- CHIPS presentation adds reward richness without obscuring the hero collectible;
- ordinary token flight feels responsive and lands clearly in wallet;
- rare cache outcomes feel like a real spike rather than a random number label;
- large cache presentation stays short enough not to slow the loop;
- duplicate recycle feels like useful compensation rather than an extra delay;
- Charged state is visibly more exciting than Basic;
- the full sequence remains tolerable after 20–50 openings;
- CTA/result timing remains clear;
- Hidden Pocket still reads as the strongest surprise beat.

If added reward sequencing makes ordinary openings tedious, reduce presentation duration before adding Quick Reveal or more systems.

---

# 2. Player comprehension

Without explanatory prose, a player should infer:

- every Basic gives a gadget and CHIPS;
- CHIPS accumulate toward Charged;
- some pouches can hit a much larger CHIPS cache bonus;
- Charged costs CHIPS and is the main route to top standard rarities;
- Basic can still give Common/Rare/Epic and a very rare Secret through Hidden Pocket, but not standard Legendary;
- duplicate is automatically recycled rather than “lost”;
- duplicate gives extra CHIPS + one Signal segment;
- four Signal segments arm a guaranteed NEW standard collectible;
- Signal is pity, not spendable currency.

The intended mental model is:

> **“Basic always gives me something useful; sometimes the CHIPS payout explodes; four dupes protect me; CHIPS get me to Charged, where Legendary becomes possible.”**

---

# 3. Economy sanity

Before calling Lite V2 balanced enough for DRAFT:

- Charged is reachable often enough to be a visible near-term goal;
- Charged is not so cheap that Basic becomes meaningless;
- Basic base payout is predictable enough that player can estimate progress;
- cache bonuses create variance without making ordinary base payouts irrelevant;
- the top cache is rare enough that funding multiple Charged openings remains memorable;
- Charged **consumes net CHIPS in expectation**;
- duplicate recycle helps but does not make duplicates economically preferable to NEW;
- rarity-dependent recycle payouts feel coherent;
- Basic produces no standard Legendary in deterministic/probabilistic tests;
- Basic Rare is meaningful and Epic remains a genuine surprise;
- Charged materially increases Rare/Epic quality and has non-zero Legendary access;
- Signal 4/4 frequency is neither constant nor irrelevant;
- Signal + Charged still feels valuable because pity preserves Charged rarity weighting among missing items;
- Charged Hidden Pocket profile feels materially better while Basic Secret remains possible.

Exact values must be backed by deterministic simulation + hands-on. Do not rely on intuition alone once numbers are chosen.

---

# 4. Transaction / recovery correctness

Must hold for Basic and Charged:

- no collectible reroll on refresh;
- no cache-tier reroll on refresh;
- no double commit;
- no double base CHIPS reward;
- no double cache bonus;
- no duplicate recycle payout twice;
- Signal increments once;
- Hidden Pocket outcome remains fixed;
- result recovery preserves same pouch type + loot pool + payout profile.

Charged-specific blocker:

> **The CHIPS cost and every reward component must be atomic.**

Test refresh/crash after selecting Charged, after tear, during base CHIPS presentation, during a forced large cache beat, during collectible reveal and before result-ready.

Final wallet must always match one deterministic transaction.

---

# 5. Legacy save migration

Before merge:

- existing discovered standard/Secret items survive migration;
- existing stats survive unless deliberately versioned away;
- old CHIPS-absent save initializes wallet deterministically;
- old Signal uses exact locked mapping `min(4, floor(oldSignal / 25))`;
- boundary values `24/25/49/50/74/75/99/100` migrate correctly;
- a legacy fully armed Signal lock remains armed;
- migration never creates more than one lock;
- migration is idempotent across multiple reloads.

---

# 6. Drop scoping / pity weighting

Even with only one player-visible Drop, automated/debug tests must prove:

- Basic resolves only within active loot pool;
- Charged resolves only within active loot pool;
- Basic rarity gate excludes Legendary regardless of pool contents;
- Charged can select Legendary where eligible;
- Signal Lock filters to undiscovered standard items inside active loot pool;
- after filtering, Signal Lock preserves the selected Basic/Charged rarity profile;
- a complete active Drop does not consume armed Signal;
- CHIPS and Signal remain global;
- adding a fake second Drop in tests does not require scene/reward-engine rewrites.

No selector UI is required while there is only one production Drop.

---

# 7. Visual QA

Use the established exact-revision workflow.

Capture/review at minimum:

- Basic idle with CHIPS + Signal HUD;
- ordinary Basic CHIPS burst/flight;
- forced large cache payout and wallet-count animation;
- Common/Rare/Epic Basic outcomes;
- proof path that Basic Legendary cannot be forced through normal profile;
- NEW result;
- duplicate → RECYCLED → resource transfer;
- each Signal segment increment + 4/4 lock state;
- wallet crossing Charged threshold through normal payout;
- wallet crossing Charged threshold through cache jackpot;
- Charged ready/selected state;
- Charged Epic/Legendary reveal;
- Signal-Locked Charged NEW result;
- Hidden Pocket from Basic and Charged debug paths;
- recovered pending Basic;
- recovered pending Charged with forced cache bonus;
- 900, 1024, 1280 and 1728 logical-width representative states;
- RU copy at compact width.

Technical/browser errors must be empty, but generated captures do not count as passed until inspected.

---

# 8. Debug tooling

Lite V2 debug controls should be able to force/seed:

- CHIPS amount below/at/above Charged cost;
- Basic opening;
- Charged opening;
- ordinary/no-cache payout;
- each configured cache tier;
- NEW;
- duplicate for each rarity/recycle payout;
- Basic Common/Rare/Epic;
- Charged Legendary;
- Signal 0/4 through 4/4;
- Signal lock consumption on Basic and Charged;
- complete active Drop with armed lock;
- Hidden Pocket by pouch type;
- interrupted pending transaction recovery;
- fake second loot pool for logic tests.

The old `+25 Signal` rewarded probe is legacy and should disappear with Signal migration.

---

# 9. GO / FIX

### GO to real Yandex DRAFT

Proceed when:

- all technical invariants pass;
- exact-revision visual review finds no blocker;
- user hands-on confirms the new loop feels better than old one;
- Basic remains fun despite no standard Legendary;
- cache jackpot adds excitement without dominating economy;
- Charged creates a genuine “one more pouch” goal;
- Charged feels materially better rather than cosmetically different;
- extra sequence does not feel bloated.

### FIX before DRAFT

Blockers include:

- CHIPS/Signal meaning is unclear;
- large cache looks like arbitrary text rather than a reward event;
- ordinary CHIPS feel irrelevant beside jackpots;
- Charged expected CHIPS return self-funds repeated Charged spam;
- Charged feels like same pouch with a label;
- Basic Legendary appears through normal roll;
- Signal-Locked Charged loses its rarity advantage;
- resource animation visibly lies about final wallet state;
- duplicates create too much presentation friction;
- Signal migration can lose/duplicate progress;
- Charged cost/reward/cache is not crash-safe;
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
