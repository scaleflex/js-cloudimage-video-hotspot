import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createCountdown } from '../src/popover/components/countdown';

describe('createCountdown', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns null for undefined date', () => {
    expect(createCountdown(undefined, undefined, null, [])).toBeNull();
  });

  it('returns null for invalid date string', () => {
    expect(createCountdown('not-a-date', undefined, null, [])).toBeNull();
  });

  it('renders countdown timer', () => {
    const future = new Date(Date.now() + 90061000); // 1d 1h 1m 1s
    const cleanups: (() => void)[] = [];
    const result = createCountdown(future.toISOString(), undefined, null, cleanups);

    expect(result).not.toBeNull();
    const timer = result!.element.querySelector('.ci-video-hotspot-countdown-timer');
    expect(timer).not.toBeNull();
    expect(timer!.textContent).toContain('d');
    expect(timer!.textContent).toContain('h');
  });

  it('shows label when provided', () => {
    const future = new Date(Date.now() + 60000);
    const result = createCountdown(future.toISOString(), 'Sale ends in', null, []);
    const label = result!.element.querySelector('.ci-video-hotspot-countdown-label');
    expect(label).not.toBeNull();
    expect(label!.textContent).toBe('Sale ends in');
  });

  it('updates every second', () => {
    const future = new Date(Date.now() + 5000); // 5 seconds
    const cleanups: (() => void)[] = [];
    const result = createCountdown(future, undefined, null, cleanups);

    const timer = result!.element.querySelector('.ci-video-hotspot-countdown-timer');
    const initial = timer!.textContent;

    vi.advanceTimersByTime(1000);
    expect(timer!.textContent).not.toBe(initial);
  });

  it('shows expired state when time runs out', () => {
    const future = new Date(Date.now() + 2000);
    const cleanups: (() => void)[] = [];
    const result = createCountdown(future, undefined, null, cleanups);

    vi.advanceTimersByTime(3000);

    expect(result!.isExpired()).toBe(true);
    const timer = result!.element.querySelector('.ci-video-hotspot-countdown-timer');
    expect(timer!.textContent).toBe('Expired');
    expect(result!.element.classList.contains('ci-video-hotspot-countdown--expired')).toBe(true);
  });

  it('disables CTA button on expiry', () => {
    const future = new Date(Date.now() + 1000);
    const btn = document.createElement('button');
    const cleanups: (() => void)[] = [];

    createCountdown(future, undefined, btn, cleanups);
    expect(btn.disabled).toBe(false);

    vi.advanceTimersByTime(2000);
    expect(btn.disabled).toBe(true);
  });

  it('pushes cleanup to array', () => {
    const future = new Date(Date.now() + 60000);
    const cleanups: (() => void)[] = [];
    createCountdown(future, undefined, null, cleanups);
    expect(cleanups.length).toBeGreaterThan(0);
  });

  it('cleanup clears interval', () => {
    const future = new Date(Date.now() + 60000);
    const cleanups: (() => void)[] = [];
    const result = createCountdown(future, undefined, null, cleanups);

    const timer = result!.element.querySelector('.ci-video-hotspot-countdown-timer');
    cleanups.forEach((fn) => fn());

    const textBefore = timer!.textContent;
    vi.advanceTimersByTime(2000);
    expect(timer!.textContent).toBe(textBefore);
  });

  it('accepts Date object directly', () => {
    const future = new Date(Date.now() + 3600000);
    const result = createCountdown(future, undefined, null, []);
    expect(result).not.toBeNull();
  });
});
