import { readFile, writeFile, unlink } from 'node:fs/promises';

const path = 'src/game/ui/openingVisuals.ts';
let source = await readFile(path, 'utf8');

const replacements = [
  [
    "  _lootPoolId: GameLootPoolId = DEFAULT_LOOT_POOL_ID,",
    "  lootPoolId: GameLootPoolId = DEFAULT_LOOT_POOL_ID,",
  ],
  [
    "staticTextureKey(pouchStaticArtId(variant, 'body'))",
    "staticTextureKey(pouchStaticArtId(variant, 'body', lootPoolId))",
  ],
  [
    "staticTextureKey(pouchStaticArtId(variant, 'tear-strip'))",
    "staticTextureKey(pouchStaticArtId(variant, 'tear-strip', lootPoolId))",
  ],
  [
    "staticTextureKey(pouchStaticArtId(variant, 'star-tab'))",
    "staticTextureKey(pouchStaticArtId(variant, 'star-tab', lootPoolId))",
  ],
];

for (const [before, after] of replacements) {
  const count = source.split(before).length - 1;
  if (count !== 1) {
    throw new Error(`Expected exactly one match for ${before}, found ${count}`);
  }
  source = source.replace(before, after);
}

await writeFile(path, source);

// Keep production history clean: the patcher and its workflow remove themselves
// in the same generated commit after the bounded source edit succeeds.
await unlink('tools/patch-authored-drop-pouch-skins.mjs');
await unlink('.github/workflows/patch-authored-drop-pouch-skins.yml');
