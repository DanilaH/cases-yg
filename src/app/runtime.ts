import type { PlatformRuntime } from '../platform/yandex';

let platformRuntime: PlatformRuntime | null = null;

export const setPlatformRuntime = (runtime: PlatformRuntime): void => {
  platformRuntime = runtime;
};

export const getPlatformRuntime = (): PlatformRuntime => {
  if (!platformRuntime) {
    throw new Error('Platform runtime accessed before bootstrap');
  }
  return platformRuntime;
};
