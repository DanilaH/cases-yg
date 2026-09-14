import { computeStartupFakeProgress } from './startupPreload';

const SHOW_DELAY_MS = 120;
const MIN_VISIBLE_MS = 420;
const COMPLETION_HOLD_MS = 140;
const PROGRESS_TICK_MS = 90;
const PRE_COMPLETE_CAP = 0.9;

interface RuntimeLoadOverlayDom {
  overlay: HTMLElement;
  heading: HTMLElement;
  status: HTMLElement;
  progressBar: HTMLElement;
  progressFill: HTMLElement;
  progressPercent: HTMLElement;
}

let depth = 0;
let ownsOverlay = false;
let startedAt = 0;
let visibleAt: number | null = null;
let showTimer: number | null = null;
let progressTimer: number | null = null;
let completionTimer: number | null = null;

const getDom = (): RuntimeLoadOverlayDom | null => {
  if (typeof document === 'undefined') return null;
  const overlay = document.querySelector<HTMLElement>('#startup-preload');
  const heading = document.querySelector<HTMLElement>('#startup-preload-heading');
  const status = document.querySelector<HTMLElement>('#startup-preload-status');
  const progressBar = document.querySelector<HTMLElement>('#startup-preload-progress-bar');
  const progressFill = document.querySelector<HTMLElement>('#startup-preload-progress-fill');
  const progressPercent = document.querySelector<HTMLElement>('#startup-preload-progress-percent');
  if (!overlay || !heading || !status || !progressBar || !progressFill || !progressPercent) return null;
  return { overlay, heading, status, progressBar, progressFill, progressPercent };
};

const clearShowTimer = (): void => {
  if (showTimer === null) return;
  window.clearTimeout(showTimer);
  showTimer = null;
};

const clearProgressTimer = (): void => {
  if (progressTimer === null) return;
  window.clearInterval(progressTimer);
  progressTimer = null;
};

const clearCompletionTimer = (): void => {
  if (completionTimer === null) return;
  window.clearTimeout(completionTimer);
  completionTimer = null;
};

const setProgress = (dom: RuntimeLoadOverlayDom, progress: number): void => {
  const percent = Math.round(Math.max(0, Math.min(1, progress)) * 100);
  dom.progressBar.setAttribute('aria-valuenow', String(percent));
  dom.progressFill.style.width = `${percent}%`;
  dom.progressPercent.textContent = `${String(percent).padStart(2, '0')}%`;
};

const show = (dom: RuntimeLoadOverlayDom): void => {
  if (!ownsOverlay || depth <= 0) return;
  visibleAt ??= performance.now();
  dom.overlay.dataset.state = 'visible';
  dom.overlay.setAttribute('aria-hidden', 'false');
  dom.overlay.setAttribute('aria-live', 'polite');
  setProgress(dom, computeStartupFakeProgress(performance.now() - startedAt, PRE_COMPLETE_CAP));
};

const hide = (dom: RuntimeLoadOverlayDom): void => {
  dom.overlay.dataset.state = 'hidden';
  dom.overlay.setAttribute('aria-hidden', 'true');
  depth = 0;
  ownsOverlay = false;
  visibleAt = null;
};

const finish = (dom: RuntimeLoadOverlayDom): void => {
  if (!ownsOverlay || depth > 0) return;
  clearShowTimer();
  clearProgressTimer();

  if (visibleAt === null) {
    hide(dom);
    return;
  }

  setProgress(dom, 1);
  dom.overlay.dataset.state = 'completing';
  const visibleForMs = performance.now() - visibleAt;
  const remainingMinimumMs = Math.max(0, MIN_VISIBLE_MS - visibleForMs);
  completionTimer = window.setTimeout(() => {
    completionTimer = null;
    if (!ownsOverlay || depth > 0) return;
    hide(dom);
  }, Math.max(COMPLETION_HOLD_MS, remainingMinimumMs));
};

/**
 * Reuses the authored startup preload shell for post-boot texture loads.
 * Startup keeps ownership while it is visible/pending; runtime loading only takes
 * over after that shell has reached its hidden state. Nested loads share one overlay.
 */
export const beginRuntimeLoadOverlay = (): (() => void) => {
  if (typeof window === 'undefined') return () => undefined;
  const dom = getDom();
  if (!dom) return () => undefined;

  if (!ownsOverlay) {
    if (dom.overlay.dataset.state !== 'hidden') {
      // Startup loader (or fatal startup UI) still owns the surface. It already
      // covers any initial active-Drop texture work, so do not interfere with it.
      return () => undefined;
    }

    ownsOverlay = true;
    depth = 0;
    startedAt = performance.now();
    visibleAt = null;
    clearCompletionTimer();
    setProgress(dom, computeStartupFakeProgress(0, PRE_COMPLETE_CAP));
    showTimer = window.setTimeout(() => {
      showTimer = null;
      show(dom);
    }, SHOW_DELAY_MS);
    progressTimer = window.setInterval(() => {
      if (!ownsOverlay || depth <= 0) return;
      setProgress(dom, computeStartupFakeProgress(performance.now() - startedAt, PRE_COMPLETE_CAP));
    }, PROGRESS_TICK_MS);
  } else if (completionTimer !== null) {
    clearCompletionTimer();
    dom.overlay.dataset.state = 'visible';
    dom.overlay.setAttribute('aria-hidden', 'false');
  }

  depth += 1;
  let released = false;
  return () => {
    if (released || !ownsOverlay) return;
    released = true;
    depth = Math.max(0, depth - 1);
    if (depth === 0) finish(dom);
  };
};
