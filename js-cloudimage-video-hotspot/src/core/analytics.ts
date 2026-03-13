import type { AnalyticsEvent, AnalyticsEventType } from './types';

export type AnalyticsEmit = (type: AnalyticsEventType, hotspotId: string, data?: Record<string, unknown>) => void;

const noop: AnalyticsEmit = () => {};

export function createAnalyticsEmitter(
  callback: ((event: AnalyticsEvent) => void) | undefined,
  getVideoTime: () => number,
): AnalyticsEmit {
  if (!callback) return noop;

  return (type, hotspotId, data) => {
    const event: AnalyticsEvent = {
      type,
      hotspotId,
      timestamp: Date.now(),
      videoTime: getVideoTime(),
    };
    if (data) event.data = data;
    callback(event);
  };
}
