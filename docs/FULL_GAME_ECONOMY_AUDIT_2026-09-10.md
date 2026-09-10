# Full-game economy audit — 2026-09-10

Status: **ACCEPTED — keep current balance unchanged**.

This audit was run after the production content registry expanded to six Drops / twelve families / sixty collectibles. Its purpose was to answer the content-scale balance question without changing numbers from intuition.

## Decision

Keep the current `LITE_V2_BALANCE` values unchanged:

- Basic / Charged costs and base CHIPS;
- cache weights and payouts;
- standard rarity weights;
- duplicate recycle values;
- Signal threshold;
- Hidden Pocket probabilities and `+40 CHIPS` Secret jackpot;
- Overcharge gains `Basic +0.10 / Charged +0.50`;
- Overcharge cap `x1.50`.

The six-Drop model does not expose a dominant routing exploit, pathological standard-completion tail, or runaway CHIPS loop during collection progression. The remaining long tail is intentionally Secret-driven. Lowering Overcharge cap would mainly make that tail slower.

---

## 1. Method

The audit used the **production reward and transaction path**, not a separately reimplemented probability model:

```text
createPendingReveal
→ resolveLitePouchReward
→ stagePendingReveal
→ commitPendingRevealState
```

Production inputs:

- `GAME_REGISTRY`;
- `LITE_V2_BALANCE`;
- six production loot pools;
- 48 standard collectibles;
- 12 Secrets.

A deterministic seeded `RandomSource` was used. Main simulation: **3,000 trials per strategy**. Every trial completed all 60 collectibles within the 2,000-opening safety bound.

The audit intentionally excludes rewarded-ad grants and other external CHIPS injections. It measures the self-contained gameplay economy.

### Strategies

**Sequential full eager**

Stay in one Drop until `8/8 standards + 2/2 Secrets`, then advance. Use Charged whenever affordable.

**Standards-first eager**

Finish `8/8 standards` in each Drop before dedicated Secret cleanup. Use Charged whenever affordable.

**Signal-frugal**

Prefer Basic while ordinary Basic-eligible standards remain. Spend Charged mainly when Signal is armed or Basic cannot reach the remaining standard; use eager Charged during Secret cleanup.

**Protection-hop**

Deliberately visit every Drop for its local first-three-opening protection before continuing with the Signal-frugal route. This is the obvious content-scale attempt to exploit per-Drop onboarding protection.

---

## 2. Static pouch EV sanity

These values come from the production `analyzePouchEconomy` helper and represent the all-standard-duplicate stress case before active Overcharge multiplication.

| Metric | Basic | Charged |
|---|---:|---:|
| Cost | 0 | 60 |
| Expected base CHIPS | 8.000 | 21.000 |
| Expected cache bonus | 4.175 | 9.675 |
| Expected duplicate recycle | 2.680 | 4.650 |
| Expected Secret bonus | 0.600 | 2.400 |
| Expected return | 15.455 | 37.725 |
| Expected net | +15.455 | **-22.275** |

The original Charged-sink invariant still holds at dormant Overcharge.

---

## 3. Main progression results

### Opening milestones — p50 / p90

| Strategy | First 60 CHIPS | First Charged | First Drop 8/8 | All 48 standards | All 12 Secrets | Full 60/60 |
|---|---:|---:|---:|---:|---:|---:|
| Sequential full eager | 6 / 7 | 7 / 8 | 24 / 29 | 269 / 361 | 295 / 396 | **296 / 396** |
| Standards-first eager | 6 / 7 | 7 / 8 | 24 / 29 | **140 / 152** | 290 / 385 | **290 / 385** |
| Signal-frugal | 6 / 7 | 9 / 10 | 25 / 30 | 147 / 158 | 292 / 391 | **292 / 391** |
| Protection-hop | 7 / 8 | 24 / 25 | 39 / 43 | 147 / 157 | 293 / 387 | **293 / 387** |

### Strategy-level economy

| Strategy | Mean Charged share | Charged opens p50 | Duplicates p50 | Final wallet p50 | Overcharge bonus p50 |
|---|---:|---:|---:|---:|---:|
| Sequential full eager | 57% | 168 | 248 | 111 | 2,120.5 |
| Standards-first eager | 58% | 170 | 242 | 183.5 | 2,351.5 |
| Signal-frugal | 57% | 167 | 244 | 188 | 2,232.5 |
| Protection-hop | 57% | 169 | 245 | 185 | 2,263.5 |

Interpretation:

