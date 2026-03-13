import { isBrowser, createElement } from '../utils/dom';

let liveRegion: HTMLElement | null = null;

const LIVE_REGION_ATTR = 'data-ci-hotspot-ref-count';

/** Announce a message to screen readers via a live region */
export function announceToScreenReader(message: string): void {
  if (!isBrowser()) return;
  if (!liveRegion) return;

  liveRegion.textContent = '';
  requestAnimationFrame(() => {
    if (liveRegion) liveRegion.textContent = message;
  });
}

/** Get the current ref count from the live region element */
function getRefCount(): number {
  if (!liveRegion) return 0;
  return parseInt(liveRegion.getAttribute(LIVE_REGION_ATTR) || '0', 10);
}

/** Set the ref count on the live region element */
function setRefCount(count: number): void {
  if (liveRegion) {
    liveRegion.setAttribute(LIVE_REGION_ATTR, String(count));
  }
}

/** Register an instance that uses the live region */
export function acquireLiveRegion(): void {
  if (!isBrowser()) return;

  // Find existing live region (may have been created by another bundle)
  if (!liveRegion) {
    liveRegion = document.querySelector(`[${LIVE_REGION_ATTR}]`);
  }

  if (liveRegion) {
    setRefCount(getRefCount() + 1);
  } else {
    // Will be created lazily by announceToScreenReader
    // We create it here to track the count
    liveRegion = createElement('div', undefined, {
      'aria-live': 'polite',
      'aria-atomic': 'true',
      'role': 'status',
      [LIVE_REGION_ATTR]: '1',
    });
    liveRegion.style.cssText =
      'position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0';
    document.body.appendChild(liveRegion);
  }
}

/** Release an instance; removes the live region when the last one is released */
export function releaseLiveRegion(): void {
  if (!liveRegion) return;
  const count = Math.max(0, getRefCount() - 1);
  if (count === 0) {
    liveRegion.remove();
    liveRegion = null;
  } else {
    setRefCount(count);
  }
}
