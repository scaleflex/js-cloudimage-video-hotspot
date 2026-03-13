import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createAnalyticsEmitter, type AnalyticsEmit } from '../src/core/analytics';
import { renderBuiltInTemplate } from '../src/popover/template';
import type { AnalyticsEvent, PopoverData, VideoHotspotItem } from '../src/core/types';

const makeHotspot = (id = 'h1'): VideoHotspotItem => ({
  id, x: 50, y: 50, startTime: 0, endTime: 10, label: 'Test',
});

describe('createAnalyticsEmitter', () => {
  it('returns no-op when callback is undefined', () => {
    const emit = createAnalyticsEmitter(undefined, () => 5);
    // Should not throw
    emit('hotspot_show', 'h1');
    emit('add_to_cart', 'h2', { sku: 'X' });
  });

  it('emits correct event shape', () => {
    const cb = vi.fn();
    const emit = createAnalyticsEmitter(cb, () => 12.5);

    emit('hotspot_show', 'h1');

    expect(cb).toHaveBeenCalledTimes(1);
    const event: AnalyticsEvent = cb.mock.calls[0][0];
    expect(event.type).toBe('hotspot_show');
    expect(event.hotspotId).toBe('h1');
    expect(typeof event.timestamp).toBe('number');
    expect(event.videoTime).toBe(12.5);
    expect(event.data).toBeUndefined();
  });

  it('includes data when provided', () => {
    const cb = vi.fn();
    const emit = createAnalyticsEmitter(cb, () => 0);

    emit('add_to_cart', 'h2', { sku: 'SKU-1', quantity: 2 });

    const event: AnalyticsEvent = cb.mock.calls[0][0];
    expect(event.data).toEqual({ sku: 'SKU-1', quantity: 2 });
  });

  it('captures videoTime from getter', () => {
    const cb = vi.fn();
    let time = 3;
    const emit = createAnalyticsEmitter(cb, () => time);

    emit('hotspot_click', 'h1');
    expect(cb.mock.calls[0][0].videoTime).toBe(3);

    time = 7;
    emit('hotspot_click', 'h1');
    expect(cb.mock.calls[1][0].videoTime).toBe(7);
  });

  it('emits all 8 event types', () => {
    const cb = vi.fn();
    const emit = createAnalyticsEmitter(cb, () => 0);

    const types = [
      'hotspot_show', 'hotspot_click', 'popover_open', 'popover_close',
      'cta_click', 'add_to_cart', 'variant_select', 'wishlist_toggle',
    ] as const;

    for (const type of types) {
      emit(type, 'h1');
    }

    expect(cb).toHaveBeenCalledTimes(8);
    types.forEach((type, i) => {
      expect(cb.mock.calls[i][0].type).toBe(type);
    });
  });

  it('uses Date.now() for timestamp', () => {
    const cb = vi.fn();
    const emit = createAnalyticsEmitter(cb, () => 0);

    const before = Date.now();
    emit('hotspot_show', 'h1');
    const after = Date.now();

    const ts = cb.mock.calls[0][0].timestamp;
    expect(ts).toBeGreaterThanOrEqual(before);
    expect(ts).toBeLessThanOrEqual(after);
  });
});

