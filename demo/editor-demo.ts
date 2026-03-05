import CIVideoHotspot from '../src/index';
import type { VideoHotspotItem, Keyframe, MarkerStyle, TriggerMode, Placement, HotspotAnimation, InterpolationMode } from '../src/core/types';

let videoSrc = './Rest room.mp4';

// Color palette for hotspots
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

// ──────────────────── State ────────────────────
type AppMode = 'view' | 'editor';
let mode: AppMode = 'view';
let hotspots: VideoHotspotItem[] = getSampleHotspots();
let selectedHotspotId: string | null = null;
let selectedPointIndex: number | null = null;
let viewer: CIVideoHotspot | null = null;
let nextId = 8;
let placementMode = false;
let videoDuration = 60;
let editorHandlersBound = false;
let seekAfterRebuild: number | null = null;

// ──────────────────── Undo/Redo ────────────────────
let undoStack: string[] = [];
let redoStack: string[] = [];

function pushUndo(): void {
  undoStack.push(JSON.stringify(hotspots));
  redoStack = [];
  if (undoStack.length > 50) undoStack.shift();
}

function undo(): void {
  if (undoStack.length === 0) return;
  redoStack.push(JSON.stringify(hotspots));
  const prev = undoStack.pop()!;
  hotspots = JSON.parse(prev);
  selectedHotspotId = null;
  selectedPointIndex = null;
  rebuildViewer();
  updateJsonOutput();
}

function redo(): void {
  if (redoStack.length === 0) return;
  undoStack.push(JSON.stringify(hotspots));
  const next = redoStack.pop()!;
  hotspots = JSON.parse(next);
  selectedHotspotId = null;
  selectedPointIndex = null;
  rebuildViewer();
  updateJsonOutput();
}

// ──────────────────── JSON Output ────────────────────
function updateJsonOutput(): void {
  const codeEl = document.querySelector('#json-output code');
  if (!codeEl) return;
  const data = hotspots.map(h => {
    const entry: Record<string, unknown> = {
      id: h.id,
      x: h.x,
      y: h.y,
      startTime: h.startTime,
      endTime: h.endTime,
      label: h.label,
      interpolation: h.interpolation,
      keyframes: h.keyframes,
      data: h.data,
    };
    if (h.markerStyle) entry.markerStyle = h.markerStyle;
    if (h.trigger) entry.trigger = h.trigger;
    if (h.placement) entry.placement = h.placement;
    if (h.animation) entry.animation = h.animation;
    return entry;
  });
  codeEl.textContent = JSON.stringify(data, null, 2);
}

// ──────────────────── Init ────────────────────
function init(): void {
  setupModeToggle();
  setupToolbar();
  setupKeyboardShortcuts();
  rebuildViewer();
  updateJsonOutput();
}

// ──────────────────── Toolbar (Load Video / Import / Export / Copy) ────────────────────
function setupToolbar(): void {
  // Load video URL
  const urlInput = document.getElementById('video-url-input') as HTMLInputElement;
  const loadBtn = document.getElementById('video-url-load');
  const loadVideo = () => {
    const url = urlInput.value.trim();
    if (!url) return;
    videoSrc = url;
    seekAfterRebuild = null;
    hotspots = [];
    selectedHotspotId = null;
    selectedPointIndex = null;
    nextId = 1;
    undoStack = [];
    redoStack = [];
    placementMode = false;

    // Visual feedback
    if (loadBtn) {
      loadBtn.textContent = 'Loading…';
      loadBtn.setAttribute('disabled', '');
    }

    rebuildViewer(true);
    updateJsonOutput();

    // Listen for load success / error on the new video element
    const videoEl = document.querySelector('.ci-video-hotspot-video') as HTMLVideoElement | null;
    if (videoEl) {
      const onLoaded = () => {
        cleanup();
        if (loadBtn) {
          loadBtn.textContent = 'Load';
          loadBtn.removeAttribute('disabled');
        }
      };
      const onError = () => {
        cleanup();
        if (loadBtn) {
          loadBtn.textContent = 'Load';
          loadBtn.removeAttribute('disabled');
        }
        urlInput.style.borderColor = '#ef4444';
        setTimeout(() => { urlInput.style.borderColor = ''; }, 2000);
      };
      const cleanup = () => {
        videoEl.removeEventListener('loadedmetadata', onLoaded);
        videoEl.removeEventListener('error', onError);
      };
      videoEl.addEventListener('loadedmetadata', onLoaded, { once: true });
      videoEl.addEventListener('error', onError, { once: true });
    }
  };
  loadBtn?.addEventListener('click', loadVideo);
  urlInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') loadVideo();
  });

  // Import
  const importInput = document.getElementById('toolbar-import-file') as HTMLInputElement;
  importInput?.addEventListener('change', () => {
    const file = importInput.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string);
        if (Array.isArray(data)) {
          pushUndo();
          hotspots = data;
          nextId = hotspots.length + 1;
          selectedHotspotId = null;
          selectedPointIndex = null;
          rebuildViewer();
          updateJsonOutput();
        }
      } catch { /* ignore bad JSON */ }
      importInput.value = '';
    };
    reader.readAsText(file);
  });

  // Export
  document.getElementById('toolbar-export')?.addEventListener('click', () => {
    const json = JSON.stringify(hotspots, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'hotspots.json';
    a.click();
    URL.revokeObjectURL(url);
  });

  // Copy JSON
  document.getElementById('toolbar-copy')?.addEventListener('click', () => {
    const json = JSON.stringify(hotspots, null, 2);
    navigator.clipboard.writeText(json).then(() => {
      const btn = document.getElementById('toolbar-copy')!;
      btn.classList.add('toolbar-btn--done');
      const orig = btn.textContent;
      btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Copied!';
      setTimeout(() => {
        btn.classList.remove('toolbar-btn--done');
        btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg> Copy JSON';
      }, 2000);
    });
  });
}

