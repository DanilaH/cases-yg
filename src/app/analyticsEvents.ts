import type { AnalyticsAdapter, AnalyticsParams } from '../platform/analytics';

export interface GameAnalyticsEvent {
  event: string;
  params?: AnalyticsParams;
}

export type GameAnalyticsListener = (event: GameAnalyticsEvent) => void;

const listeners = new Set<GameAnalyticsListener>();

export const onGameAnalyticsEvent = (listener: GameAnalyticsListener): (() => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

/**
 * Mirrors game-authored analytics events to local presentation listeners while
 * preserving the real platform adapter as the canonical analytics destination.
 */
export const createObservableAnalyticsAdapter = (base: AnalyticsAdapter): AnalyticsAdapter => ({
  track: (event, params) => {
    base.track(event, params);
    const message: GameAnalyticsEvent = params === undefined ? { event } : { event, params };
    for (const listener of listeners) listener(message);
  },
});
