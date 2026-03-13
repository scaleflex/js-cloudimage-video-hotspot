/** Minimal Vimeo Player SDK type definitions */
declare module '@vimeo/player' {
  interface VimeoPlayerOptions {
    id?: number;
    url?: string;
    width?: number;
    height?: number;
    controls?: boolean;
    autoplay?: boolean;
    muted?: boolean;
    loop?: boolean;
  }

  interface TimeUpdateData {
    seconds: number;
    percent: number;
    duration: number;
  }

  interface VolumeChangeData {
    volume: number;
  }

  interface PlaybackRateChangeData {
    playbackRate: number;
  }

  export default class Player {
    constructor(element: HTMLElement | string, options?: VimeoPlayerOptions);
    ready(): Promise<void>;
    play(): Promise<void>;
    pause(): Promise<void>;
    getDuration(): Promise<number>;
    getCurrentTime(): Promise<number>;
    setCurrentTime(seconds: number): Promise<number>;
    setVolume(volume: number): Promise<number>;
    getVolume(): Promise<number>;
    setPlaybackRate(rate: number): Promise<number>;
    getPlaybackRate(): Promise<number>;
    on(event: 'play', callback: () => void): void;
    on(event: 'pause', callback: () => void): void;
    on(event: 'ended', callback: () => void): void;
    on(event: 'timeupdate', callback: (data: TimeUpdateData) => void): void;
    on(event: 'volumechange', callback: (data: VolumeChangeData) => void): void;
    on(event: 'playbackratechange', callback: (data: PlaybackRateChangeData) => void): void;
    on(event: 'bufferstart', callback: () => void): void;
    on(event: 'progress', callback: () => void): void;
    on(event: 'error', callback: (error: Error) => void): void;
    on(event: string, callback: (...args: unknown[]) => void): void;
    off(event: string, callback?: (...args: unknown[]) => void): void;
    destroy(): Promise<void>;
  }
}

interface Window {
  Vimeo?: {
    Player: typeof import('@vimeo/player').default;
  };
}
