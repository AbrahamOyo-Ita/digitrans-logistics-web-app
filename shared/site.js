/**
 * Central site configuration and verified brand ground truth for DigiTrans Logistics.
 *
 * Confirmed facts are marked directly; any unconfirmed business metadata uses
 * explicit `[CONFIRM]` markers or `isPlaceholder: true` so nothing is fabricated.
 */

export const SITE = Object.freeze({
  brandName: 'DigiTrans',
  name: 'DigiTrans Logistics',
  legalName: 'DigiTrans Logistics Ltd.',
  alternateNames: Object.freeze(['Digitrans', 'DigiTrans Delivery & Logistics']),
  canonicalOrigin: 'https://www.digitransdelivery.com',
  alternateOrigins: Object.freeze(['https://digitransdelivery.com']),
  homepageTitle: 'DigiTrans Logistics - Delivery, market runs & waybills in Calabar',
  defaultLocale: 'en-NG',
  ogLocale: 'en_NG',
  countryCode: 'NG',
  currency: 'NGN',
  themeColor: '#0b1b2b',

  // Confirmed contact details
  email: 'digitransdeliveryandlogistics@gmail.com',
  emailHref: 'mailto:digitransdeliveryandlogistics@gmail.com',
  address: 'No 2, Ituebange Street, Nyahasang, Atimbo, Calabar Municipal, Cross River State, Nigeria',
  shortAddress: 'No 2, Ituebange Street, Nyahasang, Atimbo, Calabar Municipal',
  addressParts: Object.freeze({
    streetAddress: 'No 2, Ituebange Street, Nyahasang, Atimbo',
    addressLocality: 'Calabar Municipal',
    addressRegion: 'Cross River State',
    addressCountry: 'NG',
  }),
  mapsUrl: 'https://maps.google.com/?q=No+2,+Ituebange+Street,+Nyahasang,+Atimbo,+Calabar+Municipal,+Cross+River+State,+Nigeria',

  // Public contact channels (phone/WhatsApp intentionally omitted until verified line is published via CMS settings)
  phone: null,
  phoneIsPlaceholder: false,
  phoneHref: null,
  phoneNote: 'Email dispatch or contact form is active.',
  whatsapp: null,
  whatsappIsPlaceholder: false,
  whatsappHref: null,
  hours: null,
  hoursIsPlaceholder: false,
  foundedYear: null,
  foundedNote: 'Cross River State',
  geo: null,
  socialLinks: Object.freeze([]),

  // Confirmed geographic scope & intercity corridors
  cities: Object.freeze(['Calabar', 'Port Harcourt', 'Obudu']),
  intercityCorridors: Object.freeze([
    { from: 'Calabar', to: 'Port Harcourt', slug: 'calabar-to-port-harcourt' },
    { from: 'Port Harcourt', to: 'Calabar', slug: 'port-harcourt-to-calabar' },
    { from: 'Calabar', to: 'Obudu', slug: 'calabar-to-obudu' },
    { from: 'Obudu', to: 'Calabar', slug: 'obudu-to-calabar' },
  ]),

  // Canonical brand assets
  logoPath: '/images/Digitrans_Logo.jpeg',
  appIconPath: '/icon-512.png',
  defaultOgImagePath: '/images/og/og-default.jpg',
});

export function canonicalUrlFor(path = '/', origin = SITE.canonicalOrigin) {
  const cleanOrigin = String(origin || SITE.canonicalOrigin).replace(/\/+$/, '');
  const cleanPath = String(path || '/').split('#')[0].split('?')[0].replace(/\/+$/, '') || '/';
  return cleanPath === '/' ? `${cleanOrigin}/` : `${cleanOrigin}${cleanPath}`;
}
