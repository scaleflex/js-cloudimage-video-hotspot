import type { VideoChapter } from './types';
import type { ManagerContext, NavigationManagerInterface } from './manager-types';
import type { HotspotManager } from './hotspot-manager';
import { SEEK_SETTLE_MS } from './constants';
import { announceToScreenReader } from '../a11y/aria';

export class NavigationManager implements NavigationManagerInterface {
  private resolvedChapters: VideoChapter[] = [];
  private currentChapterId: string | undefined;
  private activeTimers = new Set<ReturnType<typeof setTimeout>>();
  /** Cached sorted hotspots for nav counter — invalidated on add/remove */
  private sortedHotspotsCache: { id: string; startTime: number }[] | null = null;

  constructor(
    private ctx: ManagerContext,
    private hotspotManager: HotspotManager,
  ) {}

  nextHotspot(): void {
    const next = this.ctx.timeline.findNextHotspot(this.ctx.player.getCurrentTime());
    if (next) {
      this.seekAndOpen(next.startTime, next.id);
    }
  }

  prevHotspot(): void {
    const prev = this.ctx.timeline.findPrevHotspot(this.ctx.player.getCurrentTime());
    if (prev) {
      this.seekAndOpen(prev.startTime, prev.id);
    }
  }

  goToHotspot(id: string): void {
    const hotspots = this.hotspotManager.getNormalizedHotspots();
    const hotspot = hotspots.get(id);
    if (!hotspot) return;
    this.seekAndOpen(hotspot.startTime, id);
  }

  private seekAndOpen(startTime: number, id: string): void {
    // Cancel pending open timers (prevent stale opens from rapid clicks)
    for (const timer of this.activeTimers) {
      clearTimeout(timer);
    }
    this.activeTimers.clear();

    // Close any currently open cards
    this.hotspotManager.closeAll();

    const duration = this.ctx.player.getDuration();
    const clampedTime = Math.max(0, Math.min(startTime, duration));

    // Track play state before pausing so resume-on-close works
    this.hotspotManager.setWasPlayingBeforePause(!this.ctx.player.isPaused());

    this.ctx.player.seek(clampedTime);
    this.ctx.player.pause();

    // Force timeline update so markers are created at the seeked time
    this.hotspotManager.processTimeUpdate(clampedTime);

    // Open after a brief settle to let the seek complete visually
    const timer = setTimeout(() => {
      this.activeTimers.delete(timer);
      this.hotspotManager.open(id);
    }, SEEK_SETTLE_MS);
    this.activeTimers.add(timer);
  }

  goToChapter(id: string): void {
    const chapter = this.resolvedChapters.find((ch) => ch.id === id)
      || this.ctx.config.chapters?.find((ch) => ch.id === id);
    if (chapter) {
      const duration = this.ctx.player.getDuration();
      const clampedTime = Math.max(0, Math.min(chapter.startTime, duration));
      this.ctx.player.seek(clampedTime);
    }
  }

  getCurrentChapter(): string | undefined {
    return this.currentChapterId;
  }

  updateCurrentChapter(currentTime: number): void {
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
        this.ctx.config.onChapterChange?.(activeChapter);
        announceToScreenReader(`Chapter: ${activeChapter.title}`);
      }
      this.ctx.getControls()?.setActiveChapter(newChapterId);
    }
  }

  updateNavCounter(): void {
    const hotspotNav = this.ctx.getHotspotNav();
    if (!hotspotNav) return;

    if (!this.sortedHotspotsCache) {
      this.sortedHotspotsCache = [...this.ctx.config.hotspots]
        .sort((a, b) => a.startTime - b.startTime)
        .map((h) => ({ id: h.id, startTime: h.startTime }));
    }

    const currentTime = this.ctx.player.getCurrentTime();
    let currentIndex = 0;
    for (let i = 0; i < this.sortedHotspotsCache.length; i++) {
      if (currentTime >= this.sortedHotspotsCache[i].startTime) {
        currentIndex = i + 1;
      }
    }
    hotspotNav.updateCounter(currentIndex, this.sortedHotspotsCache.length);
  }

  setResolvedChapters(chapters: VideoChapter[]): void {
    this.resolvedChapters = chapters;
  }

  getResolvedChapters(): VideoChapter[] {
    return this.resolvedChapters;
  }

  invalidateSortedCache(): void {
    this.sortedHotspotsCache = null;
  }

  destroy(): void {
    for (const timer of this.activeTimers) {
      clearTimeout(timer);
    }
    this.activeTimers.clear();
  }
}
