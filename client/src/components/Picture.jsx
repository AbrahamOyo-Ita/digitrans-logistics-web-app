import React from 'react';
import { MEDIA_MANIFEST } from '../../../shared/mediaManifest.js';

export default function Picture({
  src,
  alt = '',
  sizes = '(max-width: 768px) 100vw, 1200px',
  className = '',
  loading = 'lazy',
  decoding = 'async',
  fetchPriority,
  style,
  ariaHidden,
}) {
  const entry = MEDIA_MANIFEST[src];
  const width = entry?.width;
  const height = entry?.height;

  const webpSources = [];
  if (entry?.w640) webpSources.push(`${entry.w640} 640w`);
  if (entry?.w1200) webpSources.push(`${entry.w1200} 1200w`);
  if (entry?.webp && entry.width) webpSources.push(`${entry.webp} ${entry.width}w`);

  const imgProps = {
    src,
    alt,
    className,
    loading,
    decoding,
    ...(width ? { width } : {}),
    ...(height ? { height } : {}),
    ...(fetchPriority ? { fetchpriority: fetchPriority } : {}),
    ...(style ? { style } : {}),
    ...(ariaHidden !== undefined ? { 'aria-hidden': ariaHidden } : {}),
  };

  if (!webpSources.length) {
    return <img {...imgProps} />;
  }

  return (
    <picture className="contents">
      <source type="image/webp" srcSet={webpSources.join(', ')} sizes={sizes} />
      <img {...imgProps} />
    </picture>
  );
}
