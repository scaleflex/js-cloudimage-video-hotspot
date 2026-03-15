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

<p align="center">
  <a href="https://scaleflex.github.io/js-cloudimage-video-hotspot/">Live Demo</a> |
  <a href="https://scaleflex.github.io/js-cloudimage-video-hotspot/editor.html">Visual Editor</a> |
  <a href="https://codesandbox.io/p/devbox/github/scaleflex/js-cloudimage-video-hotspot/tree/master/examples/vanilla">Vanilla Sandbox</a> |
  <a href="https://codesandbox.io/p/devbox/github/scaleflex/js-cloudimage-video-hotspot/tree/master/examples/react">React Sandbox</a>
</p>

---

## Why js-cloudimage-video-hotspot?

Turn any video into a shoppable, interactive experience. Hotspots appear, move, and disappear in sync with the video timeline — perfect for product showcases, virtual tours, and interactive storytelling.

- **Lightweight** — under 20 KB gzipped with zero runtime dependencies
- **Time-based hotspots** — appear and disappear at precise moments in the video
- **Object-tracking keyframes** — hotspots follow moving objects at 60 fps
- **Accessible by default** — WCAG 2.1 AA compliant out of the box
- **Framework-agnostic** — works with vanilla JS, React, or any framework
- **Multi-player support** — HTML5, HLS, YouTube, and Vimeo via adapter pattern
- **Shoppable popover cards** — built-in product template with gallery, variants, rating, wishlist, and countdown

---

## Features

| Category | Details |
|----------|---------|
| **Hotspots** | Time-based visibility, keyframe motion paths (linear & Catmull-Rom), easing functions, entrance/exit animations (fade, scale) |
| **Popovers** | Click or hover trigger, flip/shift auto-positioning, built-in product card template, custom render function |
| **Product card** | Image gallery carousel, star rating, size/color/material variants, wishlist toggle, countdown timer, add-to-cart with analytics |
| **Chapters** | Named video segments, navigation dropdown, progress bar dividers |
| **Controls** | Play/pause, volume, speed (0.5x-2x), time display, fullscreen, hotspot prev/next, timeline hotspot indicators |
| **Players** | HTML5 video, HLS (via hls.js), YouTube IFrame API, Vimeo Player SDK — auto-detected from URL |
| **Accessibility** | Keyboard navigation, ARIA attributes, focus traps, screen reader live region, `prefers-reduced-motion` |
| **Theming** | Light and dark themes, 40+ CSS custom properties |
| **React** | `<CIVideoHotspotViewer>` component, `useCIVideoHotspot` hook, ref API |
| **Analytics** | Unified `onAnalytics` callback for all interactions (show, click, open, close, CTA, add-to-cart, variant, wishlist) |

## Installation

```bash
npm install js-cloudimage-video-hotspot
```

### CDN

```html
<script src="https://scaleflex.cloudimg.io/v7/plugins/js-cloudimage-video-hotspot/1.1.1/js-cloudimage-video-hotspot.min.js?vh=c33dff&func=proxy"></script>
```

### Optional peer dependencies

| Package | When needed |
|---------|-------------|
| `hls.js` | HLS streams (`.m3u8`) on non-Safari browsers |
| `@vimeo/player` | Vimeo video URLs |
| React / React DOM | React wrapper (`/react` export) |

YouTube adapter loads the IFrame API from CDN automatically — no install needed.

