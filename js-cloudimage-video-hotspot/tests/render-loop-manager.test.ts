import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { RenderLoopManager } from '../src/core/render-loop-manager';
import { HotspotManager } from '../src/core/hotspot-manager';
import { NavigationManager } from '../src/core/navigation-manager';
import { TimelineEngine } from '../src/core/timeline';
import type { ManagerContext } from '../src/core/manager-types';
import type { ResolvedConfig } from '../src/core/types';

function makeContext(): ManagerContext {
  return {
    config: {
      src: 'test.mp4',
      hotspots: [],
    } as ResolvedConfig,
    player: {
      isPaused: vi.fn(() => false),
      pause: vi.fn(),
      play: vi.fn(),
      getCurrentTime: vi.fn(() => 5),
      getDuration: vi.fn(() => 60),
      seek: vi.fn(),
    } as unknown as ManagerContext['player'],
    timeline: new TimelineEngine([]),
    containerEl: document.createElement('div'),
    overlayEl: document.createElement('div'),
    markersEl: document.createElement('div'),
    emitAnalytics: vi.fn(),
    isDestroyed: () => false,
    getControls: () => null,
    getHotspotNav: () => null,
  };
}

describe('RenderLoopManager', () => {
  let ctx: ManagerContext;
  let hotspotManager: HotspotManager;
  let navManager: NavigationManager;
  let renderLoop: RenderLoopManager;

  beforeEach(() => {
    ctx = makeContext();
    hotspotManager = new HotspotManager(ctx);
    navManager = new NavigationManager(ctx, hotspotManager);
    renderLoop = new RenderLoopManager(ctx, hotspotManager, navManager);
    vi.spyOn(hotspotManager, 'processTimeUpdate');
    vi.spyOn(navManager, 'updateNavCounter');
  });

  afterEach(() => {
    renderLoop.destroy();
  });

  it('onTimeUpdate calls processTimeUpdate and updateNavCounter', () => {
    renderLoop.onTimeUpdate(5);
    expect(hotspotManager.processTimeUpdate).toHaveBeenCalledWith(5);
    expect(navManager.updateNavCounter).toHaveBeenCalled();
  });

  it('onTimeUpdate is a no-op when destroyed', () => {
    const destroyedCtx = makeContext();
    destroyedCtx.isDestroyed = () => true;
    const hm = new HotspotManager(destroyedCtx);
    const nm = new NavigationManager(destroyedCtx, hm);
    const rl = new RenderLoopManager(destroyedCtx, hm, nm);
    vi.spyOn(hm, 'processTimeUpdate');

    rl.onTimeUpdate(5);
    expect(hm.processTimeUpdate).not.toHaveBeenCalled();
    rl.destroy();
  });

  it('startRenderLoop and stopRenderLoop manage animation frame', () => {
    const rafSpy = vi.spyOn(globalThis, 'requestAnimationFrame').mockReturnValue(1);
    const cafSpy = vi.spyOn(globalThis, 'cancelAnimationFrame').mockImplementation(() => {});

    renderLoop.startRenderLoop();
    expect(rafSpy).toHaveBeenCalled();

    renderLoop.stopRenderLoop();
    expect(cafSpy).toHaveBeenCalledWith(1);

    rafSpy.mockRestore();
    cafSpy.mockRestore();
  });

  it('startRenderLoop is idempotent', () => {
    const rafSpy = vi.spyOn(globalThis, 'requestAnimationFrame').mockReturnValue(1);

    renderLoop.startRenderLoop();
    renderLoop.startRenderLoop(); // second call should be no-op
    expect(rafSpy).toHaveBeenCalledTimes(1);

    rafSpy.mockRestore();
    renderLoop.destroy();
  });

  it('destroy stops the render loop', () => {
    const rafSpy = vi.spyOn(globalThis, 'requestAnimationFrame').mockReturnValue(1);
    const cafSpy = vi.spyOn(globalThis, 'cancelAnimationFrame').mockImplementation(() => {});

    renderLoop.startRenderLoop();
    renderLoop.destroy();
    expect(cafSpy).toHaveBeenCalled();

    rafSpy.mockRestore();
    cafSpy.mockRestore();
  });
});
