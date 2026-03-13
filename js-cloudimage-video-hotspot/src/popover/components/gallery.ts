export interface GalleryResult {
  element: HTMLElement;
  setMainImage(src: string): void;
}

const ARROW_LEFT = `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg>`;
const ARROW_RIGHT = `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M9 18l6-6-6-6"/></svg>`;

/** Create an image gallery carousel with swipe, arrows, and dots. Returns null if no images. */
export function createGallery(
  images: string[] | undefined,
  altText: string,
  cleanups: (() => void)[],
): GalleryResult | null {
  if (!images || images.length === 0) return null;

  let currentIndex = 0;

  // Container
  const container = document.createElement('div');
  container.className = 'ci-video-hotspot-gallery';

  // Viewport (clips overflow)
  const viewport = document.createElement('div');
  viewport.className = 'ci-video-hotspot-gallery-viewport';

  // Track (slides horizontally)
  const track = document.createElement('div');
  track.className = 'ci-video-hotspot-gallery-track';
  track.style.display = 'flex';
  track.style.transition = 'transform 300ms ease';

  for (let i = 0; i < images.length; i++) {
    const slide = document.createElement('div');
    slide.className = 'ci-video-hotspot-gallery-slide';
    slide.style.flex = '0 0 100%';
    slide.style.width = '100%';

    const img = document.createElement('img');
    img.className = 'ci-video-hotspot-gallery-image';
    img.src = images[i];
    img.alt = `${altText} - image ${i + 1}`;
    if (i > 0) img.loading = 'lazy';
    img.draggable = false;

    slide.appendChild(img);
    track.appendChild(slide);
  }

  viewport.appendChild(track);
  container.appendChild(viewport);

  function goTo(index: number): void {
    currentIndex = Math.max(0, Math.min(index, images!.length - 1));
    track.style.transform = `translateX(-${currentIndex * 100}%)`;
    updateControls();
  }

  // Arrows (only if more than 1 image)
  let prevBtn: HTMLButtonElement | null = null;
  let nextBtn: HTMLButtonElement | null = null;

  if (images.length > 1) {
    prevBtn = document.createElement('button');
    prevBtn.type = 'button';
    prevBtn.className = 'ci-video-hotspot-gallery-arrow ci-video-hotspot-gallery-arrow--prev';
    prevBtn.setAttribute('aria-label', 'Previous image');
    prevBtn.innerHTML = ARROW_LEFT;

    nextBtn = document.createElement('button');
    nextBtn.type = 'button';
    nextBtn.className = 'ci-video-hotspot-gallery-arrow ci-video-hotspot-gallery-arrow--next';
    nextBtn.setAttribute('aria-label', 'Next image');
    nextBtn.innerHTML = ARROW_RIGHT;

    const onPrev = (e: Event) => { e.stopPropagation(); goTo(currentIndex - 1); };
    const onNext = (e: Event) => { e.stopPropagation(); goTo(currentIndex + 1); };

    prevBtn.addEventListener('click', onPrev);
    nextBtn.addEventListener('click', onNext);
    cleanups.push(
      () => prevBtn!.removeEventListener('click', onPrev),
      () => nextBtn!.removeEventListener('click', onNext),
    );

    container.appendChild(prevBtn);
    container.appendChild(nextBtn);
  }

  // Dots
  const dots: HTMLButtonElement[] = [];
  if (images.length > 1) {
    const dotsContainer = document.createElement('div');
    dotsContainer.className = 'ci-video-hotspot-gallery-dots';

    for (let i = 0; i < images.length; i++) {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'ci-video-hotspot-gallery-dot';
      dot.setAttribute('aria-label', `Go to image ${i + 1}`);
      dot.setAttribute('aria-selected', String(i === 0));

      const onDot = (e: Event) => { e.stopPropagation(); goTo(i); };
      dot.addEventListener('click', onDot);
      cleanups.push(() => dot.removeEventListener('click', onDot));

      dots.push(dot);
      dotsContainer.appendChild(dot);
    }

    container.appendChild(dotsContainer);
  }

  function updateControls(): void {
    if (prevBtn) prevBtn.style.display = currentIndex === 0 ? 'none' : '';
    if (nextBtn) nextBtn.style.display = currentIndex === images!.length - 1 ? 'none' : '';
    dots.forEach((d, i) => {
      d.classList.toggle('ci-video-hotspot-gallery-dot--active', i === currentIndex);
      d.setAttribute('aria-selected', String(i === currentIndex));
    });
  }

  // Touch / swipe support
  let touchStartX = 0;
  let touchStartY = 0;
  let touchStartTime = 0;
  let isSwiping = false;

  const onTouchStart = (e: TouchEvent) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    touchStartTime = Date.now();
    isSwiping = false;
    track.style.transition = 'none';
  };

  const onTouchMove = (e: TouchEvent) => {
    const dx = e.touches[0].clientX - touchStartX;
    const dy = e.touches[0].clientY - touchStartY;

    // Only horizontal swipe
    if (!isSwiping && Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10) {
      isSwiping = true;
    }

    if (isSwiping) {
      e.preventDefault();
      const offset = -currentIndex * 100 + (dx / viewport.offsetWidth) * 100;
      track.style.transform = `translateX(${offset}%)`;
    }
  };

  const onTouchEnd = (e: TouchEvent) => {
    track.style.transition = 'transform 300ms ease';
    if (!isSwiping) {
      goTo(currentIndex);
      return;
    }

    const dx = e.changedTouches[0].clientX - touchStartX;
    const dt = Date.now() - touchStartTime;
    const velocity = Math.abs(dx) / dt;
    const threshold = 50;

    if (dx < -threshold || (velocity > 0.3 && dx < 0)) {
      goTo(currentIndex + 1);
    } else if (dx > threshold || (velocity > 0.3 && dx > 0)) {
      goTo(currentIndex - 1);
    } else {
      goTo(currentIndex);
    }
  };

  viewport.addEventListener('touchstart', onTouchStart, { passive: true });
  viewport.addEventListener('touchmove', onTouchMove, { passive: false });
  viewport.addEventListener('touchend', onTouchEnd, { passive: true });

  cleanups.push(
    () => viewport.removeEventListener('touchstart', onTouchStart),
    () => viewport.removeEventListener('touchmove', onTouchMove),
    () => viewport.removeEventListener('touchend', onTouchEnd),
  );

  // ResizeObserver for recalculating slide position on resize
  if (typeof ResizeObserver !== 'undefined') {
    const ro = new ResizeObserver(() => {
      goTo(currentIndex);
    });
    ro.observe(viewport);
    cleanups.push(() => ro.disconnect());
  }

  // Initial state
  updateControls();

  function setMainImage(src: string): void {
    const firstSlide = track.querySelector('.ci-video-hotspot-gallery-slide img') as HTMLImageElement | null;
    if (firstSlide) {
      firstSlide.src = src;
    }
    goTo(0);
  }

  return { element: container, setMainImage };
}
