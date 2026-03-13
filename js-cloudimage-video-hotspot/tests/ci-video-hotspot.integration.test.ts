import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CIVideoHotspot } from '../src/core/ci-video-hotspot';
import type { CIVideoHotspotConfig } from '../src/core/types';

// Mock ResizeObserver for jsdom
globalThis.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock HTMLMediaElement methods not available in jsdom
beforeEach(() => {
  HTMLMediaElement.prototype.play = vi.fn(() => Promise.resolve());
  HTMLMediaElement.prototype.pause = vi.fn();
  HTMLMediaElement.prototype.load = vi.fn();
  Object.defineProperty(HTMLMediaElement.prototype, 'paused', { get: () => true, configurable: true });
  Object.defineProperty(HTMLMediaElement.prototype, 'duration', { get: () => 60, configurable: true });
  Object.defineProperty(HTMLMediaElement.prototype, 'currentTime', { get: () => 0, set: () => {}, configurable: true });
  Object.defineProperty(HTMLMediaElement.prototype, 'volume', { get: () => 1, set: () => {}, configurable: true });
  Object.defineProperty(HTMLMediaElement.prototype, 'muted', { get: () => false, set: () => {}, configurable: true });
  Object.defineProperty(HTMLMediaElement.prototype, 'playbackRate', { get: () => 1, set: () => {}, configurable: true });
  Object.defineProperty(HTMLMediaElement.prototype, 'buffered', {
    get: () => ({ length: 0, start: () => 0, end: () => 0 }),
    configurable: true,
  });
});

function createConfig(overrides: Partial<CIVideoHotspotConfig> = {}): CIVideoHotspotConfig {
  return {
    src: 'test.mp4',
    hotspots: [
      { id: 'h1', x: '50%', y: '50%', startTime: 0, endTime: 10, label: 'Hotspot 1' },
      { id: 'h2', x: '70%', y: '30%', startTime: 15, endTime: 25, label: 'Hotspot 2' },
    ],
    controls: false, // simplify for testing
    hotspotNavigation: false,
    fullscreenButton: false,
    ...overrides,
  };
}

