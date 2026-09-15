# Signal 2000 — Runtime Performance V2

Date: 2026-09-15
Base: `main` at `a82380d21153b4584cea20b818afa3a42a247135`

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

### Phase D — replace global speculative image warmup with bounded near-future warmup

After the durable save determines the active Drop, warm only:

- Collection-only static layers;
- reviewed collectibles for the active Drop;
- Basic + Charged pouch layers for the active Drop.

Do not prefetch all other Drops automatically. Their runtime loader remains the correctness path.

This reduces background network consumption and keeps cache warming aligned with likely near-future interaction.

### Phase E — follow-up after measurements

Do not combine these into the first implementation unless evidence justifies them:

- exact-collectible-on-demand Phaser decoding;
- texture residency / LRU eviction;
- alpha-trim metadata pipeline;
- custom/slim Phaser build;
- HTML-level early Yandex SDK fetch;
- service worker / explicit persistent asset cache.

These have larger presentation, memory, invalidation, or build-surface risk and deserve their own measured change.

## Independent plan review

A second pass against the plan changed the original scope in four ways:

1. **Texture eviction is deferred.** It can save substantial decoded/GPU memory, but removing Phaser textures while stale GameObjects or planar-depth resources still reference them is a correctness risk. Instrument first, then add ownership/leases explicitly.
2. **Exact collectible decoding is deferred from this first PR.** It is probably the largest remaining image-residency win, but it crosses live reveal and recovery paths in `OpeningScene`. It must be implemented with a loader-covered exact-reward gate, not by allowing procedural placeholders to flash.
3. **Audio preload is not changed yet.** The encoded audio budget is small; without real startup timing, moving decode work can trade load time for first-interaction audio inconsistency.
4. **No service worker.** Public asset URLs are currently stable/non-hashed. Durable CacheStorage without an invalidation/versioning contract would create a more dangerous stale-art problem than the startup latency it might solve.

The high-confidence first slice is therefore: **instrumentation + mirrored-save read reuse + parallel Yandex bootstrap + bounded active-Drop warmup**.

## Acceptance

Automated:

- typecheck passes;
- full Vitest suite passes;
- asset self-test passes;
- asset validation passes;
- production build passes;
- tests prove repeated mirrored save reads do not repeat Player Data reads;
- tests prove a failed mutation invalidates the read cache;
- tests prove warmup includes active Drop + Collection layers and excludes unrelated Drop content.

Hosted / real-device:

- no change to first-run/recovery/reveal behavior;
- no placeholder leak;
- no change to Drop selection semantics;
- startup still reaches semantic Game Ready only after a usable frame;
- debug host exposes startup phase timing;
- real Yandex DRAFT is used to compare Game Ready and internal phase timings before starting the next optimization slice.

## Reuse decision

If the Signal implementation validates cleanly in Yandex DRAFT, mirror the generic pieces into `DanilaH/mini-games-kit`:

- resolved-read caching policy for Yandex mirrored storage;
- parallel safeStorage / Player acquisition in Yandex runtime;
- optional generic startup phase recorder only if a second project needs it.

Do not force Signal 2000 to migrate to the extracted package merely to prove reuse.