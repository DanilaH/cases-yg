from pathlib import Path

path = Path('src/game/scenes/OpeningScene.ts')
text = path.read_text()

old = """    const platform = getPlatformRuntime();
    platform.activity.setGameplayDesired(true);

    this.input.on('pointerdown', this.handlePointerDown, this);"""
new = """    const platform = getPlatformRuntime();
    // Scene construction/async save + art initialization is still loading, not gameplay.
    // Keep Yandex GameplayAPI stopped until the first playable/recoverable frame is rendered.
    platform.activity.setGameplayDesired(false);

    this.input.on('pointerdown', this.handlePointerDown, this);"""
if text.count(old) != 1:
    raise SystemExit(f'OpeningScene create marker mismatch: {text.count(old)}')
text = text.replace(old, new, 1)

old = """    this.renderIdle(idleMessage);
    platform.markReady();

    if (pending) {"""
new = """    this.renderIdle(idleMessage);
    // Gameplay becomes active only after save recovery + required active art are ready
    // and the first usable Opening frame exists. This keeps GameplayAPI.start aligned
    // with actual gameplay and makes it precede the idempotent Game Ready signal.
    platform.activity.setGameplayDesired(true);
    platform.markReady();

    if (pending) {"""
if text.count(old) != 1:
    raise SystemExit(f'OpeningScene ready marker mismatch: {text.count(old)}')
text = text.replace(old, new, 1)

path.write_text(text)
