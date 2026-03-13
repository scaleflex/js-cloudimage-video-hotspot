import { addClass, removeClass } from '../utils/dom';
import { addListener } from '../utils/events';

export interface FullscreenControlOptions {
  onChange?: (isFullscreen: boolean) => void;
}

export interface FullscreenControl {
  isFullscreen: () => boolean;
  toggle: () => void;
  enter: () => void;
  exit: () => void;
  destroy: () => void;
}

function isFullscreenEnabled(): boolean {
  return !!(
    document.fullscreenEnabled ||
    (document as any).webkitFullscreenEnabled
  );
}

function getFullscreenElement(): Element | null {
  return (
    document.fullscreenElement ||
    (document as any).webkitFullscreenElement ||
    null
  );
}

function requestFullscreen(el: HTMLElement): Promise<void> {
  if (el.requestFullscreen) return el.requestFullscreen();
  if ((el as any).webkitRequestFullscreen) {
    (el as any).webkitRequestFullscreen();
    return Promise.resolve();
  }
  return Promise.reject(new Error('Fullscreen API not supported'));
}

function exitFullscreenApi(): Promise<void> {
  if (document.exitFullscreen) return document.exitFullscreen();
  if ((document as any).webkitExitFullscreen) {
    (document as any).webkitExitFullscreen();
    return Promise.resolve();
  }
  return Promise.reject(new Error('Fullscreen API not supported'));
}

/** Create a fullscreen controller for the container */
export function createFullscreenControl(
  container: HTMLElement,
  options: FullscreenControlOptions = {},
): FullscreenControl | null {
  if (!isFullscreenEnabled()) return null;

  const cleanups: (() => void)[] = [];

  function isActive(): boolean {
    return getFullscreenElement() === container;
  }

  function syncState(): void {
    const fs = isActive();
    if (fs) {
      addClass(container, 'ci-video-hotspot-container--fullscreen');
    } else {
      removeClass(container, 'ci-video-hotspot-container--fullscreen');
    }
    options.onChange?.(fs);
  }

  function toggle(): void {
    if (isActive()) {
      exitFullscreenApi().catch(() => {});
    } else {
      requestFullscreen(container).catch(() => {});
    }
  }

  function enter(): void {
    if (!isActive()) {
      requestFullscreen(container).catch(() => {});
    }
  }

  function exit(): void {
    if (isActive()) {
      exitFullscreenApi().catch(() => {});
    }
  }

  cleanups.push(addListener(document, 'fullscreenchange', syncState));
  cleanups.push(addListener(document, 'webkitfullscreenchange' as keyof HTMLElementEventMap, syncState));

  function destroy(): void {
    if (isActive()) {
      exitFullscreenApi().catch(() => {});
    }
    removeClass(container, 'ci-video-hotspot-container--fullscreen');
    cleanups.forEach((fn) => fn());
    cleanups.length = 0;
  }

  return {
    isFullscreen: isActive,
    toggle,
    enter,
    exit,
    destroy,
  };
}
