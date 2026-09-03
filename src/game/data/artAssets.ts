import type { ContentRegistry } from './collectibles';

const COLLECTIBLE_TEXTURE_PREFIX = 'art:collectible:';

export interface RuntimeCollectibleArt {
  collectibleId: string;
  textureKey: string;
  assetPath: string;
}

/**
 * Add ids only after the matching export exists under public/ and has been
 * reviewed. This keeps unfinished art from causing preload 404s while allowing
 * scenes to switch from procedural fallback to final art without code changes.
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
