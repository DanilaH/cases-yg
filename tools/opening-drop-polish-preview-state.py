from pathlib import Path

path = Path('src/game/scenes/OpeningScene.ts')
text = path.read_text()
old = """    const root = this.createRoot();
    const metrics = this.metrics!;
    this.renderResourceHud(root, this.saveState);
    if (this.saveState.totalOpens > 0) {
      this.createCollectionButton(root, true);
    }
    this.createMuteButton(root);
    this.renderDropSelector(root);

    const displayedLootPoolId = this.getDisplayedLootPoolId();
"""
new = """    const root = this.createRoot();
    const metrics = this.metrics!;
    const displayedLootPoolId = this.getDisplayedLootPoolId();
    const presentationState = displayedLootPoolId === this.saveState.activeLootPoolId
      ? this.saveState
      : { ...this.saveState, activeLootPoolId: displayedLootPoolId };
    this.renderResourceHud(root, presentationState);
    if (this.saveState.totalOpens > 0) {
      this.createCollectionButton(root, true);
    }
    this.createMuteButton(root);
    this.renderDropSelector(root);

"""
count = text.count(old)
if count != 1:
    raise SystemExit(f'expected one idle HUD block, found {count}')
path.write_text(text.replace(old, new, 1))
