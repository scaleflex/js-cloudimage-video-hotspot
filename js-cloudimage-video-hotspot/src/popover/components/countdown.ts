export interface CountdownResult {
  element: HTMLElement;
  /** Returns true if the countdown has expired */
  isExpired(): boolean;
}

/** Create a live countdown timer. Returns null if no countdown date. */
export function createCountdown(
  endDate: string | Date | undefined,
  label: string | undefined,
  ctaEl: HTMLElement | null,
  cleanups: (() => void)[],
): CountdownResult | null {
  if (endDate == null) return null;

  const target = endDate instanceof Date ? endDate : new Date(endDate);
  if (isNaN(target.getTime())) return null;

  let expired = false;

  const container = document.createElement('div');
  container.className = 'ci-video-hotspot-countdown';

  if (label) {
    const labelEl = document.createElement('span');
    labelEl.className = 'ci-video-hotspot-countdown-label';
    labelEl.textContent = label;
    container.appendChild(labelEl);
  }

  const timerEl = document.createElement('span');
  timerEl.className = 'ci-video-hotspot-countdown-timer';
  container.appendChild(timerEl);

  function update(): void {
    const now = Date.now();
    const diff = target.getTime() - now;

    if (diff <= 0) {
      expired = true;
      timerEl.textContent = 'Expired';
      container.classList.add('ci-video-hotspot-countdown--expired');
      if (ctaEl instanceof HTMLButtonElement) {
        ctaEl.disabled = true;
      }
      clearInterval(intervalId);
      return;
    }

    const totalSeconds = Math.floor(diff / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const parts: string[] = [];
    if (days > 0) parts.push(`${days}d`);
    parts.push(`${hours}h`);
    parts.push(`${minutes}m`);
    parts.push(`${seconds}s`);

    timerEl.textContent = parts.join(' ');
  }

  update();
  const intervalId = setInterval(update, 1000);
  cleanups.push(() => clearInterval(intervalId));

  return {
    element: container,
    isExpired: () => expired,
  };
}
