import type {
  CIVideoHotspotConfig,
  CIVideoHotspotInstance,
  VideoHotspotItem,
  VideoChapter,
  CloudimageConfig,
  PopoverData,
  ProductVariant,
  AddToCartEvent,
  AnalyticsEvent,
  AnalyticsEventType,
  Keyframe,
  Placement,
  TriggerMode,
  Theme,
  MarkerStyle,
  HotspotAnimation,
  EasingFunction,
  TimelineIndicatorStyle,
  PlayerType,
  HLSConfig,
} from './core/types';

export type {
  CIVideoHotspotConfig,
  CIVideoHotspotInstance,
  VideoHotspotItem,
  VideoChapter,
  CloudimageConfig,
  PopoverData,
  ProductVariant,
  AddToCartEvent,
  AnalyticsEvent,
  AnalyticsEventType,
  Keyframe,
  Placement,
  TriggerMode,
  Theme,
  MarkerStyle,
  HotspotAnimation,
  EasingFunction,
  TimelineIndicatorStyle,
  PlayerType,
  HLSConfig,
};

export { CIVideoHotspot } from './core/ci-video-hotspot';
export { PlayerFactory } from './player/player-factory';
export { VideoPlayerAdapter, type AdapterOptions } from './player/adapter';
import { CIVideoHotspot } from './core/ci-video-hotspot';
export default CIVideoHotspot;