describe('CIVideoHotspot integration', () => {
  let rootEl: HTMLElement;

  beforeEach(() => {
    rootEl = document.createElement('div');
    document.body.appendChild(rootEl);
  });

  afterEach(() => {
    document.body.removeChild(rootEl);
  });

  it('creates and destroys without errors', () => {
    const instance = new CIVideoHotspot(rootEl, createConfig());
    expect(rootEl.querySelector('.ci-video-hotspot-container')).toBeTruthy();
    instance.destroy();
    expect(rootEl.innerHTML).toBe('');
  });

  it('exposes correct public API methods', () => {
    const instance = new CIVideoHotspot(rootEl, createConfig());
    expect(typeof instance.play).toBe('function');
    expect(typeof instance.pause).toBe('function');
    expect(typeof instance.seek).toBe('function');
    expect(typeof instance.togglePlay).toBe('function');
    expect(typeof instance.open).toBe('function');
    expect(typeof instance.close).toBe('function');
    expect(typeof instance.closeAll).toBe('function');
    expect(typeof instance.addHotspot).toBe('function');
    expect(typeof instance.removeHotspot).toBe('function');
    expect(typeof instance.updateHotspot).toBe('function');
    expect(typeof instance.getVisibleHotspots).toBe('function');
    expect(typeof instance.getHotspots).toBe('function');
    expect(typeof instance.nextHotspot).toBe('function');
    expect(typeof instance.prevHotspot).toBe('function');
    expect(typeof instance.goToHotspot).toBe('function');
    expect(typeof instance.goToChapter).toBe('function');
    expect(typeof instance.getCurrentChapter).toBe('function');
    expect(typeof instance.enterFullscreen).toBe('function');
    expect(typeof instance.exitFullscreen).toBe('function');
    expect(typeof instance.isFullscreen).toBe('function');
    expect(typeof instance.update).toBe('function');
    expect(typeof instance.destroy).toBe('function');
    expect(typeof instance.getElements).toBe('function');
    instance.destroy();
  });

  it('getElements returns correct DOM elements', () => {
    const instance = new CIVideoHotspot(rootEl, createConfig());
    const els = instance.getElements();
    expect(els.container).toBeInstanceOf(HTMLElement);
    expect(els.videoWrapper).toBeInstanceOf(HTMLElement);
    expect(els.video).toBeInstanceOf(HTMLElement);
    expect(els.overlay).toBeInstanceOf(HTMLElement);
    expect(els.controls).toBeNull(); // controls: false
    instance.destroy();
  });

  it('getHotspots returns hotspot definitions', () => {
    const instance = new CIVideoHotspot(rootEl, createConfig());
    const hotspots = instance.getHotspots();
    expect(hotspots).toHaveLength(2);
    expect(hotspots[0].id).toBe('h1');
    expect(hotspots[1].id).toBe('h2');
    instance.destroy();
  });

  it('addHotspot increases hotspot count', () => {
    const instance = new CIVideoHotspot(rootEl, createConfig());
    instance.addHotspot({
      id: 'h3', x: '20%', y: '80%', startTime: 30, endTime: 40, label: 'New',
    });
    expect(instance.getHotspots()).toHaveLength(3);
    instance.destroy();
  });

  it('removeHotspot decreases hotspot count', () => {
    const instance = new CIVideoHotspot(rootEl, createConfig());
    instance.removeHotspot('h1');
    expect(instance.getHotspots()).toHaveLength(1);
    instance.destroy();
  });

  it('builds DOM with dark theme', () => {
    const instance = new CIVideoHotspot(rootEl, createConfig({ theme: 'dark' }));
    expect(rootEl.querySelector('.ci-video-hotspot-theme-dark')).toBeTruthy();
    instance.destroy();
  });

  it('builds controls when enabled', () => {
    const instance = new CIVideoHotspot(rootEl, createConfig({ controls: true }));
    expect(rootEl.querySelector('.ci-video-hotspot-controls')).toBeTruthy();
    instance.destroy();
  });

  it('update preserves functionality', () => {
    const instance = new CIVideoHotspot(rootEl, createConfig());
    expect(() => instance.update({ theme: 'dark' })).not.toThrow();
    expect(rootEl.querySelector('.ci-video-hotspot-theme-dark')).toBeTruthy();
    instance.destroy();
  });

  it('destroy is idempotent', () => {
    const instance = new CIVideoHotspot(rootEl, createConfig());
    instance.destroy();
    instance.destroy(); // should not throw
  });

  it('getCurrentChapter returns undefined without chapters', () => {
    const instance = new CIVideoHotspot(rootEl, createConfig());
    expect(instance.getCurrentChapter()).toBeUndefined();
    instance.destroy();
  });

  it('isFullscreen returns false when fullscreen disabled', () => {
    const instance = new CIVideoHotspot(rootEl, createConfig());
    expect(instance.isFullscreen()).toBe(false);
    instance.destroy();
  });

  it('seek clamps to valid range', () => {
    const instance = new CIVideoHotspot(rootEl, createConfig());
    // Should not throw with negative or large values
    expect(() => instance.seek(-10)).not.toThrow();
    expect(() => instance.seek(99999)).not.toThrow();
    instance.destroy();
  });

  it('static autoInit finds data-attribute elements', () => {
    const el = document.createElement('div');
    el.setAttribute('data-ci-video-hotspot-src', 'test.mp4');
    el.setAttribute('data-ci-video-hotspot-items', JSON.stringify([
      { id: 'h1', x: '50%', y: '50%', startTime: 0, endTime: 10, label: 'Auto' },
    ]));
    document.body.appendChild(el);

    const instances = CIVideoHotspot.autoInit(document.body);
    expect(instances).toHaveLength(1);
    instances[0].destroy();
    document.body.removeChild(el);
  });
});
