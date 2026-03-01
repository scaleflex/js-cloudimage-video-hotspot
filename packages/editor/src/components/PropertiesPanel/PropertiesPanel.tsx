import React, { useState } from 'react';
import { useEditor } from '../../state/EditorContext';
import { getHotspots } from '../../state/editorReducer';
import { updateHotspot } from '../../state/actions';
import { PositionSection } from './PositionSection';
import { TimingSection } from './TimingSection';
import { ContentSection } from './ContentSection';
import { StyleSection } from './StyleSection';
import { BehaviorSection } from './BehaviorSection';
import { GallerySection } from './GallerySection';
import { VariantsSection } from './VariantsSection';
import { KeyframesSection } from './KeyframesSection';
import type { VideoHotspotItem } from 'js-cloudimage-video-hotspot';

function CollapsibleSection({ title, defaultOpen = true, children }: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="editor-properties__section">
      <div
        className="editor-properties__section-title editor-properties__section-title--collapsible"
        onClick={() => setOpen(!open)}
      >
        <span className={`editor-properties__collapse-arrow ${open ? 'editor-properties__collapse-arrow--open' : ''}`}>
          ▶
        </span>
        {title}
      </div>
      {open && children}
    </div>
  );
}

export function PropertiesPanel() {
  const { state, dispatch } = useEditor();
  const hotspots = getHotspots(state);
  const selected = state.selectedId ? hotspots.find(h => h.id === state.selectedId) : null;

  if (!selected) {
    return (
      <div className="editor-panel editor-panel--right editor-properties">
        <div className="editor-panel__header">Properties</div>
        <div className="editor-properties__empty">
          Select a hotspot to edit its properties.
        </div>
      </div>
    );
  }

  const handleChange = (updates: Partial<VideoHotspotItem>) => {
    dispatch(updateHotspot(selected.id, updates));
  };

  return (
    <div className="editor-panel editor-panel--right editor-properties">
      <div className="editor-panel__header">
        <span>Properties</span>
        <span style={{ fontSize: 10, fontFamily: 'var(--editor-font-mono)' }}>{selected.id}</span>
      </div>
      <CollapsibleSection title="Position">
        <PositionSection hotspot={selected} onChange={handleChange} />
      </CollapsibleSection>
      <CollapsibleSection title="Timing">
        <TimingSection hotspot={selected} duration={state.duration} onChange={handleChange} />
      </CollapsibleSection>
      <CollapsibleSection title="Keyframes" defaultOpen={false}>
        <KeyframesSection hotspot={selected} currentTime={state.currentTime} onChange={handleChange} />
      </CollapsibleSection>
      <CollapsibleSection title="Content">
        <ContentSection hotspot={selected} onChange={handleChange} />
      </CollapsibleSection>
      <CollapsibleSection title="Style">
        <StyleSection hotspot={selected} onChange={handleChange} />
      </CollapsibleSection>
      <CollapsibleSection title="Behavior">
        <BehaviorSection hotspot={selected} onChange={handleChange} />
      </CollapsibleSection>
      <CollapsibleSection title="Gallery" defaultOpen={false}>
        <GallerySection hotspot={selected} onChange={handleChange} />
      </CollapsibleSection>
      <CollapsibleSection title="Variants" defaultOpen={false}>
        <VariantsSection hotspot={selected} onChange={handleChange} />
      </CollapsibleSection>
    </div>
  );
}
