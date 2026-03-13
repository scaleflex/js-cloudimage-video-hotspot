import { describe, it, expect } from 'vitest';
import { createGallery } from '../src/popover/components/gallery';

describe('createGallery', () => {
  const images = [
    'https://example.com/img1.jpg',
    'https://example.com/img2.jpg',
    'https://example.com/img3.jpg',
  ];

  it('returns null for undefined images', () => {
    expect(createGallery(undefined, 'test', [])).toBeNull();
  });

  it('returns null for empty images', () => {
    expect(createGallery([], 'test', [])).toBeNull();
  });

  it('renders all slides', () => {
    const result = createGallery(images, 'Product', []);
    expect(result).not.toBeNull();

    const slides = result!.element.querySelectorAll('.ci-video-hotspot-gallery-slide');
    expect(slides.length).toBe(3);
  });

  it('sets lazy loading on all images except first', () => {
    const result = createGallery(images, 'Product', []);
    const imgs = result!.element.querySelectorAll('img');

    expect(imgs[0].loading).not.toBe('lazy');
    expect(imgs[1].loading).toBe('lazy');
    expect(imgs[2].loading).toBe('lazy');
  });

  it('renders alt text with image number', () => {
    const result = createGallery(images, 'Product', []);
    const imgs = result!.element.querySelectorAll('img');

    expect(imgs[0].alt).toBe('Product - image 1');
    expect(imgs[1].alt).toBe('Product - image 2');
  });

  it('renders dots for multiple images', () => {
    const result = createGallery(images, 'Product', []);
    const dots = result!.element.querySelectorAll('.ci-video-hotspot-gallery-dot');
    expect(dots.length).toBe(3);
  });

  it('renders arrows for multiple images', () => {
    const result = createGallery(images, 'Product', []);
    const arrows = result!.element.querySelectorAll('.ci-video-hotspot-gallery-arrow');
    expect(arrows.length).toBe(2);
  });

  it('does not render dots or arrows for single image', () => {
    const result = createGallery(['https://example.com/img.jpg'], 'Product', []);
    expect(result).not.toBeNull();

    const dots = result!.element.querySelectorAll('.ci-video-hotspot-gallery-dot');
    const arrows = result!.element.querySelectorAll('.ci-video-hotspot-gallery-arrow');
    expect(dots.length).toBe(0);
    expect(arrows.length).toBe(0);
  });

  it('first dot is active initially', () => {
    const result = createGallery(images, 'Product', []);
    const dots = result!.element.querySelectorAll('.ci-video-hotspot-gallery-dot');

    expect(dots[0].classList.contains('ci-video-hotspot-gallery-dot--active')).toBe(true);
    expect(dots[1].classList.contains('ci-video-hotspot-gallery-dot--active')).toBe(false);
  });

  it('prev arrow is hidden initially', () => {
    const result = createGallery(images, 'Product', []);
    const prev = result!.element.querySelector('.ci-video-hotspot-gallery-arrow--prev') as HTMLElement;
    expect(prev.style.display).toBe('none');
  });

  it('clicking next arrow advances slide', () => {
    const result = createGallery(images, 'Product', []);
    const next = result!.element.querySelector('.ci-video-hotspot-gallery-arrow--next') as HTMLElement;
    const track = result!.element.querySelector('.ci-video-hotspot-gallery-track') as HTMLElement;

    next.click();
    expect(track.style.transform).toBe('translateX(-100%)');
  });

  it('clicking a dot goes to that slide', () => {
    const result = createGallery(images, 'Product', []);
    const dots = result!.element.querySelectorAll('.ci-video-hotspot-gallery-dot');
    const track = result!.element.querySelector('.ci-video-hotspot-gallery-track') as HTMLElement;

    (dots[2] as HTMLElement).click();
    expect(track.style.transform).toBe('translateX(-200%)');
    expect(dots[2].classList.contains('ci-video-hotspot-gallery-dot--active')).toBe(true);
  });

  it('pushes cleanups', () => {
    const cleanups: (() => void)[] = [];
    createGallery(images, 'Product', cleanups);
    expect(cleanups.length).toBeGreaterThan(0);
  });

  it('dots have aria-label and aria-selected', () => {
    const result = createGallery(images, 'Product', []);
    const dots = result!.element.querySelectorAll('.ci-video-hotspot-gallery-dot');

    expect(dots[0].getAttribute('aria-label')).toBe('Go to image 1');
    expect(dots[0].getAttribute('aria-selected')).toBe('true');
    expect(dots[1].getAttribute('aria-selected')).toBe('false');
  });
});
