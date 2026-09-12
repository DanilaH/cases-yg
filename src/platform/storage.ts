import type { Player } from 'ysdk';

export interface StorageAdapter {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

export class WebStorageAdapter implements StorageAdapter {
  public constructor(private readonly storage: Storage) {}

  public async getItem(key: string): Promise<string | null> {
    return this.storage.getItem(key);
  }

  public async setItem(key: string, value: string): Promise<void> {
    this.storage.setItem(key, value);
  }

  public async removeItem(key: string): Promise<void> {
    this.storage.removeItem(key);
  }
}

interface SaveMeta {
  totalOpens: number;
  hasPendingReveal: boolean;
}

const readSaveMeta = (raw: string | null): SaveMeta | null => {
  if (raw === null) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (typeof value !== 'object' || value === null || Array.isArray(value)) return null;
    const record = value as Record<string, unknown>;
    if (typeof record.totalOpens !== 'number' || !Number.isInteger(record.totalOpens) || record.totalOpens < 0) {
      return null;
    }
    return {
      totalOpens: record.totalOpens,
      hasPendingReveal: record.pendingReveal !== null && record.pendingReveal !== undefined,
    };
  } catch {
    return null;
  }
};

const chooseSaveCopy = (localRaw: string | null, cloudRaw: string | null): string | null => {
  if (localRaw === null) return cloudRaw;
  if (cloudRaw === null) return localRaw;
  if (localRaw === cloudRaw) return localRaw;

  const localMeta = readSaveMeta(localRaw);
  const cloudMeta = readSaveMeta(cloudRaw);

  if (localMeta && cloudMeta) {
    // A staged reveal is intentionally local-only until it is committed. Keep it
    // when the cloud still represents the same or an older committed opening.
    if (localMeta.hasPendingReveal && localMeta.totalOpens >= cloudMeta.totalOpens) {
      return localRaw;
    }
    if (localMeta.totalOpens > cloudMeta.totalOpens) return localRaw;
    if (cloudMeta.totalOpens > localMeta.totalOpens) return cloudRaw;
    // Same committed opening count: cloud is canonical across devices.
    return cloudRaw;
  }

  if (localMeta) return localRaw;
  if (cloudMeta) return cloudRaw;
  // Preserve the old local-save failure semantics if both payloads are malformed.
  return localRaw;
};

export interface YandexCloudSaveStorageOptions {
  syncKey: string;
  cloudField: string;
}

/**
 * Keeps the existing Yandex safeStorage copy as the immediate crash-recovery
 * source while mirroring committed progression through Player.setData().
 *
 * Only `syncKey` is cloud-synced; settings such as mute preference remain local.
 * Staged reveal transactions stay local until commit so one completed opening
 * produces one cloud write instead of two and cannot expose a half-finished
 * reward transaction on another device.
 */
export class YandexCloudSaveStorageAdapter implements StorageAdapter {
  public constructor(
    private readonly local: StorageAdapter,
    private readonly player: Pick<Player, 'getData' | 'setData'>,
    private readonly options: YandexCloudSaveStorageOptions,
  ) {}

  public async getItem(key: string): Promise<string | null> {
    if (key !== this.options.syncKey) {
      return this.local.getItem(key);
    }

    const localRaw = await this.local.getItem(key);
    let cloudRaw: string | null = null;

    try {
      const data = await this.player.getData([this.options.cloudField]);
      const value = data[this.options.cloudField];
      cloudRaw = typeof value === 'string' && value.length > 0 ? value : null;
    } catch (error: unknown) {
      console.warn('[cloud-save] failed to read Yandex player data; using safeStorage', error);
      return localRaw;
    }

    const selected = chooseSaveCopy(localRaw, cloudRaw);
    if (selected !== null && selected !== localRaw) {
      await this.local.setItem(key, selected);
    }

    // Migrate an existing local save to the cloud and repair a stale cloud copy.
    // Pending transactions are deliberately not mirrored until commit.
    if (selected !== null && selected !== cloudRaw && this.shouldMirror(selected)) {
      await this.mirrorBestEffort(selected);
    }

    return selected;
  }

  public async setItem(key: string, value: string): Promise<void> {
    await this.local.setItem(key, value);
    if (key !== this.options.syncKey || !this.shouldMirror(value)) return;
    await this.mirrorBestEffort(value);
  }

  public async removeItem(key: string): Promise<void> {
    await this.local.removeItem(key);
    if (key !== this.options.syncKey) return;

    try {
      await this.player.setData({ [this.options.cloudField]: null }, true);
    } catch (error: unknown) {
      console.warn('[cloud-save] failed to clear Yandex player data', error);
    }
  }

  private shouldMirror(raw: string): boolean {
    const meta = readSaveMeta(raw);
    return Boolean(meta && !meta.hasPendingReveal);
  }

  private async mirrorBestEffort(raw: string): Promise<void> {
    try {
      // Queue normal progression writes. The SDK keeps the latest setData value
      // available immediately and sends queued data to Yandex without blocking
      // gameplay on a forced network flush for every pouch opening.
      await this.player.setData({ [this.options.cloudField]: raw }, false);
    } catch (error: unknown) {
      // safeStorage already contains the authoritative local copy. A later load
      // or committed write will retry cloud synchronization automatically.
      console.warn('[cloud-save] failed to mirror save to Yandex player data', error);
    }
  }
}
