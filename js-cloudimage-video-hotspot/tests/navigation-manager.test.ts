import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NavigationManager } from '../src/core/navigation-manager';
import { HotspotManager } from '../src/core/hotspot-manager';
import { TimelineEngine } from '../src/core/timeline';
import type { ManagerContext } from '../src/core/manager-types';
import type { NormalizedVideoHotspot, ResolvedConfig, VideoChapter } from '../src/core/types';

function makeHotspot(overrides: Partial<NormalizedVideoHotspot> = {}): NormalizedVideoHotspot {
  return {
    id: 'h1', x: 50, y: 50, startTime: 5, endTime: 15, label: 'Test',
    ...overrides,
  };
}

function makeContext(): ManagerContext {
  return {
    config: {
      src: 'test.mp4',
      hotspots: [
        { id: 'h1', x: '50%', y: '50%', startTime: 5, endTime: 15, label: 'First' },
        { id: 'h2', x: '70%', y: '30%', startTime: 20, endTime: 30, label: 'Second' },
      ],
    } as ResolvedConfig,
    player: {
      isPaused: vi.fn(() => false),
      pause: vi.fn(),
      play: vi.fn(),
      getCurrentTime: vi.fn(() => 0),
      getDuration: vi.fn(() => 60),
      seek: vi.fn(),
    } as unknown as ManagerContext['player'],
    timeline: new TimelineEngine([
      makeHotspot({ id: 'h1', startTime: 5, endTime: 15 }),
      makeHotspot({ id: 'h2', startTime: 20, endTime: 30 }),
    ]),
    containerEl: document.createElement('div'),
    overlayEl: document.createElement('div'),
    markersEl: document.createElement('div'),
    emitAnalytics: vi.fn(),
    isDestroyed: () => false,
    getControls: () => null,
    getHotspotNav: () => null,
  };
}

describe('NavigationManager', () => {
  let ctx: ManagerContext;
  let hotspotManager: HotspotManager;
  let navManager: NavigationManager;

  beforeEach(() => {
    ctx = makeContext();
    hotspotManager = new HotspotManager(ctx);
    hotspotManager.initFromConfig();
    navManager = new NavigationManager(ctx, hotspotManager);
  });

  describe('chapter management', () => {
    const chapters: VideoChapter[] = [
      { id: 'ch1', title: 'Intro', startTime: 0, endTime: 10 },
      { id: 'ch2', title: 'Main', startTime: 10, endTime: 30 },
    ];

    it('setResolvedChapters and getResolvedChapters', () => {
      navManager.setResolvedChapters(chapters);
      expect(navManager.getResolvedChapters()).toEqual(chapters);
    });

    it('getCurrentChapter returns undefined initially', () => {
      expect(navManager.getCurrentChapter()).toBeUndefined();
    });

    it('updateCurrentChapter sets the active chapter', () => {
      navManager.setResolvedChapters(chapters);
      navManager.updateCurrentChapter(5);
      expect(navManager.getCurrentChapter()).toBe('ch1');
    });

    it('updateCurrentChapter transitions between chapters', () => {
      navManager.setResolvedChapters(chapters);
      navManager.updateCurrentChapter(15);
      expect(navManager.getCurrentChapter()).toBe('ch2');
    });
  });

  describe('navigation', () => {
    it('nextHotspot seeks to next hotspot and pauses', () => {
      navManager.nextHotspot();
      expect(ctx.player.seek).toHaveBeenCalled();
      expect(ctx.player.pause).toHaveBeenCalled();
    });

    it('prevHotspot does nothing when no previous hotspot', () => {
      navManager.prevHotspot();
      // At time 0, there's no hotspot before
      expect(ctx.player.seek).not.toHaveBeenCalled();
    });

    it('goToChapter seeks to chapter start time', () => {
      navManager.setResolvedChapters([
        { id: 'ch1', title: 'Intro', startTime: 10, endTime: 20 },
      ]);
      navManager.goToChapter('ch1');
      expect(ctx.player.seek).toHaveBeenCalledWith(10);
    });

    it('goToChapter does nothing for unknown chapter', () => {
      navManager.goToChapter('nonexistent');
      expect(ctx.player.seek).not.toHaveBeenCalled();
    });
  });

  describe('nav counter', () => {
    it('updateNavCounter does not crash without hotspotNav', () => {
      expect(() => navManager.updateNavCounter()).not.toThrow();
    });

    it('invalidateSortedCache forces re-sort', () => {
      navManager.invalidateSortedCache();
      expect(() => navManager.updateNavCounter()).not.toThrow();
    });
  });

  it('destroy clears timers', () => {
    navManager.destroy();
  });
});
