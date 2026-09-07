from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    p = Path(path)
    text = p.read_text(encoding="utf-8")
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{path}: expected one duplicate marker, got {count}: {old!r}")
    p.write_text(text.replace(old, new, 1), encoding="utf-8")


replace_once(
    "docs/IMPLEMENTATION_ROADMAP.md",
    "# Phase 0 — established opener baseline — COMPLETE# Phase 0 — established opener baseline — COMPLETE",
    "# Phase 0 — established opener baseline — COMPLETE",
)
replace_once(
    "docs/IMPLEMENTATION_ROADMAP.md",
    "# Deferred information pass — NOT PART OF 2.1# Deferred information pass — NOT PART OF 2.1",
    "# Deferred information pass — NOT PART OF 2.1",
)
replace_once(
    "docs/PROBE_VALIDATION.md",
    "Canonical correction scope: `OPENING_FEEL_CORRECTION_SCOPE.md`.Canonical correction scope: `OPENING_FEEL_CORRECTION_SCOPE.md`.",
    "Canonical correction scope: `OPENING_FEEL_CORRECTION_SCOPE.md`.",
)
replace_once(
    "docs/ASSET_MANIFEST.md",
    "# 5. Current Lite V2 UI/economy visuals — INTEGRATED# 5. Current Lite V2 UI/economy visuals — INTEGRATED",
    "# 5. Current Lite V2 UI/economy visuals — INTEGRATED",
)
print("duplicate end-markers fixed")
