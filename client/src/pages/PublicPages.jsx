import React, { useEffect, useState } from 'react';
import AppLink from '../components/AppLink';
import Icon from '../components/Icon';
import Picture from '../components/Picture';
import { Button, Card, Field, Input, Select, Textarea } from '../components/UI';
import { contactDetailsFromSettings, SITE } from '../config/site';
import { api } from '../lib/api';
import { trackEvent } from '../lib/analytics';
import {
  CITY_BY_SLUG,
  CITIES,
  GUIDE_BY_SLUG,
  GUIDES,
  ROUTE_BY_SLUG,
  ROUTES,
  SERVICE_BY_SLUG,
} from '../../../shared/seoContent.js';
import { LEGACY_REDIRECT_MAP } from '../../../shared/seoRoutes.js';
import HomePage from './HomePage';
import {
  articles,
  faqs as defaultFaqs,
  howItWorksSteps,
  legalPages,
  pricingExtras,
  pricingSummaryRows,
  services,
  zones,
} from './publicContent';
import { FaqSection, PageHero, QuoteEstimator } from './publicUI';

const formatDate = (value) =>
  value
    ? new Intl.DateTimeFormat('en-NG', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(value))
    : '-';

function AnswerSummary({ eyebrow = 'Quick answer', text }) {
  return (
    <div className="mb-8 rounded-2xl border border-cyan/25 bg-paper p-5 sm:p-6">
      <p className="text-[.6875rem] font-semibold uppercase tracking-[.14em] text-cyan">{eyebrow}</p>
      <p className="mt-2 text-[.9375rem] leading-relaxed text-navy">{text}</p>
    </div>
  );
}