// ──────────────────── Mode Toggle ────────────────────
function setupModeToggle(): void {
  // Both toggles (overlay on video + bar in top-bar) trigger mode change
  document.querySelectorAll('#mode-toggle-overlay, #mode-toggle-bar').forEach((toggle) => {
    toggle.addEventListener('click', (e) => {
      const btn = (e.target as HTMLElement).closest('.mode-btn') as HTMLElement;
      if (!btn) return;
      const newMode = btn.dataset.mode as AppMode;
      if (newMode && newMode !== mode) setMode(newMode);
    });
  });
}

function setMode(newMode: AppMode): void {
  mode = newMode;
  selectedHotspotId = null;
  selectedPointIndex = null;
  placementMode = false;

  // Update all toggle buttons
  document.querySelectorAll('.mode-btn').forEach((btn) => {
    btn.classList.toggle('mode-btn--active', (btn as HTMLElement).dataset.mode === mode);
  });

  // Toggle sidebar
  const sidebar = document.getElementById('sidebar')!;
  sidebar.classList.toggle('app-sidebar--hidden', mode === 'view');

  // Remove crosshair
  document.getElementById('video-area')!.classList.remove('app-video-area--crosshair');

  // View: overlay toggle visible, top-bar hidden
  // Editor: overlay toggle hidden, top-bar visible
  document.getElementById('mode-toggle-overlay')?.classList.toggle('app-mode-toggle--hidden', mode === 'editor');
  document.getElementById('app-top-bar')?.classList.toggle('app-top-bar--hidden', mode === 'view');

  rebuildViewer();
}

// ──────────────────── Viewer ────────────────────
function rebuildViewer(skipSeekSave = false): void {
  // Save time to restore after rebuild (skip when loading a new video)
  if (mode === 'editor' && !skipSeekSave) {
    if (selectedHotspotId && selectedPointIndex !== null) {
      const hotspot = hotspots.find(h => h.id === selectedHotspotId);
      if (hotspot?.keyframes?.[selectedPointIndex]) {
        seekAfterRebuild = hotspot.keyframes[selectedPointIndex].time;
      } else {
        seekAfterRebuild = viewer?.getCurrentTime() ?? null;
      }
    } else {
      seekAfterRebuild = viewer?.getCurrentTime() ?? null;
    }
  }

  if (viewer) {
    viewer.destroy();
    viewer = null;
  }

  const container = document.getElementById('video-viewer')!;
  container.innerHTML = '';

  viewer = new CIVideoHotspot(container, {
    src: videoSrc,
    hotspots: hotspots.map(h => ({ ...h })),
    trigger: 'click',
    pauseOnInteract: mode === 'view',
    controls: true,
    hotspotNavigation: false,
    timelineIndicators: 'none',
    onTimeUpdate: () => {
      updateMarkerVisibility();
    },
    onReady: () => {
      videoDuration = viewer?.getDuration() || 60;
      renderTimeline();
      renderSidebar();
      if (mode === 'editor') {
        setupEditorHandlers();
        if (seekAfterRebuild !== null) {
          viewer?.seek(seekAfterRebuild);
          viewer?.pause();
          seekAfterRebuild = null;
        }
      }
      // Deselect point when clicking the progress bar (seeking)
      const progressBar = document.querySelector('.ci-video-hotspot-progress-bar');
      progressBar?.addEventListener('mousedown', (e) => {
        if ((e.target as HTMLElement).closest('.timeline-kf-dot, .timeline-start-dot')) return;
        selectedPointIndex = null;
        renderSidebar();
      });
    },
  });
}

// ──────────────────── Editor Handlers ────────────────────
function setupEditorHandlers(): void {
  if (editorHandlersBound) return;
  editorHandlersBound = true;

  const videoArea = document.getElementById('video-area')!;

  // Double-click to create hotspot
  videoArea.addEventListener('dblclick', handleVideoDoubleClick);

  // Click in placement mode
  videoArea.addEventListener('click', handleVideoClick);

  // Drag hotspot markers
  setupMarkerDrag();
}

function handleVideoDoubleClick(e: MouseEvent): void {
  if (mode !== 'editor') return;
  const pos = getVideoPosition(e);
  if (!pos) return;
  createHotspotAtPosition(pos.x, pos.y);
}

function handleVideoClick(e: MouseEvent): void {
  if (mode !== 'editor' || !placementMode) return;
  const pos = getVideoPosition(e);
  if (!pos) return;
  placementMode = false;
  document.getElementById('video-area')!.classList.remove('app-video-area--crosshair');
  createHotspotAtPosition(pos.x, pos.y);
}

