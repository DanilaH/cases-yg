import { describe, expect, it } from 'vitest';

import {
  beginStartupArtDiagnostics,
  buildStartupArtExperimentUrl,
  parseStartupArtExperimentConfig,
  prepareStartupArtRequest,
} from '../src/app/startupArtDiagnostics';

describe('startup art diagnostics', () => {
  it('accepts only the controlled loader concurrency candidates', () => {
    expect(parseStartupArtExperimentConfig('?artConcurrency=12&artRun=abc')).toEqual({
      concurrencyOverride: 12,
      cacheBustToken: 'abc',
    });
    expect(parseStartupArtExperimentConfig('?artConcurrency=7')).toEqual({
      concurrencyOverride: undefined,
      cacheBustToken: undefined,
    });
    expect(parseStartupArtExperimentConfig('?artConcurrency=32')).toEqual({
      concurrencyOverride: 32,
      cacheBustToken: undefined,
    });
  });

  it('ignores experiment query params when diagnostics are disabled', () => {
    expect(parseStartupArtExperimentConfig('?artConcurrency=16&artRun=cold', false)).toEqual({
      concurrencyOverride: undefined,
      cacheBustToken: undefined,
    });
  });

  it('builds cold-probe URLs without dropping unrelated cache-bust params', () => {
    const candidate = new URL(buildStartupArtExperimentUrl(
      'https://example.test/game?v=build123&foo=bar',
      24,
      'run-1',
    ));
    expect(candidate.searchParams.get('v')).toBe('build123');
    expect(candidate.searchParams.get('foo')).toBe('bar');
    expect(candidate.searchParams.get('artConcurrency')).toBe('24');
    expect(candidate.searchParams.get('artRun')).toBe('run-1');

    const control = new URL(buildStartupArtExperimentUrl(candidate.toString(), undefined, 'run-2'));
    expect(control.searchParams.has('artConcurrency')).toBe(false);
    expect(control.searchParams.get('artRun')).toBe('run-2');
  });

  it('cache-busts only startup art requests when a cold probe token is active', () => {
    beginStartupArtDiagnostics(12, { concurrencyOverride: 12, cacheBustToken: 'cold run' });
    expect(prepareStartupArtRequest('collectible-a', '/assets/a.webp')).toBe('/assets/a.webp?artRun=cold%20run');
    expect(prepareStartupArtRequest('collectible-b', '/assets/b.webp?variant=1')).toBe(
      '/assets/b.webp?variant=1&artRun=cold%20run',
    );
  });
});
