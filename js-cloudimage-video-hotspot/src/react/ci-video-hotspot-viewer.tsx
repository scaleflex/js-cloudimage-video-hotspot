import React, { forwardRef, useImperativeHandle } from 'react';
import type { CIVideoHotspotInstance } from '../core/types';
import type { CIVideoHotspotViewerProps } from './types';
import { useCIVideoHotspot } from './use-ci-video-hotspot';

/** React component for CIVideoHotspot */
export const CIVideoHotspotViewer = forwardRef<CIVideoHotspotInstance | null, CIVideoHotspotViewerProps>(
  function CIVideoHotspotViewer(props, ref) {
    const { className, style, ...config } = props;

    const { containerRef, instance } = useCIVideoHotspot(config);

    useImperativeHandle(ref, () => instance.current, [instance]);

    return (
      <div
        ref={containerRef}
        className={className}
        style={style}
      />
    );
  },
);
