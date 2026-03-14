import { createElement, addClass, removeClass } from '../utils/dom';
import { addListener } from '../utils/events';
import { formatTime } from '../utils/time';
import type { VideoChapter } from '../core/types';
import { ProgressBar } from './progress-bar';
import type { ProgressBarOptions } from './progress-bar';

// Lucide SVG icons
const PLAY_SVG = '<svg viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>';
const PAUSE_SVG = '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>';
const VOLUME_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11,5 6,9 2,9 2,15 6,15 11,19"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>';
const VOLUME_MUTE_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11,5 6,9 2,9 2,15 6,15 11,19"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>';
const FULLSCREEN_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" x2="14" y1="3" y2="10"/><line x1="3" x2="10" y1="21" y2="14"/></svg>';
const FULLSCREEN_EXIT_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="14" x2="21" y1="10" y2="3"/><line x1="3" x2="10" y1="21" y2="14"/></svg>';
const REPEAT_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>';

export interface ControlsOptions {
  onPlay: () => void;
  onPause: () => void;
  onSeek: (time: number) => void;
  onVolumeChange: (volume: number) => void;
  onMuteToggle: () => void;
  onFullscreenToggle: () => void;
  onSpeedChange: (rate: number) => void;
  onLoopToggle: () => void;
  isLooping: () => boolean;
  getDuration: () => number;
  getCurrentTime: () => number;
  getBufferedEnd: () => number;
  isPaused: () => boolean;
  isMuted: () => boolean;
  getVolume: () => number;
  getPlaybackRate: () => number;
  isFullscreen: () => boolean;
  showFullscreen: boolean;
  chapters?: VideoChapter[];
  showChapterNav: boolean;
  onChapterSelect?: (chapterId: string) => void;
  progressBarOptions: Omit<ProgressBarOptions, 'onSeek' | 'getDuration' | 'getCurrentTime' | 'getBufferedEnd'>;
}

export class Controls {
  readonly element: HTMLElement;
  private playBtn: HTMLButtonElement;
  private timeDisplay: HTMLElement;
  private volumeBtn: HTMLButtonElement;
  private volumeSlider: HTMLInputElement;
  private speedBtn: HTMLButtonElement;
  private loopBtn: HTMLButtonElement;
  private fullscreenBtn: HTMLButtonElement | null;
  private chapterBtn: HTMLButtonElement | null = null;
  private chapterDropdown: HTMLElement | null = null;
  private speedDropdown: HTMLElement | null = null;
  private pendingSpeed: number | null = null;
  readonly progressBar: ProgressBar;
  private cleanups: (() => void)[] = [];
  private options: ControlsOptions;
  private idleTimer: ReturnType<typeof setTimeout> | undefined;
  private static readonly SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

