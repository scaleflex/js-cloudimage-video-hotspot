import type { VideoHotspotItem, PopoverData, ProductVariant, AddToCartEvent } from '../core/types';
import type { AnalyticsEmit } from '../core/analytics';
import { sanitizeHTML, isSafeUrl } from './sanitize';
import { createGallery } from './components/gallery';
import { createRating } from './components/rating';
import { createWishlist } from './components/wishlist';
import { createVariants } from './components/variants';
import { createCountdown } from './components/countdown';
import { createCustomFields } from './components/custom-fields';
import { createSecondaryCta } from './components/secondary-cta';

/**
 * Render the built-in product template from data fields.
 * Returns an HTMLElement (DOM-based) for event listener support.
 * Order: Gallery → Wishlist+Badge → Title → Rating → Price → Variants →
 *        Description → Countdown → Custom Fields → CTAs
 */
export function renderBuiltInTemplate(
  data: PopoverData,
  cleanups: (() => void)[] = [],
  hotspot: VideoHotspotItem | null = null,
  emitAnalytics?: AnalyticsEmit,
): HTMLElement {
  const root = document.createElement('div');
  root.className = 'ci-video-hotspot-popover-template';

  // === Gallery (multiple images) or single image fallback ===
  const galleryImages = data.images && data.images.length > 0 ? data.images : data.image ? [data.image] : [];
  let galleryResult: ReturnType<typeof createGallery> = null;
  if (galleryImages.length > 1) {
    galleryResult = createGallery(galleryImages, data.title || '', cleanups);
    if (galleryResult) root.appendChild(galleryResult.element);
  } else if (galleryImages.length === 1) {
    // Single image — use the classic image wrapper
    const wrapper = document.createElement('div');
    wrapper.className = 'ci-video-hotspot-popover-image-wrapper';
    const img = document.createElement('img');
    img.className = 'ci-video-hotspot-popover-image';
    img.src = galleryImages[0];
    img.alt = data.title || '';
    wrapper.appendChild(img);
    root.appendChild(wrapper);
  }

  // === Body ===
  const body = document.createElement('div');
  body.className = 'ci-video-hotspot-popover-body';

  // Wishlist + Badge row
  const hasWishlist = data.wishlist;
  const hasBadge = !!data.badge;
  if (hasWishlist || hasBadge) {
    const topRow = document.createElement('div');
    topRow.className = 'ci-video-hotspot-popover-top-row';

    if (hasBadge) {
      const badge = document.createElement('span');
      badge.className = 'ci-video-hotspot-popover-badge';
      badge.textContent = data.badge!;
      topRow.appendChild(badge);
    }

    const wishlistCallback = (wishlisted: boolean, h: VideoHotspotItem) => {
      (data.onWishlistToggle as ((wishlisted: boolean, hotspot: VideoHotspotItem) => void) | undefined)?.(wishlisted, h);
      emitAnalytics?.('wishlist_toggle', h.id, { wishlisted });
    };
    const wishlistResult = createWishlist(
      data.wishlist,
      data.wishlisted,
      hotspot,
      hotspot ? wishlistCallback : undefined,
      cleanups,
    );
    if (wishlistResult) {
      topRow.appendChild(wishlistResult.element);
    }

    body.appendChild(topRow);
  }

  // Title
  if (data.title) {
    const title = document.createElement('h3');
    title.className = 'ci-video-hotspot-popover-title';
    title.textContent = data.title;
    body.appendChild(title);
  }

  // Rating
  const ratingEl = createRating(data.rating, data.reviewCount);
  if (ratingEl) body.appendChild(ratingEl);

  // Price row
  let priceValueEl: HTMLElement | null = null;
  if (data.originalPrice || data.price) {
    const priceRow = document.createElement('div');
    priceRow.className = 'ci-video-hotspot-popover-price-row';

    if (data.originalPrice) {
      const orig = document.createElement('span');
      orig.className = 'ci-video-hotspot-popover-original-price';
      orig.textContent = data.originalPrice;
      priceRow.appendChild(orig);
    }

    if (data.price) {
      priceValueEl = document.createElement('span');
      priceValueEl.className = 'ci-video-hotspot-popover-price';
      priceValueEl.textContent = data.price;
      priceRow.appendChild(priceValueEl);
    }

    body.appendChild(priceRow);
  }

  // Gallery update function for variant image switching
  const galleryUpdateFn = galleryResult ? (imageUrl: string) => galleryResult!.setMainImage(imageUrl) : null;

  // Variants
  const variantCallback = (v: ProductVariant, all: ProductVariant[], h: VideoHotspotItem) => {
    (data.onVariantSelect as ((v: ProductVariant, all: ProductVariant[], h: VideoHotspotItem) => void) | undefined)?.(v, all, h);
    emitAnalytics?.('variant_select', h.id, { variantId: v.id, variantType: v.type, variantLabel: v.label });
  };
  const variantsResult = createVariants(
    data.variants,
    hotspot,
    priceValueEl,
    hotspot ? variantCallback : undefined,
    cleanups,
    galleryUpdateFn,
  );
  if (variantsResult) body.appendChild(variantsResult.element);

  // Description
  if (data.description) {
    const desc = document.createElement('p');
    desc.className = 'ci-video-hotspot-popover-description';
    desc.textContent = data.description;
    body.appendChild(desc);
  }

  // Build primary CTA element early so countdown can reference it for disable-on-expiry
  let ctaEl: HTMLElement | null = null;
  const hasPrimaryCta = data.url && isSafeUrl(data.url);
  const hasAddToCart = typeof data.onAddToCart === 'function';

  if (hasAddToCart) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'ci-video-hotspot-popover-cta';
    btn.textContent = data.ctaText || 'Add to cart';
    ctaEl = btn;

    const onClick = (e: Event) => {
      e.stopPropagation();
      const event: AddToCartEvent = {
        hotspot: hotspot!,
        quantity: 1,
        sku: data.sku,
        title: data.title,
        price: priceValueEl?.textContent || data.price,
        selectedVariants: variantsResult ? variantsResult.getSelected() : [],
      };
      (data.onAddToCart as (e: AddToCartEvent) => void)(event);
      emitAnalytics?.('add_to_cart', hotspot!.id, {
        sku: data.sku,
        title: data.title,
        price: priceValueEl?.textContent || data.price,
        quantity: 1,
      });
    };

    btn.addEventListener('click', onClick);
    cleanups.push(() => btn.removeEventListener('click', onClick));
  } else if (hasPrimaryCta) {
    const a = document.createElement('a');
    a.className = 'ci-video-hotspot-popover-cta';
    a.href = data.url!;
    a.target = '_blank';
    a.rel = 'noopener';
    a.textContent = data.ctaText || 'View details';
    ctaEl = a;

    if (emitAnalytics && hotspot) {
      const onCtaClick = () => {
        emitAnalytics('cta_click', hotspot.id, { url: data.url });
      };
      a.addEventListener('click', onCtaClick);
      cleanups.push(() => a.removeEventListener('click', onCtaClick));
    }
  }

  // Countdown (created after CTA so it can disable on expiry)
  const countdownResult = createCountdown(data.countdown, data.countdownLabel, ctaEl, cleanups);
  if (countdownResult) body.appendChild(countdownResult.element);

  // Custom fields
  const customFieldsEl = createCustomFields(data.customFields);
  if (customFieldsEl) body.appendChild(customFieldsEl);

  // CTAs container
  const secondaryCtaEl = createSecondaryCta(data.secondaryCta, hotspot, cleanups);
  if (ctaEl || secondaryCtaEl) {
    const ctaRow = document.createElement('div');
    ctaRow.className = 'ci-video-hotspot-popover-cta-row';

    if (ctaEl) ctaRow.appendChild(ctaEl);
    if (secondaryCtaEl) ctaRow.appendChild(secondaryCtaEl);

    body.appendChild(ctaRow);
  }

  if (body.childNodes.length > 0) {
    root.appendChild(body);
  }

  return root;
}

/**
 * Render popover content with priority: renderFn > content string > data template.
 */
export function renderPopoverContent(
  hotspot: VideoHotspotItem,
  renderFn?: (hotspot: VideoHotspotItem) => string | HTMLElement,
  cleanups?: (() => void)[],
  emitAnalytics?: AnalyticsEmit,
): string | HTMLElement {
  if (renderFn) {
    return renderFn(hotspot);
  }

  if (hotspot.content) {
    return sanitizeHTML(hotspot.content);
  }

  if (hotspot.data) {
    return renderBuiltInTemplate(hotspot.data, cleanups || [], hotspot, emitAnalytics);
  }

  return '';
}
