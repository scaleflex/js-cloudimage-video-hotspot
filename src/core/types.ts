/** Popover trigger mode */
export type TriggerMode = 'hover' | 'click';

/** Popover placement preference */
export type Placement = 'top' | 'bottom' | 'left' | 'right' | 'auto';

/** Theme name */
export type Theme = 'light' | 'dark';

/** Marker visual style */
export type MarkerStyle = 'dot' | 'dot-label' | 'icon' | 'numbered';

/** Hotspot entrance/exit animation */
export type HotspotAnimation = 'fade' | 'scale' | 'none';

/** Easing function for keyframe interpolation */
export type EasingFunction = 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';

/** Interpolation mode between keyframes */
export type InterpolationMode = 'linear' | 'catmull-rom';

/** Timeline indicator style for hotspots on the progress bar */
export type TimelineIndicatorStyle = 'dot' | 'range' | 'none';

/** Player engine type */
export type PlayerType = 'auto' | 'html5' | 'hls' | 'youtube' | 'vimeo';

/** HLS-specific configuration */
export interface HLSConfig {
  /** Enable Web Worker for TS demuxing (default: true) */
  enableWorker?: boolean;
  /** Initial quality level (-1 = auto) (default: -1) */
  startLevel?: number;
  /** Cap quality to player element size (default: true) */
  capLevelToPlayerSize?: boolean;
}

/** A single keyframe defining position at a specific time */
export interface Keyframe {
  /** Time in seconds when the hotspot should be at this position */
  time: number;
  /** X coordinate: percentage string ('65%') or number (0-100) */
  x: string | number;
  /** Y coordinate: percentage string ('40%') or number (0-100) */
  y: string | number;
}

/** Product variant for size/color/material selectors */
export interface ProductVariant {
  id: string;
  /** Variant type: 'size', 'color', 'material', etc. */
  type: string;
  label: string;
  /** Hex color for color swatches (e.g. '#ff0000') */
  color?: string;
  /** Price override when this variant is selected */
  price?: string;
  /** Image URL to show in gallery when this variant is selected */
  image?: string;
  /** Whether this variant is available (default: true) */
  available?: boolean;
  /** Whether this variant is initially selected */
  selected?: boolean;
}

/** Event payload for add-to-cart actions */
export interface AddToCartEvent {
  hotspot: VideoHotspotItem;
  quantity: number;
  sku?: string;
  title?: string;
  price?: string;
  selectedVariants: ProductVariant[];
}

/** Analytics event types */
export type AnalyticsEventType =
  | 'hotspot_show'
  | 'hotspot_click'
  | 'popover_open'
  | 'popover_close'
  | 'cta_click'
  | 'add_to_cart'
  | 'variant_select'
  | 'wishlist_toggle';

/** Unified analytics event emitted via onAnalytics callback */
export interface AnalyticsEvent {
  type: AnalyticsEventType;
  hotspotId: string;
  timestamp: number;
  videoTime: number;
  data?: Record<string, unknown>;
}

/** Data fields for the built-in popover template */
export interface PopoverData {
  title?: string;
  originalPrice?: string;
  price?: string;
  description?: string;
  image?: string;
  url?: string;
  ctaText?: string;
  /** Optional badge text (e.g., "NEW", "SALE", "-30%") */
  badge?: string;

  /** Multiple product images for gallery carousel */
  images?: string[];
  /** Product rating (0-5, supports half stars) */
  rating?: number;
  /** Number of reviews */
  reviewCount?: number;
  /** Product variants (size, color, material) */
  variants?: ProductVariant[];
  /** Show wishlist button */
  wishlist?: boolean;
  /** Initial wishlisted state */
  wishlisted?: boolean;
  /** Countdown end date/time (ISO string or Date) */
  countdown?: string | Date;
  /** Label displayed above the countdown timer */
  countdownLabel?: string;
  /** Currency symbol for display (e.g. '$', '€') */
  currency?: string;
  /** Secondary CTA button text and URL */
  secondaryCta?: { text: string; url?: string; onClick?: (hotspot: VideoHotspotItem) => void };
  /** Custom key-value fields displayed below description */
  customFields?: { label: string; value: string }[];
  /** Product SKU for cart events */
  sku?: string;

  /** Called when add-to-cart CTA is clicked */
  onAddToCart?: (event: AddToCartEvent) => void;
  /** Called when wishlist button is toggled */
  onWishlistToggle?: (wishlisted: boolean, hotspot: VideoHotspotItem) => void;
  /** Called when a variant is selected */
  onVariantSelect?: (variant: ProductVariant, allSelected: ProductVariant[], hotspot: VideoHotspotItem) => void;

  [key: string]: unknown;
}

