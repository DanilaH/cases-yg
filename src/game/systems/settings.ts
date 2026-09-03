import type { StorageAdapter } from '../../platform/storage';

export const SETTINGS_VERSION = 1;
export const DEFAULT_SETTINGS_KEY = 'mystery-pocket-tech.settings';

export interface GameSettings {
  version: typeof SETTINGS_VERSION;
  muted: boolean;
}

export const createDefaultSettings = (): GameSettings => ({
  version: SETTINGS_VERSION,
  muted: false,
});

const parseSettings = (raw: string): GameSettings => {
  const value: unknown = JSON.parse(raw);
  if (
    typeof value !== 'object' ||
    value === null ||
    Array.isArray(value) ||
    !('version' in value) ||
    value.version !== SETTINGS_VERSION ||
    !('muted' in value) ||
    typeof value.muted !== 'boolean'
  ) {
    throw new Error('Invalid settings payload');
  }
  return { version: SETTINGS_VERSION, muted: value.muted };
};

export class SettingsRepository {
  public constructor(
    private readonly storage: StorageAdapter,
    private readonly key = DEFAULT_SETTINGS_KEY,
  ) {}

  public async load(): Promise<GameSettings> {
    const raw = await this.storage.getItem(this.key);
    return raw === null ? createDefaultSettings() : parseSettings(raw);
  }

  public async write(settings: GameSettings): Promise<void> {
    await this.storage.setItem(this.key, JSON.stringify(settings));
  }
}

let settingsWriteQueue: Promise<void> = Promise.resolve();

export const loadSettingsSafe = async (storage: StorageAdapter): Promise<GameSettings> => {
  try {
    return await new SettingsRepository(storage).load();
  } catch (error: unknown) {
    console.warn('[settings] failed to load preferences; using defaults', error);
    return createDefaultSettings();
  }
};

/**
 * Mute is deliberately stored outside the transactional reward save. This
 * avoids a preference write racing `pendingReveal` staging/commit and rolling
 * gameplay progress backward. Writes are serialized so rapid toggles preserve
 * the final user choice.
 */
export const persistMutedPreference = (storage: StorageAdapter, muted: boolean): Promise<void> => {
  settingsWriteQueue = settingsWriteQueue
    .catch(() => undefined)
    .then(() => new SettingsRepository(storage).write({ version: SETTINGS_VERSION, muted }));
  return settingsWriteQueue;
};
