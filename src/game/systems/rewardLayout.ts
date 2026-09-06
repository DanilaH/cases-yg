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
  railRight,
  resultPanelTop,
  trayWidth,
  trayHeight,
  heroHalfWidth,
  sideGap,
  resultGap,
}: RewardTrayPlacementInput): RewardTrayPlacement => {
  const halfWidth = trayWidth / 2;
  const halfHeight = trayHeight / 2;
  const leftX = railRight + sideGap + halfWidth;
  const rightX = safeRight - sideGap - halfWidth;
  const heroLeft = centerX - heroHalfWidth;
  const heroRight = centerX + heroHalfWidth;
  const leftClearance = heroLeft - (leftX + halfWidth);
  const rightClearance = rightX - halfWidth - heroRight;

  let side: RewardTrayPlacement['side'];
  if (leftClearance >= 0) {
    side = 'left';
  } else if (rightClearance >= 0) {
    side = 'right';
  } else {
    side = rightClearance > leftClearance ? 'right' : 'left';
  }

  const preferredX = side === 'left' ? leftX : rightX;
  const x = clamp(preferredX, safeLeft + halfWidth, safeRight - halfWidth);
  const preferredY = resultPanelTop - resultGap - halfHeight;
  const y = Math.max(safeTop + halfHeight, preferredY);

  return { x, y, side };
};