/** A named chapter/segment of the video */
export interface VideoChapter {
  /** Unique chapter identifier */
  id: string;
  /** Chapter title */
  title: string;
  /** Start time in seconds */
  startTime: number;
  /** End time in seconds (defaults to next chapter's startTime or video duration) */
  endTime?: number;
  /** Optional thumbnail URL for chapter preview */
  thumbnail?: string;
}

/** Cloudimage CDN integration configuration */
export interface CloudimageConfig {
  /** Cloudimage customer token (e.g. 'demo'). Enables Cloudimage when set. */
  token: string;
  /** API version (default: 'v7') */
  apiVersion?: string;
  /** Custom Cloudimage domain (default: 'cloudimg.io') */
  domain?: string;
  /** Custom URL transformation params (e.g. 'q=80') */
  params?: string;
}

/** Individual video hotspot definition */
export interface VideoHotspotItem {
  /** Unique identifier (required) */
  id: string;
  /** X coordinate: percentage string ('65%') or number (0-100) */
  x: string | number;
  /** Y coordinate: percentage string ('40%') or number (0-100) */
  y: string | number;
  /** Time in seconds when the hotspot appears (required) */
  startTime: number;
  /** Time in seconds when the hotspot disappears (required) */
  endTime: number;
  /** Accessible label displayed as marker tooltip and used by screen readers */
  label: string;

  /** Keyframe array for animated position. Positions are interpolated between keyframes. */
  keyframes?: Keyframe[];
  /** Easing function for keyframe interpolation (default: 'linear') */
  easing?: EasingFunction;
  /** Interpolation mode: 'linear' for straight lines, 'catmull-rom' for smooth curves (default: 'linear') */
  interpolation?: InterpolationMode;

  /** Arbitrary data passed to the popover template */
  data?: PopoverData;
  /** Raw HTML content for the popover (sanitized before rendering) */
  content?: string;

  /** Marker visual style (default: 'dot') */
  markerStyle?: MarkerStyle;
  /** Custom CSS class added to this marker element */
  className?: string;
  /** Custom icon -- CSS class name, SVG string, or image URL */
  icon?: string;
  /** Entrance/exit animation for this hotspot (default: 'fade') */
  animation?: HotspotAnimation;

  /** Override global trigger for this specific hotspot */
  trigger?: TriggerMode;
  /** Override global placement for this specific hotspot's popover */
  placement?: Placement;
  /** Pause the video when this hotspot becomes visible (default: false) */
  pauseOnShow?: boolean;
  /** Pause the video when this hotspot is interacted with (default: inherits from global config) */
  pauseOnInteract?: boolean;
  /** Keep popover open until explicitly closed (default: false) */
  keepOpen?: boolean;
  /** Custom click handler */
  onClick?: (event: MouseEvent | KeyboardEvent, hotspot: VideoHotspotItem) => void;

  /** Chapter ID this hotspot belongs to (for grouping) */
  chapterId?: string;

  /** Metadata about object tracking (editor-only) */
  trackingMeta?: {
    source: 'browser' | 'import';
    algorithm: string;
    avgConfidence: number;
    region?: { x: number; y: number; width: number; height: number };
    trackedAt: string;
  };
}

/** Main library configuration */
export interface CIVideoHotspotConfig {
  /** Video source URL (required) */
  src: string;
  /** Array of alternative sources for format fallback */
  sources?: { src: string; type: string }[];
  /** Poster image URL shown before video plays */
  poster?: string;
  /** Alt text / accessible description of the video */
  alt?: string;

  /** Array of hotspot definitions (required) */
  hotspots: VideoHotspotItem[];

  /** Optional chapter definitions for timeline segmentation */
  chapters?: VideoChapter[];

  /** Popover trigger mode (default: 'click') */
  trigger?: TriggerMode;
  /** Popover placement preference (default: 'top') */
  placement?: Placement;
  /** Pause video when any hotspot is clicked/hovered (default: true) */
  pauseOnInteract?: boolean;
  /** Auto-play the video (default: false) */
  autoplay?: boolean;
  /** Loop the video (default: false) */
  loop?: boolean;
  /** Mute the video initially (default: false, but true if autoplay is true) */
  muted?: boolean;

  /** Player engine type (default: 'auto' — detected from src URL) */
  playerType?: PlayerType;
  /** HLS-specific options (only used when playerType is 'hls' or auto-detected) */
  hls?: HLSConfig;

  /** Theme (default: 'light') */
  theme?: Theme;
  /** Enable marker pulse animation (default: true) */
  pulse?: boolean;
  /** Hotspot entrance/exit animation (default: 'fade') */
  hotspotAnimation?: HotspotAnimation;
  /** Show hotspot indicators on the timeline/progress bar (default: 'dot') */
  timelineIndicators?: TimelineIndicatorStyle;

