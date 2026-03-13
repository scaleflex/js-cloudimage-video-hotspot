import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { VideoKeyboardHandler } from '../src/a11y/keyboard';

function createKeyEvent(key: string, target?: Partial<HTMLElement>): KeyboardEvent {
  const event = new KeyboardEvent('keydown', { key, bubbles: true });
  if (target) {
    Object.defineProperty(event, 'target', { value: target });
  }
  return event;
}

describe('VideoKeyboardHandler', () => {
  let container: HTMLElement;
  let handler: VideoKeyboardHandler;
  let callbacks: Record<string, ReturnType<typeof vi.fn>>;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    callbacks = {
      onPlayPause: vi.fn(),
      onSeekForward: vi.fn(),
      onSeekBackward: vi.fn(),
      onVolumeUp: vi.fn(),
      onVolumeDown: vi.fn(),
      onMuteToggle: vi.fn(),
      onNextHotspot: vi.fn(),
      onPrevHotspot: vi.fn(),
      onEscape: vi.fn(),
      onFullscreenToggle: vi.fn(),
    };
    handler = new VideoKeyboardHandler({ container, ...callbacks });
  });

  afterEach(() => {
    handler.destroy();
    document.body.removeChild(container);
  });

  it('handles k key for play/pause', () => {
    container.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', bubbles: true }));
    expect(callbacks.onPlayPause).toHaveBeenCalled();
  });

  it('handles n key for next hotspot', () => {
    container.dispatchEvent(new KeyboardEvent('keydown', { key: 'n', bubbles: true }));
    expect(callbacks.onNextHotspot).toHaveBeenCalled();
  });

  it('handles p key for prev hotspot', () => {
    container.dispatchEvent(new KeyboardEvent('keydown', { key: 'p', bubbles: true }));
    expect(callbacks.onPrevHotspot).toHaveBeenCalled();
  });

  it('handles m key for mute toggle', () => {
    container.dispatchEvent(new KeyboardEvent('keydown', { key: 'm', bubbles: true }));
    expect(callbacks.onMuteToggle).toHaveBeenCalled();
  });

  it('handles f key for fullscreen toggle', () => {
    container.dispatchEvent(new KeyboardEvent('keydown', { key: 'f', bubbles: true }));
    expect(callbacks.onFullscreenToggle).toHaveBeenCalled();
  });

  it('ignores keys in INPUT elements', () => {
    const input = document.createElement('input');
    container.appendChild(input);
    const event = new KeyboardEvent('keydown', { key: 'k', bubbles: true });
    input.dispatchEvent(event);
    expect(callbacks.onPlayPause).not.toHaveBeenCalled();
  });

  it('ignores keys in TEXTAREA elements', () => {
    const textarea = document.createElement('textarea');
    container.appendChild(textarea);
    const event = new KeyboardEvent('keydown', { key: 'k', bubbles: true });
    textarea.dispatchEvent(event);
    expect(callbacks.onPlayPause).not.toHaveBeenCalled();
  });

  it('ignores keys in contentEditable elements', () => {
    const div = document.createElement('div');
    div.setAttribute('contenteditable', 'true');
    container.appendChild(div);

    // In jsdom, isContentEditable may not be properly set via attribute.
    // Verify our handler checks the property correctly.
    if (div.isContentEditable) {
      const event = new KeyboardEvent('keydown', { key: 'k', bubbles: true });
      div.dispatchEvent(event);
      expect(callbacks.onPlayPause).not.toHaveBeenCalled();
    } else {
      // jsdom doesn't support isContentEditable — verify the guard is in the code
      // by manually simulating a target with isContentEditable = true
      const fakeDiv = document.createElement('div');
      Object.defineProperty(fakeDiv, 'isContentEditable', { value: true });
      container.appendChild(fakeDiv);
      const event = new KeyboardEvent('keydown', { key: 'k', bubbles: true });
      fakeDiv.dispatchEvent(event);
      expect(callbacks.onPlayPause).not.toHaveBeenCalled();
    }
  });

  it('ignores keys in SELECT elements', () => {
    const select = document.createElement('select');
    container.appendChild(select);
    const event = new KeyboardEvent('keydown', { key: 'k', bubbles: true });
    select.dispatchEvent(event);
    expect(callbacks.onPlayPause).not.toHaveBeenCalled();
  });

  it('handles arrow keys', () => {
    container.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(callbacks.onSeekForward).toHaveBeenCalled();

    container.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    expect(callbacks.onSeekBackward).toHaveBeenCalled();

    container.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
    expect(callbacks.onVolumeUp).toHaveBeenCalled();

    container.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    expect(callbacks.onVolumeDown).toHaveBeenCalled();
  });

  it('handles Escape key', () => {
    container.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(callbacks.onEscape).toHaveBeenCalled();
  });

  it('destroy removes listeners', () => {
    handler.destroy();
    container.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', bubbles: true }));
    expect(callbacks.onPlayPause).not.toHaveBeenCalled();
  });
});
