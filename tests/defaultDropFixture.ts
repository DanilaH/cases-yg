import {
  DEFAULT_LOOT_POOL_ID,
  GAME_FAMILIES,
  createContentRegistry,
} from '../src/game/data/collectibles';

export const DEFAULT_DROP_FAMILIES = GAME_FAMILIES.filter(
  ({ dropId }) => dropId === DEFAULT_LOOT_POOL_ID,
);

export const DEFAULT_DROP_REGISTRY = createContentRegistry(DEFAULT_DROP_FAMILIES);
