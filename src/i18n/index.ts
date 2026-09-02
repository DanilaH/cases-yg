import type { AppLanguage } from '../platform/yandex';
import { en } from './en';
import { ru } from './ru';

export type Messages = typeof en;

const messages: Readonly<Record<AppLanguage, Messages>> = { en, ru };

export const getMessages = (language: AppLanguage): Messages => messages[language];
