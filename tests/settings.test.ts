import { describe, expect, it, vi } from 'vitest';

import {
  DEFAULT_SETTINGS_KEY,
  SettingsRepository,
  loadSettingsSafe,
  persistMutedPreference,
} from '../src/game/systems/settings';
import type { StorageAdapter } from '../src/platform/storage';
import { MemoryStorageAdapter } from './helpers';

class DelayedStorageAdapter implements StorageAdapter {
  private readonly values = new Map<string, string>();

  public async getItem(key: string): Promise<string | null> {
    return this.values.get(key) ?? null;
  }

  public async setItem(key: string, value: string): Promise<void> {
    const parsed = JSON.parse(value) as { muted?: boolean };
    await new Promise((resolve) => setTimeout(resolve, parsed.muted ? 20 : 0));
    this.values.set(key, value);
  }

  public async removeItem(key: string): Promise<void> {
    this.values.delete(key);
  }
}

describe('settings persistence', () => {
  it('defaults to unmuted without coupling to the gameplay save', async () => {
    const storage = new MemoryStorageAdapter();
    await expect(new SettingsRepository(storage).load()).resolves.toEqual({ version: 1, muted: false });
  });

  it('serializes rapid mute writes so the last user choice wins', async () => {
    const storage = new DelayedStorageAdapter();

    await Promise.all([persistMutedPreference(storage, true), persistMutedPreference(storage, false)]);

    await expect(new SettingsRepository(storage).load()).resolves.toEqual({ version: 1, muted: false });
  });

  it('falls back safely when the preference payload is corrupted', async () => {
    const storage = new MemoryStorageAdapter();
    await storage.setItem(DEFAULT_SETTINGS_KEY, '{bad-json');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    await expect(loadSettingsSafe(storage)).resolves.toEqual({ version: 1, muted: false });
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});
