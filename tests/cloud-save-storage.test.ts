import type { Player } from 'ysdk';
import { describe, expect, it } from 'vitest';

import { YandexCloudSaveStorageAdapter } from '../src/platform/storage';
import { MemoryStorageAdapter } from './helpers';

const SAVE_KEY = 'mystery-pocket-tech.save';
const CLOUD_FIELD = 'mysteryPocketTechSave';

class FakePlayerData {
  public readonly data = new Map<string, unknown>();
  public writes = 0;
  public lastFlush: boolean | undefined;

  public async getData(keys?: readonly string[]): Promise<Record<string, unknown>> {
    const selected = keys ?? [...this.data.keys()];
    return Object.fromEntries(selected.flatMap((key) => this.data.has(key) ? [[key, this.data.get(key)]] : []));
  }

  public async setData(data: Record<string, unknown>, flush?: boolean): Promise<void> {
    this.writes += 1;
    this.lastFlush = flush;
    for (const [key, value] of Object.entries(data)) {
      if (value === null) this.data.delete(key);
      else this.data.set(key, value);
    }
  }
}

const createAdapter = (local: MemoryStorageAdapter, player: FakePlayerData): YandexCloudSaveStorageAdapter =>
  new YandexCloudSaveStorageAdapter(
    local,
    player as unknown as Pick<Player, 'getData' | 'setData'>,
    { syncKey: SAVE_KEY, cloudField: CLOUD_FIELD },
  );

const committedSave = (totalOpens: number): string => JSON.stringify({ totalOpens, pendingReveal: null });
const pendingSave = (totalOpens: number): string => JSON.stringify({ totalOpens, pendingReveal: { id: 'pending' } });

describe('Yandex cloud save storage', () => {
  it('migrates an existing local committed save into player data', async () => {
    const local = new MemoryStorageAdapter();
    const player = new FakePlayerData();
    const raw = committedSave(7);
    await local.setItem(SAVE_KEY, raw);

    await expect(createAdapter(local, player).getItem(SAVE_KEY)).resolves.toBe(raw);
    expect(player.data.get(CLOUD_FIELD)).toBe(raw);
    expect(player.lastFlush).toBe(false);
  });

  it('uses a newer cloud save and refreshes the local safeStorage cache', async () => {
    const local = new MemoryStorageAdapter();
    const player = new FakePlayerData();
    const localRaw = committedSave(4);
    const cloudRaw = committedSave(9);
    await local.setItem(SAVE_KEY, localRaw);
    player.data.set(CLOUD_FIELD, cloudRaw);

    await expect(createAdapter(local, player).getItem(SAVE_KEY)).resolves.toBe(cloudRaw);
    await expect(local.getItem(SAVE_KEY)).resolves.toBe(cloudRaw);
  });

  it('repairs a stale cloud copy from a newer local committed save', async () => {
    const local = new MemoryStorageAdapter();
    const player = new FakePlayerData();
    const localRaw = committedSave(12);
    await local.setItem(SAVE_KEY, localRaw);
    player.data.set(CLOUD_FIELD, committedSave(8));

    await expect(createAdapter(local, player).getItem(SAVE_KEY)).resolves.toBe(localRaw);
    expect(player.data.get(CLOUD_FIELD)).toBe(localRaw);
  });

  it('keeps an equal-progress local pending reveal without exposing it to another device', async () => {
    const local = new MemoryStorageAdapter();
    const player = new FakePlayerData();
    const localRaw = pendingSave(5);
    const cloudRaw = committedSave(5);
    await local.setItem(SAVE_KEY, localRaw);
    player.data.set(CLOUD_FIELD, cloudRaw);

    await expect(createAdapter(local, player).getItem(SAVE_KEY)).resolves.toBe(localRaw);
    expect(player.data.get(CLOUD_FIELD)).toBe(cloudRaw);
  });

  it('mirrors only committed gameplay saves and leaves unrelated settings local', async () => {
    const local = new MemoryStorageAdapter();
    const player = new FakePlayerData();
    const adapter = createAdapter(local, player);

    await adapter.setItem(SAVE_KEY, pendingSave(2));
    expect(player.writes).toBe(0);

    const committed = committedSave(3);
    await adapter.setItem(SAVE_KEY, committed);
    expect(player.data.get(CLOUD_FIELD)).toBe(committed);
    expect(player.writes).toBe(1);

    await adapter.setItem('mystery-pocket-tech.settings', JSON.stringify({ muted: true }));
    expect(player.writes).toBe(1);
    await expect(local.getItem('mystery-pocket-tech.settings')).resolves.toBe(JSON.stringify({ muted: true }));
  });
});
