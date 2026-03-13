import { VideoPlayerAdapter, AdapterOptions } from '../adapter';
import { createElement } from '../../utils/dom';

/**
 * Vimeo Player SDK adapter.
 * Dynamic-imports @vimeo/player — it must be installed as a peer dependency.
 */
export class VimeoAdapter extends VideoPlayerAdapter {
  private container!: HTMLDivElement;
  private playerDiv!: HTMLDivElement;
  private vimeoPlayer: any = null;
  private _ready = false;
  private _duration = 0;
  private _currentTime = 0;
  private _paused = true;
  private _volume = 1;
  private _muted = false;
  private _playbackRate = 1;
  private videoId: string;

  constructor(private options: AdapterOptions) {
    super();
    this.videoId = extractVimeoId(options.src) || '';
    this._muted = options.muted ?? false;
  }

  mount(container: HTMLElement): void {
    this.container = createElement('div', 'ci-video-hotspot-video');
    this.container.style.width = '100%';
    this.container.style.height = '100%';

    this.playerDiv = createElement('div');
    this.container.appendChild(this.playerDiv);
    container.appendChild(this.container);

    this.loadVimeoSDK();
  }

  private async loadVimeoSDK(): Promise<void> {
    try {
      const { default: Player } = await import('@vimeo/player');
      this.createPlayer(Player);
    } catch {
      // Fallback: try loading from CDN
      try {
        await this.loadVimeoScript();
        const Player = (window as any).Vimeo?.Player;
        if (Player) {
          this.createPlayer(Player);
        } else {
          console.warn('CIVideoHotspot: Vimeo Player SDK not available');
        }
      } catch {
        console.warn(
          'CIVideoHotspot: @vimeo/player not found. Install: npm i @vimeo/player'
        );
      }
    }
  }

  private loadVimeoScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (document.querySelector('script[src*="player.vimeo.com/api"]')) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://player.vimeo.com/api/player.js';
      script.onload = () => resolve();
      script.onerror = () => reject();
      document.head.appendChild(script);
    });
  }

  private createPlayer(Player: any): void {
    this.vimeoPlayer = new Player(this.playerDiv, {
      id: Number(this.videoId),
      width: this.container.clientWidth || 640,
      controls: false,
      autoplay: this.options.autoplay ?? false,
      muted: this.options.muted ?? false,
      loop: this.options.loop ?? false,
    });

    this.vimeoPlayer.ready().then(() => {
      this._ready = true;
      this.vimeoPlayer.getDuration().then((d: number) => {
        this._duration = d;
        this.emit('loadedmetadata');
        this.emit('durationchange', d);
      });
    });

    this.vimeoPlayer.on('play', () => {
      this._paused = false;
      this.emit('play');
      this.emit('playing');
    });

    this.vimeoPlayer.on('pause', () => {
      this._paused = true;
      this.emit('pause');
    });

    this.vimeoPlayer.on('timeupdate', (data: { seconds: number }) => {
      this._currentTime = data.seconds;
      this.emit('timeupdate', data.seconds);
    });

    this.vimeoPlayer.on('ended', () => {
      this._paused = true;
      this.emit('ended');
    });

    this.vimeoPlayer.on('bufferstart', () => {
      this.emit('waiting');
    });

    this.vimeoPlayer.on('progress', () => {
      this.emit('progress');
    });

    this.vimeoPlayer.on('error', (err: any) => {
      this.emit('error', err);
    });

    // Sync volume changes made via Vimeo's own UI
    this.vimeoPlayer.on('volumechange', (data: { volume: number }) => {
      this._volume = data.volume;
      this.emit('volumechange');
    });

    // Track playback rate changes
    this.vimeoPlayer.on('playbackratechange', (data: { playbackRate: number }) => {
      this._playbackRate = data.playbackRate;
      this.emit('ratechange');
    });
  }

  // --- Adapter interface ---

  get ready(): boolean { return this._ready; }

  play(): Promise<void> { return this.vimeoPlayer?.play().catch(() => {}) ?? Promise.resolve(); }
  pause(): void { this.vimeoPlayer?.pause().catch(() => {}); }

  seek(time: number): void {
    const clamped = Math.max(0, Math.min(time, this._duration));
    this.vimeoPlayer?.setCurrentTime(clamped).catch(() => {});
  }

  getCurrentTime(): number { return this._currentTime; }
  getDuration(): number { return this._duration; }

  setVolume(level: number): void {
    const v = Math.max(0, Math.min(1, level));
    this._volume = v;
    this.vimeoPlayer?.setVolume(v).catch(() => {});
    this.emit('volumechange');
  }

  getVolume(): number { return this._volume; }

  setMuted(muted: boolean): void {
    this._muted = muted;
    this.vimeoPlayer?.setVolume(muted ? 0 : this._volume).catch(() => {});
    this.emit('volumechange');
  }

  isMuted(): boolean { return this._muted; }

  setPlaybackRate(rate: number): void {
    this._playbackRate = rate;
    this.vimeoPlayer?.setPlaybackRate(rate).catch(() => {});
    this.emit('ratechange');
  }

  getPlaybackRate(): number {
    return this._playbackRate;
  }

  isPaused(): boolean { return this._paused; }

  getBufferedEnd(): number {
    // Vimeo SDK doesn't expose buffered range synchronously
    return 0;
  }

  getElement(): HTMLElement { return this.container; }

  destroy(): void {
    this.vimeoPlayer?.destroy().catch(() => {});
    this.container?.remove();
    this.removeAll();
  }
}

/** Extract Vimeo video ID from URL */
export function extractVimeoId(url: string): string | null {
  const match = url.match(
    /(?:vimeo\.com\/|player\.vimeo\.com\/video\/)(\d+)/
  );
  return match ? match[1] : null;
}
