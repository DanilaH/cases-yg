from pathlib import Path

path = Path('tests/save-recovery.test.ts')
text = path.read_text()
old = """    expect(loaded.discoveredStandard).toEqual(base.discoveredStandard);
    expect(loaded.onboarding).toEqual({ primaryCompleted: true, firstRevealReceipt: null });
    expect(await storage.getItem(recoveryKey)).toBe(raw);
"""
new = """    expect(loaded.discoveredStandard).toEqual(base.discoveredStandard);
    expect(loaded.onboarding).toEqual(base.onboarding);
    expect(await storage.getItem(recoveryKey)).toBe(raw);
"""
if old not in text:
    raise SystemExit('target recovery expectation not found')
path.write_text(text.replace(old, new, 1))
