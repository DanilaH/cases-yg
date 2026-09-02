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
