import { describe, expect, it } from 'vitest';

import {
  StartupPreloadController,
  computeStartupFakeProgress,
  type StartupPreloadScheduler,
  type StartupPreloadSnapshot,
  type StartupPreloadView,
} from '../src/app/startupPreload';

interface ScheduledTask {
  at: number;
  callback: () => void;
  intervalMs: number | null;
}

class FakeScheduler implements StartupPreloadScheduler {
  private nowMs = 0;
  private nextHandle = 1;
  private readonly tasks = new Map<number, ScheduledTask>();

  public now(): number {
    return this.nowMs;
  }

  public setTimeout(callback: () => void, delayMs: number): number {
    return this.schedule(callback, delayMs, null);
  }

  public clearTimeout(handle: number): void {
    this.tasks.delete(handle);
  }

  public setInterval(callback: () => void, delayMs: number): number {
    return this.schedule(callback, delayMs, Math.max(1, delayMs));
  }

  public clearInterval(handle: number): void {
    this.tasks.delete(handle);
  }

  public advanceBy(deltaMs: number): void {
    const target = this.nowMs + Math.max(0, deltaMs);

    while (true) {
      let nextEntry: [number, ScheduledTask] | null = null;
      for (const entry of this.tasks.entries()) {
        if (entry[1].at > target) continue;
        if (!nextEntry || entry[1].at < nextEntry[1].at || (entry[1].at === nextEntry[1].at && entry[0] < nextEntry[0])) {
          nextEntry = entry;
        }
      }

      if (!nextEntry) break;
      const [handle, task] = nextEntry;
      this.nowMs = task.at;

      if (task.intervalMs === null) {
        this.tasks.delete(handle);
      } else {
        task.at += task.intervalMs;
      }

      task.callback();
    }

    this.nowMs = target;
  }

  public activeTaskCount(): number {
    return this.tasks.size;
  }

  private schedule(callback: () => void, delayMs: number, intervalMs: number | null): number {
    const handle = this.nextHandle;
    this.nextHandle += 1;
    this.tasks.set(handle, {
      at: this.nowMs + Math.max(0, delayMs),
      callback,
      intervalMs,
    });
    return handle;
  }
}

class RecordingView implements StartupPreloadView {
  public readonly snapshots: StartupPreloadSnapshot[] = [];

  public render(snapshot: StartupPreloadSnapshot): void {
    this.snapshots.push(snapshot);
  }
}

const createHarness = () => {
  const scheduler = new FakeScheduler();
  const view = new RecordingView();
  const controller = new StartupPreloadController(view, {}, scheduler);
  return { scheduler, view, controller };
};

describe('StartupPreloadController', () => {
  it('does not flash when real readiness arrives before the show delay', () => {
    const { scheduler, view, controller } = createHarness();

    controller.begin();
    scheduler.advanceBy(120);
    controller.complete();

    expect(controller.getPhase()).toBe('hidden');
    expect(controller.getProgress()).toBe(1);
    expect(view.snapshots.some((snapshot) => snapshot.phase === 'visible')).toBe(false);
    expect(scheduler.activeTaskCount()).toBe(0);
  });

  it('shows for a slow boot', () => {
    const { scheduler, controller } = createHarness();

    controller.begin();
    scheduler.advanceBy(199);
    expect(controller.getPhase()).toBe('pending-show');

    scheduler.advanceBy(1);
    expect(controller.getPhase()).toBe('visible');
    expect(controller.getProgress()).toBeGreaterThan(0.08);
    expect(controller.getProgress()).toBeLessThan(1);
  });

  it('completes to 100 percent and respects the minimum visible duration', () => {
    const { scheduler, controller } = createHarness();

    controller.begin();
    scheduler.advanceBy(200);
    scheduler.advanceBy(100);
    controller.complete();

    expect(controller.getPhase()).toBe('completing');
    expect(controller.getProgress()).toBe(1);

    scheduler.advanceBy(419);
    expect(controller.getPhase()).toBe('completing');

    scheduler.advanceBy(1);
    expect(controller.getPhase()).toBe('hidden');
    expect(scheduler.activeTaskCount()).toBe(0);
  });

  it('keeps repeated begin and complete calls idempotent', () => {
    const { scheduler, controller } = createHarness();

    controller.begin();
    controller.begin();
    scheduler.advanceBy(80);
    controller.complete();
    controller.complete();

    expect(controller.getPhase()).toBe('hidden');
    expect(scheduler.activeTaskCount()).toBe(0);
  });

  it('never lets fake progress reach the completion value', () => {
    expect(computeStartupFakeProgress(0)).toBeCloseTo(0.08);
    expect(computeStartupFakeProgress(1_200)).toBeCloseTo(0.65);
    expect(computeStartupFakeProgress(5_000)).toBeCloseTo(0.88);
    expect(computeStartupFakeProgress(120_000)).toBeLessThanOrEqual(0.92);
    expect(computeStartupFakeProgress(120_000)).toBeLessThan(1);
  });

  it('does not fail a legitimately slow 30-60 second mobile startup', () => {
    const { scheduler, controller } = createHarness();

    controller.begin();
    scheduler.advanceBy(60_000);

    expect(controller.getPhase()).toBe('visible');
    expect(controller.getProgress()).toBeLessThan(1);
  });

  it('shows an explicit failure state when startup exceeds the bounded timeout', () => {
    const { scheduler, controller } = createHarness();

    controller.begin();
    scheduler.advanceBy(90_000);

    expect(controller.getPhase()).toBe('failed');
    expect(controller.getProgress()).toBeLessThan(1);
    expect(scheduler.activeTaskCount()).toBe(0);
  });

  it('can recover if a real ready signal arrives after a timeout', () => {
    const { scheduler, controller } = createHarness();

    controller.begin();
    scheduler.advanceBy(90_000);
    expect(controller.getPhase()).toBe('failed');

    controller.complete();
    expect(controller.getPhase()).toBe('completing');
    expect(controller.getProgress()).toBe(1);

    scheduler.advanceBy(180);
    expect(controller.getPhase()).toBe('hidden');
  });

  it('clears scheduled work on destroy', () => {
    const { scheduler, controller } = createHarness();

    controller.begin();
    expect(scheduler.activeTaskCount()).toBeGreaterThan(0);

    controller.destroy();
    expect(controller.getPhase()).toBe('hidden');
    expect(scheduler.activeTaskCount()).toBe(0);
  });
});
