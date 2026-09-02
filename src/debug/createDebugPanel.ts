import type { PlatformRuntime } from '../platform/yandex';

export const createDebugPanel = (platform: PlatformRuntime): (() => void) => {
  const params = new URLSearchParams(window.location.search);
  if (!import.meta.env.DEV && !params.has('debug')) {
    return () => undefined;
  }

  let debugRewards = 0;
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
  addButton('Rewarded', () =>
    platform.ads.showRewarded({
      rewardId: 'debug-reward',
      onReward: () => {
        debugRewards += 1;
        if (status) status.textContent = `reward callback ×${debugRewards}`;
      },
    }),
  );
  addButton('Sticky: show', () => platform.ads.setStickyBannerVisible(true));
  addButton('Sticky: hide', () => platform.ads.setStickyBannerVisible(false));

  document.body.append(panel);
  return () => panel.remove();
};
