/** Minimal hls.js type definitions */
declare module 'hls.js' {
  interface HlsConfig {
    enableWorker?: boolean;
    startLevel?: number;
    capLevelToPlayerSize?: boolean;
    [key: string]: unknown;
  }

  interface HlsErrorData {
    type: string;
    details: string;
    fatal: boolean;
    url?: string;
    response?: { code: number };
    [key: string]: unknown;
  }

  export default class Hls {
    static isSupported(): boolean;
    static readonly Events: {
      ERROR: string;
      MANIFEST_PARSED: string;
      LEVEL_LOADED: string;
      [key: string]: string;
    };
    static readonly ErrorTypes: {
      NETWORK_ERROR: string;
      MEDIA_ERROR: string;
      OTHER_ERROR: string;
      [key: string]: string;
    };

    constructor(config?: HlsConfig);
    loadSource(src: string): void;
    attachMedia(media: HTMLVideoElement): void;
    startLoad(startPosition?: number): void;
    recoverMediaError(): void;
    on(event: string, handler: (event: string, data: HlsErrorData) => void): void;
    off(event: string, handler?: (event: string, data: HlsErrorData) => void): void;
    destroy(): void;
  }
}
