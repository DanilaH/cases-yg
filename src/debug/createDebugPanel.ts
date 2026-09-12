import { LITE_V2_BALANCE } from '../game/data/balance';
import { SaveRepository, type SaveState } from '../game/systems/save';
import type { PlatformRuntime } from '../platform/yandex';
import { resetDebugSave, seedDebugCollection, stageDebugReveal, type DebugRevealScenario } from './debugScenarios';

const DEBUG_CHIPS_REWARD = LITE_V2_BALANCE.pouchProfiles.charged.chipsCost;
const DEBUG_PANEL_COLLAPSED_KEY = 'mystery-pocket-tech.debug-panel-collapsed';

const readCollapsedPreference = (): boolean => {
  try {
    return window.sessionStorage.getItem(DEBUG_PANEL_COLLAPSED_KEY) === '1';
  } catch {
    return false;
  }
};

const writeCollapsedPreference = (collapsed: boolean): void => {
  try {
    window.sessionStorage.setItem(DEBUG_PANEL_COLLAPSED_KEY, collapsed ? '1' : '0');
  } catch {
    // Debug convenience only; storage restrictions must never affect the game.
  }
};

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
  // Internal save/reveal/ad controls must never be reachable in a production
  // moderation or public build through a query-string switch.
  if (!import.meta.env.DEV) {
    return () => undefined;
  }

  let rewardSequence = 0;
  const repository = new SaveRepository(platform.storage);
  const panel = document.createElement('aside');
  panel.className = 'mpt-debug-panel';

  const header = document.createElement('div');
  header.className = 'mpt-debug-panel__header';

  const meta = document.createElement('div');
  meta.className = 'mpt-debug-panel__meta';
  const platformLabel = document.createElement('strong');
  platformLabel.textContent = `Platform: ${platform.kind}`;
  const status = document.createElement('span');
  status.dataset.status = '';
  status.textContent = 'ready';
  meta.append(platformLabel, status);

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'mpt-debug-panel__toggle';
  toggle.setAttribute('aria-controls', 'mpt-debug-panel-body');

  header.append(meta, toggle);
  panel.append(header);

  const body = document.createElement('div');
  body.id = 'mpt-debug-panel-body';
  body.className = 'mpt-debug-panel__body';
  panel.append(body);

  const setCollapsed = (collapsed: boolean): void => {
    panel.classList.toggle('is-collapsed', collapsed);
    body.hidden = collapsed;
    meta.hidden = collapsed;
    toggle.textContent = collapsed ? 'DEBUG' : 'Hide';
    toggle.title = collapsed ? 'Show debug panel' : 'Hide debug panel';
    toggle.setAttribute('aria-expanded', String(!collapsed));
    writeCollapsedPreference(collapsed);
  };

  toggle.addEventListener('click', () => {
    setCollapsed(!panel.classList.contains('is-collapsed'));
  });

  const addLabel = (text: string): void => {
    const label = document.createElement('span');
    label.textContent = text;
    label.style.fontWeight = '700';
    label.style.marginTop = '4px';
    body.append(label);
  };

  const addButton = (label: string, action: () => Promise<unknown>): void => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = label;
    button.addEventListener('click', () => {
      status.textContent = `${label}…`;
      void action()
        .then((result) => {
          status.textContent = JSON.stringify(result);
        })
        .catch((error: unknown) => {
          status.textContent = error instanceof Error ? error.message : String(error);
        });
    });
    body.append(button);
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
  addButton('Force Hidden Pocket Duplicate', () => stageAndReload('hidden-pocket-duplicate'));

  addLabel('Collection/save');
  addButton('Seed standards 8/8', () => mutateAndReload(() => seedDebugCollection(repository, 'standard')));
  addButton('Seed all 8/8 + 2/2', () => mutateAndReload(() => seedDebugCollection(repository, 'all')));
  addButton('Reset save', () => mutateAndReload(() => resetDebugSave(repository)));

  addLabel('Yandex ads');
  addButton(`Rewarded +${DEBUG_CHIPS_REWARD} DEV CHIPS`, async () => {
    rewardSequence += 1;
    const rewardId = `debug-chips-${Date.now()}-${rewardSequence}`;
    const result = await platform.ads.showRewarded({
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

    // OpeningSession intentionally caches its transactional base state. The debug
    // rewarded probe writes through a separate repository, so reload after a durable
    // grant before any next pouch can stage from stale in-memory CHIPS and overwrite it.
    if (result.rewardEarned) {
      window.setTimeout(() => window.location.reload(), 80);
    }
    return result;
  });
  addButton('Interstitial', () => platform.ads.showInterstitial());
  addButton('Sticky: show', () => platform.ads.setStickyBannerVisible(true));
  addButton('Sticky: hide', () => platform.ads.setStickyBannerVisible(false));

  setCollapsed(readCollapsedPreference());
  document.body.append(panel);
  return () => panel.remove();
};