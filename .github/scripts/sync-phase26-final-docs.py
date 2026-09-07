from pathlib import Path
import re


def read(path):
    return Path(path).read_text(encoding='utf-8')


def write(path, text):
    Path(path).write_text(text, encoding='utf-8')


def replace(text, old, new, label):
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected 1 occurrence, found {count}')
    return text.replace(old, new)


def regex_replace(text, pattern, repl, label):
    out, count = re.subn(pattern, repl, text, flags=re.S)
    if count != 1:
        raise SystemExit(f'{label}: expected 1 regex match, found {count}')
    return out

# README
p = 'README.md'; t = read(p)
t = replace(t,
    '**Gameplay Loop Lite V2 and the previous feel-correction passes are implemented/audited. Final direct hands-on completed with a bounded new finding set. The current product gate is Phase 2.6: fix those issues and implement the approved deterministic Signal Overcharge extension, then exact/direct regression; real Yandex DRAFT follows only if accepted.**',
    '**Gameplay Loop Lite V2, the feel-correction passes, and Phase 2.6 Signal Overcharge are implemented and exact-audited. The remaining internal gate is one final direct hands-on regression; real Yandex DRAFT follows only if that subjective pass is accepted.**',
    'README current phase')
t = replace(t, '- 108-test current suite + typecheck/assets/build;', '- 114-test current suite + typecheck/assets/build;', 'README tests')
t = replace(t,
    '1. implement final-hands-on fixes + Signal Overcharge;\n2. simulate Overcharge gain/cap, then exact-audit + directly regress;\n3. if accepted, real hosted Yandex DRAFT;\n4. decide deferred Drop/odds/progress work from evidence;\n5. content expansion only after hosted validation.',
    '1. run the final direct repeated-use hands-on regression on the exact Phase 2.6 candidate;\n2. if accepted, run real hosted Yandex DRAFT validation;\n3. fix only hosted-platform defects that the draft actually exposes;\n4. decide deferred Drop/odds/progress work from evidence;\n5. content expansion only after hosted validation.',
    'README order')
write(p, t)

# Final Phase 2.6 contract
p = 'docs/FINAL_HANDS_ON_OVERCHARGE_PLAN.md'; t = read(p)
t = replace(t, 'Status: **APPROVED NEXT / NOT CURRENT RUNTIME**.', 'Status: **IMPLEMENTED / EXACT-AUDITED / FINAL DIRECT HANDS-ON PENDING**.', 'plan status')
t = replace(t,
    'This document captures the evidence-backed findings from the latest direct hands-on plus the approved Signal Overcharge extension. It supersedes older statements that Overcharge is globally parked. Existing Lite V2 balance remains the runtime baseline until this pass is implemented and independently revalidated.',
    'This document is the canonical contract for the implemented Phase 2.6 correction and Signal Overcharge extension. The legacy Lite V2 pouch/cache/rarity/recycle values remain unchanged; the new Overcharge state/economy/presentation has passed exact technical/browser validation and now awaits final direct repeated-use hands-on before hosted Yandex DRAFT.',
    'plan intro')
t = regex_replace(t,
    r'Initial simulation candidates, \*\*not release-locked values\*\*:\n\n```text\nBasic   \+0\.10\nCharged \+0\.50\n```\n\nFuture pouch types may use different gains\. The gain is a balance lever and must be simulated before implementation is considered tuned\.',
    'Current Phase 2.6 validation tuning:\n\n```text\nBasic   +0.10\nCharged +0.50\n```\n\nThese values are implemented in typed pouch profiles and passed the current EV sanity/transaction/browser gates. They are locked for this validation candidate, not claimed as immutable public-release balance. Future pouch types may use different gains.',
    'plan gain tuning')
t = regex_replace(t,
    r'## 5\.5 Cap\n\nOvercharge must have a finite cap\. The exact cap is \*\*OPEN FOR TUNING\*\*\.',
    '## 5.5 Cap\n\nOvercharge has a finite current validation cap of **x1.50** (`150` hundredths). This is implemented and locked for the Phase 2.6 candidate; content-scale release balancing may reopen it only from evidence.',
    'plan cap')
