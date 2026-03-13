import { describe, it, expect, vi } from 'vitest';
import { renderBuiltInTemplate, renderPopoverContent } from '../src/popover/template';
import type { PopoverData, VideoHotspotItem } from '../src/core/types';

const makeHotspot = (id = 'h1'): VideoHotspotItem => ({
  id, x: 50, y: 50, startTime: 0, endTime: 10, label: 'Test',
});

describe('renderBuiltInTemplate (enhanced)', () => {
  it('renders basic title/price/image (backward compat)', () => {
    const data: PopoverData = {
      title: 'Test Product',
      price: '$29.99',
      image: 'https://example.com/img.jpg',
    };
    const el = renderBuiltInTemplate(data);

    expect(el).toBeInstanceOf(HTMLElement);
    expect(el.querySelector('.ci-video-hotspot-popover-title')?.textContent).toBe('Test Product');
    expect(el.querySelector('.ci-video-hotspot-popover-price')?.textContent).toBe('$29.99');
    expect(el.querySelector('.ci-video-hotspot-popover-image')).not.toBeNull();
  });

  it('renders single image wrapper for single image', () => {
    const el = renderBuiltInTemplate({ image: 'https://example.com/a.jpg' });
    expect(el.querySelector('.ci-video-hotspot-popover-image-wrapper')).not.toBeNull();
    expect(el.querySelector('.ci-video-hotspot-gallery')).toBeNull();
  });

  it('renders gallery for multiple images', () => {
    const el = renderBuiltInTemplate({
      images: ['https://example.com/a.jpg', 'https://example.com/b.jpg'],
    });
    expect(el.querySelector('.ci-video-hotspot-gallery')).not.toBeNull();
    expect(el.querySelector('.ci-video-hotspot-popover-image-wrapper')).toBeNull();
  });

  it('renders rating', () => {
    const el = renderBuiltInTemplate({ rating: 4.5, reviewCount: 99 });
    expect(el.querySelector('.ci-video-hotspot-rating')).not.toBeNull();
    expect(el.querySelector('.ci-video-hotspot-rating-count')?.textContent).toBe('(99)');
  });

  it('renders badge', () => {
    const el = renderBuiltInTemplate({ badge: 'SALE' });
    expect(el.querySelector('.ci-video-hotspot-popover-badge')?.textContent).toBe('SALE');
  });

  it('renders wishlist button', () => {
    const cleanups: (() => void)[] = [];
    const el = renderBuiltInTemplate({ wishlist: true }, cleanups, makeHotspot());
    expect(el.querySelector('.ci-video-hotspot-wishlist')).not.toBeNull();
  });

  it('renders variants', () => {
    const el = renderBuiltInTemplate({
      variants: [
        { id: 's', type: 'size', label: 'S' },
        { id: 'm', type: 'size', label: 'M', selected: true },
      ],
    });
    expect(el.querySelector('.ci-video-hotspot-variants')).not.toBeNull();
    expect(el.querySelectorAll('.ci-video-hotspot-variant-pill').length).toBe(2);
  });

  it('renders description', () => {
    const el = renderBuiltInTemplate({ description: 'Nice product' });
    expect(el.querySelector('.ci-video-hotspot-popover-description')?.textContent).toBe('Nice product');
  });

  it('renders countdown', () => {
    const future = new Date(Date.now() + 60000).toISOString();
    const el = renderBuiltInTemplate({
      countdown: future,
      countdownLabel: 'Ends in',
    });
    expect(el.querySelector('.ci-video-hotspot-countdown')).not.toBeNull();
    expect(el.querySelector('.ci-video-hotspot-countdown-label')?.textContent).toBe('Ends in');
  });

  it('renders custom fields', () => {
    const el = renderBuiltInTemplate({
      customFields: [
        { label: 'Material', value: 'Cotton' },
        { label: 'Weight', value: '200g' },
      ],
    });
    expect(el.querySelector('.ci-video-hotspot-custom-fields')).not.toBeNull();
    const labels = el.querySelectorAll('.ci-video-hotspot-custom-field-label');
    expect(labels.length).toBe(2);
    expect(labels[0].textContent).toBe('Material');
  });

  it('renders secondary CTA with URL', () => {
    const el = renderBuiltInTemplate({
      secondaryCta: { text: 'Compare', url: 'https://example.com/compare' },
    });
    const cta = el.querySelector('.ci-video-hotspot-secondary-cta') as HTMLAnchorElement;
    expect(cta).not.toBeNull();
    expect(cta.tagName).toBe('A');
    expect(cta.href).toContain('example.com');
    expect(cta.textContent).toBe('Compare');
  });

  it('renders secondary CTA as button without URL', () => {
    const el = renderBuiltInTemplate({
      secondaryCta: { text: 'Details' },
    });
    const cta = el.querySelector('.ci-video-hotspot-secondary-cta');
    expect(cta?.tagName).toBe('BUTTON');
  });

  it('renders secondary CTA with onClick', () => {
    const onClick = vi.fn();
    const hotspot = makeHotspot();
    const cleanups: (() => void)[] = [];
    const el = renderBuiltInTemplate(
      { secondaryCta: { text: 'Quick View', onClick } },
      cleanups,
      hotspot,
    );
    const cta = el.querySelector('.ci-video-hotspot-secondary-cta') as HTMLButtonElement;
    expect(cta.tagName).toBe('BUTTON');
    cta.click();
    expect(onClick).toHaveBeenCalledWith(hotspot);
  });

  it('renders primary CTA as link for url', () => {
    const el = renderBuiltInTemplate({
      url: 'https://example.com',
      ctaText: 'Shop Now',
    });
    const cta = el.querySelector('.ci-video-hotspot-popover-cta') as HTMLAnchorElement;
    expect(cta.tagName).toBe('A');
    expect(cta.textContent).toBe('Shop Now');
  });

  it('renders add-to-cart CTA button with hotspot and quantity', () => {
    const onAddToCart = vi.fn();
    const hotspot = makeHotspot();
    const cleanups: (() => void)[] = [];
    const el = renderBuiltInTemplate(
      { title: 'Shirt', price: '$20', onAddToCart, sku: 'SKU-001' },
      cleanups,
      hotspot,
    );

    const cta = el.querySelector('.ci-video-hotspot-popover-cta') as HTMLButtonElement;
    expect(cta.tagName).toBe('BUTTON');
    expect(cta.textContent).toBe('Add to cart');

    cta.click();
    expect(onAddToCart).toHaveBeenCalledTimes(1);
    expect(onAddToCart.mock.calls[0][0].hotspot).toBe(hotspot);
    expect(onAddToCart.mock.calls[0][0].quantity).toBe(1);
    expect(onAddToCart.mock.calls[0][0].sku).toBe('SKU-001');
    expect(onAddToCart.mock.calls[0][0].title).toBe('Shirt');
    expect(onAddToCart.mock.calls[0][0].price).toBe('$20');
  });

  it('does not render CTA for unsafe URL', () => {
    const el = renderBuiltInTemplate({
      url: 'javascript:alert(1)',
      ctaText: 'Evil',
    });
    expect(el.querySelector('.ci-video-hotspot-popover-cta')).toBeNull();
  });

  it('does not XSS via title', () => {
    const el = renderBuiltInTemplate({ title: '<script>alert(1)</script>' });
    const title = el.querySelector('.ci-video-hotspot-popover-title');
    expect(title?.innerHTML).not.toContain('<script>');
    expect(title?.textContent).toContain('<script>');
  });

  it('original price has line-through style class', () => {
    const el = renderBuiltInTemplate({ originalPrice: '$49', price: '$29' });
    expect(el.querySelector('.ci-video-hotspot-popover-original-price')?.textContent).toBe('$49');
  });

  it('returns empty body when no data fields', () => {
    const el = renderBuiltInTemplate({});
    // Should return template root with no body content
    expect(el.querySelector('.ci-video-hotspot-popover-body')).toBeNull();
  });
});

