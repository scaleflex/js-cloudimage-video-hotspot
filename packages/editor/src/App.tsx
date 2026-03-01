import React from 'react';
import { useEditor } from './state/EditorContext';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useVideoPlayer } from './hooks/useVideoPlayer';
import { Toolbar } from './components/Toolbar/Toolbar';
import { VideoCanvas } from './components/VideoCanvas/VideoCanvas';
import { HotspotList } from './components/HotspotList/HotspotList';
import { PropertiesPanel } from './components/PropertiesPanel/PropertiesPanel';
import { Timeline } from './components/Timeline/Timeline';
import { PreviewMode } from './components/Preview/PreviewMode';
import './styles/editor.css';

export function App() {
  const { state } = useEditor();
  const { containerRef, playerReady, seek, togglePlay } = useVideoPlayer();
  useKeyboardShortcuts({ seek, togglePlay });

  if (state.mode === 'preview') {
    return (
      <>
        <PreviewMode />
      </>
    );
  }

  return (
    <div className="editor-layout">
      <Toolbar />
      <HotspotList />
      <VideoCanvas containerRef={containerRef} playerReady={playerReady} />
      <PropertiesPanel />
      <Timeline />
    </div>
  );
}
