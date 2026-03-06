import type {
  CIVideoHotspotConfig,
  CIVideoHotspotInstance,
  VideoHotspotItem,
  NormalizedVideoHotspot,
  ResolvedConfig,
  VideoChapter,
  Placement,
  TriggerMode,
} from './types';
import { mergeConfig, validateConfig, parseDataAttributes, resolveChapterEndTimes } from './config';
import { createAnalyticsEmitter, type AnalyticsEmit } from './analytics';
import { TimelineEngine } from './timeline';
import { VideoPlayer } from '../player/video-player';
import { Controls } from '../player/controls';
import { ProgressBar } from '../player/progress-bar';
import { HotspotNav } from '../hotspot-nav/hotspot-nav';
import { createMarker, setMarkerActive, updateMarkerPosition, setMarkerExiting, destroyMarker } from '../markers/marker';
import { Popover } from '../popover/popover';
import { createFullscreenControl } from '../fullscreen/fullscreen';
import type { FullscreenControl } from '../fullscreen/fullscreen';
import { VideoKeyboardHandler } from '../a11y/keyboard';
import { acquireLiveRegion, releaseLiveRegion, announceToScreenReader } from '../a11y/aria';
import { createFocusTrap } from '../a11y/focus';
import { getElement, createElement, addClass, removeClass, injectStyles } from '../utils/dom';
import { addListener } from '../utils/events';
import { normalizeToPercent } from '../utils/coordinates';
import css from '../styles/index.css?inline';

export class CIVideoHotspot implements CIVideoHotspotInstance {
  private config: ResolvedConfig;
  private rootEl: HTMLElement;
  private containerEl!: HTMLElement;
  private videoWrapperEl!: HTMLElement;
  private overlayEl!: HTMLElement;
  private markersEl!: HTMLElement;

  private player!: VideoPlayer;
  private controls: Controls | null = null;
  private timeline!: TimelineEngine;
  private hotspotNav: HotspotNav | null = null;
  private fullscreenControl: FullscreenControl | null = null;
  private keyboardHandler: VideoKeyboardHandler | null = null;

  private markers = new Map<string, HTMLButtonElement>();
  private popovers = new Map<string, Popover>();
  private normalizedHotspots = new Map<string, NormalizedVideoHotspot>();
  private focusTraps = new Map<string, ReturnType<typeof createFocusTrap>>();
  private openPopovers = new Set<string>();

  private emitAnalytics: AnalyticsEmit;
  private animFrameId: number | null = null;
  private cleanups: (() => void)[] = [];
  private hotspotCleanups = new Map<string, (() => void)[]>();
  private activeTimers = new Set<ReturnType<typeof setTimeout>>();
  private destroyed = false;
  private wasPlayingBeforePause = false;
  private resolvedChapters: VideoChapter[] = [];
  private currentChapterId: string | undefined;
  private videoAspectRatio = 16 / 9;
  private resizeObserver: ResizeObserver | null = null;

  constructor(element: HTMLElement | string, config: CIVideoHotspotConfig) {
    validateConfig(config);
    this.config = mergeConfig(config);
    this.rootEl = getElement(element);
    this.emitAnalytics = createAnalyticsEmitter(config.onAnalytics, () => this.player?.getCurrentTime() ?? 0);

    acquireLiveRegion();
    injectStyles(css);
    this.buildDOM();
    this.initPlayer();
    this.initTimeline();
    this.initControls();
    this.initHotspotNav();
    this.initFullscreen();
    this.initKeyboard();
    this.initContainerEvents();
  }

  /** Auto-initialize from data attributes */
  static autoInit(root: HTMLElement = document.body): CIVideoHotspotInstance[] {
    const elements = root.querySelectorAll<HTMLElement>('[data-ci-video-hotspot-src]');
    const instances: CIVideoHotspotInstance[] = [];
    elements.forEach((el) => {
      const config = parseDataAttributes(el) as CIVideoHotspotConfig;
      instances.push(new CIVideoHotspot(el, config));
    });
    return instances;
  }

  // === DOM Setup ===