function ServiceIndex({ navigate }) {
  return (
    <>
      <PageHero
        eyebrow="Our services"
        title="Six logistics services built around Calabar."
        lead="Same-day local dispatch, Watt & Marian Market Runs, verified UNICAL student rates, business dispatch, scheduled pickups, and intercity waybills to Port Harcourt and Obudu."
        trail={[{ label: 'Services' }]}
        image="/images/street-wide.jpg"
        imageAlt="A DigiTrans rider moving through Calabar at dusk"
        navigate={navigate}
        className="service-index-hero"
      >
        <div className="service-index-prices">
          {[
            ['Local delivery', 'From ₦1,000'],
            ['Intercity hubs', 'From ₦1,500'],
            ['Market Runs', '₦1,500 service fee'],
          ].map(([label, value]) => (
            <div key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </div>
      </PageHero>
      <section className="service-showcase-list" aria-label="DigiTrans services">
        {services.map((service, index) => {
          const number = String(index + 1).padStart(2, '0');
          return (
            <article id={`service-${service.slug}`} key={service.slug} className={`service-showcase ${index % 2 ? 'is-reversed' : ''}`}>
              <div className="service-showcase-inner">
                <div className="service-showcase-visual">
                  <Picture
                    src={service.image}
                    alt={service.imageAlt || service.name}
                    sizes="(max-width: 980px) 100vw, 600px"
                    loading={index === 0 ? 'eager' : 'lazy'}
                  />
                  <div className="service-showcase-shade" aria-hidden="true" />
                  <div className="service-showcase-visual-top">
                    <span className="service-showcase-location">
                      <Icon name="pin" size={14} />
                      DIGITRANS <i /> CALABAR
                    </span>
                    <span className="service-showcase-count">
                      {number}
                      <i>/ 06</i>
                    </span>
                  </div>
                  <div className="service-showcase-price">
                    <span>Pricing</span>
                    <strong>{service.priceFrom}</strong>
                    <small>{service.turnaround}</small>
                  </div>
                  <div className="service-showcase-visual-bottom">
                    <span>
                      <i />
                      LOCAL ROUTE. TRACKED HANDOFF.
                    </span>
                    <span>{service.shortName}</span>
                  </div>
                </div>
                <div className="service-showcase-copy">
                  <div className="service-showcase-eyebrow">
                    <span>
                      <Icon name={service.icon} size={17} />
                      {number} / SERVICE
                    </span>
                    <span>CALABAR, CROSS RIVER</span>
                  </div>
                  <h2>
                    {service.shortName}
                    <span>.</span>
                  </h2>
                  <p className="service-showcase-short">{service.short}</p>
                  <p className="service-showcase-description">{service.description}</p>
                  <ul className="service-showcase-highlights">
                    {service.highlights.slice(0, 2).map((highlight) => (
                      <li key={highlight}>
                        <span>
                          <Icon name="check" size={14} strokeWidth={2.4} />
                        </span>
                        {highlight}
                      </li>
                    ))}
                  </ul>
                  <div className="service-showcase-actions">
                    <AppLink href={`/services/${service.slug}`} navigate={navigate} className="service-showcase-primary">
                      Explore {service.shortName.toLowerCase()}
                      <Icon name="arrow" size={17} />
                    </AppLink>
                    <AppLink href="/quote" navigate={navigate} className="service-showcase-secondary">
                      Estimate fare
                      <Icon name="arrow" size={15} />
                    </AppLink>
                  </div>
                  <div className="service-showcase-footnote">
                    <span>
                      <Icon name="shield" size={15} />
                      Server-calculated fare before confirmation.
                    </span>
                    <span>
                      {number}
                      <i> — 06</i>
                    </span>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </section>
      <section className="service-index-cta">
        <div className="container-x service-index-cta-inner">
          <div>
            <p className="eyebrow eyebrow-light">Calabar dispatch team</p>
            <h2>Need help picking the right option?</h2>
            <p>Tell us what you are sending and whether it stays inside Calabar or travels to Port Harcourt or Obudu.</p>
          </div>
          <div className="service-index-cta-actions">
            <AppLink href="/quote" navigate={navigate} className="pill pill-white">
              Price a delivery
              <Icon name="arrow" size={15} />
            </AppLink>
            <AppLink href="/contact" navigate={navigate} className="pill pill-ghost">
              Message dispatch
              <Icon name="mail" size={15} />
            </AppLink>
          </div>
        </div>
      </section>
    </>
  );
}

function ServiceDetail({ service, navigate, book, settings }) {
  const related = services.filter((item) => item.slug !== service.slug).slice(0, 3);
  const contact = contactDetailsFromSettings(settings);

  return (
    <>
      <PageHero
        eyebrow="Service"
        title={service.name}
        lead={service.blurb}
        trail={[{ label: 'Services', href: '/services' }, { label: service.shortName }]}
        image={service.image}
        imageAlt={service.imageAlt || service.name}
        navigate={navigate}
      >
        <div className="mt-8 flex flex-wrap items-center gap-x-10 gap-y-4 border-t border-white/15 pt-6">
          <div>
            <p className="text-[.6875rem] text-white/55">Tariff</p>
            <p className="mt-1 text-[.9375rem] font-medium text-white">{service.priceFrom}</p>
          </div>
          <div>
            <p className="text-[.6875rem] text-white/55">Dispatch model</p>
            <p className="mt-1 text-[.9375rem] font-medium text-white">{service.turnaround}</p>
          </div>
          <div className="flex gap-3 pt-1">
            <AppLink href="/quote" navigate={navigate} className="pill pill-white pill-sm">
              Estimate fare
            </AppLink>
            <AppLink href="/track" navigate={navigate} className="pill pill-ghost pill-sm">
              Track a parcel
            </AppLink>
          </div>
        </div>
      </PageHero>
      <section className="section bg-white">
        <div className="container-x grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-7">
            <AnswerSummary eyebrow="Service overview" text={service.answerSummary} />
            <h2 className="display-3">What you get</h2>
            <p className="mt-3 max-w-[62ch] text-[.9375rem] leading-relaxed text-ink-slate">{service.description}</p>
            <ul className="mt-7 grid gap-3 sm:grid-cols-2">
              {service.highlights.map((text) => (
                <li key={text} className="flex items-start gap-3 rounded-2xl border border-line bg-white p-4 shadow-xs">
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-cyan/10 text-cyan">
                    <Icon name="check" size={13} strokeWidth={2.5} />
                  </span>
                  <span className="text-[.84375rem] font-medium leading-relaxed text-navy">{text}</span>
                </li>
              ))}
            </ul>
            <h2 className="display-3 mt-14">How it works</h2>
            <ol className="mt-6 divide-y divide-line border-t border-line">
              {service.steps.map((step, i) => (
                <li key={step.title} className="grid grid-cols-[auto_1fr] gap-x-5 py-5">
                  <span className="pt-0.5 font-mono text-[.6875rem] tabular-nums text-muted">0{i + 1}</span>
                  <div>
                    <h3 className="text-[.9375rem] font-medium text-navy">{step.title}</h3>
                    <p className="mt-1 text-[.875rem] leading-relaxed text-ink-slate">{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>
            <figure className="mt-12">
              <div className="relative aspect-[16/9] overflow-hidden rounded-[18px] bg-navy">
                <Picture src={service.image} alt={service.imageAlt || service.name} sizes="(max-width: 1024px) 100vw, 720px" className="h-full w-full object-cover" />
              </div>
            </figure>
            {service.slug === 'intercity-waybill' && (
              <div className="mt-12 rounded-2xl border border-line bg-paper p-6">
                <h2 className="display-3">Verified intercity routes</h2>
                <p className="mt-2 text-[.875rem] text-ink-slate">Explore full intake and tracking guidance for each corridor:</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {ROUTES.map((route) => (
                    <AppLink
                      key={route.slug}
                      href={`/routes/${route.slug}`}
                      navigate={navigate}
                      className="flex items-center justify-between rounded-xl border border-line bg-white px-4 py-3 text-[.875rem] font-medium text-navy transition-colors hover:border-cyan"
                    >
                      <span>{route.fromCity} → {route.toCity}</span>
                      <Icon name="arrow" size={14} className="text-cyan" />
                    </AppLink>
                  ))}
                </div>
              </div>
            )}
            <h2 className="display-3 mt-14">Frequently asked</h2>
            <div className="mt-5 border-t border-line">
              {service.faqs.map((faq, i) => (
                <details key={faq.q} className="group border-b border-line" open={i === 0}>
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-4 text-[.9375rem] font-medium text-navy marker:hidden">
                    {faq.q}
                    <span className="text-muted transition-transform group-open:rotate-45">
                      <Icon name="plus" size={14} />
                    </span>
                  </summary>
                  <p className="max-w-[62ch] pb-5 pr-8 text-[.875rem] leading-relaxed text-ink-slate">{faq.a}</p>
                </details>
              ))}
            </div>
          </div>
          <aside className="lg:col-span-5">
            <div className="lg:sticky lg:top-24">
              <h2 className="display-3">Estimate this service</h2>
              <p className="body-sm mt-2">Preview zone estimates before signing in to place a verified booking.</p>
              <div className="mt-5">
                <QuoteEstimator defaultService={service.quoteService} onBook={() => book('/customer/booking')} />
              </div>
              <div className="mt-6 rounded-2xl border border-line bg-white p-6 shadow-soft">
                <h3 className="text-[.875rem] font-medium text-navy">Talk to dispatch</h3>
                <p className="mt-1.5 text-[.8125rem] leading-relaxed text-ink-slate">
                  Need bulk dispatch, route confirmation, or parcel guidance? Message {contact.email} or use our contact form.
                </p>
                <div className="mt-4 flex flex-col gap-2">
                  <AppLink href="/contact" navigate={navigate} className="pill pill-navy pill-sm w-full">
                    Contact DigiTrans
                  </AppLink>
                  <a href={contact.emailHref} className="pill pill-line pill-sm w-full">
                    Email {contact.email}
                  </a>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>
      <section className="border-t border-line bg-paper py-14">
        <div className="container-x">
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-5">
            <h2 className="display-3">Other DigiTrans services</h2>
            <AppLink href="/services" navigate={navigate} className="link-underline">
              All services
              <Icon name="arrow" size={13} />
            </AppLink>
          </div>
          <div className="mt-6 grid gap-5 sm:grid-cols-3">
            {related.map((item) => (
              <AppLink
                key={item.slug}
                href={`/services/${item.slug}`}
                navigate={navigate}
                className="group flex flex-col justify-between rounded-2xl border border-line bg-white p-5 text-left transition-all hover:-translate-y-1 hover:border-cyan/30 hover:shadow-md"
              >
                <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-navy">
                  <Picture
                    src={item.image}
                    alt={item.imageAlt || item.name}
                    sizes="(max-width: 768px) 100vw, 380px"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div>
                  <h3 className="mt-4 text-[.9375rem] font-semibold text-navy transition-colors group-hover:text-cyan">{item.shortName}</h3>
                  <p className="mt-1 text-[.8125rem] leading-relaxed text-ink-slate">{item.tagline}</p>
                </div>
                <span className="mt-4 inline-flex items-center gap-1.5 text-[.75rem] font-semibold text-cyan">
                  Explore {item.shortName.toLowerCase()}
                  <Icon name="arrow" size={12} />
                </span>
              </AppLink>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

function CityPage({ city, navigate, book }) {
  const cityServices = (city.availableServices || []).map((slug) => SERVICE_BY_SLUG[slug]).filter(Boolean);
  const cityRoutes = (city.routesFromCity || []).map((slug) => ROUTE_BY_SLUG[slug]).filter(Boolean);

  return (
    <>
      <PageHero
        eyebrow={`${city.state} coverage`}
        title={city.title}
        lead={city.metaDescription}
        trail={[{ label: 'Coverage', href: '/coverage' }, { label: city.name }]}
        image={city.heroImage}
        imageAlt={city.heroAlt}
        navigate={navigate}
      />
      <section className="section bg-white">
        <div className="container-x grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-7">
            <AnswerSummary eyebrow={`${city.name} logistics`} text={city.answerSummary} />
            <h2 className="display-3">Coverage &amp; drop-off hubs in {city.name}</h2>
            <ul className="mt-5 space-y-3">
              {city.areasCovered.map((area) => (
                <li key={area} className="flex items-start gap-3 rounded-xl border border-line bg-white p-4">
                  <Icon name="pin" size={16} className="mt-0.5 shrink-0 text-cyan" />
                  <span className="text-[.875rem] leading-relaxed text-navy">{area}</span>
                </li>
              ))}
            </ul>

            <h2 className="display-3 mt-12">Available services for {city.name}</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {cityServices.map((svc) => (
                <AppLink
                  key={svc.slug}
                  href={`/services/${svc.slug}`}
                  navigate={navigate}
                  className="rounded-2xl border border-line bg-white p-5 transition-colors hover:border-cyan"
                >
                  <h3 className="text-[.9375rem] font-semibold text-navy">{svc.shortName}</h3>
                  <p className="mt-1.5 text-[.8125rem] leading-relaxed text-ink-slate">{svc.tagline}</p>
                </AppLink>
              ))}
            </div>

            {cityRoutes.length > 0 && (
              <>
                <h2 className="display-3 mt-12">Connected intercity corridors</h2>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  {cityRoutes.map((r) => (
                    <AppLink
                      key={r.slug}
                      href={`/routes/${r.slug}`}
                      navigate={navigate}
                      className="flex items-center justify-between rounded-2xl border border-line bg-paper p-5 transition-colors hover:border-cyan"
                    >
                      <div>
                        <h3 className="text-[.9375rem] font-semibold text-navy">
                          {r.fromCity} → {r.toCity}
                        </h3>
                        <p className="mt-1 text-[.8125rem] text-ink-slate">{r.deliveryWindow}</p>
                      </div>
                      <Icon name="arrow" size={16} className="text-cyan" />
                    </AppLink>
                  ))}
                </div>
              </>
            )}

            <h2 className="display-3 mt-12">Common questions for {city.name}</h2>
            <div className="mt-5 border-t border-line">
              {city.faqs.map((faq, i) => (
                <details key={faq.q} className="group border-b border-line" open={i === 0}>
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-4 text-[.9375rem] font-medium text-navy marker:hidden">
                    {faq.q}
                    <span className="text-muted transition-transform group-open:rotate-45">
                      <Icon name="plus" size={14} />
                    </span>
                  </summary>
                  <p className="pb-5 pr-8 text-[.875rem] leading-relaxed text-ink-slate">{faq.a}</p>
                </details>
              ))}
            </div>
          </div>
          <aside className="lg:col-span-5">
            <div className="lg:sticky lg:top-24 space-y-6">
              <div className="rounded-2xl border border-line bg-paper p-6">
                <p className="eyebrow">Operations &amp; intake</p>
                <h2 className="display-3 mt-2">{city.name} hub details</h2>
                <p className="mt-3 text-[.875rem] leading-relaxed text-ink-slate">{city.officeAddress}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <button type="button" onClick={() => book('/customer/booking')} className="pill pill-navy pill-sm">
                    Book in workspace
                  </button>
                  <AppLink href="/contact" navigate={navigate} className="pill pill-line pill-sm">
                    Contact dispatch
                  </AppLink>
                </div>
              </div>
              <QuoteEstimator compact onBook={() => book('/customer/booking')} />
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}

function RoutePage({ route, navigate, book }) {
  const reverse = ROUTE_BY_SLUG[route.reverseSlug];

  return (
    <>
      <PageHero
        eyebrow="Intercity parcel corridor"
        title={route.title}
        lead={route.metaDescription}
        trail={[
          { label: 'Coverage', href: '/coverage' },
          { label: `${route.fromCity} → ${route.toCity}` },
        ]}
        image={route.heroImage}
        imageAlt={route.heroAlt}
        navigate={navigate}
      />
      <section className="section bg-white">
        <div className="container-x grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-7">
            <AnswerSummary eyebrow="Route summary" text={route.answerSummary} />
            <h2 className="display-3">Corridor specifications</h2>
            <div className="mt-5 overflow-x-auto rounded-2xl border border-line">
              <table className="w-full text-left text-[.875rem]">
                <tbody className="divide-y divide-line">
                  <tr>
                    <th className="bg-paper px-5 py-3.5 font-medium text-navy">Origin city</th>
                    <td className="px-5 py-3.5 text-ink-slate">
                      <AppLink href={`/cities/${route.fromSlug}`} navigate={navigate} className="font-medium text-cyan underline underline-offset-2">
                        {route.fromCity}
                      </AppLink>
                    </td>
                  </tr>
                  <tr>
                    <th className="bg-paper px-5 py-3.5 font-medium text-navy">Destination city</th>
                    <td className="px-5 py-3.5 text-ink-slate">
                      <AppLink href={`/cities/${route.toSlug}`} navigate={navigate} className="font-medium text-cyan underline underline-offset-2">
                        {route.toCity}
                      </AppLink>
                    </td>
                  </tr>
                  <tr>
                    <th className="bg-paper px-5 py-3.5 font-medium text-navy">Intake point</th>
                    <td className="px-5 py-3.5 text-ink-slate">{route.intakeLocation}</td>
                  </tr>
                  <tr>
                    <th className="bg-paper px-5 py-3.5 font-medium text-navy">Dispatch timing</th>
                    <td className="px-5 py-3.5 text-ink-slate">{route.deliveryWindow}</td>
                  </tr>
                  <tr>
                    <th className="bg-paper px-5 py-3.5 font-medium text-navy">Pricing</th>
                    <td className="px-5 py-3.5 text-ink-slate">{route.pricingNote}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h2 className="display-3 mt-12">Common shipments on this route</h2>
            <ul className="mt-5 grid gap-3 sm:grid-cols-2">
              {route.idealFor.map((item) => (
                <li key={item} className="flex items-start gap-3 rounded-xl border border-line bg-white p-4">
                  <Icon name="check" size={16} className="mt-0.5 shrink-0 text-cyan" />
                  <span className="text-[.875rem] text-navy">{item}</span>
                </li>
              ))}
            </ul>

            {reverse && (
              <div className="mt-10 rounded-2xl border border-line bg-paper p-5">
                <p className="text-[.75rem] font-semibold uppercase tracking-wider text-muted">Return direction</p>
                <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-[.9375rem] font-medium text-navy">Sending the other way from {reverse.fromCity} to {reverse.toCity}?</p>
                  <AppLink href={`/routes/${reverse.slug}`} navigate={navigate} className="link-underline">
                    View {reverse.fromCity} → {reverse.toCity}
                    <Icon name="arrow" size={14} />
                  </AppLink>
                </div>
              </div>
            )}

            <h2 className="display-3 mt-12">Route questions</h2>
            <div className="mt-5 border-t border-line">
              {route.faqs.map((faq, i) => (
                <details key={faq.q} className="group border-b border-line" open={i === 0}>
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-4 text-[.9375rem] font-medium text-navy marker:hidden">
                    {faq.q}
                    <span className="text-muted transition-transform group-open:rotate-45">
                      <Icon name="plus" size={14} />
                    </span>
                  </summary>
                  <p className="pb-5 pr-8 text-[.875rem] leading-relaxed text-ink-slate">{faq.a}</p>
                </details>
              ))}
            </div>
          </div>
          <aside className="lg:col-span-5">
            <div className="lg:sticky lg:top-24 space-y-6">
              <QuoteEstimator defaultService="waybill" onBook={() => book('/customer/booking')} />
              <div className="rounded-2xl border border-line bg-paper p-6">
                <h3 className="text-[.9375rem] font-semibold text-navy">Pack safely for transit</h3>
                <p className="mt-1.5 text-[.8125rem] leading-relaxed text-ink-slate">
                  Review prohibited items and packing advice before dropping off at {SITE.shortAddress}.
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <AppLink href="/guides/packaging-fragile-items-for-intercity-waybills" navigate={navigate} className="link-underline text-[.8125rem]">
                    Packing guide
                  </AppLink>
                  <AppLink href="/prohibited-items" navigate={navigate} className="link-underline text-[.8125rem]">
                    Prohibited items
                  </AppLink>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}

function HowItWorksPage({ navigate }) {
  return (
    <>
      <PageHero
        eyebrow="How DigiTrans works"
        title="Clear steps from quote to delivery handoff."
        lead="Whether you are booking a Calabar delivery, sending a Watt Market shopping list, verifying a UNICAL student ID, or dropping off a waybill for Port Harcourt or Obudu."
        trail={[{ label: 'How it works' }]}
        image="/images/handover.jpg"
        imageAlt="DigiTrans rider handing a parcel to a customer"
        navigate={navigate}
      />
      <section className="section bg-white">
        <div className="container-x">
          <div className="grid gap-6 md:grid-cols-2">
            {howItWorksSteps.map((group, idx) => (
              <article key={group.service} className="rounded-3xl border border-line bg-white p-6 shadow-xs sm:p-8">
                <span className="font-mono text-[.6875rem] text-cyan">0{idx + 1} / WORKFLOW</span>
                <h2 className="display-3 mt-2">{group.service}</h2>
                <ol className="mt-5 space-y-3 border-t border-line pt-5">
                  {group.steps.map((step, stepIndex) => (
                    <li key={step} className="flex gap-3 text-[.875rem] leading-relaxed text-ink-slate">
                      <span className="font-mono text-[.75rem] font-semibold text-navy">{stepIndex + 1}.</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
                <AppLink href={group.href} navigate={navigate} className="link-underline mt-6 text-[.875rem]">
                  Explore {group.service}
                  <Icon name="arrow" size={14} />
                </AppLink>
              </article>
            ))}
          </div>
          <div className="mt-12 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-line bg-paper p-6 sm:p-8">
            <div>
              <h2 className="display-3">Ready to estimate or track a parcel?</h2>
              <p className="mt-1 text-[.875rem] text-ink-slate">Use our live quote planner or look up any DT-CAL or DT-WB tracking number.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <AppLink href="/quote" navigate={navigate} className="pill pill-navy pill-sm">
                Get an estimate
              </AppLink>
              <AppLink href="/track" navigate={navigate} className="pill pill-line pill-sm">
                Track delivery
              </AppLink>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function PricingPage({ navigate, book }) {
  return (
    <>
      <PageHero
        eyebrow="Pricing & calculation"
        title="Transparent fares calculated upfront."
        lead="Local deliveries, Market Runs, verified student campus pricing, vendor discounts, and weight-tiered waybills are checked by the server before booking confirmation."
        trail={[{ label: 'Pricing' }]}
        image="/images/depot.jpg"
        imageAlt="DigiTrans dispatch depot in Calabar"
        navigate={navigate}
      />
      <section className="section bg-white">
        <div className="container-x grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-7">
            <p className="eyebrow">How tariffs work</p>
            <h2 className="display-3 mt-2.5">Pricing rules &amp; categories</h2>
            <div className="mt-5 overflow-x-auto rounded-2xl border border-line">
              <table className="w-full text-left text-[.875rem]">
                <thead className="border-b border-line bg-paper text-[.75rem] uppercase tracking-wider text-muted">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Service</th>
                    <th className="px-4 py-3 font-semibold">Pricing structure</th>
                    <th className="px-4 py-3 font-semibold">Confirmation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {pricingSummaryRows.map(([service, basis, note]) => (
                    <tr key={service}>
                      <td className="px-4 py-3.5 font-medium text-navy">{service}</td>
                      <td className="px-4 py-3.5 text-ink-slate">{basis}</td>
                      <td className="px-4 py-3.5 text-[.8125rem] text-muted">{note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <h2 className="display-3 mt-14">Optional additions &amp; intake checks</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {pricingExtras.map(([label, amount, note]) => (
                <div key={label} className="rounded-2xl border border-line bg-white p-5 shadow-xs">
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="text-[.875rem] font-semibold text-navy">{label}</h3>
                    <p className="shrink-0 text-[.75rem] font-semibold text-cyan">{amount}</p>
                  </div>
                  <p className="mt-1.5 text-[.78125rem] leading-relaxed text-muted">{note}</p>
                </div>
              ))}
            </div>
            <div className="mt-10 rounded-2xl border border-cyan/20 bg-cyan/5 p-6">
              <h2 className="text-[.9375rem] font-semibold text-navy">Live server tariff verification</h2>
              <p className="mt-1.5 text-[.8125rem] leading-relaxed text-ink-slate">
                Planning estimates reflect DigiTrans published tariffs (₦500 base + ₦250/km with ₦1,000 minimum local fare, ₦1,500 Market Run fee, ₦500 verified student rate, 10% verified vendor discount, and ₦1,500 / ₦3,000 / ₦4,500 waybill tiers). Your signed-in workspace confirms the exact Naira figure prior to payment or confirmation.
              </p>
            </div>
          </div>
          <aside className="lg:col-span-5">
            <div className="lg:sticky lg:top-24">
              <p className="eyebrow">Calculator</p>
              <h2 className="display-3 mt-2.5">Preview a zone estimate</h2>
              <p className="body-sm mt-2">Choose two Calabar zones or preview a waybill weight calculation.</p>
              <div className="mt-5">
                <QuoteEstimator onBook={() => book('/customer/booking')} />
              </div>
              <p className="mt-4 text-[.75rem] leading-relaxed text-muted">
                Want details on how zone distances work? Read our{' '}
                <AppLink href="/guides/how-delivery-pricing-works-in-calabar" navigate={navigate} className="underline decoration-line-strong text-navy">
                  Calabar delivery pricing guide
                </AppLink>.
              </p>
            </div>
          </aside>
        </div>
      </section>
      <section className="border-t border-line bg-paper py-12">
        <div className="container-x flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-display text-[1.125rem] font-medium tracking-tight text-navy">Dispatching regularly for a business?</h2>
            <p className="mt-1 text-[.8125rem] text-ink-slate">Apply for a DigiTrans vendor account to access approved vendor pricing rules.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <AppLink href="/services/business-logistics" navigate={navigate} className="pill pill-navy pill-sm">
              Business logistics
            </AppLink>
            <AppLink href="/quote" navigate={navigate} className="pill pill-line pill-sm">
              Estimate a trip
              <Icon name="arrow" size={13} />
            </AppLink>
          </div>
        </div>
      </section>
    </>
  );
}

function CoveragePage({ navigate }) {
  const groups = ['Calabar Municipal', 'Calabar South'];
  return (
    <>
      <PageHero
        eyebrow="Coverage"
        title="Calabar zones & verified intercity corridors."
        lead="12 Calabar zones around familiar landmarks and campuses, paired with tracked intercity parcel routes connecting Calabar, Port Harcourt, and Obudu."
        trail={[{ label: 'Coverage' }]}
        image="/images/market-run.jpg"
        imageAlt="Calabar logistics market and local delivery coverage"
        navigate={navigate}
      >
        <div className="mt-8 flex flex-wrap gap-x-10 gap-y-4 border-t border-white/15 pt-6">
          {[
            ['12', 'Calabar zones'],
            ['03', 'Cities linked'],
            ['04', 'Intercity corridors'],
          ].map(([value, label]) => (
            <div key={label}>
              <p className="font-display text-2xl font-medium leading-none tracking-tight text-white">{value}</p>
              <p className="mt-1.5 text-[.75rem] text-white/55">{label}</p>
            </div>
          ))}
        </div>
      </PageHero>
      <section className="section bg-white">
        <div className="container-x">
          <div className="grid gap-6 pb-12 sm:grid-cols-3">
            {CITIES.map((city) => (
              <AppLink
                key={city.slug}
                href={`/cities/${city.slug}`}
                navigate={navigate}
                className="group rounded-2xl border border-line bg-paper p-6 transition-all hover:border-cyan hover:bg-white hover:shadow-md"
              >
                <span className="text-[.6875rem] font-semibold uppercase tracking-wider text-cyan">{city.state}</span>
                <h2 className="display-3 mt-1 group-hover:text-cyan">{city.name}</h2>
                <p className="mt-2 text-[.8125rem] leading-relaxed text-ink-slate">{city.metaDescription}</p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-[.75rem] font-semibold text-navy">
                  Explore {city.name}
                  <Icon name="arrow" size={12} />
                </span>
              </AppLink>
            ))}
          </div>

          <div className="grid gap-10 border-t border-b border-line py-10 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-5">
              <p className="eyebrow">Local zones</p>
              <h2 className="display-2 mt-2.5 max-w-[22ch]">Calabar delivery zones by LGA &amp; landmark.</h2>
            </div>
            <div className="lg:col-span-6 lg:col-start-7">
              <p className="body-sm">
                Our operations base is at {SITE.address}. If your street sits between zones, enter the nearest recognizable landmark when booking so our dispatch desk routes it cleanly.
              </p>
            </div>
          </div>

          {groups.map((lga) => {
            const list = zones.filter((zone) => zone.lga === lga);
            return (
              <div key={lga} className="grid gap-6 border-b border-line py-10 lg:grid-cols-12 lg:gap-16">
                <div className="lg:col-span-3">
                  <h3 className="display-3">{lga}</h3>
                  <p className="mt-1.5 text-[.75rem] text-muted">
                    {list.length} {list.length === 1 ? 'zone' : 'zones'}
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:col-span-9 lg:grid-cols-3">
                  {list.map((zone) => (
                    <div key={zone.id} className="rounded-2xl border border-line bg-white p-5 shadow-xs">
                      <div className="flex items-baseline justify-between gap-3">
                        <p className="text-[.875rem] font-semibold text-navy">{zone.name}</p>
                        {zone.campus && (
                          <span className="shrink-0 rounded-full bg-cyan/10 px-2 py-0.5 text-[.625rem] font-semibold uppercase tracking-wider text-cyan">
                            Campus rate
                          </span>
                        )}
                      </div>
                      <p className="mt-2 text-[.78125rem] leading-relaxed text-muted">{zone.landmarks.join(' · ')}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          <div className="mt-12 grid gap-0 overflow-hidden rounded-3xl border border-line/80 shadow-panel lg:grid-cols-2">
            <div className="relative min-h-[18rem]">
              <Picture
                src="/images/waybill.jpg"
                alt="A parcel prepared for intercity waybill transit"
                sizes="(max-width: 1024px) 100vw, 600px"
                className="absolute inset-0 h-full w-full object-cover"
              />
            </div>
            <div className="p-7 sm:p-10">
              <p className="text-[.75rem] font-medium text-muted">Intercity parcel corridors</p>
              <h3 className="display-3 mt-2">Tracked waybill routes.</h3>
              <p className="body-sm mt-3 max-w-[44ch]">
                Send verified parcels between Calabar, Port Harcourt, and Obudu with intake confirmation at {SITE.shortAddress} and live DT-WB status updates.
              </p>
              <div className="mt-6 divide-y divide-line border-y border-line">
                {ROUTES.map((route) => (
                  <AppLink
                    key={route.slug}
                    href={`/routes/${route.slug}`}
                    navigate={navigate}
                    className="flex items-center justify-between py-3 text-[.875rem] text-navy transition-colors hover:text-cyan"
                  >
                    <span>{route.fromCity} → {route.toCity}</span>
                    <span className="inline-flex items-center gap-1.5 text-[.8125rem] text-muted">
                      Details <Icon name="arrow" size={12} />
                    </span>
                  </AppLink>
                ))}
              </div>
              <AppLink href="/services/intercity-waybill" navigate={navigate} className="link-underline mt-6">
                Explore intercity waybills
                <Icon name="arrow" size={13} />
              </AppLink>
            </div>
          </div>
        </div>
      </section>
      <section className="border-t border-line bg-paper py-12">
        <div className="container-x flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-display text-[1.125rem] font-medium tracking-tight text-navy">Not sure which zone applies?</h2>
            <p className="mt-1 text-[.8125rem] text-ink-slate">Send us your landmark and we will guide you before you book.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <AppLink href="/quote" navigate={navigate} className="pill pill-navy pill-sm">
              Price a route
            </AppLink>
            <AppLink href="/contact" navigate={navigate} className="pill pill-line pill-sm">
              Ask dispatch
            </AppLink>
          </div>
        </div>
      </section>
    </>
  );
}

function AboutPage({ navigate }) {
  const values = [
    ['shield', 'Calculated fares, not haggling', 'Delivery pricing is generated by active server rules and shown upfront before you confirm your request.'],
    ['users', 'Verified riders & structured records', 'Riders onboard with valid identification and guarantor documentation reviewed by operations prior to assignment.'],
    ['bag', 'Approval-first Market Runs', 'Customers submit lists and approve estimates before shopping begins, keeping expenses transparent.'],
    ['pin', 'Accountable Calabar headquarters', `Our dispatch desk operates from ${SITE.address} with direct inbox support via ${SITE.email}.`],
  ];

  const roles = [
    [
      'bike',
      '/images/rider-portrait.jpg',
      'Ride with DigiTrans',
      'Owners or operators of bicycles, e-bikes, or delivery motorcycles in Calabar. Submit your ID and guarantor records for onboarding review.',
      'Start rider onboarding',
      '/rider-registration',
    ],
    [
      'bag',
      '/images/merchant.jpg',
      'Become a vendor',
      'Calabar restaurants, pharmacies, supermarkets, and online retailers gain a centralized dispatch dashboard and CSV reconciliation exports.',
      'Explore business logistics',
      '/services/business-logistics',
    ],
    [
      'route',
      '/images/depot.jpg',
      'Partner or contact operations',
      'Questions about partnerships, investor disclosures, or intercity waybill routes between Calabar, Port Harcourt, and Obudu? Write directly to our team.',
      'Message operations',
      '/contact',
    ],
  ];

  return (
    <>
      <PageHero
        eyebrow="About DigiTrans Logistics"
        title="Local Calabar dispatch & tracked intercity waybills."
        lead={`Headquartered at ${SITE.address}, DigiTrans Logistics connects customers, vetted riders, Market Run shoppers, and local vendors on one transparent operations platform.`}
        trail={[{ label: 'About' }]}
        image="/images/depot.jpg"
        imageAlt="DigiTrans Calabar dispatch hub"
        navigate={navigate}
        className="about-page-hero"
      >
        <div className="about-hero-stats">
          {[
            ['12', 'Calabar delivery zones'],
            ['06', 'Core logistics services'],
            ['03', 'Intercity hubs linked'],
            ['01', 'Calabar headquarters'],
          ].map(([value, label], index) => (
            <div key={label}>
              <span>0{index + 1}</span>
              <strong>{value}</strong>
              <small>{label}</small>
            </div>
          ))}
        </div>
      </PageHero>
      <section className="about-operating-section">
        <div className="container-x about-operating-layout">
          <div className="about-operating-copy">
            <p className="eyebrow">How we operate</p>
            <h2>
              Transparent logistics.
              <br />
              <em>Grounded in Calabar.</em>
            </h2>
            <div className="about-operating-intro">
              <p>
                DigiTrans Logistics is built around verifiable records—from upfront fare calculation and Market Run budget approvals to intake-verified intercity waybills connecting Calabar, Port Harcourt, and Obudu.
              </p>
              <p>
                Every rider, business vendor, and student account goes through private document verification so customers and recipients always know who is handling their parcel.
              </p>
            </div>
            <div className="about-principles-grid">
              {values.map(([icon, title, body], index) => (
                <article className="about-principle-card" key={title}>
                  <div className="about-principle-top">
                    <span>0{index + 1} / PRINCIPLE</span>
                    <i>
                      <Icon name={icon} size={20} />
                    </i>
                  </div>
                  <h3>{title}</h3>
                  <p>{body}</p>
                </article>
              ))}
            </div>
          </div>
          <aside className="about-operator-aside">
            <figure className="about-operator-portrait">
              <Picture src="/images/rider-portrait.jpg" alt="DigiTrans delivery courier in Calabar" sizes="(max-width: 980px) 100vw, 440px" />
              <span className="about-portrait-shade" />
              <figcaption>
                <span>VERIFIED LOCAL NETWORK</span>
                <strong>Calabar Dispatch</strong>
                <small>Vetted riders &amp; market shoppers</small>
              </figcaption>
              <span className="about-portrait-stamp">
                <Icon name="bike" size={19} />
                CALABAR
                <br />
                HUB
              </span>
            </figure>
            <div className="about-operating-details">
              <div>
                <span className="about-details-icon">
                  <Icon name="pin" size={18} />
                </span>
                <span>
                  <small>OPERATIONS OFFICE</small>
                  <strong>Nyahasang, Atimbo · Calabar</strong>
                </span>
              </div>
              <dl>
                {[
                  ['Company', SITE.name],
                  ['Address', SITE.address],
                  ['Support email', SITE.email],
                  ['Cities', 'Calabar, Port Harcourt & Obudu'],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </aside>
        </div>
      </section>
      <section className="about-careers-section">
        <div className="container-x">
          <div className="about-careers-heading">
            <div>
              <p className="eyebrow">Work with DigiTrans</p>
              <h2>
                Riders, vendors, and
                <br />
                local operations.
              </h2>
            </div>
            <p>Explore how to onboard onto our Calabar logistics platform.</p>
          </div>
          <div className="about-career-grid">
            {roles.map(([icon, image, title, body, cta, path], index) => (
              <article className="about-career-card" key={title}>
                <div className="about-career-image">
                  <Picture src={image} alt={title} sizes="(max-width: 980px) 100vw, 400px" />
                  <span />
                  <span className="about-career-number">0{index + 1} / 03</span>
                  <span className="about-career-icon">
                    <Icon name={icon} size={19} />
                  </span>
                </div>
                <div className="about-career-copy">
                  <h3>{title}</h3>
                  <p>{body}</p>
                  <AppLink href={path} navigate={navigate}>
                    {cta}
                    <Icon name="arrow" size={15} />
                  </AppLink>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

function ContactPage({ content, navigate }) {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const contact = contactDetailsFromSettings(content?.settings);

  const submit = async (e) => {
    e.preventDefault();
    const formElement = e.currentTarget;
    const form = Object.fromEntries(new FormData(formElement));
    setBusy(true);
    setError('');
    try {
      await api('/public/contact', { method: 'POST', body: form });
      trackEvent('contact_click', { method: 'enquiry_form', category: form.category || 'general' });
      setDone(true);
      formElement.reset();
    } catch (err) {
      setError(err.message || 'Your message could not be sent. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHero
        eyebrow="Contact DigiTrans"
        title="Contact the Calabar dispatch & support team."
        lead={`Reach us by email at ${contact.email}, submit an enquiry below, or visit our office at ${contact.address}.`}
        trail={[{ label: 'Contact' }]}
        image="/images/merchant.jpg"
        imageAlt="DigiTrans rider picking up a business parcel in Calabar"
        navigate={navigate}
      >
        <div className="mt-8 grid max-w-2xl gap-3 sm:grid-cols-2">
          <a
            href={contact.emailHref}
            onClick={() => trackEvent('contact_click', { method: 'email', location: 'contact_hero' })}
            className="rounded-2xl border border-white/15 bg-white/[0.08] p-5 transition-all hover:border-white/25 hover:bg-white/[0.14]"
          >
            <span className="text-[.6875rem] uppercase tracking-wider text-white/60">Email dispatch</span>
            <span className="mt-1.5 block break-all font-display text-[.9375rem] font-semibold text-white">{contact.email}</span>
          </a>
          <div className="rounded-2xl border border-white/15 bg-white/[0.08] p-5">
            <span className="text-[.6875rem] uppercase tracking-wider text-white/60">Calabar office</span>
            <span className="mt-1.5 block font-display text-[.875rem] font-semibold text-white">{contact.address}</span>
          </div>
          {contact.phoneHref && (
            <a
              href={contact.phoneHref}
              onClick={() => trackEvent('call_click', { location: 'contact_hero' })}
              className="rounded-2xl border border-white/15 bg-white/[0.08] p-5 transition-all hover:border-white/25 hover:bg-white/[0.14]"
            >
              <span className="text-[.6875rem] uppercase tracking-wider text-white/60">Phone</span>
              <span className="mt-1.5 block font-display text-[.9375rem] font-semibold text-white">{contact.phone}</span>
            </a>
          )}
          {contact.whatsappHref && (
            <a
              href={contact.whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackEvent('whatsapp_click', { location: 'contact_hero' })}
              className="rounded-2xl border border-white/15 bg-white/[0.08] p-5 transition-all hover:border-white/25 hover:bg-white/[0.14]"
            >
              <span className="text-[.6875rem] uppercase tracking-wider text-white/60">WhatsApp</span>
              <span className="mt-1.5 block font-display text-[.9375rem] font-semibold text-white">{contact.whatsapp}</span>
            </a>
          )}
        </div>
      </PageHero>
      <section className="section bg-white">
        <div className="container-x grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-7">
            <p className="eyebrow">Message the desk</p>
            <h2 className="display-2 mt-2.5 max-w-[22ch]">Send us an enquiry.</h2>
            <p className="body-sm mt-3 max-w-lg">
              Every message goes straight into our DigiTrans admin console and support email inbox so our team can respond promptly.
            </p>
            <div className="mt-8">
              {done ? (
                <div className="border-l-2 border-success bg-[#edf7f1] px-5 py-4 text-[.875rem] leading-6 text-[#27684d]" role="status">
                  <strong>Thanks — your message is with the DigiTrans team.</strong>
                  <br />
                  We’ll reply using the contact details you shared.
                </div>
              ) : (
                <Card className="rounded-[14px] border-line p-5 sm:p-7">
                  <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
                    <Field label="Your name" required>
                      <Input name="name" required minLength={2} maxLength={100} autoComplete="name" placeholder="Full name" />
                    </Field>
                    <Field label="Email address" required>
                      <Input name="email" type="email" required autoComplete="email" placeholder="you@example.com" />
                    </Field>
                    <Field label="Phone number">
                      <Input name="phone" type="tel" autoComplete="tel" placeholder="+234…" />
                    </Field>
                    <Field label="What’s this about?">
                      <Select name="category">
                        <option value="general">General question</option>
                        <option value="delivery">Delivery support</option>
                        <option value="rider">Rider application</option>
                        <option value="vendor">Business partnership</option>
                        <option value="intercity">Intercity / waybill</option>
                      </Select>
                    </Field>
                    <Field label="Message" required className="sm:col-span-2">
                      <Textarea name="message" required minLength={10} maxLength={3000} placeholder="Tell us how we can help…" />
                    </Field>
                    {error && (
                      <p role="alert" className="text-[.8125rem] font-medium text-danger sm:col-span-2">
                        {error}
                      </p>
                    )}
                    <div className="flex items-center justify-between gap-4 sm:col-span-2">
                      <p className="text-[.6875rem] leading-4 text-muted">Delivered to {contact.email}.</p>
                      <Button type="submit" loading={busy} iconRight="arrow">
                        Send enquiry
                      </Button>
                    </div>
                  </form>
                </Card>
              )}
            </div>
          </div>
          <aside className="space-y-4 lg:col-span-5">
            <div id="vendors" className="scroll-mt-28 rounded-2xl border border-line bg-white p-6 shadow-soft">
              <p className="text-[.6875rem] uppercase tracking-[.14em] text-muted">For businesses</p>
              <h3 className="mt-2 font-display text-[1.125rem] font-medium tracking-tight text-navy">Apply for a vendor account</h3>
              <p className="mt-2 text-[.8125rem] leading-relaxed text-ink-slate">
                Register as a vendor and submit your business details for operations verification, dispatch board access, and CSV reporting.
              </p>
              <AppLink href="/services/business-logistics" navigate={navigate} className="link-underline mt-5">
                Explore business logistics
                <Icon name="arrow" size={13} />
              </AppLink>
            </div>
            <div id="riders" className="scroll-mt-28 rounded-2xl border border-line bg-white p-6 shadow-soft">
              <p className="text-[.6875rem] uppercase tracking-[.14em] text-muted">For riders</p>
              <h3 className="mt-2 font-display text-[1.125rem] font-medium tracking-tight text-navy">Ride with DigiTrans</h3>
              <p className="mt-2 text-[.8125rem] leading-relaxed text-ink-slate">
                Bicycle, e-bike, or delivery motorcycle operators in Calabar can submit identity and guarantor documents for review.
              </p>
              <AppLink href="/register?role=rider" navigate={navigate} className="pill pill-navy pill-sm mt-5">
                Start rider onboarding
              </AppLink>
            </div>
            <div className="rounded-2xl border border-line bg-white p-6 shadow-soft">
              <p className="text-[.6875rem] uppercase tracking-[.14em] text-muted">Office address</p>
              <h3 className="mt-2 font-display text-[1.125rem] font-medium tracking-tight text-navy">Nyahasang, Atimbo · Calabar</h3>
              <p className="mt-2 text-[.8125rem] leading-relaxed text-ink-slate">{contact.address}</p>
              <div className="relative mt-4 aspect-[16/10] overflow-hidden rounded-xl bg-[#eef1f2]">
                <svg viewBox="0 0 320 200" className="h-full w-full" aria-hidden="true">
                  <rect width="320" height="200" fill="#eef1f2" />
                  {Array.from({ length: 4 }).map((_, row) =>
                    Array.from({ length: 6 }).map((__, col) => (
                      <rect key={`${row}-${col}`} x={col * 54 + 8} y={row * 50 + 8} width="38" height="34" fill="#e2e7e9" />
                    )),
                  )}
                  <path d="M0 104h320M160 0v200" stroke="#fff" strokeWidth="12" />
                  <path d="M0 52h320M270 0v200" stroke="#fff" strokeWidth="6" />
                  <path d="M0 160h320M60 0v200" stroke="#fff" strokeWidth="5" />
                  <circle cx="160" cy="104" r="16" fill="#0e7c8b" fillOpacity=".12" />
                  <circle cx="160" cy="104" r="6" fill="#0b1b2b" stroke="#fff" strokeWidth="2.5" />
                </svg>
                <span className="absolute bottom-2 left-2 bg-white px-2 py-1 text-[.625rem] text-ink-slate shadow-sm">
                  No 2, Ituebange St, Nyahasang, Atimbo
                </span>
              </div>
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(contact.address)}`}
                target="_blank"
                rel="noreferrer noopener"
                className="link-underline mt-4"
              >
                Open in Google Maps
                <Icon name="external" size={13} />
              </a>
            </div>
          </aside>
        </div>
      </section>
      <section id="faqs" className="bg-paper">
        <FaqSection items={content?.faqs?.length ? content.faqs : defaultFaqs} title="Common questions." navigate={navigate} settings={content?.settings} />
      </section>
      <section className="bg-paper pb-14">
        <div className="container-x grid gap-4 sm:grid-cols-2">
          <div id="privacy" className="scroll-mt-28 rounded-2xl border border-line bg-white p-6 shadow-xs">
            <h3 className="text-[.875rem] font-semibold text-navy">Privacy</h3>
            <p className="mt-2 text-[.8125rem] leading-relaxed text-ink-slate">
              We collect only what bookings and verification require. Student, rider, guarantor, and vendor documents remain private.
            </p>
            <AppLink href="/privacy" navigate={navigate} className="link-underline mt-4">
              Read privacy policy
              <Icon name="arrow" size={12} />
            </AppLink>
          </div>
          <div id="terms" className="scroll-mt-28 rounded-2xl border border-line bg-white p-6 shadow-xs">
            <h3 className="text-[.875rem] font-semibold text-navy">Terms</h3>
            <p className="mt-2 text-[.8125rem] leading-relaxed text-ink-slate">
              Cash, weapons, hazardous items, and live animals are strictly prohibited. Review full terms before booking.
            </p>
            <AppLink href="/terms" navigate={navigate} className="link-underline mt-4">
              Read service terms
              <Icon name="arrow" size={12} />
            </AppLink>
          </div>
        </div>
      </section>
    </>
  );
}

function QuotePage({ navigate, book, content }) {
  const contact = contactDetailsFromSettings(content?.settings);
  return (
    <>
      <PageHero
        eyebrow="Get a quote"
        title="Estimate a delivery or waybill."
        lead="Select a service and preview planning charges before signing in to submit your request."
        trail={[{ label: 'Get a quote' }]}
        image="/images/handover.jpg"
        imageAlt="A DigiTrans courier handing over a parcel"
        navigate={navigate}
      />
      <section className="section-tight bg-white">
        <div className="container-x grid gap-10 lg:grid-cols-[.85fr_1.15fr] lg:items-start">
          <div className="max-w-md">
            <p className="eyebrow">Before you confirm</p>
            <h2 className="display-2 mt-3">Upfront pricing before confirmation.</h2>
            <p className="body-sm mt-4">
              Preview your route here, then sign in to place the order where active server rules verify the exact Naira fare before confirmation.
            </p>
            <div className="mt-7 space-y-3">
              {[
                ['01', 'Choose a service', 'Local delivery, Market Run, Student, Business, or Intercity waybill.'],
                ['02', 'Set pickup & destination', 'Select Calabar service zones or prepare an intercity waybill.'],
                ['03', 'Confirm in workspace', 'Review the server-calculated fare and track with your DT reference.'],
              ].map(([n, title, body]) => (
                <div key={n} className="flex gap-4 border-t border-line py-4">
                  <span className="font-mono text-[.6875rem] text-muted">{n}</span>
                  <div>
                    <h3 className="text-[.875rem] font-medium text-navy">{title}</h3>
                    <p className="mt-1 text-[.8125rem] leading-relaxed text-muted">{body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <QuoteEstimator onBook={() => book('/customer/booking')} />
        </div>
      </section>
      <section className="border-t border-line bg-paper py-8">
        <div className="container-x flex flex-col items-start justify-between gap-3 text-[.8125rem] sm:flex-row sm:items-center">
          <p className="text-ink-slate">Need help choosing a service? Message dispatch or explore our coverage guide.</p>
          <div className="flex flex-wrap gap-2">
            <AppLink href="/coverage" navigate={navigate} className="pill pill-line pill-sm">
              View coverage
            </AppLink>
            <a href={contact.emailHref} className="pill pill-navy pill-sm">
              Email {contact.email}
            </a>
          </div>
        </div>
      </section>
    </>
  );
}

function TrackPage({ navigate, content }) {
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const contact = contactDetailsFromSettings(content?.settings);
  const reference =
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('ref')?.trim().toUpperCase() || ''
      : '';

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    let live = true;
    if (!reference) {
      setResult(null);
      setError('');
      setBusy(false);
      return () => {
        live = false;
      };
    }
    setBusy(true);
    setResult(null);
    setError('');
    api(`/track/${encodeURIComponent(reference)}`)
      .then((data) => {
        if (live) setResult(data);
      })
      .catch((err) => {
        if (live) {
          setResult(null);
          setError(err.message || 'We could not find that tracking reference.');
        }
      })
      .finally(() => {
        if (live) setBusy(false);
      });
    return () => {
      live = false;
    };
  }, [reference, attempt]);

  return (
    <>
      <PageHero
        eyebrow="Track your delivery"
        title="Where is my delivery or waybill?"
        lead="Enter your reference from your booking confirmation. Local references look like DT-CAL-0000-0000 and waybills start with DT-WB."
        trail={[{ label: 'Track' }]}
        navigate={navigate}
      >
        <form
          action="/track"
          onSubmit={(e) => {
            e.preventDefault();
            const value = new FormData(e.currentTarget).get('ref')?.toString().trim();
            navigate(value ? `/track?ref=${encodeURIComponent(value.toUpperCase())}` : '/track');
          }}
          className="mt-8 flex max-w-xl flex-col gap-2 sm:flex-row"
        >
          <label htmlFor="track-ref" className="sr-only">
            Tracking reference
          </label>
          <input
            id="track-ref"
            name="ref"
            defaultValue={reference}
            placeholder="DT-CAL-0000-0000 or DT-WB-..."
            className="field field-dark flex-1"
            autoComplete="off"
            spellCheck={false}
          />
          <button type="submit" className="pill pill-white">
            Track
            <Icon name="search" size={14} />
          </button>
        </form>
      </PageHero>
      <section className="section-tight bg-white">
        <div className="container-x max-w-4xl">
          {!reference && (
            <div className="rounded-[14px] border border-line p-6 sm:p-8">
              <h2 className="font-display text-[1.125rem] font-medium tracking-tight text-navy">No reference yet?</h2>
              <p className="mt-2 max-w-xl text-[.875rem] leading-relaxed text-ink-slate">
                Your tracking code appears on your DigiTrans workspace order receipt and confirmation email. Need help finding a shipment? Email{' '}
                <a href={contact.emailHref} className="underline decoration-line-strong text-navy">
                  {contact.email}
                </a>.
              </p>
            </div>
          )}
          {busy && (
            <div className="space-y-3">
              <div className="h-3 animate-pulse rounded bg-line" />
              <div className="h-28 animate-pulse rounded-[14px] bg-paper" />
            </div>
          )}
          {error && (
            <div className="border-l-2 border-danger bg-paper p-6">
              <h2 className="font-display text-[1.125rem] font-medium tracking-tight text-navy">We could not find {reference}</h2>
              <p className="mt-2 text-[.875rem] leading-relaxed text-ink-slate">
                {error} Double-check the reference or{' '}
                <AppLink href="/contact" navigate={navigate} className="font-medium text-navy underline decoration-line-strong underline-offset-2">
                  contact DigiTrans support
                </AppLink>.
              </p>
              <button type="button" onClick={() => setAttempt((v) => v + 1)} className="pill pill-navy pill-sm mt-4">
                Try again
              </button>
            </div>
          )}
          {result?.tracking && (
            <div className="overflow-hidden rounded-3xl border border-line/80 bg-white shadow-panel">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line px-6 py-5">
                <div>
                  <p className="text-[.6875rem] uppercase tracking-[.14em] text-muted">Tracking reference</p>
                  <p className="mt-1.5 font-display text-[1.25rem] font-medium tracking-tight text-navy">{result.tracking.reference}</p>
                  <p className="mt-1 text-[.8125rem] text-muted">
                    {result.tracking.origin || 'Calabar'} → {result.tracking.destination || 'Destination pending'}
                  </p>
                </div>
                <span className="border border-cyan/40 px-2.5 py-1 text-[.75rem] font-medium text-cyan">
                  {String(result.tracking.status || 'pending').replaceAll('_', ' ')}
                </span>
              </div>
              <dl className="grid border-b border-line sm:grid-cols-3">
                {[
                  ['Last updated', result.tracking.lastUpdated ? formatDate(result.tracking.lastUpdated) : '-'],
                  ['Origin', result.tracking.origin || 'Calabar'],
                  ['Destination', result.tracking.destination || '-'],
                ].map(([label, value]) => (
                  <div key={label} className="border-b border-line px-6 py-4 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0">
                    <dt className="text-[.6875rem] uppercase tracking-[.12em] text-muted">{label}</dt>
                    <dd className="mt-1 text-[.875rem] text-navy">{value}</dd>
                  </div>
                ))}
              </dl>
              <ol className="px-6 py-2">
                {(result.tracking.timeline || []).map((event, i) => (
                  <li key={`${event.created_at}-${i}`} className="flex gap-4 border-b border-line py-4 last:border-b-0">
                    <span
                      className={`mt-0.5 grid h-[1.125rem] w-[1.125rem] shrink-0 place-items-center rounded-full text-white ${
                        i === 0 ? 'bg-cyan' : 'bg-navy'
                      }`}
                    >
                      <Icon name="check" size={10} />
                    </span>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                        <p className="text-[.9375rem] font-medium capitalize text-navy">
                          {String(event.new_status || event.status || 'Update').replaceAll('_', ' ')}
                        </p>
                        <span className="font-mono text-[.6875rem] tabular-nums text-muted">{formatDate(event.created_at)}</span>
                      </div>
                      {event.notes && <p className="mt-1 text-[.8125rem] text-muted">{event.notes}</p>}
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          )}
          <div className="mt-6 rounded-[14px] border border-line bg-paper p-5 text-[.8125rem] leading-relaxed text-ink-slate">
            <span className="font-medium text-navy">Reference formats.</span> Local delivery codes start with{' '}
            <span className="font-mono text-navy">DT-CAL</span>; intercity waybills start with{' '}
            <span className="font-mono text-navy">DT-WB</span>. Need a new delivery?{' '}
            <AppLink href="/quote" navigate={navigate} className="font-medium text-cyan underline underline-offset-2">
              Get a fare estimate
            </AppLink>.
          </div>
        </div>
      </section>
    </>
  );
}

function PaymentReturn({ navigate, onLogin }) {
  const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const reference = params.get('reference') || params.get('trxref') || '';
  const [result, setResult] = useState(null);
  const [state, setState] = useState(reference ? 'loading' : 'missing');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    let live = true;
    if (!reference) {
      setState('missing');
      return () => {
        live = false;
      };
    }
    setState('loading');
    api(`/payments/verify/${encodeURIComponent(reference)}`)
      .then((data) => {
        if (live) {
          setResult(data);
          setState(
            data.status === 'under_review'
              ? 'review'
              : data.status === 'successful'
                ? 'success'
                : data.status === 'failed'
                  ? 'failed'
                  : 'error',
          );
        }
      })
      .catch((error) => {
        if (live) setState(error.status === 401 ? 'signin' : 'error');
      });
    return () => {
      live = false;
    };
  }, [reference, attempt]);

  const copy = {
    loading: ['Verifying with Paystack…', 'We are checking the provider record directly with the server.'],
    success: ['Payment verified', 'The provider confirmed your payment and DigiTrans has recorded it.'],
    review: ['Payment received - review required', 'The provider confirmed payment, and operations review is required before reconciliation completes.'],
    signin: ['Sign in to verify this payment', 'Sign in with the account that started checkout to verify and reconcile your payment.'],
    missing: ['No payment reference found', 'Return to your DigiTrans workspace to check payment status or retry checkout.'],
    failed: ['Payment was not completed', 'This payment attempt was not completed and has not been marked as paid.'],
    error: ['Payment not confirmed yet', 'The provider has not confirmed a successful payment yet. Retry shortly or open your workspace.'],
  };

  return (
    <section className="min-h-[60vh] bg-paper px-5 py-14 sm:px-8">
      <div className="mx-auto max-w-2xl">
        <p className="eyebrow">Payment update</p>
        <h1 className="display-2 mt-2">Your payment status.</h1>
        <Card className="mt-7 p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <span
              className={`grid h-12 w-12 shrink-0 place-items-center rounded-full ${
                state === 'success'
                  ? 'bg-[#edf7f1] text-success'
                  : state === 'review'
                    ? 'bg-amber-50 text-amber-700'
                    : state === 'failed' || state === 'error'
                      ? 'bg-rose-50 text-danger'
                      : 'bg-cyan/10 text-cyan'
              }`}
            >
              <Icon name={state === 'success' ? 'check' : state === 'review' ? 'clock' : state === 'error' || state === 'failed' ? 'shield' : 'wallet'} size={22} />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-semibold text-navy">{copy[state]?.[0]}</h2>
              <p className="mt-2 text-[.875rem] leading-6 text-ink-slate">{copy[state]?.[1]}</p>
              {reference && <p className="mt-3 break-all rounded-[4px] bg-paper px-3 py-2 text-[.6875rem] font-medium text-muted">Reference · {reference}</p>}
              {result?.status && <p className="mt-2 text-xs font-medium text-cyan">Status · {result.status.replaceAll('_', ' ')}</p>}
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            {state === 'signin' && (
              <Button onClick={() => onLogin(`/payment/return?reference=${encodeURIComponent(reference)}`)}>Sign in to verify</Button>
            )}
            {['error', 'missing'].includes(state) && (
              <Button variant="outline" onClick={() => setAttempt((value) => value + 1)}>
                Try verification again
              </Button>
            )}
            {['success', 'review', 'error', 'missing', 'failed'].includes(state) && (
              <Button variant={state === 'success' ? 'primary' : 'outline'} onClick={() => navigate('/workspace')}>
                Go to your workspace
              </Button>
            )}
          </div>
        </Card>
      </div>
    </section>
  );
}

function GuidesPage({ navigate }) {
  return (
    <>
      <PageHero
        eyebrow="Logistics guides"
        title="Practical guides for Calabar senders & businesses."
        lead="How local delivery pricing works, Watt Market & Marian Market Run checklists, UNICAL student drops, fragile parcel packing, and intercity waybills to Port Harcourt and Obudu."
        trail={[{ label: 'Guides' }]}
        navigate={navigate}
      />
      <section className="section bg-white">
        <div className="container-x">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {GUIDES.map((article) => (
              <article
                key={article.slug}
                className="group flex flex-col overflow-hidden rounded-[16px] border border-line bg-white transition-all duration-300 hover:shadow-panel"
              >
                <AppLink href={`/guides/${article.slug}`} navigate={navigate} className="relative block aspect-[16/10] overflow-hidden">
                  <Picture
                    src={article.image}
                    alt={article.imageAlt}
                    sizes="(max-width: 768px) 100vw, 400px"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                  />
                </AppLink>
                <div className="flex flex-1 flex-col p-5">
                  <span className="self-start rounded-full border border-line bg-paper px-2.5 py-1 text-[.6875rem] font-medium text-cyan">
                    {article.category}
                  </span>
                  <h2 className="mt-3 font-display text-[1.125rem] font-medium leading-snug tracking-tight text-navy">
                    <AppLink href={`/guides/${article.slug}`} navigate={navigate} className="transition-colors hover:text-cyan">
                      {article.title}
                    </AppLink>
                  </h2>
                  <p className="mt-2.5 flex-1 text-[.875rem] leading-relaxed text-muted">{article.excerpt}</p>
                  <div className="mt-5 flex items-center justify-between border-t border-line pt-4">
                    <span className="text-[.6875rem] text-muted">
                      {article.dateLabel} · {article.readTime}
                    </span>
                    <AppLink href={`/guides/${article.slug}`} navigate={navigate} className="inline-flex items-center gap-1.5 text-[.75rem] font-medium text-cyan">
                      Read guide
                      <Icon name="arrow" size={12} />
                    </AppLink>
                  </div>
                </div>
              </article>
            ))}
          </div>
          <div className="mt-12 rounded-[18px] border border-line bg-paper p-7 sm:p-9">
            <p className="eyebrow">Ready to move</p>
            <h2 className="display-3 mt-3">Check an estimate or track an active parcel.</h2>
            <p className="body-sm mt-2 max-w-lg">Get a route estimate in seconds or look up any DT-CAL or DT-WB tracking number.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <AppLink href="/quote" navigate={navigate} className="pill pill-navy">
                Get an estimate
                <Icon name="arrow" size={14} />
              </AppLink>
              <AppLink href="/contact" navigate={navigate} className="pill pill-line">
                Contact dispatch
              </AppLink>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function GuidePage({ guide, navigate }) {
  const more = articles.filter((item) => item.slug !== guide.slug).slice(0, 4);

  return (
    <article>
      <PageHero
        title={guide.title}
        lead={guide.excerpt}
        trail={[{ label: 'Guides', href: '/guides' }, { label: guide.category }]}
        navigate={navigate}
      >
        <div className="mt-6 text-[.75rem] text-white/55">
          {guide.dateLabel} · {guide.readTime} · DigiTrans Logistics editorial guide
        </div>
      </PageHero>
      <div className="container-x -mt-8 sm:-mt-10">
        <div className="relative aspect-[16/10] max-h-[26rem] overflow-hidden rounded-[18px] bg-paper sm:aspect-[21/9]">
          <Picture
            src={guide.image}
            alt={guide.imageAlt}
            sizes="(max-width: 1240px) 100vw, 1160px"
            loading="eager"
            className="h-full w-full object-cover"
          />
        </div>
      </div>
      <div className="section bg-white">
        <div className="container-x grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-8">
            <AnswerSummary eyebrow="Key takeaway" text={guide.answerSummary} />
            <div className="space-y-8">
              {guide.body.map((block, index) => (
                <section key={index}>
                  {block.heading && <h2 className="display-3">{block.heading}</h2>}
                  <div className={block.heading ? 'mt-3 space-y-4' : 'space-y-4'}>
                    {block.paragraphs.map((text) => (
                      <p key={text.slice(0, 24)} className="text-[1rem] leading-[1.75] text-ink-slate">
                        {text}
                      </p>
                    ))}
                  </div>
                  {block.bullets && (
                    <ul className="mt-4 space-y-2.5 border-l-2 border-cyan/30 pl-5">
                      {block.bullets.map((text) => (
                        <li key={text.slice(0, 24)} className="text-[.9375rem] leading-relaxed text-ink-slate">
                          {text}
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              ))}
            </div>
            {guide.faqs?.length > 0 && (
              <div className="mt-12 border-t border-line pt-8">
                <h2 className="display-3">Frequently asked</h2>
                <div className="mt-4 border-t border-line">
                  {guide.faqs.map((faq, idx) => (
                    <details key={faq.q} className="group border-b border-line" open={idx === 0}>
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-4 text-[.9375rem] font-medium text-navy marker:hidden">
                        {faq.q}
                        <span className="text-muted transition-transform group-open:rotate-45">
                          <Icon name="plus" size={14} />
                        </span>
                      </summary>
                      <p className="pb-5 pr-8 text-[.875rem] leading-relaxed text-ink-slate">{faq.a}</p>
                    </details>
                  ))}
                </div>
              </div>
            )}
            <div className="mt-12 flex flex-wrap items-center gap-3 border-t border-line pt-8">
              <AppLink href="/guides" navigate={navigate} className="pill pill-line pill-sm">
                <Icon name="arrow" size={13} className="rotate-180" />
                All guides
              </AppLink>
              <AppLink href="/quote" navigate={navigate} className="pill pill-navy pill-sm">
                Get an estimate
                <Icon name="arrow" size={13} />
              </AppLink>
            </div>
          </div>
          <aside className="lg:col-span-4">
            <div className="sticky top-28 rounded-[18px] border border-line bg-paper p-6">
              <p className="eyebrow">Book or estimate</p>
              <h2 className="display-3 mt-3">Check your fare before booking.</h2>
              <p className="body-sm mt-2">Preview zone estimates or sign in to book a local delivery, Market Run, or waybill.</p>
              <AppLink href="/quote" navigate={navigate} className="pill pill-navy pill-sm mt-5 w-full">
                Price my delivery
              </AppLink>
              <AppLink href="/pricing" navigate={navigate} className="pill pill-line pill-sm mt-2 w-full">
                How pricing works
              </AppLink>
            </div>
          </aside>
        </div>
      </div>
      <section className="border-t border-line bg-paper py-14">
        <div className="container-x">
          <h2 className="display-3">Keep reading</h2>
          <div className="mt-6 grid gap-5 md:grid-cols-2">
            {more.map((item) => (
              <AppLink
                key={item.slug}
                href={`/guides/${item.slug}`}
                navigate={navigate}
                className="group flex items-center gap-4 rounded-[14px] border border-line bg-white p-4 text-left transition-colors hover:border-line-strong"
              >
                <span className="relative h-20 w-20 shrink-0 overflow-hidden rounded-[10px]">
                  <Picture src={item.image} alt="" sizes="80px" className="h-full w-full object-cover" />
                </span>
                <span className="min-w-0">
                  <span className="block text-[.6875rem] text-muted">{item.category}</span>
                  <span className="mt-1 block text-[.9375rem] font-medium leading-snug text-navy group-hover:text-cyan">{item.title}</span>
                </span>
              </AppLink>
            ))}
          </div>
        </div>
      </section>
    </article>
  );
}

function LegalPage({ page, navigate }) {
  const data = legalPages[page] || {
    eyebrow: 'Important information',
    title: 'DigiTrans policy',
    lead: 'More information about our services and terms.',
    sections: [],
  };
  return (
    <>
      <PageHero eyebrow={data.eyebrow} title={data.title} lead={data.lead} trail={[{ label: data.title }]} navigate={navigate} />
      <section className="section bg-white">
        <div className="container-x max-w-3xl">
          <div className="space-y-8">
            {data.sections.map(([heading, body]) => (
              <section key={heading}>
                <h2 className="display-3">{heading}</h2>
                <p className="body-sm mt-3">{body}</p>
              </section>
            ))}
          </div>
          <div className="mt-9 border-l-2 border-cyan bg-paper p-5 text-[.8125rem] leading-relaxed text-ink-slate">
            <strong className="text-navy">Please note:</strong> This page summarises operational guidelines; individual service rules shown during booking or onboarding apply. Contact {SITE.email} for clarification.
          </div>
          <AppLink href="/contact" navigate={navigate} className="pill pill-navy pill-sm mt-7">
            Ask a question
            <Icon name="support" size={14} />
          </AppLink>
        </div>
      </section>
    </>
  );
}

function SpecialInfoPage({ page, navigate, book }) {
  const rider = page === '/rider-registration';
  const title = rider ? 'Ride with DigiTrans in Calabar.' : 'Investor disclosures & onboarding information.';
  const lead = rider
    ? 'Join our local rider network in Calabar with transparent identity, vehicle, and guarantor verification.'
    : 'Investment opportunities require internal verification and approval. Projected figures are estimates only and never guaranteed payouts.';
  const bullets = rider
    ? [
        'Submit identity, vehicle details, and guarantor information.',
        'Review and accept the current DigiTrans rider agreement.',
        'Track verification review and assignment activity inside your rider workspace.',
      ]
    : [
        'Review investment agreement and risk disclosures carefully before applying.',
        'Investor identity verification is required before participation.',
        'Funding is verified through server-confirmed payment verification.',
        'Projected figures are estimates—not actual earnings or guaranteed payouts.',
      ];

  return (
    <>
      <PageHero
        eyebrow={rider ? 'Ride with DigiTrans' : 'Investment information'}
        title={title}
        lead={lead}
        trail={[{ label: rider ? 'Rider registration' : 'Investment information' }]}
        image={rider ? '/images/hero-courier.jpg' : '/images/vendor.jpg'}
        imageAlt={rider ? 'DigiTrans courier in Calabar' : 'DigiTrans business partner'}
        navigate={navigate}
      />
      <section className="section bg-white">
        <div className="container-x grid gap-10 lg:grid-cols-[1fr_.8fr] lg:items-start">
          <div>
            <p className="eyebrow">{rider ? 'Onboarding' : 'Important disclosure'}</p>
            <h2 className="display-2 mt-3">{rider ? 'Clear steps to start riding.' : 'Review risks carefully before applying.'}</h2>
            <ul className="mt-7 space-y-4">
              {bullets.map((text) => (
                <li key={text} className="flex gap-3 text-[.9375rem] leading-6 text-ink-slate">
                  <Icon name="check" size={17} className="mt-1 shrink-0 text-cyan" />
                  {text}
                </li>
              ))}
            </ul>
            {!rider && (
              <p className="mt-6 text-[.8125rem] leading-6 text-muted">
                Investment involves risk. Review our{' '}
                <AppLink href="/investment-risk" navigate={navigate} className="underline decoration-line-strong text-navy">
                  investment risk disclosure
                </AppLink>{' '}
                before proceeding.
              </p>
            )}
          </div>
          <Card className="p-6 sm:p-8">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-cyan/10 text-cyan">
              <Icon name={rider ? 'bike' : 'chart'} size={22} />
            </span>
            <h3 className="mt-5 font-display text-xl font-semibold text-navy">
              {rider ? 'Ready to register?' : 'Open the investor workspace'}
            </h3>
            <p className="mt-2 text-[.875rem] leading-6 text-ink-slate">
              {rider
                ? 'Create a Rider account to submit your application and verification documents privately.'
                : 'Sign in or register an Investor profile to review approved opportunities and disclosures.'}
            </p>
            <button
              type="button"
              onClick={() => book(rider ? '/register?role=rider' : '/register?role=investor')}
              className="pill pill-navy mt-6"
            >
              {rider ? 'Start rider registration' : 'Continue to investor sign-up'}
              <Icon name="arrow" size={14} />
            </button>
          </Card>
        </div>
      </section>
    </>
  );
}

function NotFound({ navigate }) {
  return (
    <>
      <PageHero
        eyebrow="404 · Page not found"
        title="That page isn’t at this address."
        lead="The route may have moved or the URL may contain a typo. Return to DigiTrans home, browse our services, or track a delivery."
        trail={[{ label: 'Not found' }]}
        navigate={navigate}
      />
      <section className="section-tight bg-white">
        <div className="container-x flex flex-wrap gap-3">
          <AppLink href="/" navigate={navigate} className="pill pill-navy">
            Back to home
            <Icon name="arrow" size={14} />
          </AppLink>
          <AppLink href="/services" navigate={navigate} className="pill pill-line">
            Browse services
          </AppLink>
          <AppLink href="/track" navigate={navigate} className="pill pill-line">
            Track parcel
          </AppLink>
          <AppLink href="/contact" navigate={navigate} className="pill pill-line">
            Contact support
          </AppLink>
        </div>
      </section>
    </>
  );
}

export default function PublicPages({ page, content, navigate, onLogin, user, book }) {
  const rawClean = page.replace(/\/+$/, '') || '/';
  const normalized = LEGACY_REDIRECT_MAP[rawClean] || rawClean;

  if (normalized === '/') return <HomePage content={content} navigate={navigate} book={book} />;
  if (normalized === '/services') return <ServiceIndex navigate={navigate} />;
  if (normalized === '/how-it-works') return <HowItWorksPage navigate={navigate} />;
  if (normalized === '/pricing') return <PricingPage navigate={navigate} book={book} />;
  if (normalized === '/coverage') return <CoveragePage navigate={navigate} />;
  if (normalized === '/about') return <AboutPage navigate={navigate} />;
  if (normalized === '/contact') return <ContactPage content={content} navigate={navigate} />;
  if (normalized === '/quote') return <QuotePage navigate={navigate} book={book} content={content} />;
  if (normalized === '/track') return <TrackPage navigate={navigate} content={content} />;
  if (normalized === '/payment/return') return <PaymentReturn navigate={navigate} onLogin={onLogin} />;
  if (normalized === '/guides') return <GuidesPage navigate={navigate} />;

  if (normalized.startsWith('/guides/')) {
    const guide = GUIDE_BY_SLUG[normalized.slice('/guides/'.length)];
    return guide ? <GuidePage guide={guide} navigate={navigate} /> : <NotFound navigate={navigate} />;
  }
  if (normalized.startsWith('/services/')) {
    const service = SERVICE_BY_SLUG[normalized.slice('/services/'.length)];
    return service ? <ServiceDetail service={service} navigate={navigate} book={book} settings={content?.settings} /> : <NotFound navigate={navigate} />;
  }
  if (normalized.startsWith('/cities/')) {
    const city = CITY_BY_SLUG[normalized.slice('/cities/'.length)];
    return city ? <CityPage city={city} navigate={navigate} book={book} /> : <NotFound navigate={navigate} />;
  }
  if (normalized.startsWith('/routes/')) {
    const route = ROUTE_BY_SLUG[normalized.slice('/routes/'.length)];
    return route ? <RoutePage route={route} navigate={navigate} book={book} /> : <NotFound navigate={navigate} />;
  }
  if (normalized === '/faq') {
    return (
      <>
        <PageHero
          eyebrow="Help centre"
          title="Frequently asked questions."
          lead="Direct answers about Calabar delivery coverage, fare calculation, Market Runs, UNICAL student rates, and intercity waybills."
          trail={[{ label: 'FAQ' }]}
          navigate={navigate}
        />
        <FaqSection
          items={content?.faqs?.length ? content.faqs : defaultFaqs}
          title="Questions & answers"
          navigate={navigate}
          settings={content?.settings}
        />
      </>
    );
  }
  if (legalPages[normalized]) return <LegalPage page={normalized} navigate={navigate} />;
  if (normalized === '/rider-registration' || normalized === '/investment-information') {
    return <SpecialInfoPage page={normalized} navigate={navigate} book={book} />;
  }
  return <NotFound navigate={navigate} />;
}
