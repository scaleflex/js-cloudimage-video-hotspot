import { VideoPlayerAdapter } from './adapter';
import { PlayerFactory } from './player-factory';
import type { PlayerType, HLSConfig } from '../core/types';

export interface VideoPlayerOptions {
  src: string;
  sources?: { src: string; type: string }[];
  poster?: string;
  autoplay?: boolean;
  loop?: boolean;
  muted?: boolean;

  playerType?: PlayerType;
  hls?: HLSConfig;

  // Callbacks — preserved for backward compatibility with ci-video-hotspot.ts
  onPlay?: () => void;
  onPause?: () => void;
  onTimeUpdate?: (currentTime: number) => void;
  onDurationChange?: (duration: number) => void;
  onEnded?: () => void;
  onLoadedMetadata?: () => void;
  onWaiting?: () => void;
  onPlaying?: () => void;
  onProgress?: () => void;
}

/**
 * Facade that delegates to the active adapter.
 * The public API is identical to the old VideoPlayer —
 * ci-video-hotspot.ts continues to use this.player.* unchanged.
 */
export class VideoPlayer {
  private adapter: VideoPlayerAdapter;

  constructor(options: VideoPlayerOptions) {
    this.adapter = PlayerFactory.create(
      {
        src: options.src,
        sources: options.sources,
        poster: options.poster,
        autoplay: options.autoplay,
        loop: options.loop,
        muted: options.muted,
      },
      options.playerType,
      options.hls,
    );

    // Bridge adapter events → legacy callbacks
    if (options.onPlay) this.adapter.on('play', options.onPlay);
    if (options.onPause) this.adapter.on('pause', options.onPause);
    if (options.onTimeUpdate) this.adapter.on('timeupdate', options.onTimeUpdate);
    if (options.onDurationChange) this.adapter.on('durationchange', options.onDurationChange);
    if (options.onEnded) this.adapter.on('ended', options.onEnded);
    if (options.onLoadedMetadata) this.adapter.on('loadedmetadata', options.onLoadedMetadata);
    if (options.onWaiting) this.adapter.on('waiting', options.onWaiting);
    if (options.onPlaying) this.adapter.on('playing', options.onPlaying);
    if (options.onProgress) this.adapter.on('progress', options.onProgress);
  }

  /** The root DOM element (video tag or wrapper div) */
  get element(): HTMLElement {
    return this.adapter.getElement();
  }

  get ready(): boolean {
    return this.adapter.ready;
  }

  mount(container: HTMLElement): void {
    this.adapter.mount(container);
  }

  play(): Promise<void> {
    return this.adapter.play();
  }

  pause(): void {
    this.adapter.pause();
  }

  togglePlay(): void {
    if (this.isPaused()) {
      this.play();
    } else {
      this.pause();
    }
  }

  seek(time: number): void {
    this.adapter.seek(time);
  }

  getCurrentTime(): number {
    return this.adapter.getCurrentTime();
  }

  getDuration(): number {
    return this.adapter.getDuration();
  }

  setVolume(level: number): void {
    this.adapter.setVolume(level);
  }

  getVolume(): number {
    return this.adapter.getVolume();
  }

  setMuted(muted: boolean): void {
    this.adapter.setMuted(muted);
  }

  isMuted(): boolean {
    return this.adapter.isMuted();
  }

  setPlaybackRate(rate: number): void {
    this.adapter.setPlaybackRate(rate);
  }

  getPlaybackRate(): number {
    return this.adapter.getPlaybackRate();
  }

  isPaused(): boolean {
    return this.adapter.isPaused();
  }

  getBufferedEnd(): number {
    return this.adapter.getBufferedEnd();
  }

  getVideoElement(): HTMLVideoElement | null {
    return this.adapter.getVideoElement();
  }

  destroy(): void {
    this.adapter.destroy();
  }
}
