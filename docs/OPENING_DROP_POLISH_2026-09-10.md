# Opening Drop polish — 2026-09-10

This document records the accepted UX/presentation contract for the Opening Drop selector, pouch identity, idle tear hint, and standard-result outline treatment. It is a presentation/interaction correction only: reward odds, CHIPS, Signal, Overcharge, save semantics, and the 6-Drop content registry are unchanged.

## Drop selector

The Drop selector is a primary Opening control, not a passive status label.

- It lives at the bottom of the Opening scene, clear of the upper reward tray.
- Its primary line identifies the current Drop and position: `DROP N/6 · NAME`.
- Its progress line is explicit: `STANDARD x/8 · SECRET y/2` (localized labels are used in runtime).
- Previous/next arrows have large touch targets; the center area also supports horizontal swipe.
- The panel has a filled surface, bordered/inner treatment, restrained idle shimmer/pulse, and short press/switch motion.
- A successful full tear disables the selector and fades it out before result presentation. A partial/cancelled tear does not permanently remove it.
- When the last missing standard in a Drop is collected, the next-Drop affordance receives a one-time contextual nudge. This does not label the Drop fully complete while Secrets remain.

## Fast Drop switching

Drop paging must feel immediate even though the active Drop is durable save state.

- Arrow/swipe input updates the displayed Drop and pouch skin immediately.
- Rapid repeated input is allowed; the latest selection wins.
- A generation token invalidates stale async preload continuations before they can persist or repaint an obsolete target.
- Durable `activeLootPoolId` writes remain serialized. If a newer selection arrives after an older write has already started, that completed write is treated only as an intermediate state and the latest target is written next.
- Stale targets do not emit final `drop_selected` analytics and do not repaint over the latest preview.
- While durable reconciliation is outstanding, starting a pouch tear or leaving for Collection remains blocked so reward resolution cannot observe an intermediate Drop.
- During optimistic preview, Drop-dependent HUD presentation uses the preview Drop as well, so pouch, selector, Signal/Overcharge messaging, and active-Drop semantics stay visually atomic.

## Drop-specific pouch skins

All six Drops share the same pouch geometry, tear line, star-tab mechanics, hitboxes, and opening choreography. Drop identity is a lightweight runtime skin over those shared authored assets, not six independent pouch mechanics or six complete raster packages.

Each Drop has a distinct tint/accent/secondary palette and motif:

- Y2K Essentials — spark;
- Video Link — video;
- Pocket Office — grid;
- Pocket Audio — wave;
- Game Zone — game-controller motif;
- Analog Nights — scan-line motif.

The active Basic/Charged type is preserved while switching Drops. Charged uses the same Drop identity layer over the Charged authored base. The Charged body also receives a small optical offset correction so its visible mass aligns with Basic without rotating the pouch.

## Tear hint

`DRAG THE STAR TO TEAR` / localized copy is contextual help, not permanent chrome.

- It is hidden on initial idle render.
- It appears only after about 5.5 seconds without useful interaction.
- When shown, the hint and star give a short finite directional nudge instead of an endless pulse.
- Any relevant pointer interaction hides it immediately and restarts the idle timer when appropriate.
- A cancelled tear may schedule the hint again; successful tear removes it for that reveal.

## Reveal outline hierarchy

Every standard collectible result now keeps a persistent silhouette/outline accent so the tactile outline language is not reserved only for first discovery.

- ordinary/repeated result: restrained persistent outline;
- NEW result: stronger persistent outline plus a larger temporary discovery outline/pop and collection label;
- rarity-specific ambient presence and Secret premium treatment remain separate layers.

The NEW beat must remain visibly stronger than a duplicate without making every duplicate read as a first discovery.

## Manual QA before Yandex DRAFT

The merged code still requires hands-on visual validation before rebuilding the hosted DRAFT archive. At minimum verify:

1. Page through all six Drops with arrows and swipe; confirm name, index, standard count, Secret count, and pouch identity agree.
2. Stress rapid switching with repeated direction changes and wrap-around; confirm there is no stale rollback, wrong final persisted Drop, broken pouch, or stuck interaction.
3. Repeat the switching stress while Charged is selected; confirm Charged remains selected when affordable and receives the correct Drop skin immediately.
4. Confirm the bottom selector is readable and comfortably tappable in representative desktop/mobile portrait/landscape layouts and EN/RU.
5. Confirm the selector remains through partial drag, then begins fading only after a successful full tear and never overlaps the reward tray.
6. Leave Opening idle for roughly 5.5 seconds; confirm the top tear hint appears with a short star nudge, then disappears on interaction and does not become permanent noise.
7. Compare Basic and Charged alignment in the same Drop.
8. Reveal duplicates and NEW items across Common/Rare/Epic/Legendary; confirm every standard result has an outline and NEW is clearly more celebratory.
9. Exercise Hidden Pocket/Secret result composition to ensure the stronger NEW treatment does not make the carousel/reward presentation unreadable.
10. Reload after Drop switching and verify the final selected Drop is the one restored from storage.
