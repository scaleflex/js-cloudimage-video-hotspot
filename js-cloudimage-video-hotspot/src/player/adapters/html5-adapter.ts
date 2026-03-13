import { VideoPlayerAdapter, AdapterOptions } from '../adapter';
import { createElement } from '../../utils/dom';
import { addListener } from '../../utils/events';

/**
 * HTML5 native <video> adapter.
 * Extracted from the original VideoPlayer — same logic, event-emitter based.
 */
export class HTML5Adapter extends VideoPlayerAdapter {
  protected videoEl: HTMLVideoElement;
  protected _ready = false;
  protected cleanups: (() => void)[] = [];

  constructor(protected options: AdapterOptions) {
    super();
    this.videoEl = createElement('video', 'ci-video-hotspot-video', {
      'playsinline': '',
      'preload': 'metadata',
    });

    if (options.poster) {
      this.videoEl.poster = options.poster;
    }
    if (options.autoplay) {
      this.videoEl.autoplay = true;
    }
    if (options.loop) {
      this.videoEl.loop = true;
    }
    if (options.muted || options.autoplay) {
      this.videoEl.muted = true;
    }

    // Add sources
    if (options.sources && options.sources.length > 0) {
      for (const source of options.sources) {
        const sourceEl = document.createElement('source');
        sourceEl.src = source.src;
        sourceEl.type = source.type;
        this.videoEl.appendChild(sourceEl);
      }
    } else {
      this.videoEl.src = options.src;
    }

    this.bindEvents();
  }

  protected bindEvents(): void {
    this.cleanups.push(addListener(this.videoEl, 'play', () => {
      this.emit('play');
    }));

    this.cleanups.push(addListener(this.videoEl, 'pause', () => {
      this.emit('pause');
    }));

    this.cleanups.push(addListener(this.videoEl, 'timeupdate', () => {
      this.emit('timeupdate', this.videoEl.currentTime);
    }));

    this.cleanups.push(addListener(this.videoEl, 'durationchange', () => {
      this.emit('durationchange', this.videoEl.duration);
    }));

    this.cleanups.push(addListener(this.videoEl, 'ended', () => {
      this.emit('ended');
    }));

    this.cleanups.push(addListener(this.videoEl, 'loadedmetadata', () => {
      this._ready = true;
      this.emit('loadedmetadata');
    }));

    this.cleanups.push(addListener(this.videoEl, 'waiting', () => {
      this.emit('waiting');
    }));

    this.cleanups.push(addListener(this.videoEl, 'playing', () => {
      this.emit('playing');
    }));

    this.cleanups.push(addListener(this.videoEl, 'progress', () => {
      this.emit('progress');
    }));

    this.cleanups.push(addListener(this.videoEl, 'volumechange', () => {
      this.emit('volumechange');
    }));

    this.cleanups.push(addListener(this.videoEl, 'ratechange', () => {
      this.emit('ratechange');
    }));
  }

  mount(container: HTMLElement): void {
    container.appendChild(this.videoEl);
  }

  get ready(): boolean {
    return this._ready;
  }

  play(): Promise<void> {
    return this.videoEl.play().catch((err) => {
      // AbortError is expected when play() is interrupted by pause() — don't emit
      if (err?.name !== 'AbortError') {
        this.emit('error', err);
      }
    });
  }

  pause(): void {
    this.videoEl.pause();
  }

  seek(time: number): void {
    const clamped = Math.max(0, Math.min(time, this.getDuration() || 0));
    this.videoEl.currentTime = clamped;
  }

  getCurrentTime(): number {
    return this.videoEl.currentTime;
  }

  getDuration(): number {
    return this.videoEl.duration || 0;
  }

  setVolume(level: number): void {
    this.videoEl.volume = Math.max(0, Math.min(1, level));
  }

  getVolume(): number {
    return this.videoEl.volume;
  }

  setMuted(muted: boolean): void {
    this.videoEl.muted = muted;
  }

  isMuted(): boolean {
    return this.videoEl.muted;
  }

  setPlaybackRate(rate: number): void {
    this.videoEl.playbackRate = rate;
  }

  getPlaybackRate(): number {
    return this.videoEl.playbackRate;
  }

  isPaused(): boolean {
    return this.videoEl.paused;
  }

  getBufferedEnd(): number {
    const buf = this.videoEl.buffered;
    if (buf.length === 0) return 0;
    return buf.end(buf.length - 1);
  }

  getElement(): HTMLElement {
    return this.videoEl;
  }

  getVideoElement(): HTMLVideoElement {
    return this.videoEl;
  }

  destroy(): void {
    this.cleanups.forEach((fn) => fn());
    this.cleanups = [];
    this.videoEl.pause();
    this.videoEl.removeAttribute('src');
    this.videoEl.load();
    this.videoEl.remove();
    this.removeAll();
  }
}
