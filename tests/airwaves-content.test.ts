import { describe, expect, it } from 'vitest';

import {
  getRuntimeCollectibleArtForLootPool,
  getRuntimePouchArtForLootPool,
  pouchStaticArtId,
} from '../src/game/data/artAssets';
import { GAME_REGISTRY } from '../src/game/data/collectibles';

describe('Airwaves Drop integration', () => {
  it('registers two families, eight standards and two Secrets', () => {
    const pool = GAME_REGISTRY.lootPoolById.get('airwaves');
    expect(pool?.familyIds).toEqual(['portable-radio', 'walkie-talkie']);

    const standards = GAME_REGISTRY.standardItems.filter(({ lootPoolId }) => lootPoolId === 'airwaves');
    const secrets = GAME_REGISTRY.secrets.filter(({ lootPoolId }) => lootPoolId === 'airwaves');
    expect(standards).toHaveLength(8);
    expect(secrets).toHaveLength(2);
  });

  it('exposes all ten reviewed collectible textures for on-demand loading', () => {
    const art = getRuntimeCollectibleArtForLootPool(GAME_REGISTRY, 'airwaves');
    expect(art).toHaveLength(10);
    expect(art.map(({ collectibleId }) => collectibleId)).toContain('portable-radio-secret-shortwave');
    expect(art.map(({ collectibleId }) => collectibleId)).toContain('walkie-talkie-secret-field-radio');
  });

  it('uses the dedicated Basic and Charged pouch layers', () => {
    expect(pouchStaticArtId('basic', 'body', 'airwaves')).toBe('airwaves-basic-pouch-body');
    expect(pouchStaticArtId('charged', 'body', 'airwaves')).toBe('airwaves-charged-pouch-body');

    const pouchArt = getRuntimePouchArtForLootPool('airwaves');
    expect(pouchArt).toHaveLength(6);
    expect(pouchArt.map(({ id }) => id)).toEqual([
      'airwaves-basic-pouch-body',
      'airwaves-basic-pouch-tear-strip',
      'airwaves-basic-pouch-star-tab',
      'airwaves-charged-pouch-body',
      'airwaves-charged-pouch-tear-strip',
      'airwaves-charged-pouch-star-tab',
    ]);
  });
});
