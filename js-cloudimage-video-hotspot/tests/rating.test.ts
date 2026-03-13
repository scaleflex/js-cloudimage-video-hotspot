import { describe, it, expect } from 'vitest';
import { createRating } from '../src/popover/components/rating';

describe('createRating', () => {
  it('returns null for undefined rating', () => {
    expect(createRating(undefined)).toBeNull();
  });

  it('returns null for negative rating', () => {
    expect(createRating(-1)).toBeNull();
  });

  it('renders 5 stars for rating of 5', () => {
    const el = createRating(5);
    expect(el).not.toBeNull();
    const stars = el!.querySelectorAll('.ci-video-hotspot-rating-star');
    expect(stars.length).toBe(5);

    const fullStars = el!.querySelectorAll('.ci-video-hotspot-rating-star--full');
    expect(fullStars.length).toBe(5);
  });

  it('renders correct full/half/empty stars for 3.5', () => {
    const el = createRating(3.5);
    expect(el).not.toBeNull();

    const full = el!.querySelectorAll('.ci-video-hotspot-rating-star--full');
    const half = el!.querySelectorAll('.ci-video-hotspot-rating-star--half');
    const empty = el!.querySelectorAll('.ci-video-hotspot-rating-star--empty');

    expect(full.length).toBe(3);
    expect(half.length).toBe(1);
    expect(empty.length).toBe(1);
  });

  it('renders all empty stars for 0 rating', () => {
    const el = createRating(0);
    expect(el).not.toBeNull();
    const empty = el!.querySelectorAll('.ci-video-hotspot-rating-star--empty');
    expect(empty.length).toBe(5);
  });

  it('clamps rating above 5', () => {
    const el = createRating(7);
    expect(el).not.toBeNull();
    const full = el!.querySelectorAll('.ci-video-hotspot-rating-star--full');
    expect(full.length).toBe(5);
  });

  it('displays review count', () => {
    const el = createRating(4, 128);
    expect(el).not.toBeNull();
    const count = el!.querySelector('.ci-video-hotspot-rating-count');
    expect(count).not.toBeNull();
    expect(count!.textContent).toBe('(128)');
  });

  it('sets aria-label with rating and review count', () => {
    const el = createRating(4.5, 42);
    expect(el!.getAttribute('aria-label')).toBe('Rating: 4.5 out of 5, 42 reviews');
  });

  it('sets aria-label without review count', () => {
    const el = createRating(3);
    expect(el!.getAttribute('aria-label')).toBe('Rating: 3 out of 5');
  });

  it('rounds up to full star for remainder >= 0.75', () => {
    const el = createRating(4.8);
    expect(el).not.toBeNull();

    const full = el!.querySelectorAll('.ci-video-hotspot-rating-star--full');
    const half = el!.querySelectorAll('.ci-video-hotspot-rating-star--half');
    const empty = el!.querySelectorAll('.ci-video-hotspot-rating-star--empty');

    expect(full.length).toBe(5);
    expect(half.length).toBe(0);
    expect(empty.length).toBe(0);
  });

  it('shows half star for remainder 0.25-0.74', () => {
    const el = createRating(2.3);
    expect(el).not.toBeNull();

    const full = el!.querySelectorAll('.ci-video-hotspot-rating-star--full');
    const half = el!.querySelectorAll('.ci-video-hotspot-rating-star--half');
    const empty = el!.querySelectorAll('.ci-video-hotspot-rating-star--empty');

    expect(full.length).toBe(2);
    expect(half.length).toBe(1);
    expect(empty.length).toBe(2);
  });

  it('shows no half for remainder < 0.25', () => {
    const el = createRating(3.1);
    expect(el).not.toBeNull();

    const full = el!.querySelectorAll('.ci-video-hotspot-rating-star--full');
    const half = el!.querySelectorAll('.ci-video-hotspot-rating-star--half');
    const empty = el!.querySelectorAll('.ci-video-hotspot-rating-star--empty');

    expect(full.length).toBe(3);
    expect(half.length).toBe(0);
    expect(empty.length).toBe(2);
  });
});
