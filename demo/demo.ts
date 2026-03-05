import CIVideoHotspot from '../src/index';
import { initConfigurator } from './configurator';

const DEMO_VIDEO = './3250231-uhd_3840_2160_25fps.mp4';
const HERO_VIDEO = './Rest room.mp4';
const HERO_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

// ──────────────────── Hero ────────────────────
const heroHotspots = [
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

const heroViewer = new CIVideoHotspot('#hero-viewer', {
  src: HERO_VIDEO,
  autoplay: true,
  loop: true,
  trigger: 'hover',
  pauseOnInteract: true,
  hotspotNavigation: false,
  timelineIndicators: 'none',
  hotspots: heroHotspots,
  onReady: () => {
    const bar = document.querySelector('#hero-viewer .ci-video-hotspot-progress-bar') as HTMLElement | null;
    if (!bar) return;
    const duration = heroViewer.getDuration() || 60;
    heroHotspots.forEach((h, i) => {
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

// ──────────────────── Configurator ────────────────────
initConfigurator();

/*
// ──────────────────── Auto-Init (hidden) ────────────────────
// CIVideoHotspot.autoInit();

// ──────────────────── Nav: scroll shadow + active section ────────────────────
const nav = document.getElementById('demo-nav');
const navLinks = document.querySelectorAll<HTMLAnchorElement>('.demo-nav-links a');
const sections = document.querySelectorAll<HTMLElement>('main section[id]');

function updateNav(): void {
  if (nav) {
    nav.classList.toggle('scrolled', window.scrollY > 10);
  }

  let currentId = '';
  const offset = 120;
  for (const section of sections) {
    if (section.offsetTop - offset <= window.scrollY) {
      currentId = section.id;
    }
  }
  for (const link of navLinks) {
    const href = link.getAttribute('href');
    link.classList.toggle('active', href === `#${currentId}`);
  }
}

for (const link of navLinks) {
  link.addEventListener('click', (e) => {
    const href = link.getAttribute('href');
    if (!href?.startsWith('#')) return;
    const target = document.getElementById(href.slice(1));
    if (!target) return;
    e.preventDefault();
    const navHeight = nav ? nav.offsetHeight : 0;
    const top = target.getBoundingClientRect().top + window.scrollY - navHeight - 12;
    window.scrollTo({ top, behavior: 'smooth' });
  });
}

window.addEventListener('scroll', updateNav, { passive: true });
updateNav();

// ──────────────────── Mobile burger ────────────────────
const burger = document.getElementById('nav-burger');
if (nav && burger) {
  burger.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    burger.setAttribute('aria-expanded', String(open));
  });

  for (const link of navLinks) {
    link.addEventListener('click', () => {
      nav.classList.remove('open');
      burger.setAttribute('aria-expanded', 'false');
    });
  }
}

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
*/
