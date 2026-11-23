import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { SITE, canonicalUrlFor } from '../shared/site.js';
import {
  CITIES,
  FAQS,
  GUIDES,
  HOW_IT_WORKS_STEPS,
  LEGAL_PAGES,
  PRICING_EXTRAS,
  PRICING_SUMMARY_ROWS,
  ROUTES,
  SERVICES,
  ZONES,
} from '../shared/seoContent.js';
import { getAllPublicPrerenderRoutes } from '../shared/seoRoutes.js';

const root = fileURLToPath(new URL('..', import.meta.url));
const distDir = path.join(root, 'dist');
const ssrEntry = path.join(root, 'dist-ssr', 'entry-server.js');

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function escapeJsonForScript(obj) {
  return JSON.stringify(obj).replaceAll('<', '\\u003c');
}

function outputHtmlPathForRoute(route) {
  if (route === '/') return path.join(distDir, 'index.html');
  const clean = route.replace(/^\/+/, '').replace(/\/+$/, '');
  return path.join(distDir, `${clean}.html`);
}

function outputMdPathForRoute(route) {
  if (route === '/') return path.join(distDir, 'index.md');
  const clean = route.replace(/^\/+/, '').replace(/\/+$/, '');
  return path.join(distDir, `${clean}.md`);
}

function publicMdUrlForRoute(route) {
  if (route === '/') return canonicalUrlFor('/index.md');
  const clean = route.replace(/^\/+/, '').replace(/\/+$/, '');
  return canonicalUrlFor(`/${clean}.md`);
}

