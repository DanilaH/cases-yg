export interface ViewportSize {
  width: number;
  height: number;
}

export interface ViewportState extends ViewportSize {
  portrait: boolean;
}

const isUsable = (size: ViewportSize | null | undefined): size is ViewportSize =>
  Boolean(size && Number.isFinite(size.width) && Number.isFinite(size.height) && size.width > 0 && size.height > 0);

export const isPortraitViewport = (size: ViewportSize): boolean => size.height > size.width;

export const shouldSyncGameBackingStore = (viewport: Pick<ViewportState, 'portrait'>): boolean =>
  !viewport.portrait;

export const resolveGameCssSize = (viewport: ViewportSize): ViewportSize => {
  const height = Math.max(1, viewport.height);
  return {
    width: Math.max(1, Math.min(viewport.width, height * 2)),
    height,
  };
};

export const resolveInitialGameCssSize = (viewport: ViewportState): ViewportSize => {
  if (!viewport.portrait) return resolveGameCssSize(viewport);

  // The portrait gate is the only authored portrait presentation. Keep Phaser
  // booting behind it using provisional landscape geometry so scenes never
  // author a tall layout that can survive into the first visible landscape frame.
  return resolveGameCssSize({
    width: viewport.height,
    height: viewport.width,
  });
};

const resolvePortrait = (
  visualViewport: ViewportSize | null | undefined,
  innerViewport: ViewportSize | null | undefined,
  documentViewport: ViewportSize | null | undefined,
  mediaPortrait: boolean | null,
): boolean => {
  const inner = isUsable(innerViewport) ? innerViewport : null;
  const documentSize = isUsable(documentViewport) ? documentViewport : null;
  const visual = isUsable(visualViewport) ? visualViewport : null;

  // Layout viewport geometry is the primary truth. screen.orientation is
  // intentionally excluded: Android browsers/webviews can leave it stale after
  // the page geometry has already rotated.
  if (inner && documentSize) {
    const innerPortrait = isPortraitViewport(inner);
    const documentPortrait = isPortraitViewport(documentSize);
    if (innerPortrait === documentPortrait) return innerPortrait;
    // During the brief disagreement window, matchMedia is only a tie-breaker.
    if (mediaPortrait !== null) return mediaPortrait;
    return innerPortrait;
  }
  if (inner) return isPortraitViewport(inner);
  if (documentSize) return isPortraitViewport(documentSize);
  if (visual) return isPortraitViewport(visual);
  return mediaPortrait ?? false;
};

/**
 * Resolve one coherent viewport snapshot. Orientation and dimensions must come
 * from the same decision so the rotate gate cannot disagree with the Phaser/CSS
 * resize path.
 *
 * visualViewport remains the preferred size only when its orientation agrees
 * with the resolved layout orientation. This handles the common mobile-rotation
 * case where visualViewport is stale for a few frames.
 */
export const resolveViewportState = (
  visualViewport: ViewportSize | null | undefined,
  innerViewport: ViewportSize | null | undefined,
  documentViewport: ViewportSize | null | undefined,
  mediaPortrait: boolean | null,
): ViewportState => {
  const portrait = resolvePortrait(visualViewport, innerViewport, documentViewport, mediaPortrait);
  const candidates = [visualViewport, innerViewport, documentViewport].filter(isUsable);
  const size =
    candidates.find((candidate) => isPortraitViewport(candidate) === portrait) ??
    candidates[0] ??
    { width: 1, height: 1 };
  return { width: size.width, height: size.height, portrait };
};
