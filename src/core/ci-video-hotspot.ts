import type {
  CIVideoHotspotConfig,
  CIVideoHotspotInstance,
  VideoHotspotItem,
  ResolvedConfig,
} from './types';
import { mergeConfig, validateConfig, parseDataAttributes, resolveChapterEndTimes } from './config';
import { createAnalyticsEmitter, type AnalyticsEmit } from './analytics';
import { TimelineEngine } from './timeline';
import { VideoPlayer } from '../player/video-player';
import { Controls } from '../player/controls';
import { HotspotNav } from '../hotspot-nav/hotspot-nav';
import { HotspotManager } from './hotspot-manager';
import { NavigationManager } from './navigation-manager';
import { RenderLoopManager } from './render-loop-manager';
import { createFullscreenControl } from '../fullscreen/fullscreen';
import type { FullscreenControl } from '../fullscreen/fullscreen';
import { VideoKeyboardHandler } from '../a11y/keyboard';
import { acquireLiveRegion, releaseLiveRegion } from '../a11y/aria';
import { getElement, createElement, addClass, removeClass, injectStyles } from '../utils/dom';
import { addListener } from '../utils/events';
import { KEYBOARD_SEEK_STEP_S, KEYBOARD_VOLUME_STEP } from './constants';
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

  private hotspotManager!: HotspotManager;
  private navigationManager!: NavigationManager;
  private renderLoopManager!: RenderLoopManager;

  private emitAnalytics: AnalyticsEmit;
  private cleanups: (() => void)[] = [];
  private destroyed = false;
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
    this.initManagers();
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
        this.renderLoopManager?.startRenderLoop();
        if (this.controls) {
          this.controls.startIdleTimer();
        }
      },

      onPause: () => {
        removeClass(this.containerEl, 'ci-video-hotspot-container--playing');
        addClass(this.containerEl, 'ci-video-hotspot-container--paused');
        this.config.onPause?.();
        this.renderLoopManager?.stopRenderLoop();
        if (this.controls) {
          this.controls.clearIdleTimer();
          this.controls.show();
        }
      },

      onTimeUpdate: (currentTime) => {
        this.renderLoopManager?.onTimeUpdate(currentTime);
        this.config.onTimeUpdate?.(currentTime);
        this.controls?.update();
        this.navigationManager?.updateCurrentChapter(currentTime);
      },

      onDurationChange: (duration) => {
        if (this.config.chapters) {
          this.navigationManager?.setResolvedChapters(
            resolveChapterEndTimes(this.config.chapters, duration),
          );
        }
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

  private initManagers(): void {
    const ctx = {
      config: this.config,
      player: this.player,
      timeline: this.timeline!,
      containerEl: this.containerEl,
      overlayEl: this.overlayEl,
      markersEl: this.markersEl,
      emitAnalytics: this.emitAnalytics,
      isDestroyed: () => this.destroyed,
      getControls: () => this.controls,
      getHotspotNav: () => this.hotspotNav,
    };

    this.hotspotManager = new HotspotManager(ctx);
    this.hotspotManager.initFromConfig();

    // Initialize timeline with normalized hotspots
    this.timeline = new TimelineEngine(this.hotspotManager.getNormalizedHotspotsArray());
    // Update context reference after timeline is created
    ctx.timeline = this.timeline;

    this.navigationManager = new NavigationManager(ctx, this.hotspotManager);
    this.renderLoopManager = new RenderLoopManager(ctx, this.hotspotManager, this.navigationManager);
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
      onSeekForward: () => this.seek(this.getCurrentTime() + KEYBOARD_SEEK_STEP_S),
      onSeekBackward: () => this.seek(this.getCurrentTime() - KEYBOARD_SEEK_STEP_S),
      onVolumeUp: () => this.setVolume(Math.min(1, this.getVolume() + KEYBOARD_VOLUME_STEP)),
      onVolumeDown: () => this.setVolume(Math.max(0, this.getVolume() - KEYBOARD_VOLUME_STEP)),
      onMuteToggle: () => this.setMuted(!this.isMuted()),
      onNextHotspot: () => this.nextHotspot(),
      onPrevHotspot: () => this.prevHotspot(),
      onEscape: () => {
        if (this.hotspotManager.getOpenPopovers().size > 0) {
          this.closeAll();
        } else if (this.fullscreenControl?.isFullscreen()) {
          this.fullscreenControl.exit();
        }
      },
      onFullscreenToggle: () => this.fullscreenControl?.toggle(),
    });
  }

  private initContainerEvents(): void {
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

    this.cleanups.push(addListener(this.containerEl, 'mousemove', () => {
      if (this.controls) {
        this.controls.show();
        if (!this.player.isPaused()) {
          this.controls.startIdleTimer();
        }
      }
    }));

    this.cleanups.push(addListener(document, 'click', (e) => {
      if (this.destroyed) return;
      if (this.hotspotManager.getOpenPopovers().size === 0) return;
      const target = e.target as HTMLElement;
      // Close if click is outside container, or inside container but not on a marker/popover
      if (!this.containerEl.contains(target)) {
        this.closeAll();
      } else if (!target.closest('.ci-video-hotspot-marker, .ci-video-hotspot-popover')) {
        this.closeAll();
      }
    }));
  }

  // === Aspect Ratio ===

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

    const prevH = this.videoWrapperEl.style.height;
    this.videoWrapperEl.style.height = '0px';
    const ch = this.containerEl.clientHeight;
    this.videoWrapperEl.style.height = prevH;

    if (ch <= 0) {
      this.videoWrapperEl.style.width = `${cw}px`;
      this.videoWrapperEl.style.height = `${cw / this.videoAspectRatio}px`;
      return;
    }

    const containerRatio = cw / ch;
    let w: number, h: number;

    if (containerRatio > this.videoAspectRatio) {
      h = ch;
      w = ch * this.videoAspectRatio;
    } else {
      w = cw;
      h = cw / this.videoAspectRatio;
    }

    this.videoWrapperEl.style.width = `${w}px`;
    this.videoWrapperEl.style.height = `${h}px`;
  }

  // === Public API: DOM ===

  getElements() {
    return {
      container: this.containerEl,
      videoWrapper: this.videoWrapperEl,
      video: this.player.element,
      overlay: this.overlayEl,
      controls: this.controls?.element ?? null,
    };
  }

  // === Public API: Video Playback ===

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
    const duration = this.getDuration();
    const clamped = Math.max(0, Math.min(time, duration || Infinity));
    this.player.seek(clamped);
    this.renderLoopManager.onTimeUpdate(clamped);
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

  getVideoElement(): HTMLVideoElement | null {
    return this.player.getVideoElement();
  }

  // === Public API: Hotspot Management (delegated) ===

  open(id: string): void { this.hotspotManager.open(id); }
  close(id: string): void { this.hotspotManager.close(id); }
  closeAll(): void { this.hotspotManager.closeAll(); }

  addHotspot(hotspot: VideoHotspotItem): void {
    this.hotspotManager.addHotspot(hotspot);
    this.navigationManager.invalidateSortedCache();
  }

  removeHotspot(id: string): void {
    this.hotspotManager.removeHotspot(id);
    this.navigationManager.invalidateSortedCache();
  }

  updateHotspot(id: string, updates: Partial<VideoHotspotItem>): void {
    this.hotspotManager.updateHotspot(id, updates);
  }

  getVisibleHotspots(): string[] { return this.hotspotManager.getVisibleHotspots(); }
  getHotspots(): VideoHotspotItem[] { return this.hotspotManager.getHotspots(); }

  // === Public API: Navigation (delegated) ===

  nextHotspot(): void { this.navigationManager.nextHotspot(); }
  prevHotspot(): void { this.navigationManager.prevHotspot(); }
  goToHotspot(id: string): void { this.navigationManager.goToHotspot(id); }
  goToChapter(id: string): void { this.navigationManager.goToChapter(id); }
  getCurrentChapter(): string | undefined { return this.navigationManager.getCurrentChapter(); }

  // === Public API: Fullscreen ===

  enterFullscreen(): void { this.fullscreenControl?.enter(); }
  exitFullscreen(): void { this.fullscreenControl?.exit(); }
  isFullscreen(): boolean { return this.fullscreenControl?.isFullscreen() ?? false; }

  // === Public API: Lifecycle ===

  update(config: Partial<CIVideoHotspotConfig>): void {
    const srcChanged = config.src !== undefined && config.src !== this.config.src;

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
      this.videoWrapperEl.insertBefore(this.player.element, this.markersEl);
      if (this.config.chapters) {
        this.navigationManager?.setResolvedChapters(
          resolveChapterEndTimes(this.config.chapters, this.player.getDuration()),
        );
      }
    }

    this.initManagers();
    this.initControls();
    this.initHotspotNav();
    this.initFullscreen();
    this.initKeyboard();
    this.initContainerEvents();

    if (!srcChanged) {
      this.renderLoopManager.onTimeUpdate(currentTime);
      this.controls?.update();
      if (!wasPaused) {
        this.renderLoopManager.startRenderLoop();
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
    this.renderLoopManager?.destroy();
    this.navigationManager?.destroy();
    this.hotspotManager?.destroy();

    this.resizeObserver?.disconnect();
    this.resizeObserver = null;

    // Global cleanups
    this.cleanups.forEach((fn) => fn());
    this.cleanups = [];

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

    this.timeline?.reset();
    releaseLiveRegion();
  }
}
