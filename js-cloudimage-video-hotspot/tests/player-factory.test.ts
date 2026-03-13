import { describe, it, expect } from 'vitest';
import { isHLSUrl, isYouTubeUrl, isVimeoUrl, PlayerFactory } from '../src/player/player-factory';
import { extractYouTubeId } from '../src/player/adapters/youtube-adapter';
import { extractVimeoId } from '../src/player/adapters/vimeo-adapter';

describe('isHLSUrl', () => {
  it('detects .m3u8 URLs', () => {
    expect(isHLSUrl('https://cdn.example.com/stream.m3u8')).toBe(true);
    expect(isHLSUrl('https://cdn.example.com/stream.m3u8?token=abc')).toBe(true);
    expect(isHLSUrl('/path/to/video.m3u8')).toBe(true);
  });

  it('rejects non-HLS URLs', () => {
    expect(isHLSUrl('https://example.com/video.mp4')).toBe(false);
    expect(isHLSUrl('https://example.com/m3u8-page')).toBe(false);
  });
});

describe('isYouTubeUrl', () => {
  it('detects youtube.com URLs', () => {
    expect(isYouTubeUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(true);
    expect(isYouTubeUrl('https://youtube.com/embed/dQw4w9WgXcQ')).toBe(true);
    expect(isYouTubeUrl('https://youtube.com/shorts/dQw4w9WgXcQ')).toBe(true);
  });

  it('detects youtu.be URLs', () => {
    expect(isYouTubeUrl('https://youtu.be/dQw4w9WgXcQ')).toBe(true);
  });

  it('rejects non-YouTube URLs', () => {
    expect(isYouTubeUrl('https://example.com/video.mp4')).toBe(false);
    expect(isYouTubeUrl('https://vimeo.com/123456')).toBe(false);
  });
});

describe('isVimeoUrl', () => {
  it('detects vimeo.com URLs', () => {
    expect(isVimeoUrl('https://vimeo.com/123456789')).toBe(true);
    expect(isVimeoUrl('https://player.vimeo.com/video/123456789')).toBe(true);
  });

  it('rejects non-Vimeo URLs', () => {
    expect(isVimeoUrl('https://example.com/video.mp4')).toBe(false);
    expect(isVimeoUrl('https://youtube.com/watch?v=abc')).toBe(false);
  });
});

describe('extractYouTubeId', () => {
  it('extracts from youtube.com/watch', () => {
    expect(extractYouTubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });

  it('extracts from youtu.be', () => {
    expect(extractYouTubeId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });

  it('extracts from youtube.com/embed', () => {
    expect(extractYouTubeId('https://youtube.com/embed/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });

  it('extracts from youtube.com/shorts', () => {
    expect(extractYouTubeId('https://youtube.com/shorts/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });

  it('returns null for invalid URLs', () => {
    expect(extractYouTubeId('https://example.com/video.mp4')).toBe(null);
    expect(extractYouTubeId('not-a-url')).toBe(null);
  });
});

describe('extractVimeoId', () => {
  it('extracts from vimeo.com', () => {
    expect(extractVimeoId('https://vimeo.com/123456789')).toBe('123456789');
  });

  it('extracts from player.vimeo.com', () => {
    expect(extractVimeoId('https://player.vimeo.com/video/123456789')).toBe('123456789');
  });

  it('returns null for invalid URLs', () => {
    expect(extractVimeoId('https://example.com/video.mp4')).toBe(null);
    expect(extractVimeoId('not-a-url')).toBe(null);
  });
});

describe('PlayerFactory.detect', () => {
  it('detects HLS', () => {
    expect(PlayerFactory.detect('https://cdn.example.com/live.m3u8')).toBe('hls');
  });

  it('detects YouTube', () => {
    expect(PlayerFactory.detect('https://www.youtube.com/watch?v=abc123_XYZ0')).toBe('youtube');
  });

  it('detects Vimeo', () => {
    expect(PlayerFactory.detect('https://vimeo.com/123456789')).toBe('vimeo');
  });

  it('defaults to html5', () => {
    expect(PlayerFactory.detect('https://example.com/video.mp4')).toBe('html5');
    expect(PlayerFactory.detect('/local/video.webm')).toBe('html5');
  });
});
