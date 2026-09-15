import fs from 'node:fs';
import { describe, expect, it } from 'vitest';

import { GAME_REGISTRY } from '../src/game/data/collectibles';
import { ru } from '../src/i18n/ru';

const flattenStrings = (value: unknown): string[] => {
  if (typeof value === 'string') return [value];
  if (typeof value !== 'object' || value === null) return [];
  return Object.values(value).flatMap(flattenStrings);
};

const forbiddenGameplayEnglish = /\b(?:DROP|SIGNAL|CHIPS|OVERCHARGE|CHARGED|POUCH|REWARD|READY|LOCK|SECRET|COMMON|RARE|EPIC|LEGENDARY)\b|Y2K Essentials|Mystery Pocket Tech/i;

describe('Russian moderation localization', () => {
  it('keeps the Russian message catalog free of gameplay-significant English labels', () => {
    const violations = flattenStrings(ru).filter((text) => forbiddenGameplayEnglish.test(text));
    expect(violations).toEqual([]);
  });

  it('provides Russian names for every collectible family', () => {
    for (const family of GAME_REGISTRY.families) {
      expect(family.name.ru.trim().length, family.id).toBeGreaterThan(0);
    }
  });

  it('uses a Russian-safe pre-module shell before Yandex locale detection finishes', () => {
    const html = fs.readFileSync('index.html', 'utf8');
    expect(html).toContain('<html lang="ru">');
    expect(html).toContain('<title>Сигнал 2000</title>');
    expect(html).toContain('ПОДГОТОВКА НАБОРА');
    expect(html).toContain('НАСТРАИВАЕМ СИГНАЛ...');
    expect(html).toContain('Поверните устройство горизонтально');
    expect(html).not.toMatch(/PREPARING DROP|STABILIZING SIGNAL|Rotate your device|Mystery Pocket Tech/);
  });

  it('does not leave known hardcoded English gameplay labels in OpeningScene', () => {
    const source = fs.readFileSync('src/game/scenes/OpeningScene.ts', 'utf8');
    expect(source).not.toContain("'POUCH'");
    expect(source).not.toContain("'REWARD'");
    expect(source).not.toContain("'READY'");
    expect(source).not.toContain("' · MAX'");
    expect(source).not.toContain("' MAX'");
  });
});