function getVideoRect(): DOMRect | null {
  const container = document.querySelector('.ci-video-hotspot-container') as HTMLElement;
  if (container) {
    const rect = container.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) return rect;
  }
  return null;
}

function getVideoPosition(e: MouseEvent): { x: number; y: number } | null {
  const rect = getVideoRect();
  if (!rect) return null;
  const x = ((e.clientX - rect.left) / rect.width) * 100;
  const y = ((e.clientY - rect.top) / rect.height) * 100;
  if (x < 0 || x > 100 || y < 0 || y > 100) return null;
  return { x: Math.round(x * 100) / 100, y: Math.round(y * 100) / 100 };
}

// ──────────────────── Marker Drag ────────────────────
function setupMarkerDrag(): void {
  const videoArea = document.getElementById('video-area')!;
  let dragId: string | null = null;
  let startX = 0, startY = 0;
  let isDragging = false;

  videoArea.addEventListener('pointerdown', (e) => {
    if (mode !== 'editor') return;
    const marker = (e.target as HTMLElement).closest('.ci-video-hotspot-marker') as HTMLElement;
    if (!marker) return;

    const id = marker.getAttribute('data-hotspot-id');
    if (!id) return;

    dragId = id;
    startX = e.clientX;
    startY = e.clientY;
    isDragging = false;
    marker.setPointerCapture(e.pointerId);

    // Select hotspot; match current time to a keyframe or null for interpolated position
    selectedHotspotId = id;
    const hotspot = hotspots.find(h => h.id === id);
    const currentTime = viewer?.getCurrentTime() ?? 0;
    const matchIdx = hotspot?.keyframes?.findIndex(kf => Math.abs(kf.time - currentTime) < 0.25) ?? -1;
    selectedPointIndex = matchIdx >= 0 ? matchIdx : null;
    renderSidebar();
    renderTimeline();
  });

  videoArea.addEventListener('pointermove', (e) => {
    if (!dragId) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    if (!isDragging && Math.abs(dx) + Math.abs(dy) < 3) return;
    isDragging = true;

    const rect = getVideoRect();
    if (!rect) return;
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));

    const marker = document.querySelector(`[data-hotspot-id="${dragId}"]`) as HTMLElement;
    if (marker) {
      marker.style.left = `${x}%`;
      marker.style.top = `${y}%`;
    }
  });

  videoArea.addEventListener('pointerup', (e) => {
    if (!dragId || !isDragging) {
      dragId = null;
      return;
    }

    const rect = getVideoRect();
    if (!rect) { dragId = null; return; }
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));

    const hotspot = hotspots.find(h => h.id === dragId);
    if (hotspot?.keyframes) {
      const roundedX = `${Math.round(x * 100) / 100}%`;
      const roundedY = `${Math.round(y * 100) / 100}%`;

      if (selectedHotspotId === dragId && selectedPointIndex !== null && hotspot.keyframes[selectedPointIndex]) {
        // A specific keyframe is selected — update its coordinates
        hotspot.keyframes[selectedPointIndex].x = roundedX;
        hotspot.keyframes[selectedPointIndex].y = roundedY;
      } else {
        // No point selected — marker is at interpolated position, create new keyframe
        const currentTime = viewer?.getCurrentTime() ?? 0;
        const roundedTime = Math.round(currentTime * 10) / 10;
        const newKf: Keyframe = { time: roundedTime, x: roundedX, y: roundedY };
        hotspot.keyframes.push(newKf);
        hotspot.keyframes.sort((a, b) => a.time - b.time);
        hotspot.startTime = hotspot.keyframes[0].time;
        hotspot.endTime = hotspot.keyframes[hotspot.keyframes.length - 1].time;
        selectedPointIndex = hotspot.keyframes.indexOf(newKf);
      }

      // Also update base position to first keyframe
      hotspot.x = hotspot.keyframes[0].x;
      hotspot.y = hotspot.keyframes[0].y;
    }

    const finishedId = dragId;
    dragId = null;
    isDragging = false;
    pushUndo();
    syncHotspot(finishedId);
    updateJsonOutput();
  });
}

// ──────────────────── Selection ────────────────────
function selectHotspot(id: string, pointIdx?: number): void {
  selectedHotspotId = id;
  selectedPointIndex = pointIdx ?? 0;
  updateMarkerVisibility();
  renderSidebar();
  renderTimeline();
}

function selectPoint(hotspotId: string, pointIndex: number): void {
  selectedHotspotId = hotspotId;
  selectedPointIndex = pointIndex;
  const hotspot = hotspots.find(h => h.id === hotspotId);
  if (hotspot?.keyframes?.[pointIndex]) {
    viewer?.pause();
    viewer?.seek(hotspot.keyframes[pointIndex].time);
  }
  updateMarkerVisibility();
  renderSidebar();
  renderTimeline();
}

function updateMarkerVisibility(): void {
  const markers = document.querySelectorAll('.ci-video-hotspot-marker') as NodeListOf<HTMLElement>;
  markers.forEach((marker) => {
    if (mode === 'editor' && selectedHotspotId) {
      const id = marker.getAttribute('data-hotspot-id');
      marker.style.display = id === selectedHotspotId ? '' : 'none';
    } else {
      marker.style.display = '';
    }
  });
}

