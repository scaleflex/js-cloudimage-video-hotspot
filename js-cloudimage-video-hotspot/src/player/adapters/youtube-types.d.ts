/** Minimal YouTube IFrame API type definitions */
declare namespace YT {
  const enum PlayerState {
    UNSTARTED = -1,
    ENDED = 0,
    PLAYING = 1,
    PAUSED = 2,
    BUFFERING = 3,
    CUED = 5,
  }

  interface PlayerOptions {
    videoId: string;
    width?: string | number;
    height?: string | number;
    playerVars?: {
      controls?: 0 | 1;
      modestbranding?: 0 | 1;
      rel?: 0 | 1;
      playsinline?: 0 | 1;
      enablejsapi?: 0 | 1;
      autoplay?: 0 | 1;
      mute?: 0 | 1;
      loop?: 0 | 1;
    };
    events?: {
      onReady?: () => void;
      onStateChange?: (e: { data: PlayerState }) => void;
      onError?: (e: { data: number }) => void;
    };
  }

  class Player {
    constructor(elementId: string, options: PlayerOptions);
    playVideo(): void;
    pauseVideo(): void;
    seekTo(seconds: number, allowSeekAhead: boolean): void;
    getCurrentTime(): number;
    getDuration(): number;
    getPlayerState(): PlayerState;
    setVolume(volume: number): void;
    getVolume(): number;
    mute(): void;
    unMute(): void;
    isMuted(): boolean;
    setPlaybackRate(rate: number): void;
    getPlaybackRate(): number;
    getVideoLoadedFraction(): number;
    destroy(): void;
  }
}

interface Window {
  YT?: typeof YT & { Player: typeof YT.Player };
  onYouTubeIframeAPIReady?: () => void;
}