t = replace(t,
    'Candidate caps to compare in simulation include `x1.30`, `x1.50` and, only if economy permits, a higher ceiling.',
    'The validation pass compared lower-cap alternatives conceptually/through EV sanity work and selected `x1.50` for the current candidate. Do not raise it further without new economy evidence.',
    'plan cap candidates')
t = replace(t,
    '# 7. Economy simulation before tuning lock\n\nThe mechanic contract above is approved; tuning is not.',
    '# 7. Economy tuning status\n\nThe mechanic contract and current Phase 2.6 validation tuning are implemented. Legacy Lite V2 balance remains unchanged; only Overcharge uses the selected Basic `+0.10`, Charged `+0.50`, cap `x1.50` parameters. Public-release/content-scale rebalancing remains a later evidence gate.',
    'plan section7')
write(p, t)

# Roadmap
p = 'docs/IMPLEMENTATION_ROADMAP.md'; t = read(p)
t = replace(t,
    '6. **Final-hands-on correction + Signal Overcharge — CURRENT APPROVED PASS**\n7. **Exact audit + direct regression of that pass — REQUIRED**\n8. **Real Yandex DRAFT validation — NEXT EXTERNAL GATE**',
    '6. **Final-hands-on correction + Signal Overcharge — IMPLEMENTED / EXACT-AUDITED**\n7. **Final direct repeated-use regression — REQUIRED INTERNAL GATE**\n8. **Real Yandex DRAFT validation — NEXT EXTERNAL GATE IF DIRECT REGRESSION PASSES**',
    'roadmap order')
t = replace(t, '# Phase 2.6 — final-hands-on correction + Signal Overcharge — CURRENT APPROVED PASS', '# Phase 2.6 — final-hands-on correction + Signal Overcharge — IMPLEMENTED / EXACT-AUDITED', 'roadmap phase heading')
t = replace(t,
    'Initial tuning candidates include Basic `+0.10` and Charged `+0.50`, but those numbers and the multiplier cap are explicitly **OPEN FOR TUNING** until simulation.',
    'Current validation tuning is implemented as Basic `+0.10`, Charged `+0.50`, with cap `x1.50`. The legacy pouch economy is unchanged; these new parameters may be reopened later only from hosted/content-scale evidence.',
    'roadmap tuning')
t = replace(t,
    '> **Current next action: implement `FINAL_HANDS_ON_OVERCHARGE_PLAN.md`, simulate Overcharge tuning, exact-audit/directly regress the result, then go to Yandex DRAFT only if accepted.**',
    '> **Current next action: run one final direct repeated-use regression on the exact Phase 2.6 candidate; if accepted, move immediately to real Yandex DRAFT validation.**',
    'roadmap next action')
write(p, t)

# Product
p = 'docs/PRODUCT.md'; t = read(p)
t = replace(t, '### Stage B3 — final-hands-on correction + Signal Overcharge — CURRENT APPROVED PASS', '### Stage B3 — final-hands-on correction + Signal Overcharge — IMPLEMENTED / EXACT-AUDITED', 'product stage heading')
t = replace(t,
    'Canonical contract: `FINAL_HANDS_ON_OVERCHARGE_PLAN.md`. Fix rarity/reward/Charged-denial issues, make Signal/Secret self-explanatory, add the deterministic recoverable Overcharge extension, simulate gain/cap tuning, then exact-audit and directly regress it. The future expensive pouch remains a hypothesis only.',
    'Canonical contract: `FINAL_HANDS_ON_OVERCHARGE_PLAN.md`. The rarity/reward/Charged-denial fixes, Signal/Secret clarity work and deterministic recoverable Overcharge extension are implemented and exact-audited. Current validation tuning is Basic `+0.10`, Charged `+0.50`, cap `x1.50`. One final direct repeated-use regression remains before Yandex DRAFT. The future expensive pouch remains a hypothesis only.',
    'product stage body')