// ──────────────────── Sync helpers ────────────────────
/** Push local hotspot data into the live viewer without full rebuild */
function syncHotspot(id: string): void {
  const h = hotspots.find(hs => hs.id === id);
  if (!h || !viewer) return;
  viewer.updateHotspot(id, { ...h });
  updateMarkerVisibility();
  renderSidebar();
  renderTimeline();
}

// ──────────────────── Hotspot CRUD ────────────────────
function createHotspotAtPosition(x: number, y: number): void {
  pushUndo();
  const currentTime = Math.round((viewer?.getCurrentTime() ?? 0) * 10) / 10;
  const endTime = Math.round((currentTime + 10) * 10) / 10;
  const id = `hotspot-${nextId++}`;
  const xStr = `${x}%`;
  const yStr = `${y}%`;

  const newHotspot: VideoHotspotItem = {
    id,
    x: xStr,
    y: yStr,
    startTime: currentTime,
    endTime,
    label: `Hotspot ${nextId - 1}`,
    interpolation: 'catmull-rom',
    keyframes: [
      { time: currentTime, x: xStr, y: yStr },
      { time: endTime, x: xStr, y: yStr },
    ],
    data: {},
  };

  hotspots.push(newHotspot);
  selectedHotspotId = id;
  selectedPointIndex = 0;
  viewer?.addHotspot({ ...newHotspot });
  updateMarkerVisibility();
  renderSidebar();
  renderTimeline();
  updateJsonOutput();
}

function deleteHotspot(id: string): void {
  pushUndo();
  hotspots = hotspots.filter(h => h.id !== id);
  if (selectedHotspotId === id) {
    selectedHotspotId = null;
    selectedPointIndex = null;
  }
  viewer?.removeHotspot(id);
  updateMarkerVisibility();
  renderSidebar();
  renderTimeline();
  updateJsonOutput();
}

function deleteKeyframe(hotspotId: string, kfIndex: number): void {
  const hotspot = hotspots.find(h => h.id === hotspotId);
  if (!hotspot?.keyframes || hotspot.keyframes.length <= 2) return; // keep at least 2 points
  pushUndo();
  hotspot.keyframes.splice(kfIndex, 1);
  hotspot.startTime = hotspot.keyframes[0].time;
  hotspot.endTime = hotspot.keyframes[hotspot.keyframes.length - 1].time;
  hotspot.x = hotspot.keyframes[0].x;
  hotspot.y = hotspot.keyframes[0].y;
  if (selectedPointIndex !== null && selectedPointIndex >= hotspot.keyframes.length) {
    selectedPointIndex = hotspot.keyframes.length - 1;
  }
  syncHotspot(hotspotId);
  updateJsonOutput();
}

function updateKeyframe(hotspotId: string, kfIndex: number, field: string, value: number): void {
  const hotspot = hotspots.find(h => h.id === hotspotId);
  if (!hotspot?.keyframes?.[kfIndex]) return;

  pushUndo();
  const kf = hotspot.keyframes[kfIndex];
  if (field === 'time') {
    kf.time = value;
    hotspot.keyframes.sort((a, b) => a.time - b.time);
    hotspot.startTime = hotspot.keyframes[0].time;
    hotspot.endTime = hotspot.keyframes[hotspot.keyframes.length - 1].time;
  } else if (field === 'x') {
    kf.x = `${value}%`;
  } else if (field === 'y') {
    kf.y = `${value}%`;
  }

  hotspot.x = hotspot.keyframes[0].x;
  hotspot.y = hotspot.keyframes[0].y;
  syncHotspot(hotspotId);
  updateJsonOutput();
}