## Quick Start

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
  onHotspotClick(event, hotspot) {
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

---

## API Reference

### Constructor

```ts
new CIVideoHotspot(element: HTMLElement | string, config: CIVideoHotspotConfig)
```

### Config

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `src` | `string` | *required* | Video source URL |
| `hotspots` | `VideoHotspotItem[]` | *required* | Array of hotspot definitions |
| `sources` | `{src, type}[]` | — | Multiple video sources for format fallback |
| `poster` | `string` | — | Poster image URL |
| `alt` | `string` | — | Accessible description of the video |
| `playerType` | `'auto' \| 'html5' \| 'hls' \| 'youtube' \| 'vimeo'` | `'auto'` | Player engine (auto-detected from URL) |
| `hls` | `HLSConfig` | — | HLS-specific options (`enableWorker`, `startLevel`, `capLevelToPlayerSize`) |
| `trigger` | `'hover' \| 'click'` | `'click'` | Popover trigger mode |
| `placement` | `'top' \| 'bottom' \| 'left' \| 'right' \| 'auto'` | `'top'` | Default popover placement |
| `pauseOnInteract` | `boolean` | `true` | Pause video on hotspot interaction |
| `theme` | `'light' \| 'dark'` | `'light'` | Color theme |
| `pulse` | `boolean` | `true` | Marker pulse animation |
| `hotspotAnimation` | `'fade' \| 'scale' \| 'none'` | `'fade'` | Hotspot entrance/exit animation |
| `timelineIndicators` | `'dot' \| 'range' \| 'none'` | `'dot'` | Hotspot indicators on progress bar |
| `clickToPlay` | `boolean` | `true` | Toggle play/pause on click in video area |
| `controls` | `boolean` | `true` | Show custom video controls |
| `fullscreenButton` | `boolean` | `true` | Show fullscreen button |
| `hotspotNavigation` | `boolean` | `true` | Show prev/next hotspot buttons |
| `chapterNavigation` | `boolean` | `true` | Show chapter dropdown (requires `chapters`) |
| `autoplay` | `boolean` | `false` | Auto-play video on load |
| `loop` | `boolean` | `false` | Loop video |
| `muted` | `boolean` | `false` | Mute video (auto-set to `true` when `autoplay: true`) |
| `chapters` | `VideoChapter[]` | — | Chapter definitions |
| `renderPopover` | `(hotspot) => string \| HTMLElement` | — | Custom popover render function |
| `renderMarker` | `(hotspot) => string \| HTMLElement` | — | Custom marker render function |
| `cloudimage` | `CloudimageConfig` | — | Cloudimage CDN config for poster |

### Callbacks

| Callback | Signature | Description |
|----------|-----------|-------------|
| `onReady` | `() => void` | Video ready to play |
| `onPlay` | `() => void` | Video started playing |
| `onPause` | `() => void` | Video paused |
| `onTimeUpdate` | `(currentTime: number) => void` | Time update (~4 Hz) |
| `onHotspotShow` | `(hotspot) => void` | Hotspot became visible |
| `onHotspotHide` | `(hotspot) => void` | Hotspot became hidden |
| `onHotspotClick` | `(event, hotspot) => void` | Hotspot marker clicked |
| `onOpen` | `(hotspot) => void` | Popover opened |
| `onClose` | `(hotspot) => void` | Popover closed |
| `onChapterChange` | `(chapter) => void` | Active chapter changed |
| `onFullscreenChange` | `(isFullscreen: boolean) => void` | Fullscreen state changed |
| `onAnalytics` | `(event: AnalyticsEvent) => void` | Unified analytics for all interactions |

### VideoHotspotItem

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `id` | `string` | *required* | Unique identifier |
| `x` | `string \| number` | *required* | X coordinate: `'65%'` or number `0-100` |
| `y` | `string \| number` | *required* | Y coordinate: `'40%'` or number `0-100` |
| `startTime` | `number` | *required* | Time in seconds when hotspot appears |
| `endTime` | `number` | *required* | Time in seconds when hotspot disappears |
| `label` | `string` | *required* | Accessible label (used for `aria-label` and screen reader) |
| `keyframes` | `Keyframe[]` | — | Motion keyframes: `[{time, x, y}, ...]` |
| `easing` | `'linear' \| 'ease-in' \| 'ease-out' \| 'ease-in-out'` | `'linear'` | Keyframe easing function |
| `interpolation` | `'linear' \| 'catmull-rom'` | `'linear'` | Interpolation mode (`catmull-rom` for smooth curves) |
| `data` | `PopoverData` | — | Data for built-in product card template |
| `content` | `string` | — | Raw HTML content for popover (sanitized) |
| `trigger` | `'hover' \| 'click'` | *inherit* | Override global trigger |
| `placement` | `Placement` | *inherit* | Override global placement |
| `markerStyle` | `'dot' \| 'dot-label' \| 'numbered'` | `'dot'` | Marker visual style |
| `className` | `string` | — | Custom CSS class on the marker |
| `animation` | `'fade' \| 'scale' \| 'none'` | *inherit* | Override global animation |
| `autoOpen` | `boolean` | `false` | Auto-open popover when hotspot appears |
| `pauseOnShow` | `boolean` | `false` | Pause video when hotspot appears |
| `pauseOnInteract` | `boolean` | *inherit* | Override global pauseOnInteract |
| `keepOpen` | `boolean` | `false` | Keep popover open until explicitly closed |
| `chapterId` | `string` | — | Associate with a chapter |
| `onClick` | `(event, hotspot) => void` | — | Custom click handler |

### PopoverData (built-in product card)

| Field | Type | Description |
|-------|------|-------------|
| `title` | `string` | Product heading |
| `price` | `string` | Current price |
| `originalPrice` | `string` | Strikethrough price |
| `description` | `string` | Description text |
| `image` | `string` | Product image URL |
| `images` | `string[]` | Multiple images for gallery carousel |
| `url` | `string` | Link URL for the CTA button |
| `ctaText` | `string` | CTA button label (default: `'View details'`) |
| `badge` | `string` | Badge text (e.g. `'New'`, `'-30%'`) |
| `rating` | `number` | Star rating (0-5, supports half stars) |
| `reviewCount` | `number` | Number of reviews |
| `variants` | `ProductVariant[]` | Size/color/material selectors |
| `wishlist` | `boolean` | Show wishlist button |
| `wishlisted` | `boolean` | Initial wishlisted state |
| `countdown` | `string \| Date` | Countdown end date (ISO string or Date) |
| `countdownLabel` | `string` | Label above the countdown timer |
| `currency` | `string` | Currency symbol (`'$'`, `'EUR'`) |
| `secondaryCta` | `{text, url?, onClick?}` | Secondary CTA button |
| `customFields` | `{label, value}[]` | Custom key-value fields below description |
| `sku` | `string` | Product SKU for cart events |
| `onAddToCart` | `(event: AddToCartEvent) => void` | Add-to-cart callback |
| `onWishlistToggle` | `(wishlisted, hotspot) => void` | Wishlist toggle callback |
| `onVariantSelect` | `(variant, allSelected, hotspot) => void` | Variant selected callback |

### VideoChapter

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Unique chapter identifier |
| `title` | `string` | Chapter display title |
| `startTime` | `number` | Start time in seconds |
| `endTime` | `number` | End time (optional — defaults to next chapter start or video duration) |

### Instance Methods

```ts
// Video playback
player.play(): Promise<void>
player.pause(): void
player.togglePlay(): void
player.seek(time: number): void
player.getCurrentTime(): number
player.getDuration(): number
player.setVolume(level: number): void    // 0-1
player.getVolume(): number
player.setMuted(muted: boolean): void
player.isMuted(): boolean
player.setPlaybackRate(rate: number): void
player.getPlaybackRate(): number
player.getVideoElement(): HTMLVideoElement | null  // null for YouTube/Vimeo

// Hotspot management
player.open(id: string): void
player.close(id: string): void
player.closeAll(): void
player.addHotspot(hotspot: VideoHotspotItem): void
player.removeHotspot(id: string): void
player.updateHotspot(id: string, updates: Partial<VideoHotspotItem>): void
player.getVisibleHotspots(): string[]             // returns visible hotspot IDs
player.getHotspots(): VideoHotspotItem[]           // returns all hotspot definitions

// Navigation
player.nextHotspot(): void
player.prevHotspot(): void
player.goToHotspot(id: string): void
player.goToChapter(id: string): void
player.getCurrentChapter(): string | undefined     // returns chapter ID

// Fullscreen
player.enterFullscreen(): void
player.exitFullscreen(): void
player.isFullscreen(): boolean

// DOM access
player.getElements(): { container, videoWrapper, video, overlay, controls }

// Lifecycle
player.update(config: Partial<CIVideoHotspotConfig>): void
player.destroy(): void
```

### Static Methods

```ts
CIVideoHotspot.autoInit(root?: HTMLElement): CIVideoHotspotInstance[]
```

---

## React

```tsx
import { CIVideoHotspotViewer, useCIVideoHotspot } from 'js-cloudimage-video-hotspot/react';
```

### Component

```tsx
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
      onHotspotClick={(e, h) => console.log('Clicked:', h.id)}
    />
  );
}
```

### Hook

```tsx
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
```

### Ref API

```tsx
function ShoppableVideo() {
  const ref = useRef<CIVideoHotspotInstance | null>(null);
  return (
    <>
      <CIVideoHotspotViewer ref={ref} src="/video.mp4" hotspots={[...]} />
      <button onClick={() => ref.current?.goToHotspot('bag')}>Show Bag</button>
    </>
  );
}
```

---

## Chapters

```js
const player = new CIVideoHotspot('#el', {
  src: '/product-tour.mp4',
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

player.goToChapter('features');
```

## Keyframe Motion

Hotspots can follow moving objects by defining motion keyframes. The plugin interpolates between keyframes at 60 fps using `requestAnimationFrame`.

```js
{
  id: 'bag',
  x: '50%', y: '50%',
  startTime: 10, endTime: 30,
  label: 'Designer Bag',
  easing: 'ease-in-out',
  interpolation: 'catmull-rom', // smooth curves (default: 'linear')
  keyframes: [
    { time: 10, x: 50, y: 50 },
    { time: 15, x: 40, y: 55 },
    { time: 20, x: 35, y: 60 },
    { time: 25, x: 45, y: 50 },
    { time: 30, x: 55, y: 45 },
  ],
}
```

## Multi-Player Support

The player engine is auto-detected from the source URL, or set explicitly via `playerType`:

```js
// HLS stream — uses hls.js on Chrome/Firefox, native HLS on Safari
new CIVideoHotspot('#el', {
  src: 'https://example.com/stream.m3u8',
  hotspots: [...],
});

// YouTube
new CIVideoHotspot('#el', {
  src: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  hotspots: [...],
});

// Vimeo
new CIVideoHotspot('#el', {
  src: 'https://vimeo.com/123456789',
  hotspots: [...],
});
```

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

## Analytics

Track all interactions through a single callback:

```js
new CIVideoHotspot('#el', {
  src: '/video.mp4',
  hotspots: [...],
  onAnalytics(event) {
    // event.type: 'hotspot_show' | 'hotspot_click' | 'popover_open' | 'popover_close'
    //           | 'cta_click' | 'add_to_cart' | 'variant_select' | 'wishlist_toggle'
    // event.hotspotId, event.timestamp, event.videoTime, event.data
    analytics.track(event.type, event);
  },
});
```

## Accessibility

- All markers are focusable `<button>` elements with `aria-label`
- Click-mode popovers use `role="dialog"` with focus trapping
- Hover-mode popovers use `role="tooltip"`
- Progress bar: `role="slider"` with `aria-valuenow` and `aria-valuetext`
- Screen reader announcements via ARIA live region

### Keyboard shortcuts

| Key | Action |
|-----|--------|
| `Space` / `K` | Play / pause |
| `Left` / `Right` | Seek -5s / +5s |
| `Up` / `Down` | Volume up / down |
| `N` / `P` | Next / previous hotspot |
| `F` | Toggle fullscreen |
| `M` | Toggle mute |
| `Escape` | Close popovers or exit fullscreen |
| `Tab` / `Shift+Tab` | Navigate between markers |

Animations are disabled automatically when `prefers-reduced-motion: reduce` is set.

## Browser Support

| Browser | Version |
|---------|---------|
| Chrome  | 80+     |
| Firefox | 80+     |
| Safari  | 14+     |
| Edge    | 80+     |

## License

[MIT](LICENSE)

---

<p align="center">
  Made with care by the <a href="https://www.scaleflex.com">Scaleflex</a> team
</p>
