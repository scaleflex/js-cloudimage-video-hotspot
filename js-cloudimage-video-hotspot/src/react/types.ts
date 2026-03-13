import type { CIVideoHotspotConfig, CIVideoHotspotInstance } from '../core/types';

export interface CIVideoHotspotViewerProps extends Omit<CIVideoHotspotConfig, 'renderPopover'> {
  /** Optional className for the container div */
  className?: string;
  /** Optional inline style for the container div */
  style?: React.CSSProperties;
  /** Custom popover render function */
  renderPopover?: CIVideoHotspotConfig['renderPopover'];
}

export interface UseCIVideoHotspotOptions extends CIVideoHotspotConfig {}

export interface UseCIVideoHotspotReturn {
  containerRef: React.RefObject<HTMLDivElement | null>;
  instance: React.RefObject<CIVideoHotspotInstance | null>;
}
