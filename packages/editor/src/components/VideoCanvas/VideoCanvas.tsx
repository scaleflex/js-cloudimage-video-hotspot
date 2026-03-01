import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useEditor } from '../../state/EditorContext';
import { addHotspot } from '../../state/actions';
import { getHotspots } from '../../state/editorReducer';
import { CanvasOverlay } from './CanvasOverlay';

interface VideoCanvasProps {
  containerRef: React.RefObject<HTMLDivElement>;
  playerReady?: boolean;
}

export function VideoCanvas({ containerRef, playerReady }: VideoCanvasProps) {
  const { state, dispatch } = useEditor();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [videoRect, setVideoRect] = useState<DOMRect | null>(null);

  const updateRect = useCallback(() => {
    const el = containerRef.current;
    if (el) {
      setVideoRect(el.getBoundingClientRect());
    }
  }, [containerRef]);

  useEffect(() => {
    updateRect();
    window.addEventListener('resize', updateRect);
    return () => window.removeEventListener('resize', updateRect);
  }, [updateRect]);

  // Update rect when player becomes ready
  useEffect(() => {
    if (playerReady) {
      setTimeout(updateRect, 50);
    }
  }, [playerReady, updateRect]);

  const handleDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    const hotspots = getHotspots(state);

    const id = `hotspot-${Date.now()}`;
    dispatch(addHotspot({
      id,
      x: `${x.toFixed(1)}%`,
      y: `${y.toFixed(1)}%`,
      startTime: Math.max(0, state.currentTime),
      endTime: Math.min(state.duration || 30, state.currentTime + 5),
      label: `Hotspot ${hotspots.length + 1}`,
    }));
  };

  if (!state.videoUrl) {
    return (
      <div className="editor-canvas">
        <div className="editor-canvas__empty">
          <h3>No Video Loaded</h3>
          <p>Enter a video URL in the toolbar above to get started.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="editor-canvas" ref={wrapperRef}>
      <div className="editor-canvas__video-wrapper">
        <div
          ref={containerRef}
          className="editor-canvas__player-container"
          onDoubleClick={handleDoubleClick}
        />
        <CanvasOverlay videoRect={videoRect} />
      </div>
    </div>
  );
}
