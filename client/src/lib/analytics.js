/**
 * Privacy- and consent-aware conversion tracking for DigiTrans Logistics.
 * Emits events to window.dataLayer / gtag / custom listeners only when permitted.
 */

const CONSENT_STORAGE_KEY = 'digitrans_analytics_consent';

export const CONVERSION_EVENTS = Object.freeze([
  'booking_started',
  'booking_completed',
  'waybill_booked',
  'contact_click',
  'whatsapp_click',
  'call_click',
]);

export function getAnalyticsConsent() {
  if (typeof window === 'undefined') return false;
  if (window.navigator?.doNotTrack === '1' || window.doNotTrack === '1') return false;
  try {
    return window.localStorage?.getItem(CONSENT_STORAGE_KEY) === 'granted';
  } catch {
    return false;
  }
}

export function setAnalyticsConsent(granted) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage?.setItem(CONSENT_STORAGE_KEY, granted ? 'granted' : 'denied');
  } catch {}
}

export function getStoredConsentDecision() {
  if (typeof window === 'undefined') return 'unset';
  try {
    return window.localStorage?.getItem(CONSENT_STORAGE_KEY) || 'unset';
  } catch {
    return 'unset';
  }
}

export function trackEvent(eventName, params = {}) {
  if (typeof window === 'undefined') return;
  if (!CONVERSION_EVENTS.includes(eventName)) return;

  const payload = {
    event: eventName,
    timestamp: new Date().toISOString(),
    path: window.location?.pathname || '/',
    ...params,
  };

  try {
    window.dispatchEvent(new CustomEvent('digitrans:analytics', { detail: payload }));
  } catch {}

  if (!getAnalyticsConsent()) return;

  if (Array.isArray(window.dataLayer)) {
    window.dataLayer.push(payload);
  }
  if (typeof window.gtag === 'function') {
    window.gtag('event', eventName, params);
  }
}