// ──────────────────── Sidebar ────────────────────
function renderSidebar(): void {
  const sidebar = document.getElementById('sidebar')!;
  if (mode === 'view') {
    sidebar.classList.add('app-sidebar--hidden');
    return;
  }
  sidebar.classList.remove('app-sidebar--hidden');
  sidebar.innerHTML = '';

  // Header
  const header = el('div', 'sidebar-header');
  const title = el('h2');
  title.textContent = 'Hotspots';
  const addBtn = el('button', 'sidebar-add-btn');
  addBtn.textContent = '+ Add Hotspot';
  addBtn.addEventListener('click', () => {
    placementMode = true;
    document.getElementById('video-area')!.classList.add('app-video-area--crosshair');
  });
  header.appendChild(title);
  header.appendChild(addBtn);
  sidebar.appendChild(header);

  // List
  const list = el('div', 'sidebar-list');
  hotspots.forEach((h, hIdx) => {
    const isSelected = h.id === selectedHotspotId;
    const item = el('div', `hotspot-item${isSelected ? ' hotspot-item--selected' : ''}`);

    // Header row
    const hdr = el('div', 'hotspot-item-header');
    hdr.addEventListener('click', () => {
      if (selectedHotspotId === h.id) {
        selectedHotspotId = null;
        selectedPointIndex = null;
        updateMarkerVisibility();
      } else {
        selectHotspot(h.id);
      }
      renderSidebar();
      renderTimeline();
    });

    const colorDot = el('span', 'hotspot-item-color');
    colorDot.style.backgroundColor = COLORS[hIdx % COLORS.length];
    const name = el('span', 'hotspot-item-name');
    name.textContent = h.label || h.id;
    const time = el('span', 'hotspot-item-time');
    time.textContent = `${fmtTime(h.startTime)} – ${fmtTime(h.endTime)}`;
    const chevron = el('span', 'hotspot-item-chevron');
    chevron.textContent = '\u25B8';

    hdr.append(colorDot, name, time, chevron);
    item.appendChild(hdr);

    // Expanded body
    if (isSelected) {
      const body = el('div', 'hotspot-item-body');
      body.style.display = 'block';

      // Name input
      const nameInput = el('input', 'hotspot-name-input') as HTMLInputElement;
      nameInput.value = h.label;
      nameInput.addEventListener('change', () => {
        h.label = nameInput.value;
        renderSidebar();
      });
      body.appendChild(nameInput);

      // Points header
      const ptsHeader = el('div', 'points-header');
      const ptsTitle = el('span', 'points-title');
      ptsTitle.textContent = 'Points';
      ptsHeader.appendChild(ptsTitle);
      body.appendChild(ptsHeader);

      // Points list
      const kfs = h.keyframes || [];
      kfs.forEach((kf, kfIdx) => {
        const isPointSelected = selectedPointIndex === kfIdx;
        const row = el('div', `point-row${isPointSelected ? ' point-row--selected' : ''}`);
        row.addEventListener('click', () => selectPoint(h.id, kfIdx));

        const label = el('span', 'point-row-label');
        label.textContent = `P${kfIdx + 1}`;

        const delPointBtn = el('button', 'point-row-delete');
        delPointBtn.textContent = '\u00D7';
        delPointBtn.title = 'Delete point';
        delPointBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          deleteKeyframe(h.id, kfIdx);
        });

        if (isPointSelected) {
          // Inline editable fields between label and delete button
          const fields = el('div', 'point-row-fields');
          fields.appendChild(inlineField('T', kf.time, (v) => updateKeyframe(h.id, kfIdx, 'time', v)));
          fields.appendChild(inlineField('X', parseCoord(kf.x), (v) => updateKeyframe(h.id, kfIdx, 'x', v)));
          fields.appendChild(inlineField('Y', parseCoord(kf.y), (v) => updateKeyframe(h.id, kfIdx, 'y', v)));
          row.append(label, fields, delPointBtn);
        } else {
          const info = el('span', 'point-row-info');
          info.textContent = `${fmtTime(kf.time)}  (${parseCoord(kf.x)}%, ${parseCoord(kf.y)}%)`;
          row.append(label, info, delPointBtn);
        }

        body.appendChild(row);
      });

      // Customize section
      const custHeader = el('div', 'customize-header');
      const custTitle = el('span', 'customize-title');
      custTitle.textContent = 'Customize';
      custHeader.appendChild(custTitle);
      body.appendChild(custHeader);

      const custGrid = el('div', 'customize-grid');

      custGrid.appendChild(sidebarSelect('Marker', ['dot', 'dot-label', 'numbered'], h.markerStyle, 'dot', (v) => {
        pushUndo();
        h.markerStyle = v as MarkerStyle;
        syncHotspot(h.id);
        updateJsonOutput();
      }));

      custGrid.appendChild(sidebarSelect('Trigger', ['hover', 'click'], h.trigger, 'click', (v) => {
        pushUndo();
        h.trigger = v as TriggerMode;
        syncHotspot(h.id);
        updateJsonOutput();
      }));

      custGrid.appendChild(sidebarSelect('Placement', ['top', 'bottom', 'left', 'right', 'auto'], h.placement, 'top', (v) => {
        pushUndo();
        h.placement = v as Placement;
        syncHotspot(h.id);
        updateJsonOutput();
      }));

      custGrid.appendChild(sidebarSelect('Animation', ['fade', 'scale', 'none'], h.animation, 'fade', (v) => {
        pushUndo();
        h.animation = v as HotspotAnimation;
        syncHotspot(h.id);
        updateJsonOutput();
      }));

      custGrid.appendChild(sidebarSelect('Interpolation', ['linear', 'catmull-rom'], h.interpolation, 'catmull-rom', (v) => {
        pushUndo();
        h.interpolation = v as InterpolationMode;
        syncHotspot(h.id);
        updateJsonOutput();
      }));

      body.appendChild(custGrid);

      // Actions
      const actions = el('div', 'hotspot-actions');
      const cardBtn = el('button', 'hotspot-btn hotspot-btn--card');
      cardBtn.textContent = 'Fill Card';
      cardBtn.addEventListener('click', () => openCardEditor(h.id));
      const delBtn = el('button', 'hotspot-btn hotspot-btn--delete');
      delBtn.textContent = 'Delete';
      delBtn.addEventListener('click', () => deleteHotspot(h.id));
      actions.append(cardBtn, delBtn);
      body.appendChild(actions);

      item.appendChild(body);
    }

    list.appendChild(item);
  });
  sidebar.appendChild(list);
}

