import type { ManagerContext, RenderLoopManagerInterface } from './manager-types';
import type { HotspotManager } from './hotspot-manager';
import type { NavigationManager } from './navigation-manager';

export class RenderLoopManager implements RenderLoopManagerInterface {
  private animFrameId: number | null = null;

  constructor(
    private ctx: ManagerContext,
    private hotspotManager: HotspotManager,
    private navigationManager: NavigationManager,
  ) {}

  onTimeUpdate(currentTime: number): void {
    if (this.ctx.isDestroyed()) return;

    this.hotspotManager.processTimeUpdate(currentTime);
    this.navigationManager.updateNavCounter();
  }

  startRenderLoop(): void {
    if (this.animFrameId !== null) return;

    const loop = () => {
      if (this.ctx.isDestroyed()) return;
      if (!this.ctx.player.isPaused()) {
        // Only run RAF for keyframe updates (high fps)
        if (this.ctx.timeline.hasActiveKeyframes()) {
          this.onTimeUpdate(this.ctx.player.getCurrentTime());
        }
        this.animFrameId = requestAnimationFrame(loop);
      }
    };
    this.animFrameId = requestAnimationFrame(loop);
  }

  stopRenderLoop(): void {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  destroy(): void {
    this.stopRenderLoop();
  }
}
