import { describe, it, expect } from 'vitest';
import { parseCoordinate, normalizeToPercent } from '../src/utils/coordinates';

describe('parseCoordinate', () => {
  it('parses percentage string', () => {
    const result = parseCoordinate('65%');
    expect(result.value).toBe(65);
    expect(result.isPercent).toBe(true);
  });

  it('parses numeric string', () => {
    const result = parseCoordinate('42');
    expect(result.value).toBe(42);
    expect(result.isPercent).toBe(false);
  });

  it('parses number', () => {
    const result = parseCoordinate(33);
    expect(result.value).toBe(33);
    expect(result.isPercent).toBe(false);
  });

  it('handles whitespace', () => {
    const result = parseCoordinate('  75% ');
    expect(result.value).toBe(75);
    expect(result.isPercent).toBe(true);
  });
});

describe('normalizeToPercent', () => {
  it('passes through percentage values', () => {
    const result = normalizeToPercent('50%', '75%');
    expect(result.x).toBe(50);
    expect(result.y).toBe(75);
  });

  it('passes through numeric values', () => {
    const result = normalizeToPercent(30, 60);
    expect(result.x).toBe(30);
    expect(result.y).toBe(60);
  });
});
