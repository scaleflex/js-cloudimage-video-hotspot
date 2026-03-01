import React, { createContext, useContext, useReducer, useEffect, useRef, type Dispatch } from 'react';
import { editorReducer, createInitialState, getHotspots, type EditorState } from './editorReducer';
import { createHistoryState } from './history';
import type { EditorAction } from './actions';

const STORAGE_KEY = 'editor-state';
const SAVE_DEBOUNCE = 500;

interface EditorContextValue {
  state: EditorState;
  dispatch: Dispatch<EditorAction>;
}

const EditorContext = createContext<EditorContextValue | null>(null);

function loadFromStorage(): EditorState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createInitialState();
    const saved = JSON.parse(raw);
    if (saved && Array.isArray(saved.hotspots)) {
      const base = createInitialState();
      return {
        ...base,
        videoUrl: saved.videoUrl || base.videoUrl,
        selectedId: saved.selectedId || null,
        history: createHistoryState(saved.hotspots),
      };
    }
  } catch {
    // ignore
  }
  return createInitialState();
}

export function saveToStorage(state: EditorState) {
  try {
    const data = {
      videoUrl: state.videoUrl,
      hotspots: getHotspots(state),
      selectedId: state.selectedId,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore quota errors
  }
}

export function EditorProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(editorReducer, undefined, loadFromStorage);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => saveToStorage(state), SAVE_DEBOUNCE);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [state]);

  return (
    <EditorContext.Provider value={{ state, dispatch }}>
      {children}
    </EditorContext.Provider>
  );
}

export function useEditor(): EditorContextValue {
  const ctx = useContext(EditorContext);
  if (!ctx) throw new Error('useEditor must be used within EditorProvider');
  return ctx;
}