  constructor(options: ControlsOptions) {
    this.options = options;

    this.element = createElement('div', 'ci-video-hotspot-controls');

    // Progress bar
    this.progressBar = new ProgressBar({
      ...options.progressBarOptions,
      onSeek: options.onSeek,
      getDuration: options.getDuration,
      getCurrentTime: options.getCurrentTime,
      getBufferedEnd: options.getBufferedEnd,
    });
    this.element.appendChild(this.progressBar.element);

    // Controls row
    const row = createElement('div', 'ci-video-hotspot-controls-row');

    // Left group
    const leftGroup = createElement('div', 'ci-video-hotspot-controls-left');

    // Play/Pause
    this.playBtn = createElement('button', 'ci-video-hotspot-controls-play-btn', {
      'aria-label': 'Play',
      'type': 'button',
    });
    this.playBtn.innerHTML = PLAY_SVG;
    leftGroup.appendChild(this.playBtn);

    // Volume
    const volumeGroup = createElement('div', 'ci-video-hotspot-controls-volume');
    this.volumeBtn = createElement('button', 'ci-video-hotspot-controls-volume-btn', {
      'aria-label': 'Mute',
      'type': 'button',
    });
    this.volumeBtn.innerHTML = VOLUME_SVG;
    this.volumeSlider = document.createElement('input');
    this.volumeSlider.type = 'range';
    this.volumeSlider.className = 'ci-video-hotspot-controls-volume-slider';
    this.volumeSlider.min = '0';
    this.volumeSlider.max = '1';
    this.volumeSlider.step = '0.05';
    this.volumeSlider.value = String(options.getVolume());
    this.volumeSlider.setAttribute('aria-label', 'Volume');
    volumeGroup.appendChild(this.volumeBtn);
    volumeGroup.appendChild(this.volumeSlider);
    leftGroup.appendChild(volumeGroup);

    // Time display
    this.timeDisplay = createElement('span', 'ci-video-hotspot-controls-time');
    this.timeDisplay.textContent = '0:00 / 0:00';
    leftGroup.appendChild(this.timeDisplay);

    row.appendChild(leftGroup);

    // Right group
    const rightGroup = createElement('div', 'ci-video-hotspot-controls-right');

    // Chapter navigation
    if (options.showChapterNav && options.chapters && options.chapters.length > 0) {
      this.chapterBtn = createElement('button', 'ci-video-hotspot-controls-chapter-btn', {
        'aria-label': 'Chapters',
        'aria-expanded': 'false',
        'type': 'button',
      });
      this.chapterBtn.textContent = 'Chapters';
      rightGroup.appendChild(this.chapterBtn);

      this.chapterDropdown = createElement('div', 'ci-video-hotspot-chapters');
      this.chapterDropdown.setAttribute('role', 'listbox');
      for (const ch of options.chapters) {
        const item = createElement('button', 'ci-video-hotspot-chapter-item', {
          'role': 'option',
          'data-chapter-id': ch.id,
          'type': 'button',
        });
        const timeSpan = document.createElement('span');
        timeSpan.className = 'ci-video-hotspot-chapter-time';
        timeSpan.textContent = formatTime(ch.startTime);
        const titleSpan = document.createElement('span');
        titleSpan.className = 'ci-video-hotspot-chapter-title';
        titleSpan.textContent = ch.title;
        item.appendChild(timeSpan);
        item.appendChild(titleSpan);
        this.chapterDropdown.appendChild(item);
      }
      rightGroup.appendChild(this.chapterDropdown);
    }

    // Speed
    const speedWrapper = createElement('div', 'ci-video-hotspot-controls-speed');
    this.speedBtn = createElement('button', 'ci-video-hotspot-controls-speed-btn', {
      'aria-label': 'Playback speed',
      'aria-expanded': 'false',
      'type': 'button',
    });
    this.speedBtn.textContent = '1x';
    speedWrapper.appendChild(this.speedBtn);

    this.speedDropdown = createElement('div', 'ci-video-hotspot-speed-dropdown');
    this.speedDropdown.setAttribute('role', 'listbox');
    speedWrapper.appendChild(this.speedDropdown);
    rightGroup.appendChild(speedWrapper);

    // Loop/Repeat
    this.loopBtn = createElement('button', 'ci-video-hotspot-controls-loop-btn', {
      'aria-label': 'Toggle repeat',
      'type': 'button',
    });
    this.loopBtn.innerHTML = REPEAT_SVG;
    if (options.isLooping()) {
      addClass(this.loopBtn, 'ci-video-hotspot-controls-loop-btn--active');
    }
    rightGroup.appendChild(this.loopBtn);

    // Fullscreen
    if (options.showFullscreen) {
      this.fullscreenBtn = createElement('button', 'ci-video-hotspot-controls-fullscreen-btn', {
        'aria-label': 'Enter fullscreen',
        'type': 'button',
      });
      this.fullscreenBtn.innerHTML = FULLSCREEN_SVG;
      rightGroup.appendChild(this.fullscreenBtn);
    } else {
      this.fullscreenBtn = null;
    }

    row.appendChild(rightGroup);
    this.element.appendChild(row);

    this.bindEvents();
  }