  private buildDOM(): void {
    this.rootEl.innerHTML = '';
    this.containerEl = createElement('div', 'ci-video-hotspot-container');

    if (this.config.theme === 'dark') {
      addClass(this.containerEl, 'ci-video-hotspot-theme-dark');
    }

    this.videoWrapperEl = createElement('div', 'ci-video-hotspot-video-wrapper');

    this.markersEl = createElement('div', 'ci-video-hotspot-markers');
    this.videoWrapperEl.appendChild(this.markersEl);

    this.overlayEl = createElement('div', 'ci-video-hotspot-overlay');

    this.containerEl.appendChild(this.videoWrapperEl);
    this.containerEl.appendChild(this.overlayEl);

    // Keep wrapper sized to video aspect ratio when container resizes
    this.resizeObserver = new ResizeObserver(() => this.fitWrapper());
    this.resizeObserver.observe(this.containerEl);
    this.rootEl.appendChild(this.containerEl);

    // Make container focusable for keyboard
    this.containerEl.setAttribute('tabindex', '0');
    this.containerEl.setAttribute('role', 'application');
    this.containerEl.setAttribute('aria-label', this.config.alt || 'Interactive video with hotspots');
  }

  private initPlayer(): void {
    this.player = new VideoPlayer({
      src: this.config.src,
      sources: this.config.sources,
      poster: this.config.poster,
      autoplay: this.config.autoplay,
      loop: this.config.loop,
      muted: this.config.muted,
      playerType: this.config.playerType,
      hls: this.config.hls,

      onPlay: () => {
        addClass(this.containerEl, 'ci-video-hotspot-container--playing');
        removeClass(this.containerEl, 'ci-video-hotspot-container--paused');
        this.config.onPlay?.();
        this.startRenderLoop();
        // Auto-hide controls during playback
        if (this.controls) {
          this.controls.startIdleTimer();
        }
      },

      onPause: () => {
        removeClass(this.containerEl, 'ci-video-hotspot-container--playing');
        addClass(this.containerEl, 'ci-video-hotspot-container--paused');
        this.config.onPause?.();
        this.stopRenderLoop();
        // Show controls when paused
        if (this.controls) {
          this.controls.clearIdleTimer();
          this.controls.show();
        }
      },

      onTimeUpdate: (currentTime) => {
        this.onTimeUpdate(currentTime);
        this.config.onTimeUpdate?.(currentTime);
        this.controls?.update();
        this.updateCurrentChapter(currentTime);
      },

      onDurationChange: (duration) => {
        // Resolve chapter end times now that we know the duration
        if (this.config.chapters) {
          this.resolvedChapters = resolveChapterEndTimes(this.config.chapters, duration);
        }
        // Re-render timeline indicators now that duration is known
        if (this.controls) {
          this.controls.progressBar.renderIndicators();
          this.controls.progressBar.renderChapters();
        }
      },

      onLoadedMetadata: () => {
        this.updateWrapperAspectRatio();
        this.config.onReady?.();
      },

      onWaiting: () => {
        addClass(this.containerEl, 'ci-video-hotspot-container--loading');
      },

      onPlaying: () => {
        removeClass(this.containerEl, 'ci-video-hotspot-container--loading');
      },
    });

    // Mount video element into wrapper, before the markers layer
    this.player.mount(this.videoWrapperEl);
    this.videoWrapperEl.insertBefore(this.player.element, this.markersEl);
  }

  private initTimeline(): void {
    // Normalize all hotspot coordinates
    const normalized: NormalizedVideoHotspot[] = this.config.hotspots.map((h) => {
      const { x, y } = normalizeToPercent(h.x, h.y);
      const normalizedKF = h.keyframes?.map((kf) => {
        const kfPos = normalizeToPercent(kf.x, kf.y);
        return { time: kf.time, x: kfPos.x, y: kfPos.y };
      });
      const nh: NormalizedVideoHotspot = {
        ...h,
        x,
        y,
        keyframes: normalizedKF,
      };
      this.normalizedHotspots.set(h.id, nh);
      return nh;
    });

    this.timeline = new TimelineEngine(normalized);
  }

