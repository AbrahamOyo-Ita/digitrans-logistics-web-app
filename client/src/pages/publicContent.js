import { SITE, PLACEHOLDERS } from '../config/site.js';
import {
  CITIES,
  FAQS,
  GUIDES,
  HOW_IT_WORKS_STEPS,
  LEGAL_PAGES,
  PRICING_EXTRAS,
  PRICING_SUMMARY_ROWS,
  ROUTES,
  SERVICE_SCENARIOS,
  SERVICES,
  ZONES,
} from '../../../shared/seoContent.js';

export const site = {
  name: SITE.name,
  shortName: SITE.shortName,
  email: SITE.email,
  emailHref: `mailto:${SITE.email}`,
  address: SITE.address,
  shortAddress: SITE.shortAddress,
  phone: PLACEHOLDERS.phone,
  whatsapp: PLACEHOLDERS.whatsapp,
  hours: PLACEHOLDERS.hours,
};

export const services = SERVICES.map((item) => ({
  ...item,
  short: item.tagline,
}));

export const zones = ZONES;
export const cities = CITIES;
export const routes = ROUTES;
export const faqs = FAQS;
export const articles = GUIDES;
export const legalPages = LEGAL_PAGES;
export const serviceScenarios = SERVICE_SCENARIOS;
export const pricingSummaryRows = PRICING_SUMMARY_ROWS;
export const pricingExtras = PRICING_EXTRAS;
export const howItWorksSteps = HOW_IT_WORKS_STEPS;
