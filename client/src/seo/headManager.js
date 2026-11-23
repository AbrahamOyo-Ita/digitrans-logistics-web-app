import { SITE, canonicalUrlFor } from '../../../shared/site.js';
import { buildJsonLdGraph } from '../../../shared/jsonLd.js';
import { resolveRouteMeta } from '../../../shared/seoRoutes.js';

function upsertMeta(attrName, attrValue, content) {
  if (typeof document === 'undefined') return;
  let el = document.head.querySelector(`meta[${attrName}="${attrValue}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attrName, attrValue);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertCanonical(href) {
  if (typeof document === 'undefined') return;
  let el = document.head.querySelector('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

function upsertJsonLd(graphObj) {
  if (typeof document === 'undefined') return;
  const existing = document.head.querySelector('#digitrans-jsonld');
  if (!graphObj) {
    existing?.remove();
    return;
  }
  const el = existing || document.createElement('script');
  el.id = 'digitrans-jsonld';
  el.type = 'application/ld+json';
  el.textContent = JSON.stringify(graphObj);
  if (!existing) document.head.appendChild(el);
}

export function applyDocumentHead({ pathname = '/', search = '', titleOverride = null, robotsOverride = null, faqs = null } = {}) {
  if (typeof document === 'undefined') return;
  const meta = resolveRouteMeta(pathname, search);
  const title = titleOverride || meta.title;
  const robots = robotsOverride || meta.robots;
  const ogImageUrl = canonicalUrlFor(meta.ogImage || SITE.defaultOgImagePath);

  document.title = title;
  upsertMeta('name', 'description', meta.description);
  upsertMeta('name', 'robots', robots);
  upsertCanonical(meta.canonical);

  upsertMeta('property', 'og:type', meta.pageType === 'guide' ? 'article' : 'website');
  upsertMeta('property', 'og:site_name', SITE.name);
  upsertMeta('property', 'og:locale', SITE.ogLocale);
  upsertMeta('property', 'og:title', title);
  upsertMeta('property', 'og:description', meta.description);
  upsertMeta('property', 'og:url', meta.canonical);
  upsertMeta('property', 'og:image', ogImageUrl);
  upsertMeta('property', 'og:image:width', '1200');
  upsertMeta('property', 'og:image:height', '630');

  upsertMeta('name', 'twitter:card', 'summary_large_image');
  upsertMeta('name', 'twitter:title', title);
  upsertMeta('name', 'twitter:description', meta.description);
  upsertMeta('name', 'twitter:image', ogImageUrl);

  const graph = robots.startsWith('noindex') ? null : buildJsonLdGraph(meta, faqs);
  upsertJsonLd(graph);
}
