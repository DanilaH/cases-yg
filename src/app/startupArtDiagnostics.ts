const ART_CONCURRENCY_PARAM = 'artConcurrency';
const ART_RUN_PARAM = 'artRun';
const SLOWEST_ASSET_LIMIT = 8;

export const STARTUP_ART_CONCURRENCY_VALUES = [4, 8, 12, 16, 24, 32] as const;
export type StartupArtConcurrency = (typeof STARTUP_ART_CONCURRENCY_VALUES)[number];

export interface StartupArtExperimentConfig {
  concurrencyOverride: StartupArtConcurrency | undefined;
  cacheBustToken: string | undefined;
}

export interface StartupArtSlowAsset {
  key: string;
  durationMs: number;
  waitMs: number;
  downloadMs: number;
  transferKiB: number;
  encodedKiB: number;
}

export interface StartupArtDiagnosticsSnapshot {
  loaderMaxParallelDownloads: number | undefined;
  concurrencyOverride: StartupArtConcurrency | undefined;
  cacheBustEnabled: boolean;
  queuedCount: number;
  observedCount: number;
  loaderWallMs: number | undefined;
  resourceSpanMs: number | undefined;
  settleAfterLastResponseMs: number | undefined;
  maxObservedNetworkConcurrency: number | undefined;
  transferKiB: number;
  encodedKiB: number;
  cacheLikeCount: number;
  protocols: string[];
  slowest: StartupArtSlowAsset[];
}

interface QueuedStartupArt {
  textureKey: string;
  requestUrl: string | undefined;
}

interface StartupArtSession {
  config: StartupArtExperimentConfig;
  loaderMaxParallelDownloads: number;
  startedAt: number;
  settledAt: number | undefined;
  queued: QueuedStartupArt[];
  snapshot: StartupArtDiagnosticsSnapshot | undefined;
}

type ResourceTimingLike = Pick<
  PerformanceResourceTiming,
  | 'name'
  | 'startTime'
  | 'requestStart'
  | 'responseStart'
  | 'responseEnd'
  | 'duration'
  | 'transferSize'
  | 'encodedBodySize'
  | 'nextHopProtocol'
>;

let session: StartupArtSession | undefined;

const debugEnabled = (): boolean =>
  import.meta.env.DEV || import.meta.env.VITE_DEBUG_PANEL === 'true';

const clockNow = (): number =>
  typeof performance === 'undefined' ? Date.now() : performance.now();

const rounded = (value: number): number => Math.max(0, Math.round(value));
const roundedKiB = (bytes: number): number => Math.max(0, Math.round(bytes / 102.4) / 10);

const isAllowedConcurrency = (value: number): value is StartupArtConcurrency =>
  STARTUP_ART_CONCURRENCY_VALUES.includes(value as StartupArtConcurrency);

export const parseStartupArtExperimentConfig = (
  search: string,
  enabled = true,
): StartupArtExperimentConfig => {
  if (!enabled) return { concurrencyOverride: undefined, cacheBustToken: undefined };

  const params = new URLSearchParams(search);
  const rawConcurrency = params.get(ART_CONCURRENCY_PARAM);
  const parsedConcurrency = rawConcurrency === null ? Number.NaN : Number(rawConcurrency);
  const concurrencyOverride = Number.isInteger(parsedConcurrency) && isAllowedConcurrency(parsedConcurrency)
    ? parsedConcurrency
    : undefined;
  const rawCacheBustToken = params.get(ART_RUN_PARAM)?.trim();
  const cacheBustToken = rawCacheBustToken ? rawCacheBustToken.slice(0, 80) : undefined;

  return { concurrencyOverride, cacheBustToken };
};

export const getStartupArtExperimentConfig = (): StartupArtExperimentConfig => {
  if (!debugEnabled() || typeof window === 'undefined') {
    return { concurrencyOverride: undefined, cacheBustToken: undefined };
  }
  return parseStartupArtExperimentConfig(window.location.search);
};

export const buildStartupArtExperimentUrl = (
  href: string,
  concurrency: StartupArtConcurrency | undefined,
  runToken: string,
): string => {
  const url = new URL(href);
  if (concurrency === undefined) {
    url.searchParams.delete(ART_CONCURRENCY_PARAM);
  } else {
    url.searchParams.set(ART_CONCURRENCY_PARAM, String(concurrency));
  }
  url.searchParams.set(ART_RUN_PARAM, runToken);
  return url.toString();
};

const appendCacheBustToken = (assetPath: string, token: string | undefined): string => {
  if (!token) return assetPath;
  const separator = assetPath.includes('?') ? '&' : '?';
  return `${assetPath}${separator}${ART_RUN_PARAM}=${encodeURIComponent(token)}`;
};

const toAbsoluteUrl = (requestPath: string): string | undefined => {
  if (typeof document === 'undefined') return undefined;
  try {
    return new URL(requestPath, document.baseURI).href;
  } catch {
    return undefined;
  }
};

