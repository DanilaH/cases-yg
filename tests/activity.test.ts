import { describe, expect, it, vi } from 'vitest';

import { GameplayActivityCoordinator } from '../src/platform/activity';

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

  it('emits blocked changes only when aggregate blocked state changes', () => {
    const activity = new GameplayActivityCoordinator(() => undefined, () => undefined);
    const listener = vi.fn();
    activity.onBlockedChange(listener);

    activity.setBlocked('ad', true);
    activity.setBlocked('platform', true);
    activity.setBlocked('ad', false);
    activity.setBlocked('platform', false);

    expect(listener.mock.calls).toEqual([[true], [false]]);
  });
});