  private initControls(): void {
    if (!this.config.controls) return;

    this.controls = new Controls({
      onPlay: () => this.play(),
      onPause: () => this.pause(),
      onSeek: (time) => this.seek(time),
      onVolumeChange: (v) => this.setVolume(v),
      onMuteToggle: () => this.setMuted(!this.isMuted()),
      onFullscreenToggle: () => this.fullscreenControl?.toggle(),
      onSpeedChange: (r) => this.setPlaybackRate(r),
      getDuration: () => this.getDuration(),
      getCurrentTime: () => this.getCurrentTime(),
      getBufferedEnd: () => this.player.getBufferedEnd(),
      isPaused: () => this.player.isPaused(),
      isMuted: () => this.isMuted(),
      getVolume: () => this.getVolume(),
      getPlaybackRate: () => this.getPlaybackRate(),
      isFullscreen: () => this.fullscreenControl?.isFullscreen() ?? false,
      showFullscreen: this.config.fullscreenButton !== false,
      chapters: this.config.chapters,
      showChapterNav: this.config.chapterNavigation !== false && !!this.config.chapters?.length,
      onChapterSelect: (id) => this.goToChapter(id),
      progressBarOptions: {
        timelineIndicators: this.config.timelineIndicators || 'dot',
        chapters: this.config.chapters,
        hotspotRanges: this.timeline.getTimeRanges(),
        onIndicatorClick: (id) => this.goToHotspot(id),
      },
    });

    this.containerEl.appendChild(this.controls.element);
  }

  private initHotspotNav(): void {
    if (!this.config.hotspotNavigation) return;

    this.hotspotNav = new HotspotNav({
      onPrev: () => this.prevHotspot(),
      onNext: () => this.nextHotspot(),
    });
    this.hotspotNav.updateCounter(0, this.config.hotspots.length);
    this.containerEl.appendChild(this.hotspotNav.element);
  }

  private initFullscreen(): void {
    if (!this.config.fullscreenButton) return;

    this.fullscreenControl = createFullscreenControl(this.containerEl, {
      onChange: (isFs) => {
        this.config.onFullscreenChange?.(isFs);
        this.controls?.update();
      },
    });
  }

  private initKeyboard(): void {
    this.keyboardHandler = new VideoKeyboardHandler({
      container: this.containerEl,
      onPlayPause: () => this.togglePlay(),
      onSeekForward: () => this.seek(this.getCurrentTime() + 5),
      onSeekBackward: () => this.seek(this.getCurrentTime() - 5),
      onVolumeUp: () => this.setVolume(Math.min(1, this.getVolume() + 0.1)),
      onVolumeDown: () => this.setVolume(Math.max(0, this.getVolume() - 0.1)),
      onMuteToggle: () => this.setMuted(!this.isMuted()),
      onNextHotspot: () => this.nextHotspot(),
      onPrevHotspot: () => this.prevHotspot(),
      onEscape: () => {
        if (this.openPopovers.size > 0) {
          this.closeAll();
        } else if (this.fullscreenControl?.isFullscreen()) {
          this.fullscreenControl.exit();
        }
      },
      onFullscreenToggle: () => this.fullscreenControl?.toggle(),
    });
  }

  private initContainerEvents(): void {
    // Click on container to toggle play/pause (handles when controls are hidden)
    this.cleanups.push(addListener(this.containerEl, 'click', (e) => {
      if ((e.target as HTMLElement).closest('.ci-video-hotspot-marker, .ci-video-hotspot-popover, .ci-video-hotspot-controls')) return;
      if (this.controls) {
        this.controls.show();
        if (!this.player.isPaused()) {
          this.controls.startIdleTimer();
        }
      }
      this.togglePlay();
    }));

    // Show controls on mouse move (also when paused)
    this.cleanups.push(addListener(this.containerEl, 'mousemove', () => {
      if (this.controls) {
        this.controls.show();
        if (!this.player.isPaused()) {
          this.controls.startIdleTimer();
        }
      }
    }));

    // Click outside to close popovers
    this.cleanups.push(addListener(document, 'click', (e) => {
      if (this.destroyed) return;
      const target = e.target as HTMLElement;
      if (!this.containerEl.contains(target)) {
        this.closeAll();
      }
    }));
  }

  // === Core Render Loop ===

