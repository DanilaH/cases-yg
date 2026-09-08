# Secret reward + reward-tray correction

Status: **COMPLETE / MERGED / FINAL MERGED-MAIN REPEATED-USE ACCEPTED — Yandex DRAFT next**.

This document records the direct-hands-on decisions made after the accepted Phase 2.6 regression and PR #53 reward-tray compaction. It is the canonical contract for this correction pass and supersedes the older Secret assumptions in `FINAL_HANDS_ON_OVERCHARGE_PLAN.md` / `DECISIONS.md` where they conflict.

The pass is deliberately bounded. It fixes presentation/readability, debug scenario validity, and completes the existing Hidden Pocket/Secret reward contract. It does not add new pouch types, currencies, shops, crafting, auto-open, families, Drops, or other meta systems.

Implementation/evidence now merged:

- PR #55: reward-tray readability/right-preferred placement + self-contained debug seeds;
- PR #56: Save V4, persisted `+40 CHIPS` Secret jackpot, missing-first then duplicate Secret policy, exact V3 staged-reveal compatibility;
- PR #57: ruby/gold Secret identity, stronger arrival, persistent premium ambience, page-aware reward tray, duplicate presentation and separate Secret banking;
- exact Secret presentation product head `629d5beb666aa9365ce7197082938ea1a50d9d15`: **34/34 PASS**, zero runtime/request/HTTP diagnostics, with manual screenshot/video review;
- current merged runtime after PR #57: `341c4a265a39c1d8f9d7e1cd1030b7d4e8c62cba`; post-merge CI passed.

The required fresh merged-main repeated-use regression is complete: audit run `34205515234` on exact runtime `341c4a265a39c1d8f9d7e1cd1030b7d4e8c62cba` passed **82/82** assertions. It covered 24 real Basic/Charged openings with Collection round-trips plus a forced new-Secret lifecycle held for ~4 seconds, collect → Collection → return → another real opening teardown check. Runtime/page/request/HTTP diagnostics were empty, wallet endpoints matched persisted transaction truth, and screenshots/video were manually reviewed. Hosted Yandex DRAFT is now unblocked.

---

## 1. Reward tray hierarchy and placement

The accepted information hierarchy remains:

1. one primary reward/result;
2. one compact breakdown line where needed;
3. one compact mechanic/status line where needed.

For a normal standard result, target presentation is equivalent to:

```text
REWARD                                      COMMON

+15 CHIPS
CHIPS +8 · RECYCLED +2 · OVERCHARGE +5

LOCK RETAINED · x1.50 MAX
```

Requirements:

- remove player-facing `RAW` as a separate line;
- do not restore multiple peer rows for base/recycle/Overcharge/total;
- increase tray width and secondary typography enough that the breakdown and status lines are readable and remain single-line in the reviewed desktop layouts;
- target tray width is approximately `244` logical px, adjustable by a few px from browser evidence;
- secondary text must no longer use the current micro-size treatment merely to force fit;
- rarity remains in the tray header rather than as a reward row;
- placement is **right-preferred** on normal desktop layouts, because the persistent pouch/gameplay rail owns the left side;
- the tray must never overlap the pouch rail, hero collectible, result action panel, or safe-area edge;
- if the right-side slot genuinely cannot fit at a compact supported width, use an alternate safe placement rather than collapsing typography back to unreadable sizes.

The debug panel is not production layout and must not influence production-side placement decisions, but browser audits must still be able to hide it when validating production geometry.

---

## 2. Reward tray follows the active result page

A Hidden Pocket opening produces two distinct rewards: the standard item and the Secret item. Do **not** show two reward trays simultaneously.

Use one tray whose content follows the selected carousel page.

### Standard page

Show the normal standard reward breakdown and Signal/Overcharge state.

Example:

```text
+15 CHIPS
CHIPS +8 · RECYCLED +2 · OVERCHARGE +5
LOCK RETAINED · x1.50 MAX
```

### Secret page — new Secret

Show the Secret reward only:

```text
SECRET DISCOVERED
+40 CHIPS · ADDED TO COLLECTION
```

Equivalent compact composition is allowed if hierarchy remains obvious.

### Secret page — duplicate Secret

Show:

```text
SECRET DUPLICATE
+40 CHIPS
```

The Secret page must not repeat the standard item's CHIPS breakdown. Swiping between result pages updates the single tray immediately and deterministically.

---

## 3. Secret CHIPS reward

Hidden Pocket now grants a fixed **+40 CHIPS Secret bonus** in addition to the normal pouch reward.

Rules:

- new Secret: `+40 CHIPS` + collection discovery;
- duplicate Secret: `+40 CHIPS`;
- the bonus is a separate jackpot component, not standard duplicate recycle;
- the bonus is **not multiplied by Overcharge**;
- Overcharge continues to multiply only the existing standard-opening `base + cache + recycle` amount;
- pouch cost is unchanged;
- the Secret bonus is part of the same durable opening transaction and must be persisted before presentation;
- reload/recovery must not reroll, duplicate, omit, or double-pay it;
- wallet/banking presentation must converge exactly to the committed transaction total.

Current tuning rationale: +40 is large enough to read as a jackpot against Basic `6–10` and Charged `18–24`, while its low Hidden Pocket probabilities keep expected-value impact bounded. This is still pre-release tuning and may only be reopened from evidence.

---

## 4. Secret duplicate policy

Hidden Pocket must remain alive after the Secret collection is complete.

Selection rule:

1. while at least one Secret in the active Drop is undiscovered, a successful Hidden Pocket selects only from undiscovered Secrets;
2. therefore Hidden Pocket guarantees a new Secret until the active Drop's Secret set is complete;
3. after every Secret in the active Drop is discovered, successful Hidden Pocket rolls continue and select a Secret duplicate from the active Drop;
4. a duplicate Secret grants the same fixed `+40 CHIPS` Secret bonus and does not add another collection entry.

