import { SITE, canonicalUrlFor } from './site.js';
import {
  CITY_BY_SLUG,
  CITIES,
  GUIDE_BY_SLUG,
  GUIDES,
  LEGAL_PAGES,
  ROUTE_BY_SLUG,
  ROUTES,
  SERVICE_BY_SLUG,
  SERVICES,
} from './seoContent.js';

export const LEGACY_REDIRECTS = Object.freeze([
  { from: '/local-delivery', to: '/services/local-delivery' },
  { from: '/services/standard-delivery', to: '/services/local-delivery' },
  { from: '/market-runs', to: '/services/market-runs' },
  { from: '/student-delivery', to: '/services/student-delivery' },
  { from: '/intercity-delivery', to: '/services/intercity-waybill' },
  { from: '/services/waybills', to: '/services/intercity-waybill' },
  { from: '/business', to: '/services/business-logistics' },
  { from: '/insights', to: '/guides' },
  { from: '/insights/delivery-costs-in-calabar', to: '/guides/how-delivery-pricing-works-in-calabar' },
  { from: '/insights/market-run-checklist', to: '/guides/watt-market-and-marian-market-run-checklist' },
  { from: '/insights/sending-parcels-out-of-calabar', to: '/guides/sending-waybills-from-calabar-to-port-harcourt' },
]);

export const LEGACY_REDIRECT_MAP = Object.freeze(
  Object.fromEntries(LEGACY_REDIRECTS.map((entry) => [entry.from, entry.to]))
);

export const NOINDEX_PATHS = Object.freeze([
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/auth/verify',
  '/admin/invite',
  '/workspace',
  '/payment/return',
]);

export const NOINDEX_PREFIXES = Object.freeze([
  '/customer',
  '/rider',
  '/vendor',
  '/investor',
  '/ops',
  '/auth/',
  '/api/',
]);

export function normalizePathname(rawPath = '/') {
  const withoutHash = String(rawPath || '/').split('#')[0];
  const [pathnameOnly] = withoutHash.split('?');
  const cleaned = pathnameOnly.replace(/\/+$/, '') || '/';
  return cleaned.startsWith('/') ? cleaned : `/${cleaned}`;
}

export function isNoindexRoute(pathname = '/', search = '') {
  const clean = normalizePathname(pathname);
  if (NOINDEX_PATHS.includes(clean)) return true;
  if (
    NOINDEX_PREFIXES.some((prefix) => {
      const normalizedPrefix = prefix.endsWith('/') ? prefix : `${prefix}/`;
      return clean === prefix || clean.startsWith(normalizedPrefix);
    })
  ) {
    return true;
  }
  if (clean === '/track' && new URLSearchParams(search || '').get('ref')) return true;
  return false;
}

