import type { RandomSource } from '../src/game/systems/random';
import type { StorageAdapter } from '../src/platform/storage';

export class SequenceRandom implements RandomSource {
  private index = 0;

  public constructor(
    private readonly values: readonly number[],
    private readonly fallback = 0.999,
  ) {}

  public next(): number {
    return this.values[this.index++] ?? this.fallback;
  }
}

export class MemoryStorageAdapter implements StorageAdapter {
  private readonly values = new Map<string, string>();

  public async getItem(key: string): Promise<string | null> {
    return this.values.get(key) ?? null;
  }

  public async setItem(key: string, value: string): Promise<void> {
    this.values.set(key, value);
  }

  public async removeItem(key: string): Promise<void> {
    this.values.delete(key);
  }
}
