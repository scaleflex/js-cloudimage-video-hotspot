import type { ProductVariant, VideoHotspotItem } from '../../core/types';

export interface VariantsResult {
  element: HTMLElement;
  getSelected(): ProductVariant[];
}

/** Create variant selector (pills + color swatches). Returns null if no variants. */
export function createVariants(
  variants: ProductVariant[] | undefined,
  hotspot: VideoHotspotItem | null,
  priceEl: HTMLElement | null,
  onSelect: ((variant: ProductVariant, allSelected: ProductVariant[], hotspot: VideoHotspotItem) => void) | undefined,
  cleanups: (() => void)[],
  galleryUpdateFn: ((imageUrl: string) => void) | null = null,
): VariantsResult | null {
  if (!variants || variants.length === 0) return null;

  // Group by type
  const groups = new Map<string, ProductVariant[]>();
  for (const v of variants) {
    const list = groups.get(v.type) || [];
    list.push(v);
    groups.set(v.type, list);
  }

  // Track selected variant per type
  const selected = new Map<string, ProductVariant>();
  for (const v of variants) {
    if (v.selected) selected.set(v.type, v);
  }

  const container = document.createElement('div');
  container.className = 'ci-video-hotspot-variants';

  for (const [type, items] of groups) {
    const group = document.createElement('div');
    group.className = 'ci-video-hotspot-variant-group';
    group.setAttribute('role', 'radiogroup');
    group.setAttribute('aria-label', type);

    const label = document.createElement('span');
    label.className = 'ci-video-hotspot-variant-label';
    label.textContent = type.charAt(0).toUpperCase() + type.slice(1);
    group.appendChild(label);

    const options = document.createElement('div');
    options.className = 'ci-video-hotspot-variant-options';

    for (const variant of items) {
      const isColor = type === 'color' && variant.color;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.setAttribute('role', 'radio');
      btn.setAttribute('aria-checked', String(variant.selected ?? false));
      btn.setAttribute('aria-label', variant.label);

      if (isColor) {
        btn.className = 'ci-video-hotspot-variant-swatch';
        btn.style.backgroundColor = variant.color!;
        btn.title = variant.label;
      } else {
        btn.className = 'ci-video-hotspot-variant-pill';
        btn.textContent = variant.label;
      }

      const isAvailable = variant.available !== false;
      if (!isAvailable) {
        btn.disabled = true;
        btn.classList.add('ci-video-hotspot-variant--disabled');
      }

      if (selected.get(type)?.id === variant.id) {
        btn.classList.add('ci-video-hotspot-variant--selected');
        btn.setAttribute('aria-checked', 'true');
      }

      const onClick = (e: Event) => {
        e.stopPropagation();
        if (!isAvailable) return;

        // Deselect all in same group
        const siblings = options.querySelectorAll('button');
        siblings.forEach((s) => {
          s.classList.remove('ci-video-hotspot-variant--selected');
          s.setAttribute('aria-checked', 'false');
        });

        // Select this one
        btn.classList.add('ci-video-hotspot-variant--selected');
        btn.setAttribute('aria-checked', 'true');
        selected.set(type, variant);

        // Update price if variant has price override
        if (variant.price && priceEl) {
          priceEl.textContent = variant.price;
        }

        // Update gallery image if variant has image
        if (variant.image && galleryUpdateFn) {
          galleryUpdateFn(variant.image);
        }

        if (hotspot) onSelect?.(variant, Array.from(selected.values()), hotspot);
      };

      btn.addEventListener('click', onClick);
      cleanups.push(() => btn.removeEventListener('click', onClick));

      options.appendChild(btn);
    }

    group.appendChild(options);
    container.appendChild(group);
  }

  return {
    element: container,
    getSelected: () => Array.from(selected.values()),
  };
}
