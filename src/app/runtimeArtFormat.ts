export type RuntimeArtFormat = 'webp' | 'avif';

const ART_FORMAT_PARAM = 'artFormat';
const AVIF_PROBE_TIMEOUT_MS = 500;
const AVIF_PROBE_DATA_URI =
  'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADrbWV0YQAAAAAAAAAhaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAAAAAAAOcGl0bQAAAAAAAQAAAB5pbG9jAAAAAEQAAAEAAQAAAAEAAAETAAAAKAAAAChpaW5mAAAAAAABAAAAGmluZmUCAAAAAAEAAGF2MDFDb2xvcgAAAABqaXBycAAAAEtpcGNvAAAAFGlzcGUAAAAAAAAAAQAAAAEAAAAQcGl4aQAAAAADCAgIAAAADGF2MUOBAAwAAAAAE2NvbHJuY2x4AAEADQAGgAAAABdpcG1hAAAAAAAAAAEAAQQBAoMEAAAAMG1kYXQSAAoIGAAGiAhoNCAyGhlHh4Yhh5555oAAAJBAyRxhSytNj1FFTqSg';

interface ImageProbeLike {
  onload: (() => void) | null;
  onerror: (() => void) | null;
  width: number;
  height: number;
  src: string;
}

export interface RuntimeArtFormatDetectionOptions {
  search?: string;
  debugEnabled?: boolean;
  probeAvif?: () => Promise<boolean>;
}

let runtimeArtFormat: RuntimeArtFormat = 'webp';

const isDebugEnabled = (): boolean =>
  import.meta.env.DEV || import.meta.env.VITE_DEBUG_PANEL === 'true';

export const parseRuntimeArtFormatOverride = (
  search: string,
  enabled = true,
): RuntimeArtFormat | undefined => {
  if (!enabled) return undefined;
  const value = new URLSearchParams(search).get(ART_FORMAT_PARAM)?.trim().toLowerCase();
  return value === 'webp' || value === 'avif' ? value : undefined;
};

export const probeAvifSupport = async (
  createImage?: () => ImageProbeLike,
): Promise<boolean> => {
  if (!createImage && typeof Image === 'undefined') return false;

  return new Promise<boolean>((resolve) => {
    const image = createImage ? createImage() : new Image();
    let settled = false;
    const finish = (supported: boolean): void => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      image.onload = null;
      image.onerror = null;
      resolve(supported);
    };
    const timeout = setTimeout(() => finish(false), AVIF_PROBE_TIMEOUT_MS);
    image.onload = () => finish(image.width === 1 && image.height === 1);
    image.onerror = () => finish(false);
    image.src = AVIF_PROBE_DATA_URI;
  });
};

export const resolveRuntimeArtFormat = (
  avifSupported: boolean,
  override?: RuntimeArtFormat,
): RuntimeArtFormat => {
  if (override === 'webp') return 'webp';
  return avifSupported ? 'avif' : 'webp';
};

export const detectPreferredRuntimeArtFormat = async (
  options: RuntimeArtFormatDetectionOptions = {},
): Promise<RuntimeArtFormat> => {
  const search = options.search ?? (typeof window === 'undefined' ? '' : window.location.search);
  const debugEnabled = options.debugEnabled ?? isDebugEnabled();
  const override = parseRuntimeArtFormatOverride(search, debugEnabled);
  if (override === 'webp') return 'webp';

  const avifSupported = await (options.probeAvif ?? probeAvifSupport)();
  return resolveRuntimeArtFormat(avifSupported, override);
};

export const setRuntimeArtFormat = (format: RuntimeArtFormat): void => {
  runtimeArtFormat = format;
};

export const getRuntimeArtFormat = (): RuntimeArtFormat => runtimeArtFormat;

export const resolveRuntimeArtRequestPath = (
  assetPath: string,
  format: RuntimeArtFormat = runtimeArtFormat,
): string => {
  if (format !== 'avif') return assetPath;
  return assetPath.replace(/\.webp(?=($|[?#]))/i, '.avif');
};
