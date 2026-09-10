from pathlib import Path

presentation = Path('src/game/data/presentation.ts')
text = presentation.read_text()
old = """export interface PouchVariantPresentation {
  bodyOffsetX: number;
  bodyOffsetY: number;
  stripOffsetX: number;
  stripOffsetY: number;
  tabOffsetX: number;
  tabOffsetY: number;
}
"""
new = """export interface PouchVariantPresentation {
  bodyOffsetX: number;
  bodyOffsetY: number;
  bodyWidthOffset: number;
  stripOffsetX: number;
  stripOffsetY: number;
  stripWidthOffset: number;
  tabOffsetX: number;
  tabOffsetY: number;
  tabWidthOffset: number;
}
"""
if text.count(old) != 1:
    raise SystemExit(f'interface anchor count={text.count(old)}')
text = text.replace(old, new, 1)
old = """  basic: {
    bodyOffsetX: 0,
    bodyOffsetY: 0,
    stripOffsetX: -4,
    stripOffsetY: 0,
    tabOffsetX: 0,
    tabOffsetY: 0,
  },
  charged: {
    bodyOffsetX: -7,
    bodyOffsetY: -2,
    stripOffsetX: -7,
    stripOffsetY: 0,
    tabOffsetX: 0,
    tabOffsetY: 0,
  },
"""
new = """  basic: {
    bodyOffsetX: 0,
    bodyOffsetY: 0,
    bodyWidthOffset: 0,
    stripOffsetX: -4,
    stripOffsetY: 0,
    stripWidthOffset: 2,
    tabOffsetX: 0,
    tabOffsetY: 0,
    tabWidthOffset: 0,
  },
  charged: {
    bodyOffsetX: -7,
    bodyOffsetY: -2,
    bodyWidthOffset: 0,
    stripOffsetX: -7,
    stripOffsetY: 0,
    stripWidthOffset: 4,
    tabOffsetX: 0,
    tabOffsetY: 0,
    tabWidthOffset: 0,
  },
"""
if text.count(old) != 1:
    raise SystemExit(f'variant table anchor count={text.count(old)}')
text = text.replace(old, new, 1)
presentation.write_text(text)

visuals = Path('src/game/ui/openingVisuals.ts')
text = visuals.read_text()
old = """  const bodyPresentation = {
    ...POUCH_PRESENTATION.body,
    x: POUCH_PRESENTATION.body.x + variantPresentation.bodyOffsetX,
    y: POUCH_PRESENTATION.body.y + variantPresentation.bodyOffsetY,
  };
  const stripPresentation = {
    ...POUCH_PRESENTATION.strip,
    x: POUCH_PRESENTATION.strip.x + variantPresentation.stripOffsetX,
    y: POUCH_PRESENTATION.strip.y + variantPresentation.stripOffsetY,
  };
  const tabPresentation = {
    ...POUCH_PRESENTATION.tab,
    x: POUCH_PRESENTATION.tab.x + variantPresentation.tabOffsetX,
    y: POUCH_PRESENTATION.tab.y + variantPresentation.tabOffsetY,
  };
"""
new = """  const bodyPresentation = {
    ...POUCH_PRESENTATION.body,
    x: POUCH_PRESENTATION.body.x + variantPresentation.bodyOffsetX,
    y: POUCH_PRESENTATION.body.y + variantPresentation.bodyOffsetY,
    displayWidth: POUCH_PRESENTATION.body.displayWidth + variantPresentation.bodyWidthOffset,
  };
  const stripPresentation = {
    ...POUCH_PRESENTATION.strip,
    x: POUCH_PRESENTATION.strip.x + variantPresentation.stripOffsetX,
    y: POUCH_PRESENTATION.strip.y + variantPresentation.stripOffsetY,
    displayWidth: POUCH_PRESENTATION.strip.displayWidth + variantPresentation.stripWidthOffset,
  };
  const tabPresentation = {
    ...POUCH_PRESENTATION.tab,
    x: POUCH_PRESENTATION.tab.x + variantPresentation.tabOffsetX,
    y: POUCH_PRESENTATION.tab.y + variantPresentation.tabOffsetY,
    displayWidth: POUCH_PRESENTATION.tab.displayWidth + variantPresentation.tabWidthOffset,
  };
"""
if text.count(old) != 1:
    raise SystemExit(f'presentation block count={text.count(old)}')
text = text.replace(old, new, 1)
visuals.write_text(text)
