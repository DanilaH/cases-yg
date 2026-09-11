import { describe, expect, it } from 'vitest';

import {
  MAX_RENDER_PIXEL_RATIO,
  getBackingStoreSize,
  resolveRenderPixelRatio,
} from '../src/game/systems/renderDensity';

describe('render density', () => {
  it('keeps standard-density displays at 1x', () => {
    expect(resolveRenderPixelRatio(1)).toBe(1);
    expect(resolveRenderPixelRatio(0.75)).toBe(1);
    expect(resolveRenderPixelRatio(Number.NaN)).toBe(1);
  });

  it('preserves fractional HiDPI density up to the performance cap', () => {
    expect(resolveRenderPixelRatio(1.25)).toBe(1.25);
    expect(resolveRenderPixelRatio(1.5)).toBe(1.5);
    expect(resolveRenderPixelRatio(2)).toBe(2);
    expect(resolveRenderPixelRatio(3)).toBe(MAX_RENDER_PIXEL_RATIO);
  });

  it('converts CSS viewport dimensions to backing-store pixels', () => {
    expect(getBackingStoreSize(1280, 720, 1)).toEqual({ width: 1280, height: 720 });
    expect(getBackingStoreSize(1280, 720, 2)).toEqual({ width: 2560, height: 1440 });
    expect(getBackingStoreSize(1024.5, 576.25, 1.5)).toEqual({ width: 1537, height: 864 });
  });
});