  private onTimeUpdate(currentTime: number): void {
    if (this.destroyed) return;

    const { entered, exited, active } = this.timeline.update(currentTime);

    // Show newly entered hotspots
    for (const hotspot of entered) {
      this.showHotspot(hotspot);
    }

    // Hide exited hotspots
    for (const hotspot of exited) {
      this.hideHotspot(hotspot);
    }

    // Update positions for active hotspots with keyframes
    for (const hotspot of active) {
      if (hotspot.keyframes && hotspot.keyframes.length > 0) {
        const pos = this.timeline.getPosition(hotspot.id, currentTime);
        if (pos) {
          const marker = this.markers.get(hotspot.id);
          if (marker) updateMarkerPosition(marker, pos.x, pos.y);
        }
      }
    }

    // Update hotspot nav counter
    this.updateNavCounter();
  }

  private startRenderLoop(): void {
    if (this.animFrameId !== null) return;

    const loop = () => {
      if (this.destroyed) return;
      if (!this.player.isPaused()) {
        // Only run RAF for keyframe updates (high fps)
        if (this.timeline.hasActiveKeyframes()) {
          this.onTimeUpdate(this.player.getCurrentTime());
        }
        this.animFrameId = requestAnimationFrame(loop);
      }
    };
    this.animFrameId = requestAnimationFrame(loop);
  }