describe('template analytics integration', () => {
  let emitAnalytics: AnalyticsEmit;
  let analyticsCb: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    analyticsCb = vi.fn();
    emitAnalytics = createAnalyticsEmitter(analyticsCb, () => 5.0);
  });

  it('emits add_to_cart on CTA button click', () => {
    const onAddToCart = vi.fn();
    const hotspot = makeHotspot();
    const cleanups: (() => void)[] = [];
    const data: PopoverData = {
      title: 'Shirt',
      price: '$20',
      sku: 'SKU-001',
      onAddToCart,
    };

    const el = renderBuiltInTemplate(data, cleanups, hotspot, emitAnalytics);
    const btn = el.querySelector('.ci-video-hotspot-popover-cta') as HTMLButtonElement;
    btn.click();

    expect(onAddToCart).toHaveBeenCalledTimes(1);
    expect(analyticsCb).toHaveBeenCalledTimes(1);

    const event: AnalyticsEvent = analyticsCb.mock.calls[0][0];
    expect(event.type).toBe('add_to_cart');
    expect(event.hotspotId).toBe('h1');
    expect(event.data).toEqual({
      sku: 'SKU-001',
      title: 'Shirt',
      price: '$20',
      quantity: 1,
    });
  });

  it('emits cta_click on CTA link click', () => {
    const hotspot = makeHotspot();
    const cleanups: (() => void)[] = [];
    const data: PopoverData = {
      url: 'https://example.com/product',
      ctaText: 'View',
    };

    const el = renderBuiltInTemplate(data, cleanups, hotspot, emitAnalytics);
    const link = el.querySelector('.ci-video-hotspot-popover-cta') as HTMLAnchorElement;
    link.click();

    expect(analyticsCb).toHaveBeenCalledTimes(1);
    const event: AnalyticsEvent = analyticsCb.mock.calls[0][0];
    expect(event.type).toBe('cta_click');
    expect(event.hotspotId).toBe('h1');
    expect(event.data).toEqual({ url: 'https://example.com/product' });
  });

  it('emits wishlist_toggle on wishlist click', () => {
    const onWishlistToggle = vi.fn();
    const hotspot = makeHotspot();
    const cleanups: (() => void)[] = [];
    const data: PopoverData = {
      wishlist: true,
      wishlisted: false,
      onWishlistToggle,
    };

    const el = renderBuiltInTemplate(data, cleanups, hotspot, emitAnalytics);
    const btn = el.querySelector('.ci-video-hotspot-wishlist') as HTMLButtonElement;
    btn.click();

    expect(onWishlistToggle).toHaveBeenCalledWith(true, hotspot);
    expect(analyticsCb).toHaveBeenCalledTimes(1);

    const event: AnalyticsEvent = analyticsCb.mock.calls[0][0];
    expect(event.type).toBe('wishlist_toggle');
    expect(event.hotspotId).toBe('h1');
    expect(event.data).toEqual({ wishlisted: true });
  });

  it('emits variant_select on variant click', () => {
    const onVariantSelect = vi.fn();
    const hotspot = makeHotspot();
    const cleanups: (() => void)[] = [];
    const data: PopoverData = {
      variants: [
        { id: 's', type: 'size', label: 'S' },
        { id: 'm', type: 'size', label: 'M' },
      ],
      onVariantSelect,
    };

    const el = renderBuiltInTemplate(data, cleanups, hotspot, emitAnalytics);
    const pills = el.querySelectorAll('.ci-video-hotspot-variant-pill');
    (pills[1] as HTMLButtonElement).click();

    expect(onVariantSelect).toHaveBeenCalledTimes(1);
    expect(analyticsCb).toHaveBeenCalledTimes(1);

    const event: AnalyticsEvent = analyticsCb.mock.calls[0][0];
    expect(event.type).toBe('variant_select');
    expect(event.hotspotId).toBe('h1');
    expect(event.data).toEqual({ variantId: 'm', variantType: 'size', variantLabel: 'M' });
  });

  it('emits analytics even when user callback is absent', () => {
    const hotspot = makeHotspot();
    const cleanups: (() => void)[] = [];

    // Wishlist without onWishlistToggle
    const data: PopoverData = {
      wishlist: true,
    };

    const el = renderBuiltInTemplate(data, cleanups, hotspot, emitAnalytics);
    const btn = el.querySelector('.ci-video-hotspot-wishlist') as HTMLButtonElement;
    btn.click();

    expect(analyticsCb).toHaveBeenCalledTimes(1);
    expect(analyticsCb.mock.calls[0][0].type).toBe('wishlist_toggle');
  });

  it('emits variant_select without user callback', () => {
    const hotspot = makeHotspot();
    const cleanups: (() => void)[] = [];
    const data: PopoverData = {
      variants: [
        { id: 'red', type: 'color', label: 'Red', color: '#f00' },
      ],
    };

    const el = renderBuiltInTemplate(data, cleanups, hotspot, emitAnalytics);
    // Color swatches use a different class
    const swatch = el.querySelector('.ci-video-hotspot-variant-swatch') as HTMLButtonElement;
    swatch.click();

    expect(analyticsCb).toHaveBeenCalledTimes(1);
    expect(analyticsCb.mock.calls[0][0].type).toBe('variant_select');
    expect(analyticsCb.mock.calls[0][0].data).toEqual({
      variantId: 'red',
      variantType: 'color',
      variantLabel: 'Red',
    });
  });

  it('does not emit when emitAnalytics is not provided', () => {
    const onAddToCart = vi.fn();
    const hotspot = makeHotspot();
    const cleanups: (() => void)[] = [];
    const data: PopoverData = {
      title: 'Shirt',
      price: '$20',
      sku: 'SKU-001',
      onAddToCart,
    };

    // No emitAnalytics parameter
    const el = renderBuiltInTemplate(data, cleanups, hotspot);
    const btn = el.querySelector('.ci-video-hotspot-popover-cta') as HTMLButtonElement;
    btn.click();

    expect(onAddToCart).toHaveBeenCalledTimes(1);
    // No analytics callback should be registered
    expect(analyticsCb).not.toHaveBeenCalled();
  });
});
