import { SLICE_BALANCE } from '../game/data/balance';
import { SaveRepository, type SaveState } from '../game/systems/save';
import type { PlatformRuntime } from '../platform/yandex';

const DEBUG_SIGNAL_REWARD = 25;

const addDebugSignal = (state: SaveState, amount: number): SaveState => {
  const threshold = SLICE_BALANCE.signal.threshold;
  const signal = Math.min(threshold, state.signal + amount);
  const pendingReveal = state.pendingReveal
    ? {
        ...state.pendingReveal,
        commit: {
          ...state.pendingReveal.commit,
          signal: Math.min(threshold, state.pendingReveal.commit.signal + amount),
        },
      }
    : null;

  return { ...state, signal, pendingReveal };
};

export const createDebugPanel = (platform: PlatformRuntime): (() => void) => {
  const params = new URLSearchParams(window.location.search);
  if (!import.meta.env.DEV && !params.has('debug')) {
    return () => undefined;
  }

  let rewardSequence = 0;
  const panel = document.createElement('aside');
  panel.className = 'mpt-debug-panel';
  panel.innerHTML = `<strong>Platform: ${platform.kind}</strong><span data-status>ready</span>`;
  const status = panel.querySelector<HTMLElement>('[data-status]');

  const addButton = (label: string, action: () => Promise<unknown>): void => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = label;
    button.addEventListener('click', () => {
      if (status) status.textContent = `${label}…`;
      void action()
        .then((result) => {
          if (status) status.textContent = JSON.stringify(result);
        })
        .catch((error: unknown) => {
          if (status) status.textContent = error instanceof Error ? error.message : String(error);
        });
    });
    panel.append(button);
  };

  addButton('Interstitial', () => platform.ads.showInterstitial());
  addButton('Rewarded +25 Signal', () => {
    rewardSequence += 1;
    const rewardId = `debug-signal-${Date.now()}-${rewardSequence}`;
    return platform.ads.showRewarded({
      rewardId,
      onReward: async () => {
        const repository = new SaveRepository(platform.storage);
        const current = await repository.load();
        const next = addDebugSignal(current, DEBUG_SIGNAL_REWARD);
        await repository.write(next);
        platform.analytics.track('debug_signal_reward', {
          amount: DEBUG_SIGNAL_REWARD,
          rewardId,
          signalAfter: next.signal,
        });
      },
    });
  });
  addButton('Sticky: show', () => platform.ads.setStickyBannerVisible(true));
  addButton('Sticky: hide', () => platform.ads.setStickyBannerVisible(false));

  document.body.append(panel);
  return () => panel.remove();
};
