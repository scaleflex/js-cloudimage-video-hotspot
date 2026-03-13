import { createElement } from '../utils/dom';
import { addListener } from '../utils/events';

const PREV_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>';
const NEXT_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>';

export interface HotspotNavOptions {
  onPrev: () => void;
  onNext: () => void;
}

export class HotspotNav {
  readonly element: HTMLElement;
  private prevBtn: HTMLButtonElement;
  private nextBtn: HTMLButtonElement;
  private counterEl: HTMLElement;
  private cleanups: (() => void)[] = [];

  constructor(options: HotspotNavOptions) {
    this.element = createElement('div', 'ci-video-hotspot-nav');

    this.prevBtn = createElement('button', 'ci-video-hotspot-nav-prev', {
      'aria-label': 'Previous hotspot',
      'type': 'button',
    });
    this.prevBtn.innerHTML = PREV_SVG;

    this.counterEl = createElement('span', 'ci-video-hotspot-nav-counter');
    this.counterEl.textContent = '0 of 0';

    this.nextBtn = createElement('button', 'ci-video-hotspot-nav-next', {
      'aria-label': 'Next hotspot',
      'type': 'button',
    });
    this.nextBtn.innerHTML = NEXT_SVG;

    this.element.appendChild(this.prevBtn);
    this.element.appendChild(this.counterEl);
    this.element.appendChild(this.nextBtn);

    this.cleanups.push(addListener(this.prevBtn, 'click', (e) => {
      e.stopPropagation();
      options.onPrev();
    }));

    this.cleanups.push(addListener(this.nextBtn, 'click', (e) => {
      e.stopPropagation();
      options.onNext();
    }));
  }

  /** Update the counter display */
  updateCounter(current: number, total: number): void {
    this.counterEl.textContent = `${current} of ${total}`;
    this.prevBtn.disabled = current <= 1;
    this.nextBtn.disabled = current >= total;
  }

  destroy(): void {
    this.cleanups.forEach((fn) => fn());
    this.cleanups = [];
    this.element.remove();
  }
}
