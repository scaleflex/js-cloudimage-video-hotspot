import type { VideoHotspotItem, Placement } from '../core/types';
import type { AnalyticsEmit } from '../core/analytics';
import { createElement, addClass, removeClass } from '../utils/dom';
import { computePosition } from './position';
import { renderPopoverContent } from './template';

export interface PopoverOptions {
  placement: Placement;
  triggerMode: 'hover' | 'click';
  renderFn?: (hotspot: VideoHotspotItem) => string | HTMLElement;
  onOpen?: (hotspot: VideoHotspotItem) => void;
  onClose?: (hotspot: VideoHotspotItem) => void;
  emitAnalytics?: AnalyticsEmit;
}

export class Popover {
  readonly element: HTMLElement;
  private arrowEl: HTMLElement;
  private contentEl: HTMLElement;
  private visible = false;
  private hideTimer: ReturnType<typeof setTimeout> | undefined;
  private hotspot: VideoHotspotItem;
  private markerEl: HTMLElement | null = null;
  private containerEl: HTMLElement | null = null;
  private options: PopoverOptions;
  private hoverCleanups: (() => void)[] = [];
  private componentCleanups: (() => void)[] = [];

  constructor(hotspot: VideoHotspotItem, options: PopoverOptions) {
    this.hotspot = hotspot;
    this.options = options;

    const isDialog = options.triggerMode === 'click';
    this.element = createElement('div', 'ci-video-hotspot-popover', {
      'role': isDialog ? 'dialog' : 'tooltip',
      'id': `ci-video-hotspot-popover-${hotspot.id}`,
      'aria-hidden': 'true',
      'data-placement': options.placement === 'auto' ? 'top' : options.placement,
      ...(isDialog && hotspot.label ? { 'aria-label': hotspot.label } : {}),
    });

    this.arrowEl = createElement('div', 'ci-video-hotspot-popover-arrow');
    this.contentEl = createElement('div', 'ci-video-hotspot-popover-content');

    // Close button
    const closeBtn = createElement('button', 'ci-video-hotspot-popover-close', {
      'type': 'button',
      'aria-label': 'Close',
    });
    closeBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.hide();
    });

    this.element.appendChild(this.arrowEl);
    this.element.appendChild(closeBtn);
    this.element.appendChild(this.contentEl);

    // Render content
    const content = renderPopoverContent(hotspot, options.renderFn, this.componentCleanups, options.emitAnalytics);
    if (typeof content === 'string') {
      this.contentEl.innerHTML = content;
    } else if (content instanceof HTMLElement) {
      this.contentEl.appendChild(content);
    }

    // Hover delay: clear hide timer when mouse enters popover
    if (options.triggerMode === 'hover') {
      const onEnter = () => this.clearHideTimer();
      const onLeave = () => this.scheduleHide();
      this.element.addEventListener('mouseenter', onEnter);
      this.element.addEventListener('mouseleave', onLeave);
      this.hoverCleanups.push(
        () => this.element.removeEventListener('mouseenter', onEnter),
        () => this.element.removeEventListener('mouseleave', onLeave),
      );
    }
  }

  /** Mount the popover to a container, associating it with a marker */
  mount(containerEl: HTMLElement, markerEl: HTMLElement): void {
    this.containerEl = containerEl;
    this.markerEl = markerEl;
    containerEl.appendChild(this.element);

    if (this.options.triggerMode === 'click') {
      markerEl.setAttribute('aria-haspopup', 'dialog');
      markerEl.setAttribute('aria-controls', this.element.id);
    } else {
      markerEl.setAttribute('aria-describedby', this.element.id);
    }
  }

  /** Show the popover */
  show(): void {
    this.clearHideTimer();
    if (this.visible) return;
    this.visible = true;

    addClass(this.element, 'ci-video-hotspot-popover--visible');
    this.element.setAttribute('aria-hidden', 'false');

    this.updatePosition();
    this.options.onOpen?.(this.hotspot);
  }

  /** Schedule hide with delay (for hover mode) */
  scheduleHide(delay: number = 200): void {
    this.clearHideTimer();
    this.hideTimer = setTimeout(() => {
      this.hide();
    }, delay);
  }

  /** Hide the popover immediately */
  hide(): void {
    this.clearHideTimer();
    if (!this.visible) return;
    this.visible = false;

    removeClass(this.element, 'ci-video-hotspot-popover--visible');
    this.element.setAttribute('aria-hidden', 'true');

    this.options.onClose?.(this.hotspot);
  }

  /** Clear any pending hide timer */
  clearHideTimer(): void {
    if (this.hideTimer !== undefined) {
      clearTimeout(this.hideTimer);
      this.hideTimer = undefined;
    }
  }

  /** Update popover position relative to marker */
  updatePosition(): void {
    if (!this.markerEl || !this.containerEl || !this.visible) return;

    const result = computePosition(
      this.markerEl,
      this.element,
      this.containerEl,
      { placement: this.options.placement },
    );

    this.element.style.left = `${result.x}px`;
    this.element.style.top = `${result.y}px`;
    this.element.setAttribute('data-placement', result.placement);

    this.positionArrow(result.placement, result.arrowOffset);
  }

  private positionArrow(placement: Placement, offset: number): void {
    const arrow = this.arrowEl;
    arrow.style.left = '';
    arrow.style.top = '';

    if (placement === 'top' || placement === 'bottom') {
      arrow.style.left = `calc(50% - var(--ci-video-hotspot-arrow-size) + ${offset}px)`;
    } else {
      arrow.style.top = `calc(50% - var(--ci-video-hotspot-arrow-size) + ${offset}px)`;
    }
  }

  isVisible(): boolean {
    return this.visible;
  }

  getHotspot(): VideoHotspotItem {
    return this.hotspot;
  }

  destroy(): void {
    this.clearHideTimer();
    this.componentCleanups.forEach((fn) => fn());
    this.componentCleanups = [];
    this.hoverCleanups.forEach((fn) => fn());
    this.hoverCleanups = [];
    this.markerEl?.removeAttribute('aria-describedby');
    this.markerEl?.removeAttribute('aria-controls');
    this.markerEl?.removeAttribute('aria-haspopup');
    this.element.remove();
    this.markerEl = null;
    this.containerEl = null;
  }
}
