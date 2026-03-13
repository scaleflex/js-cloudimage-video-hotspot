import { describe, it, expect } from 'vitest';
import { formatTime, parseTime } from '../src/utils/time';

describe('formatTime', () => {
  it('formats seconds under a minute', () => {
    expect(formatTime(45)).toBe('0:45');
  });

  it('formats minutes and seconds', () => {
    expect(formatTime(130)).toBe('2:10');
  });

  it('formats hours', () => {
    expect(formatTime(3661)).toBe('1:01:01');
  });

  it('pads seconds', () => {
    expect(formatTime(5)).toBe('0:05');
  });

  it('handles zero', () => {
    expect(formatTime(0)).toBe('0:00');
  });

  it('handles NaN', () => {
    expect(formatTime(NaN)).toBe('0:00');
  });

  it('handles negative', () => {
    expect(formatTime(-10)).toBe('0:00');
  });

  it('handles Infinity', () => {
    expect(formatTime(Infinity)).toBe('0:00');
  });
});

describe('parseTime', () => {
  it('parses mm:ss', () => {
    expect(parseTime('2:30')).toBe(150);
  });

  it('parses h:mm:ss', () => {
    expect(parseTime('1:01:01')).toBe(3661);
  });

  it('parses single number as seconds', () => {
    expect(parseTime('45')).toBe(45);
  });
});
