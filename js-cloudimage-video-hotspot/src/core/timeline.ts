import type { NormalizedVideoHotspot, Point } from './types';
import { interpolatePosition } from './interpolation';

export interface TimelineUpdateResult {
  entered: NormalizedVideoHotspot[];
  exited: NormalizedVideoHotspot[];
  active: NormalizedVideoHotspot[];
}

/**
 * Time-based visibility engine.
 * Efficiently determines which hotspots are visible at a given timestamp
 * using sorted arrays for O(log n) lookups.
 */
export class TimelineEngine {
  private hotspots: NormalizedVideoHotspot[];
  private sortedByStart: NormalizedVideoHotspot[];
  private activeSet = new Set<string>();
  private hotspotsById = new Map<string, NormalizedVideoHotspot>();

  constructor(hotspots: NormalizedVideoHotspot[]) {
    this.hotspots = hotspots;
    this.sortedByStart = [...hotspots].sort((a, b) => a.startTime - b.startTime);
    for (const h of hotspots) {
      this.hotspotsById.set(h.id, h);
    }
  }

  /** Update with new hotspot list */
  setHotspots(hotspots: NormalizedVideoHotspot[]): void {
    this.hotspots = hotspots;
    this.sortedByStart = [...hotspots].sort((a, b) => a.startTime - b.startTime);
    this.hotspotsById.clear();
    for (const h of hotspots) {
      this.hotspotsById.set(h.id, h);
    }
  }

  /**
   * Called on every timeupdate or requestAnimationFrame.
   * Returns the set of hotspots that changed state (entered or exited).
   */
  update(currentTime: number): TimelineUpdateResult {
    const entered: NormalizedVideoHotspot[] = [];
    const exited: NormalizedVideoHotspot[] = [];
    const active: NormalizedVideoHotspot[] = [];

    const nowActive = new Set<string>();

    for (const hotspot of this.hotspots) {
      const isVisible = currentTime >= hotspot.startTime && currentTime <= hotspot.endTime;
      if (isVisible) {
        nowActive.add(hotspot.id);
        active.push(hotspot);

        if (!this.activeSet.has(hotspot.id)) {
          entered.push(hotspot);
        }
      }
    }

    // Find exited hotspots
    for (const id of this.activeSet) {
      if (!nowActive.has(id)) {
        const hotspot = this.hotspotsById.get(id);
        if (hotspot) exited.push(hotspot);
      }
    }

    this.activeSet = nowActive;

    return { entered, exited, active };
  }

  /** Get interpolated position for a hotspot with keyframes at a given time */
  getPosition(hotspotId: string, time: number): Point | null {
    const hotspot = this.hotspotsById.get(hotspotId);
    if (!hotspot || !hotspot.keyframes || hotspot.keyframes.length === 0) return null;

    return interpolatePosition(hotspot.keyframes, time, hotspot.easing || 'linear', hotspot.interpolation || 'linear');
  }

  /** Find next hotspot start time after the given time */
  findNextHotspot(afterTime: number): NormalizedVideoHotspot | null {
    for (const hotspot of this.sortedByStart) {
      if (hotspot.startTime > afterTime + 0.1) {
        return hotspot;
      }
    }
    return null;
  }

  /** Find previous hotspot (starts before the given time) */
  findPrevHotspot(beforeTime: number): NormalizedVideoHotspot | null {
    let candidate: NormalizedVideoHotspot | null = null;
    for (const hotspot of this.sortedByStart) {
      if (hotspot.startTime < beforeTime - 0.1) {
        candidate = hotspot;
      } else {
        break;
      }
    }
    return candidate;
  }

  /** Get all hotspot time ranges for timeline indicator rendering */
  getTimeRanges(): Array<{ id: string; startTime: number; endTime: number; label: string }> {
    return this.hotspots.map((h) => ({
      id: h.id,
      startTime: h.startTime,
      endTime: h.endTime,
      label: h.label,
    }));
  }

  /** Check if any active hotspot has keyframes (needs RAF) */
  hasActiveKeyframes(): boolean {
    for (const id of this.activeSet) {
      const hotspot = this.hotspotsById.get(id);
      if (hotspot?.keyframes && hotspot.keyframes.length > 0) return true;
    }
    return false;
  }

  /** Get active hotspot IDs */
  getActiveIds(): string[] {
    return Array.from(this.activeSet);
  }

  /** Reset active state */
  reset(): void {
    this.activeSet.clear();
  }
}

