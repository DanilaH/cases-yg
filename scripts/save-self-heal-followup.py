from pathlib import Path

save_path = Path('src/game/systems/save.ts')
text = save_path.read_text()
old = """  const fallback: SaveState = { ...base, pendingReveal };
  if (isPrimaryOnboardingState(value.onboarding)) {
    const candidate: SaveState = { ...fallback, onboarding: value.onboarding };
    try {
      return validateSaveState(candidate);
    } catch {
      // Keep durable progression and fall back to conservative onboarding state.
    }
  }

  return validateSaveState(fallback);
"""
new = """  const fallback: SaveState = { ...base, pendingReveal };
  if (isPrimaryOnboardingState(value.onboarding)) {
    const onboarding = value.onboarding;
    const hasExactOrCompleteOnboardingEvidence =
      onboarding.primaryCompleted || onboarding.firstRevealReceipt !== null || value.totalOpens === 0;
    if (hasExactOrCompleteOnboardingEvidence) {
      const candidate: SaveState = { ...fallback, onboarding };
      try {
        return validateSaveState(candidate);
      } catch {
        // Keep durable progression and fall back to conservative onboarding state.
      }
    }
  }

  return validateSaveState(fallback);
"""
if old not in text:
    raise SystemExit('repair onboarding retention block not found')
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
