import type { VideoHotspotItem } from '../../core/types';

const HEART_SVG = `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
</svg>`;

export interface WishlistResult {
  element: HTMLElement;
}

/** Create wishlist toggle button. Returns null if wishlist is not enabled. */
export function createWishlist(
  enabled: boolean | undefined,
  wishlisted: boolean | undefined,
  hotspot: VideoHotspotItem | null,
  onToggle: ((wishlisted: boolean, hotspot: VideoHotspotItem) => void) | undefined,
  cleanups: (() => void)[],
): WishlistResult | null {
  if (!enabled) return null;

  let active = wishlisted ?? false;

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'ci-video-hotspot-wishlist';
  btn.setAttribute('aria-label', 'Add to wishlist');
  btn.setAttribute('aria-pressed', String(active));
  btn.innerHTML = HEART_SVG;

  if (active) {
    btn.classList.add('ci-video-hotspot-wishlist--active');
  }

  const onClick = (e: Event) => {
    e.stopPropagation();
    active = !active;
    btn.setAttribute('aria-pressed', String(active));
    btn.classList.toggle('ci-video-hotspot-wishlist--active', active);
    if (hotspot) onToggle?.(active, hotspot);
  };

  btn.addEventListener('click', onClick);
  cleanups.push(() => btn.removeEventListener('click', onClick));

  return { element: btn };
}
