import { SITE, canonicalUrlFor } from '../../../shared/site.js';

export { SITE, canonicalUrlFor };

export const PLACEHOLDERS = Object.freeze([
  { field: 'Phone & WhatsApp line', key: 'SITE.phone / SITE.whatsapp', current: SITE.phone, status: '[CONFIRM]' },
  { field: 'Dispatch opening hours', key: 'SITE.hours', current: SITE.hours, status: '[CONFIRM]' },
  { field: 'Founding year', key: 'SITE.foundedYear', current: 'Omitted until confirmed', status: '[CONFIRM]' },
  { field: 'Social profile URLs', key: 'SITE.socialLinks', current: 'Empty array until confirmed', status: '[CONFIRM]' },
  { field: 'Office GPS coordinates', key: 'SITE.geo', current: 'Omitted until verified', status: '[CONFIRM]' },
  { field: 'Starting / fixed tariff examples', key: 'PRICING_DISCLOSURES', current: 'Server-calculated at checkout; illustrative estimates marked [CONFIRM]', status: '[CONFIRM]' },
]);

export function contactDetailsFromSettings(settings = {}) {
  const email = String(settings.public_email || '').trim() || SITE.email;
  const address = String(settings.public_address || '').trim() || SITE.address;
  const phone = String(settings.public_phone || '').trim() || SITE.phone;
  const whatsapp = String(settings.public_whatsapp || '').trim() || SITE.whatsapp;
  const phoneDigits = phone.replace(/[^+\d]/g, '');
  const whatsappDigits = whatsapp.replace(/[^\d]/g, '');
  const isDefaultPlaceholderPhone = phone === SITE.phone && SITE.phoneIsPlaceholder;
  const isDefaultPlaceholderWhatsapp = whatsapp === SITE.whatsapp && SITE.whatsappIsPlaceholder;
  return {
    email,
    emailHref: `mailto:${email}`,
    address,
    phone,
    phoneHref: phoneDigits ? `tel:${phoneDigits}` : SITE.phoneHref,
    phoneIsPlaceholder: isDefaultPlaceholderPhone,
    whatsapp,
    whatsappHref: whatsappDigits ? `https://wa.me/${whatsappDigits}` : SITE.whatsappHref,
    whatsappIsPlaceholder: isDefaultPlaceholderWhatsapp,
    hours: SITE.hours,
    hoursIsPlaceholder: SITE.hoursIsPlaceholder,
    mapsUrl: SITE.mapsUrl,
  };
}
