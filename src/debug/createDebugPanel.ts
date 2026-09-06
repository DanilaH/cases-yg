import { LITE_V2_BALANCE } from '../game/data/balance';
import { SaveRepository, type SaveState } from '../game/systems/save';
import type { PlatformRuntime } from '../platform/yandex';
import { resetDebugSave, seedDebugCollection, stageDebugReveal, type DebugRevealScenario } from './debugScenarios';

const DEBUG_CHIPS_REWARD = LITE_V2_BALANCE.pouchProfiles.charged.chipsCost;

const addDebugChips = (state: SaveState, amount: number): SaveState => {
  const pendingReveal = state.pendingReveal
    ? {
        ...state.pendingReveal,
        chips: {
          ...state.pendingReveal.chips,
          before: state.pendingReveal.chips.before + amount,
          after: state.pendingReveal.chips.after + amount,
        },
        commit: {
          ...state.pendingReveal.commit,
          chips: state.pendingReveal.commit.chips + amount,
        },
      }
    : null;

  return { ...state, chips: state.chips + amount, pendingReveal };
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
  addButton('Force Legendary (Charged)', () => stageAndReload('legendary'));
  addButton('Force Duplicate', () => stageAndReload('duplicate'));
  addButton('Reach SIGNAL LOCK', () => stageAndReload('signal-lock-reached'));
  addButton('Consume SIGNAL LOCK', () => stageAndReload('signal-lock-consumed'));
  addButton('SIGNAL LOCK waiting for Charged', () => stageAndReload('signal-lock-waiting'));
  addButton('Force Hidden Pocket', () => stageAndReload('hidden-pocket'));

  addLabel('Collection/save');
  addButton('Seed standards 8/8', () => mutateAndReload(() => seedDebugCollection(repository, 'standard')));
  addButton('Seed all 8/8 + 2/2', () => mutateAndReload(() => seedDebugCollection(repository, 'all')));
  addButton('Reset save', () => mutateAndReload(() => resetDebugSave(repository)));

  addLabel('Yandex ads');
  addButton(`Rewarded +${DEBUG_CHIPS_REWARD} DEV CHIPS`, () => {
    rewardSequence += 1;
    const rewardId = `debug-chips-${Date.now()}-${rewardSequence}`;
    return platform.ads.showRewarded({
      rewardId,
      onReward: async () => {
        const current = await repository.load();
        const next = addDebugChips(current, DEBUG_CHIPS_REWARD);
        await repository.write(next);
        platform.analytics.track('debug_chips_reward', {
          amount: DEBUG_CHIPS_REWARD,
          rewardId,
          chipsAfter: next.chips,
        });
      },
    });
  });
  addButton('Interstitial', () => platform.ads.showInterstitial());
  addButton('Sticky: show', () => platform.ads.setStickyBannerVisible(true));
  addButton('Sticky: hide', () => platform.ads.setStickyBannerVisible(false));

  document.body.append(panel);
  return () => panel.remove();
};
