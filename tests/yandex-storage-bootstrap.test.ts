import type { Player, SDK } from 'ysdk';
import { describe, expect, it, vi } from 'vitest';

import { createYandexStorageAdapter } from '../src/platform/yandex';

const fakeStorage = {} as Storage;
const fakePlayer = {
  getData: async (): Promise<Record<string, unknown>> => ({}),
  setData: async (): Promise<void> => undefined,
} as unknown as Player;

describe('Yandex storage bootstrap', () => {
  it('starts mandatory safeStorage and optional Player acquisition without serial waiting', async () => {
    let resolveStorage!: (storage: Storage) => void;
    const calls: string[] = [];
    const storagePromise = new Promise<Storage>((resolve) => {
      resolveStorage = resolve;
    });

    const sdk = {
      getStorage: vi.fn(() => {
        calls.push('storage');
        return storagePromise;
      }),
      getPlayer: vi.fn(async () => {
        calls.push('player');
        return fakePlayer;
      }),
    } as unknown as Pick<SDK, 'getStorage' | 'getPlayer'>;

    const pending = createYandexStorageAdapter(sdk);
    expect(calls).toEqual(['storage', 'player']);

    resolveStorage(fakeStorage);
    await expect(pending).resolves.toBeDefined();
    expect(sdk.getStorage).toHaveBeenCalledTimes(1);
    expect(sdk.getPlayer).toHaveBeenCalledTimes(1);
  });

  it('keeps Player failure optional after safeStorage resolves', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const sdk = {
      getStorage: vi.fn(async () => fakeStorage),
      getPlayer: vi.fn(async () => {
        throw new Error('player unavailable');
      }),
    } as unknown as Pick<SDK, 'getStorage' | 'getPlayer'>;

    await expect(createYandexStorageAdapter(sdk)).resolves.toBeDefined();
    expect(warn).toHaveBeenCalledWith(
      '[cloud-save] Yandex Player unavailable; continuing with safeStorage only',
      expect.any(Error),
    );
    warn.mockRestore();
  });
});
