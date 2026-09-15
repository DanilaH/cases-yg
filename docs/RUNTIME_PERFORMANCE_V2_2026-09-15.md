# Signal 2000 — Runtime Performance V2

Date: 2026-09-15
Base: `main` at `a82380d21153b4584cea20b818afa3a42a247135`

> **2026-09-15 product correction:** the Phase D bounded post-Ready warmup/runtime-loading strategy described below was implemented and then superseded by the explicit zero-runtime-loading decision. Signal 2000 now treats every reviewed image reachable during a session as startup-critical Phaser art. See `ZERO_RUNTIME_LOADING_2026-09-15.md`. The instrumentation, mirrored-save read reuse and parallel Yandex bootstrap parts of this document remain current.

## Goal

Reduce time-to-usable-game, avoid unnecessary mobile network traffic, and create performance seams that can be reused by later Yandex Games projects without changing Signal 2000 gameplay, economy, RNG, save semantics, onboarding semantics, tear geometry, ads, or reward ownership.

## Baseline evidence

The current production build is dominated by authored image content, but the next optimization layer is not another blind image-compression pass:

- Vite reports the main JS chunk at roughly 1.63 MB raw / 426 KB gzip.
- Runtime audio samples are small relative to images.
- `BootScene` and `OpeningScene` both load through the same cloud-backed save abstraction during startup.
- `YandexCloudSaveStorageAdapter.getItem(syncKey)` performs a Player Data reconciliation on every save read.
- `createYandexPlatform()` currently awaits `getStorage()` and then `getPlayer()` sequentially even though they are independent after `YaGames.init()`.
- background warmup currently prefetches the entire reviewed image catalog after Game Ready, including Drops the player may never visit.
- active-Drop collectible decoding and texture eviction remain separate, higher-risk work because reveal recovery and placeholder-free presentation must stay exact.

## Planned implementation

### Phase A — measurable startup

Add a tiny startup-performance recorder with named marks for platform bootstrap, save resolution, active-art readiness, and semantic Game Ready. Emit one bounded `startup_performance` analytics event at Game Ready and expose the snapshot in debug hosts.

The tracker is diagnostic only. It owns no gameplay or readiness semantics.

### Phase B — eliminate repeated cloud reads inside one resolved session

Add a session-local resolved-read cache only for the mirrored gameplay save key.

Rules:

- the first `getItem(syncKey)` still reconciles local and cloud copies exactly as today;
- repeated reads reuse the already reconciled raw value;
- any `setItem(syncKey, ...)` or `removeItem(syncKey)` invalidates the cache before attempting mutation;
- a failed local mutation therefore cannot be hidden by a stale optimistic cache;
- successful writes refresh the resolved cache with the value that is now authoritative locally;
- unrelated settings keys are never cached by this mechanism.

This is deliberately below `SaveRepository`, so Boot -> Opening repeated loads stop re-querying Player Data without changing save parsing, migration, recovery, pending-reveal verification, or transaction code.

### Phase C — parallelize independent Yandex bootstrap work

After `YaGames.init()` and pause/resume listener installation, start `sdk.getStorage()` and `sdk.getPlayer()` concurrently.

`getStorage()` remains mandatory. Player Data remains optional: if it fails, startup continues with safeStorage exactly as before.

Do not move pause/resume listener installation later and do not call Game Ready earlier.

### Phase D — historical bounded near-future warmup (superseded)

This phase originally changed full-catalog speculative warmup to active-Drop + Collection warmup and retained runtime image loading for other Drops.

That implementation was technically correct but conflicts with the later product decision that **no loader or wait-state may occur inside gameplay**. It is no longer the production policy.

Current replacement:

`complete reviewed Phaser image preload -> save resolution -> playable scene -> Game Ready -> no runtime image network path`

See `ZERO_RUNTIME_LOADING_2026-09-15.md` for the canonical contract and acceptance rules.

### Phase E — follow-up after measurements

Do not combine these into the first implementation unless evidence justifies them:

- texture residency / LRU eviction;
- alpha-trim metadata pipeline;
- custom/slim Phaser build;
- HTML-level early Yandex SDK fetch;
- service worker / explicit persistent asset cache.

The earlier exact-collectible-on-demand loading idea is incompatible with the current zero-runtime-loading product contract unless it can be proven to require no post-Ready network/decode wait. It is therefore not a current production direction.

## Independent plan review

The first review intentionally deferred texture eviction, exact collectible decoding, audio preload changes and service-worker caching because each added lifecycle or invalidation risk.

After real product acceptance rejected in-game loaders, a second review changed the asset policy again:

1. **Do not hide the loader while preserving runtime requests.** An invisible stall is still a broken interaction.
2. **Do not use prefetch as correctness.** Browser cache retention is advisory and may be evicted.
3. **Pay the complete image readiness cost under the startup loader.** The earlier asset-budget pass makes this a reasonable production experiment.
4. **Move memory optimization to a separate pass.** Tight alpha cropping with preserved logical frame metadata is the next preferred way to reduce the residency cost without changing the no-loader contract.
5. **No service worker yet.** Public asset URLs remain stable/non-hashed, so durable CacheStorage would introduce stale-version risk.

## Acceptance

Automated performance/bootstrap acceptance remains:

- typecheck passes;
- full Vitest suite passes;
- asset self-test passes;
- asset validation passes;
- production build passes;
- repeated mirrored save reads do not repeat Player Data reads;
- a failed mutation invalidates the read cache;
- Yandex safeStorage and Player acquisition begin concurrently.

The current image-loading acceptance is owned by `ZERO_RUNTIME_LOADING_2026-09-15.md`.

Hosted / real-device:

- no change to first-run/recovery/reveal behavior;
- no placeholder leak on successful asset loading;
- no change to Drop selection semantics;
- startup still reaches semantic Game Ready only after a usable frame;
- debug host exposes startup phase timing;
- no in-game asset loading surface appears while switching Drops, pouch variants, Collection pages or reveal states.

## Reuse decision

If the Signal implementation validates cleanly in Yandex DRAFT, mirror the generic pieces into `DanilaH/mini-games-kit`:

- resolved-read caching policy for Yandex mirrored storage;
- parallel safeStorage / Player acquisition in Yandex runtime;
- optional generic startup phase recorder only if a second project needs it.

The zero-runtime-loading policy itself is a product policy, not a universal kit rule. Future games may make different asset-residency trade-offs.

Do not force Signal 2000 to migrate to the extracted package merely to prove reuse.
