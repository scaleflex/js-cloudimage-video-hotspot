import { HTML5Adapter } from './html5-adapter';
import type { AdapterOptions } from '../adapter';
import type { HLSConfig } from '../../core/types';
import { HLS_MAX_RETRIES, HLS_INITIAL_RETRY_MS } from '../../core/constants';

/**
 * HLS adapter — extends HTML5Adapter.
 * Uses native HLS on Safari/iOS, dynamic-imports hls.js elsewhere.
 * hls.js is a peer dependency — not bundled.
 */
export class HLSAdapter extends HTML5Adapter {
  private hls: any = null;
  private hlsConfig: HLSConfig;
  private networkRetryCount = 0;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(options: AdapterOptions, hlsConfig?: HLSConfig) {
    super(options);
    this.hlsConfig = hlsConfig || {};
  }

  mount(container: HTMLElement): void {
    super.mount(container);
    this.initHLS();
  }

  private async initHLS(): Promise<void> {
    // 1. Safari / iOS: native HLS support — just set src
    if (this.videoEl.canPlayType('application/vnd.apple.mpegurl')) {
      this.videoEl.src = this.options.src;
      return;
    }

    // 2. Dynamic import hls.js
    try {
      const { default: Hls } = await import('hls.js');

      if (!Hls.isSupported()) {
        console.warn('CIVideoHotspot: HLS not supported in this browser');
        return;
      }

      this.hls = new Hls({
        enableWorker: this.hlsConfig.enableWorker ?? true,
        startLevel: this.hlsConfig.startLevel ?? -1,
        capLevelToPlayerSize: this.hlsConfig.capLevelToPlayerSize ?? true,
      });

      this.hls.loadSource(this.options.src);
      this.hls.attachMedia(this.videoEl);

      // Fatal error recovery with exponential backoff
      this.hls.on(Hls.Events.ERROR, (_: any, data: any) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              if (this.networkRetryCount < HLS_MAX_RETRIES) {
                const delay = HLS_INITIAL_RETRY_MS * Math.pow(2, this.networkRetryCount);
                this.networkRetryCount++;
                this.retryTimer = setTimeout(() => {
                  this.retryTimer = null;
                  this.hls?.startLoad();
                }, delay);
              } else {
                this.emit('error', data);
              }
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              this.hls.recoverMediaError();
              break;
            default:
              this.emit('error', data);
              break;
          }
        }
      });
    } catch {
      console.warn(
        'CIVideoHotspot: hls.js not found. Install it as a dependency: npm i hls.js'
      );
      // Fallback: try native (may not work in non-Safari browsers)
      this.videoEl.src = this.options.src;
    }
  }

  destroy(): void {
    if (this.retryTimer !== null) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
    if (this.hls) {
      this.hls.destroy();
      this.hls = null;
    }
    super.destroy();
  }
}
