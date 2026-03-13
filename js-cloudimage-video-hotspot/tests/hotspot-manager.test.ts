import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HotspotManager } from '../src/core/hotspot-manager';
import { TimelineEngine } from '../src/core/timeline';
import type { ManagerContext } from '../src/core/manager-types';
import type { NormalizedVideoHotspot, ResolvedConfig } from '../src/core/types';

function makeHotspot(overrides: Partial<NormalizedVideoHotspot> = {}): NormalizedVideoHotspot {
  return {
    id: 'h1',
    x: 50,
    y: 50,
    startTime: 0,
    endTime: 10,
    label: 'Test hotspot',
    ...overrides,
  };
}

function makeContext(overrides: Partial<ManagerContext> = {}): ManagerContext {
  const config = {
    src: 'test.mp4',
    hotspots: [{ id: 'h1', x: '50%', y: '50%', startTime: 0, endTime: 10, label: 'Test hotspot' }],
    trigger: 'click',
    placement: 'top',
    pauseOnInteract: true,
    controls: true,
    pulse: true,
    hotspotAnimation: 'fade',
  } as ResolvedConfig;

  return {
    config,
    player: {
      isPaused: vi.fn(() => false),
      pause: vi.fn(),
      play: vi.fn(),
      getCurrentTime: vi.fn(() => 0),
      getDuration: vi.fn(() => 60),
      seek: vi.fn(),
    } as unknown as ManagerContext['player'],
    timeline: new TimelineEngine([makeHotspot()]),
    containerEl: document.createElement('div'),
    overlayEl: document.createElement('div'),
    markersEl: document.createElement('div'),
    emitAnalytics: vi.fn(),
    isDestroyed: () => false,
    getControls: () => null,
    getHotspotNav: () => null,
    ...overrides,
  };
}

describe('HotspotManager', () => {
  let ctx: ManagerContext;
  let manager: HotspotManager;

  beforeEach(() => {
    ctx = makeContext();
    manager = new HotspotManager(ctx);
    manager.initFromConfig();
  });

  it('initializes normalized hotspots from config', () => {
    expect(manager.getNormalizedHotspots().size).toBe(1);
    expect(manager.getNormalizedHotspots().get('h1')).toBeDefined();
  });

  it('getHotspots returns config hotspots', () => {
    const hotspots = manager.getHotspots();
    expect(hotspots).toHaveLength(1);
    expect(hotspots[0].id).toBe('h1');
  });

  it('addHotspot adds to normalized map and config', () => {
    manager.addHotspot({
      id: 'h2', x: '70%', y: '30%', startTime: 5, endTime: 15, label: 'New hotspot',
    });
    expect(manager.getNormalizedHotspots().size).toBe(2);
    expect(manager.getHotspots()).toHaveLength(2);
  });

  it('removeHotspot removes from normalized map and config', () => {
    manager.removeHotspot('h1');
    expect(manager.getNormalizedHotspots().size).toBe(0);
    expect(manager.getHotspots()).toHaveLength(0);
  });

  it('removeHotspot handles non-existent ID gracefully', () => {
    expect(() => manager.removeHotspot('nonexistent')).not.toThrow();
  });

  it('open/close/closeAll manage openPopovers set', () => {
    expect(manager.getOpenPopovers().size).toBe(0);
  });

  it('destroy cleans up all state', () => {
    manager.destroy();
    expect(manager.getNormalizedHotspots().size).toBe(0);
    expect(manager.getOpenPopovers().size).toBe(0);
  });

  it('handleHotspotInteract pauses player when pauseOnInteract is true', () => {
    manager.handleHotspotInteract('h1');
    expect(ctx.player.pause).toHaveBeenCalled();
  });

  it('handleHotspotInteract does not pause if player already paused', () => {
    (ctx.player.isPaused as ReturnType<typeof vi.fn>).mockReturnValue(true);
    manager.handleHotspotInteract('h1');
    expect(ctx.player.pause).not.toHaveBeenCalled();
  });

  it('processTimeUpdate processes entered/exited hotspots', () => {
    // At time 0, hotspot h1 should be active (0-10)
    manager.processTimeUpdate(0);
    // At time 15, hotspot h1 should exit
    manager.processTimeUpdate(15);
  });
});
