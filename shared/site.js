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

  // Unconfirmed operational details — clearly flagged [CONFIRM] until confirmed by owner
  phone: '+234 800 000 0000',
  phoneIsPlaceholder: true,
  phoneHref: 'tel:+2348000000000',
  phoneNote: 'Phone number [CONFIRM] — email or contact form is active.',
  whatsapp: '+234 800 000 0000',
  whatsappIsPlaceholder: true,
  whatsappHref: 'https://wa.me/2348000000000',
  hours: 'Operating hours [CONFIRM]',
  hoursIsPlaceholder: true,
  foundedYear: null, // [CONFIRM]
  foundedNote: 'Cross River State [CONFIRM]',
  geo: null, // [CONFIRM] verified latitude/longitude coordinates
  socialLinks: Object.freeze([]), // [CONFIRM] add verified Instagram/X/Facebook/LinkedIn URLs when live

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
