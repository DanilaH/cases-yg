import { OPENING_FEEL_PRESENTATION } from '../data/presentation';
import type { LayoutMetrics } from './layout';

export interface OpeningChromeSizing {
  compact: boolean;
  chipsHudWidth: number;
  chipsHudHeight: number;
  signalHudWidth: number;
  signalHudHeight: number;
  railCardWidth: number;
  railCardHeight: number;
  railGap: number;
  selectorTopOffset: number;
  selectorLabelGap: number;
  oddsPanelHeight: number;
  oddsTopGap: number;
  rewardTrayWidth: number;
  rewardTrayContentInset: number;
  dropSelectorHeight: number;
  dropSelectorMinWidth: number;
  dropSelectorMaxWidth: number;
  dropSelectorArrowRadius: number;
  dropSelectorArrowGap: number;
  dropSelectorArrowHitSize: number;
}

export interface OpeningRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PouchSelectorGeometry {
  chrome: OpeningChromeSizing;
  railX: number;
  labelY: number;
  basic: OpeningRect;
  charged: OpeningRect;
  odds: OpeningRect;
}

export const getOpeningChromeSizing = (compact: boolean): OpeningChromeSizing => ({
  compact,
  chipsHudWidth: compact ? 286 : OPENING_FEEL_PRESENTATION.chipsHudWidth,
  chipsHudHeight: compact ? 84 : OPENING_FEEL_PRESENTATION.chipsHudHeight,
  signalHudWidth: compact ? 286 : OPENING_FEEL_PRESENTATION.signalHudWidth,
  signalHudHeight: compact ? 88 : OPENING_FEEL_PRESENTATION.signalHudHeight,
  railCardWidth: compact ? 286 : OPENING_FEEL_PRESENTATION.railCardWidth,
  railCardHeight: compact ? 70 : OPENING_FEEL_PRESENTATION.railCardHeight,
  railGap: compact ? 10 : OPENING_FEEL_PRESENTATION.railGap,
  selectorTopOffset: compact ? 214 : OPENING_FEEL_PRESENTATION.selectorTopOffset,
  selectorLabelGap: compact ? 30 : 20,
  oddsPanelHeight: compact ? 164 : 104,
  oddsTopGap: compact ? 16 : 14,
  rewardTrayWidth: compact ? 420 : OPENING_FEEL_PRESENTATION.rewardTrayWidth,
  rewardTrayContentInset: compact ? 24 : OPENING_FEEL_PRESENTATION.rewardTrayContentInset,
  dropSelectorHeight: compact ? 112 : OPENING_FEEL_PRESENTATION.dropSelectorHeight,
  dropSelectorMinWidth: compact ? 440 : OPENING_FEEL_PRESENTATION.dropSelectorMinWidth,
  dropSelectorMaxWidth: compact ? 540 : OPENING_FEEL_PRESENTATION.dropSelectorMaxWidth,
  dropSelectorArrowRadius: compact ? 26 : 25,
  dropSelectorArrowGap: compact ? 34 : 0,
  dropSelectorArrowHitSize: compact ? 68 : OPENING_FEEL_PRESENTATION.dropSelectorArrowHitWidth,
});

export const getPouchSelectorGeometry = (metrics: LayoutMetrics): PouchSelectorGeometry => {
  const chrome = getOpeningChromeSizing(metrics.compactChrome);
  const railX = metrics.safeLeft;
  const labelY = metrics.safeTop + chrome.selectorTopOffset;
  const firstCardY = labelY + chrome.selectorLabelGap;
  const chargedY = firstCardY + chrome.railCardHeight + chrome.railGap;
  const oddsY = chargedY + chrome.railCardHeight + chrome.oddsTopGap;

  return {
    chrome,
    railX,
    labelY,
    basic: {
      x: railX,
      y: firstCardY,
      width: chrome.railCardWidth,
      height: chrome.railCardHeight,
    },
    charged: {
      x: railX,
      y: chargedY,
      width: chrome.railCardWidth,
      height: chrome.railCardHeight,
    },
    odds: {
      x: railX,
      y: oddsY,
      width: chrome.railCardWidth,
      height: chrome.oddsPanelHeight,
    },
  };
};

export const getDropSelectorWidth = (metrics: LayoutMetrics): number => {
  const chrome = getOpeningChromeSizing(metrics.compactChrome);
  return Math.min(
    chrome.dropSelectorMaxWidth,
    Math.max(chrome.dropSelectorMinWidth, metrics.logicalWidth * (metrics.compactChrome ? 0.42 : 0.48)),
  );
};
