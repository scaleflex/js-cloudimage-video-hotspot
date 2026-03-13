import { EventEmitter } from '../utils/events';

/** Standard adapter events */
export type AdapterEvent =
  | 'play' | 'pause' | 'timeupdate' | 'durationchange'
  | 'ended' | 'loadedmetadata' | 'waiting' | 'playing'
  | 'progress' | 'error' | 'volumechange' | 'ratechange';

/** Options passed to every adapter constructor */
export interface AdapterOptions {
  src: string;
  sources?: { src: string; type: string }[];
  poster?: string;
  autoplay?: boolean;
  loop?: boolean;
  muted?: boolean;
}

/**
 * Abstract base class for all player adapters.
 * Extends EventEmitter so subclasses get on/off/emit out of the box.
 */
export abstract class VideoPlayerAdapter extends EventEmitter {
  /** Insert the player element into the given container */
  abstract mount(container: HTMLElement): void;

  abstract play(): Promise<void>;
  abstract pause(): void;
  abstract seek(time: number): void;
  abstract getCurrentTime(): number;
  abstract getDuration(): number;
  abstract setVolume(level: number): void;
  abstract getVolume(): number;
  abstract setMuted(muted: boolean): void;
  abstract isMuted(): boolean;
  abstract setPlaybackRate(rate: number): void;
  abstract getPlaybackRate(): number;
  abstract isPaused(): boolean;
  abstract getBufferedEnd(): number;

  /** Return the root element (video or wrapper div) */
  abstract getElement(): HTMLElement;

  /** Return the underlying HTMLVideoElement, if available.
   *  Returns null for iframe-based adapters (YouTube, Vimeo). */
  getVideoElement(): HTMLVideoElement | null { return null; }

  abstract destroy(): void;

  get ready(): boolean { return false; }
}
