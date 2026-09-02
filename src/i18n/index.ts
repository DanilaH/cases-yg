import type { AppLanguage } from '../platform/yandex';
import { en } from './en';
import { ru } from './ru';

type DeepStrings<T> = {
  readonly [Key in keyof T]: T[Key] extends string ? string : DeepStrings<T[Key]>;
};

export type Messages = DeepStrings<typeof en>;

const messages: Readonly<Record<AppLanguage, Messages>> = { en, ru };

export const getMessages = (language: AppLanguage): Messages => messages[language];
