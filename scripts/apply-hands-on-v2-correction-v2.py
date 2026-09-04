from pathlib import Path

script_path = Path('scripts/apply-hands-on-v2-correction.py')
source = script_path.read_text()
needle = """    if count != 1:\n        raise SystemExit(f'{path}: expected one match, got {count}: {old[:80]!r}')\n    p.write_text(text.replace(old, new, 1))\n"""
replacement = """    if count == 2 and 'fx.particleDistance' in old and 'fx.particleDuration' in old:\n        p.write_text(text.replace(old, new, 1))\n        return\n    if count != 1:\n        raise SystemExit(f'{path}: expected one match, got {count}: {old[:80]!r}')\n    p.write_text(text.replace(old, new, 1))\n"""
if source.count(needle) != 1:
    raise SystemExit('Could not patch correction helper deterministically')
source = source.replace(needle, replacement, 1)
exec(compile(source, str(script_path), 'exec'), {'__name__': '__main__'})
