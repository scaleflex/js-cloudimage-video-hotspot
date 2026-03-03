import CIVideoHotspot from '../src/index';
import type { CIVideoHotspotConfig, MarkerStyle, HotspotAnimation, TimelineIndicatorStyle } from '../src/core/types';

const SAMPLE_VIDEO = './3250231-uhd_3840_2160_25fps.mp4';

let instance: CIVideoHotspot | null = null;

const defaultHotspots = [
  {
    id: 'cfg-1',
    x: '35%',
    y: '40%',
    startTime: 5,
    endTime: 20,
    label: 'Butterfly',
    data: {
      title: 'Beautiful Butterfly',
      price: '$29.99',
      description: 'A gorgeous butterfly captured in nature.',
    },
  },
  {
    id: 'cfg-2',
    x: '65%',
    y: '60%',
    startTime: 12,
    endTime: 30,
    label: 'Wildflower',
    markerStyle: 'dot-label' as const,
    data: {
      title: 'Wild Sunflower',
      price: '$12.99',
      description: 'Fresh wildflowers delivered to your door.',
    },
  },
];

export function initConfigurator(): void {
  const viewerEl = document.getElementById('configurator-viewer');
  if (!viewerEl) return;

  const cfgPauseInteract = document.getElementById('cfg-pause-interact') as HTMLInputElement;
  const cfgHotspotNav = document.getElementById('cfg-hotspot-nav') as HTMLInputElement;
  const cfgPulse = document.getElementById('cfg-pulse') as HTMLInputElement;
  const cfgFullscreen = document.getElementById('cfg-fullscreen') as HTMLInputElement;
  const cfgControls = document.getElementById('cfg-controls') as HTMLInputElement;
  const cfgAutoplay = document.getElementById('cfg-autoplay') as HTMLInputElement;
  const cfgLoop = document.getElementById('cfg-loop') as HTMLInputElement;
  const cfgTrigger = document.getElementById('cfg-trigger') as HTMLSelectElement;
  const cfgTheme = document.getElementById('cfg-theme') as HTMLSelectElement;
  const cfgPlacement = document.getElementById('cfg-placement') as HTMLSelectElement;
  const cfgMarkerStyle = document.getElementById('cfg-marker-style') as HTMLSelectElement;
  const cfgTimeline = document.getElementById('cfg-timeline') as HTMLSelectElement;
  const cfgAnimation = document.getElementById('cfg-animation') as HTMLSelectElement;
  const cfgCode = document.querySelector('#cfg-code code') as HTMLElement;
  const cfgCopy = document.getElementById('cfg-copy') as HTMLButtonElement;

  function getConfig(): CIVideoHotspotConfig {
    const style = cfgMarkerStyle.value as MarkerStyle;
    const animation = cfgAnimation.value as HotspotAnimation;
    const hotspots = defaultHotspots.map((h) => ({
      ...h,
      markerStyle: style !== 'dot' ? style : undefined,
      animation: animation !== 'fade' ? animation : undefined,
    }));
    return {
      src: SAMPLE_VIDEO,
      hotspots,
      trigger: cfgTrigger.value as CIVideoHotspotConfig['trigger'],
      theme: cfgTheme.value as CIVideoHotspotConfig['theme'],
      placement: cfgPlacement.value as CIVideoHotspotConfig['placement'],
      pauseOnInteract: cfgPauseInteract.checked,
      hotspotNavigation: cfgHotspotNav.checked,
      pulse: cfgPulse.checked,
      fullscreenButton: cfgFullscreen.checked,
      controls: cfgControls.checked,
      autoplay: cfgAutoplay.checked,
      loop: cfgLoop.checked,
      muted: cfgAutoplay.checked,
      timelineIndicators: cfgTimeline.value as TimelineIndicatorStyle,
      hotspotAnimation: cfgAnimation.value as HotspotAnimation,
    };
  }

  function generateCode(config: CIVideoHotspotConfig): string {
    const opts: string[] = [];
    opts.push(`  src: '${config.src}',`);
    if (config.trigger !== 'click') opts.push(`  trigger: '${config.trigger}',`);
    if (config.theme !== 'light') opts.push(`  theme: '${config.theme}',`);
    if (!config.pauseOnInteract) opts.push(`  pauseOnInteract: false,`);
    if (!config.hotspotNavigation) opts.push(`  hotspotNavigation: false,`);
    if (!config.pulse) opts.push(`  pulse: false,`);
    if (!config.fullscreenButton) opts.push(`  fullscreenButton: false,`);
    if (!config.controls) opts.push(`  controls: false,`);
    if (config.autoplay) opts.push(`  autoplay: true,`);
    if (config.loop) opts.push(`  loop: true,`);
    if (config.placement !== 'top') opts.push(`  placement: '${config.placement}',`);
    if (config.timelineIndicators !== 'dot') opts.push(`  timelineIndicators: '${config.timelineIndicators}',`);
    if (config.hotspotAnimation !== 'fade') opts.push(`  hotspotAnimation: '${config.hotspotAnimation}',`);
    opts.push(
      `  hotspots: ${JSON.stringify(config.hotspots, null, 4)
        .split('\n')
        .map((l, i) => (i === 0 ? l : '  ' + l))
        .join('\n')},`,
    );

    return `const player = new CIVideoHotspot('#my-video', {\n${opts.join('\n')}\n});`;
  }

  function rebuild(): void {
    const config = getConfig();
    if (instance) {
      viewerEl!.style.minHeight = `${viewerEl!.offsetHeight}px`;
      (instance as { update(c: Partial<CIVideoHotspotConfig>): void }).update(config);
      requestAnimationFrame(() => {
        viewerEl!.style.minHeight = '';
      });
    } else {
      instance = new CIVideoHotspot(viewerEl!, config);
    }
    cfgCode.textContent = generateCode(config);
    cfgCode.classList.add('language-javascript');
    if (typeof (window as any).Prism !== 'undefined') {
      (window as any).Prism.highlightElement(cfgCode);
    }
  }

  // Bind controls
  [cfgPauseInteract, cfgHotspotNav, cfgPulse, cfgFullscreen, cfgControls, cfgAutoplay, cfgLoop].forEach((el) =>
    el.addEventListener('change', rebuild),
  );
  [cfgTrigger, cfgTheme, cfgPlacement, cfgMarkerStyle, cfgTimeline, cfgAnimation].forEach((el) =>
    el.addEventListener('change', rebuild),
  );

  // Copy button (icon-style .demo-copy-btn)
  cfgCopy.addEventListener('click', () => {
    navigator.clipboard.writeText(cfgCode.textContent || '').then(() => {
      cfgCopy.classList.add('copied');
      setTimeout(() => {
        cfgCopy.classList.remove('copied');
      }, 2000);
    });
  });

  // Initial build
  rebuild();
}
