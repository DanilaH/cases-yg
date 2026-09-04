import { SLICE_BALANCE } from '../game/data/balance';
import { SaveRepository, type SaveState } from '../game/systems/save';
import type { PlatformRuntime } from '../platform/yandex';
import { resetDebugSave, seedDebugCollection, stageDebugReveal, type DebugRevealScenario } from './debugScenarios';

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
  const repository = new SaveRepository(platform.storage);
  const panel = document.createElement('aside');
  panel.className = 'mpt-debug-panel';
  panel.innerHTML = `<strong>Platform: ${platform.kind}</strong><span data-status>ready</span>`;
  const status = panel.querySelector<HTMLElement>('[data-status]');

  const addLabel = (text: string): void => {
    const label = document.createElement('span');
    label.textContent = text;
    label.style.fontWeight = '700';
    label.style.marginTop = '4px';
    panel.append(label);
  };

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

  const stageAndReload = async (scenario: DebugRevealScenario): Promise<{ scenario: DebugRevealScenario }> => {
    await stageDebugReveal(repository, scenario);
    window.setTimeout(() => window.location.reload(), 80);
    return { scenario };
  };

  const mutateAndReload = async (action: () => Promise<unknown>): Promise<{ reload: true }> => {
    await action();
    window.setTimeout(() => window.location.reload(), 80);
    return { reload: true };
  };

  addLabel('Reveal scenarios');
  addButton('Force Common', () => stageAndReload('common'));
  addButton('Force Rare', () => stageAndReload('rare'));
  addButton('Force Epic', () => stageAndReload('epic'));
  addButton('Force Epic Phone', () => stageAndReload('epic-phone'));
  addButton('Force Legendary', () => stageAndReload('legendary'));
  addButton('Force Duplicate', () => stageAndReload('duplicate'));
  addButton('Reach SIGNAL LOCK', () => stageAndReload('signal-lock-reached'));
  addButton('Consume SIGNAL LOCK', () => stageAndReload('signal-lock-consumed'));
  addButton('Force Hidden Pocket', () => stageAndReload('hidden-pocket'));

  addLabel('Collection/save');
  addButton('Seed standards 8/8', () => mutateAndReload(() => seedDebugCollection(repository, 'standard')));
  addButton('Seed all 8/8 + 2/2', () => mutateAndReload(() => seedDebugCollection(repository, 'all')));
  addButton('Reset save', () => mutateAndReload(() => resetDebugSave(repository)));

  addLabel('Yandex ads');
  addButton('Interstitial', () => platform.ads.showInterstitial());
  addButton('Rewarded +25 Signal', () => {
    rewardSequence += 1;
    const rewardId = `debug-signal-${Date.now()}-${rewardSequence}`;
    return platform.ads.showRewarded({
      rewardId,
      onReward: async () => {
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