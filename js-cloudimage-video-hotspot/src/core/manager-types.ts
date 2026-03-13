import type {
  ResolvedConfig,
  NormalizedVideoHotspot,
  VideoHotspotItem,
  VideoChapter,
  Placement,
  TriggerMode,
} from './types';
import type { AnalyticsEmit } from './analytics';
import type { TimelineEngine } from './timeline';
import type { VideoPlayer } from '../player/video-player';
import type { Controls } from '../player/controls';
import type { HotspotNav } from '../hotspot-nav/hotspot-nav';

/** Shared context passed to all managers */
export interface ManagerContext {
  config: ResolvedConfig;
  player: VideoPlayer;
  timeline: TimelineEngine;
  containerEl: HTMLElement;
  overlayEl: HTMLElement;
  markersEl: HTMLElement;
  emitAnalytics: AnalyticsEmit;
  isDestroyed: () => boolean;
  getControls: () => Controls | null;
  getHotspotNav: () => HotspotNav | null;
}

/** Manages hotspot visibility, markers, popovers, and CRUD */
export interface HotspotManagerInterface {
  showHotspot(hotspot: NormalizedVideoHotspot): void;
  hideHotspot(hotspot: NormalizedVideoHotspot): void;
  handleHotspotInteract(hotspotId: string): void;
  handleHotspotInteractEnd(hotspotId: string): void;
  open(id: string): void;
  close(id: string): void;
  closeAll(): void;
  setWasPlayingBeforePause(value: boolean): void;
  addHotspot(hotspot: VideoHotspotItem): void;
  removeHotspot(id: string): void;
  updateHotspot(id: string, updates: Partial<VideoHotspotItem>): void;
  getVisibleHotspots(): string[];
  getHotspots(): VideoHotspotItem[];
  getOpenPopovers(): ReadonlySet<string>;
  destroy(): void;
}

/** Manages navigation between hotspots and chapters */
export interface NavigationManagerInterface {
  nextHotspot(): void;
  prevHotspot(): void;
  goToHotspot(id: string): void;
  goToChapter(id: string): void;
  getCurrentChapter(): string | undefined;
  updateCurrentChapter(currentTime: number): void;
  updateNavCounter(): void;
  setResolvedChapters(chapters: VideoChapter[]): void;
  getResolvedChapters(): VideoChapter[];
  invalidateSortedCache(): void;
  destroy(): void;
}

/** Manages the requestAnimationFrame render loop */
export interface RenderLoopManagerInterface {
  onTimeUpdate(currentTime: number): void;
  startRenderLoop(): void;
  stopRenderLoop(): void;
  destroy(): void;
}
