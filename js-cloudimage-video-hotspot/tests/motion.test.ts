import { describe, it, expect } from 'vitest';
import { interpolatePosition } from '../src/markers/motion';

describe('interpolatePosition', () => {
  const keyframes = [
    { time: 0, x: 0, y: 0 },
    { time: 10, x: 100, y: 50 },
    { time: 20, x: 50, y: 100 },
  ];

  it('returns first keyframe position before start', () => {
    const pos = interpolatePosition(keyframes, -5, 'linear');
    expect(pos.x).toBe(0);
    expect(pos.y).toBe(0);
  });

  it('returns last keyframe position after end', () => {
    const pos = interpolatePosition(keyframes, 25, 'linear');
    expect(pos.x).toBe(50);
    expect(pos.y).toBe(100);
  });

  it('interpolates linearly between keyframes', () => {
    const pos = interpolatePosition(keyframes, 5, 'linear');
    expect(pos.x).toBeCloseTo(50);
    expect(pos.y).toBeCloseTo(25);
  });

  it('interpolates in second segment', () => {
    const pos = interpolatePosition(keyframes, 15, 'linear');
    expect(pos.x).toBeCloseTo(75);
    expect(pos.y).toBeCloseTo(75);
  });

  it('returns exact keyframe position at keyframe time', () => {
    const pos = interpolatePosition(keyframes, 10, 'linear');
    expect(pos.x).toBeCloseTo(100);
    expect(pos.y).toBeCloseTo(50);
  });

  it('handles single keyframe', () => {
    const pos = interpolatePosition([{ time: 5, x: 42, y: 77 }], 5, 'linear');
    expect(pos.x).toBe(42);
    expect(pos.y).toBe(77);
  });

  it('handles empty keyframes', () => {
    const pos = interpolatePosition([], 5, 'linear');
    expect(pos.x).toBe(0);
    expect(pos.y).toBe(0);
  });

  it('applies ease-in easing', () => {
    const kf = [
      { time: 0, x: 0, y: 0 },
      { time: 10, x: 100, y: 100 },
    ];
    const pos = interpolatePosition(kf, 5, 'ease-in');
    // ease-in: t^2 = 0.5^2 = 0.25
    expect(pos.x).toBeCloseTo(25);
    expect(pos.y).toBeCloseTo(25);
  });

  it('applies ease-out easing', () => {
    const kf = [
      { time: 0, x: 0, y: 0 },
      { time: 10, x: 100, y: 100 },
    ];
    const pos = interpolatePosition(kf, 5, 'ease-out');
    // ease-out: t*(2-t) = 0.5*(2-0.5) = 0.75
    expect(pos.x).toBeCloseTo(75);
    expect(pos.y).toBeCloseTo(75);
  });

  it('applies ease-in-out easing', () => {
    const kf = [
      { time: 0, x: 0, y: 0 },
      { time: 10, x: 100, y: 100 },
    ];
    // At t=0.5 (midpoint), ease-in-out should be 0.5
    const pos = interpolatePosition(kf, 5, 'ease-in-out');
    expect(pos.x).toBeCloseTo(50);
    expect(pos.y).toBeCloseTo(50);
  });
});
