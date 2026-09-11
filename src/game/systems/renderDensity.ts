export const MAX_RENDER_PIXEL_RATIO = 2;

export const resolveRenderPixelRatio = (value: number): number => {
  const safeValue = Number.isFinite(value) ? value : 1;
  return Math.min(MAX_RENDER_PIXEL_RATIO, Math.max(1, safeValue));
};

export const getRenderPixelRatio = (): number => {
  if (typeof window === 'undefined') return 1;
  return resolveRenderPixelRatio(window.devicePixelRatio || 1);
};

export const getBackingStoreSize = (
  cssWidth: number,
  cssHeight: number,
  pixelRatio = getRenderPixelRatio(),
): { width: number; height: number } => {
  const ratio = resolveRenderPixelRatio(pixelRatio);
  return {
    width: Math.max(1, Math.round(Math.max(1, cssWidth) * ratio)),
    height: Math.max(1, Math.round(Math.max(1, cssHeight) * ratio)),
  };
};