  /** Show built-in video player controls (default: true) */
  controls?: boolean;
  /** Show fullscreen button (default: true) */
  fullscreenButton?: boolean;
  /** Show hotspot navigation (prev/next) buttons (default: true) */
  hotspotNavigation?: boolean;
  /** Show chapter navigation in the controls (default: true if chapters provided) */
  chapterNavigation?: boolean;

  /** Custom popover render function */
  renderPopover?: (hotspot: VideoHotspotItem) => string | HTMLElement;
  /** Custom marker render function */
  renderMarker?: (hotspot: VideoHotspotItem) => string | HTMLElement;

  /** Called when a hotspot becomes visible */
  onHotspotShow?: (hotspot: VideoHotspotItem) => void;
  /** Called when a hotspot becomes hidden */
  onHotspotHide?: (hotspot: VideoHotspotItem) => void;
  /** Called when a hotspot marker is clicked */
  onHotspotClick?: (event: MouseEvent | KeyboardEvent, hotspot: VideoHotspotItem) => void;
  /** Called when a hotspot popover opens */
  onOpen?: (hotspot: VideoHotspotItem) => void;
  /** Called when a hotspot popover closes */
  onClose?: (hotspot: VideoHotspotItem) => void;
  /** Called when the video starts playing */
  onPlay?: () => void;
  /** Called when the video is paused */
  onPause?: () => void;
  /** Called on every time update (~4Hz) */
  onTimeUpdate?: (currentTime: number) => void;
  /** Called when the active chapter changes */
  onChapterChange?: (chapter: VideoChapter) => void;
  /** Called when fullscreen state changes */
  onFullscreenChange?: (isFullscreen: boolean) => void;
  /** Called when the video is ready to play */
  onReady?: () => void;
  /** Unified analytics callback for all interaction events */
  onAnalytics?: (event: AnalyticsEvent) => void;

  /** Optional Cloudimage integration for poster/thumbnails */
  cloudimage?: CloudimageConfig;
}

/** Instance methods returned by CIVideoHotspot */
export interface CIVideoHotspotInstance {
  /** Get references to internal DOM elements */
  getElements(): {
    container: HTMLElement;
    video: HTMLElement;
    overlay: HTMLElement;
    controls: HTMLElement | null;
  };

  // Video playback
  play(): Promise<void>;
  pause(): void;
  togglePlay(): void;
  seek(time: number): void;
  getCurrentTime(): number;
  getDuration(): number;
  setVolume(level: number): void;
  getVolume(): number;
  setMuted(muted: boolean): void;
  isMuted(): boolean;
  setPlaybackRate(rate: number): void;
  getPlaybackRate(): number;

  // Hotspot management
  /** Open a specific hotspot's popover by ID */
  open(id: string): void;
  /** Close a specific hotspot's popover by ID */
  close(id: string): void;
  /** Close all open popovers */
  closeAll(): void;
  /** Add a hotspot dynamically */
  addHotspot(hotspot: VideoHotspotItem): void;
  /** Remove a hotspot by ID */
  removeHotspot(id: string): void;
  /** Update a hotspot's configuration */
  updateHotspot(id: string, updates: Partial<VideoHotspotItem>): void;
  /** Get all currently visible hotspot IDs */
  getVisibleHotspots(): string[];
  /** Get all hotspot definitions */
  getHotspots(): VideoHotspotItem[];

  // Hotspot navigation
  /** Seek to and show the next hotspot after current time */
  nextHotspot(): void;
  /** Seek to and show the previous hotspot before current time */
  prevHotspot(): void;
  /** Seek to a specific hotspot's start time */
  goToHotspot(id: string): void;

  // Chapter navigation
  /** Seek to a chapter by ID */
  goToChapter(id: string): void;
  /** Get current chapter ID */
  getCurrentChapter(): string | undefined;

  // Fullscreen
  enterFullscreen(): void;
  exitFullscreen(): void;
  isFullscreen(): boolean;

  // Lifecycle
  update(config: Partial<CIVideoHotspotConfig>): void;
  destroy(): void;
}

/** Internal resolved config */
export type ResolvedConfig = CIVideoHotspotConfig & {
  src: string;
  hotspots: VideoHotspotItem[];
};

/** Hotspot with coordinates normalized to percentages */
export interface NormalizedVideoHotspot extends Omit<VideoHotspotItem, 'x' | 'y' | 'keyframes'> {
  x: number;
  y: number;
  keyframes?: Array<{ time: number; x: number; y: number }>;
}

/** 2D point */
export interface Point {
  x: number;
  y: number;
}

/** Computed popover position result */
export interface PositionResult {
  x: number;
  y: number;
  placement: Placement;
  arrowOffset: number;
}
