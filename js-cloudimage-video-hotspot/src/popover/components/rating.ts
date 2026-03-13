import { escapeHtml } from '../sanitize';

const STAR_FULL =
  '<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>';
const STAR_HALF =
  '<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77V2z"/>' +
  '<path d="M12 2v15.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" opacity=".3"/>';
const STAR_EMPTY =
  '<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" opacity=".2"/>';

function starSvg(type: 'full' | 'half' | 'empty'): string {
  const paths = type === 'full' ? STAR_FULL : type === 'half' ? STAR_HALF : STAR_EMPTY;
  return `<svg class="ci-video-hotspot-rating-star ci-video-hotspot-rating-star--${type}" viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">${paths}</svg>`;
}

/** Render star rating with optional review count. Returns null if no rating. */
export function createRating(rating: number | undefined, reviewCount?: number): HTMLElement | null {
  if (rating == null || rating < 0) return null;

  const clamped = Math.min(rating, 5);
  const base = Math.floor(clamped);
  const remainder = clamped - base;
  const hasHalf = remainder >= 0.25 && remainder < 0.75;
  const roundUp = remainder >= 0.75;
  const fullStars = base + (roundUp ? 1 : 0);
  const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);

  const stars: string[] = [];
  for (let i = 0; i < fullStars; i++) stars.push(starSvg('full'));
  if (hasHalf) stars.push(starSvg('half'));
  for (let i = 0; i < emptyStars; i++) stars.push(starSvg('empty'));

  const el = document.createElement('div');
  el.className = 'ci-video-hotspot-rating';
  el.setAttribute('aria-label', `Rating: ${clamped} out of 5${reviewCount != null ? `, ${reviewCount} reviews` : ''}`);

  let html = `<span class="ci-video-hotspot-rating-stars">${stars.join('')}</span>`;
  if (reviewCount != null) {
    html += `<span class="ci-video-hotspot-rating-count">(${escapeHtml(String(reviewCount))})</span>`;
  }

  el.innerHTML = html;
  return el;
}
