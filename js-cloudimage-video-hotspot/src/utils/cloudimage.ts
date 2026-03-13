import type { CloudimageConfig } from '../core/types';

const DEFAULT_DOMAIN = 'cloudimg.io';
const DEFAULT_API_VERSION = 'v7';

/** Build a Cloudimage CDN URL for poster images or thumbnails */
export function buildCloudimageUrl(
  src: string,
  config: CloudimageConfig,
  width?: number,
): string {
  const domain = config.domain || DEFAULT_DOMAIN;
  const apiVersion = config.apiVersion || DEFAULT_API_VERSION;

  const encodedSrc = encodeURI(src);
  let url = `https://${config.token}.${domain}/${apiVersion}/${encodedSrc}`;
  if (width) {
    url += `?width=${width}`;
  }
  if (config.params) {
    url += (width ? '&' : '?') + config.params;
  }
  return url;
}
