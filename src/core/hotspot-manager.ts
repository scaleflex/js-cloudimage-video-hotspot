import type {
  NormalizedVideoHotspot,
  VideoHotspotItem,
  TriggerMode,
  Placement,
} from './types';
import type { ManagerContext, HotspotManagerInterface } from './manager-types';
import { EXIT_ANIMATION_MS } from './constants';
import { createMarker, setMarkerActive, updateMarkerPosition, setMarkerExiting, destroyMarker } from '../markers/marker';
import { Popover } from '../popover/popover';
import { createFocusTrap } from '../a11y/focus';
import { announceToScreenReader } from '../a11y/aria';
import { addListener } from '../utils/events';
import { normalizeToPercent } from '../utils/coordinates';

export class HotspotManager implements HotspotManagerInterface {
  private markers = new Map<string, HTMLButtonElement>();
  private popovers = new Map<string, Popover>();
  private normalizedHotspots = new Map<string, NormalizedVideoHotspot>();
  private focusTraps = new Map<string, ReturnType<typeof createFocusTrap>>();
  private openPopovers = new Set<string>();
  private hotspotCleanups = new Map<string, (() => void)[]>();
  private activeTimers = new Set<ReturnType<typeof setTimeout>>();
  private wasPlayingBeforePause = false;
  /** Tracks whether the user manually paused during an auto-pause */
  private userPausedDuringInteract = false;
  private interactEndTimer: ReturnType<typeof setTimeout> | undefined;

  constructor(private ctx: ManagerContext) {}

  /** Initialize normalized hotspots from config */
  initFromConfig(): void {
    for (const h of this.ctx.config.hotspots) {
      const nh = this.normalizeHotspot(h);
      this.normalizedHotspots.set(h.id, nh);
    }
  }

  getNormalizedHotspots(): Map<string, NormalizedVideoHotspot> {
    return this.normalizedHotspots;
  }

  getNormalizedHotspotsArray(): NormalizedVideoHotspot[] {
    return Array.from(this.normalizedHotspots.values());
  }

  private normalizeHotspot(h: VideoHotspotItem): NormalizedVideoHotspot {
    const { x, y } = normalizeToPercent(h.x, h.y);
    const normalizedKF = h.keyframes?.map((kf) => {
      const kfPos = normalizeToPercent(kf.x, kf.y);
      return { time: kf.time, x: kfPos.x, y: kfPos.y };
    });
    return { ...h, x, y, keyframes: normalizedKF };
  }

  showHotspot(hotspot: NormalizedVideoHotspot): void {
    if (this.markers.has(hotspot.id)) return;

    const config = this.ctx.config;
    const animation = hotspot.animation || config.hotspotAnimation || 'fade';
    const hotspotIndex = config.hotspots.findIndex((h) => h.id === hotspot.id);
    const marker = createMarker(hotspot, config.pulse !== false, config.renderMarker, hotspotIndex);
    this.markers.set(hotspot.id, marker);
    this.ctx.markersEl.appendChild(marker);

    // Entrance animation
    if (animation !== 'none') {
      marker.classList.add(`ci-video-hotspot-marker--${animation}-in`);
    }

    // Create popover
    const triggerMode = (hotspot.trigger || config.trigger || 'click') as TriggerMode;
    const placement = (hotspot.placement || config.placement || 'top') as Placement;

    const popover = new Popover(hotspot as VideoHotspotItem, {
      placement,
      triggerMode,
      renderFn: config.renderPopover,
      onOpen: (h) => {
        config.onOpen?.(h);
        this.ctx.emitAnalytics('popover_open', h.id);
      },
      onClose: (h) => {
        config.onClose?.(h);
        this.ctx.emitAnalytics('popover_close', h.id);
        // Resume video when popover is closed (e.g. via close button)
        this.openPopovers.delete(hotspot.id);
        setMarkerActive(marker, false);
        this.focusTraps.get(hotspot.id)?.deactivate();
        this.handleHotspotInteractEnd(hotspot.id);
      },
      emitAnalytics: this.ctx.emitAnalytics,
    });
    popover.mount(this.ctx.overlayEl, marker);
    this.popovers.set(hotspot.id, popover);

    // Bind interactions
    const markerCleanups: (() => void)[] = [];
    this.hotspotCleanups.set(hotspot.id, markerCleanups);

    if (triggerMode === 'hover') {
      markerCleanups.push(addListener(marker, 'mouseenter', () => {
        this.clearInteractEndTimer();
        this.handleHotspotInteract(hotspot.id);
        popover.show();
        setMarkerActive(marker, true);
      }));
      markerCleanups.push(addListener(marker, 'mouseleave', () => {
        popover.scheduleHide();
        setMarkerActive(marker, false);
        this.scheduleInteractEnd(hotspot.id);
      }));
      // Keep pause while hovering the popover card
      markerCleanups.push(addListener(popover.element, 'mouseenter', () => {
        this.clearInteractEndTimer();
        this.handleHotspotInteract(hotspot.id);
      }));
      markerCleanups.push(addListener(popover.element, 'mouseleave', () => {
        this.scheduleInteractEnd(hotspot.id);
      }));
      markerCleanups.push(addListener(marker, 'focus', () => {
        popover.show();
        setMarkerActive(marker, true);
      }));
      markerCleanups.push(addListener(marker, 'blur', () => {
        popover.scheduleHide();
        setMarkerActive(marker, false);
      }));
    } else {
      // Click mode
      markerCleanups.push(addListener(marker, 'click', (e) => {
        e.stopPropagation();

        config.onHotspotClick?.(e, hotspot as VideoHotspotItem);
        this.ctx.emitAnalytics('hotspot_click', hotspot.id);
        hotspot.onClick?.(e, hotspot as VideoHotspotItem);

        if (popover.isVisible()) {
          popover.hide();
        } else {
          popover.show();
          setMarkerActive(marker, true);
          this.openPopovers.add(hotspot.id);
          this.handleHotspotInteract(hotspot.id);

          // Create and activate focus trap
          const trap = createFocusTrap(popover.element, marker);
          this.focusTraps.set(hotspot.id, trap);
          trap.activate();
        }
      }));
    }

    // Pause on show if configured
    if (hotspot.pauseOnShow && !this.ctx.player.isPaused()) {
      this.wasPlayingBeforePause = true;
      this.ctx.player.pause();
    }

    config.onHotspotShow?.(hotspot as VideoHotspotItem);
    this.ctx.emitAnalytics('hotspot_show', hotspot.id);
    announceToScreenReader(`Hotspot appeared: ${hotspot.label}`);
  }

