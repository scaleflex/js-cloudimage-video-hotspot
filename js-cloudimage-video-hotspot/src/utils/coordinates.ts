import type { Point } from '../core/types';

/**
 * Parse a coordinate value.
 * - String ending in '%': return the numeric percent value
 * - Number: return as-is (treated as percentage 0-100)
 */
export function parseCoordinate(value: string | number): { value: number; isPercent: boolean } {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.endsWith('%')) {
      return { value: parseFloat(trimmed), isPercent: true };
    }
    return { value: parseFloat(trimmed), isPercent: false };
  }
  return { value, isPercent: false };
}

/**
 * Normalize x/y coordinates to percentages (0-100).
 * If already percentages, returns as-is.
 * Numbers without '%' are treated as percentage values directly.
 */
export function normalizeToPercent(
  x: string | number,
  y: string | number,
): Point {
  const px = parseCoordinate(x);
  const py = parseCoordinate(y);

  return {
    x: px.value,
    y: py.value,
  };
}
