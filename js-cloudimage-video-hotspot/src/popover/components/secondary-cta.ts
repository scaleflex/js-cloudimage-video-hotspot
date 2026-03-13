import { isSafeUrl } from '../sanitize';
import type { VideoHotspotItem } from '../../core/types';

/** Render a secondary CTA as <a> (if url) or <button>. Returns null if no data. */
export function createSecondaryCta(
  cta: { text: string; url?: string; onClick?: (hotspot: VideoHotspotItem) => void } | undefined,
  hotspot: VideoHotspotItem | null = null,
  cleanups: (() => void)[] = [],
): HTMLElement | null {
  if (!cta || !cta.text) return null;

  if (cta.url && isSafeUrl(cta.url)) {
    const a = document.createElement('a');
    a.className = 'ci-video-hotspot-secondary-cta';
    a.href = cta.url;
    a.target = '_blank';
    a.rel = 'noopener';
    a.textContent = cta.text;
    return a;
  }

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'ci-video-hotspot-secondary-cta';
  btn.textContent = cta.text;

  if (cta.onClick && hotspot) {
    const handler = (e: Event) => {
      e.stopPropagation();
      cta.onClick!(hotspot!);
    };
    btn.addEventListener('click', handler);
    cleanups.push(() => btn.removeEventListener('click', handler));
  }

  return btn;
}