  hideHotspot(hotspot: NormalizedVideoHotspot): void {
    const marker = this.markers.get(hotspot.id);
    const popover = this.popovers.get(hotspot.id);
    const animation = hotspot.animation || this.ctx.config.hotspotAnimation || 'fade';

    // Close popover if open
    if (popover?.isVisible()) {
      popover.hide();
      this.openPopovers.delete(hotspot.id);
    }

    // Deactivate focus trap
    this.focusTraps.get(hotspot.id)?.destroy();
    this.focusTraps.delete(hotspot.id);

    // Run cleanup functions
    const cleanups = this.hotspotCleanups.get(hotspot.id);
    if (cleanups) {
      cleanups.forEach((fn) => fn());
      this.hotspotCleanups.delete(hotspot.id);
    }

    // Exit animation then remove
    if (marker && animation !== 'none') {
      setMarkerExiting(marker, animation);
      const timer = setTimeout(() => {
        this.activeTimers.delete(timer);
        destroyMarker(marker);
        this.markers.delete(hotspot.id);
      }, EXIT_ANIMATION_MS);
      this.activeTimers.add(timer);
    } else if (marker) {
      destroyMarker(marker);
      this.markers.delete(hotspot.id);
    }

    // Destroy popover
    popover?.destroy();
    this.popovers.delete(hotspot.id);

    this.ctx.config.onHotspotHide?.(hotspot as VideoHotspotItem);
  }

  handleHotspotInteract(hotspotId: string): void {
    const hotspot = this.normalizedHotspots.get(hotspotId);
    const shouldPause = hotspot?.pauseOnInteract ?? this.ctx.config.pauseOnInteract;

    if (shouldPause && !this.ctx.player.isPaused()) {
      this.wasPlayingBeforePause = true;
      this.userPausedDuringInteract = false;
      this.ctx.player.pause();
    }
  }

  handleHotspotInteractEnd(_hotspotId: string): void {
    // Resume only when ALL popovers are closed and user didn't manually pause
    if (this.openPopovers.size === 0 && this.wasPlayingBeforePause && !this.userPausedDuringInteract) {
      this.wasPlayingBeforePause = false;
      this.userPausedDuringInteract = false;
      this.ctx.player.play();
    }
  }

  private scheduleInteractEnd(hotspotId: string, delay = 200): void {
    this.clearInteractEndTimer();
    this.interactEndTimer = setTimeout(() => {
      this.interactEndTimer = undefined;
      this.handleHotspotInteractEnd(hotspotId);
    }, delay);
  }

  private clearInteractEndTimer(): void {
    if (this.interactEndTimer !== undefined) {
      clearTimeout(this.interactEndTimer);
      this.interactEndTimer = undefined;
    }
  }

  /** Call when user manually pauses (to prevent auto-resume) */
  onUserPause(): void {
    if (this.wasPlayingBeforePause) {
      this.userPausedDuringInteract = true;
    }
  }

  open(id: string): void {
    const popover = this.popovers.get(id);
    const marker = this.markers.get(id);
    if (popover && marker) {
      popover.show();
      setMarkerActive(marker, true);
      this.openPopovers.add(id);
      this.handleHotspotInteract(id);
    }
  }

