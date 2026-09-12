# Airwaves content integration — 2026-09-12

## Scope

Adds the seventh Drop, `airwaves`, without changing economy or pouch interaction geometry.

Families:

- `portable-radio` — Radio / Радио
- `walkie-talkie` — Walkie-Talkie / Рация

Each family contains Common, Rare, Epic, Legendary and one Secret, preserving the existing per-Drop contract of 8 standard collectibles + 2 Secrets.

## Runtime art

Collectibles are promoted to 1024×1024 transparent WebP exports with the established 64 px safe-area / 896 px fit contract.

Airwaves has dedicated authored Basic and Charged pouch sets:

- body — 1024×1024 WebP alpha;
- star tab — 1024×1024 WebP alpha with established authored placement;
- compact tear strip — 984×235 WebP alpha.

The Drop reuses the existing tear travel, drag threshold, hit area, reward flow and economy. Only content registry, localization, on-demand art registration and Drop-specific pouch mapping change.

## Naming

`Airwaves` / `Радиоволны` is the current runtime Drop label and can be renamed independently later without changing collectible ids, save semantics or asset paths.
