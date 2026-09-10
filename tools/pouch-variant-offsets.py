from pathlib import Path

presentation = Path('src/game/data/presentation.ts')
text = presentation.read_text()
anchor = "export const getDropPouchSkin = (lootPoolId: GameLootPoolId): DropPouchSkin =>\n  DROP_POUCH_SKINS[lootPoolId];\n\n"
insert = """export const getDropPouchSkin = (lootPoolId: GameLootPoolId): DropPouchSkin =>
  DROP_POUCH_SKINS[lootPoolId];

export interface PouchVariantPresentation {
  bodyOffsetX: number;
  bodyOffsetY: number;
  stripOffsetX: number;
  stripOffsetY: number;
  tabOffsetX: number;
  tabOffsetY: number;
}

// Optical offsets are intentionally variant-specific: Basic and Charged use
// different authored rasters and should be hand-tuned independently.
export const POUCH_VARIANT_PRESENTATION = {
  basic: {
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
} as const satisfies Readonly<Record<'basic' | 'charged', PouchVariantPresentation>>;

"""
if text.count(anchor) != 1:
    raise SystemExit(f'presentation anchor count={text.count(anchor)}')
text = text.replace(anchor, insert, 1)
old = """  // Authored Charged body has its visible mass ~17 source px to the right of
  // Basic. Counter-shift optically aligns the two skins without rotating the pouch.
  chargedBodyOpticalOffsetX: -7,
  chargedBodyOpticalOffsetY: -2,
"""
new = """  // Compatibility aliases for the existing presentation contract. Edit the
  // variant table above when visually tuning the pouch.
  chargedBodyOpticalOffsetX: POUCH_VARIANT_PRESENTATION.charged.bodyOffsetX,
  chargedBodyOpticalOffsetY: POUCH_VARIANT_PRESENTATION.charged.bodyOffsetY,
"""
if text.count(old) != 1:
    raise SystemExit(f'charged alias anchor count={text.count(old)}')
text = text.replace(old, new, 1)
presentation.write_text(text)

visuals = Path('src/game/ui/openingVisuals.ts')
text = visuals.read_text()
old = """  MOTION_PRESENTATION,
  POUCH_PRESENTATION,
  type CollectiblePresentation,
"""
new = """  MOTION_PRESENTATION,
  POUCH_PRESENTATION,
  POUCH_VARIANT_PRESENTATION,
  type CollectiblePresentation,
"""
if text.count(old) != 1:
    raise SystemExit(f'import anchor count={text.count(old)}')
text = text.replace(old, new, 1)
old = """  const bodyTexture = staticTextureKey(pouchStaticArtId(variant, 'body'));
  if (scene.textures.exists(bodyTexture)) {
    bodyLayer.add(body);
    const bodyPresentation = variant === 'charged'
      ? {
          ...POUCH_PRESENTATION.body,
          x: POUCH_PRESENTATION.body.x + POUCH_PRESENTATION.chargedBodyOpticalOffsetX,
          y: POUCH_PRESENTATION.body.y + POUCH_PRESENTATION.chargedBodyOpticalOffsetY,
        }
      : POUCH_PRESENTATION.body;
    addPouchLayer(scene, bodyLayer, bodyTexture, bodyPresentation).setTint(skin.tint);
  } else {
"""
new = """  const variantPresentation = POUCH_VARIANT_PRESENTATION[variant];
  const bodyPresentation = {
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

  const bodyTexture = staticTextureKey(pouchStaticArtId(variant, 'body'));
  if (scene.textures.exists(bodyTexture)) {
    bodyLayer.add(body);
    addPouchLayer(scene, bodyLayer, bodyTexture, bodyPresentation).setTint(skin.tint);
  } else {
"""
if text.count(old) != 1:
    raise SystemExit(f'body block count={text.count(old)}')
text = text.replace(old, new, 1)
old = "const skinLayer = scene.add.container(0, POUCH_PRESENTATION.body.y + 18);"
new = "const skinLayer = scene.add.container(bodyPresentation.x, bodyPresentation.y + 18);"
if text.count(old) != 1:
    raise SystemExit(f'skin layer count={text.count(old)}')
text = text.replace(old, new, 1)
old = "stripImage = addPouchLayer(scene, strip, stripTexture, POUCH_PRESENTATION.strip);"
new = "stripImage = addPouchLayer(scene, strip, stripTexture, stripPresentation);"
if text.count(old) != 1:
    raise SystemExit(f'strip layer count={text.count(old)}')
text = text.replace(old, new, 1)
old = "addPouchLayer(scene, tab, tabTexture, POUCH_PRESENTATION.tab).setTint(skin.tint);"
new = "addPouchLayer(scene, tab, tabTexture, tabPresentation).setTint(skin.tint);"
if text.count(old) != 1:
    raise SystemExit(f'tab layer count={text.count(old)}')
text = text.replace(old, new, 1)
visuals.write_text(text)
