from pathlib import Path

source = Path('tools/tmp-apply-hands-on-visual.py').read_text()
old = """        .setOrigin(sourceImage.originX, sourceImage.originY)\n        .setScale(sourceImage.scaleX, sourceImage.scaleY)\n        .setTintFill(color)\n        .setAlpha(0)\n        .setBlendMode(Phaser.BlendModes.ADD);\n      standardVisual.addAt(outline, sourceIndex);\n"""
new = """        .setOrigin(sourceImage.originX, sourceImage.originY)\n        .setScale(sourceImage.scaleX, sourceImage.scaleY);\n      outline.setTint(color);\n      outline.setAlpha(0);\n      outline.setBlendMode(Phaser.BlendModes.ADD);\n      standardVisual.addAt(outline, sourceIndex);\n"""
if old not in source:
    raise SystemExit('silhouette tint anchor missing')
source = source.replace(old, new, 1)
exec(compile(source, 'tmp-apply-hands-on-visual-r2-generated.py', 'exec'))