1. **Charged becomes available early enough.** Median first affordability is opening 6; eager play uses the first Charged on opening 7.
2. **Standards are not the long tail.** A standards-first player reaches 48/48 at p50 140 / p90 152.
3. **Secrets own the back half.** Full completion moves to p50 290 / p90 385 because twelve successful missing-first Hidden Pockets are required across six Drops.
4. **Routing does not materially change full completion.** The three non-sequential strategies finish at p50 290–293. Sequential full-Drop play is only slightly slower at p50 296.
5. **Per-Drop onboarding protection is not exploitable for net progression.** Protection-hop delays first Charged and first 8/8, while full completion remains effectively unchanged.
6. **No strategy trap is visible.** Signal-frugal is only a few openings slower than eager play, so players are not punished heavily for saving CHIPS or reasoning about Signal.

---

## 4. Secret tail

The Secret tail is real, but the current mechanics bound it:

- every successful Hidden Pocket selects an undiscovered Secret first while one remains in the active Drop;
- therefore the player needs twelve successful discovery events, not a coupon-collector hunt against already-owned Secrets;
- after 48/48 standards, retained Signal / Overcharge makes Charged increasingly sustainable and raises Hidden Pocket frequency from Basic `1.5%` toward Charged `6%`.

For the standards-first route:

```text
48/48 standards: p50 140 / p90 152
60/60 collection: p50 290 / p90 385
```

This is a substantial second phase, but it is not currently evidence for lowering rarity or raising Secret odds. Doing so would make full completion much shorter without fixing any observed progression deadlock.

Reopen Secret tuning only from hands-on / hosted analytics showing that this tail is boring or causes abandonment.

---

## 5. Cross-Drop Signal / Overcharge stress

Signal and CHIPS are global while guarantee eligibility is active-Drop scoped. The main content-scale concern was therefore:

> Can a player farm a completed Drop, carry a maxed Signal/Overcharge state into another Drop, and trivialize missing high-rarity standards?

### Completed-Drop bank → guaranteed Legendary

Stress setup:

- bank Drop already `8/8 standards`;
- target Drop has exactly one missing Legendary;
- wallet starts at 0;
- Signal starts `0/4`;
- Overcharge starts `x1.00`;
- farm Basic on the completed Drop until `4/4 + x1.50 + 60 CHIPS`;
- switch to target and cash out one Charged guarantee.

Across 1,000 deterministic-seed trials:

```text
cycle length p50 = 10 openings
cycle length p90 = 10 openings
mean = 10 openings
```

This is **not** a completion-speed exploit. It is a slow deterministic fallback: normal standards-first completion averages roughly 140 openings for all 48 standards, while the bank route needs ten openings to force a single prepared missing Legendary.

The global Signal design can therefore remain intact.

---

## 6. Max-Overcharge endgame stress

A second stress run started from a completed collection with:

```text
Signal 4/4
Overcharge MAX
60 CHIPS
all standards + Secrets owned
```

Policy: open Charged whenever wallet is `>= 60`, otherwise Basic. Each run used 5,000 openings; 80 seeds were sampled per cap.

| Cap | Mean Charged share | Charged share p50 | Final wallet p50 | Average wallet mean | Overcharge CHIPS / opening |
|---|---:|---:|---:|---:|---:|
| **x1.50 current** | **83.9%** | 84.0% | 123 | 206.3 | 16.246 |
| x1.30 counterfactual | 63.3% | 63.3% | 66.5 | 92.8 | 8.393 |

This is the one material scale effect found by the audit: when Signal has no standard target, current `x1.50` makes Charged much more sustainable.

### Why this does not justify lowering the cap now

The behavior happens exactly in the state Overcharge was designed for: an armed lock with no eligible standard target. During real six-Drop progression this state becomes especially common after 48/48 standards, when the remaining task is Secret discovery.

Lowering the cap to `x1.30` would:

- materially reduce Charged availability during the Secret tail;
- weaken the intended secondary value of retained Signal;
- lengthen the already-dominant late collection phase;
- solve no demonstrated completion exploit, because deliberate cross-Drop lock banking is slower than ordinary progression.

Therefore `x1.50` remains the better current release candidate.

This conclusion should be reopened if a future expensive pouch, repeatable post-completion sink, or larger content roster makes endgame CHIPS accumulation economically meaningful.

---

## 7. Release decision

**No production balance patch.**

The content-scale audit clears the current six-Drop economy for the next validation stage.

Re-run this audit if any of the following changes materially:

- Charged cost or return profile;
- Hidden Pocket odds / Secret payout;
- Signal threshold or scope;
- Overcharge gain/cap;
- number of standards/Secrets per Drop;
- new pouch tier / expensive CHIPS sink;
- external rewarded-CHIPS grants become large enough to dominate organic income.

Hosted analytics should specifically watch:

- openings to first Charged;
- Basic vs Charged share by progression stage;
- 8/8 and 10/10 Drop completion;
- abandonment after standards complete but Secrets remain;
- wallet distribution after 48/48 standards.

Those are the evidence points that could justify a later balance change. Until then, changing the current numbers would be tuning against a hypothetical problem rather than an observed one.