function injectHeadTags(templateHtml, { meta, jsonLd, preloadFontHrefs = [], preloadImageTag = '', mdUrl = '' }) {
  const ogImageUrl = canonicalUrlFor(meta.ogImage || SITE.defaultOgImagePath);
  const ogType = meta.pageType === 'guide' ? 'article' : 'website';

  const headTags = [
    `<title>${escapeHtml(meta.title)}</title>`,
    `<meta name="description" content="${escapeHtml(meta.description)}" />`,
    `<meta name="robots" content="${escapeHtml(meta.robots)}" />`,
    !meta.notFound ? `<link rel="canonical" href="${escapeHtml(meta.canonical)}" />` : '',
    mdUrl && !meta.notFound ? `<link rel="alternate" type="text/markdown" href="${escapeHtml(mdUrl)}" />` : '',
    `<meta property="og:type" content="${ogType}" />`,
    `<meta property="og:site_name" content="${escapeHtml(SITE.name)}" />`,
    `<meta property="og:locale" content="${escapeHtml(SITE.ogLocale)}" />`,
    `<meta property="og:title" content="${escapeHtml(meta.title)}" />`,
    `<meta property="og:description" content="${escapeHtml(meta.description)}" />`,
    !meta.notFound ? `<meta property="og:url" content="${escapeHtml(meta.canonical)}" />` : '',
    `<meta property="og:image" content="${escapeHtml(ogImageUrl)}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escapeHtml(meta.title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(meta.description)}" />`,
    `<meta name="twitter:image" content="${escapeHtml(ogImageUrl)}" />`,
    preloadImageTag,
    ...preloadFontHrefs.map((href) => `<link rel="preload" as="font" type="font/woff2" crossorigin href="${escapeHtml(href)}" />`),
    jsonLd ? `<script id="digitrans-jsonld" type="application/ld+json">${escapeJsonForScript(jsonLd)}</script>` : '',
  ]
    .filter(Boolean)
    .join('\n');

  let out = templateHtml;
  // Remove baseline SEO tags from template so there are never duplicates
  out = out.replace(/<title>[\s\S]*?<\/title>\s*/gi, '');
  out = out.replace(/<meta\s+(?:name|property)=["'](?:description|robots|og:[^"']+|twitter:[^"']+)["'][^>]*>\s*/gi, '');
  out = out.replace(/<link\s+rel=["']canonical["'][^>]*>\s*/gi, '');
  out = out.replace('</head>', `${headTags}\n</head>`);
  return out;
}

function buildMarkdownForRoute(route, meta) {
  const lines = [`# ${meta.title}`, '', `> ${meta.description}`, '', `Canonical URL: ${meta.canonical}`, ''];

  if (route === '/') {
    lines.push(
      `## About ${SITE.name}`,
      '',
      `${SITE.name} operates local delivery, Watt & Marian Market Runs, UNICAL student drops, vendor dispatch, scheduled pickups, and intercity waybills linking Calabar, Port Harcourt, and Obudu from ${SITE.address}.`,
      '',
      '## Core Services',
      ...SERVICES.map((s) => `- [${s.name}](${canonicalUrlFor(`/services/${s.slug}`)}): ${s.tagline}`),
      '',
      '## Cities & Intercity Corridors',
      ...CITIES.map((c) => `- [${c.name} (${c.state})](${canonicalUrlFor(`/cities/${c.slug}`)})`),
      ...ROUTES.map((r) => `- [${r.title}](${canonicalUrlFor(`/routes/${r.slug}`)})`),
      '',
      `Contact email: ${SITE.email}`,
    );
  } else if (meta.pageType === 'service' && meta.entity) {
    const s = meta.entity;
    lines.push('## Summary', '', s.answerSummary, '', s.description, '', '## Highlights', ...s.highlights.map((h) => `- ${h}`), '', '## Process', ...s.steps.map((st, idx) => `${idx + 1}. **${st.title}** — ${st.body}`), '', '## FAQs', ...s.faqs.flatMap((f) => [`### ${f.q}`, f.a, '']));
  } else if (meta.pageType === 'city' && meta.entity) {
    const c = meta.entity;
    lines.push('## City Overview', '', c.answerSummary, '', `Hub details: ${c.officeAddress}`, '', '## Coverage Areas', ...c.areasCovered.map((a) => `- ${a}`), '', '## FAQs', ...c.faqs.flatMap((f) => [`### ${f.q}`, f.a, '']));
  } else if (meta.pageType === 'route' && meta.entity) {
    const r = meta.entity;
    lines.push('## Corridor Overview', '', r.answerSummary, '', `- Origin: ${r.fromCity}`, `- Destination: ${r.toCity}`, `- Intake: ${r.intakeLocation}`, `- Dispatch: ${r.deliveryWindow}`, `- Pricing: ${r.pricingNote}`, '', '## Common Shipments', ...r.idealFor.map((i) => `- ${i}`), '', '## FAQs', ...r.faqs.flatMap((f) => [`### ${f.q}`, f.a, '']));
  } else if (meta.pageType === 'guide' && meta.entity) {
    const g = meta.entity;
    lines.push(`Published: ${g.dateLabel} · ${g.readTime}`, '', '## Summary', '', g.answerSummary, '');
    for (const block of g.body) {
      if (block.heading) lines.push(`## ${block.heading}`, '');
      for (const p of block.paragraphs) lines.push(p, '');
      if (block.bullets) {
        for (const b of block.bullets) lines.push(`- ${b}`);
        lines.push('');
      }
    }
    if (g.faqs?.length) {
      lines.push('## FAQs', ...g.faqs.flatMap((f) => [`### ${f.q}`, f.a, '']));
    }
  } else if (route === '/pricing') {
    lines.push('## Tariffs & Pricing Rules', '', ...PRICING_SUMMARY_ROWS.map(([s, b, n]) => `- **${s}**: ${b} (${n})`), '', '## Extras', ...PRICING_EXTRAS.map(([l, a, n]) => `- **${l}**: ${a} — ${n}`));
  } else if (route === '/coverage') {
    lines.push('## Calabar Zones', ...ZONES.map((z) => `- **${z.name}** (${z.lga}): ${z.landmarks.join(', ')}`), '', '## Intercity Corridors', ...ROUTES.map((r) => `- ${r.fromCity} -> ${r.toCity}: ${canonicalUrlFor(`/routes/${r.slug}`)}`));
  } else if (route === '/how-it-works') {
    for (const grp of HOW_IT_WORKS_STEPS) {
      lines.push(`## ${grp.service}`, ...grp.steps.map((s, idx) => `${idx + 1}. ${s}`), '');
    }
  } else if (route === '/faq') {
    lines.push(...FAQS.flatMap((f) => [`## ${f.q}`, f.a, '']));
  } else if (meta.pageType === 'legal' && meta.entity) {
    const l = meta.entity;
    lines.push(...l.sections.flatMap(([h, b]) => [`## ${h}`, b, '']));
  } else {
    lines.push(`Headquarters: ${SITE.address}`, `Contact Email: ${SITE.email}`);
  }

  return `${lines.join('\n').trim()}\n`;
}

async function generateDiscoveryFiles(publicRoutes) {
  const today = new Date().toISOString().slice(0, 10);

  // 1. robots.txt
  const robotsTxt = [
    'User-agent: *',
    'Allow: /',
    'Disallow: /api/',
    'Disallow: /uploads/',
    'Disallow: /workspace',
    'Disallow: /login',
    'Disallow: /register',
    'Disallow: /forgot-password',
    'Disallow: /reset-password',
    'Disallow: /auth/',
    'Disallow: /admin/',
    'Disallow: /payment/',
    'Disallow: /customer/',
    'Disallow: /rider/',
    'Disallow: /vendor/',
    'Disallow: /investor/',
    'Disallow: /ops/',
    '',
    `Sitemap: ${canonicalUrlFor('/sitemap.xml')}`,
    '',
  ].join('\n');
  await fs.writeFile(path.join(distDir, 'robots.txt'), robotsTxt);

  // 2. sitemap.xml (strictly canonical indexable URLs only)
  const urls = publicRoutes.map((route) => {
    const loc = canonicalUrlFor(route);
    return `  <url>\n    <loc>${escapeHtml(loc)}</loc>\n    <lastmod>${today}</lastmod>\n  </url>`;
  });
  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;
  await fs.writeFile(path.join(distDir, 'sitemap.xml'), sitemapXml);

  // 3. llms.txt & llms-full.txt (per llmstxt.org conventions)
  const llmsTxt = [
    `# ${SITE.name}`,
    '',
    `> DigiTrans Logistics is a delivery and intercity waybill company in Calabar, Cross River State, Nigeria (${SITE.address}), providing local parcel delivery, Market Runs, verified UNICAL student rates, business vendor logistics, scheduled pickups, and tracked intercity waybills between Calabar, Port Harcourt, and Obudu.`,
    '',
    `Contact: ${SITE.email}`,
    '',
    '## Core Pages',
    `- [Home](${canonicalUrlFor('/')}): Main Calabar dispatch overview & live tracking.`,
    `- [How It Works](${canonicalUrlFor('/how-it-works')}): Booking workflows across local delivery, Market Runs, student drops, and waybills.`,
    `- [Pricing](${canonicalUrlFor('/pricing')}): Transparent fare structure & planning estimator.`,
    `- [Coverage](${canonicalUrlFor('/coverage')}): 12 Calabar zones plus Port Harcourt and Obudu corridors.`,
    `- [Track Delivery](${canonicalUrlFor('/track')}): Track DT-CAL delivery & DT-WB waybill references.`,
    `- [FAQ](${canonicalUrlFor('/faq')}): Direct answers on coverage, pricing, Market Runs, and prohibited items.`,
    `- [Contact](${canonicalUrlFor('/contact')}): Support form, email, and Calabar office address.`,
    '',
    '## Services',
    ...SERVICES.map((s) => `- [${s.name}](${canonicalUrlFor(`/services/${s.slug}`)}): ${s.tagline}`),
    '',
    '## Cities & Intercity Corridors',
    ...CITIES.map((c) => `- [${c.name} (${c.state})](${canonicalUrlFor(`/cities/${c.slug}`)}): ${c.metaDescription}`),
    ...ROUTES.map((r) => `- [${r.title}](${canonicalUrlFor(`/routes/${r.slug}`)}): ${r.metaDescription}`),
    '',
    '## Logistics Guides',
    ...GUIDES.map((g) => `- [${g.title}](${canonicalUrlFor(`/guides/${g.slug}`)}): ${g.excerpt}`),
    '',
    '## Policies',
    ...Object.entries(LEGAL_PAGES).map(([slug, page]) => `- [${page.title}](${canonicalUrlFor(slug)}): ${page.lead}`),
    '',
    `Full AI reference corpus: [llms-full.txt](${canonicalUrlFor('/llms-full.txt')})`,
    '',
  ].join('\n');
  await fs.writeFile(path.join(distDir, 'llms.txt'), llmsTxt);

  // 4. llms-full.txt
  const fullSections = [
    `# ${SITE.name} — Complete Ground-Truth Reference`,
    '',
    `- Brand Name: ${SITE.name} (also known as ${SITE.alternateNames.join(', ')})`,
    `- Canonical Website: ${SITE.canonicalOrigin}/`,
    `- Office Address: ${SITE.address}`,
    `- Official Email: ${SITE.email}`,
    '- Primary Local Base: Calabar (Calabar Municipal, Calabar South, UNICAL, Marian, State Housing, Atimbo, 8 Miles)',
    '- Intercity Waybill Corridors: Calabar <-> Port Harcourt, Calabar <-> Obudu',
    '',
    '---',
    '',
    '## Services',
    ...SERVICES.flatMap((s) => [
      `### ${s.name} (${canonicalUrlFor(`/services/${s.slug}`)})`,
      s.answerSummary,
      '',
      ...s.highlights.map((h) => `- ${h}`),
      '',
    ]),
    '---',
    '',
    '## Cities',
    ...CITIES.flatMap((c) => [
      `### ${c.name}, ${c.state} (${canonicalUrlFor(`/cities/${c.slug}`)})`,
      c.answerSummary,
      '',
      ...c.areasCovered.map((a) => `- ${a}`),
      '',
    ]),
    '---',
    '',
    '## Intercity Routes',
    ...ROUTES.flatMap((r) => [
      `### ${r.title} (${canonicalUrlFor(`/routes/${r.slug}`)})`,
      r.answerSummary,
      '',
    ]),
    '---',
    '',
    '## Frequently Asked Questions',
    ...FAQS.flatMap((f) => [`### ${f.q}`, f.a, '']),
    '---',
    '',
    '## Editorial Guides',
    ...GUIDES.flatMap((g) => [
      `### ${g.title} (${canonicalUrlFor(`/guides/${g.slug}`)})`,
      g.answerSummary,
      '',
    ]),
  ].join('\n');
  await fs.writeFile(path.join(distDir, 'llms-full.txt'), fullSections);

  // Optional IndexNow key file when INDEXNOW_KEY is present in build environment
  const indexNowKey = String(process.env.INDEXNOW_KEY || '').trim();
  if (indexNowKey) {
    await fs.writeFile(path.join(distDir, `${indexNowKey}.txt`), `${indexNowKey}\n`);
  }
}

async function main() {
  const templateHtml = await fs.readFile(path.join(distDir, 'index.html'), 'utf8');
  const assetFiles = await fs.readdir(path.join(distDir, 'assets')).catch(() => []);
  const preloadFontHrefs = assetFiles
    .filter((f) => /^inter(?:-tight)?-latin-wght-normal-.*\.woff2$/.test(f))
    .slice(0, 2)
    .map((f) => `/assets/${f}`);

  // Preserve an un-prerendered noindex shell for client-only auth & workspace routes
  const appShellTemplate = templateHtml.replace(
    '<div id="root"></div>',
    '<div id="root"><main style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:2rem;background:#f7f8f6;color:#0b1b2b;font-family:system-ui,-apple-system,sans-serif"><div style="max-width:28rem;text-align:center"><h1 style="font-size:1.5rem;font-weight:700;margin:0 0 .75rem">DigiTrans Logistics Workspace</h1><p style="font-size:.9375rem;line-height:1.6;color:#475569;margin:0 0 1.25rem">Sign in or create an account to book local deliveries, approve Market Runs, or manage intercity waybills across Calabar, Port Harcourt, and Obudu.</p><noscript>Enable JavaScript to sign in and use the DigiTrans Logistics workspace.</noscript></div></main></div>',
  );
  const appShellHtml = injectHeadTags(appShellTemplate, {
    meta: {
      title: 'Workspace | DigiTrans Logistics',
      description: 'Secure DigiTrans Logistics account and operations workspace.',
      robots: 'noindex, nofollow',
      canonical: canonicalUrlFor('/workspace'),
      notFound: true,
    },
    jsonLd: null,
  });
  await fs.writeFile(path.join(distDir, 'app-shell.html'), appShellHtml);

  const { renderPublicRoute } = await import(pathToFileURL(ssrEntry).href);
  const publicRoutes = getAllPublicPrerenderRoutes();

  for (const route of publicRoutes) {
    const { html, meta, jsonLd } = renderPublicRoute(route);
    const mdPath = outputMdPathForRoute(route);
    const mdUrl = publicMdUrlForRoute(route);

    const preloadImageTag =
      route === '/'
        ? `<link rel="preload" as="image" href="/images/street-wide-1200w.webp" imagesrcset="/images/street-wide-640w.webp 640w, /images/street-wide-1200w.webp 1200w, /images/street-wide.webp 1672w" imagesizes="100vw" fetchpriority="high" />`
        : '';

    const withRoot = templateHtml.replace(
      '<div id="root"></div>',
      `<div id="root" data-ssr="1">${html}</div>`,
    );
    const finalHtml = injectHeadTags(withRoot, {
      meta,
      jsonLd,
      preloadFontHrefs,
      preloadImageTag,
      mdUrl,
    });

    const outHtmlFile = outputHtmlPathForRoute(route);
    await fs.mkdir(path.dirname(outHtmlFile), { recursive: true });
    await fs.writeFile(outHtmlFile, finalHtml);

    await fs.mkdir(path.dirname(mdPath), { recursive: true });
    await fs.writeFile(mdPath, buildMarkdownForRoute(route, meta));
  }

  // Dedicated 404.html for real HTTP 404 status on unknown paths
  const notFoundRender = renderPublicRoute('/__not_found__');
  const notFoundHtml = injectHeadTags(
    templateHtml.replace('<div id="root"></div>', `<div id="root" data-ssr="1">${notFoundRender.html}</div>`),
    {
      meta: notFoundRender.meta,
      jsonLd: null,
      preloadFontHrefs,
    },
  );
  await fs.writeFile(path.join(distDir, '404.html'), notFoundHtml);

  await generateDiscoveryFiles(publicRoutes);

  // Clean temporary SSR bundle directory
  await fs.rm(path.join(root, 'dist-ssr'), { recursive: true, force: true });

  console.log(`Prerendered ${publicRoutes.length} public pages + 404.html + app-shell.html + Markdown mirrors + robots.txt + sitemap.xml + llms.txt`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
