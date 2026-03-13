import { useRef, useEffect } from 'react';
import type { CIVideoHotspotInstance } from '../core/types';
import type { UseCIVideoHotspotOptions, UseCIVideoHotspotReturn } from './types';
import { CIVideoHotspot } from '../core/ci-video-hotspot';

/** React hook for creating a CIVideoHotspot instance */
export function useCIVideoHotspot(options: UseCIVideoHotspotOptions): UseCIVideoHotspotReturn {
  const containerRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<CIVideoHotspotInstance | null>(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    if (!containerRef.current) return;

    const instance = new CIVideoHotspot(containerRef.current, optionsRef.current);
    instanceRef.current = instance;

    return () => {
      instance.destroy();
      instanceRef.current = null;
    };
  // Re-create on src change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.src]);

  // Update instance when non-src config changes (hotspots, chapters, trigger, etc.)
  useEffect(() => {
    const instance = instanceRef.current;
    if (!instance) return;

    // Skip on initial mount — the constructor already used these values
    const { src: _src, ...updateableOptions } = optionsRef.current;
    instance.update(updateableOptions);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    options.hotspots,
    options.chapters,
    options.trigger,
    options.placement,
    options.theme,
    options.controls,
    options.hotspotNavigation,
    options.fullscreenButton,
    options.pauseOnInteract,
    options.hotspotAnimation,
    options.timelineIndicators,
  ]);

  return {
    containerRef,
    instance: instanceRef,
  };
}
