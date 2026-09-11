import { readFile, writeFile } from 'node:fs/promises';

const replaceOnce = (source, before, after, label) => {
  const first = source.indexOf(before);
  if (first < 0) throw new Error(`Missing patch anchor: ${label}`);
  if (source.indexOf(before, first + before.length) >= 0) throw new Error(`Ambiguous patch anchor: ${label}`);
  return source.slice(0, first) + after + source.slice(first + before.length);
};

const patchFile = async (path, patches) => {
  let source = await readFile(path, 'utf8');
  for (const [before, after, label] of patches) source = replaceOnce(source, before, after, label);
  await writeFile(path, source);
};

await patchFile('src/game/scenes/OpeningScene.ts', [
  [
`      const pending = await this.session.prepareReveal(this.selectedPouchType);\n      if (this.isSceneShutdown()) return;\n      this.lastReveal = pending;\n      if (firstInteraction && pending.openingNumber === 1) {`,
`      const pending = await this.session.prepareReveal(this.selectedPouchType);\n      if (this.isSceneShutdown()) return;\n      this.lastReveal = pending;\n      getPlatformRuntime().analytics.track('opening_started', {\n        openingNumber: pending.openingNumber,\n        lootPoolId: pending.lootPoolId,\n        pouchType: pending.pouchType,\n      });\n      if (firstInteraction && pending.openingNumber === 1) {`,
    'opening_started',
  ],
  [
`    this.selectedPouchType = pouchType;\n    getGameAudio().play('pouch-select');`,
`    this.selectedPouchType = pouchType;\n    getPlatformRuntime().analytics.track('pouch_selected', {\n      pouchType,\n      lootPoolId: this.getDisplayedLootPoolId(),\n      chips: this.saveState.chips,\n    });\n    getGameAudio().play('pouch-select');`,
    'pouch_selected',
  ],
  [
`    this.resultCarouselDrag = null;\n    const pending = this.lastReveal;\n    void this.animateRewardBanking(pending).catch((error: unknown) => {`,
`    this.resultCarouselDrag = null;\n    const pending = this.lastReveal;\n    getPlatformRuntime().analytics.track('result_collected', {\n      openingNumber: pending.openingNumber,\n      lootPoolId: pending.lootPoolId,\n      pouchType: pending.pouchType,\n      rarity: pending.standard.rarity,\n      isNew: pending.standard.isNew,\n      hiddenPocket: pending.hiddenPocket !== null,\n      startPage: pending.hiddenPocket && this.resultCarouselIndex === 1 ? 'secret' : 'standard',\n    });\n    void this.animateRewardBanking(pending).catch((error: unknown) => {`,
    'result_collected',
  ],
]);

await patchFile('src/game/scenes/CollectionScene.ts', [
  [
`      getGameAudio().play('ui-click');\n      this.view = view;\n      this.render();`,
`      getGameAudio().play('ui-click');\n      this.view = view;\n      getPlatformRuntime().analytics.track('collection_view_changed', {\n        view,\n        lootPoolId: this.selectedLootPoolId(),\n      });\n      this.render();`,
    'collection_view_changed',
  ],
  [
`    this.page = nextPage;\n    this.dropBrowseInFlight = false;\n    this.render();`,
`    this.page = nextPage;\n    this.dropBrowseInFlight = false;\n    getPlatformRuntime().analytics.track('collection_drop_browsed', {\n      lootPoolId: nextPoolId,\n      view: this.view,\n      direction,\n    });\n    this.render();`,
    'collection_drop_browsed',
  ],
]);

await patchFile('src/platform/yandex.ts', [
  [
`  const analytics = new ConsoleAnalyticsAdapter();\n  const removeVisibilityBridge = installVisibilityBridge(activity);\n\n  return {`,
`  const analytics = new ConsoleAnalyticsAdapter();\n  const removeVisibilityBridge = installVisibilityBridge(activity);\n  let readySent = false;\n\n  return {`,
    'mock ready guard state',
  ],
  [
`    markReady: () => analytics.track('platform_ready', { platform: 'mock' }),`,
`    markReady: () => {\n      if (readySent) return;\n      readySent = true;\n      analytics.track('platform_ready', { platform: 'mock' });\n    },`,
    'mock platform_ready one-shot',
  ],
]);

