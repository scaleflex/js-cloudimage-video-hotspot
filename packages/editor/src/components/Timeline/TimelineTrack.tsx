import React, { useRef, useCallback } from 'react';
import type { VideoHotspotItem } from 'js-cloudimage-video-hotspot';

interface TimelineTrackProps {
  hotspot: VideoHotspotItem;
  duration: number;
  selected: boolean;
  onSelect: () => void;
  onUpdate: (id: string, updates: Partial<VideoHotspotItem>) => void;
  onSeek: (time: number) => void;
  zoomLevel: number;
}

const COLORS = [
  '#7c5cff', '#e53e3e', '#48bb78', '#ecc94b', '#4299e1',
  '#ed64a6', '#38b2ac', '#ed8936',
];

const HANDLE_WIDTH = 8;

type DragMode = 'move' | 'resize-start' | 'resize-end';

function snapToGrid(time: number, snap: number): number {
  return Math.round(time / snap) * snap;
}

export function TimelineTrack({ hotspot, duration, selected, onSelect, onUpdate, onSeek, zoomLevel }: TimelineTrackProps) {
  const barRef = useRef<HTMLDivElement>(null);
  const dragState = useRef<{
    mode: DragMode;
    startX: number;
    origStart: number;
    origEnd: number;
  } | null>(null);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    const ds = dragState.current;
    if (!ds) return;

    const bar = barRef.current;
    if (!bar) return;
    const track = bar.parentElement;
    if (!track) return;

    const trackRect = track.getBoundingClientRect();
    const trackWidth = trackRect.width;
    const deltaX = e.clientX - ds.startX;
    const deltaSec = (deltaX / trackWidth) * duration;
    const SNAP = 0.5;

    let newStart = ds.origStart;
    let newEnd = ds.origEnd;

    if (ds.mode === 'move') {
      const shift = snapToGrid(deltaSec, SNAP);
      newStart = ds.origStart + shift;
      newEnd = ds.origEnd + shift;
      const len = newEnd - newStart;
      if (newStart < 0) { newStart = 0; newEnd = len; }
      if (newEnd > duration) { newEnd = duration; newStart = duration - len; }
    } else if (ds.mode === 'resize-start') {
      newStart = snapToGrid(ds.origStart + deltaSec, SNAP);
      newStart = Math.max(0, Math.min(newStart, newEnd - 0.5));
    } else if (ds.mode === 'resize-end') {
      newEnd = snapToGrid(ds.origEnd + deltaSec, SNAP);
      newEnd = Math.min(duration, Math.max(newEnd, newStart + 0.5));
    }

    onUpdate(hotspot.id, { startTime: newStart, endTime: newEnd });
    onSeek(ds.mode === 'resize-end' ? newEnd : newStart);
  }, [duration, hotspot.id, onUpdate, onSeek]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    dragState.current = null;
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
  }, []);

  if (duration <= 0) return null;

  const left = (hotspot.startTime / duration) * 100;
  const width = ((hotspot.endTime - hotspot.startTime) / duration) * 100;
  const colorIdx = Math.abs(hashCode(hotspot.id)) % COLORS.length;

  const getDragMode = (e: React.PointerEvent): DragMode => {
    const rect = (e.target as HTMLElement).closest('.editor-timeline__bar')?.getBoundingClientRect();
    if (!rect) return 'move';
    const relX = e.clientX - rect.left;
    if (relX <= HANDLE_WIDTH) return 'resize-start';
    if (relX >= rect.width - HANDLE_WIDTH) return 'resize-end';
    return 'move';
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onSelect();

    const mode = getDragMode(e);
    dragState.current = {
      mode,
      startX: e.clientX,
      origStart: hotspot.startTime,
      origEnd: hotspot.endTime,
    };

    const el = e.currentTarget as HTMLElement;
    el.setPointerCapture(e.pointerId);
  };

  const getCursor = (e: React.PointerEvent): string => {
    const mode = getDragMode(e);
    if (mode === 'move') return dragState.current ? 'grabbing' : 'grab';
    return 'col-resize';
  };

  // Keyframe dots
  const keyframes = hotspot.keyframes;

  const handleBarDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const bar = barRef.current;
    if (!bar) return;
    const rect = bar.getBoundingClientRect();
    const relX = (e.clientX - rect.left) / rect.width;
    const time = hotspot.startTime + relX * (hotspot.endTime - hotspot.startTime);
    const roundedTime = Math.round(time * 10) / 10;
    const existing = keyframes || [];
    const newKf = { time: roundedTime, x: hotspot.x, y: hotspot.y };
    const updated = [...existing, newKf].sort((a, b) => a.time - b.time);
    onUpdate(hotspot.id, { keyframes: updated });
  };

  return (
    <div className="editor-timeline__track">
      <span className="editor-timeline__track-label">{hotspot.label}</span>
      <div
        ref={barRef}
        className={`editor-timeline__bar ${selected ? 'editor-timeline__bar--selected' : ''}`}
        style={{
          left: `${left}%`,
          width: `${Math.max(width, 0.5)}%`,
          background: COLORS[colorIdx],
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onDoubleClick={handleBarDoubleClick}
        onPointerOver={(e) => {
          (e.currentTarget as HTMLElement).style.cursor = getCursor(e);
        }}
        title={`${hotspot.label}: ${hotspot.startTime.toFixed(1)}s – ${hotspot.endTime.toFixed(1)}s`}
      >
        <div className="editor-timeline__bar-handle editor-timeline__bar-handle--left" />
        <div className="editor-timeline__bar-handle editor-timeline__bar-handle--right" />
        {keyframes && keyframes.map((kf, i) => {
          const kfPos = duration > 0
            ? ((kf.time - hotspot.startTime) / (hotspot.endTime - hotspot.startTime)) * 100
            : 0;
          if (kfPos < 0 || kfPos > 100) return null;
          return (
            <div
              key={i}
              className="editor-timeline__keyframe-dot"
              style={{ left: `${kfPos}%` }}
              onClick={(e) => { e.stopPropagation(); onSeek(kf.time); }}
              title={`Keyframe: ${kf.time.toFixed(1)}s`}
            />
          );
        })}
      </div>
    </div>
  );
}

function hashCode(s: string): number {
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = ((hash << 5) - hash) + s.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}
