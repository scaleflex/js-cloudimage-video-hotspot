import CIVideoHotspot from '../src/index';
import type { CIVideoHotspotConfig, MarkerStyle, HotspotAnimation } from '../src/core/types';

const SAMPLE_VIDEO = './bed.mp4';
const CONFIGURATOR_VIDEO = '/my-configurator-video.mp4';

let instance: CIVideoHotspot | null = null;

function makeHotspots(style: MarkerStyle, animation: HotspotAnimation) {
  return [
    {
      id: 'cfg-1',
      x: '30%',
      y: '40%',
      startTime: 0,
      endTime: 999,
      label: 'Butterfly',
      interpolation: 'catmull-rom' as const,
      keyframes: [
        { time: 0, x: '30%', y: '40%' },
        { time: 4, x: '45%', y: '30%' },
        { time: 8, x: '55%', y: '45%' },
        { time: 12, x: '35%', y: '50%' },
        { time: 16, x: '30%', y: '40%' },
      ],
      markerStyle: style !== 'dot' ? style : undefined,
      animation: animation !== 'fade' ? animation : undefined,
      data: {
        title: 'Beautiful Butterfly',
        price: '$29.99',
        originalPrice: '$49.99',
        badge: '-40%',
        description: 'A gorgeous butterfly captured in nature.',
        image: 'https://picsum.photos/320/180?random=1',
        ctaText: 'Shop Now',
      },
    },
    {
      id: 'cfg-2',
      x: '68%',
      y: '58%',
      startTime: 0,
      endTime: 999,
      label: 'Wildflower',
      keyframes: [
        { time: 0, x: '68%', y: '58%' },
        { time: 16, x: '68%', y: '58%' },
      ],
      markerStyle: style !== 'dot' ? style : undefined,
      animation: animation !== 'fade' ? animation : undefined,
      data: {
        title: 'Wild Sunflower',
        price: '$12.99',
        description: 'Fresh wildflowers delivered to your door.',
        ctaText: 'Add to Cart',
      },
    },
  ];
}

export function initConfigurator(): void {
  const viewerEl = document.getElementById('cfg-viewer');
  if (!viewerEl) return;

  const cfgPauseInteract = document.getElementById('cfg-pause-interact') as HTMLInputElement;
  const cfgPulse = document.getElementById('cfg-pulse') as HTMLInputElement;
  const cfgTrigger = document.getElementById('cfg-trigger') as HTMLSelectElement;
  const cfgTheme = document.getElementById('cfg-theme') as HTMLSelectElement;
  const cfgPlacement = document.getElementById('cfg-placement') as HTMLSelectElement;
  const cfgMarkerStyle = document.getElementById('cfg-marker-style') as HTMLSelectElement;
  const cfgAnimation = document.getElementById('cfg-animation') as HTMLSelectElement;
  const cfgCode = document.querySelector('#cfg-code code') as HTMLElement;
  const cfgCopy = document.getElementById('cfg-copy') as HTMLButtonElement;

  function getConfig(): CIVideoHotspotConfig {
    const style = cfgMarkerStyle.value as MarkerStyle;
    const animation = cfgAnimation.value as HotspotAnimation;
    return {
      src: SAMPLE_VIDEO,
      hotspots: makeHotspots(style, animation),
      trigger: cfgTrigger.value as CIVideoHotspotConfig['trigger'],
      theme: cfgTheme.value as CIVideoHotspotConfig['theme'],
      placement: cfgPlacement.value as CIVideoHotspotConfig['placement'],
      pauseOnInteract: cfgPauseInteract.checked,
      hotspotNavigation: false,
      pulse: cfgPulse.checked,
      fullscreenButton: false,
      controls: false,
      autoplay: true,
      loop: true,
      muted: true,
      timelineIndicators: 'dot',
      hotspotAnimation: cfgAnimation.value as HotspotAnimation,
    };
  }

  function generateCode(config: CIVideoHotspotConfig): string {
    const opts: string[] = [];
    opts.push(`  src: '${config.src}',`);
    if (config.trigger !== 'click') opts.push(`  trigger: '${config.trigger}',`);
    if (config.theme !== 'light') opts.push(`  theme: '${config.theme}',`);
    if (!config.pauseOnInteract) opts.push(`  pauseOnInteract: false,`);
    if (!config.pulse) opts.push(`  pulse: false,`);
    if (config.placement !== 'top') opts.push(`  placement: '${config.placement}',`);
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
      instance.update(config);
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
  [cfgPauseInteract, cfgPulse].forEach((el) =>
    el.addEventListener('change', rebuild),
  );
  [cfgTrigger, cfgTheme, cfgPlacement, cfgMarkerStyle, cfgAnimation].forEach((el) =>
    el.addEventListener('change', rebuild),
  );

  // Copy button
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