const STATIC_PUBLIC_META = {
  '/': {
    title: SITE.homepageTitle,
    description:
      'Local delivery, Market Runs, UNICAL student drops, and tracked intercity waybills linking Calabar, Port Harcourt, and Obudu.',
    ogImage: '/images/og/og-default.jpg',
    preloadImage: '/images/street-wide-1200w.webp',
    pageType: 'home',
    breadcrumbs: [],
  },
  '/services': {
    title: 'Logistics Services in Calabar | DigiTrans Logistics',
    description:
      'Explore DigiTrans services: local parcel delivery, Market Runs, student drops, business logistics, scheduled pickups, and waybills.',
    ogImage: '/images/og/og-services.jpg',
    pageType: 'services',
    breadcrumbs: [{ label: 'Services', href: '/services' }],
  },
  '/how-it-works': {
    title: 'How DigiTrans Works | Calabar Delivery & Waybills',
    description:
      'Step-by-step guide to booking Calabar local deliveries, approving Market Runs, student verification, and intercity waybills.',
    ogImage: '/images/og/og-services.jpg',
    pageType: 'how-it-works',
    breadcrumbs: [{ label: 'How it works', href: '/how-it-works' }],
  },
  '/pricing': {
    title: 'Delivery & Waybill Pricing | DigiTrans Logistics',
    description:
      'See how DigiTrans calculates local Calabar delivery fees, Market Run estimates, student discounts, and intercity waybill tariffs.',
    ogImage: '/images/og/og-pricing.jpg',
    pageType: 'pricing',
    breadcrumbs: [{ label: 'Pricing', href: '/pricing' }],
  },
  '/coverage': {
    title: 'Calabar Delivery Zones & Intercity Routes | DigiTrans',
    description:
      'Check DigiTrans coverage across 12 Calabar zones plus intercity parcel corridors linking Calabar, Port Harcourt, and Obudu.',
    ogImage: '/images/og/og-cities.jpg',
    pageType: 'coverage',
    breadcrumbs: [{ label: 'Coverage', href: '/coverage' }],
  },
  '/faq': {
    title: 'Frequently Asked Questions | DigiTrans Logistics',
    description:
      'Clear answers about Calabar delivery coverage, fare calculation, Market Runs, intercity waybills, tracking, and prohibited goods.',
    ogImage: '/images/og/og-guides.jpg',
    pageType: 'faq',
    breadcrumbs: [{ label: 'FAQ', href: '/faq' }],
  },
  '/about': {
    title: 'About DigiTrans Logistics | Calabar, Cross River State',
    description:
      'Meet DigiTrans Logistics at Nyahasang, Atimbo in Calabar Municipal. Learn how our local dispatch, riders, and waybill team operate.',
    ogImage: '/images/og/og-default.jpg',
    pageType: 'about',
    breadcrumbs: [{ label: 'About', href: '/about' }],
  },
  '/contact': {
    title: 'Contact DigiTrans Logistics | Calabar Dispatch & Support',
    description:
      'Send an enquiry to digitransdeliveryandlogistics@gmail.com or visit No 2, Ituebange Street, Nyahasang, Atimbo, Calabar Municipal.',
    ogImage: '/images/og/og-default.jpg',
    pageType: 'contact',
    breadcrumbs: [{ label: 'Contact', href: '/contact' }],
  },
  '/track': {
    title: 'Track Delivery or Waybill | DigiTrans Logistics',
    description:
      'Enter your DT-CAL delivery or DT-WB waybill reference number to check live DigiTrans status milestones and timeline updates.',
    ogImage: '/images/og/og-routes.jpg',
    pageType: 'track',
    breadcrumbs: [{ label: 'Track', href: '/track' }],
  },
  '/quote': {
    title: 'Get a Delivery Estimate | DigiTrans Logistics Calabar',
    description:
      'Estimate Calabar delivery, Market Run, student, or parcel route charges before booking online with DigiTrans Logistics.',
    ogImage: '/images/og/og-pricing.jpg',
    pageType: 'quote',
    breadcrumbs: [{ label: 'Get a quote', href: '/quote' }],
  },
  '/guides': {
    title: 'Calabar Logistics & Delivery Guides | DigiTrans',
    description:
      'Practical logistics guides for Calabar pricing, Watt Market runs, UNICAL student drops, parcel packing, and intercity waybills.',
    ogImage: '/images/og/og-guides.jpg',
    pageType: 'guides',
    breadcrumbs: [{ label: 'Guides', href: '/guides' }],
  },
  '/rider-registration': {
    title: 'Rider Onboarding in Calabar | DigiTrans Logistics',
    description:
      'Join the DigiTrans rider network in Calabar with verified identity, guarantor documents, and transparent workspace earnings tracking.',
    ogImage: '/images/og/og-services.jpg',
    pageType: 'rider-registration',
    breadcrumbs: [{ label: 'Rider registration', href: '/rider-registration' }],
  },
  '/investment-information': {
    title: 'Investor Information | DigiTrans Logistics',
    description:
      'Review investor onboarding requirements, risk disclosures, and verification guidelines before applying on DigiTrans.',
    ogImage: '/images/og/og-default.jpg',
    pageType: 'investment-information',
    breadcrumbs: [{ label: 'Investment information', href: '/investment-information' }],
  },
};