  close(id: string): void {
    const popover = this.popovers.get(id);
    const marker = this.markers.get(id);
    if (popover) {
      popover.hide();
      this.openPopovers.delete(id);
    }
    if (marker) {
      setMarkerActive(marker, false);
    }
    this.focusTraps.get(id)?.deactivate();
    this.handleHotspotInteractEnd(id);
  }

  closeAll(): void {
    for (const id of [...this.openPopovers]) {
      this.close(id);
    }
  }

  addHotspot(hotspot: VideoHotspotItem): void {
    this.ctx.config.hotspots.push(hotspot);
    const nh = this.normalizeHotspot(hotspot);
    this.normalizedHotspots.set(hotspot.id, nh);
    this.ctx.timeline.setHotspots(this.getNormalizedHotspotsArray());

    // Update progress bar indicators
    const controls = this.ctx.getControls();
    if (controls) {
      controls.progressBar.updateRanges(this.ctx.timeline.getTimeRanges());
    }
  }

  removeHotspot(id: string): void {
    this.ctx.config.hotspots = this.ctx.config.hotspots.filter((h) => h.id !== id);
    const nh = this.normalizedHotspots.get(id);
    if (nh) {
      this.hideHotspot(nh);
    }
    this.normalizedHotspots.delete(id);
    this.ctx.timeline.setHotspots(this.getNormalizedHotspotsArray());

    const controls = this.ctx.getControls();
    if (controls) {
      controls.progressBar.updateRanges(this.ctx.timeline.getTimeRanges());
    }
  }

  updateHotspot(id: string, updates: Partial<VideoHotspotItem>): void {
    const idx = this.ctx.config.hotspots.findIndex((h) => h.id === id);
    if (idx === -1) return;

    // Detect if visual properties changed (require marker re-render)
    const prev = this.ctx.config.hotspots[idx];
    const visualKeys: (keyof VideoHotspotItem)[] = [
      'markerStyle', 'trigger', 'placement', 'animation', 'icon', 'className', 'label',
    ];
    const needsRerender = this.markers.has(id) && visualKeys.some(
      (k) => k in updates && updates[k] !== prev[k],
    );

    this.ctx.config.hotspots[idx] = { ...prev, ...updates };
    // Re-normalize
    const nh = this.normalizeHotspot(this.ctx.config.hotspots[idx]);
    this.normalizedHotspots.set(id, nh);
    this.ctx.timeline.setHotspots(this.getNormalizedHotspotsArray());

    // Re-render visible marker if visual properties changed
    if (needsRerender) {
      const oldNh = { ...nh, animation: 'none' as const };
      this.hideHotspot(oldNh);
      this.showHotspot(nh);

      // Restore interpolated position (marker was recreated at base x,y)
      if (nh.keyframes && nh.keyframes.length > 0) {
        const pos = this.ctx.timeline.getPosition(id, this.ctx.player.getCurrentTime());
        const marker = this.markers.get(id);
        if (pos && marker) updateMarkerPosition(marker, pos.x, pos.y);
      }
    }
  }

  getVisibleHotspots(): string[] {
    return this.ctx.timeline.getActiveIds();
  }

  getHotspots(): VideoHotspotItem[] {
    return [...this.ctx.config.hotspots];
  }

  getOpenPopovers(): ReadonlySet<string> {
    return this.openPopovers;
  }

  /** Process timeline update: show/hide hotspots and update positions */
  processTimeUpdate(currentTime: number): void {
    const { entered, exited, active } = this.ctx.timeline.update(currentTime);

    for (const hotspot of entered) {
      this.showHotspot(hotspot);
    }

    for (const hotspot of exited) {
      this.hideHotspot(hotspot);
    }

    // Update positions for active hotspots with keyframes
    for (const hotspot of active) {
      if (hotspot.keyframes && hotspot.keyframes.length > 0) {
        const pos = this.ctx.timeline.getPosition(hotspot.id, currentTime);
        if (pos) {
          const marker = this.markers.get(hotspot.id);
          if (marker) updateMarkerPosition(marker, pos.x, pos.y);
        }
      }
    }
  }

  destroy(): void {
    // Clear timers
    this.clearInteractEndTimer();
    for (const timer of this.activeTimers) {
      clearTimeout(timer);
    }
    this.activeTimers.clear();

    // Cleanup per-hotspot
    for (const [, cleanups] of this.hotspotCleanups) {
      cleanups.forEach((fn) => fn());
    }
    this.hotspotCleanups.clear();

    // Destroy popovers
    for (const [, popover] of this.popovers) {
      popover.destroy();
    }
    this.popovers.clear();

    // Destroy markers
    for (const [, marker] of this.markers) {
      destroyMarker(marker);
    }
    this.markers.clear();

    // Destroy focus traps
    for (const [, trap] of this.focusTraps) {
      trap.destroy();
    }
    this.focusTraps.clear();

    // Clear state
    this.normalizedHotspots.clear();
    this.openPopovers.clear();
  }
}
