import { VideoPlayerAdapter, AdapterOptions } from '../adapter';
import { createElement } from '../../utils/dom';

/**
 * YouTube IFrame API adapter.
 * Loads the YT IFrame API script dynamically — zero bundled dependencies.
 */
export class YouTubeAdapter extends VideoPlayerAdapter {
  private container!: HTMLDivElement;
  private playerDiv!: HTMLDivElement;
  private ytPlayer: any = null;
  private _ready = false;
  private _duration = 0;
  private timeUpdateInterval: number | null = null;
  private videoId: string;

  constructor(private options: AdapterOptions) {
    super();
    this.videoId = extractYouTubeId(options.src) || '';
  }

  mount(container: HTMLElement): void {
    this.container = createElement('div', 'ci-video-hotspot-video');
    // Make the wrapper behave like the video element in CSS layout
    this.container.style.width = '100%';
    this.container.style.height = '100%';

    this.playerDiv = createElement('div');
    this.playerDiv.id = `yt-player-${Date.now()}`;
    this.container.appendChild(this.playerDiv);
    container.appendChild(this.container);

    this.loadYouTubeAPI();
  }

  private async loadYouTubeAPI(): Promise<void> {
    if (!(window as any).YT?.Player) {
      await new Promise<void>((resolve) => {
        const prev = (window as any).onYouTubeIframeAPIReady;
        const existing = document.querySelector('script[src*="youtube.com/iframe_api"]');

        (window as any).onYouTubeIframeAPIReady = () => {
          if (typeof prev === 'function') prev();
          resolve();
        };

        if (!existing) {
          const script = document.createElement('script');
          script.src = 'https://www.youtube.com/iframe_api';
          document.head.appendChild(script);
        }
      });
    }
    this.createPlayer();
  }

  private createPlayer(): void {
    const YT = (window as any).YT;

    this.ytPlayer = new YT.Player(this.playerDiv.id, {
      videoId: this.videoId,
      width: '100%',
      height: '100%',
      playerVars: {
        controls: 0,
        modestbranding: 1,
        rel: 0,
        playsinline: 1,
        enablejsapi: 1,
        autoplay: this.options.autoplay ? 1 : 0,
        mute: this.options.muted ? 1 : 0,
        loop: this.options.loop ? 1 : 0,
      },
      events: {
        onReady: () => {
          this._ready = true;
          this._duration = this.ytPlayer.getDuration();
          this.emit('loadedmetadata');
          this.emit('durationchange', this._duration);
        },
        onStateChange: (e: any) => {
          const PS = YT.PlayerState;
          switch (e.data) {
            case PS.PLAYING:
              this.emit('play');
              this.emit('playing');
              this.startTimeUpdate();
              break;
            case PS.PAUSED:
              this.emit('pause');
              this.stopTimeUpdate();
              break;
            case PS.ENDED:
              this.emit('ended');
              this.stopTimeUpdate();
              break;
            case PS.BUFFERING:
              this.emit('waiting');
              break;
          }
        },
      },
    });
  }

  private startTimeUpdate(): void {
    this.stopTimeUpdate();
    this.timeUpdateInterval = window.setInterval(() => {
      const t = this.ytPlayer?.getCurrentTime?.() ?? 0;
      this.emit('timeupdate', t);
    }, 250);
  }

  private stopTimeUpdate(): void {
    if (this.timeUpdateInterval !== null) {
      clearInterval(this.timeUpdateInterval);
      this.timeUpdateInterval = null;
    }
  }

  // --- Adapter interface ---

  get ready(): boolean { return this._ready; }

  play(): Promise<void> { this.ytPlayer?.playVideo(); return Promise.resolve(); }
  pause(): void { this.ytPlayer?.pauseVideo(); }

  seek(time: number): void {
    const clamped = Math.max(0, Math.min(time, this.getDuration()));
    this.ytPlayer?.seekTo(clamped, true);
  }

  getCurrentTime(): number {
    return this.ytPlayer?.getCurrentTime?.() ?? 0;
  }

  getDuration(): number {
    return this.ytPlayer?.getDuration?.() ?? 0;
  }

  setVolume(level: number): void {
    this.ytPlayer?.setVolume(Math.max(0, Math.min(1, level)) * 100);
    this.emit('volumechange');
  }

  getVolume(): number {
    return (this.ytPlayer?.getVolume?.() ?? 100) / 100;
  }

  setMuted(muted: boolean): void {
    muted ? this.ytPlayer?.mute() : this.ytPlayer?.unMute();
    this.emit('volumechange');
  }

  isMuted(): boolean {
    return this.ytPlayer?.isMuted?.() ?? false;
  }

  setPlaybackRate(rate: number): void {
    this.ytPlayer?.setPlaybackRate(rate);
    this.emit('ratechange');
  }

  getPlaybackRate(): number {
    return this.ytPlayer?.getPlaybackRate?.() ?? 1;
  }

  isPaused(): boolean {
    const state = this.ytPlayer?.getPlayerState?.();
    return state !== (window as any).YT?.PlayerState?.PLAYING;
  }

  getBufferedEnd(): number {
    const frac = this.ytPlayer?.getVideoLoadedFraction?.() ?? 0;
    return frac * this.getDuration();
  }

  getElement(): HTMLElement {
    return this.container;
  }

  destroy(): void {
    this.stopTimeUpdate();
    this.ytPlayer?.destroy();
    this.container?.remove();
    this.removeAll();
  }
}

/** Extract YouTube video ID from various URL formats */
export function extractYouTubeId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  return match ? match[1] : null;
}