export function resolveRouteMeta(rawPath = '/', search = '') {
  const clean = normalizePathname(rawPath);
  const redirected = LEGACY_REDIRECT_MAP[clean] || clean;
  const searchParams = new URLSearchParams(search || '');

  // Auth / workspace / payment-return routes (client-only, always noindex)
  if (isNoindexRoute(redirected, '') && redirected !== '/track') {
    const authTitles = {
      '/login': 'Sign in | DigiTrans Logistics',
      '/register': 'Create an account | DigiTrans Logistics',
      '/forgot-password': 'Reset password | DigiTrans Logistics',
      '/reset-password': 'Choose a new password | DigiTrans Logistics',
      '/auth/verify': 'Verify email | DigiTrans Logistics',
      '/admin/invite': 'Administrator invitation | DigiTrans Logistics',
      '/payment/return': 'Payment status | DigiTrans Logistics',
    };
    return {
      path: redirected,
      canonical: canonicalUrlFor(redirected),
      title: authTitles[redirected] || 'Workspace | DigiTrans Logistics',
      description: 'Secure DigiTrans Logistics account and operations workspace.',
      ogImage: '/images/og/og-default.jpg',
      robots: 'noindex, nofollow',
      indexable: false,
      pageType: 'app',
      breadcrumbs: [],
      notFound: false,
    };
  }

  // Static core routes
  if (STATIC_PUBLIC_META[redirected]) {
    const meta = STATIC_PUBLIC_META[redirected];
    const hasTrackRef = redirected === '/track' && Boolean(searchParams.get('ref')?.trim());
    return {
      path: redirected,
      canonical: canonicalUrlFor(redirected),
      title: meta.title,
      description: meta.description,
      ogImage: meta.ogImage,
      preloadImage: meta.preloadImage || null,
      robots: hasTrackRef ? 'noindex, follow' : 'index, follow',
      indexable: !hasTrackRef,
      pageType: meta.pageType,
      breadcrumbs: meta.breadcrumbs,
      notFound: false,
    };
  }

  // Service detail routes
  if (redirected.startsWith('/services/')) {
    const slug = redirected.slice('/services/'.length);
    const service = SERVICE_BY_SLUG[slug];
    if (service) {
      return {
        path: redirected,
        canonical: canonicalUrlFor(redirected),
        title: service.metaTitle || `${service.name} | DigiTrans Logistics`,
        description: service.blurb.slice(0, 155),
        ogImage: service.ogImage || '/images/og/og-services.jpg',
        robots: 'index, follow',
        indexable: true,
        pageType: 'service',
        entity: service,
        breadcrumbs: [
          { label: 'Services', href: '/services' },
          { label: service.shortName, href: redirected },
        ],
        notFound: false,
      };
    }
  }

  // City pages
  if (redirected.startsWith('/cities/')) {
    const slug = redirected.slice('/cities/'.length);
    const city = CITY_BY_SLUG[slug];
    if (city) {
      return {
        path: redirected,
        canonical: canonicalUrlFor(redirected),
        title: city.metaTitle,
        description: city.metaDescription,
        ogImage: city.ogImage || '/images/og/og-cities.jpg',
        robots: 'index, follow',
        indexable: true,
        pageType: 'city',
        entity: city,
        breadcrumbs: [
          { label: 'Coverage', href: '/coverage' },
          { label: city.name, href: redirected },
        ],
        notFound: false,
      };
    }
  }

  // Intercity route pages
  if (redirected.startsWith('/routes/')) {
    const slug = redirected.slice('/routes/'.length);
    const route = ROUTE_BY_SLUG[slug];
    if (route) {
      return {
        path: redirected,
        canonical: canonicalUrlFor(redirected),
        title: route.metaTitle,
        description: route.metaDescription,
        ogImage: route.ogImage || '/images/og/og-routes.jpg',
        robots: 'index, follow',
        indexable: true,
        pageType: 'route',
        entity: route,
        breadcrumbs: [
          { label: 'Coverage', href: '/coverage' },
          { label: `${route.fromCity} to ${route.toCity}`, href: redirected },
        ],
        notFound: false,
      };
    }
  }

  // Guide articles
  if (redirected.startsWith('/guides/')) {
    const slug = redirected.slice('/guides/'.length);
    const guide = GUIDE_BY_SLUG[slug];
    if (guide) {
      return {
        path: redirected,
        canonical: canonicalUrlFor(redirected),
        title: guide.metaTitle || `${guide.title} | DigiTrans`,
        description: guide.excerpt.slice(0, 155),
        ogImage: guide.ogImage || '/images/og/og-guides.jpg',
        robots: 'index, follow',
        indexable: true,
        pageType: 'guide',
        entity: guide,
        breadcrumbs: [
          { label: 'Guides', href: '/guides' },
          { label: guide.category, href: redirected },
        ],
        notFound: false,
      };
    }
  }

  // Legal pages
  if (LEGAL_PAGES[redirected]) {
    const legal = LEGAL_PAGES[redirected];
    return {
      path: redirected,
      canonical: canonicalUrlFor(redirected),
      title: `${legal.title} | DigiTrans Logistics`,
      description: legal.lead.slice(0, 155),
      ogImage: '/images/og/og-default.jpg',
      robots: 'index, follow',
      indexable: true,
      pageType: 'legal',
      entity: legal,
      breadcrumbs: [{ label: legal.title, href: redirected }],
      notFound: false,
    };
  }

  // True 404 fallback
  return {
    path: clean,
    canonical: canonicalUrlFor('/404'),
    title: 'Page Not Found | DigiTrans Logistics',
    description: 'The requested DigiTrans Logistics page could not be found.',
    ogImage: '/images/og/og-default.jpg',
    robots: 'noindex, follow',
    indexable: false,
    pageType: '404',
    breadcrumbs: [{ label: 'Page not found' }],
    notFound: true,
  };
}

export function getAllPublicPrerenderRoutes() {
  const routes = [
    ...Object.keys(STATIC_PUBLIC_META),
    ...SERVICES.map((s) => `/services/${s.slug}`),
    ...CITIES.map((c) => `/cities/${c.slug}`),
    ...ROUTES.map((r) => `/routes/${r.slug}`),
    ...GUIDES.map((g) => `/guides/${g.slug}`),
    ...Object.keys(LEGAL_PAGES),
  ];
  return [...new Set(routes)];
}
