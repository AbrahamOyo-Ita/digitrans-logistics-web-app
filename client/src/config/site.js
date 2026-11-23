import { SITE, canonicalUrlFor } from '../../../shared/site.js';

export { SITE, canonicalUrlFor };

export const PLACEHOLDERS = Object.freeze([
  { field: 'Phone & WhatsApp line', key: 'SITE.phone / SITE.whatsapp', current: 'Hidden until configured via Website CMS', status: 'OPTIONAL' },
  { field: 'Dispatch opening hours', key: 'SITE.hours', current: 'Omitted until confirmed', status: 'OPTIONAL' },
  { field: 'Social profile URLs', key: 'SITE.socialLinks', current: 'Omitted until confirmed', status: 'OPTIONAL' },
]);

const isPlaceholderContact = (value) => {
  const clean = String(value || '').trim();
  return !clean || clean === '+234 800 000 0000' || clean === '+2348000000000';
};

export function contactDetailsFromSettings(settings = {}) {
  const email = String(settings.public_email || '').trim() || SITE.email;
  const address = String(settings.public_address || '').trim() || SITE.address;
  const rawPhone = String(settings.public_phone || '').trim();
  const rawWhatsapp = String(settings.public_whatsapp || '').trim();
  const phone = isPlaceholderContact(rawPhone) ? null : rawPhone;
  const whatsapp = isPlaceholderContact(rawWhatsapp) ? null : rawWhatsapp;
  const phoneDigits = phone ? phone.replace(/[^+\d]/g, '') : '';
  const whatsappDigits = whatsapp ? whatsapp.replace(/[^\d]/g, '') : '';
  return {
    email,
    emailHref: `mailto:${email}`,
    address,
    phone,
    phoneHref: phoneDigits ? `tel:${phoneDigits}` : null,
    phoneIsPlaceholder: false,
    whatsapp,
    whatsappHref: whatsappDigits ? `https://wa.me/${whatsappDigits}` : null,
    whatsappIsPlaceholder: false,
    hours: SITE.hours,
    hoursIsPlaceholder: SITE.hoursIsPlaceholder,
    mapsUrl: SITE.mapsUrl,
  };
}