function pointField(label: string, value: number, onChange: (v: number) => void): HTMLElement {
  const wrap = el('div', 'point-field');
  const lbl = el('label');
  lbl.textContent = label;
  const input = el('input') as HTMLInputElement;
  input.type = 'number';
  input.step = '0.1';
  input.value = String(Math.round(value * 100) / 100);
  input.addEventListener('change', () => {
    const v = parseFloat(input.value);
    if (!isNaN(v)) onChange(v);
  });
  wrap.append(lbl, input);
  return wrap;
}

function inlineField(label: string, value: number, onChange: (v: number) => void): HTMLElement {
  const wrap = el('div', 'point-row-field');
  const lbl = el('span', 'point-row-field-label');
  lbl.textContent = label;
  const input = el('input', 'point-row-field-input') as HTMLInputElement;
  input.type = 'number';
  input.step = '0.1';
  input.value = String(Math.round(value * 100) / 100);
  input.addEventListener('click', (e) => e.stopPropagation());
  input.addEventListener('change', () => {
    const v = parseFloat(input.value);
    if (!isNaN(v)) onChange(v);
  });
  wrap.append(lbl, input);
  return wrap;
}

function sidebarSelect(
  label: string,
  options: string[],
  current: string | undefined,
  defaultValue: string,
  onChange: (value: string) => void,
): HTMLElement {
  const field = el('div', 'customize-field');
  const lbl = el('span', 'customize-field-label');
  lbl.textContent = label;
  const select = el('select', 'customize-field-select') as HTMLSelectElement;
  options.forEach((opt) => {
    const option = el('option') as HTMLOptionElement;
    option.value = opt;
    option.textContent = opt;
    if ((current ?? defaultValue) === opt) option.selected = true;
    select.appendChild(option);
  });
  select.addEventListener('change', () => onChange(select.value));
  field.append(lbl, select);
  return field;
}

// ──────────────────── Timeline ────────────────────
function renderTimeline(): void {
  // Use a dedicated container so the plugin's renderIndicators() doesn't wipe our dots
  const bar = document.querySelector('.ci-video-hotspot-progress-bar') as HTMLElement | null;
  if (!bar) return;

  let track = bar.querySelector('.demo-kf-track') as HTMLElement | null;
  if (!track) {
    track = el('div', 'demo-kf-track');
    bar.appendChild(track);
  }
  track.innerHTML = '';

  if (mode === 'view') {
    renderViewDots(track);
  } else {
    renderEditorDots(track);
  }
}

function renderViewDots(track: HTMLElement): void {
  hotspots.forEach((h, hIdx) => {
    const dot = el('div', 'timeline-start-dot');
    dot.style.left = `${(h.startTime / videoDuration) * 100}%`;
    dot.style.backgroundColor = COLORS[hIdx % COLORS.length];
    dot.title = h.label;
    dot.addEventListener('click', (e) => {
      e.stopPropagation();
      viewer?.goToHotspot(h.id);
    });
    track.appendChild(dot);
  });
}

function renderEditorDots(track: HTMLElement): void {
  hotspots.forEach((h, hIdx) => {
    const color = COLORS[hIdx % COLORS.length];
    const isSelected = h.id === selectedHotspotId;
    const kfs = h.keyframes || [];

    if (selectedHotspotId && !isSelected) {
      // A hotspot is selected — hide other hotspots' dots
      return;
    }

    if (!selectedHotspotId) {
      // No hotspot selected — show only the first keyframe of each hotspot
      if (kfs.length > 0) {
        const dot = el('div', 'timeline-kf-dot');
        dot.style.left = `${(kfs[0].time / videoDuration) * 100}%`;
        dot.style.backgroundColor = color;
        dot.title = `${h.label} (${fmtTime(kfs[0].time)})`;
        dot.addEventListener('click', (e) => {
          e.stopPropagation();
          selectPoint(h.id, 0);
        });
        track.appendChild(dot);
      }
      return;
    }

    // Selected hotspot — show all keyframes with connecting line
    if (kfs.length > 1) {
      const line = el('div', 'timeline-kf-line');
      const startPct = (kfs[0].time / videoDuration) * 100;
      const endPct = (kfs[kfs.length - 1].time / videoDuration) * 100;
      line.style.left = `${startPct}%`;
      line.style.width = `${endPct - startPct}%`;
      line.style.backgroundColor = color;
      track.appendChild(line);
    }

    kfs.forEach((kf, kfIdx) => {
      const dot = el('div', 'timeline-kf-dot');
      dot.style.left = `${(kf.time / videoDuration) * 100}%`;
      dot.style.backgroundColor = color;

      if (kfIdx === selectedPointIndex) {
        dot.classList.add('timeline-kf-dot--selected');
      } else {
        dot.classList.add('timeline-kf-dot--secondary');
      }

      dot.title = `${h.label} P${kfIdx + 1} (${fmtTime(kf.time)})`;

      dot.addEventListener('click', (e) => {
        e.stopPropagation();
        selectPoint(h.id, kfIdx);
      });

      // Drag to change time
      makeTimelineDotDraggable(dot, h, kfIdx);

      track.appendChild(dot);
    });
  });
}

