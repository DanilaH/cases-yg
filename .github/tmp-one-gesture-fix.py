from pathlib import Path
p=Path('src/game/scenes/OpeningScene.ts')
s=p.read_text()
old="""    if (!this.resultReady && this.requestPresentationFastForward()) {\n      getGameAudio().play('ui-skip');\n      return;\n    }\n"""
new="""    if (!this.resultReady && this.requestPresentationFastForward()) {\n      this.ignoreNextResultTap = true;\n      getGameAudio().play('ui-skip');\n      return;\n    }\n"""
if old not in s: raise SystemExit('pointerdown target missing')
s=s.replace(old,new,1)
old2="""    if (this.ignoreNextResultTap) {\n      this.ignoreNextResultTap = false;\n      return;\n    }\n"""
new2="""    if (this.ignoreNextResultTap) {\n      this.ignoreNextResultTap = false;\n      this.resultCarouselDrag = null;\n      return;\n    }\n"""
if old2 not in s: raise SystemExit('pointerup target missing')
s=s.replace(old2,new2,1)
p.write_text(s)