await writeFile('tests/analytics.test.ts', `import { afterEach, describe, expect, it, vi } from 'vitest';\n\nimport { MetricaAnalyticsAdapter } from '../src/platform/analytics';\n\ndescribe('MetricaAnalyticsAdapter', () => {\n  afterEach(() => {\n    vi.unstubAllGlobals();\n  });\n\n  it('forwards gameplay events and params to Yandex Metrica reachGoal', () => {\n    const ym = vi.fn();\n    const fallback = { track: vi.fn() };\n    vi.stubGlobal('window', { ym });\n\n    const adapter = new MetricaAnalyticsAdapter(123456, fallback);\n    const params = { openingNumber: 7, pouchType: 'charged', isNew: true };\n\n    adapter.track('opening_started', params);\n\n    expect(fallback.track).toHaveBeenCalledWith('opening_started', params);\n    expect(ym).toHaveBeenCalledWith(123456, 'reachGoal', 'opening_started', params);\n  });\n\n  it('keeps the fallback path working when Metrica is unavailable', () => {\n    const fallback = { track: vi.fn() };\n    vi.stubGlobal('window', {});\n\n    const adapter = new MetricaAnalyticsAdapter(123456, fallback);\n    adapter.track('result_collected', { openingNumber: 3 });\n\n    expect(fallback.track).toHaveBeenCalledWith('result_collected', { openingNumber: 3 });\n  });\n});\n`);

await writeFile('docs/ANALYTICS_EVENTS.md', `# Analytics event contract\n\nThe production analytics boundary is \`PlatformRuntime.analytics.track(event, params)\`. When \`VITE_YANDEX_METRICA_ID\` is configured, \`MetricaAnalyticsAdapter\` forwards the same event name and params to Yandex Metrica as \`reachGoal\`. No event in this contract should contain PII.\n\n## Core activation / opening funnel\n\n- \`platform_ready\` — one-shot runtime-ready marker; aligned with Yandex \`LoadingAPI.ready()\`.\n- \`first_package_interaction\` — first successful package interaction for a new save.\n- \`pouch_selected\` — player explicitly changes Basic/Charged selection; params include \`pouchType\`, \`lootPoolId\`, and current \`chips\`.\n- \`opening_started\` — durable reveal preparation succeeded; params include \`openingNumber\`, \`lootPoolId\`, and \`pouchType\`.\n- \`reveal_complete\` — opening result has committed and reached the result state; includes rarity/newness, pouch/drop, CHIPS, Signal, Overcharge, cache and Hidden Pocket outcome fields.\n- \`result_collected\` — player accepts the resolved result and starts banking it; includes opening/drop/pouch, rarity/newness, Hidden Pocket presence, and whether banking starts from the standard or Secret page.\n\nRecommended activation funnel:\n\n\`platform_ready → first_package_interaction → opening_started → reveal_complete → result_collected\`\n\n## Drop / collection exploration\n\n- \`drop_selected\` — durable active Drop changes; \`source\` distinguishes Opening from Collection.\n- \`collection_open\` — Collection scene opened with global standard/Secret counts.\n- \`collection_view_changed\` — Shelf/Library switch with the currently browsed Drop.\n- \`collection_drop_browsed\` — local Collection Drop paging; params include Drop, current view and direction.\n- \`collection_return\` — return from Collection to Opening with view, Drop and current standard progress.\n\n## Reward / progression\n\n- \`signal_lock_reached\`\n- \`signal_lock_consumed\`\n- \`signal_lock_retained\`\n- \`overcharge_gained\`\n- \`overcharge_cashed_out\`\n- \`chips_cache_hit\`\n- \`hidden_pocket_triggered\`\n- \`secret_discovered\` / \`secret_duplicate\`\n- \`standard_collection_complete\`\n- \`pending_reveal_recovered\`\n\n## Platform / ads diagnostics\n\n- \`platform_pause\` / \`platform_resume\`\n- \`ad_interstitial_request\`, \`ad_interstitial_open\`, \`ad_interstitial_close\`, \`ad_interstitial_error\`\n- \`ad_rewarded_request\`, \`ad_rewarded_open\`, \`ad_rewarded_grant\`, \`ad_rewarded_close\`, \`ad_rewarded_error\`\n- \`ad_sticky_change\`\n\nThese ad events currently validate the adapter and debug probes. Normal-player monetization CTA placement is a separate product decision.\n\n## Useful funnels / cuts\n\n- Charged adoption: \`pouch_selected(pouchType=charged) → opening_started(pouchType=charged) → reveal_complete\`.\n- Result acceptance: \`opening_started → reveal_complete → result_collected\`.\n- Secret loop: \`hidden_pocket_triggered → secret_discovered|secret_duplicate → result_collected\`.\n- Meta engagement: \`collection_open → collection_view_changed|collection_drop_browsed → collection_return\`.\n\nThe event contract is intentionally compact. Add events only when they answer a concrete product, economy, retention, or monetization question.\n`);