function makeTimelineDotDraggable(dot: HTMLElement, hotspot: VideoHotspotItem, kfIdx: number): void {
  let pointerDown = false;
  let isDragging = false;
  let startX = 0;

  dot.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    pointerDown = true;
    isDragging = false;
    startX = e.clientX;
    dot.setPointerCapture(e.pointerId);

    // Select this point immediately so the view doesn't jump to the old selection
    selectedHotspotId = hotspot.id;
    selectedPointIndex = kfIdx;
  });

  dot.addEventListener('pointermove', (e) => {
    if (!pointerDown) return;
    if (!isDragging && Math.abs(e.clientX - startX) < 3) return;
    isDragging = true;
    const track = dot.parentElement!;
    const rect = track.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    dot.style.left = `${pct * 100}%`;
    viewer?.seek(pct * videoDuration);
  });

  dot.addEventListener('pointerup', (e) => {
    if (!pointerDown) return;
    pointerDown = false;

    if (!isDragging) {
      // Simple click — let the click handler call selectPoint()
      isDragging = false;
      return;
    }

    isDragging = false;
    const track = dot.parentElement!;
    const rect = track.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const newTime = Math.round(pct * videoDuration * 10) / 10;

    const kf = hotspot.keyframes?.[kfIdx];
    if (kf) {
      kf.time = newTime;
      hotspot.keyframes!.sort((a, b) => a.time - b.time);
      hotspot.startTime = hotspot.keyframes![0].time;
      hotspot.endTime = hotspot.keyframes![hotspot.keyframes!.length - 1].time;
      hotspot.x = hotspot.keyframes![0].x;
      hotspot.y = hotspot.keyframes![0].y;
      // Update selectedPointIndex — index may have changed after sort
      selectedPointIndex = hotspot.keyframes!.indexOf(kf);
    }

    pushUndo();
    syncHotspot(hotspot.id);
    updateJsonOutput();
  });
}

// Playhead is handled by the player's built-in progress bar

// ──────────────────── Card Editor ────────────────────
function openCardEditor(hotspotId: string): void {
  const hotspot = hotspots.find(h => h.id === hotspotId);
  if (!hotspot) return;

  const data: Record<string, string> = { ...(hotspot.data || {}) } as Record<string, string>;
  const overlay = document.getElementById('card-editor-overlay')!;
  const modal = document.getElementById('card-editor-modal')!;
  overlay.classList.add('card-editor-overlay--visible');
  modal.innerHTML = '';

  const title = el('h3', 'card-editor-title');
  title.textContent = 'Edit Hotspot Card';
  modal.appendChild(title);

  const fields: Array<{ key: string; label: string; type: 'text' | 'textarea' }> = [
    { key: 'title', label: 'Title', type: 'text' },
    { key: 'price', label: 'Price', type: 'text' },
    { key: 'originalPrice', label: 'Original Price', type: 'text' },
    { key: 'description', label: 'Description', type: 'textarea' },
    { key: 'image', label: 'Image URL', type: 'text' },
    { key: 'url', label: 'Link URL', type: 'text' },
    { key: 'ctaText', label: 'CTA Button Text', type: 'text' },
    { key: 'badge', label: 'Badge', type: 'text' },
  ];

  fields.forEach(({ key, label, type }) => {
    const field = el('div', 'card-editor-field');
    const lbl = el('label');
    lbl.textContent = label;
    field.appendChild(lbl);

    if (type === 'textarea') {
      const ta = el('textarea') as HTMLTextAreaElement;
      ta.value = data[key] || '';
      ta.addEventListener('input', () => { data[key] = ta.value; });
      field.appendChild(ta);
    } else {
      const inp = el('input') as HTMLInputElement;
      inp.type = 'text';
      inp.value = data[key] || '';
      inp.addEventListener('input', () => { data[key] = inp.value; });
      field.appendChild(inp);
    }
    modal.appendChild(field);
  });

  // Actions
  const actions = el('div', 'card-editor-actions');
  const cancelBtn = el('button', 'card-editor-btn card-editor-btn--cancel');
  cancelBtn.textContent = 'Cancel';
  cancelBtn.addEventListener('click', closeCardEditor);
  const saveBtn = el('button', 'card-editor-btn card-editor-btn--save');
  saveBtn.textContent = 'Save';
  saveBtn.addEventListener('click', () => {
    hotspot.data = { ...data };
    closeCardEditor();
  });
  actions.append(cancelBtn, saveBtn);
  modal.appendChild(actions);

  // Close on overlay click or Escape
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeCardEditor();
  });
  document.addEventListener('keydown', handleCardEditorEscape);
}

function closeCardEditor(): void {
  document.getElementById('card-editor-overlay')!.classList.remove('card-editor-overlay--visible');
  document.removeEventListener('keydown', handleCardEditorEscape);
}

function handleCardEditorEscape(e: KeyboardEvent): void {
  if (e.key === 'Escape') closeCardEditor();
}