t = replace(t,
    'CHIPS = spendable progress toward Charged. Current runtime Signal = non-spendable duplicate protection. Approved next: while an already-armed lock cannot be consumed, Signal also carries a capped Overcharge multiplier over earned `base + cache + recycle` CHIPS; cash-out occurs before a consuming lock visually discharges/reset.',
    'CHIPS = spendable progress toward Charged. Signal remains non-spendable duplicate protection and, while an already-armed lock cannot be consumed, also carries the capped Overcharge multiplier over earned `base + cache + recycle` CHIPS. Current Phase 2.6 tuning: Basic retained-lock gain `+0.10`, Charged `+0.50`, cap `x1.50`; consuming lock cashes out the current multiplier before the staged discharge/reset.',
    'product runtime overcharge')
t = replace(t,
    'No legacy balance tuning was mixed into the presentation pass. Keep existing pouch costs/base/cache/rarity/recycle values unchanged in Phase 2.6; only new Overcharge gain/cap values are simulation-driven tuning candidates.',
    'No legacy balance tuning was mixed into Phase 2.6. Existing pouch costs/base/cache/rarity/recycle values remain unchanged. The current candidate locks only the new Overcharge parameters at Basic `+0.10`, Charged `+0.50`, cap `x1.50`; later content-scale evidence may reopen them.',
    'product tuning')
write(p, t)

# Gameplay systems
p = 'docs/GAMEPLAY_SYSTEMS.md'; t = read(p)
t = replace(t, '## 5.1 Approved next extension — Signal Overcharge (NOT CURRENT RUNTIME)', '## 5.1 Signal Overcharge — CURRENT PHASE 2.6 RUNTIME', 'gameplay overcharge heading')
t = replace(t,
    'Canonical next-pass detail: `FINAL_HANDS_ON_OVERCHARGE_PLAN.md`.',
    'Canonical contract: `FINAL_HANDS_ON_OVERCHARGE_PLAN.md`. Current validation tuning is Basic `+0.10`, Charged `+0.50`, cap `x1.50`.',
    'gameplay canonical')
t = replace(t,
    '- exact Basic/Charged gains and cap remain open for simulation/tuning.',
    '- current candidate uses Basic `+0.10`, Charged `+0.50`, cap `x1.50`; reopen only from later hosted/content-scale evidence.',
    'gameplay exact tuning')
t = replace(t,
    'Approved Phase 2.6 extends this transaction with Overcharge multiplier-before, bonus CHIPS, actual applied gain/reset and multiplier-after. Those fields must be recoverable/idempotent before presentation work is considered valid.',
    'Phase 2.6 extends this transaction with Overcharge multiplier-before, bonus CHIPS, actual applied gain/reset and multiplier-after. These fields are implemented, migration-covered and recoverable/idempotent before presentation is replayed.',
    'gameplay transaction')
t = replace(t,
    'Current Secret value is collection discovery, not recycle income. The next bounded pass must explicitly communicate that reward meaning and strengthen the reveal with a bounded aura/cloud + particle/burst/shake treatment.',
    'Current Secret value is collection discovery, not recycle income. Phase 2.6 now communicates that reward meaning explicitly and strengthens the reveal with the bounded aura/cloud + particle/burst/shake treatment.',
    'gameplay secret')
t = replace(t,
    '> **bounded final-hands-on correction + approved Signal Overcharge extension, followed by exact audit and direct regression**.',
    '> **Phase 2.6 implementation + exact audit are complete; one final direct repeated-use regression remains before real Yandex DRAFT**.',
    'gameplay acceptance')
write(p, t)

# Infrastructure
p = 'docs/INFRASTRUCTURE_STATUS.md'; t = read(p)
t = replace(t, '- V2 save + migration;', '- V3 save + migration with Overcharge state;', 'infra save')
t = replace(t, '- 108-test current suite;', '- 114-test current suite;', 'infra tests')
t = replace(t,
    'The approved Phase 2.6 Overcharge extension must obey the same rule: multiplier/bonus/gain/reset are persisted in the reveal transaction first; later count-up, gain flight and discharge are cosmetic staging only.',
    'The implemented Phase 2.6 Overcharge extension obeys the same rule: multiplier/bonus/gain/reset are persisted in the reveal transaction first; later count-up, gain flight and discharge are cosmetic staging only.',
    'infra overcharge')
