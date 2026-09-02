import type { ContentRegistry } from './collectibles';

export const POUCH_TEXTURE_KEY = 'art:pouch:mystery-v1';
export const POUCH_ASSET_PATH = 'assets/pouch/package-mystery-pouch-v1.webp';

const COLLECTIBLE_TEXTURE_PREFIX = 'art:collectible:';

export interface RuntimeCollectibleArt {
  collectibleId: string;
  textureKey: string;
  assetPath: string;
}

/**
 * PR-6 art is added to this set only after an export has been reviewed and
 * committed under public/. Keeping availability explicit prevents 404-heavy
 * preloads while the family art factory is still in progress.
 */
export const AVAILABLE_COLLECTIBLE_ART_IDS = new Set<string>();

export const collectibleTextureKey = (collectibleId: string): string =>
  `${COLLECTIBLE_TEXTURE_PREFIX}${collectibleId}`;

export const getRuntimeCollectibleArt = (registry: ContentRegistry): readonly RuntimeCollectibleArt[] => [
  ...registry.standardItems,
  ...registry.secrets,
]
  .map(({ collectible }) => collectible)
  .filter(({ id }) => AVAILABLE_COLLECTIBLE_ART_IDS.has(id))
  .map((collectible) => ({
    collectibleId: collectible.id,
    textureKey: collectibleTextureKey(collectible.id),
    assetPath: collectible.assetPath,
  }));
