# Fix: Timeline Hotspot Click Behavior

## Проблемы

1. **Карточка не открывается при клике на таймлайне**: метод `open()` (hotspot-manager.ts:250) ничего не делает, если marker/popover ещё не созданы (race condition с timeUpdate — 100ms таймер может сработать раньше, чем создадутся элементы)
2. **Несколько карточек открыты одновременно**: `seekAndOpen` не вызывает `closeAll()` перед открытием новой карточки
3. **Видео не возобновляется после закрытия карточки**: `seekAndOpen` ставит паузу напрямую (строка 44) без установки флага `wasPlayingBeforePause`

## Файлы для изменения

### 1. `src/core/hotspot-manager.ts`

**Изменение в `open()` (строки 250-259):**
Если marker/popover ещё не существуют — вызвать `showHotspot()` для их создания. `showHotspot` уже имеет guard на строке 57 (`if (this.markers.has(hotspot.id)) return`), поэтому повторный вызов безопасен.

```typescript
// БЫЛО:
open(id: string): void {
  const popover = this.popovers.get(id);
  const marker = this.markers.get(id);
  if (popover && marker) {
    popover.show();
    setMarkerActive(marker, true);
    this.openPopovers.add(id);
    this.handleHotspotInteract(id);
  }
}

// СТАЛО:
open(id: string): void {
  // Ensure marker and popover exist (they may not if timeUpdate hasn't fired yet)
  if (!this.markers.has(id) || !this.popovers.has(id)) {
    const hotspot = this.normalizedHotspots.get(id);
    if (!hotspot) return;
    this.showHotspot(hotspot);
  }

  const popover = this.popovers.get(id);
  const marker = this.markers.get(id);
  if (popover && marker) {
    popover.show();
    setMarkerActive(marker, true);
    this.openPopovers.add(id);
    this.handleHotspotInteract(id);
  }
}
```

**Новый метод `setWasPlayingBeforePause` (после `onUserPause()`, строка 248):**

```typescript
/** Allow navigation manager to set play-state tracking for seek-and-open */
setWasPlayingBeforePause(value: boolean): void {
  this.wasPlayingBeforePause = value;
  if (value) {
    this.userPausedDuringInteract = false;
  }
}
```

### 2. `src/core/navigation-manager.ts`

**Изменение в `seekAndOpen()` (строки 40-51):**

```typescript
// БЫЛО:
private seekAndOpen(startTime: number, id: string): void {
  const duration = this.ctx.player.getDuration();
  const clampedTime = Math.max(0, Math.min(startTime, duration));
  this.ctx.player.seek(clampedTime);
  this.ctx.player.pause();
  const timer = setTimeout(() => {
    this.activeTimers.delete(timer);
    this.hotspotManager.open(id);
  }, SEEK_SETTLE_MS);
  this.activeTimers.add(timer);
}

// СТАЛО:
private seekAndOpen(startTime: number, id: string): void {
  // Cancel pending open timers (prevent stale opens from rapid clicks)
  for (const timer of this.activeTimers) {
    clearTimeout(timer);
  }
  this.activeTimers.clear();

  // Close any currently open cards
  this.hotspotManager.closeAll();

  const duration = this.ctx.player.getDuration();
  const clampedTime = Math.max(0, Math.min(startTime, duration));

  // Track play state before pausing so resume-on-close works
  this.hotspotManager.setWasPlayingBeforePause(!this.ctx.player.isPaused());

  this.ctx.player.seek(clampedTime);
  this.ctx.player.pause();

  // Force timeline update so markers are created at the seeked time
  this.hotspotManager.processTimeUpdate(clampedTime);

  // Open after a brief settle to let the seek complete visually
  const timer = setTimeout(() => {
    this.activeTimers.delete(timer);
    this.hotspotManager.open(id);
  }, SEEK_SETTLE_MS);
  this.activeTimers.add(timer);
}
```

### 3. `src/core/manager-types.ts`

**Добавить в `HotspotManagerInterface` (после строки 37):**

```typescript
setWasPlayingBeforePause(value: boolean): void;
```

## Верификация

```bash
npm run build
```

Затем ручное тестирование:
- Клик на хотспот на таймлайне → пауза + перемотка + карточка открывается
- Закрытие карточки → видео продолжает воспроизведение
- Клик на другой хотспот при открытой карточке → старая закрывается, новая открывается
- Быстрые последовательные клики → только последний хотспот открыт
- Если видео было на паузе до клика → после закрытия карточки пауза сохраняется
