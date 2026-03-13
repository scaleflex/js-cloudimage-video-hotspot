import { addListener } from '../utils/events';

export interface VideoKeyboardHandlerOptions {
  container: HTMLElement;
  onPlayPause?: () => void;
  onSeekForward?: () => void;
  onSeekBackward?: () => void;
  onVolumeUp?: () => void;
  onVolumeDown?: () => void;
  onMuteToggle?: () => void;
  onNextHotspot?: () => void;
  onPrevHotspot?: () => void;
  onEscape?: () => void;
  onFullscreenToggle?: () => void;
}

/** Handles keyboard navigation for the video hotspot container */
export class VideoKeyboardHandler {
  private cleanups: (() => void)[] = [];

  constructor(options: VideoKeyboardHandlerOptions) {
    const { container } = options;

    const cleanup = addListener(container, 'keydown', (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;

      // Don't handle keys typed into form elements or contentEditable
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      ) {
        return;
      }

      switch (e.key) {
        case ' ':
          // Space to play/pause (unless on a button)
          if (target.tagName !== 'BUTTON') {
            e.preventDefault();
            options.onPlayPause?.();
          }
          break;

        case 'k':
          e.preventDefault();
          options.onPlayPause?.();
          break;

        case 'ArrowRight':
          e.preventDefault();
          options.onSeekForward?.();
          break;

        case 'ArrowLeft':
          e.preventDefault();
          options.onSeekBackward?.();
          break;

        case 'ArrowUp':
          e.preventDefault();
          options.onVolumeUp?.();
          break;

        case 'ArrowDown':
          e.preventDefault();
          options.onVolumeDown?.();
          break;

        case 'm':
          e.preventDefault();
          options.onMuteToggle?.();
          break;

        case 'n':
          e.preventDefault();
          options.onNextHotspot?.();
          break;

        case 'p':
          // Only if not typing in an input
          e.preventDefault();
          options.onPrevHotspot?.();
          break;

        case 'Escape':
          options.onEscape?.();
          break;

        case 'f':
          e.preventDefault();
          options.onFullscreenToggle?.();
          break;
      }
    });

    this.cleanups.push(cleanup);
  }

  destroy(): void {
    this.cleanups.forEach((fn) => fn());
    this.cleanups = [];
  }
}
