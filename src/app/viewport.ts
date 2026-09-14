export interface ViewportSize {
  width: number;
  height: number;
}

const isUsable = (size: ViewportSize | null | undefined): size is ViewportSize =>
  Boolean(size && Number.isFinite(size.width) && Number.isFinite(size.height) && size.width > 0 && size.height > 0);

export const isPortraitViewport = (size: ViewportSize): boolean => size.height > size.width;

/**
 * Mobile browsers can publish stale visualViewport dimensions for a short time
 * around rotation. Prefer visualViewport when it agrees with the browser's
 * orientation signal, otherwise fall back to inner/client geometry that does.
 */
export const resolveViewportSize = (
  visualViewport: ViewportSize | null | undefined,
  innerViewport: ViewportSize | null | undefined,
  documentViewport: ViewportSize | null | undefined,
  portraitHint: boolean | null,
): ViewportSize => {
  const candidates = [visualViewport, innerViewport, documentViewport].filter(isUsable);
  if (candidates.length === 0) return { width: 1, height: 1 };
  if (portraitHint === null) return candidates[0]!;
  return candidates.find((candidate) => isPortraitViewport(candidate) === portraitHint) ?? candidates[0]!;
};
