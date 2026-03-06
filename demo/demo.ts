import CIVideoHotspot from '../src/index';
import { initConfigurator } from './configurator';

// ──────────────────── Viewer (standalone player with hotspots) ────────────────────
const HERO_VIDEO = './Rest room.mp4';
const HERO_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const viewerHotspots = [
  {
    id: 'hotspot-4',
    x: '48.47%',
    y: '44.88%',
    startTime: 0.6,
    endTime: 14.7,
    label: 'Television',
    interpolation: 'catmull-rom' as const,
    keyframes: [
      { time: 0.6, x: '48.47%', y: '44.88%' },
      { time: 1.6, x: '49.94%', y: '44.88%' },
      { time: 2.3, x: '50.43%', y: '45.1%' },
      { time: 3, x: '51.16%', y: '44.23%' },
      { time: 4.5, x: '52.02%', y: '44.23%' },
      { time: 5.3, x: '51.16%', y: '44.01%' },
      { time: 6.2, x: '49.2%', y: '43.79%' },
      { time: 7.3, x: '48.1%', y: '44.01%' },
      { time: 9.4, x: '48.47%', y: '44.01%' },
      { time: 10.7, x: '47.61%', y: '44.66%' },
      { time: 12.2, x: '45.4%', y: '45.53%' },
      { time: 13.2, x: '45.53%', y: '45.32%' },
      { time: 14.7, x: '43.93%', y: '45.32%' },
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
    x: '36.95%',
    y: '73.2%',
    startTime: 2.2,
    endTime: 12.8,
    label: 'Pouf',
    interpolation: 'catmull-rom' as const,
    keyframes: [
      { time: 2.2, x: '36.95%', y: '73.2%' },
      { time: 4.1, x: '34.99%', y: '69.5%' },
      { time: 5.9, x: '28.86%', y: '67.97%' },
      { time: 7.2, x: '25.06%', y: '65.14%' },
      { time: 8.6, x: '23.84%', y: '61.66%' },
      { time: 9.3, x: '23.47%', y: '59.69%' },
      { time: 10.6, x: '22%', y: '57.73%' },
      { time: 11.7, x: '19.91%', y: '56.21%' },
      { time: 12.8, x: '21.14%', y: '53.16%' },
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
    x: '74.2%',
    y: '30.94%',
    startTime: 5.5,
    endTime: 14.1,
    label: 'Fireplace',
    interpolation: 'catmull-rom' as const,
    keyframes: [
      { time: 5.5, x: '74.2%', y: '30.94%' },
      { time: 6, x: '73.59%', y: '30.72%' },
      { time: 6.6, x: '73.1%', y: '31.37%' },
      { time: 8.2, x: '76.41%', y: '32.46%' },
      { time: 9.6, x: '79.84%', y: '34.86%' },
      { time: 12.6, x: '81.19%', y: '42.05%' },
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

const heroEl = document.getElementById('hero-viewer');
if (heroEl) {
  const heroViewer = new CIVideoHotspot(heroEl, {
    src: HERO_VIDEO,
    autoplay: true,
    loop: true,
    trigger: 'hover',
    pauseOnInteract: true,
    hotspotNavigation: false,
    timelineIndicators: 'none',
    hotspots: viewerHotspots,
    onReady: () => {
      const bar = heroEl.querySelector('.ci-video-hotspot-progress-bar') as HTMLElement | null;
      if (!bar) return;
      const duration = heroViewer.getDuration() || 60;
      viewerHotspots.forEach((h, i) => {
        const dot = document.createElement('div');
        dot.className = 'timeline-start-dot';
        dot.style.left = `${(h.startTime / duration) * 100}%`;
        dot.style.backgroundColor = HERO_COLORS[i % HERO_COLORS.length];
        dot.title = h.label;
        dot.addEventListener('click', (e) => {
          e.stopPropagation();
          heroViewer.goToHotspot(h.id);
        });
        bar.appendChild(dot);
      });
    },
  });
}

/*
// ──────────────────── Features ────────────────────

// Shoppable Video
new CIVideoHotspot('#demo-shoppable', {
  src: DEMO_VIDEO,
  autoplay: true,
  loop: true,
  trigger: 'click',
  pauseOnInteract: true,
  hotspotNavigation: false,
  hotspots: [
    {
      id: 's1',
      x: '40%',
      y: '50%',
      startTime: 2,
      endTime: 8,
      label: 'Product',
      data: { title: 'Nature Print', price: '$45', description: 'Canvas print of natural scenery.', ctaText: 'Buy Now' },
    },
  ],
});

// Keyframe Motion
new CIVideoHotspot('#demo-keyframes', {
  src: DEMO_VIDEO,
  autoplay: true,
  loop: true,
  trigger: 'hover',
  hotspotNavigation: false,
  hotspots: [
    {
      id: 'kf1',
      x: '30%',
      y: '50%',
      startTime: 0,
      endTime: 10,
      label: 'Moving marker',
      interpolation: 'catmull-rom',
      keyframes: [
        { time: 0, x: '30%', y: '50%' },
        { time: 3, x: '50%', y: '30%' },
        { time: 6, x: '70%', y: '60%' },
        { time: 10, x: '40%', y: '45%' },
      ],
      data: { title: 'Keyframe Motion', description: 'This hotspot follows a curved path using Catmull-Rom interpolation.' },
    },
  ],
});

// Chapters
new CIVideoHotspot('#demo-chapters', {
  src: DEMO_VIDEO,
  autoplay: true,
  loop: true,
  chapterNavigation: true,
  hotspotNavigation: false,
  chapters: [
    { id: 'intro', title: 'Introduction', startTime: 0 },
    { id: 'middle', title: 'Main Scene', startTime: 5 },
  ],
  hotspots: [
    {
      id: 'ch1',
      x: '50%',
      y: '50%',
      startTime: 1,
      endTime: 4,
      label: 'Intro item',
      chapterId: 'intro',
      data: { title: 'Chapter Demo', description: 'Navigate between chapters.' },
    },
    {
      id: 'ch2',
      x: '60%',
      y: '40%',
      startTime: 6,
      endTime: 10,
      label: 'Main item',
      chapterId: 'middle',
      data: { title: 'Main Scene', description: 'Second chapter content.' },
    },
  ],
});

// ──────────────────── Themes ────────────────────

const sampleThemeHotspot = {
  id: 'th1',
  x: '50%',
  y: '50%',
  startTime: 2,
  endTime: 10,
  label: 'Sample',
  data: { title: 'Theme Demo', description: 'See how this looks with different themes.' },
};

new CIVideoHotspot('#demo-light', {
  src: DEMO_VIDEO,
  autoplay: true,
  loop: true,
  theme: 'light',
  trigger: 'hover',
  hotspotNavigation: false,
  hotspots: [{ ...sampleThemeHotspot, id: 'tl1' }],
});

new CIVideoHotspot('#demo-dark', {
  src: DEMO_VIDEO,
  autoplay: true,
  loop: true,
  theme: 'dark',
  trigger: 'hover',
  hotspotNavigation: false,
  hotspots: [{ ...sampleThemeHotspot, id: 'td1' }],
});

new CIVideoHotspot('#demo-enhanced', {
  src: DEMO_VIDEO,
  autoplay: true,
  loop: true,
  trigger: 'click',
  hotspotNavigation: false,
  hotspots: [
    {
      id: 'enh1',
      x: '50%',
      y: '50%',
      startTime: 1,
      endTime: 10,
      label: 'Product',
      data: {
        title: 'Premium Product',
        price: '$89',
        originalPrice: '$120',
        badge: 'SALE',
        description: 'Enhanced card with all features.',
        image: 'https://picsum.photos/320/180?random=3',
        ctaText: 'Shop Now',
      },
    },
  ],
});

// ──────────────────── Player Types (hidden) ────────────────────
// ──────────────────── Advanced (hidden) ────────────────────

// ──────────────────── API ────────────────────
const apiPlayer = new CIVideoHotspot('#demo-api', {
  src: DEMO_VIDEO,
  autoplay: true,
  loop: true,
  hotspotNavigation: false,
  hotspots: [
    {
      id: 'api1',
      x: '40%',
      y: '50%',
      startTime: 1,
      endTime: 8,
      label: 'API Item',
      data: { title: 'API Demo', price: '$99', description: 'Control with JavaScript API.' },
    },
  ],
});

document.getElementById('api-add')?.addEventListener('click', () => {
  apiPlayer.addHotspot({
    id: `dyn-${Date.now()}`,
    x: '50%',
    y: '50%',
    startTime: 0,
    endTime: 10,
    label: 'Dynamic',
    data: { title: 'Dynamic Hotspot', description: 'Added via API.' },
  });
});

document.getElementById('api-remove')?.addEventListener('click', () => {
  const visible = apiPlayer.getVisibleHotspots();
  if (visible.length) apiPlayer.removeHotspot(visible[visible.length - 1]);
});

document.getElementById('api-open')?.addEventListener('click', () => {
  apiPlayer.open('api1');
});

document.getElementById('api-close')?.addEventListener('click', () => {
  apiPlayer.closeAll();
});

document.getElementById('api-next')?.addEventListener('click', () => {
  apiPlayer.nextHotspot();
});

document.getElementById('api-prev')?.addEventListener('click', () => {
  apiPlayer.prevHotspot();
});
*/

// ──────────────────── Motion Types ────────────────────

const MOTION_OPTS = {
  src: HERO_VIDEO,
  autoplay: true,
  loop: true,
  controls: false,
  hotspotNavigation: false,
  timelineIndicators: 'none' as const,
  trigger: 'hover' as const,
};

// 1. Static
const motionStaticEl = document.getElementById('motion-static');
if (motionStaticEl) {
  new CIVideoHotspot(motionStaticEl, {
    ...MOTION_OPTS,
    hotspots: [
      {
        id: 'ms1',
        x: '50%',
        y: '50%',
        startTime: 0,
        endTime: 999,
        label: 'Static',
        data: { title: 'Static Hotspot', description: 'Stays in one place throughout the video.' },
      },
    ],
  });
}

// Helper: draw trajectory SVG
function drawTrajectory(
  svgId: string,
  containerEl: HTMLElement,
  points: { x: string; y: string }[],
  smooth: boolean,
) {
  const svg = document.getElementById(svgId);
  if (!svg || points.length < 2) return;

  const rect = containerEl.getBoundingClientRect();
  const w = rect.width;
  const h = rect.height;

  const coords = points.map((p) => ({
    x: (parseFloat(p.x) / 100) * w,
    y: (parseFloat(p.y) / 100) * h,
  }));

  svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
  svg.setAttribute('preserveAspectRatio', 'none');

  let d: string;
  if (!smooth || coords.length < 3) {
    d = `M ${coords[0].x} ${coords[0].y}` + coords.slice(1).map((c) => ` L ${c.x} ${c.y}`).join('');
  } else {
    // Catmull-Rom to cubic bezier
    d = `M ${coords[0].x} ${coords[0].y}`;
    for (let i = 0; i < coords.length - 1; i++) {
      const p0 = coords[Math.max(i - 1, 0)];
      const p1 = coords[i];
      const p2 = coords[i + 1];
      const p3 = coords[Math.min(i + 2, coords.length - 1)];

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
  }

  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', d);
  svg.appendChild(path);

  // Draw keyframe dots
  coords.forEach((c) => {
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', String(c.x));
    circle.setAttribute('cy', String(c.y));
    circle.setAttribute('r', '4');
    svg.appendChild(circle);
  });
}

// 2. Linear
const linearKeyframes = [
  { time: 0, x: '20%', y: '50%' },
  { time: 14, x: '80%', y: '50%' },
];
const motionLinearEl = document.getElementById('motion-linear');
if (motionLinearEl) {
  new CIVideoHotspot(motionLinearEl, {
    ...MOTION_OPTS,
    hotspots: [
      {
        id: 'ml1',
        x: '20%',
        y: '50%',
        startTime: 0,
        endTime: 999,
        label: 'Linear',
        interpolation: 'linear' as const,
        keyframes: linearKeyframes,
        data: { title: 'Linear Motion', description: 'Moves in a straight line from left to right.' },
      },
    ],
    onReady: () => {
      drawTrajectory('trajectory-linear', motionLinearEl, linearKeyframes, false);
    },
  });
}

// 3. Curved Path (3 points — V shape going up)
const curvedKeyframes = [
  { time: 0, x: '50%', y: '75%' },
  { time: 7, x: '25%', y: '25%' },
  { time: 14, x: '75%', y: '25%' },
];
const motionCurvedEl = document.getElementById('motion-curved');
if (motionCurvedEl) {
  new CIVideoHotspot(motionCurvedEl, {
    ...MOTION_OPTS,
    hotspots: [
      {
        id: 'mc1',
        x: '50%',
        y: '75%',
        startTime: 0,
        endTime: 999,
        label: 'Curved',
        interpolation: 'catmull-rom' as const,
        keyframes: curvedKeyframes,
        data: { title: 'Curved Path', description: 'Follows a smooth V-shaped arc via 3 keyframes.' },
      },
    ],
    onReady: () => {
      drawTrajectory('trajectory-curved', motionCurvedEl, curvedKeyframes, true);
    },
  });
}

// 4. Complex Path (4+ points — S-curve)
const complexKeyframes = [
  { time: 0, x: '50%', y: '80%' },
  { time: 4, x: '75%', y: '55%' },
  { time: 8, x: '35%', y: '40%' },
  { time: 12, x: '25%', y: '20%' },
];
const motionComplexEl = document.getElementById('motion-complex');
if (motionComplexEl) {
  new CIVideoHotspot(motionComplexEl, {
    ...MOTION_OPTS,
    hotspots: [
      {
        id: 'mx1',
        x: '50%',
        y: '80%',
        startTime: 0,
        endTime: 999,
        label: 'Complex',
        interpolation: 'catmull-rom' as const,
        keyframes: complexKeyframes,
        data: { title: 'Complex Path', description: 'Traces an S-curve through 4 keyframes.' },
      },
    ],
    onReady: () => {
      drawTrajectory('trajectory-complex', motionComplexEl, complexKeyframes, true);
    },
  });
}

// ──────────────────── Hero toggle (Editor ↔ Viewer) ────────────────────
const heroToggle = document.getElementById('hero-toggle');
if (heroToggle) {
  const btns = heroToggle.querySelectorAll<HTMLButtonElement>('.demo-hero-toggle-btn');
  const variants: Record<string, HTMLElement | null> = {
    editor: document.getElementById('hero-variant-editor'),
    viewer: document.getElementById('hero-variant-viewer'),
  };

  btns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const variant = btn.dataset.variant;
      if (!variant) return;
      btns.forEach((b) => b.classList.toggle('demo-hero-toggle-btn--active', b === btn));
      Object.entries(variants).forEach(([key, el]) => {
        el?.classList.toggle('demo-hero-variant--active', key === variant);
      });
    });
  });
}

// ──────────────────── Configurator ────────────────────
initConfigurator();

// ──────────────────── Also by Scaleflex carousel ────────────────────
{
  const slides = document.querySelectorAll<HTMLElement>('.demo-also-slide');
  const dotsContainer = document.getElementById('also-dots');
  if (slides.length > 0 && dotsContainer) {
    let current = 0;
    let animating = false;
    let timer: ReturnType<typeof setInterval>;

    for (let i = 0; i < slides.length; i++) {
      const dot = document.createElement('button');
      dot.className = `demo-also-dot${i === 0 ? ' demo-also-dot--active' : ''}`;
      dot.setAttribute('aria-label', `Slide ${i + 1}`);
      dot.addEventListener('click', () => goTo(i));
      dotsContainer.appendChild(dot);
    }

    function clearAnimClasses(el: HTMLElement) {
      el.classList.remove(
        'demo-also-slide--enter-right',
        'demo-also-slide--enter-left',
        'demo-also-slide--leave-left',
        'demo-also-slide--leave-right',
      );
    }

    function goTo(index: number) {
      if (index === current || animating) return;
      animating = true;
      const forward = index > current || (current === slides.length - 1 && index === 0);
      const prev = slides[current];
      const next = slides[index];

      clearAnimClasses(prev);
      prev.classList.remove('demo-also-slide--active');
      prev.classList.add(forward ? 'demo-also-slide--leave-left' : 'demo-also-slide--leave-right');

      clearAnimClasses(next);
      next.classList.add(forward ? 'demo-also-slide--enter-right' : 'demo-also-slide--enter-left');

      next.addEventListener('animationend', function handler() {
        next.removeEventListener('animationend', handler);
        clearAnimClasses(prev);
        clearAnimClasses(next);
        next.classList.add('demo-also-slide--active');
        animating = false;
      });

      current = index;
      dotsContainer!.querySelectorAll('.demo-also-dot').forEach((d, i) => {
        d.classList.toggle('demo-also-dot--active', i === current);
      });
      resetTimer();
    }

    function resetTimer() {
      clearInterval(timer);
      timer = setInterval(() => {
        goTo((current + 1) % slides.length);
      }, 5000);
    }

    resetTimer();
  }
}
