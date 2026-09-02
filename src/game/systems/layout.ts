export type LayoutMode = 'compact' | 'standard' | 'wide';

export interface LayoutMetrics {
  viewportWidth: number;
  viewportHeight: number;
  logicalWidth: number;
  logicalHeight: 720;
  scale: number;
  offsetX: number;
  mode: LayoutMode;
  centerX: number;
  centerY: number;
  safeLeft: number;
  safeRight: number;
  safeTop: number;
  safeBottom: number;
}

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

export const createLayoutMetrics = (viewportWidth: number, viewportHeight: number): LayoutMetrics => {
  const height = Math.max(1, viewportHeight);
  const aspect = viewportWidth / height;
  const logicalHeight = 720 as const;
  const scale = height / logicalHeight;
  const logicalWidth = clamp(aspect * logicalHeight, 900, 1728);
  const contentWidth = logicalWidth * scale;
  const offsetX = (viewportWidth - contentWidth) / 2;
  const mode: LayoutMode = aspect <= 1.5 ? 'compact' : aspect <= 1.95 ? 'standard' : 'wide';
  const margin = clamp(logicalWidth * 0.04, 28, 64);

  return {
    viewportWidth,
    viewportHeight,
    logicalWidth,
    logicalHeight,
    scale,
    offsetX,
    mode,
    centerX: logicalWidth / 2,
    centerY: logicalHeight / 2,
    safeLeft: margin,
    safeRight: logicalWidth - margin,
    safeTop: 28,
    safeBottom: logicalHeight - 28,
  };
};

export const layoutX = (metrics: LayoutMetrics, logicalX: number): number =>
  metrics.offsetX + logicalX * metrics.scale;

export const layoutY = (metrics: LayoutMetrics, logicalY: number): number => logicalY * metrics.scale;