describe('renderPopoverContent', () => {
  it('uses renderFn when provided', () => {
    const hotspot: VideoHotspotItem = {
      id: 'h1', x: 50, y: 50, startTime: 0, endTime: 10, label: 'Test',
      data: { title: 'Ignored' },
    };
    const el = document.createElement('div');
    el.textContent = 'Custom';
    const result = renderPopoverContent(hotspot, () => el);
    expect(result).toBe(el);
  });

  it('uses content when no renderFn', () => {
    const hotspot: VideoHotspotItem = {
      id: 'h1', x: 50, y: 50, startTime: 0, endTime: 10, label: 'Test',
      content: '<p>Hello</p>',
    };
    const result = renderPopoverContent(hotspot);
    expect(typeof result).toBe('string');
    expect(result).toContain('Hello');
  });

  it('uses data template when no content', () => {
    const hotspot: VideoHotspotItem = {
      id: 'h1', x: 50, y: 50, startTime: 0, endTime: 10, label: 'Test',
      data: { title: 'Product' },
    };
    const cleanups: (() => void)[] = [];
    const result = renderPopoverContent(hotspot, undefined, cleanups);
    expect(result).toBeInstanceOf(HTMLElement);
  });

  it('returns empty string when no data', () => {
    const hotspot: VideoHotspotItem = {
      id: 'h1', x: 50, y: 50, startTime: 0, endTime: 10, label: 'Test',
    };
    expect(renderPopoverContent(hotspot)).toBe('');
  });

  it('passes cleanups to renderBuiltInTemplate', () => {
    const hotspot: VideoHotspotItem = {
      id: 'h1', x: 50, y: 50, startTime: 0, endTime: 10, label: 'Test',
      data: { wishlist: true },
    };
    const cleanups: (() => void)[] = [];
    renderPopoverContent(hotspot, undefined, cleanups);
    expect(cleanups.length).toBeGreaterThan(0);
  });
});
