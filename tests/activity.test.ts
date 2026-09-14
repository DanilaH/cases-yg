import { describe, expect, it, vi } from 'vitest';

import { GameplayActivityCoordinator, shouldSuspendRuntimeLoop } from '../src/platform/activity';

describe('GameplayActivityCoordinator', () => {
  it('does not resume until every blocker is removed', () => {
    const start = vi.fn();
    const stop = vi.fn();
    const activity = new GameplayActivityCoordinator(start, stop);

    activity.setGameplayDesired(true);
    expect(start).toHaveBeenCalledTimes(1);

    activity.setBlocked('ad', true);
    activity.setBlocked('platform', true);
    expect(stop).toHaveBeenCalledTimes(1);

    activity.setBlocked('ad', false);
    expect(start).toHaveBeenCalledTimes(1);

    activity.setBlocked('platform', false);
    expect(start).toHaveBeenCalledTimes(2);
  });

  it('keeps gameplay stopped when the scene no longer wants gameplay', () => {
    const start = vi.fn();
    const stop = vi.fn();
    const activity = new GameplayActivityCoordinator(start, stop);

    activity.setGameplayDesired(true);
    activity.setBlocked('visibility', true);
    activity.setGameplayDesired(false);
    activity.setBlocked('visibility', false);

    expect(start).toHaveBeenCalledTimes(1);
    expect(stop).toHaveBeenCalledTimes(1);
  });

  it('replays the current blocked state to a late subscriber', () => {
    const activity = new GameplayActivityCoordinator(() => undefined, () => undefined);
    activity.setBlocked('platform', true);

    const listener = vi.fn();
    activity.onBlockedChange(listener);

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenLastCalledWith(true);

    activity.setBlocked('platform', false);
    expect(listener.mock.calls).toEqual([[true], [false]]);
  });

  it('emits aggregate blocked changes only when aggregate state changes', () => {
    const activity = new GameplayActivityCoordinator(() => undefined, () => undefined);
    const listener = vi.fn();
    activity.onBlockedChange(listener);

    activity.setBlocked('ad', true);
    activity.setBlocked('platform', true);
    activity.setBlocked('ad', false);
    activity.setBlocked('platform', false);

    expect(listener.mock.calls).toEqual([[false], [true], [false]]);
  });

  it('replays blocker-level changes even while aggregate blocked state stays true', () => {
    const activity = new GameplayActivityCoordinator(() => undefined, () => undefined);
    const snapshots: string[][] = [];
    activity.onBlockersChange((blockers) => snapshots.push([...blockers].sort()));

    activity.setBlocked('orientation', true);
    activity.setBlocked('visibility', true);
    activity.setBlocked('visibility', false);
    activity.setBlocked('orientation', false);

    expect(snapshots).toEqual([
      [],
      ['orientation'],
      ['orientation', 'visibility'],
      ['orientation'],
      [],
    ]);
  });

  it('keeps orientation as a presentation-only blocker for the Phaser loop', () => {
    expect(shouldSuspendRuntimeLoop(new Set(['orientation']))).toBe(false);
    expect(shouldSuspendRuntimeLoop(new Set(['orientation', 'visibility']))).toBe(true);
    expect(shouldSuspendRuntimeLoop(new Set(['ad']))).toBe(true);
    expect(shouldSuspendRuntimeLoop(new Set(['platform']))).toBe(true);
    expect(shouldSuspendRuntimeLoop(new Set())).toBe(false);
  });
});
