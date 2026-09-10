from pathlib import Path

path = Path('src/game/scenes/OpeningScene.ts')
text = path.read_text()
old = """    this.phase = 'revealing';
    this.setChromeEnabled(false);
    this.pouch.dragZone.disableInteractive();
    if (this.tearHint) {
"""
new = """    this.phase = 'revealing';
    this.setChromeEnabled(false);
    this.pouch.dragZone.disableInteractive();
    if (recovered) this.hideDropSelectorForReveal();
    if (this.tearHint) {
"""
count = text.count(old)
if count != 1:
    raise SystemExit(f'expected one playReveal opening block, found {count}')
path.write_text(text.replace(old, new, 1))
