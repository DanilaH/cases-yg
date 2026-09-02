export type AnalyticsParams = Readonly<Record<string, boolean | number | string>>;

export interface AnalyticsAdapter {
  track(event: string, params?: AnalyticsParams): void;
}

export class ConsoleAnalyticsAdapter implements AnalyticsAdapter {
  public track(event: string, params?: AnalyticsParams): void {
    if (import.meta.env.DEV || new URLSearchParams(window.location.search).has('debug')) {
      console.info('[analytics]', event, params ?? {});
    }
  }
}

type MetricaFunction = ((...args: unknown[]) => void) & {
  a?: unknown[][];
  l?: number;
};

type MetricaWindow = Window & {
  ym?: MetricaFunction;
};

const METRICA_SCRIPT_BASE = 'https://mc.yandex.ru/metrika/tag.js';

const installMetricaFunction = (): MetricaFunction => {
  const target = window as MetricaWindow;
  if (target.ym) return target.ym;

  const queued: MetricaFunction = (...args: unknown[]): void => {
    queued.a ??= [];
    queued.a.push(args);
  };
  queued.l = Date.now();
  target.ym = queued;
  return queued;
};

export const installYandexMetricaTag = (counterId: number): void => {
  const ym = installMetricaFunction();
  const scriptSrc = `${METRICA_SCRIPT_BASE}?id=${counterId}`;
  const alreadyInstalled = Array.from(document.scripts).some((script) => script.src.startsWith(METRICA_SCRIPT_BASE));

  if (!alreadyInstalled) {
    const script = document.createElement('script');
    script.src = scriptSrc;
    script.async = true;
    document.head.append(script);
  }

  ym(counterId, 'init', {
    clickmap: false,
    trackLinks: false,
    accurateTrackBounce: true,
  });
};

export class MetricaAnalyticsAdapter implements AnalyticsAdapter {
  public constructor(
    private readonly counterId: number,
    private readonly fallback: AnalyticsAdapter = new ConsoleAnalyticsAdapter(),
  ) {}

  public track(event: string, params?: AnalyticsParams): void {
    this.fallback.track(event, params);
    const ym = (window as MetricaWindow).ym;
    if (!ym) return;

    try {
      ym(this.counterId, 'reachGoal', event, params ?? {});
    } catch (error: unknown) {
      console.warn('[analytics] Yandex Metrica reachGoal failed', event, error);
    }
  }
}

export const createYandexAnalyticsAdapter = (): AnalyticsAdapter => {
  const rawCounterId = import.meta.env.VITE_YANDEX_METRICA_ID?.trim();
  if (!rawCounterId) return new ConsoleAnalyticsAdapter();

  const counterId = Number(rawCounterId);
  if (!Number.isSafeInteger(counterId) || counterId <= 0) {
    console.warn('[analytics] ignoring invalid VITE_YANDEX_METRICA_ID');
    return new ConsoleAnalyticsAdapter();
  }

  installYandexMetricaTag(counterId);
  return new MetricaAnalyticsAdapter(counterId);
};
