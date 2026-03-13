import { describe, it, expect } from 'vitest';
import { mergeConfig, validateConfig } from '../src/core/config';
import type { CIVideoHotspotConfig } from '../src/core/types';

const minConfig: CIVideoHotspotConfig = {
  src: 'test.mp4',
  hotspots: [
    { id: 'h1', x: '50%', y: '50%', startTime: 0, endTime: 10, label: 'Test' },
  ],
};

describe('mergeConfig', () => {
  it('applies default values', () => {
    const config = mergeConfig(minConfig);
    expect(config.trigger).toBe('click');
    expect(config.placement).toBe('top');
    expect(config.pauseOnInteract).toBe(true);
    expect(config.theme).toBe('light');
    expect(config.controls).toBe(true);
    expect(config.pulse).toBe(true);
    expect(config.hotspotAnimation).toBe('fade');
    expect(config.timelineIndicators).toBe('dot');
  });

  it('respects user overrides', () => {
    const config = mergeConfig({ ...minConfig, trigger: 'hover', theme: 'dark' });
    expect(config.trigger).toBe('hover');
    expect(config.theme).toBe('dark');
  });

  it('auto-mutes when autoplay is true', () => {
    const config = mergeConfig({ ...minConfig, autoplay: true });
    expect(config.muted).toBe(true);
  });

  it('does not override explicit muted=false with autoplay', () => {
    const config = mergeConfig({ ...minConfig, autoplay: true, muted: false });
    expect(config.muted).toBe(false);
  });
});

describe('validateConfig', () => {
  it('throws if src is missing', () => {
    expect(() => validateConfig({ hotspots: [] } as any)).toThrow('"src" is required');
  });

  it('throws if hotspots is missing', () => {
    expect(() => validateConfig({ src: 'test.mp4' } as any)).toThrow('"hotspots" array is required');
  });

  it('throws if hotspot has no id', () => {
    expect(() => validateConfig({
      src: 'test.mp4',
      hotspots: [{ x: '50%', y: '50%', startTime: 0, endTime: 10, label: 'Test' } as any],
    })).toThrow('must have an "id"');
  });

  it('throws if hotspot has no startTime/endTime', () => {
    expect(() => validateConfig({
      src: 'test.mp4',
      hotspots: [{ id: 'h1', x: '50%', y: '50%', label: 'Test' } as any],
    })).toThrow('must have "startTime" and "endTime"');
  });

  it('throws if hotspot has no label', () => {
    expect(() => validateConfig({
      src: 'test.mp4',
      hotspots: [{ id: 'h1', x: '50%', y: '50%', startTime: 0, endTime: 10 } as any],
    })).toThrow('must have a "label"');
  });

  it('passes valid config', () => {
    expect(() => validateConfig(minConfig)).not.toThrow();
  });
});
