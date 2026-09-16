import type { AppLanguage } from '../platform/yandex';
import { getMessages, type Messages } from './index';

type Rarity = keyof Messages['rarity'];

// Standalone tier nouns avoid gender clashes next to gadget names. The shelf
// keeps the original adjectives in "Лучшая версия: …".
const RU_RARITY_BADGES: Readonly<Record<Rarity, string>> = {
  common: 'СТАНДАРТ',
  rare: 'РЕДКОСТЬ',
  epic: 'ЭПИК',
  legendary: 'ЛЕГЕНДА',
  secret: 'СЕКРЕТ',
};

export const getRarityBadge = (language: AppLanguage, rarity: Rarity): string =>
  language === 'ru' ? RU_RARITY_BADGES[rarity] : getMessages(language).rarity[rarity];

const russianChipNoun = (value: number): string => {
  const absolute = Math.abs(Math.trunc(value));
  const lastTwo = absolute % 100;
  const last = absolute % 10;
  if (lastTwo >= 11 && lastTwo <= 14) return 'чипов';
  if (last === 1) return 'чип';
  if (last >= 2 && last <= 4) return 'чипа';
  return 'чипов';
};

export const formatChipAmount = (amount: number, language: AppLanguage): string =>
  language === 'ru'
    ? `${amount} ${russianChipNoun(amount)}`
    : `${amount} ${getMessages(language).opening.chips}`;

export const formatChipGain = (amount: number, language: AppLanguage): string =>
  `+${formatChipAmount(amount, language)}`;

// Preserve the existing English accounting copy and ordering.
export const formatBaseChipReward = (amount: number, language: AppLanguage): string =>
  language === 'ru'
    ? formatChipGain(amount, language)
    : `${getMessages(language).opening.chips} +${amount}`;

export const formatDuplicateReward = (amount: number, language: AppLanguage): string =>
  language === 'ru'
    ? `${getMessages(language).opening.recycled} ${formatChipGain(amount, language)}`
    : `${getMessages(language).opening.recycled} +${amount}`;