  private bindEvents(): void {
    // Play/Pause
    this.cleanups.push(addListener(this.playBtn, 'click', (e) => {
      e.stopPropagation();
      if (this.options.isPaused()) {
        this.options.onPlay();
      } else {
        this.options.onPause();
      }
    }));

    // Volume button (mute toggle)
    this.cleanups.push(addListener(this.volumeBtn, 'click', (e) => {
      e.stopPropagation();
      this.options.onMuteToggle();
    }));

    // Volume slider
    this.cleanups.push(addListener(this.volumeSlider, 'input', () => {
      this.options.onVolumeChange(parseFloat(this.volumeSlider.value));
    }));

    // Speed dropdown toggle
    this.cleanups.push(addListener(this.speedBtn, 'click', (e) => {
      e.stopPropagation();
      const isOpen = this.speedDropdown!.classList.contains('ci-video-hotspot-speed-dropdown--open');
      this.closeAllDropdowns();
      if (!isOpen) {
        this.rebuildSpeedDropdown(this.options.getPlaybackRate());
        addClass(this.speedDropdown!, 'ci-video-hotspot-speed-dropdown--open');
        this.speedBtn.setAttribute('aria-expanded', 'true');
      }
    }));

    // Speed item clicks (delegated)
    this.cleanups.push(addListener(this.speedDropdown!, 'click', (e) => {
      const target = (e.target as HTMLElement).closest('[data-speed]') as HTMLElement;
      if (target) {
        e.stopPropagation();
        const speed = parseFloat(target.dataset.speed!);
        this.pendingSpeed = speed;
        this.speedBtn.textContent = `${speed}x`;
        this.options.onSpeedChange(speed);
        this.closeAllDropdowns();
      }
    }));

    // Loop toggle
    this.cleanups.push(addListener(this.loopBtn, 'click', (e) => {
      e.stopPropagation();
      this.options.onLoopToggle();
      if (this.options.isLooping()) {
        addClass(this.loopBtn, 'ci-video-hotspot-controls-loop-btn--active');
      } else {
        removeClass(this.loopBtn, 'ci-video-hotspot-controls-loop-btn--active');
      }
    }));

    // Fullscreen
    if (this.fullscreenBtn) {
      this.cleanups.push(addListener(this.fullscreenBtn, 'click', (e) => {
        e.stopPropagation();
        this.options.onFullscreenToggle();
      }));
    }

    // Click outside closes all dropdowns
    const onDocClick = () => this.closeAllDropdowns();
    document.addEventListener('click', onDocClick);
    this.cleanups.push(() => document.removeEventListener('click', onDocClick));

    // Chapter toggle
    if (this.chapterBtn && this.chapterDropdown) {
      this.cleanups.push(addListener(this.chapterBtn, 'click', (e) => {
        e.stopPropagation();
        const isOpen = this.chapterDropdown!.classList.contains('ci-video-hotspot-chapters--open');
        this.closeAllDropdowns();
        if (!isOpen) {
          addClass(this.chapterDropdown!, 'ci-video-hotspot-chapters--open');
          this.chapterBtn!.setAttribute('aria-expanded', 'true');
        }
      }));

      // Chapter item clicks
      this.cleanups.push(addListener(this.chapterDropdown, 'click', (e) => {
        const target = (e.target as HTMLElement).closest('[data-chapter-id]') as HTMLElement;
        if (target) {
          e.stopPropagation();
          const chapterId = target.dataset.chapterId;
          if (chapterId) {
            this.options.onChapterSelect?.(chapterId);
            removeClass(this.chapterDropdown!, 'ci-video-hotspot-chapters--open');
            this.chapterBtn!.setAttribute('aria-expanded', 'false');
          }
        }
      }));
    }
  }

  private closeAllDropdowns(): void {
    if (this.speedDropdown) {
      removeClass(this.speedDropdown, 'ci-video-hotspot-speed-dropdown--open');
      this.speedBtn.setAttribute('aria-expanded', 'false');
    }
    if (this.chapterDropdown && this.chapterBtn) {
      removeClass(this.chapterDropdown, 'ci-video-hotspot-chapters--open');
      this.chapterBtn.setAttribute('aria-expanded', 'false');
    }
  }