This preserves collection progression without deleting the strongest jackpot event once the two current Secrets have been found.

`PendingReveal.hiddenPocket` must carry enough persisted information to distinguish new vs duplicate and reproduce the exact Secret reward on recovery. Save migration/compatibility must preserve already-staged pre-change reveals rather than retroactively adding a bonus to an old transaction.

---

## 5. Secret visual identity

Secret must not reuse the current Signal-like cyan as its primary rarity identity.

Direction:

- primary Secret rarity/accent: **ruby/coral red**, approximately `#FF4D6D`;
- premium highlight/glints: warm gold, approximately `#FFD36A`;
- supporting aura may blend ruby into violet to match the authored Secret art;
- cyan remains available to Signal/electric-system UI and should not dominate Secret rarity treatment;
- avoid pure warning/error red treatment: the combination must read as jackpot/premium, not failure.

Apply this identity consistently to the Secret rarity capsule, Secret reward state, reveal rings/highlights, and persistent premium ambience.

---

## 6. Secret reveal lifecycle

Hidden Pocket is the strongest surprise beat and has two phases: a strong arrival and a persistent premium state.

### 6.1 Arrival peak

Required sequence/direction:

1. `HIDDEN POCKET!` discovery beat;
2. background/backdrop darkens enough to create focus;
3. strong but brief ruby/violet flash;
4. two expanding reveal rings;
5. dense but bounded sparkles/particles with some warm-gold glints;
6. Secret object enters with a stronger scale overshoot;
7. short camera punch/shake plus bounded object shake;
8. settle into the premium result state.

The arrival must be clearly more dramatic than Legendary while staying short and skippable/fast-forward safe.

### 6.2 Persistent premium state until reward acceptance

The premium treatment must **not disappear after the arrival tween**.

From settle until `Tap to collect` / reward acceptance, keep:

- a soft living ruby/violet halo behind the Secret;
- a slowly moving diffuse aura/cloud;
- sparse continuously drifting particles;
- occasional warm-gold glints/sparkles;
- subtle Secret-object breathing;
- a restrained persistent backdrop/vignette that keeps the result feeling special.

No permanent camera shake, rapid flashing, or fireworks loop.

If the player swipes to the standard page, the premium state may reduce in intensity so the standard reward remains readable, but a subdued Hidden Pocket ambience must remain until the opening is accepted. Returning to the Secret page restores the full persistent premium treatment. All persistent Secret effects end only when the reward is accepted or the scene is legitimately torn down.

Recovery directly into a staged Hidden Pocket result must reconstruct the persistent premium state without replaying or paying the reward twice.

---

## 7. Debug scenario validity

`Force Hidden Pocket` and every other reveal debug scenario must be self-contained and valid regardless of the player's current Signal/Overcharge state.

Observed bug: debug scenarios that force `signal: 0` while inheriting an active `overchargeHundredths > 100` create an impossible save and fail with `Invalid save payload`.

Correction:

- any debug scenario that resets Signal below lock threshold must also reset Overcharge to `x1.00`;
- scenarios that require an armed lock must explicitly seed a compatible Signal + Overcharge pair;
- no debug scenario should depend on incidental pre-existing player state unless that dependency is the purpose of the scenario;
- add direct tests for debug scenario validity from an active `4/4 + x1.50` starting save;
- hosted DRAFT debug controls must therefore remain usable after arbitrary normal play.

This is a debug-tooling defect, not permission to loosen production save invariants.

---

## 8. Transaction / compatibility contract

The Secret economy change must follow the project's existing durability rules.

Requirements:

- determine standard result, Secret result/new-vs-duplicate, standard CHIPS, Secret +40 bonus, Signal and Overcharge transition before presentation;
- persist the complete outcome in `pendingReveal`;
- commit exactly once;
- recovery displays the same standard + Secret pages and the same CHIPS result;
- an old staged reveal created before this correction must retain its old economic outcome after migration; do not grant +40 retroactively merely because it contains a Hidden Pocket;
- visual tweens, carousel selection, aura lifecycle and reward-tray page switching never own economy state.

If the cleanest compatible implementation requires a save-version bump, use an explicit migration rather than weakening validation.

---

## 9. Validation gate

Before this correction can be considered complete:

Technical:

- strict typecheck;
- full unit suite;
- assets self-test + validation;
- production build;
- deterministic tests for new Secret, duplicate Secret, +40 payout, no Overcharge multiplication, and exact recovery/commit;
- migration/compatibility test for a pre-change staged Hidden Pocket reveal;
- debug scenarios validated from active `4/4 + x1.50` state.

Browser/manual artifact review:

- EN/RU at compact and wide desktop widths;
- wider readable normal reward tray with no wrapping/overlap;
- right-preferred placement with left gameplay rail populated;
- normal standard result;
- new Secret result;
- duplicate Secret result after Secret collection completion;
- reward tray switches correctly between standard and Secret carousel pages;
- Secret ruby/gold rarity identity;
- arrival peak visibly stronger than Legendary;
- persistent Secret aura/particles/glints remain after settle until collect;
- swipe standard ↔ Secret preserves the correct reduced/full premium states;
- fast-forward does not leave orphaned effects;
- reload/recovery while Hidden Pocket is pending reconstructs correct premium/result state;
- zero runtime errors, failed requests or invalid save payloads.

The exact correction browser/video evidence and the fresh merged-main repeated-use regression have both been reviewed and accepted. Rebuild the exact Yandex DRAFT candidate and continue hosted validation. Do not add unrelated polish before hosted evidence.
