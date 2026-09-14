import { describe, expect, it } from 'vitest';

import {
  isPortraitViewport,
  resolveViewportState,
  shouldSyncGameBackingStore,
} from '../src/app/viewport';

describe('viewport resolution', () => {
  it('prefers visualViewport when all geometry agrees', () => {
    expect(resolveViewportState(
      { width: 844, height: 390 },
      { width: 844, height: 390 },
      { width: 844, height: 390 },
      false,
    )).toEqual({ width: 844, height: 390, portrait: false });
  });

  it('rejects stale portrait visualViewport after layout geometry rotates to landscape', () => {
    expect(resolveViewportState(
      { width: 390, height: 844 },
      { width: 844, height: 390 },
      { width: 844, height: 390 },
      true,
    )).toEqual({ width: 844, height: 390, portrait: false });
  });

  it('does not let a stale media orientation override agreeing layout geometry', () => {
    expect(resolveViewportState(
      { width: 390, height: 844 },
      { width: 915, height: 412 },
      { width: 915, height: 412 },
      true,
    ).portrait).toBe(false);
  });

  it('uses media orientation only as a tie-breaker while layout sources disagree', () => {
    expect(resolveViewportState(
      { width: 390, height: 844 },
      { width: 844, height: 390 },
      { width: 390, height: 844 },
      false,
    )).toEqual({ width: 844, height: 390, portrait: false });
  });

  it('falls back to the best available geometry without orientation APIs', () => {
    const state = resolveViewportState(
      { width: 412, height: 915 },
      null,
      null,
      null,
    );
    expect(state).toEqual({ width: 412, height: 915, portrait: true });
    expect(isPortraitViewport(state)).toBe(true);
  });

  it('keeps the Phaser backing store untouched while the portrait gate owns presentation', () => {
    expect(shouldSyncGameBackingStore({ portrait: true })).toBe(false);
    expect(shouldSyncGameBackingStore({ portrait: false })).toBe(true);
  });
});
