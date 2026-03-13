import { describe, it, expect } from 'vitest';
import { TimelineEngine } from '../src/core/timeline';
import type { NormalizedVideoHotspot } from '../src/core/types';

function makeHotspot(overrides: Partial<NormalizedVideoHotspot> = {}): NormalizedVideoHotspot {
  return {
    id: 'h1',
    x: 50,
    y: 50,
    startTime: 5,
    endTime: 15,
    label: 'Test',
    ...overrides,
  };
}

describe('TimelineEngine', () => {
  it('detects entered hotspots', () => {
    const engine = new TimelineEngine([makeHotspot()]);
    const result = engine.update(7);
    expect(result.entered).toHaveLength(1);
    expect(result.entered[0].id).toBe('h1');
    expect(result.active).toHaveLength(1);
  });

  it('detects exited hotspots', () => {
    const engine = new TimelineEngine([makeHotspot()]);
    engine.update(7); // enter
    const result = engine.update(20); // exit
    expect(result.exited).toHaveLength(1);
    expect(result.exited[0].id).toBe('h1');
    expect(result.active).toHaveLength(0);
  });

  it('does not re-enter already active hotspots', () => {
    const engine = new TimelineEngine([makeHotspot()]);
    engine.update(7);
    const result = engine.update(10);
    expect(result.entered).toHaveLength(0);
    expect(result.active).toHaveLength(1);
  });

  it('handles multiple hotspots', () => {
    const engine = new TimelineEngine([
      makeHotspot({ id: 'a', startTime: 0, endTime: 10 }),
      makeHotspot({ id: 'b', startTime: 5, endTime: 20 }),
      makeHotspot({ id: 'c', startTime: 15, endTime: 30 }),
    ]);

    let result = engine.update(7);
    expect(result.active.map(h => h.id)).toEqual(['a', 'b']);

    result = engine.update(12);
    expect(result.exited.map(h => h.id)).toEqual(['a']);
    expect(result.active.map(h => h.id)).toEqual(['b']);

    result = engine.update(17);
    expect(result.entered.map(h => h.id)).toEqual(['c']);
    expect(result.active.map(h => h.id)).toEqual(['b', 'c']);
  });

  it('returns no changes when time does not cross boundaries', () => {
    const engine = new TimelineEngine([makeHotspot({ startTime: 5, endTime: 15 })]);
    engine.update(7);
    const result = engine.update(8);
    expect(result.entered).toHaveLength(0);
    expect(result.exited).toHaveLength(0);
    expect(result.active).toHaveLength(1);
  });

  it('findNextHotspot returns the correct hotspot', () => {
    const engine = new TimelineEngine([
      makeHotspot({ id: 'a', startTime: 5, endTime: 10 }),
      makeHotspot({ id: 'b', startTime: 15, endTime: 20 }),
      makeHotspot({ id: 'c', startTime: 25, endTime: 30 }),
    ]);
    expect(engine.findNextHotspot(3)?.id).toBe('a');
    expect(engine.findNextHotspot(7)?.id).toBe('b');
    expect(engine.findNextHotspot(20)?.id).toBe('c');
    expect(engine.findNextHotspot(30)).toBeNull();
  });

  it('findPrevHotspot returns the correct hotspot', () => {
    const engine = new TimelineEngine([
      makeHotspot({ id: 'a', startTime: 5, endTime: 10 }),
      makeHotspot({ id: 'b', startTime: 15, endTime: 20 }),
    ]);
    expect(engine.findPrevHotspot(20)?.id).toBe('b');
    expect(engine.findPrevHotspot(12)?.id).toBe('a');
    expect(engine.findPrevHotspot(3)).toBeNull();
  });

  it('getTimeRanges returns all ranges', () => {
    const engine = new TimelineEngine([
      makeHotspot({ id: 'a', startTime: 0, endTime: 10 }),
      makeHotspot({ id: 'b', startTime: 20, endTime: 30 }),
    ]);
    const ranges = engine.getTimeRanges();
    expect(ranges).toHaveLength(2);
    expect(ranges[0].id).toBe('a');
    expect(ranges[1].startTime).toBe(20);
  });

  it('interpolates keyframe position', () => {
    const engine = new TimelineEngine([
      makeHotspot({
        id: 'k1',
        startTime: 0,
        endTime: 10,
        keyframes: [
          { time: 0, x: 0, y: 0 },
          { time: 10, x: 100, y: 100 },
        ],
        easing: 'linear',
      }),
    ]);
    engine.update(5);
    const pos = engine.getPosition('k1', 5);
    expect(pos).not.toBeNull();
    expect(pos!.x).toBeCloseTo(50);
    expect(pos!.y).toBeCloseTo(50);
  });

  it('returns null for hotspot without keyframes', () => {
    const engine = new TimelineEngine([makeHotspot({ id: 'nk' })]);
    expect(engine.getPosition('nk', 7)).toBeNull();
  });

  it('reset clears active state', () => {
    const engine = new TimelineEngine([makeHotspot()]);
    engine.update(7);
    expect(engine.getActiveIds()).toHaveLength(1);
    engine.reset();
    expect(engine.getActiveIds()).toHaveLength(0);
  });
});
