import React, { useEffect, useMemo, useRef, useState } from 'react';
import AppLink from '../components/AppLink';
import Logo from '../components/Brand';
import Icon from '../components/Icon';
import Picture from '../components/Picture';
import { Input, Select } from '../components/UI';
import { contactDetailsFromSettings, SITE } from '../config/site';
import { api } from '../lib/api';
import {
  getStoredConsentDecision,
  setAnalyticsConsent,
  trackEvent,
} from '../lib/analytics';
import { faqs as defaultFaqs, services, zones } from './publicContent';

const primaryNav = [
  ['Services', '/services'],
  ['Coverage', '/coverage'],
  ['Pricing', '/pricing'],
  ['Guides', '/guides'],
  ['Track', '/track'],
  ['Contact', '/contact'],
];

const serviceLinks = [
  { label: 'Local delivery', href: '/services/local-delivery', hint: 'Same-day around Calabar', tag: 'CITY', icon: 'bike', tone: 'coral' },
  { label: 'Market Runs', href: '/services/market-runs', hint: 'Watt & Marian Markets to your door', tag: 'LOCAL', icon: 'bag', tone: 'gold' },
  { label: 'Intercity waybills', href: '/services/intercity-waybill', hint: 'Calabar, Port Harcourt & Obudu', tag: 'PARCEL', icon: 'box', tone: 'teal' },
  { label: 'Business logistics', href: '/services/business-logistics', hint: 'Dispatch board for vendors', tag: 'BUSINESS', icon: 'chart', tone: 'navy' },
  { label: 'Student delivery', href: '/services/student-delivery', hint: 'Verified UNICAL & campus rate', tag: 'STUDENT', icon: 'user', tone: 'mint' },
  { label: 'Scheduled pickups', href: '/services/scheduled-pickups', hint: 'Book a future pickup slot', tag: 'PLANNED', icon: 'clock', tone: 'blue' },
];

