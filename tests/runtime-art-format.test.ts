import { describe, expect, it } from 'vitest';

import {
  detectPreferredRuntimeArtFormat,
  parseRuntimeArtFormatOverride,
  resolveRuntimeArtFormat,
  resolveRuntimeArtRequestPath,
} from '../src/app/runtimeArtFormat';

describe('runtime art format selection', () => {
  it('accepts debug-only format overrides', () => {
    expect(parseRuntimeArtFormatOverride('?artFormat=webp')).toBe('webp');
    expect(parseRuntimeArtFormatOverride('?artFormat=avif')).toBe('avif');
    expect(parseRuntimeArtFormatOverride('?artFormat=png')).toBeUndefined();
    expect(parseRuntimeArtFormatOverride('?artFormat=webp', false)).toBeUndefined();
  });

  it('never selects AVIF when decode support is unavailable', () => {
    expect(resolveRuntimeArtFormat(false)).toBe('webp');
    expect(resolveRuntimeArtFormat(false, 'avif')).toBe('webp');
    expect(resolveRuntimeArtFormat(true)).toBe('avif');
    expect(resolveRuntimeArtFormat(true, 'webp')).toBe('webp');
  });

  it('forces WebP only in debug while preserving automatic AVIF otherwise', async () => {
    await expect(detectPreferredRuntimeArtFormat({
      search: '?artFormat=webp',
      debugEnabled: true,
      probeAvif: async () => true,
    })).resolves.toBe('webp');

    await expect(detectPreferredRuntimeArtFormat({
      search: '?artFormat=webp',
      debugEnabled: false,
      probeAvif: async () => true,
    })).resolves.toBe('avif');
  });

  it('switches only WebP runtime paths and preserves query/hash suffixes', () => {
    expect(resolveRuntimeArtRequestPath('assets/a.webp', 'avif')).toBe('assets/a.avif');
    expect(resolveRuntimeArtRequestPath('assets/a.webp?artRun=1', 'avif')).toBe('assets/a.avif?artRun=1');
    expect(resolveRuntimeArtRequestPath('assets/a.webp#frame', 'avif')).toBe('assets/a.avif#frame');
    expect(resolveRuntimeArtRequestPath('assets/a.webp', 'webp')).toBe('assets/a.webp');
    expect(resolveRuntimeArtRequestPath('assets/a.png', 'avif')).toBe('assets/a.png');
  });
});