  private rebuildSpeedDropdown(currentSpeed: number): void {
    if (!this.speedDropdown) return;
    this.speedDropdown.innerHTML = '';

    const rate = Math.round(currentSpeed * 100) / 100;

    for (const speed of Controls.SPEEDS) {
      const item = createElement('button', 'ci-video-hotspot-speed-item', {
        'role': 'option',
        'data-speed': String(speed),
        'type': 'button',
      });
      item.textContent = `${speed}x`;
      if (Math.round(speed * 100) === Math.round(rate * 100)) {
        addClass(item, 'ci-video-hotspot-speed-item--active');
      }
      this.speedDropdown.appendChild(item);
    }
  }

  /** Update controls state */
  update(): void {
    const isPaused = this.options.isPaused();
    const currentTime = this.options.getCurrentTime();
    const duration = this.options.getDuration();
    const isMuted = this.options.isMuted();
    const rate = this.options.getPlaybackRate();
    const isFs = this.options.isFullscreen();

    // Play/Pause button
    this.playBtn.innerHTML = isPaused ? PLAY_SVG : PAUSE_SVG;
    this.playBtn.setAttribute('aria-label', isPaused ? 'Play' : 'Pause');

    // Time display
    this.timeDisplay.textContent = `${formatTime(currentTime)} / ${formatTime(duration)}`;

    // Volume
    this.volumeBtn.innerHTML = isMuted ? VOLUME_MUTE_SVG : VOLUME_SVG;
    this.volumeBtn.setAttribute('aria-label', isMuted ? 'Unmute' : 'Mute');
    if (!isMuted) {
      this.volumeSlider.value = String(this.options.getVolume());
    }

    // Speed — use pending value until adapter catches up
    const displayRate = this.pendingSpeed ?? rate;
    if (this.pendingSpeed !== null && Math.round(rate * 100) === Math.round(this.pendingSpeed * 100)) {
      this.pendingSpeed = null;
    }
    this.speedBtn.textContent = `${displayRate}x`;

    // Fullscreen
    if (this.fullscreenBtn) {
      this.fullscreenBtn.innerHTML = isFs ? FULLSCREEN_EXIT_SVG : FULLSCREEN_SVG;
      this.fullscreenBtn.setAttribute('aria-label', isFs ? 'Exit fullscreen' : 'Enter fullscreen');
    }

    // Progress bar
    this.progressBar.update(currentTime);
  }

  /** Update active chapter styling */
  setActiveChapter(chapterId: string | undefined): void {
    if (!this.chapterDropdown) return;
    const items = this.chapterDropdown.querySelectorAll('.ci-video-hotspot-chapter-item');
    items.forEach((item) => {
      const el = item as HTMLElement;
      if (el.dataset.chapterId === chapterId) {
        addClass(el, 'ci-video-hotspot-chapter-item--active');
        el.setAttribute('aria-selected', 'true');
      } else {
        removeClass(el, 'ci-video-hotspot-chapter-item--active');
        el.setAttribute('aria-selected', 'false');
      }
    });
  }

  /** Show controls (reset idle timer) */
  show(): void {
    removeClass(this.element, 'ci-video-hotspot-controls--hidden');
  }

  /** Hide controls */
  hide(): void {
    addClass(this.element, 'ci-video-hotspot-controls--hidden');
  }

  /** Start idle timer -- hide controls after inactivity */
  startIdleTimer(delay: number = 3000): void {
    this.clearIdleTimer();
    this.idleTimer = setTimeout(() => {
      this.hide();
    }, delay);
  }

  clearIdleTimer(): void {
    if (this.idleTimer !== undefined) {
      clearTimeout(this.idleTimer);
      this.idleTimer = undefined;
    }
  }

  destroy(): void {
    this.clearIdleTimer();
    this.cleanups.forEach((fn) => fn());
    this.cleanups = [];
    this.progressBar.destroy();
    this.element.remove();
  }
}
