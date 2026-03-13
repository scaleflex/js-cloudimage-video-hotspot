import type { CIVideoHotspotConfig, ResolvedConfig, VideoChapter } from './types';

/** Default configuration values */
const DEFAULTS: Partial<CIVideoHotspotConfig> = {
  trigger: 'click',
  placement: 'top',
  pauseOnInteract: true,
  autoplay: false,
  loop: false,
  muted: false,
  theme: 'light',
  pulse: true,
  hotspotAnimation: 'fade',
  timelineIndicators: 'dot',
  controls: true,
  fullscreenButton: true,
  hotspotNavigation: true,
  chapterNavigation: true,
  playerType: 'auto',
};

/** Merge user config with defaults, deep-merging known nested objects */
export function mergeConfig(config: CIVideoHotspotConfig): ResolvedConfig {
  const merged = { ...DEFAULTS, ...config } as ResolvedConfig;

  // Deep merge known nested objects
  if (DEFAULTS.hls || config.hls) {
    merged.hls = { ...(DEFAULTS.hls || {}), ...(config.hls || {}) };
  }

  // Auto-mute if autoplay
  if (merged.autoplay && config.muted === undefined) {
    merged.muted = true;
  }

  return merged;
}

/** Validate required fields */
export function validateConfig(config: CIVideoHotspotConfig): void {
  if (!config.src) {
    throw new Error('CIVideoHotspot: "src" is required');
  }
  if (!config.hotspots || !Array.isArray(config.hotspots)) {
    throw new Error('CIVideoHotspot: "hotspots" array is required');
  }
  for (const h of config.hotspots) {
    if (!h.id) throw new Error('CIVideoHotspot: each hotspot must have an "id"');
    if (h.startTime === undefined || h.endTime === undefined) {
      throw new Error(`CIVideoHotspot: hotspot "${h.id}" must have "startTime" and "endTime"`);
    }
    if (!h.label) throw new Error(`CIVideoHotspot: hotspot "${h.id}" must have a "label" for accessibility`);
  }
}

/** Data attribute mapping for auto-init */
const DATA_ATTR_MAP: Record<string, { key: keyof CIVideoHotspotConfig; type: 'string' | 'boolean' | 'number' | 'json' }> = {
  'data-ci-video-hotspot-src': { key: 'src', type: 'string' },
  'data-ci-video-hotspot-poster': { key: 'poster', type: 'string' },
  'data-ci-video-hotspot-alt': { key: 'alt', type: 'string' },
  'data-ci-video-hotspot-items': { key: 'hotspots', type: 'json' },
  'data-ci-video-hotspot-chapters': { key: 'chapters', type: 'json' },
  'data-ci-video-hotspot-trigger': { key: 'trigger', type: 'string' },
  'data-ci-video-hotspot-placement': { key: 'placement', type: 'string' },
  'data-ci-video-hotspot-theme': { key: 'theme', type: 'string' },
  'data-ci-video-hotspot-autoplay': { key: 'autoplay', type: 'boolean' },
  'data-ci-video-hotspot-loop': { key: 'loop', type: 'boolean' },
  'data-ci-video-hotspot-muted': { key: 'muted', type: 'boolean' },
  'data-ci-video-hotspot-controls': { key: 'controls', type: 'boolean' },
  'data-ci-video-hotspot-fullscreen': { key: 'fullscreenButton', type: 'boolean' },
  'data-ci-video-hotspot-hotspot-nav': { key: 'hotspotNavigation', type: 'boolean' },
  'data-ci-video-hotspot-pause-on-interact': { key: 'pauseOnInteract', type: 'boolean' },
  'data-ci-video-hotspot-timeline-indicators': { key: 'timelineIndicators', type: 'string' },
  'data-ci-video-hotspot-animation': { key: 'hotspotAnimation', type: 'string' },
};

/** Parse data-attributes from an element into a config object */
export function parseDataAttributes(el: HTMLElement): Partial<CIVideoHotspotConfig> {
  const config: Record<string, unknown> = {};

  for (const [attr, mapping] of Object.entries(DATA_ATTR_MAP)) {
    const value = el.getAttribute(attr);
    if (value === null) continue;

    switch (mapping.type) {
      case 'string':
        config[mapping.key] = value;
        break;
      case 'boolean':
        config[mapping.key] = value === '' || value === 'true';
        break;
      case 'number':
        config[mapping.key] = parseFloat(value);
        break;
      case 'json':
        try {
          config[mapping.key] = JSON.parse(value);
        } catch {
          console.warn(`CIVideoHotspot: invalid JSON in "${attr}"`);
        }
        break;
    }
  }

  return config as Partial<CIVideoHotspotConfig>;
}

/** Resolve chapter endTimes based on next chapter start or video duration */
export function resolveChapterEndTimes(chapters: VideoChapter[], videoDuration: number): VideoChapter[] {
  const sorted = [...chapters].sort((a, b) => a.startTime - b.startTime);
  return sorted.map((ch, i) => ({
    ...ch,
    endTime: ch.endTime ?? (i < sorted.length - 1 ? sorted[i + 1].startTime : videoDuration),
  }));
}
