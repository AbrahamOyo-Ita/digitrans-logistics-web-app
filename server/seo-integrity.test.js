import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { buildJsonLdGraph } from '../shared/jsonLd.js';
import { MEDIA_MANIFEST } from '../shared/mediaManifest.js';
import { getAllPublicPrerenderRoutes, LEGACY_REDIRECTS, resolveRouteMeta } from '../shared/seoRoutes.js';
import { SITE, canonicalUrlFor } from '../shared/site.js';

const root = fileURLToPath(new URL('..', import.meta.url));

test('SITE constants and verified contact facts match canonical ground truth', () => {
  assert.equal(SITE.canonicalOrigin, 'https://www.digitransdelivery.com');
  assert.equal(SITE.email, 'digitransdeliveryandlogistics@gmail.com');
  assert.match(SITE.address, /No 2, Ituebange Street, Nyahasang, Atimbo, Calabar Municipal/);
  assert.equal(SITE.homepageTitle, 'DigiTrans Logistics - Delivery, market runs & waybills in Calabar');
  assert.equal(canonicalUrlFor('/'), 'https://www.digitransdelivery.com/');
  assert.equal(canonicalUrlFor('/services/local-delivery/'), 'https://www.digitransdelivery.com/services/local-delivery');
});

test('all indexable public routes have unique titles, <=155 char descriptions, and valid canonicals', () => {
  const routes = getAllPublicPrerenderRoutes();
  assert.ok(routes.length >= 30, `Expected >=30 public routes, got ${routes.length}`);
  const seenTitles = new Set();
  const seenDescriptions = new Set();

  for (const route of routes) {
    const meta = resolveRouteMeta(route, '');
    assert.equal(meta.notFound, false, `${route} should not resolve as 404`);
    assert.equal(meta.indexable, true, `${route} should be indexable`);
    assert.equal(meta.robots, 'index, follow');
    assert.ok(meta.canonical.startsWith('https://www.digitransdelivery.com/'));

    if (route === '/') {
      assert.equal(meta.title, SITE.homepageTitle);
    } else {
      assert.ok(meta.title.length <= 60, `Title too long (${meta.title.length}) on ${route}: ${meta.title}`);
    }
    assert.ok(meta.description.length <= 155, `Description too long (${meta.description.length}) on ${route}`);
    assert.ok(!seenTitles.has(meta.title), `Duplicate title on ${route}: ${meta.title}`);
    assert.ok(!seenDescriptions.has(meta.description), `Duplicate description on ${route}`);
    seenTitles.add(meta.title);
    seenDescriptions.add(meta.description);

    const mediaEntry = MEDIA_MANIFEST[meta.ogImage];
    assert.ok(mediaEntry, `Missing OG image entry in MEDIA_MANIFEST for ${meta.ogImage}`);
    assert.equal(mediaEntry.width, 1200);
    assert.equal(mediaEntry.height, 630);
  }
});

test('auth, workspace, tracking queries, and unknown routes are marked noindex', () => {
  for (const route of ['/login', '/register', '/forgot-password', '/reset-password', '/auth/verify', '/admin/invite', '/workspace', '/ops/dashboard', '/customer/booking']) {
    const meta = resolveRouteMeta(route, '');
    assert.equal(meta.indexable, false, `${route} must not be indexable`);
    assert.equal(meta.robots, 'noindex, nofollow');
    assert.equal(buildJsonLdGraph(meta), null);
  }

  const trackQueryMeta = resolveRouteMeta('/track', '?ref=DT-CAL-1234');
  assert.equal(trackQueryMeta.indexable, false);
  assert.equal(trackQueryMeta.robots, 'noindex, follow');

  const notFoundMeta = resolveRouteMeta('/does-not-exist-anywhere');
  assert.equal(notFoundMeta.notFound, true);
  assert.equal(notFoundMeta.robots, 'noindex, follow');
  assert.equal(buildJsonLdGraph(notFoundMeta), null);
});

test('JSON-LD graph uses single @graph without unverified ratings, hours, phones, or geo claims', () => {
  for (const route of ['/', '/services/local-delivery', '/cities/calabar', '/routes/calabar-to-port-harcourt', '/guides/how-delivery-pricing-works-in-calabar', '/faq']) {
    const meta = resolveRouteMeta(route);
    const graph = buildJsonLdGraph(meta);
    assert.ok(graph, `Missing JSON-LD for ${route}`);
    assert.equal(graph['@context'], 'https://schema.org');
    assert.ok(Array.isArray(graph['@graph']) && graph['@graph'].length >= 4);

    const raw = JSON.stringify(graph);
    assert.ok(!raw.includes('aggregateRating'));
    assert.ok(!raw.includes('openingHoursSpecification'));
    assert.ok(!raw.includes('801 234 5678'));
    assert.ok(!raw.includes('Marian Road'));
    assert.ok(!raw.includes('hello@digitrans.ng'));
    assert.match(raw, /digitransdeliveryandlogistics@gmail\.com/);
    assert.match(raw, /No 2, Ituebange Street/);
  }
});

test('vercel.json uses modern cleanUrls routing with real 404 support, 301 redirects, and noindex headers', async () => {
  const cfg = JSON.parse(await fs.readFile(path.join(root, 'vercel.json'), 'utf8'));
  assert.equal(cfg.routes, undefined, 'Legacy routes field must not coexist with cleanUrls/redirects/rewrites');
  assert.equal(cfg.cleanUrls, true);
  assert.equal(cfg.trailingSlash, false);

  const hasCatchAllRewrite = (cfg.rewrites || []).some((r) => r.source === '/(.*)' || r.source === '/:path*');
  assert.equal(hasCatchAllRewrite, false, 'Must not include catch-all 200 rewrite so unknown URLs return real 404');

  const apexRedirect = (cfg.redirects || []).find(
    (r) => r.has?.some((h) => h.type === 'host' && h.value === 'digitransdelivery.com') && r.statusCode === 301,
  );
  assert.ok(apexRedirect, 'Missing apex 301 canonical redirect');

  for (const legacy of LEGACY_REDIRECTS) {
    const match = (cfg.redirects || []).find((r) => r.source === legacy.from && r.destination === legacy.to && r.statusCode === 301);
    assert.ok(match, `Missing 301 legacy redirect for ${legacy.from} -> ${legacy.to}`);
  }

  const previewNoindexHeader = (cfg.headers || []).find(
    (h) =>
      h.has?.some((cond) => cond.type === 'host' && cond.value.includes('vercel\\.app')) &&
      h.headers?.some((hdr) => hdr.key === 'X-Robots-Tag' && hdr.value.includes('noindex')),
  );
  assert.ok(previewNoindexHeader, 'Missing X-Robots-Tag noindex header for *.vercel.app preview hosts');
});
