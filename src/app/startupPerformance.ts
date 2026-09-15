import type { AnalyticsAdapter } from '../platform/analytics';

export type StartupPhase =
  | 'platformBootstrapStart'
  | 'platformBootstrapReady'
  | 'bootSaveSettled'
  | 'bootArtSettled'
  | 'gameReady';

export interface StartupPerformanceSnapshot {
  moduleToPlatformMs?: number;
  platformToSaveMs?: number;
  saveToArtMs?: number;
  artToReadyMs?: number;
  moduleToReadyMs?: number;
}

type StartupDebugWindow = Window & {
  __SIGNAL_STARTUP_PERF__?: Readonly<Record<StartupPhase | 'moduleStart', number>>;
};

const debugEnabled = (): boolean =>
  import.meta.env.DEV || import.meta.env.VITE_DEBUG_PANEL === 'true';

const clockNow = (): number =>
  typeof performance === 'undefined' ? Date.now() : performance.now();

const moduleStartedAt = clockNow();
const marks = new Map<StartupPhase | 'moduleStart', number>([['moduleStart', 0]]);
let reported = false;

const rounded = (value: number): number => Math.max(0, Math.round(value));

const publishDebugSnapshot = (): void => {
  if (!debugEnabled() || typeof window === 'undefined') return;
  (window as StartupDebugWindow).__SIGNAL_STARTUP_PERF__ = Object.fromEntries(marks);
};

export const markStartupPhase = (phase: StartupPhase): void => {
  if (marks.has(phase)) return;
  marks.set(phase, rounded(clockNow() - moduleStartedAt));
  publishDebugSnapshot();
};

const elapsed = (
  start: StartupPhase | 'moduleStart',
  end: StartupPhase,
): number | undefined => {
  const startValue = marks.get(start);
  const endValue = marks.get(end);
  if (startValue === undefined || endValue === undefined) return undefined;
  return rounded(endValue - startValue);
};

export const getStartupPerformanceSnapshot = (): StartupPerformanceSnapshot => ({
  moduleToPlatformMs: elapsed('moduleStart', 'platformBootstrapReady'),
  platformToSaveMs: elapsed('platformBootstrapReady', 'bootSaveSettled'),
  saveToArtMs: elapsed('bootSaveSettled', 'bootArtSettled'),
  artToReadyMs: elapsed('bootArtSettled', 'gameReady'),
  moduleToReadyMs: elapsed('moduleStart', 'gameReady'),
});

export const reportStartupPerformance = (
  analytics: AnalyticsAdapter,
  platform: 'mock' | 'yandex',
): void => {
  if (reported) return;
  reported = true;
  markStartupPhase('gameReady');
  const snapshot = getStartupPerformanceSnapshot();
  const params: Record<string, number | string> = { platform };
  for (const [key, value] of Object.entries(snapshot)) {
    if (typeof value === 'number') params[key] = value;
  }
  analytics.track('startup_performance', params);
};

publishDebugSnapshot();
