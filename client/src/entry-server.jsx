import React from 'react';
import { renderToString } from 'react-dom/server';
import { buildJsonLdGraph } from '../../shared/jsonLd.js';
import { resolveRouteMeta } from '../../shared/seoRoutes.js';
import PublicSite from './pages/PublicSite';

const noop = () => {};

export function renderPublicRoute(pathname = '/') {
  const html = renderToString(
    <PublicSite page={pathname} navigate={noop} onLogin={noop} user={null} />,
  );
  const meta = resolveRouteMeta(pathname, '');
  const jsonLd = buildJsonLdGraph(meta);
  return { html, meta, jsonLd };
}
