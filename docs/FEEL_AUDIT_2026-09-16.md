# Signal 2000 — feel audit 2026-09-16

Status: **bounded correction implemented; automated gates required; final subjective hands-on remains human-owned**.

## Audit frame

This pass audits the current product rather than reopening the Sep-9 feel work. The mature tear/reveal/reward/audio choreography already has strong structural repeated-use evidence, so source inspection alone is not a reason to retune it. The audit targets seams introduced by later work: multi-Drop navigation, Basic/Charged selection, Collection browsing, onboarding and responsive chrome.

## Strong areas intentionally preserved

- tear drag has immediate grab response plus continuous progress/velocity texture;
- pouch/result pointer depth and idle life keep the hero responsive;
- reveal hierarchy, anticipation and persistent rarity states are differentiated;
- environment continuity survives reveal/result/idle;
- NEW, duplicate, rarity, Signal and banking meanings stay independent;
- reward acceptance banks value to real HUD destinations;
- rarity ambience owns/ducks the base mix with deterministic cleanup;
- onboarding uses a physical pouch arrival and the real tear control instead of a modal tutorial.

Audio timbre and long-hold comfort remain human ear-check items and are not retuned here.

## High-ROI seams and corrections

### Basic ↔ Charged swap continuity
The outgoing pouch acknowledged selection, but the replacement appeared at its final state after `renderIdle()`. The new pouch now receives a short local fade/scale/vertical settle. The rest of the HUD is not replayed.

### Opening Drop preview
The latest-intent/non-blocking architecture is preserved. The incoming pouch preview now has a slightly clearer directional offset and tiny scale settle, with no extra wait.

### Collection state changes
Shelf ↔ Catalog and Drop browsing previously hard-cut the content. The changing content now lives in a local entry container: view changes get a short neutral settle, Drop browse gets a short directional entry. The background and top chrome remain stable.

### Collection Return / Mute
Return and Mute now share the surrounding hover/press/release vocabulary. Return activates on completed pointer-up with a 60 ms visual handoff. Mute updates its label in place instead of rebuilding the Collection scene.

## Independent review / explicit non-changes

- no reward/economy/RNG/save changes;
- no tear geometry or threshold changes;
- no reveal-hold retuning without fresh hands-on evidence;
- no new particles, shaders, ambience layers or audio retuning;
- no onboarding rewrite or extra tutorial copy;
- no blocking Drop-switch animation;
- no Collection feature expansion;
- no broad `OpeningScene` refactor.

## Acceptance boundary

Automated green proves correctness/lifecycle compatibility, not subjective feel. The remaining hands-on check is intentionally small: repeat Basic ↔ Charged switching, rapid Opening Drop browsing, Shelf ↔ Catalog, Collection Drop browsing and Return/Mute at desktop and compact landscape sizes. Reject the pass if any transition feels slower or more ornamental than the information change it explains.
