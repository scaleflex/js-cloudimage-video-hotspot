import { useEffect, useCallback } from 'react';
import { useEditor, saveToStorage } from '../state/EditorContext';
import { undo, redo, removeHotspot, selectHotspot, setMode, duplicateHotspot } from '../state/actions';
import { getHotspots } from '../state/editorReducer';
import { exportToJson } from '../utils/export';

function showSaveToast() {
  let toast = document.querySelector('.editor-save-toast') as HTMLElement | null;
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'editor-save-toast';
    toast.textContent = 'Saved!';
    document.body.appendChild(toast);
  }
  toast.classList.add('editor-save-toast--visible');
  setTimeout(() => {
    toast!.classList.remove('editor-save-toast--visible');
  }, 1500);
}

interface KeyboardShortcutsOptions {
  seek?: (time: number) => void;
  togglePlay?: () => void;
}

export function useKeyboardShortcuts(options?: KeyboardShortcutsOptions) {
  const { state, dispatch } = useEditor();

  const handleExportJson = useCallback(() => {
    const json = exportToJson(getHotspots(state), state.videoUrl);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'video-hotspots.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [state]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isCtrl = e.ctrlKey || e.metaKey;
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      // Ctrl+Z — undo
      if (isCtrl && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        dispatch(undo());
        return;
      }
      // Ctrl+Shift+Z or Ctrl+Y — redo
      if ((isCtrl && e.key === 'z' && e.shiftKey) || (isCtrl && e.key === 'y')) {
        e.preventDefault();
        dispatch(redo());
        return;
      }
      // Delete — remove selected
      if (e.key === 'Delete' && state.selectedId) {
        e.preventDefault();
        dispatch(removeHotspot(state.selectedId));
        return;
      }
      // Ctrl+S — save to localStorage
      if (isCtrl && e.key === 's') {
        e.preventDefault();
        saveToStorage(state);
        showSaveToast();
        return;
      }
      // Ctrl+E — export JSON
      if (isCtrl && e.key === 'e') {
        e.preventDefault();
        handleExportJson();
        return;
      }
      // Ctrl+D — duplicate selected hotspot
      if (isCtrl && e.key === 'd') {
        e.preventDefault();
        if (state.selectedId) {
          dispatch(duplicateHotspot(state.selectedId));
        }
        return;
      }
      // Space — play/pause video
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        options?.togglePlay?.();
        return;
      }
      // Arrow Left/Right — seek ±1s (Shift: ±5s)
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        const step = e.shiftKey ? 5 : 1;
        const newTime = Math.max(0, state.currentTime - step);
        options?.seek?.(newTime);
        return;
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        const step = e.shiftKey ? 5 : 1;
        const newTime = Math.min(state.duration, state.currentTime + step);
        options?.seek?.(newTime);
        return;
      }
      // Escape — deselect
      if (e.key === 'Escape') {
        dispatch(selectHotspot(null));
        if (state.mode === 'preview') dispatch(setMode('edit'));
        return;
      }
      // P — preview mode toggle
      if (e.key === 'p' && !isCtrl) {
        dispatch(setMode(state.mode === 'preview' ? 'edit' : 'preview'));
        return;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [state, dispatch, options, handleExportJson]);
}
