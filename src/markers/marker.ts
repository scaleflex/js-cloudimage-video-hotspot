import type { NormalizedVideoHotspot, VideoHotspotItem } from '../core/types';
import { createElement, addClass, removeClass } from '../utils/dom';

/** Create a marker button element for a video hotspot */
export function createMarker(
  hotspot: NormalizedVideoHotspot,
  pulse: boolean,
  renderMarker?: (hotspot: VideoHotspotItem) => string | HTMLElement,
  index?: number,
): HTMLButtonElement {
  const marker = createElement('button', 'ci-video-hotspot-marker', {
    'aria-label': hotspot.label,
    'aria-expanded': 'false',
    'data-hotspot-id': hotspot.id,
    'tabindex': '0',
    'type': 'button',
  });

  marker.style.left = `${hotspot.x}%`;
  marker.style.top = `${hotspot.y}%`;

  if (hotspot.className) {
    const classes = hotspot.className.trim().split(/\s+/).filter(Boolean);
    if (classes.length) addClass(marker, ...classes);
  }

  if (pulse) {
    addClass(marker, 'ci-video-hotspot-marker--pulse');
  }

  // Custom render function
  if (renderMarker) {
    const content = renderMarker(hotspot as VideoHotspotItem);
    if (typeof content === 'string') {
      marker.innerHTML = content;
    } else if (content instanceof HTMLElement) {
      marker.appendChild(content);
    }
    return marker;
  }

  if (hotspot.icon) {
    setMarkerIcon(marker, hotspot.icon);
  }

  if (hotspot.markerStyle === 'dot-label' && hotspot.label) {
    addClass(marker, 'ci-video-hotspot-marker--dot-label');
    const labelSpan = createElement('span', 'ci-video-hotspot-marker-label');
    labelSpan.textContent = hotspot.label;
    marker.appendChild(labelSpan);
  }

  if (hotspot.markerStyle === 'numbered') {
    addClass(marker, 'ci-video-hotspot-marker--numbered');
    marker.textContent = String(index != null ? index + 1 : 1);
  }

  return marker;
}

/** Sanitize SVG string to prevent XSS */
function sanitizeSVG(svg: string): string {
  if (typeof DOMParser === 'undefined') return '';
  const doc = new DOMParser().parseFromString(svg, 'image/svg+xml');
  const root = doc.documentElement;
  if (root.querySelector('parsererror')) return '';
  cleanSVGNode(root);
  return new XMLSerializer().serializeToString(root);
}

const SVG_BLOCKED_ELEMENTS = new Set([
  'script', 'foreignobject', 'iframe', 'object', 'embed',
  'animate', 'animatetransform', 'animatemotion', 'set',
  'style', 'a', 'use', 'image', 'feimage',
]);

function cleanSVGNode(node: Element): void {
  for (const attr of Array.from(node.attributes)) {
    const name = attr.name.toLowerCase();
    if (name.startsWith('on') || name === 'style') {
      node.removeAttribute(attr.name);
    } else if (
      (name === 'href' || name === 'xlink:href') &&
      /^\s*javascript\s*:/i.test(attr.value)
    ) {
      node.removeAttribute(attr.name);
    }
  }
  for (const child of Array.from(node.children)) {
    if (SVG_BLOCKED_ELEMENTS.has(child.tagName.toLowerCase())) {
      child.remove();
      continue;
    }
    cleanSVGNode(child);
  }
}

/** Set marker icon content */
function setMarkerIcon(marker: HTMLButtonElement, icon: string): void {
  const trimmed = icon.trim();
  if (/^<svg[\s>]/i.test(trimmed) || /^<\?xml/i.test(trimmed)) {
    marker.innerHTML = sanitizeSVG(icon);
  } else if (icon.match(/\.(png|jpg|jpeg|gif|svg|webp)$/i) || icon.startsWith('http') || icon.startsWith('/')) {
    const img = createElement('img', undefined, {
      src: icon,
      alt: '',
      'aria-hidden': 'true',
    });
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'contain';
    marker.appendChild(img);
  } else {
    const iconEl = createElement('span', icon, { 'aria-hidden': 'true' });
    marker.appendChild(iconEl);
  }
}

/** Set marker as active (popover open) */
export function setMarkerActive(marker: HTMLButtonElement, active: boolean): void {
  if (active) {
    addClass(marker, 'ci-video-hotspot-marker--active');
    marker.setAttribute('aria-expanded', 'true');
  } else {
    removeClass(marker, 'ci-video-hotspot-marker--active');
    marker.setAttribute('aria-expanded', 'false');
  }
}

/** Update marker position (for keyframe motion) */
export function updateMarkerPosition(marker: HTMLButtonElement, x: number, y: number): void {
  marker.style.left = `${x}%`;
  marker.style.top = `${y}%`;
}

/** Add entering animation class */
export function setMarkerEntering(marker: HTMLButtonElement, animation: string): void {
  addClass(marker, `ci-video-hotspot-marker--entering`);
  if (animation !== 'none') {
    addClass(marker, `ci-video-hotspot-marker--${animation}-in`);
  }
}

/** Add exiting animation class */
export function setMarkerExiting(marker: HTMLButtonElement, animation: string): void {
  removeClass(marker, 'ci-video-hotspot-marker--entering', `ci-video-hotspot-marker--fade-in`, `ci-video-hotspot-marker--scale-in`);
  addClass(marker, 'ci-video-hotspot-marker--exiting');
  if (animation !== 'none') {
    addClass(marker, `ci-video-hotspot-marker--${animation}-out`);
  }
}

/** Destroy a marker element */
export function destroyMarker(marker: HTMLButtonElement): void {
  marker.remove();
}
