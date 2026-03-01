import React from 'react';
import type { VideoHotspotItem, Keyframe, EasingFunction } from 'js-cloudimage-video-hotspot';

interface KeyframesSectionProps {
  hotspot: VideoHotspotItem;
  currentTime: number;
  onChange: (updates: Partial<VideoHotspotItem>) => void;
}

const EASING_OPTIONS: EasingFunction[] = ['linear', 'ease-in', 'ease-out', 'ease-in-out'];

function sortKeyframes(kfs: Keyframe[]): Keyframe[] {
  return [...kfs].sort((a, b) => a.time - b.time);
}

export function KeyframesSection({ hotspot, currentTime, onChange }: KeyframesSectionProps) {
  const keyframes: Keyframe[] = hotspot.keyframes || [];
  const easing: EasingFunction = hotspot.easing || 'linear';

  const updateKeyframes = (updated: Keyframe[]) => {
    onChange({ keyframes: sortKeyframes(updated) });
  };

  const handleAdd = () => {
    const time = Math.round(currentTime * 10) / 10;
    const newKf: Keyframe = { time, x: hotspot.x, y: hotspot.y };
    updateKeyframes([...keyframes, newKf]);
  };

  const handleRemove = (index: number) => {
    const updated = keyframes.filter((_, i) => i !== index);
    onChange({ keyframes: updated });
  };

  const handleFieldChange = (index: number, field: keyof Keyframe, value: string) => {
    const updated = keyframes.map((kf, i) => {
      if (i !== index) return kf;
      if (field === 'time') return { ...kf, time: parseFloat(value) || 0 };
      return { ...kf, [field]: value };
    });
    updateKeyframes(updated);
  };

  return (
    <div className="editor-properties__section-content">
      <div className="editor-properties__row">
        <span className="editor-properties__label">Easing</span>
        <select
          className="editor-input"
          value={easing}
          onChange={e => onChange({ easing: e.target.value as EasingFunction })}
        >
          {EASING_OPTIONS.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>

      {keyframes.map((kf, i) => (
        <div key={i} className="editor-properties__keyframe-item">
          <div className="editor-properties__row">
            <span className="editor-properties__label">Time</span>
            <input
              className="editor-input editor-input--small"
              type="number"
              step="0.1"
              min="0"
              value={kf.time}
              onChange={e => handleFieldChange(i, 'time', e.target.value)}
            />
            <span style={{ fontSize: 11, color: 'var(--editor-text-muted)' }}>s</span>
          </div>
          <div className="editor-properties__row">
            <span className="editor-properties__label">X</span>
            <input
              className="editor-input editor-input--small"
              type="text"
              value={kf.x}
              onChange={e => handleFieldChange(i, 'x', e.target.value)}
            />
            <span className="editor-properties__label">Y</span>
            <input
              className="editor-input editor-input--small"
              type="text"
              value={kf.y}
              onChange={e => handleFieldChange(i, 'y', e.target.value)}
            />
            <button
              className="editor-btn editor-btn--icon editor-btn--danger"
              onClick={() => handleRemove(i)}
              title="Remove keyframe"
            >
              &times;
            </button>
          </div>
        </div>
      ))}

      <div style={{ marginTop: 8 }}>
        <button className="editor-btn editor-btn--primary" onClick={handleAdd}>
          Add Keyframe at {currentTime.toFixed(1)}s
        </button>
      </div>
    </div>
  );
}
