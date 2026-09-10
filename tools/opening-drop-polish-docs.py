from pathlib import Path

path = Path('docs/GAMEPLAY_SYSTEMS.md')
text = path.read_text()
needle = "Canonical detail: `OPENING_FEEL_CORRECTION_SCOPE.md`.\n"
insert = """Canonical detail: `OPENING_FEEL_CORRECTION_SCOPE.md`.

Current Drop-selection presentation is additionally governed by `OPENING_DROP_POLISH_2026-09-10.md`:

- the active Drop selector is a tactile bottom control with explicit `DROP N/6`, Standard and Secret progress;
- Drop paging previews immediately while durable `activeLootPoolId` reconciliation stays serialized and latest-selection-wins;
- Basic/Charged pouch geometry remains shared while the displayed Drop supplies a lightweight visual skin identity;
- the tear instruction is contextual idle help after ~5.5s, not permanent chrome;
- the Drop selector fades only once a full tear succeeds;
- every standard result keeps a persistent outline, while first discovery adds a materially stronger NEW beat.
"""
if text.count(needle) != 1:
    raise SystemExit(f'expected one canonical-detail anchor, found {text.count(needle)}')
path.write_text(text.replace(needle, insert, 1))