t = replace(t,
    '1. implement the bounded final-hands-on fixes + Signal Overcharge;\n2. run exact browser/video audit + direct repeated-use regression;\n3. if accepted, real Yandex DRAFT;\n4. fix only hosted-platform defects;\n5. content expansion.',
    '1. Phase 2.6 implementation + exact browser/video validation — complete;\n2. run one final direct repeated-use regression;\n3. if accepted, real Yandex DRAFT;\n4. fix only hosted-platform defects;\n5. content expansion.',
    'infra path')
t = replace(t,
    '> **Phase 2.6 implementation → exact/direct regression → real Yandex DRAFT → content expansion.**',
    '> **Final direct Phase 2.6 regression → real Yandex DRAFT → content expansion.**',
    'infra critical path')
write(p, t)

# Open questions
p = 'docs/OPEN_QUESTIONS.md'; t = read(p)
t = replace(t,
    'Current approved correction/extension scope: `FINAL_HANDS_ON_OVERCHARGE_PLAN.md`. `OPENING_FEEL_CORRECTION_SCOPE.md` remains the historical contract for the already-merged feel correction.',
    'Phase 2.6 correction/Overcharge is implemented and exact-audited under `FINAL_HANDS_ON_OVERCHARGE_PLAN.md`; only final direct repeated-use acceptance remains before Yandex DRAFT. `OPENING_FEEL_CORRECTION_SCOPE.md` remains the historical feel-correction contract.',
    'questions intro')
t = regex_replace(t,
    r'## 2\.1 Signal Overcharge tuning — APPROVED MECHANIC, NUMBERS OPEN\n.*?\n---\n\n# 3\.',
    '''## 2.1 Signal Overcharge tuning — RESOLVED FOR CURRENT VALIDATION BUILD\n\nCurrent Phase 2.6 candidate uses:\n\n```text\nBasic retained-lock gain:   +0.10\nCharged retained-lock gain: +0.50\nOvercharge cap:             x1.50\n```\n\nThe mechanic and these values are implemented, transaction-tested and exact-browser-audited. Legacy Lite V2 pouch/cache/rarity/recycle values were not changed. Re-open Overcharge tuning only if final direct hands-on, hosted DRAFT, or later content-scale economy evidence shows a concrete problem.\n\n---\n\n# 3.''',
    'questions tuning section')
write(p, t)

# Decisions
p = 'docs/DECISIONS.md'; t = read(p)
t = replace(t,
    '| Current stage | LOCKED | Final direct hands-on produced a bounded new finding set. Current gate is **final hands-on correction + approved Signal Overcharge extension**, followed by exact audit/direct regression; real Yandex DRAFT follows only after that pass is accepted |',
    '| Current stage | LOCKED | Phase 2.6 final-hands-on correction + Signal Overcharge is **implemented and exact-audited**. One final direct repeated-use regression remains; real Yandex DRAFT follows only if that subjective gate is accepted |',
    'decisions stage')
for old, new, label in [
    ('| Signal clarity extension | LOCKED NEXT |', '| Signal clarity extension | CURRENT RUNTIME |', 'signal clarity'),
    ('| Signal Overcharge | LOCKED NEXT |', '| Signal Overcharge | CURRENT RUNTIME |', 'overcharge status'),
    ('| Rarity badge follow-up | LOCKED NEXT |', '| Rarity badge follow-up | CURRENT RUNTIME |', 'rarity followup'),
    ('| Reward tray density | LOCKED NEXT |', '| Reward tray density | CURRENT RUNTIME |', 'reward density'),
    ('| Charged denial re-entry | LOCKED NEXT |', '| Charged denial re-entry | CURRENT RUNTIME |', 'denial status'),
    ('| Available paid-pouch affordance | LOCKED NEXT |', '| Available paid-pouch affordance | CURRENT RUNTIME |', 'affordance status'),
    ('| Secret reward meaning | LOCKED NEXT |', '| Secret reward meaning | CURRENT RUNTIME |', 'secret meaning'),
    ('| Secret celebration | LOCKED NEXT |', '| Secret celebration | CURRENT RUNTIME |', 'secret celebration'),
    ('| Overcharge transaction extension | LOCKED NEXT |', '| Overcharge transaction extension | CURRENT RUNTIME |', 'tx extension'),
]:
    t = replace(t, old, new, 'decisions ' + label)