export function SiteHeader({ page, navigate, onLogin, user, settings }) {
  const [open, setOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const menuButtonRef = useRef(null);
  const closeButtonRef = useRef(null);
  const drawerRef = useRef(null);
  const wasOpen = useRef(false);
  const isHome = page === '/';
  const contact = contactDetailsFromSettings(settings);

  useEffect(() => {
    setOpen(false);
    setServicesOpen(false);
  }, [page]);

  useEffect(() => {
    if (typeof document === 'undefined') return undefined;
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  useEffect(() => {
    if (!open || typeof window === 'undefined') return undefined;
    const handleMenuKeyDown = (event) => {
      if (event.key === 'Escape') {
        setOpen(false);
        return;
      }
      if (event.key !== 'Tab') return;
      const items = drawerRef.current?.querySelectorAll('button:not([disabled]),a[href]');
      if (!items?.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', handleMenuKeyDown);
    return () => window.removeEventListener('keydown', handleMenuKeyDown);
  }, [open]);

  useEffect(() => {
    if (open) {
      wasOpen.current = true;
      closeButtonRef.current?.focus();
      return;
    }
    if (wasOpen.current) {
      menuButtonRef.current?.focus();
      wasOpen.current = false;
    }
  }, [open]);

  const closeMenus = () => {
    setOpen(false);
    setServicesOpen(false);
  };

  const signInHref = user ? '/workspace' : '/login?next=%2Fworkspace';
  const isActive = (path) => page === path || (path !== '/' && page.startsWith(`${path}/`));

  return (
    <>
      <header className={`site-header ${isHome ? 'site-header-home' : 'site-header-public'}`}>
        <div className="site-header-inner">
          <Logo navigate={navigate} className="site-header-brand" />
          <nav className="site-primary-nav" aria-label="Main navigation">
            {primaryNav.map(([label, path]) =>
              label === 'Services' ? (
                <div
                  key={label}
                  className="site-nav-services"
                  onMouseEnter={() => setServicesOpen(true)}
                  onMouseLeave={() => setServicesOpen(false)}
                  onBlur={(event) => {
                    if (!event.currentTarget.contains(event.relatedTarget)) setServicesOpen(false);
                  }}
                >
                  <AppLink
                    href={path}
                    navigate={navigate}
                    onFocus={() => setServicesOpen(true)}
                    onClick={closeMenus}
                    onKeyDown={(event) => {
                      if (event.key === 'Escape') setServicesOpen(false);
                    }}
                    aria-expanded={servicesOpen}
                    aria-current={isActive(path) ? 'page' : undefined}
                    className={`site-nav-link site-nav-services-trigger ${isActive(path) ? 'is-active' : ''}`}
                  >
                    {label}
                    <Icon name="down" size={13} className={servicesOpen ? 'is-open' : ''} />
                  </AppLink>
                  {servicesOpen && (
                    <div id="site-services-dropdown" className="site-services-dropdown" role="region" aria-label="DigiTrans services">
                      <div className="site-services-dropdown-card">
                        <aside className="site-services-feature">
                          <Picture src="/images/hero-courier.jpg" alt="" ariaHidden="true" sizes="320px" />
                          <div className="site-services-feature-content">
                            <span className="site-services-feature-kicker">
                              <i />CALABAR · NYAHASANG, ATIMBO
                            </span>
                            <div>
                              <p>YOUR DAY, IN MOTION</p>
                              <h3>
                                Good routes.
                                <br />
                                Right on time.
                              </h3>
                              <small>
                                Local drops across Calabar plus tracked intercity waybills to Port Harcourt and Obudu.
                              </small>
                            </div>
                            <AppLink href="/quote" navigate={navigate} onClick={closeMenus} className="site-services-feature-cta">
                              Get a quote
                              <Icon name="arrow" size={14} />
                            </AppLink>
                          </div>
                        </aside>
                        <div className="site-services-menu-main">
                          <div className="site-services-menu-heading">
                            <div>
                              <span>MADE FOR THE WAY YOU MOVE</span>
                              <h3>Choose a delivery service.</h3>
                            </div>
                            <div className="site-services-menu-count">
                              <Icon name="spark" size={14} /> 6 services
                            </div>
                          </div>
                          <div className="site-services-grid">
                            {serviceLinks.map((item) => (
                              <AppLink
                                key={item.href}
                                href={item.href}
                                navigate={navigate}
                                onClick={closeMenus}
                                className="site-service-menu-link"
                              >
                                <span className={`site-service-menu-icon is-${item.tone}`}>
                                  <Icon name={item.icon} size={18} />
                                </span>
                                <span className="site-service-menu-copy">
                                  <span className="site-service-menu-title">
                                    {item.label}
                                    <small>{item.tag}</small>
                                  </span>
                                  <small>{item.hint}</small>
                                </span>
                                <span className="site-service-menu-arrow">
                                  <Icon name="arrow" size={14} />
                                </span>
                              </AppLink>
                            ))}
                          </div>
                          <div className="site-services-menu-footer">
                            <span>
                              <Icon name="support" size={15} />
                              <span>
                                Need help choosing? <b>Our team in Calabar can guide you.</b>
                              </span>
                            </span>
                            <AppLink
                              href="/how-it-works"
                              navigate={navigate}
                              onClick={closeMenus}
                            >
                              How it works
                              <Icon name="arrow" size={13} />
                            </AppLink>
                            <AppLink href="/pricing" navigate={navigate} onClick={closeMenus}>
                              Compare pricing
                              <Icon name="arrow" size={13} />
                            </AppLink>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <AppLink
                  key={path}
                  href={path}
                  navigate={navigate}
                  aria-current={isActive(path) ? 'page' : undefined}
                  className={`site-nav-link ${isActive(path) ? 'is-active' : ''}`}
                >
                  {label}
                </AppLink>
              ),
            )}
          </nav>
          <div className="site-header-actions">
            <AppLink
              href={signInHref}
              navigate={navigate}
              onClick={(e) => {
                if (onLogin && !user) {
                  e.preventDefault();
                  onLogin('/workspace');
                }
              }}
              className="site-header-signin"
            >
              {user ? 'Workspace' : 'Sign in'}
            </AppLink>
            <AppLink href="/quote" navigate={navigate} className="site-header-quote">
              Get a quote
              <Icon name="arrow" size={15} />
            </AppLink>
            <button
              ref={menuButtonRef}
              type="button"
              onClick={() => setOpen(true)}
              className="site-header-menu-button"
              aria-label="Open menu"
              aria-expanded={open}
              aria-controls="site-mobile-drawer"
            >
              <Icon name="menu" size={21} />
            </button>
          </div>
        </div>
      </header>
      <div className={`site-mobile-overlay ${open ? 'is-open' : ''}`} aria-hidden={!open}>
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setOpen(false)}
          className="site-mobile-backdrop"
          tabIndex={open ? 0 : -1}
        />
        <aside ref={drawerRef} id="site-mobile-drawer" className="site-mobile-drawer" role="dialog" aria-modal="true" aria-label="Site menu">
          <div className="site-mobile-header">
            <Logo navigate={navigate} />
            <button ref={closeButtonRef} type="button" onClick={() => setOpen(false)} className="site-mobile-close" aria-label="Close menu">
              <Icon name="close" size={20} />
            </button>
          </div>
          <div className="site-mobile-content">
            <p className="site-mobile-eyebrow">Explore DigiTrans</p>
            <nav className="site-mobile-links" aria-label="Mobile navigation">
              {primaryNav.map(([label, path]) => (
                <AppLink
                  key={path}
                  href={path}
                  navigate={navigate}
                  onClick={closeMenus}
                  className={`site-mobile-link ${isActive(path) ? 'is-active' : ''}`}
                >
                  <span>{label}</span>
                  <Icon name="arrow" size={16} />
                </AppLink>
              ))}
              <AppLink href="/how-it-works" navigate={navigate} onClick={closeMenus} className="site-mobile-link">
                <span>How it works</span>
                <Icon name="arrow" size={16} />
              </AppLink>
              <AppLink
                href={signInHref}
                navigate={navigate}
                onClick={(e) => {
                  closeMenus();
                  if (onLogin && !user) {
                    e.preventDefault();
                    onLogin('/workspace');
                  }
                }}
                className="site-mobile-link"
              >
                <span>{user ? 'Workspace' : 'Sign in'}</span>
                <Icon name="arrow" size={16} />
              </AppLink>
            </nav>
          </div>
          <div className="site-mobile-footer">
            <AppLink href="/quote" navigate={navigate} onClick={closeMenus} className="site-mobile-quote">
              Get a delivery quote
              <Icon name="arrow" size={16} />
            </AppLink>
            <a
              href={contact.emailHref}
              onClick={() => trackEvent('contact_click', { method: 'email', location: 'mobile_drawer' })}
              className="site-mobile-phone"
            >
              <Icon name="mail" size={14} />
              {contact.email}
            </a>
          </div>
        </aside>
      </div>
    </>
  );
}

export function SiteFooter({ navigate, onLogin, user, settings }) {
  const contact = contactDetailsFromSettings(settings);
  const quick = [
    ['Home', '/'],
    ['How it works', '/how-it-works'],
    ['Coverage & cities', '/coverage'],
    ['Pricing', '/pricing'],
    ['Guides', '/guides'],
    ['FAQ', '/faq'],
    ['Track a delivery', '/track'],
    ['About DigiTrans', '/about'],
    ['Contact', '/contact'],
  ];
  const citiesAndRoutes = [
    ['Calabar delivery', '/cities/calabar'],
    ['Port Harcourt waybills', '/cities/port-harcourt'],
    ['Obudu waybills', '/cities/obudu'],
    ['Calabar → Port Harcourt', '/routes/calabar-to-port-harcourt'],
    ['Calabar → Obudu', '/routes/calabar-to-obudu'],
    ['Rider onboarding', '/rider-registration'],
    ['Investor info', '/investment-information'],
  ];

  return (
    <footer className="band">
      <div className="container-x">
        <div className="grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-[1.2fr_.85fr_1fr_1fr_1.15fr] lg:gap-8">
          <div>
            <Logo navigate={navigate} />
            <p className="mt-5 max-w-[30ch] text-[.875rem] leading-relaxed text-white/65">
              Local delivery, Market Runs, UNICAL student drops, and intercity waybills linking Calabar, Port Harcourt, and Obudu.
            </p>
            <div className="mt-5 flex flex-col gap-2 text-[.8125rem] text-white/75">
              <a
                href={contact.emailHref}
                onClick={() => trackEvent('contact_click', { method: 'email', location: 'footer' })}
                className="inline-flex items-center gap-2 transition-colors hover:text-white"
              >
                <Icon name="mail" size={14} className="text-white/50" />
                {contact.email}
              </a>
              {contact.phoneHref && (
                <a
                  href={contact.phoneHref}
                  onClick={() => trackEvent('call_click', { location: 'footer' })}
                  className="inline-flex items-center gap-2 transition-colors hover:text-white"
                >
                  <Icon name="phone" size={14} className="text-white/50" />
                  {contact.phone}
                </a>
              )}
              {contact.whatsappHref && (
                <a
                  href={contact.whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackEvent('whatsapp_click', { location: 'footer' })}
                  className="inline-flex items-center gap-2 transition-colors hover:text-white"
                >
                  <Icon name="support" size={14} className="text-white/50" />
                  WhatsApp dispatch
                </a>
              )}
            </div>
            <p className="mt-4 max-w-[32ch] text-[.75rem] leading-relaxed text-white/50">{contact.address}</p>
          </div>
          <div>
            <p className="text-[.9375rem] font-medium text-white">Explore</p>
            <ul className="mt-4 space-y-1.5">
              {quick.map(([label, path]) => (
                <li key={path}>
                  <AppLink href={path} navigate={navigate} className="footer-link">
                    {label}
                  </AppLink>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-[.9375rem] font-medium text-white">Services</p>
            <ul className="mt-4 space-y-1.5">
              {services.map((s) => (
                <li key={s.slug}>
                  <AppLink href={`/services/${s.slug}`} navigate={navigate} className="footer-link">
                    {s.shortName}
                  </AppLink>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-[.9375rem] font-medium text-white">Cities &amp; corridors</p>
            <ul className="mt-4 space-y-1.5">
              {citiesAndRoutes.map(([label, path]) => (
                <li key={path}>
                  <AppLink href={path} navigate={navigate} className="footer-link">
                    {label}
                  </AppLink>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-[.9375rem] font-medium text-white">Need a hand?</p>
            <p className="mt-2 max-w-[30ch] text-[.8125rem] leading-relaxed text-white/60">
              Send an enquiry or sign in to book local deliveries, Market Runs, or intercity waybills.
            </p>
            <div className="mt-5 flex flex-col gap-2">
              <AppLink
                href="/contact"
                navigate={navigate}
                onClick={() => trackEvent('contact_click', { method: 'contact_page', location: 'footer' })}
                className="pill pill-white pill-sm w-full"
              >
                Contact dispatch
                <Icon name="arrow" size={14} />
              </AppLink>
              <AppLink
                href={user ? '/workspace' : '/login?next=%2Fworkspace'}
                navigate={navigate}
                onClick={(e) => {
                  if (onLogin && !user) {
                    e.preventDefault();
                    onLogin('/workspace');
                  }
                }}
                className="pill pill-ghost pill-sm w-full"
              >
                {user ? 'Open workspace' : 'Workspace sign in'}
              </AppLink>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-3 border-t border-white/15 py-6 text-[.75rem] text-white/50 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {SITE.name}. Calabar Municipal, Cross River State.</p>
          <div className="flex flex-wrap items-center gap-4">
            <AppLink href="/privacy" navigate={navigate} className="transition-colors hover:text-white/85">
              Privacy policy
            </AppLink>
            <span aria-hidden="true" className="h-3 w-px bg-white/20" />
            <AppLink href="/terms" navigate={navigate} className="transition-colors hover:text-white/85">
              Terms &amp; conditions
            </AppLink>
            <span aria-hidden="true" className="h-3 w-px bg-white/20" />
            <AppLink href="/prohibited-items" navigate={navigate} className="transition-colors hover:text-white/85">
              Prohibited items
            </AppLink>
            <span aria-hidden="true" className="h-3 w-px bg-white/20" />
            <AppLink href="/delivery-refund" navigate={navigate} className="transition-colors hover:text-white/85">
              Refund policy
            </AppLink>
          </div>
        </div>
      </div>
    </footer>
  );
}

export function PageHero({ title, lead, eyebrow, trail = [], image, imageAlt = '', children, navigate, className = '' }) {
  return (
    <section className={`relative isolate overflow-hidden bg-navy text-white ${className}`}>
      {image && (
        <>
          <Picture
            src={image}
            alt={imageAlt}
            sizes="100vw"
            loading="eager"
            fetchPriority="high"
            className="absolute inset-0 -z-20 h-full w-full object-cover object-[60%_center]"
          />
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-navy via-navy/90 to-navy/55" />
          <div className="absolute inset-0 -z-10 bg-navy/20" />
        </>
      )}
      <div className="container-x pb-14 pt-9 sm:pb-20 sm:pt-11">
        <nav aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-2 text-[.75rem] text-white/60">
            <li>
              <AppLink href="/" navigate={navigate} className="hover:text-white">
                Home
              </AppLink>
            </li>
            {trail.map((item, i) => (
              <li key={`${item.label}-${i}`} className="flex items-center gap-2">
                <Icon name="chevron" size={12} className="text-white/30" />
                {item.href && i < trail.length - 1 ? (
                  <AppLink href={item.href} navigate={navigate} className="text-white/75 hover:text-white">
                    {item.label}
                  </AppLink>
                ) : (
                  <span className="text-white/85" aria-current="page">
                    {item.label}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </nav>
        <div className="mt-9 max-w-3xl">
          {eyebrow && <p className="eyebrow eyebrow-light">{eyebrow}</p>}
          <h1 className={`display-1 text-white ${eyebrow ? 'mt-4' : ''}`}>{title}</h1>
          {lead && <p className="mt-5 max-w-[52ch] text-[1.0625rem] leading-relaxed text-white/75">{lead}</p>}
          {children}
        </div>
      </div>
    </section>
  );
}

export function SectionHeading({ eyebrow, title, lead, action, light = false, className = '' }) {
  return (
    <div className={`flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between ${className}`}>
      <div className="max-w-2xl">
        {eyebrow && <p className={`eyebrow ${light ? 'eyebrow-light' : ''}`}>{eyebrow}</p>}
        <h2 className={`display-2 mt-3 ${light ? 'text-white' : 'text-navy'}`}>{title}</h2>
        {lead && <p className={`mt-4 max-w-xl text-[.9375rem] leading-relaxed ${light ? 'text-white/70' : 'text-ink-slate'}`}>{lead}</p>}
      </div>
      {action}
    </div>
  );
}

export function FaqSection({ items = defaultFaqs, compact = false, title = 'Questions we get.', navigate, settings }) {
  const rows = (items || []).map((item) => ({ q: item.question || item.q, a: item.answer || item.a })).filter((item) => item.q && item.a);
  const visible = compact ? rows.slice(0, 4) : rows;
  const contact = contactDetailsFromSettings(settings);

  return (
    <section className={`bg-white ${compact ? 'py-14 sm:py-16' : 'section'}`}>
      <div className="container-x grid gap-10 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-4">
          <h2 className="display-2 max-w-[14ch]">{title}</h2>
          <p className="body-sm mt-5 max-w-sm">
            Still unsure? Send a message via our contact form or email{' '}
            <a href={contact.emailHref} className="underline decoration-line-strong underline-offset-2 text-navy">
              {contact.email}
            </a>.
          </p>
          <AppLink
            href="/contact"
            navigate={navigate}
            onClick={() => trackEvent('contact_click', { location: 'faq_section' })}
            className="link-underline mt-6"
          >
            Contact support
            <Icon name="arrow" size={14} />
          </AppLink>
        </div>
        <div className="lg:col-span-7 lg:col-start-6">
          <div className="space-y-3">
            {visible.map((faq, i) => (
              <details
                key={`${faq.q}-${i}`}
                className="group rounded-2xl border border-line bg-white p-5 transition-all duration-200 hover:border-line-strong open:bg-paper/40"
                open={i === 0}
              >
                <summary className="flex cursor-pointer list-none items-start justify-between gap-6 text-left text-[.9375rem] font-semibold leading-snug text-navy marker:hidden">
                  {faq.q}
                  <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border border-line bg-paper text-muted transition-transform group-open:rotate-45 group-open:bg-cyan/10 group-open:text-cyan">
                    <Icon name="plus" size={13} />
                  </span>
                </summary>
                <p className="mt-3 max-w-[62ch] pr-8 text-[.875rem] leading-relaxed text-ink-slate">{faq.a}</p>
              </details>
            ))}
          </div>
          <AppLink href="/faq" navigate={navigate} className="link-underline mt-6">
            View all frequently asked questions
            <Icon name="arrow" size={14} />
          </AppLink>
        </div>
      </div>
    </section>
  );
}

const naira = (value) =>
  `₦${new Intl.NumberFormat('en-NG', { maximumFractionDigits: 0 }).format(Math.max(0, Math.round(value)))}`;

export function QuoteEstimator({ onBook, defaultService = 'standard', compact = false }) {
  const requestedZone = (key) => {
    if (typeof window === 'undefined') return null;
    const value = new URLSearchParams(window.location.search).get(key);
    return zones.some((zone) => zone.id === value) ? value : null;
  };
  const [service, setService] = useState(defaultService);
  const [from, setFrom] = useState(() => requestedZone('from') || 'marian');
  const [to, setTo] = useState(() => requestedZone('to') || 'unical');
  const [waybillCorridor, setWaybillCorridor] = useState('Calabar::Port Harcourt');
  const [weight, setWeight] = useState('3');
  const [budget, setBudget] = useState('5000');
  const [scheduled, setScheduled] = useState(false);
  const [student, setStudent] = useState(false);
  const [liveRates, setLiveRates] = useState(null);
  const [liveWaybills, setLiveWaybills] = useState([]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    let active = true;
    api('/pricing')
      .then((res) => {
        if (!active) return;
        if (res?.pricing) setLiveRates(res.pricing);
        if (Array.isArray(res?.waybillRoutes)) setLiveWaybills(res.waybillRoutes);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const corridorPairs = useMemo(() => {
    const seen = new Set();
    const pairs = [];
    for (const row of liveWaybills) {
      const key = `${row.origin}::${row.destination}`;
      if (!seen.has(key)) {
        seen.add(key);
        pairs.push({ key, origin: row.origin, destination: row.destination, label: `${row.origin} → ${row.destination}` });
      }
    }
    return pairs.length
      ? pairs
      : [
          { key: 'Calabar::Port Harcourt', origin: 'Calabar', destination: 'Port Harcourt', label: 'Calabar → Port Harcourt' },
          { key: 'Port Harcourt::Calabar', origin: 'Port Harcourt', destination: 'Calabar', label: 'Port Harcourt → Calabar' },
          { key: 'Calabar::Obudu', origin: 'Calabar', destination: 'Obudu', label: 'Calabar → Obudu' },
          { key: 'Obudu::Calabar', origin: 'Obudu', destination: 'Calabar', label: 'Obudu → Calabar' },
        ];
  }, [liveWaybills]);

  const result = useMemo(() => {
    const a = zones.find((z) => z.id === from);
    const b = zones.find((z) => z.id === to);
    if (!a || !b) return null;

    const baseFee = Number(liveRates?.base_fee ?? 500);
    const perKm = Number(liveRates?.per_km ?? 250);
    const minFee = Number(liveRates?.min_fee ?? 1000);
    const studentFlat = Number(liveRates?.student_flat ?? 500);
    const scheduledFee = Number(liveRates?.scheduled_surcharge ?? 300);
    const marketFee = Number(liveRates?.market_runs_fee ?? 1500);
    const vendorDiscountPct = Number(liveRates?.vendor_discount_pct ?? 10);

    const km = from === to ? 1.2 : Math.max(0.8, Math.round(Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2) * 1.28 * 10) / 10);
    let lines = [];

    if (service === 'waybill') {
      const kg = Math.max(0.1, Number(weight) || 0);
      const band = kg < 5 ? 'below_5kg' : kg <= 10 ? '5_10kg' : 'above_10kg';
      const bandLabel = band === 'below_5kg' ? 'below 5 kg' : band === '5_10kg' ? '5–10 kg' : 'above 10 kg';
      const [origin, destination] = waybillCorridor.split('::');
      const liveTier = liveWaybills.find((row) => row.origin === origin && row.destination === destination && row.weight_band === band);
      const fallbackCost = band === 'below_5kg' ? 1500 : band === '5_10kg' ? 3000 : 4500;
      const cost = Number(liveTier?.price ?? fallbackCost);
      lines = [[`${origin} → ${destination} (${kg} kg · ${bandLabel})`, cost]];
    } else if (service === 'market-run') {
      lines = [
        ['Shopping item estimate (approved first)', Math.max(0, Number(budget) || 0)],
        ['Market Run service fee', marketFee],
      ];
    } else if (service === 'student' && student && (a.campus || b.campus)) {
      lines = [['Verified student campus-zone rate', studentFlat]];
    } else {
      const distance = Math.round((km * perKm) / 50) * 50;
      lines = [
        ['Base pickup fee', baseFee],
        [`Route distance (~${km.toFixed(1)} km)`, distance],
      ];
      if (scheduled) lines.push(['Scheduled pickup slot', scheduledFee]);
      const subtotal = lines.reduce((sum, row) => sum + row[1], 0);
      if (subtotal < minFee) lines.push(['Minimum fare adjustment', minFee - subtotal]);
      if (service === 'business') {
        const pre = lines.reduce((sum, row) => sum + row[1], 0);
        lines.push([`Vendor contract discount (-${vendorDiscountPct}%)`, -Math.round((pre * (vendorDiscountPct / 100)) / 50) * 50]);
      }
    }

    const total = lines.reduce((sum, row) => sum + row[1], 0);
    return {
      km,
      lines,
      total: Math.max(total, 0),
      zoneFallback: a.lga !== b.lga,
      isLivePricing: Boolean(liveRates),
    };
  }, [service, from, to, waybillCorridor, weight, budget, scheduled, student, liveRates, liveWaybills]);

  return (
    <div className={`border border-line/80 bg-white ${compact ? 'rounded-2xl shadow-card' : 'rounded-3xl shadow-panel'} overflow-hidden`}>
      <div className="quote-estimator-header border-b border-line bg-paper/30 px-6 py-5">
        <p className="text-[.6875rem] font-semibold uppercase leading-[1.4] tracking-[.14em] text-cyan">
          {result?.isLivePricing ? 'Live platform rates' : 'Planning estimate'}
        </p>
        <p className="mt-2 font-display text-[1.125rem] font-semibold leading-[1.25] tracking-[-.015em] text-navy">
          Price your route before booking.
        </p>
      </div>
      <form
        className="space-y-4 p-6"
        onSubmit={(e) => {
          e.preventDefault();
          trackEvent('booking_started', { service, from, to });
          onBook?.();
        }}
      >
        <label className="block">
          <span className="field-label">Service</span>
          <Select value={service} onChange={(e) => setService(e.target.value)} className="field min-h-11 border-line bg-white py-2">
            <option value="standard">Local delivery</option>
            <option value="market-run">Market Run</option>
            <option value="waybill">Intercity waybill</option>
            <option value="business">Business &amp; vendor</option>
            <option value="student">Student delivery</option>
          </Select>
        </label>
        {service === 'waybill' ? (
          <label className="block">
            <span className="field-label">Intercity corridor</span>
            <Select value={waybillCorridor} onChange={(e) => setWaybillCorridor(e.target.value)} className="field min-h-11 border-line bg-white py-2">
              {corridorPairs.map((pair) => (
                <option key={pair.key} value={pair.key}>
                  {pair.label}
                </option>
              ))}
            </Select>
          </label>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="field-label">Pickup zone</span>
              <Select value={from} onChange={(e) => setFrom(e.target.value)} className="field min-h-11 border-line bg-white py-2">
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.name}
                  </option>
                ))}
              </Select>
            </label>
            <label className="block">
              <span className="field-label">Drop-off zone</span>
              <Select value={to} onChange={(e) => setTo(e.target.value)} className="field min-h-11 border-line bg-white py-2">
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.name}
                  </option>
                ))}
              </Select>
            </label>
          </div>
        )}
        {service === 'waybill' && (
          <label className="block">
            <span className="field-label">Estimated parcel weight (kg)</span>
            <Input className="field" type="number" min="0.1" step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)} />
          </label>
        )}
        {service === 'market-run' && (
          <label className="block">
            <span className="field-label">Shopping estimate guide (₦)</span>
            <Input className="field" type="number" min="0" step="500" value={budget} onChange={(e) => setBudget(e.target.value)} />
          </label>
        )}
        {service === 'student' && (
          <label className="flex items-start gap-2.5 text-[.75rem] leading-5 text-ink-slate">
            <input type="checkbox" checked={student} onChange={(e) => setStudent(e.target.checked)} className="mt-1 accent-cyan" />
            <span>I have a verified student ID requesting a campus-zone delivery.</span>
          </label>
        )}
        {(service === 'standard' || service === 'business') && (
          <label className="inline-flex items-center gap-2 text-[.75rem] text-ink-slate">
            <input type="checkbox" checked={scheduled} onChange={(e) => setScheduled(e.target.checked)} className="accent-cyan" />
            Scheduled pickup window
          </label>
        )}
        {result && (
          <div className="space-y-2.5 rounded-2xl border border-line bg-paper/60 p-4">
            <div className="space-y-2">
              {result.lines.map(([label, amount]) => (
                <div key={label} className="flex items-baseline justify-between gap-3 text-[.8125rem]">
                  <span className="text-ink-slate">{label}</span>
                  <span className={`shrink-0 font-medium tabular-nums ${amount < 0 ? 'text-success' : 'text-navy'}`}>
                    {amount < 0 ? `−${naira(Math.abs(amount))}` : naira(amount)}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-baseline justify-between border-t border-line pt-3 text-[.9375rem] font-semibold text-navy">
              <span>Planning estimate</span>
              <span className="tabular-nums font-bold text-cyan">{naira(result.total)}</span>
            </div>
            <p className="mt-1.5 text-[.6875rem] leading-relaxed text-muted">
              {service === 'waybill'
                ? 'Weight-tiered intercity waybill · Server confirms final fare on booking'
                : `~${result.km.toFixed(1)} km route${result.zoneFallback ? ' · cross-zone' : ''} · Server confirms final fare on booking`}
            </p>
          </div>
        )}
        <button type="submit" className="pill pill-navy w-full shadow-sm hover:shadow-md">
          Continue to book
          <Icon name="arrow" size={15} />
        </button>
        <p className="text-center text-[.6875rem] leading-relaxed text-muted">
          Planning preview only. Final Naira charges are verified server-side before order confirmation.
        </p>
      </form>
    </div>
  );
}

export function ConsentBanner({ navigate }) {
  const [decision, setDecision] = useState('dismissed');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.navigator?.doNotTrack === '1' || window.doNotTrack === '1') return;
    setDecision(getStoredConsentDecision());
  }, []);

  if (decision !== 'unset') return null;

  return (
    <aside
      aria-label="Analytics privacy preference"
      className="fixed bottom-4 right-4 z-40 max-w-sm rounded-2xl border border-line bg-white p-4 shadow-panel"
    >
      <p className="text-[.8125rem] font-semibold text-navy">Privacy-first analytics</p>
      <p className="mt-1 text-[.75rem] leading-relaxed text-ink-slate">
        DigiTrans uses strictly necessary session cookies for booking and optional analytics to improve route pages.{' '}
        <AppLink href="/privacy" navigate={navigate} className="underline decoration-line-strong underline-offset-2 text-navy">
          Privacy policy
        </AppLink>
      </p>
      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            setAnalyticsConsent(true);
            setDecision('granted');
          }}
          className="rounded-full bg-navy px-3.5 py-1.5 text-[.75rem] font-medium text-white hover:bg-navy-600"
        >
          Allow analytics
        </button>
        <button
          type="button"
          onClick={() => {
            setAnalyticsConsent(false);
            setDecision('denied');
          }}
          className="rounded-full border border-line-strong px-3.5 py-1.5 text-[.75rem] font-medium text-navy hover:border-navy"
        >
          Essential only
        </button>
      </div>
    </aside>
  );
}
