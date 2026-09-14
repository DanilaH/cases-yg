import { describe, expect, it } from 'vitest';

import { isPortraitViewport, resolveViewportSize } from '../src/app/viewport';

describe('viewport resolution', () => {
  it('prefers visualViewport when it agrees with orientation', () => {
    expect(resolveViewportSize(
      { width: 844, height: 390 },
      { width: 844, height: 390 },
      { width: 844, height: 390 },
      false,
    )).toEqual({ width: 844, height: 390 });
  });

  it('falls back when visualViewport is stale after rotation', () => {
    expect(resolveViewportSize(
      { width: 390, height: 844 },
      { width: 844, height: 390 },
      { width: 844, height: 390 },
      false,
    )).toEqual({ width: 844, height: 390 });
  });

  it('keeps the best available source when no orientation hint exists', () => {
    expect(resolveViewportSize(
      { width: 412, height: 915 },
      { width: 412, height: 915 },
      null,
      null,
    )).toEqual({ width: 412, height: 915 });
    expect(isPortraitViewport({ width: 412, height: 915 })).toBe(true);
  });
});