t = replace(t,
    '| Overcharge tuning | OPEN FOR TUNING | initial simulation candidates include Basic `+0.10`, Charged `+0.50`; exact pouch gains and cap are not release-locked until simulation |',
    '| Overcharge tuning | CURRENT RUNTIME | Phase 2.6 validation candidate uses Basic `+0.10`, Charged `+0.50`, cap `x1.50`; reopen only from final hands-on, hosted, or content-scale evidence |',
    'decisions tuning')
t = replace(t,
    '| Save version | CURRENT RUNTIME | V2 fields include CHIPS, segmented Signal, active loot pool and pending Lite reveal |',
    '| Save version | CURRENT RUNTIME | V3 fields include CHIPS, segmented Signal, Overcharge, active loot pool and pending Lite reveal |',
    'decisions save version')
t = replace(t,
    '| Final hands-on correction + Signal Overcharge | LOCKED NEXT | current product gate; detailed contract in `FINAL_HANDS_ON_OVERCHARGE_PLAN.md` |',
    '| Final hands-on correction + Signal Overcharge | COMPLETE | implemented and exact-audited; current suite is 114 tests plus typecheck/assets/build; final direct repeated-use regression still pending |',
    'decisions phase status')
t = replace(t,
    '| Real Yandex DRAFT | OPEN | next external gate only after the new bounded pass + exact/direct regression are accepted |',
    '| Real Yandex DRAFT | OPEN | next external gate immediately after final direct repeated-use regression accepts the exact Phase 2.6 candidate |',
    'decisions draft')
t = replace(t,
    '> **GO: implement the bounded final-hands-on correction plus the approved Signal Overcharge contract in `FINAL_HANDS_ON_OVERCHARGE_PLAN.md`; simulate its tuning, exact-audit the result and run direct regression. Do not add the future expensive pouch or unrelated meta/content before that evidence.**',
    '> **GO: run the final direct repeated-use regression on the implemented/exact-audited Phase 2.6 candidate. If accepted, proceed to real Yandex DRAFT. Do not add the future expensive pouch or unrelated meta/content before hosted evidence.**',
    'decisions final stage')
write(p, t)

# Probe validation
p = 'docs/PROBE_VALIDATION.md'; t = read(p)
t = replace(t, '- current suite baseline: **108 unit tests** + typecheck + asset self-test/validation + production build;', '- current suite baseline: **114 unit tests** + typecheck + asset self-test/validation + production build;', 'probe tests top')
t = replace(t, '- Phase 2.6 final-hands-on correction + Signal Overcharge: **CURRENT APPROVED PASS**;', '- Phase 2.6 final-hands-on correction + Signal Overcharge: **IMPLEMENTED / EXACT-AUDITED**;', 'probe phase')
t = replace(t, '- real Yandex DRAFT: **BLOCKED until Phase 2.6 exact/direct acceptance**.', '- final direct repeated-use Phase 2.6 regression: **PENDING**;\n- real Yandex DRAFT: **BLOCKED only on that final direct acceptance**.', 'probe draft')
t = replace(t, 'Current suite baseline: **108 unit tests** plus typecheck, asset self-test/validation and production build.', 'Current suite baseline: **114 unit tests** plus typecheck, asset self-test/validation and production build.', 'probe tests body')
write(p, t)

# Technical direction
p = 'docs/TECHNICAL_DIRECTION.md'; t = read(p)
t = replace(t,
    'Gameplay Loop Lite V2 and the bounded **Opening Feel Correction** are implemented in current `main`. Final direct hands-on completed with bounded findings. The immediate gate is Phase 2.6: targeted fixes plus the approved Signal Overcharge transaction extension, followed by exact/direct regression — not broad architecture work.',
    'Gameplay Loop Lite V2, the bounded **Opening Feel Correction**, and Phase 2.6 Signal Overcharge are implemented on the current merge candidate. The Phase 2.6 candidate has passed exact technical/browser validation; the immediate gate is one final direct repeated-use regression, then real Yandex DRAFT if accepted — not broad architecture work.',
    'technical architecture state')
write(p, t)

print('Phase 2.6 canonical docs synchronized')
