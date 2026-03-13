<p align="center">
  <img src="https://scaleflex.cloudimg.io/v7/plugins/js-cloudimage-360-view/logo_scaleflex_on_white_bg.jpg?vh=91b12d&w=700" alt="Scaleflex" width="350">
</p>

<h1 align="center">js-cloudimage-video-hotspot</h1>

<p align="center">
  Interactive video hotspots with time-based markers, keyframe motion, chapters, and accessibility. Zero dependencies.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/js-cloudimage-video-hotspot"><img src="https://img.shields.io/npm/v/js-cloudimage-video-hotspot.svg?style=flat-square" alt="npm version"></a>
  <a href="https://www.npmjs.com/package/js-cloudimage-video-hotspot"><img src="https://img.shields.io/npm/dm/js-cloudimage-video-hotspot.svg?style=flat-square" alt="npm downloads"></a>
  <a href="https://github.com/scaleflex/js-cloudimage-video-hotspot/blob/main/LICENSE"><img src="https://img.shields.io/npm/l/js-cloudimage-video-hotspot.svg?style=flat-square" alt="license"></a>
  <a href="https://bundlephobia.com/package/js-cloudimage-video-hotspot"><img src="https://img.shields.io/bundlephobia/minzip/js-cloudimage-video-hotspot?style=flat-square" alt="bundle size"></a>
</p>

---

## Why js-cloudimage-video-hotspot?

Turn any video into a shoppable, interactive experience. Hotspots appear, move, and disappear in sync with the video timeline — perfect for product showcases, virtual tours, and interactive storytelling.

- **Lightweight** — under 20 KB gzipped with zero runtime dependencies
- **Time-based hotspots** — appear and disappear at precise moments in the video
- **Object-tracking keyframes** — hotspots follow moving objects at 60fps
- **Accessible by default** — WCAG 2.1 AA compliant out of the box
- **Framework-agnostic** — works with vanilla JS, React, or any framework
- **Shoppable timeline** — visual indicators on the progress bar show where hotspots are
- **Optional Cloudimage CDN** — serve optimally-sized poster images automatically

---

## Features

- **Time-based markers** — Hotspots with `startTime`/`endTime` that appear and disappear during playback
- **Keyframe motion paths** — Hotspots follow objects via interpolated keyframes with easing functions
- **Timeline indicators** — Golden dots or ranges on the progress bar showing hotspot locations
- **Pause-on-interact** — Video auto-pauses when a hotspot is clicked, resumes when popovers close
- **Chapters** — Named video segments with navigation dropdown and progress bar dividers
- **Hotspot navigation** — Prev/next buttons with "2 of 7" counter for sequential browsing
- **Popover system** — Click or hover triggers with built-in flip/shift positioning
- **Custom controls** — Play/pause, volume, speed (0.5x-2x), time display, fullscreen
- **WCAG 2.1 AA** — Full keyboard navigation, ARIA attributes, focus management, reduced motion
- **CSS variable theming** — Light and dark themes, 40+ customizable variables
- **Two init methods** — JavaScript API and HTML data-attributes
- **React wrapper** — Separate entry point with component, hook, and ref API
- **TypeScript** — Full type definitions

## Installation

```bash
npm install js-cloudimage-video-hotspot
```

### CDN

```html
<script src="https://scaleflex.cloudimg.io/v7/plugins/js-cloudimage-video-hotspot/1.0.0/js-cloudimage-video-hotspot.min.js?func=proxy"></script>
```

## Quick Start

### Up and running in under a minute

Install from npm or load from CDN — choose the method that fits your workflow.

