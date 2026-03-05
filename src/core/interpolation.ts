import type { Point, EasingFunction, InterpolationMode } from './types';

/** Easing functions for keyframe interpolation */
const EASING_FUNCTIONS: Record<EasingFunction, (t: number) => number> = {
  'linear': (t) => t,
  'ease-in': (t) => t * t,
  'ease-out': (t) => t * (2 - t),
  'ease-in-out': (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
};

type KeyframePoint = { time: number; x: number; y: number };

/**
 * Interpolate position between keyframes at a given time.
 * Supports linear and Catmull-Rom interpolation modes.
 */
export function interpolatePosition(
  keyframes: KeyframePoint[],
  currentTime: number,
  easing: EasingFunction = 'linear',
  mode: InterpolationMode = 'linear',
): Point {
  if (keyframes.length === 0) return { x: 0, y: 0 };
  if (keyframes.length === 1) return { x: keyframes[0].x, y: keyframes[0].y };

  // Before first keyframe
  if (currentTime <= keyframes[0].time) {
    return { x: keyframes[0].x, y: keyframes[0].y };
  }

  // After last keyframe
  const last = keyframes[keyframes.length - 1];
  if (currentTime >= last.time) {
    return { x: last.x, y: last.y };
  }

  // Binary search for the bracketing keyframes
  let lo = 0;
  let hi = keyframes.length - 1;
  while (lo < hi - 1) {
    const mid = (lo + hi) >> 1;
    if (keyframes[mid].time <= currentTime) {
      lo = mid;
    } else {
      hi = mid;
    }
  }

  const kfA = keyframes[lo];
  const kfB = keyframes[hi];
  const duration = kfB.time - kfA.time;
  if (duration <= 0) return { x: kfA.x, y: kfA.y };

  const rawT = (currentTime - kfA.time) / duration;
  const t = EASING_FUNCTIONS[easing](rawT);

  // Use Catmull-Rom for 3+ keyframes, fallback to linear for 2
  if (mode === 'catmull-rom' && keyframes.length >= 3) {
    return catmullRomSegment(keyframes, lo, hi, t);
  }

  return {
    x: kfA.x + (kfB.x - kfA.x) * t,
    y: kfA.y + (kfB.y - kfA.y) * t,
  };
}

/**
 * Centripetal Catmull-Rom spline interpolation for a segment.
 * Uses 4 control points: p0, p1, p2, p3 where the segment is between p1 and p2.
 * Phantom points are generated at boundaries by reflection.
 */
function catmullRomSegment(
  keyframes: KeyframePoint[],
  loIdx: number,
  hiIdx: number,
  t: number,
): Point {
  const p1 = keyframes[loIdx];
  const p2 = keyframes[hiIdx];

  // Get neighboring control points, with phantom reflection at boundaries
  const p0 = loIdx > 0
    ? keyframes[loIdx - 1]
    : { x: 2 * p1.x - p2.x, y: 2 * p1.y - p2.y, time: 2 * p1.time - p2.time };

  const p3 = hiIdx < keyframes.length - 1
    ? keyframes[hiIdx + 1]
    : { x: 2 * p2.x - p1.x, y: 2 * p2.y - p1.y, time: 2 * p2.time - p1.time };

  // Standard Catmull-Rom matrix multiplication (uniform parameterization, alpha=0.5)
  // f(t) = 0.5 * ((2*P1) + (-P0 + P2)*t + (2*P0 - 5*P1 + 4*P2 - P3)*t^2 + (-P0 + 3*P1 - 3*P2 + P3)*t^3)
  const t2 = t * t;
  const t3 = t2 * t;

  const x = 0.5 * (
    (2 * p1.x) +
    (-p0.x + p2.x) * t +
    (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
    (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3
  );

  const y = 0.5 * (
    (2 * p1.y) +
    (-p0.y + p2.y) * t +
    (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
    (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3
  );

  return { x, y };
}