  private stopRenderLoop(): void {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  // === Hotspot Management ===

  private showHotspot(hotspot: NormalizedVideoHotspot): void {
    if (this.markers.has(hotspot.id)) return;

    const animation = hotspot.animation || this.config.hotspotAnimation || 'fade';
    const hotspotIndex = this.config.hotspots.findIndex((h) => h.id === hotspot.id);
    const marker = createMarker(hotspot, this.config.pulse !== false, this.config.renderMarker, hotspotIndex);
    this.markers.set(hotspot.id, marker);
    this.markersEl.appendChild(marker);

    // Entrance animation
    if (animation !== 'none') {
      addClass(marker, `ci-video-hotspot-marker--${animation}-in`);
    }

    // Create popover
    const triggerMode = (hotspot.trigger || this.config.trigger || 'click') as TriggerMode;
    const placement = (hotspot.placement || this.config.placement || 'top') as Placement;

    const popover = new Popover(hotspot as VideoHotspotItem, {
      placement,
      triggerMode,
      renderFn: this.config.renderPopover,
      onOpen: (h) => {
        this.config.onOpen?.(h);
        this.emitAnalytics('popover_open', h.id);
      },
      onClose: (h) => {
        this.config.onClose?.(h);
        this.emitAnalytics('popover_close', h.id);
      },
      emitAnalytics: this.emitAnalytics,
    });
    popover.mount(this.overlayEl, marker);
    this.popovers.set(hotspot.id, popover);

    // Bind interactions
    const markerCleanups: (() => void)[] = [];
    this.hotspotCleanups.set(hotspot.id, markerCleanups);

    if (triggerMode === 'hover') {
      markerCleanups.push(addListener(marker, 'mouseenter', () => {
        this.handleHotspotInteract(hotspot.id);
        popover.show();
        setMarkerActive(marker, true);
      }));
      markerCleanups.push(addListener(marker, 'mouseleave', () => {
        popover.scheduleHide();
        setMarkerActive(marker, false);
        this.handleHotspotInteractEnd(hotspot.id);
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

        this.config.onHotspotClick?.(e, hotspot as VideoHotspotItem);
        this.emitAnalytics('hotspot_click', hotspot.id);
        hotspot.onClick?.(e, hotspot as VideoHotspotItem);

        if (popover.isVisible()) {
          popover.hide();
          setMarkerActive(marker, false);
          this.openPopovers.delete(hotspot.id);
          this.handleHotspotInteractEnd(hotspot.id);

          // Deactivate focus trap
          this.focusTraps.get(hotspot.id)?.deactivate();
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
    if (hotspot.pauseOnShow && !this.player.isPaused()) {
      this.wasPlayingBeforePause = true;
      this.pause();
    }

    this.config.onHotspotShow?.(hotspot as VideoHotspotItem);
    this.emitAnalytics('hotspot_show', hotspot.id);
    announceToScreenReader(`Hotspot appeared: ${hotspot.label}`);
  }

  private hideHotspot(hotspot: NormalizedVideoHotspot): void {
    const marker = this.markers.get(hotspot.id);
    const popover = this.popovers.get(hotspot.id);
    const animation = hotspot.animation || this.config.hotspotAnimation || 'fade';

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
      }, 300);
      this.activeTimers.add(timer);
    } else if (marker) {
      destroyMarker(marker);
      this.markers.delete(hotspot.id);
    }

    // Destroy popover
    popover?.destroy();
    this.popovers.delete(hotspot.id);

    this.config.onHotspotHide?.(hotspot as VideoHotspotItem);
  }

  private handleHotspotInteract(hotspotId: string): void {
    const hotspot = this.normalizedHotspots.get(hotspotId);
    const shouldPause = hotspot?.pauseOnInteract ?? this.config.pauseOnInteract;

    if (shouldPause && !this.player.isPaused()) {
      this.wasPlayingBeforePause = true;
      this.pause();
    }
  }

  private handleHotspotInteractEnd(_hotspotId: string): void {
    // Resume only when ALL popovers are closed
    if (this.openPopovers.size === 0 && this.wasPlayingBeforePause) {
      this.wasPlayingBeforePause = false;
      this.play();
    }
  }

  // === Chapter Management ===

  private updateCurrentChapter(currentTime: number): void {
    if (!this.resolvedChapters.length) return;

    let activeChapter: VideoChapter | undefined;
    for (const ch of this.resolvedChapters) {
      if (currentTime >= ch.startTime && currentTime < (ch.endTime ?? Infinity)) {
        activeChapter = ch;
        break;
      }
    }

    const newChapterId = activeChapter?.id;
    if (newChapterId !== this.currentChapterId) {
      this.currentChapterId = newChapterId;
      if (activeChapter) {
        this.config.onChapterChange?.(activeChapter);
        announceToScreenReader(`Chapter: ${activeChapter.title}`);
      }
      this.controls?.setActiveChapter(newChapterId);
    }
  }

  private updateNavCounter(): void {
    if (!this.hotspotNav) return;
    const sorted = [...this.config.hotspots].sort((a, b) => a.startTime - b.startTime);
    const currentTime = this.getCurrentTime();
    let currentIndex = 0;
    for (let i = 0; i < sorted.length; i++) {
      if (currentTime >= sorted[i].startTime) {
        currentIndex = i + 1;
      }
    }
    this.hotspotNav.updateCounter(currentIndex, sorted.length);
  }

  // === Public API: Video Playback ===

  private updateWrapperAspectRatio(): void {
    const videoEl = this.player.getVideoElement();
    if (videoEl && videoEl.videoWidth && videoEl.videoHeight) {
      this.videoAspectRatio = videoEl.videoWidth / videoEl.videoHeight;
    }
    this.fitWrapper();
  }

  private fitWrapper(): void {
    const cw = this.containerEl.clientWidth;
    if (!cw) return;

    // Temporarily collapse wrapper to measure whether the container
    // has a constrained height (from CSS height / flex / etc.)
    const prevH = this.videoWrapperEl.style.height;
    this.videoWrapperEl.style.height = '0px';
    const ch = this.containerEl.clientHeight;
    this.videoWrapperEl.style.height = prevH;

    // If container has no constrained height, just fill width
    if (ch <= 0) {
      this.videoWrapperEl.style.width = `${cw}px`;
      this.videoWrapperEl.style.height = `${cw / this.videoAspectRatio}px`;
      return;
    }

    // Container has a constrained height — fit within the box
    const containerRatio = cw / ch;
    let w: number, h: number;

    if (containerRatio > this.videoAspectRatio) {
      // Container is wider than video — height is the constraint
      h = ch;
      w = ch * this.videoAspectRatio;
    } else {
      // Container is taller than video — width is the constraint
      w = cw;
      h = cw / this.videoAspectRatio;
    }

    this.videoWrapperEl.style.width = `${w}px`;
    this.videoWrapperEl.style.height = `${h}px`;
  }

  getElements() {
    return {
      container: this.containerEl,
      videoWrapper: this.videoWrapperEl,
      video: this.player.element,
      overlay: this.overlayEl,
      controls: this.controls?.element ?? null,
    };
  }

  play(): Promise<void> {
    return this.player.play();
  }

  pause(): void {
    this.player.pause();
  }

  togglePlay(): void {
    this.player.togglePlay();
  }

  seek(time: number): void {
    this.player.seek(time);
    // Force timeline update at new time
    this.onTimeUpdate(time);
    this.controls?.update();
  }

  getCurrentTime(): number {
    return this.player.getCurrentTime();
  }

  getDuration(): number {
    return this.player.getDuration();
  }

  setVolume(level: number): void {
    this.player.setVolume(level);
    if (level > 0) this.player.setMuted(false);
  }

  getVolume(): number {
    return this.player.getVolume();
  }

  setMuted(muted: boolean): void {
    this.player.setMuted(muted);
  }

  isMuted(): boolean {
    return this.player.isMuted();
  }

  setPlaybackRate(rate: number): void {
    this.player.setPlaybackRate(rate);
  }

  getPlaybackRate(): number {
    return this.player.getPlaybackRate();
  }

  /** Return the underlying HTMLVideoElement, if available (null for YouTube/Vimeo). */
  getVideoElement(): HTMLVideoElement | null {
    return this.player.getVideoElement();
  }

  // === Public API: Hotspot Management ===

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
    this.config.hotspots.push(hotspot);
    const { x, y } = normalizeToPercent(hotspot.x, hotspot.y);
    const normalizedKF = hotspot.keyframes?.map((kf) => {
      const kfPos = normalizeToPercent(kf.x, kf.y);
      return { time: kf.time, x: kfPos.x, y: kfPos.y };
    });
    const nh: NormalizedVideoHotspot = { ...hotspot, x, y, keyframes: normalizedKF };
    this.normalizedHotspots.set(hotspot.id, nh);
    this.timeline.setHotspots(Array.from(this.normalizedHotspots.values()));

    // Update progress bar indicators
    if (this.controls) {
      this.controls.progressBar.updateRanges(this.timeline.getTimeRanges());
    }
  }

  removeHotspot(id: string): void {
    this.config.hotspots = this.config.hotspots.filter((h) => h.id !== id);
    this.hideHotspot(this.normalizedHotspots.get(id)!);
    this.normalizedHotspots.delete(id);
    this.timeline.setHotspots(Array.from(this.normalizedHotspots.values()));

    if (this.controls) {
      this.controls.progressBar.updateRanges(this.timeline.getTimeRanges());
    }
  }

  updateHotspot(id: string, updates: Partial<VideoHotspotItem>): void {
    const idx = this.config.hotspots.findIndex((h) => h.id === id);
    if (idx === -1) return;

    // Detect if visual properties changed (require marker re-render)
    const prev = this.config.hotspots[idx];
    const visualKeys: (keyof VideoHotspotItem)[] = [
      'markerStyle', 'trigger', 'placement', 'animation', 'icon', 'className', 'label',
    ];
    const needsRerender = this.markers.has(id) && visualKeys.some(
      (k) => k in updates && updates[k] !== prev[k],
    );

    this.config.hotspots[idx] = { ...prev, ...updates };
    // Re-normalize
    const h = this.config.hotspots[idx];
    const { x, y } = normalizeToPercent(h.x, h.y);
    const normalizedKF = h.keyframes?.map((kf) => {
      const kfPos = normalizeToPercent(kf.x, kf.y);
      return { time: kf.time, x: kfPos.x, y: kfPos.y };
    });
    const nh: NormalizedVideoHotspot = { ...h, x, y, keyframes: normalizedKF };
    this.normalizedHotspots.set(id, nh);
    this.timeline.setHotspots(Array.from(this.normalizedHotspots.values()));

    // Re-render visible marker if visual properties changed
    if (needsRerender) {
      const oldNh = { ...nh, animation: 'none' as const };
      this.hideHotspot(oldNh);
      this.showHotspot(nh);

      // Restore interpolated position (marker was recreated at base x,y)
      if (nh.keyframes && nh.keyframes.length > 0) {
        const pos = this.timeline.getPosition(id, this.player.getCurrentTime());
        const marker = this.markers.get(id);
        if (pos && marker) updateMarkerPosition(marker, pos.x, pos.y);
      }
    }
  }

  getVisibleHotspots(): string[] {
    return this.timeline.getActiveIds();
  }

  getHotspots(): VideoHotspotItem[] {
    return [...this.config.hotspots];
  }

  // === Public API: Hotspot Navigation ===

  nextHotspot(): void {
    const next = this.timeline.findNextHotspot(this.getCurrentTime());
    if (next) {
      this.seek(next.startTime);
      this.pause();
      // Wait for timeUpdate to show the hotspot, then open it
      const timer = setTimeout(() => {
        this.activeTimers.delete(timer);
        this.open(next.id);
      }, 100);
      this.activeTimers.add(timer);
    }
  }

  prevHotspot(): void {
    const prev = this.timeline.findPrevHotspot(this.getCurrentTime());
    if (prev) {
      this.seek(prev.startTime);
      this.pause();
      const timer = setTimeout(() => {
        this.activeTimers.delete(timer);
        this.open(prev.id);
      }, 100);
      this.activeTimers.add(timer);
    }
  }

  goToHotspot(id: string): void {
    const hotspot = this.normalizedHotspots.get(id);
    if (!hotspot) return;
    this.seek(hotspot.startTime);
    this.pause();
    const timer = setTimeout(() => {
      this.activeTimers.delete(timer);
      this.open(id);
    }, 100);
    this.activeTimers.add(timer);
  }

  // === Public API: Chapter Navigation ===

  goToChapter(id: string): void {
    const chapter = this.resolvedChapters.find((ch) => ch.id === id)
      || this.config.chapters?.find((ch) => ch.id === id);
    if (chapter) {
      this.seek(chapter.startTime);
    }
  }

  getCurrentChapter(): string | undefined {
    return this.currentChapterId;
  }

  // === Public API: Fullscreen ===

  enterFullscreen(): void {
    this.fullscreenControl?.enter();
  }

  exitFullscreen(): void {
    this.fullscreenControl?.exit();
  }

  isFullscreen(): boolean {
    return this.fullscreenControl?.isFullscreen() ?? false;
  }

  // === Public API: Lifecycle ===

  update(config: Partial<CIVideoHotspotConfig>): void {
    const srcChanged = config.src !== undefined && config.src !== this.config.src;

    // Save player state before teardown
    let currentTime = 0;
    let wasPaused = true;
    if (!srcChanged && this.player) {
      currentTime = this.player.getCurrentTime();
      wasPaused = this.player.isPaused();
    }

    this.destroyInternal(!srcChanged);

    const newConfig = { ...this.config, ...config } as CIVideoHotspotConfig;
    validateConfig(newConfig);
    this.config = mergeConfig(newConfig);
    this.emitAnalytics = createAnalyticsEmitter(newConfig.onAnalytics, () => this.player?.getCurrentTime() ?? 0);

    acquireLiveRegion();
    this.buildDOM();

    if (srcChanged) {
      this.initPlayer();
    } else {
      // Re-mount existing player into the new DOM without reloading the video
      this.videoWrapperEl.insertBefore(this.player.element, this.markersEl);

      // Re-resolve chapters with the known duration
      if (this.config.chapters) {
        this.resolvedChapters = resolveChapterEndTimes(this.config.chapters, this.player.getDuration());
      }
    }

    this.initTimeline();
    this.initControls();
    this.initHotspotNav();
    this.initFullscreen();
    this.initKeyboard();
    this.initContainerEvents();

    // Restore playback state when the player was preserved
    if (!srcChanged) {
      this.onTimeUpdate(currentTime);
      this.controls?.update();
      if (!wasPaused) {
        this.startRenderLoop();
      }
    }
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.destroyInternal();
    this.rootEl.innerHTML = '';
  }

  private destroyInternal(preservePlayer = false): void {
    // Clear timers
    for (const timer of this.activeTimers) {
      clearTimeout(timer);
    }
    this.activeTimers.clear();

    // Stop render loop
    this.stopRenderLoop();

    // Disconnect resize observer
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;

    // Cleanup per-hotspot
    for (const [, cleanups] of this.hotspotCleanups) {
      cleanups.forEach((fn) => fn());
    }
    this.hotspotCleanups.clear();

    // Global cleanups
    this.cleanups.forEach((fn) => fn());
    this.cleanups = [];

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

    // Destroy subsystems
    this.controls?.destroy();
    this.controls = null;
    this.hotspotNav?.destroy();
    this.hotspotNav = null;
    this.fullscreenControl?.destroy();
    this.fullscreenControl = null;
    this.keyboardHandler?.destroy();
    this.keyboardHandler = null;
    if (!preservePlayer) {
      this.player?.destroy();
    }

    // Clear state
    this.normalizedHotspots.clear();
    this.openPopovers.clear();
    this.timeline?.reset();

    releaseLiveRegion();
  }
}