**Try it live:** [Vanilla](https://codesandbox.io/p/devbox/github/scaleflex/js-cloudimage-video-hotspot/tree/main/examples/vanilla) | [React](https://codesandbox.io/p/devbox/github/scaleflex/js-cloudimage-video-hotspot/tree/main/examples/react)

### JavaScript API

```js
import CIVideoHotspot from 'js-cloudimage-video-hotspot';

const player = new CIVideoHotspot('#shoppable-video', {
  src: 'https://example.com/fashion-show.mp4',
  poster: 'https://example.com/fashion-poster.jpg',
  pauseOnInteract: true,
  hotspots: [
    {
      id: 'bag',
      x: '65%',
      y: '40%',
      startTime: 12,
      endTime: 25,
      label: 'Designer Bag',
      data: {
        title: 'Designer Bag',
        price: '$899',
        image: 'https://example.com/bag.jpg',
        url: '/products/bag',
      },
      keyframes: [
        { time: 12, x: 65, y: 40 },
        { time: 18, x: 55, y: 45 },
        { time: 25, x: 70, y: 35 },
      ],
      easing: 'ease-in-out',
    },
    {
      id: 'shoes',
      x: '30%',
      y: '85%',
      startTime: 30,
      endTime: 45,
      label: 'Leather Shoes',
      data: { title: 'Leather Shoes', price: '$349' },
    },
  ],
  onHotspotClick(hotspot) {
    console.log('Clicked:', hotspot.id);
  },
});
```

### HTML Data-Attributes

```html
<div
  data-ci-video-hotspot-src="https://example.com/video.mp4"
  data-ci-video-hotspot-poster="https://example.com/poster.jpg"
  data-ci-video-hotspot-theme="dark"
  data-ci-video-hotspot-items='[
    {"id":"bag","x":"65%","y":"40%","startTime":12,"endTime":25,"label":"Bag","data":{"title":"Bag","price":"$899"}}
  ]'
></div>

<script>CIVideoHotspot.autoInit();</script>
```

## API Reference

### Constructor

```ts
new CIVideoHotspot(element: HTMLElement | string, config: CIVideoHotspotConfig)
```

### Config

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `src` | `string` | — | Video source URL (required) |
| `hotspots` | `VideoHotspotItem[]` | — | Array of hotspot definitions (required) |
| `sources` | `{src, type}[]` | — | Multiple video sources for format fallback |
| `poster` | `string` | — | Poster image URL |
| `trigger` | `'hover' \| 'click'` | `'click'` | Popover trigger mode |
| `placement` | `Placement` | `'top'` | Default popover placement |
| `pauseOnInteract` | `boolean` | `true` | Pause video on hotspot interaction |
| `theme` | `'light' \| 'dark'` | `'light'` | Theme |
| `pulse` | `boolean` | `true` | Marker pulse animation |
| `controls` | `boolean` | `true` | Show custom video controls |
| `fullscreenButton` | `boolean` | `true` | Show fullscreen button |
| `hotspotNavigation` | `boolean` | `false` | Show prev/next hotspot buttons |
| `chapterNavigation` | `boolean` | `false` | Show chapter dropdown |
| `hotspotAnimation` | `'fade' \| 'scale' \| 'none'` | `'fade'` | Hotspot entrance/exit animation |
| `timelineIndicators` | `'dot' \| 'range' \| 'none'` | `'dot'` | Hotspot indicators on progress bar |
| `autoplay` | `boolean` | `false` | Auto-play video on load |
| `loop` | `boolean` | `false` | Loop video |
| `muted` | `boolean` | `false` | Mute video (auto-set when `autoplay: true`) |
| `chapters` | `VideoChapter[]` | — | Chapter definitions |
| `renderPopover` | `(hotspot) => string \| HTMLElement` | — | Custom popover render |
| `renderMarker` | `(hotspot) => string \| HTMLElement` | — | Custom marker render |
| `cloudimage` | `CloudimageConfig` | — | Cloudimage CDN config for poster |
| `onReady` | `() => void` | — | Video ready callback |
| `onPlay` | `() => void` | — | Play callback |
| `onPause` | `() => void` | — | Pause callback |
| `onTimeUpdate` | `(time) => void` | — | Time update callback |
| `onHotspotShow` | `(hotspot) => void` | — | Hotspot shown callback |
| `onHotspotHide` | `(hotspot) => void` | — | Hotspot hidden callback |
| `onHotspotClick` | `(hotspot) => void` | — | Hotspot click callback |
| `onOpen` | `(hotspot) => void` | — | Popover open callback |
| `onClose` | `(hotspot) => void` | — | Popover close callback |
| `onChapterChange` | `(chapter) => void` | — | Chapter change callback |
| `onFullscreenChange` | `(isFullscreen) => void` | — | Fullscreen change callback |

### VideoHotspotItem

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Unique identifier (required) |
| `x` | `string \| number` | X coordinate: `'65%'` or number `0-100` |
| `y` | `string \| number` | Y coordinate: `'40%'` or number `0-100` |
| `startTime` | `number` | Time in seconds when hotspot appears (required) |
| `endTime` | `number` | Time in seconds when hotspot disappears (required) |
| `label` | `string` | Accessible label (required) |
| `keyframes` | `Keyframe[]` | Motion keyframes: `[{time, x, y}, ...]` |
| `easing` | `'linear' \| 'ease-in' \| 'ease-out' \| 'ease-in-out'` | Keyframe easing function |
| `data` | `PopoverData` | Data for built-in template |
| `content` | `string` | HTML content (sanitized) |
| `trigger` | `'hover' \| 'click'` | Override global trigger |
| `placement` | `Placement` | Override global placement |
| `markerStyle` | `'dot' \| 'dot-label' \| 'icon' \| 'numbered'` | Marker visual style |
| `pauseOnShow` | `boolean` | Pause video when hotspot appears |
| `pauseOnInteract` | `boolean` | Override global pauseOnInteract |
| `animation` | `'fade' \| 'scale' \| 'none'` | Override global animation |
| `chapterId` | `string` | Associate with a chapter |
| `onClick` | `(event, hotspot) => void` | Custom click handler |

### PopoverData

| Field | Type | Description |
|-------|------|-------------|
| `title` | `string` | Popover heading |
| `price` | `string` | Current price |
| `originalPrice` | `string` | Strikethrough price |
| `description` | `string` | Description text |
| `image` | `string` | Product image URL |
| `url` | `string` | Link URL for the CTA button |
| `ctaText` | `string` | CTA button label (default: `'View details'`) |
| `badge` | `string` | Badge text (e.g. `'New'`, `'Sale'`) |

### VideoChapter

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Unique chapter identifier |
| `title` | `string` | Chapter display title |
| `startTime` | `number` | Chapter start time in seconds |
| `endTime` | `number` | Chapter end time (optional, auto-calculated) |

### Instance Methods

```ts
// Video controls
player.play(): void
player.pause(): void
player.seek(time: number): void
player.getCurrentTime(): number
player.getDuration(): number
player.setVolume(level: number): void
player.setPlaybackRate(rate: number): void
player.mute(): void
player.unmute(): void

// Hotspot management
player.open(id: string): void
player.close(id: string): void
player.closeAll(): void
player.addHotspot(hotspot: VideoHotspotItem): void
player.removeHotspot(id: string): void
player.updateHotspot(id: string, updates: Partial<VideoHotspotItem>): void
player.getVisibleHotspots(): VideoHotspotItem[]

// Navigation
player.nextHotspot(): void
player.prevHotspot(): void
player.goToHotspot(id: string): void
player.goToChapter(id: string): void
player.getCurrentChapter(): VideoChapter | undefined

// Fullscreen & lifecycle
player.enterFullscreen(): void
player.exitFullscreen(): void
player.update(config: Partial<CIVideoHotspotConfig>): void
player.destroy(): void
```

### Static Methods

```ts
CIVideoHotspot.autoInit(root?: HTMLElement): CIVideoHotspotInstance[]
```

## React Usage

```tsx
import { CIVideoHotspotViewer, useCIVideoHotspot } from 'js-cloudimage-video-hotspot/react';

// Component
function ShoppableVideo() {
  return (
    <CIVideoHotspotViewer
      src="/fashion-show.mp4"
      poster="/poster.jpg"
      pauseOnInteract
      hotspots={[
        {
          id: 'bag',
          x: '65%',
          y: '40%',
          startTime: 12,
          endTime: 25,
          label: 'Designer Bag',
          data: { title: 'Designer Bag', price: '$899' },
        },
      ]}
      onHotspotClick={(h) => console.log('Clicked:', h.id)}
    />
  );
}

// Hook
function ShoppableVideo() {
  const { containerRef, instance } = useCIVideoHotspot({
    src: '/video.mp4',
    hotspots: [...],
  });

  return (
    <>
      <div ref={containerRef} />
      <button onClick={() => instance.current?.nextHotspot()}>Next</button>
    </>
  );
}

// Ref API
function ShoppableVideo() {
  const ref = useRef<CIVideoHotspotViewerRef>(null);
  return (
    <>
      <CIVideoHotspotViewer ref={ref} src="/video.mp4" hotspots={[...]} />
      <button onClick={() => ref.current?.goToHotspot('bag')}>Show Bag</button>
    </>
  );
}
```

## Chapters

Divide long videos into navigable chapters, each with its own hotspots:

```js
const player = new CIVideoHotspot('#el', {
  src: '/product-tour.mp4',
  chapterNavigation: true,
  chapters: [
    { id: 'intro', title: 'Introduction', startTime: 0 },
    { id: 'features', title: 'Key Features', startTime: 30 },
    { id: 'pricing', title: 'Pricing', startTime: 90 },
  ],
  hotspots: [
    { id: 'h1', x: '50%', y: '50%', startTime: 35, endTime: 50, label: 'Feature A', chapterId: 'features' },
    { id: 'h2', x: '30%', y: '70%', startTime: 95, endTime: 110, label: 'Plan B', chapterId: 'pricing' },
  ],
});

// Navigate programmatically
player.goToChapter('features');
player.getCurrentChapter(); // { id: 'features', title: 'Key Features', ... }
```

## Keyframe Motion

Hotspots can follow moving objects by defining motion keyframes:

```js
{
  id: 'bag',
  x: '50%',
  y: '50%',
  startTime: 10,
  endTime: 30,
  label: 'Designer Bag',
  easing: 'ease-in-out',
  keyframes: [
    { time: 10, x: 50, y: 50 },
    { time: 15, x: 40, y: 55 },
    { time: 20, x: 35, y: 60 },
    { time: 25, x: 45, y: 50 },
    { time: 30, x: 55, y: 45 },
  ],
}
```

The plugin interpolates between keyframes at 60fps using `requestAnimationFrame`.

## Theming

All visuals are customizable via CSS variables:

```css
.my-player {
  --ci-video-hotspot-marker-size: 32px;
  --ci-video-hotspot-marker-bg: rgba(0, 88, 163, 0.8);
  --ci-video-hotspot-pulse-color: rgba(0, 88, 163, 0.3);
  --ci-video-hotspot-popover-bg: #ffffff;
  --ci-video-hotspot-popover-border-radius: 12px;
  --ci-video-hotspot-cta-bg: #e63946;
  --ci-video-hotspot-controls-bg: rgba(0, 0, 0, 0.8);
  --ci-video-hotspot-progress-color: #ff6b35;
  --ci-video-hotspot-indicator-color: #ffd700;
}
```

Set `theme: 'dark'` for the built-in dark theme.

## Accessibility

- All markers are `<button>` elements with `aria-label`
- `Space` / `K` — play/pause
- `Arrow Left/Right` — seek 5s / 10s
- `Arrow Up/Down` — volume control
- `N` / `P` — next/previous hotspot
- `F` — toggle fullscreen
- `M` — toggle mute
- `Escape` — close popovers
- `Tab` / `Shift+Tab` — navigate markers
- Focus trapping in popovers with interactive content
- Screen reader announcements for hotspot and chapter changes
- `prefers-reduced-motion` disables animations

## Cloudimage Integration

```js
new CIVideoHotspot('#el', {
  src: '/video.mp4',
  poster: 'https://example.com/poster.jpg',
  cloudimage: {
    token: 'demo',
    params: 'q=80',
  },
  hotspots: [...],
});
```

## Browser Support

| Browser | Version |
|---------|---------|
| Chrome  | 80+     |
| Firefox | 80+     |
| Safari  | 14+     |
| Edge    | 80+     |

## License

[MIT](./LICENSE)

---

<p align="center">
  Made with care by the <a href="https://www.scaleflex.com">Scaleflex</a> team
</p>
