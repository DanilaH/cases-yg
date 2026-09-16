import fs from 'node:fs';
import { describe, expect, it } from 'vitest';

import {
  formatBaseChipReward,
  formatChipAmount,
  formatChipGain,
  formatDuplicateReward,
  getRarityBadge,
} from '../src/i18n/format';
import { ru } from '../src/i18n/ru';

describe('Russian player-facing copy', () => {
  it.each([
    [0, '0 чипов'], [1, '1 чип'], [2, '2 чипа'], [4, '4 чипа'], [5, '5 чипов'],
    [11, '11 чипов'], [14, '14 чипов'], [21, '21 чип'], [22, '22 чипа'],
    [25, '25 чипов'], [101, '101 чип'], [111, '111 чипов'], [112, '112 чипов'],
  ])('declines %i correctly', (amount, expected) => {
    expect(formatChipAmount(amount, 'ru')).toBe(expected);
  });

  it('formats bonuses and duplicate conversions without changing English labels', () => {
    expect(formatChipGain(21, 'ru')).toBe('+21 чип');
    expect(formatBaseChipReward(2, 'ru')).toBe('+2 чипа');
    expect(formatDuplicateReward(11, 'ru')).toBe('ЗА ДУБЛИКАТ +11 чипов');
    expect(formatChipAmount(60, 'en')).toBe('60 CHIPS');
    expect(formatBaseChipReward(2, 'en')).toBe('CHIPS +2');
    expect(formatDuplicateReward(11, 'en')).toBe('RECYCLED +11');
  });

  it('uses gender-neutral tier badges and keeps shelf version wording', () => {
    for (const rarity of ['common', 'rare', 'epic', 'legendary', 'secret'] as const) {
      expect(getRarityBadge('ru', rarity)).not.toBe(ru.rarity[rarity]);
      expect(getRarityBadge('en', rarity)).toBeTruthy();
    }
    expect(getRarityBadge('ru', 'legendary')).toBe('ЛЕГЕНДА');
    expect(getRarityBadge('ru', 'secret')).toBe('СЕКРЕТ');
    expect(ru.collection.bestOwned).toBe('Лучшая версия');
  });

  it('keeps directions and milestones natural, and verifies formatted call sites', () => {
    expect(ru.opening.milestoneStandardsHalf).toBe('ПОЛОВИНА НАБОРА СОБРАНА!');
    expect(ru.collection.emptyShelf).toContain('Найди предмет');
    expect(ru.collection.openMore).toBe('← К ПАКЕТАМ');
    const opening = fs.readFileSync('src/game/scenes/OpeningScene.ts', 'utf8');
    const collection = fs.readFileSync('src/game/scenes/CollectionScene.ts', 'utf8');
    expect(opening).toContain('formatChipAmount(cost, getPlatformRuntime().language)');
    expect(opening).toContain('formatChipGain(pending.chips.secretBonus, getPlatformRuntime().language)');
    expect(opening).not.toMatch(/\+\$\{[^}]+\}\s+\$\{messages\.opening\.chips\}/);
    expect(collection).toContain('getRarityBadge(getPlatformRuntime().language, entry.rarity)');
  });
});