export const beginStartupArtDiagnostics = (
  loaderMaxParallelDownloads: number,
  config: StartupArtExperimentConfig,
): void => {
  if (!debugEnabled()) {
    session = undefined;
    return;
  }

  session = {
    config,
    loaderMaxParallelDownloads,
    startedAt: clockNow(),
    settledAt: undefined,
    queued: [],
    snapshot: undefined,
  };
};

export const prepareStartupArtRequest = (textureKey: string, assetPath: string): string => {
  const requestPath = appendCacheBustToken(assetPath, session?.config.cacheBustToken);
  session?.queued.push({ textureKey, requestUrl: toAbsoluteUrl(requestPath) });
  return requestPath;
};

const getResourceTimings = (): ResourceTimingLike[] => {
  if (typeof performance === 'undefined' || typeof performance.getEntriesByType !== 'function') return [];
  return performance.getEntriesByType('resource') as PerformanceResourceTiming[];
};

const resolveObservedNetworkConcurrency = (entries: readonly ResourceTimingLike[]): number | undefined => {
  if (entries.length === 0) return undefined;
  const events: Array<{ at: number; delta: 1 | -1 }> = [];
  for (const entry of entries) {
    const start = entry.requestStart > 0 ? entry.requestStart : entry.startTime;
    const end = entry.responseEnd;
    if (!(end > start)) continue;
    events.push({ at: start, delta: 1 }, { at: end, delta: -1 });
  }
  if (events.length === 0) return undefined;
  events.sort((a, b) => a.at - b.at || a.delta - b.delta);
  let active = 0;
  let maxActive = 0;
  for (const event of events) {
    active += event.delta;
    maxActive = Math.max(maxActive, active);
  }
  return maxActive;
};

const makeSnapshot = (
  activeSession: StartupArtSession,
  resourceTimings: readonly ResourceTimingLike[],
): StartupArtDiagnosticsSnapshot => {
  const timingByUrl = new Map(resourceTimings.map((entry) => [entry.name, entry]));
  const observed = activeSession.queued.flatMap((asset) => {
    if (!asset.requestUrl) return [];
    const timing = timingByUrl.get(asset.requestUrl);
    return timing ? [{ asset, timing }] : [];
  });
  const observedTimings = observed.map(({ timing }) => timing);
  const settledAt = activeSession.settledAt;
  const earliestStart = observedTimings.length > 0
    ? Math.min(...observedTimings.map((entry) => entry.startTime))
    : undefined;
  const latestResponseEnd = observedTimings.length > 0
    ? Math.max(...observedTimings.map((entry) => entry.responseEnd))
    : undefined;

  const slowest = observed
    .map(({ asset, timing }): StartupArtSlowAsset => {
      const requestStart = timing.requestStart > 0 ? timing.requestStart : timing.startTime;
      const responseStart = timing.responseStart > 0 ? timing.responseStart : requestStart;
      return {
        key: asset.textureKey,
        durationMs: rounded(timing.duration),
        waitMs: rounded(Math.max(0, responseStart - requestStart)),
        downloadMs: rounded(Math.max(0, timing.responseEnd - responseStart)),
        transferKiB: roundedKiB(timing.transferSize),
        encodedKiB: roundedKiB(timing.encodedBodySize),
      };
    })
    .sort((a, b) => b.durationMs - a.durationMs)
    .slice(0, SLOWEST_ASSET_LIMIT);

  return {
    loaderMaxParallelDownloads: activeSession.loaderMaxParallelDownloads,
    concurrencyOverride: activeSession.config.concurrencyOverride,
    cacheBustEnabled: activeSession.config.cacheBustToken !== undefined,
    queuedCount: activeSession.queued.length,
    observedCount: observed.length,
    loaderWallMs: settledAt === undefined ? undefined : rounded(settledAt - activeSession.startedAt),
    resourceSpanMs: earliestStart === undefined || latestResponseEnd === undefined
      ? undefined
      : rounded(latestResponseEnd - earliestStart),
    settleAfterLastResponseMs: settledAt === undefined || latestResponseEnd === undefined
      ? undefined
      : rounded(settledAt - latestResponseEnd),
    maxObservedNetworkConcurrency: resolveObservedNetworkConcurrency(observedTimings),
    transferKiB: roundedKiB(observedTimings.reduce((total, entry) => total + entry.transferSize, 0)),
    encodedKiB: roundedKiB(observedTimings.reduce((total, entry) => total + entry.encodedBodySize, 0)),
    cacheLikeCount: observedTimings.filter((entry) => entry.transferSize === 0 && entry.encodedBodySize > 0).length,
    protocols: [...new Set(observedTimings.map((entry) => entry.nextHopProtocol).filter(Boolean))].sort(),
    slowest,
  };
};

export const finalizeStartupArtDiagnostics = (): StartupArtDiagnosticsSnapshot | undefined => {
  if (!session) return undefined;
  session.settledAt = clockNow();
  session.snapshot = makeSnapshot(session, getResourceTimings());
  return session.snapshot;
};

export const getStartupArtDiagnosticsSnapshot = (): StartupArtDiagnosticsSnapshot | undefined => {
  if (!session) return undefined;
  return session.snapshot ?? makeSnapshot(session, getResourceTimings());
};
