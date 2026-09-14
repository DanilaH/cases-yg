from pathlib import Path

save_path = Path('src/game/systems/save.ts')
text = save_path.read_text()
old = """  if (onboarding.primaryCompleted && onboarding.firstRevealReceipt !== null) {
    throw new Error('Completed onboarding cannot retain a first reveal receipt');
  }
  if (onboarding.firstRevealReceipt) {
"""
new = """  if (onboarding.primaryCompleted && onboarding.firstRevealReceipt !== null) {
    throw new Error('Completed onboarding cannot retain a first reveal receipt');
  }
  if (!onboarding.primaryCompleted && onboarding.firstRevealReceipt === null && state.totalOpens > 0) {
    throw new Error('Incomplete primary onboarding requires its first reveal receipt');
  }
  if (onboarding.firstRevealReceipt) {
"""
if old not in text:
    raise SystemExit('onboarding validation block not found')
text = text.replace(old, new, 1)
save_path.write_text(text)

test_path = Path('tests/save-recovery.test.ts')
test = test_path.read_text()
old_test = """    expect(loaded.discoveredStandard).toEqual(base.discoveredStandard);
    expect(loaded.onboarding).toEqual(base.onboarding);
    expect(await storage.getItem(recoveryKey)).toBe(raw);
"""
new_test = """    expect(loaded.discoveredStandard).toEqual(base.discoveredStandard);
    expect(loaded.onboarding).toEqual({ primaryCompleted: true, firstRevealReceipt: null });
    expect(await storage.getItem(recoveryKey)).toBe(raw);
"""
if old_test not in test:
    raise SystemExit('recovery onboarding expectation not found')
test_path.write_text(test.replace(old_test, new_test, 1))
