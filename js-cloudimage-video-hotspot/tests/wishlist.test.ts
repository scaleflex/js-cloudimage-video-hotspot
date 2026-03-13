import { describe, it, expect, vi } from 'vitest';
import { createWishlist } from '../src/popover/components/wishlist';
import type { VideoHotspotItem } from '../src/core/types';

const makeHotspot = (id = 'h1'): VideoHotspotItem => ({
  id, x: 50, y: 50, startTime: 0, endTime: 10, label: 'Test',
});

describe('createWishlist', () => {
  it('returns null when not enabled', () => {
    expect(createWishlist(false, false, makeHotspot(), undefined, [])).toBeNull();
    expect(createWishlist(undefined, false, makeHotspot(), undefined, [])).toBeNull();
  });

  it('renders wishlist button', () => {
    const result = createWishlist(true, false, makeHotspot(), undefined, []);
    expect(result).not.toBeNull();
    expect(result!.element.tagName).toBe('BUTTON');
    expect(result!.element.classList.contains('ci-video-hotspot-wishlist')).toBe(true);
  });

  it('sets aria-pressed to false initially', () => {
    const result = createWishlist(true, false, makeHotspot(), undefined, []);
    expect(result!.element.getAttribute('aria-pressed')).toBe('false');
  });

  it('sets aria-pressed to true when wishlisted', () => {
    const result = createWishlist(true, true, makeHotspot(), undefined, []);
    expect(result!.element.getAttribute('aria-pressed')).toBe('true');
    expect(result!.element.classList.contains('ci-video-hotspot-wishlist--active')).toBe(true);
  });

  it('toggles on click', () => {
    const result = createWishlist(true, false, makeHotspot(), undefined, []);
    const btn = result!.element;

    btn.click();
    expect(btn.getAttribute('aria-pressed')).toBe('true');
    expect(btn.classList.contains('ci-video-hotspot-wishlist--active')).toBe(true);

    btn.click();
    expect(btn.getAttribute('aria-pressed')).toBe('false');
    expect(btn.classList.contains('ci-video-hotspot-wishlist--active')).toBe(false);
  });

  it('calls onToggle callback with hotspot object', () => {
    const onToggle = vi.fn();
    const hotspot = makeHotspot();
    const result = createWishlist(true, false, hotspot, onToggle, []);

    result!.element.click();
    expect(onToggle).toHaveBeenCalledWith(true, hotspot);

    result!.element.click();
    expect(onToggle).toHaveBeenCalledWith(false, hotspot);
  });

  it('pushes cleanup to array', () => {
    const cleanups: (() => void)[] = [];
    createWishlist(true, false, makeHotspot(), undefined, cleanups);
    expect(cleanups.length).toBe(1);
  });

  it('has aria-label', () => {
    const result = createWishlist(true, false, makeHotspot(), undefined, []);
    expect(result!.element.getAttribute('aria-label')).toBe('Add to wishlist');
  });

  it('contains SVG heart icon', () => {
    const result = createWishlist(true, false, makeHotspot(), undefined, []);
    const svg = result!.element.querySelector('svg');
    expect(svg).not.toBeNull();
  });
});
