import { describe, expect, it } from 'vitest';

import {
  isPortraitViewport,
  resolveGameCssSize,
  resolveInitialGameCssSize,
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

  it('derives the visible game CSS size from the same landscape snapshot and caps it at 2:1', () => {
    expect(resolveGameCssSize({ width: 915, height: 315 })).toEqual({ width: 630, height: 315 });
    expect(resolveGameCssSize({ width: 844, height: 390 })).toEqual({ width: 780, height: 390 });
    expect(resolveGameCssSize({ width: 720, height: 480 })).toEqual({ width: 720, height: 480 });
  });

  it('boots Phaser with provisional landscape geometry when the initial viewport is portrait', () => {
    expect(resolveInitialGameCssSize({ width: 412, height: 915, portrait: true })).toEqual({
      width: 824,
      height: 412,
    });
  });

  it('preserves resolved landscape geometry at initial boot', () => {
    expect(resolveInitialGameCssSize({ width: 844, height: 390, portrait: false })).toEqual({
      width: 780,
      height: 390,
    });
  });
});
