export interface LogicalRect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export interface RewardTrayPlacementInput {
  safeLeft: number;
  safeRight: number;
  safeTop: number;
  centerX: number;
  railRight: number;
  resultPanelTop: number;
  trayWidth: number;
  trayHeight: number;
  heroHalfWidth: number;
  sideGap: number;
  resultGap: number;
}

export interface RewardTrayPlacement {
  x: number;
  y: number;
  side: 'left' | 'right';
}

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

export const rectsOverlap = (a: LogicalRect, b: LogicalRect, gap = 0): boolean =>
  a.left < b.right + gap &&
  a.right > b.left - gap &&
  a.top < b.bottom + gap &&
  a.bottom > b.top - gap;

export const computeRewardTrayPlacement = ({
  safeLeft,
  safeRight,
  safeTop,
  centerX,
  trayWidth,
  trayHeight,
}: RewardTrayPlacementInput): RewardTrayPlacement => {
  const halfWidth = trayWidth / 2;
  const halfHeight = trayHeight / 2;
  const safeWidth = Math.max(1, safeRight - safeLeft);

  // Result rewards belong to the hero/result reading path. Keep the tray in the
  // upper center-right space previously occupied by the decorative product title,
  // rather than pinning it to the far screen edge. The bounded offset preserves
  // clear separation from the persistent left resource rail across supported widths.
  const centerOffset = clamp(safeWidth * 0.12, 96, 160);
  const x = clamp(centerX + centerOffset, safeLeft + halfWidth, safeRight - halfWidth);
  const y = safeTop + halfHeight + 18;

  return { x, y, side: 'right' };
};
