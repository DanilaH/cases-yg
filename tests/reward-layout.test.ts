import { describe, expect, it } from 'vitest';

import { OPENING_FEEL_PRESENTATION, RESULT_PRESENTATION } from '../src/game/data/presentation';
import { createLayoutMetrics } from '../src/game/systems/layout';
import { computeRewardTrayPlacement, rectsOverlap, type LogicalRect } from '../src/game/systems/rewardLayout';

const rectFromCenter = (x: number, y: number, width: number, height: number): LogicalRect => ({
  left: x - width / 2,
  right: x + width / 2,
  top: y - height / 2,
  bottom: y + height / 2,
});

describe('reward tray layout', () => {
  for (const width of [900, 1024, 1280]) {
    for (const rows of [1, 2, 3, 4]) {
      it(`keeps ${rows} reward rows inside safe geometry at ${width}px`, () => {
        const metrics = createLayoutMetrics(width, 720);
        const trayHeight = 30 + rows * 22;
        const placement = computeRewardTrayPlacement({
          safeLeft: metrics.safeLeft,
          safeRight: metrics.safeRight,
          safeTop: metrics.safeTop,
          centerX: metrics.centerX,
          railRight: metrics.safeLeft + OPENING_FEEL_PRESENTATION.railCardWidth,
          resultPanelTop: RESULT_PRESENTATION.panelY - RESULT_PRESENTATION.panelHeight / 2,
          trayWidth: OPENING_FEEL_PRESENTATION.rewardTrayWidth,
          trayHeight,
          heroHalfWidth: OPENING_FEEL_PRESENTATION.rewardTrayHeroHalfWidth,
          sideGap: OPENING_FEEL_PRESENTATION.rewardTraySideGap,
          resultGap: OPENING_FEEL_PRESENTATION.rewardTrayResultGap,
        });
        const tray = rectFromCenter(
          placement.x,
          placement.y,
          OPENING_FEEL_PRESENTATION.rewardTrayWidth,
          trayHeight,
        );
        const rail: LogicalRect = {
          left: metrics.safeLeft,
          right: metrics.safeLeft + OPENING_FEEL_PRESENTATION.railCardWidth,
          top: metrics.safeTop,
          bottom: metrics.safeBottom,
        };
        const result: LogicalRect = rectFromCenter(
          metrics.centerX,
          RESULT_PRESENTATION.panelY,
          RESULT_PRESENTATION.panelMaxWidth,
          RESULT_PRESENTATION.panelHeight,
        );
        const hero: LogicalRect = {
          left: metrics.centerX - OPENING_FEEL_PRESENTATION.rewardTrayHeroHalfWidth,
          right: metrics.centerX + OPENING_FEEL_PRESENTATION.rewardTrayHeroHalfWidth,
          top: 210,
          bottom: 500,
        };

        expect(tray.left).toBeGreaterThanOrEqual(metrics.safeLeft);
        expect(tray.right).toBeLessThanOrEqual(metrics.safeRight);
        expect(tray.top).toBeGreaterThanOrEqual(metrics.safeTop);
        expect(rectsOverlap(tray, rail)).toBe(false);
        expect(rectsOverlap(tray, result)).toBe(false);
        expect(rectsOverlap(tray, hero)).toBe(false);
        expect(placement.side).toBe(width >= 1280 ? 'left' : 'right');
      });
    }
  }
});