// ──────────────────── Sample Data ────────────────────
function getSampleHotspots(): VideoHotspotItem[] {
  return [
    {
      id: 'hotspot-4',
      x: '48.53%',
      y: '45.64%',
      startTime: 0.6,
      endTime: 14.7,
      label: 'Television',
      interpolation: 'catmull-rom' as const,
      keyframes: [
        { time: 0.6, x: '48.53%', y: '45.64%' },
        { time: 1.6, x: '50%', y: '45.82%' },
        { time: 2.3, x: '50.61%', y: '45.27%' },
        { time: 3, x: '51.23%', y: '45.09%' },
        { time: 4.5, x: '52.08%', y: '45.09%' },
        { time: 5.3, x: '51.35%', y: '44.55%' },
        { time: 6.2, x: '49.26%', y: '44.91%' },
        { time: 7.3, x: '47.92%', y: '44.91%' },
        { time: 9.4, x: '48.65%', y: '44.91%' },
        { time: 10.7, x: '47.43%', y: '45.82%' },
        { time: 12.2, x: '45.34%', y: '46.18%' },
        { time: 13.2, x: '45.34%', y: '46%' },
        { time: 14.7, x: '43.87%', y: '46.18%' },
      ],
      data: {
        title: 'Smart Television',
        price: '$899',
        originalPrice: '$1,199',
        badge: '-25%',
        description: 'Ultra HD smart TV with immersive sound and streaming built-in.',
        image: 'https://picsum.photos/320/180?random=10',
        ctaText: 'Shop Now',
      },
    },
    {
      id: 'hotspot-6',
      x: '36.64%',
      y: '69.64%',
      startTime: 2.2,
      endTime: 12.8,
      label: 'Pouf',
      interpolation: 'catmull-rom' as const,
      keyframes: [
        { time: 2.2, x: '36.64%', y: '69.64%' },
        { time: 4.1, x: '34.8%', y: '66.36%' },
        { time: 5.9, x: '28.68%', y: '65.09%' },
        { time: 7.2, x: '24.88%', y: '63.09%' },
        { time: 8.6, x: '23.9%', y: '60%' },
        { time: 9.3, x: '23.41%', y: '58.91%' },
        { time: 10.6, x: '21.94%', y: '57.09%' },
        { time: 11.7, x: '19.98%', y: '55.64%' },
        { time: 12.8, x: '21.32%', y: '52.91%' },
      ],
      data: {
        title: 'Knitted Pouf',
        price: '$79',
        description: 'Handcrafted knitted pouf — perfect as extra seating or a footrest.',
        image: 'https://picsum.photos/320/180?random=11',
        ctaText: 'Add to Cart',
      },
    },
    {
      id: 'hotspot-7',
      x: '74.39%',
      y: '33.64%',
      startTime: 5.5,
      endTime: 14.1,
      label: 'Fireplace',
      interpolation: 'catmull-rom' as const,
      keyframes: [
        { time: 5.5, x: '74.39%', y: '33.64%' },
        { time: 6, x: '73.65%', y: '34.36%' },
        { time: 6.6, x: '73.28%', y: '34.18%' },
        { time: 8.2, x: '76.35%', y: '35.64%' },
        { time: 9.6, x: '79.66%', y: '37.64%' },
        { time: 12.6, x: '81.25%', y: '43.45%' },
        { time: 14.1, x: '80.02%', y: '46%' },
      ],
      data: {
        title: 'Electric Fireplace',
        price: '$349',
        originalPrice: '$499',
        badge: '-30%',
        description: 'Modern electric fireplace with realistic flame effect and remote control.',
        image: 'https://picsum.photos/320/180?random=12',
        ctaText: 'Shop Now',
      },
    },
  ];
}

// ──────────────────── Helpers ────────────────────
function el(tag: string, className?: string): HTMLElement {
  const e = document.createElement(tag);
  if (className) e.className = className;
  return e;
}

function fmtTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function parseCoord(v: string | number): number {
  if (typeof v === 'number') return v;
  return parseFloat(v) || 0;
}

// ──────────────────── Keyboard Shortcuts ────────────────────
function setupKeyboardShortcuts(): void {
  document.addEventListener('keydown', (e) => {
    // Don't handle shortcuts when typing in inputs
    const tag = (e.target as HTMLElement).tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

    // Ctrl+Z / Ctrl+Shift+Z
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
      e.preventDefault();
      if (e.shiftKey) {
        redo();
      } else {
        undo();
      }
      return;
    }

    switch (e.key) {
      case 'a':
      case 'A':
        if (mode !== 'editor') {
          setMode('editor');
        }
        placementMode = true;
        document.getElementById('video-area')!.classList.add('app-video-area--crosshair');
        break;

      case 'v':
      case 'V':
        if (mode !== 'editor') {
          setMode('editor');
        }
        placementMode = false;
        document.getElementById('video-area')!.classList.remove('app-video-area--crosshair');
        break;

      case 'Delete':
        if (mode === 'editor' && selectedHotspotId) {
          deleteHotspot(selectedHotspotId);
        }
        break;

      case 'Escape':
        if (placementMode) {
          placementMode = false;
          document.getElementById('video-area')!.classList.remove('app-video-area--crosshair');
        } else if (selectedHotspotId) {
          selectedHotspotId = null;
          selectedPointIndex = null;
          updateMarkerVisibility();
          renderSidebar();
          renderTimeline();
        }
        break;

      case ' ':
        e.preventDefault();
        if (viewer) {
          const video = document.querySelector('.ci-video-hotspot-video') as HTMLVideoElement;
          if (video && !video.paused) {
            viewer.pause();
          } else {
            viewer.play();
          }
        }
        break;
    }
  });
}

// ──────────────────── Start ────────────────────
init();