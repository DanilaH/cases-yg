import { resolveRenderPixelRatio } from './renderDensity';

export type LayoutMode = 'compact' | 'standard' | 'wide';

export interface SafeAreaInsets {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export interface LayoutMetrics {
  viewportWidth: number;
  viewportHeight: number;
  cssViewportWidth: number;
  cssViewportHeight: number;
  logicalWidth: number;
  logicalHeight: 720;
  scale: number;
  offsetX: number;
  mode: LayoutMode;
  compactChrome: boolean;
  centerX: number;
  centerY: number;
  safeLeft: number;
  safeRight: number;
  safeTop: number;
  safeBottom: number;
}

export const COMPACT_CHROME_MAX_CSS_HEIGHT = 520;

const ZERO_INSETS: SafeAreaInsets = { left: 0, right: 0, top: 0, bottom: 0 };
const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

const readCssPixels = (styles: CSSStyleDeclaration, name: string): number => {
  const parsed = Number.parseFloat(styles.getPropertyValue(name));
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
};

export const readSafeAreaInsets = (pixelRatio = 1): SafeAreaInsets => {
  if (typeof document === 'undefined') return ZERO_INSETS;
  const styles = window.getComputedStyle(document.documentElement);
  const ratio = resolveRenderPixelRatio(pixelRatio);
  return {
    left: readCssPixels(styles, '--safe-area-left') * ratio,
    right: readCssPixels(styles, '--safe-area-right') * ratio,
    top: readCssPixels(styles, '--safe-area-top') * ratio,
    bottom: readCssPixels(styles, '--safe-area-bottom') * ratio,
  };
};

export const createLayoutMetrics = (
  viewportWidth: number,
  viewportHeight: number,
  safeArea: SafeAreaInsets = ZERO_INSETS,
  pixelRatio = 1,
): LayoutMetrics => {
  const height = Math.max(1, viewportHeight);
  const aspect = viewportWidth / height;
  const logicalHeight = 720 as const;
  const scale = height / logicalHeight;
  const renderPixelRatio = resolveRenderPixelRatio(pixelRatio);
  const cssViewportWidth = viewportWidth / renderPixelRatio;
  const cssViewportHeight = viewportHeight / renderPixelRatio;
  // Aspect ratio alone cannot distinguish a 16:9 desktop window from a 16:9
  // phone. Short landscape viewports need larger/reflowed chrome so small
  // digital-font labels do not collapse to only a few physical CSS pixels.
  const compactChrome =
    cssViewportWidth >= cssViewportHeight && cssViewportHeight <= COMPACT_CHROME_MAX_CSS_HEIGHT;
  // Yandex Games desktop requirement 1.6.2.2 caps the active game's long side
  // at 2x the short side. Keep the authored logical surface inside that limit.
  const logicalWidth = clamp(aspect * logicalHeight, 900, logicalHeight * 2);
  const contentWidth = logicalWidth * scale;
  const offsetX = (viewportWidth - contentWidth) / 2;
  const mode: LayoutMode = aspect <= 1.5 ? 'compact' : aspect <= 1.95 ? 'standard' : 'wide';
  const horizontalMargin = clamp(logicalWidth * 0.04, 28, 64);
  const verticalMargin = 28;
  const safeViewportLeft = Math.max(0, safeArea.left - offsetX) / scale;
  const safeViewportRight = (viewportWidth - safeArea.right - offsetX) / scale;
  const insetPadding = 16;

  return {
    viewportWidth,
    viewportHeight,
    cssViewportWidth,
    cssViewportHeight,
    logicalWidth,
    logicalHeight,
    scale,
    offsetX,
    mode,
    compactChrome,
    centerX: logicalWidth / 2,
    centerY: logicalHeight / 2,
    safeLeft: Math.max(horizontalMargin, safeViewportLeft + insetPadding),
    safeRight: Math.min(logicalWidth - horizontalMargin, safeViewportRight - insetPadding),
    safeTop: Math.max(verticalMargin, safeArea.top / scale + insetPadding),
    safeBottom: Math.min(logicalHeight - verticalMargin, logicalHeight - safeArea.bottom / scale - insetPadding),
  };
};

export const layoutX = (metrics: LayoutMetrics, logicalX: number): number =>
  metrics.offsetX + logicalX * metrics.scale;

export const layoutY = (metrics: LayoutMetrics, logicalY: number): number => logicalY * metrics.scale;