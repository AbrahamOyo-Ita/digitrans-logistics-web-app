import { SITE, canonicalUrlFor } from './site.js';
import { FAQS } from './seoContent.js';

const ORG_ID = `${SITE.canonicalOrigin}/#organization`;
const LOCAL_BUSINESS_ID = `${SITE.canonicalOrigin}/#localbusiness`;
const WEBSITE_ID = `${SITE.canonicalOrigin}/#website`;

function buildPostalAddress() {
  return {
    '@type': 'PostalAddress',
    streetAddress: SITE.addressParts.streetAddress,
    addressLocality: SITE.addressParts.addressLocality,
    addressRegion: SITE.addressParts.addressRegion,
    addressCountry: SITE.addressParts.addressCountry,
  };
}

function buildAreaServed() {
  return [
    { '@type': 'City', name: 'Calabar' },
    { '@type': 'City', name: 'Port Harcourt' },
    { '@type': 'City', name: 'Obudu' },
    { '@type': 'AdministrativeArea', name: 'Cross River State' },
    { '@type': 'Country', name: 'Nigeria' },
  ];
}

export function buildOrganizationNode() {
  return {
    '@type': 'Organization',
    '@id': ORG_ID,
    name: SITE.name,
    alternateName: SITE.alternateNames,
    url: `${SITE.canonicalOrigin}/`,
    logo: {
      '@type': 'ImageObject',
      url: canonicalUrlFor(SITE.appIconPath),
      width: 512,
      height: 512,
    },
    email: SITE.email,
    address: buildPostalAddress(),
    areaServed: buildAreaServed(),
    contactPoint: [
      {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        email: SITE.email,
        areaServed: 'NG',
        availableLanguage: ['en'],
      },
    ],
  };
}

export function buildLocalBusinessNode() {
  return {
    '@type': ['LocalBusiness', 'CourierService'],
    '@id': LOCAL_BUSINESS_ID,
    name: SITE.name,
    alternateName: SITE.alternateNames,
    url: `${SITE.canonicalOrigin}/`,
    image: canonicalUrlFor(SITE.defaultOgImagePath),
    email: SITE.email,
    address: buildPostalAddress(),
    areaServed: buildAreaServed(),
    parentOrganization: { '@id': ORG_ID },
  };
}

export function buildWebsiteNode() {
  return {
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    url: `${SITE.canonicalOrigin}/`,
    name: SITE.name,
    alternateName: SITE.alternateNames,
    inLanguage: SITE.defaultLocale,
    publisher: { '@id': ORG_ID },
  };
}

export function buildBreadcrumbNode(canonical, trail = []) {
  const items = [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Home',
      item: `${SITE.canonicalOrigin}/`,
    },
    ...trail.map((item, idx) => ({
      '@type': 'ListItem',
      position: idx + 2,
      name: item.label,
      ...(item.href ? { item: canonicalUrlFor(item.href) } : {}),
    })),
  ];
  return {
    '@type': 'BreadcrumbList',
    '@id': `${canonical}#breadcrumb`,
    itemListElement: items,
  };
}

export function buildFaqNode(canonical, items = []) {
  const entities = items
    .map((item) => ({
      q: item.question || item.q,
      a: item.answer || item.a,
    }))
    .filter((row) => row.q && row.a)
    .map((row) => ({
      '@type': 'Question',
      name: row.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: row.a,
      },
    }));

  if (!entities.length) return null;
  return {
    '@type': 'FAQPage',
    '@id': `${canonical}#faq`,
    mainEntity: entities,
  };
}

export function buildJsonLdGraph(routeMeta, dynamicFaqs = null) {
  if (!routeMeta || routeMeta.notFound || !routeMeta.indexable) {
    return null;
  }

  const canonical = routeMeta.canonical;
  const graph = [buildOrganizationNode(), buildLocalBusinessNode(), buildWebsiteNode()];

  const webpageNode = {
    '@type': routeMeta.pageType === 'about' ? 'AboutPage' : routeMeta.pageType === 'contact' ? 'ContactPage' : 'WebPage',
    '@id': `${canonical}#webpage`,
    url: canonical,
    name: routeMeta.title,
    description: routeMeta.description,
    inLanguage: SITE.defaultLocale,
    isPartOf: { '@id': WEBSITE_ID },
    about: { '@id': ORG_ID },
  };

  if (routeMeta.breadcrumbs?.length) {
    const breadcrumbNode = buildBreadcrumbNode(canonical, routeMeta.breadcrumbs);
    webpageNode.breadcrumb = { '@id': breadcrumbNode['@id'] };
    graph.push(breadcrumbNode);
  }
  graph.push(webpageNode);

  if (routeMeta.pageType === 'service' && routeMeta.entity) {
    const service = routeMeta.entity;
    graph.push({
      '@type': 'Service',
      '@id': `${canonical}#service`,
      name: service.name,
      description: service.answerSummary || service.blurb,
      serviceType: service.shortName,
      url: canonical,
      provider: { '@id': ORG_ID },
      areaServed: buildAreaServed(),
    });
    const faqNode = buildFaqNode(canonical, service.faqs);
    if (faqNode) graph.push(faqNode);
  } else if (routeMeta.pageType === 'city' && routeMeta.entity) {
    const city = routeMeta.entity;
    graph.push({
      '@type': 'Service',
      '@id': `${canonical}#service`,
      name: city.title,
      description: city.answerSummary,
      serviceType: 'Courier and parcel delivery service',
      url: canonical,
      provider: { '@id': ORG_ID },
      areaServed: { '@type': 'City', name: city.name },
    });
    const faqNode = buildFaqNode(canonical, city.faqs);
    if (faqNode) graph.push(faqNode);
  } else if (routeMeta.pageType === 'route' && routeMeta.entity) {
    const route = routeMeta.entity;
    graph.push({
      '@type': 'Service',
      '@id': `${canonical}#service`,
      name: route.title,
      description: route.answerSummary,
      serviceType: `Intercity waybill delivery (${route.fromCity} to ${route.toCity})`,
      url: canonical,
      provider: { '@id': ORG_ID },
      areaServed: [
        { '@type': 'City', name: route.fromCity },
        { '@type': 'City', name: route.toCity },
      ],
    });
    const faqNode = buildFaqNode(canonical, route.faqs);
    if (faqNode) graph.push(faqNode);
  } else if (routeMeta.pageType === 'faq') {
    const visibleFaqs = dynamicFaqs?.length ? dynamicFaqs : FAQS;
    const faqNode = buildFaqNode(canonical, visibleFaqs);
    if (faqNode) graph.push(faqNode);
  } else if (routeMeta.pageType === 'guide' && routeMeta.entity) {
    const guide = routeMeta.entity;
    graph.push({
      '@type': 'BlogPosting',
      '@id': `${canonical}#article`,
      headline: guide.title,
      description: guide.excerpt,
      image: canonicalUrlFor(guide.ogImage || guide.image),
      datePublished: guide.datePublished,
      dateModified: guide.datePublished,
      inLanguage: SITE.defaultLocale,
      mainEntityOfPage: { '@id': `${canonical}#webpage` },
      author: { '@id': ORG_ID },
      publisher: { '@id': ORG_ID },
    });
    const faqNode = buildFaqNode(canonical, guide.faqs || []);
    if (faqNode) graph.push(faqNode);
  }

  return {
    '@context': 'https://schema.org',
    '@graph': graph,
  };
}
