import React, { useEffect, useState } from 'react';
import AppLink from '../components/AppLink';
import Icon from '../components/Icon';
import Picture from '../components/Picture';
import ScrollReveal from '../components/ScrollReveal';
import { Select } from '../components/UI';
import { trackEvent } from '../lib/analytics';
import { articles, serviceScenarios, services, zones } from './publicContent';

const heroSlides = [
  {
    src: '/images/street-wide.jpg',
    alt: 'A DigiTrans delivery rider on a cargo bike travelling through Calabar at dusk',
    caption: 'Local dispatch, built for Calabar',
    position: 'center 52%',
  },
  {
    src: '/images/hero-courier.jpg',
    alt: 'A Calabar courier with a parcel-ready delivery bike',
    caption: 'Door-to-door riders across 12 zones',
    position: '52% 58%',
  },
  {
    src: '/images/depot.jpg',
    alt: 'DigiTrans riders preparing local and intercity parcels at the dispatch depot',
    caption: 'Calabar dispatch & parcel intake',
    position: 'center 50%',
  },
  {
    src: '/images/market-run.jpg',
    alt: 'Fresh foodstuff and groceries prepared for a Calabar Market Run delivery',
    caption: 'Watt & Marian Market Runs',
    position: 'center 52%',
  },
  {
    src: '/images/handover.jpg',
    alt: 'A DigiTrans courier completing a tracked parcel handover',
    caption: 'Every delivery tracked by reference',
    position: 'center 50%',
  },
];

function DispatchPanel({ navigate }) {
  const [tab, setTab] = useState('track');
  const [reference, setReference] = useState('');
  const [origin, setOrigin] = useState('marian');
  const [destination, setDestination] = useState('unical');

  const submitTracking = (e) => {
    e.preventDefault();
    const value = reference.trim().toUpperCase();
    navigate(value ? `/track?ref=${encodeURIComponent(value)}` : '/track');
  };

  const planDelivery = (e) => {
    e.preventDefault();
    trackEvent('booking_started', { source: 'hero_panel', origin, destination });
    const query = new URLSearchParams({ from: origin, to: destination });
    navigate(`/quote?${query.toString()}`);
  };

  const handleTabKeyDown = (e) => {
    if (!['ArrowLeft', 'ArrowRight'].includes(e.key)) return;
    const next = e.currentTarget.querySelector('[aria-selected="true"]')?.id === 'dispatch-tab-track' ? 'quote' : 'track';
    e.preventDefault();
    setTab(next);
    document.getElementById(`dispatch-tab-${next}`)?.focus();
  };

  return (
    <aside className="dispatch-panel" aria-label="Quick delivery tools">
      <div className="dispatch-panel-topline">
        <span className="dispatch-live">
          <span />
          Dispatch desk
        </span>
        <span className="dispatch-secure">
          <Icon name="shield" size={13} />
          Tracked &amp; verified
        </span>
      </div>
      <div className="dispatch-panel-title">
        <div>
          <p>Moving something?</p>
          <h2>Start right here.</h2>
        </div>
        <span className="dispatch-mark">
          <Icon name="route" size={21} />
        </span>
      </div>
      <div className="dispatch-tabs" role="tablist" aria-label="Quick actions" onKeyDown={handleTabKeyDown}>
        <button
          id="dispatch-tab-track"
          type="button"
          role="tab"
          aria-controls="dispatch-panel-content"
          aria-selected={tab === 'track'}
          tabIndex={tab === 'track' ? 0 : -1}
          className={tab === 'track' ? 'is-active' : ''}
          onClick={() => setTab('track')}
        >
          <Icon name="search" size={14} />
          Track a parcel
        </button>
        <button
          id="dispatch-tab-quote"
          type="button"
          role="tab"
          aria-controls="dispatch-panel-content"
          aria-selected={tab === 'quote'}
          tabIndex={tab === 'quote' ? 0 : -1}
          className={tab === 'quote' ? 'is-active' : ''}
          onClick={() => setTab('quote')}
        >
          <Icon name="pin" size={14} />
          Plan a route
        </button>
      </div>
      <div id="dispatch-panel-content" role="tabpanel" aria-labelledby={`dispatch-tab-${tab}`} tabIndex={0}>
        {tab === 'track' ? (
          <form className="dispatch-form" action="/track" onSubmit={submitTracking}>
            <label className="dispatch-label" htmlFor="hero-tracking-ref">
              Tracking reference
            </label>
            <div className="dispatch-input-row">
              <Icon name="box" size={17} />
              <input
                id="hero-tracking-ref"
                name="ref"
                autoComplete="off"
                spellCheck="false"
                maxLength={64}
                placeholder="DT-CAL-0000-0000"
                value={reference}
                onChange={(e) => setReference(e.target.value.toUpperCase())}
              />
              <button type="submit" aria-label="Track your parcel">
                <Icon name="arrow" size={17} />
              </button>
            </div>
            <p className="dispatch-hint">Track DT-CAL deliveries &amp; DT-WB waybills.</p>
          </form>
        ) : (
          <form className="dispatch-form" onSubmit={planDelivery}>
            <label className="dispatch-label" htmlFor="hero-route-origin">
              Pickup &amp; destination
            </label>
            <div className="dispatch-route-fields">
              <label className="dispatch-select">
                <Icon name="pin" size={15} />
                <Select
                  id="hero-route-origin"
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  className="dispatch-custom-select"
                >
                  {zones.map((zone) => (
                    <option key={zone.id} value={zone.id}>
                      {zone.name}
                    </option>
                  ))}
                </Select>
              </label>
              <span className="dispatch-route-separator" aria-hidden="true">
                <Icon name="arrow" size={14} />
              </span>
              <label className="dispatch-select">
                <Icon name="globe" size={15} />
                <Select
                  aria-label="Drop-off zone"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="dispatch-custom-select"
                >
                  {zones.map((zone) => (
                    <option key={zone.id} value={zone.id}>
                      {zone.name}
                    </option>
                  ))}
                </Select>
              </label>
            </div>
            <button className="dispatch-submit" type="submit">
              See my estimate
              <Icon name="arrow" size={15} />
            </button>
          </form>
        )}
      </div>
      <div className="dispatch-route-art" aria-hidden="true">
        <span className="dispatch-route-node" />
        <span className="dispatch-route-dash" />
        <span className="dispatch-route-node is-end" />
        <span className="dispatch-route-caption">Calabar, Cross River</span>
        <span className="dispatch-route-estimate">12 local zones</span>
      </div>
    </aside>
  );
}

function HomePage({ content, navigate }) {
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [slideIndex, setSlideIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [hasFocus, setHasFocus] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);

  const scenario = serviceScenarios[scenarioIndex % serviceScenarios.length];
  const featuredServices = services;
  const moveScenario = (direction) =>
    setScenarioIndex((index) => (index + direction + serviceScenarios.length) % serviceScenarios.length);
  const announcement = content?.banners?.[0];

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const query = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!query) return undefined;
    const update = () => setPrefersReducedMotion(query.matches);
    update();
    query.addEventListener?.('change', update);
    return () => query.removeEventListener?.('change', update);
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return undefined;
    const update = () => setPageVisible(!document.hidden);
    update();
    document.addEventListener('visibilitychange', update);
    return () => document.removeEventListener('visibilitychange', update);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    if (isPaused || isHovering || hasFocus || prefersReducedMotion || !pageVisible) return undefined;
    const timer = window.setInterval(() => setSlideIndex((index) => (index + 1) % heroSlides.length), 5000);
    return () => window.clearInterval(timer);
  }, [isPaused, isHovering, hasFocus, prefersReducedMotion, pageVisible, slideIndex]);

  return (
    <section className="home-stage">
      <div className="home-stage-atmosphere" aria-hidden="true" />
      <div className="home-shell">
        <section
          className="home-hero"
          role="region"
          aria-roledescription="carousel"
          aria-label="DigiTrans delivery services"
          aria-labelledby="home-title"
          onFocusCapture={() => setHasFocus(true)}
          onBlurCapture={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) setHasFocus(false);
          }}
        >
          <div className="home-hero-photos">
            {heroSlides.map((slide, index) => (
              <Picture
                key={slide.src}
                src={slide.src}
                alt={slide.alt}
                sizes="100vw"
                ariaHidden={index !== slideIndex}
                className={`home-hero-photo ${index === slideIndex ? 'is-active' : ''}`}
                style={{ objectPosition: slide.position }}
                fetchPriority={index === 0 ? 'high' : undefined}
                loading={index === 0 ? 'eager' : 'lazy'}
                decoding={index === 0 ? 'sync' : 'async'}
              />
            ))}
          </div>
          <div className="home-hero-shade" aria-hidden="true" />
          <div className="home-hero-content">
            <div className="home-hero-copy">
              <h1 id="home-title">
                Calabar moves.
                <br />
                <span>We keep it moving.</span>
              </h1>
              <p className="home-hero-lede">
                DigiTrans Logistics is a Calabar delivery and intercity waybill company offering same-day local dispatch,
                Watt &amp; Marian Market Runs, verified UNICAL student rates, and tracked parcels between Calabar, Port
                Harcourt, and Obudu.
              </p>
              <div className="home-hero-actions">
                <AppLink
                  href="/quote"
                  navigate={navigate}
                  onClick={() => trackEvent('booking_started', { source: 'hero_cta' })}
                  className="home-button home-button-primary"
                >
                  Get a delivery quote
                  <Icon name="arrow" size={16} />
                </AppLink>
                <AppLink href="/services" navigate={navigate} className="home-button home-button-quiet">
                  Explore our services
                  <Icon name="chevron" size={14} />
                </AppLink>
              </div>
            </div>
            <ScrollReveal className="home-dispatch-reveal" delay={120}>
              <DispatchPanel navigate={navigate} />
            </ScrollReveal>
          </div>
          <div className="home-hero-bottom">
            <div className="home-hero-local-note">
              <span className="home-hero-local-icon">
                <Icon name="pin" size={15} />
              </span>
              <span>
                <strong>Nyahasang, Atimbo · Calabar</strong>
                <small>Local zones &amp; tracked intercity corridors.</small>
              </span>
            </div>
            <div className="home-carousel" onMouseEnter={() => setIsHovering(true)} onMouseLeave={() => setIsHovering(false)}>
              <div className="home-carousel-caption">
                <span className="home-carousel-count">
                  {String(slideIndex + 1).padStart(2, '0')}
                  <i>/</i>
                  {String(heroSlides.length).padStart(2, '0')}
                </span>
                <span className="home-carousel-label">{heroSlides[slideIndex].caption}</span>
              </div>
              <div className="home-carousel-controls" role="group" aria-label="Hero background photo controls">
                <div className="home-carousel-dots">
                  {heroSlides.map((slide, index) => (
                    <button
                      key={slide.src}
                      type="button"
                      className={index === slideIndex ? 'is-active' : ''}
                      aria-label={`Show photo ${index + 1}: ${slide.caption}`}
                      aria-pressed={index === slideIndex}
                      onClick={() => setSlideIndex(index)}
                    >
                      <span />
                    </button>
                  ))}
                </div>
                {!prefersReducedMotion && (
                  <button
                    type="button"
                    className="home-carousel-toggle"
                    aria-label={isPaused ? 'Resume background photos' : 'Pause background photos'}
                    aria-pressed={isPaused}
                    onClick={() => {
                      setIsPaused((value) => !value);
                      setHasFocus(false);
                    }}
                  >
                    <span aria-hidden="true" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        <div className="home-trust-strip">
          <div className="home-trust-intro">
            <span>Built around your day</span>
            <p>Upfront fares, verified workflows, and live references.</p>
          </div>
          <div className="home-trust-list">
            <span>
              <Icon name="bike" size={17} />
              12 Calabar delivery zones
            </span>
            <span>
              <Icon name="spark" size={17} />
              Fares calculated upfront
            </span>
            <span>
              <Icon name="route" size={17} />
              Calabar, Port Harcourt &amp; Obudu
            </span>
            <span>
              <Icon name="box" size={17} />
              DT-CAL &amp; DT-WB live tracking
            </span>
          </div>
        </div>

        {announcement && (
          announcement.link ? (
            <AppLink href={announcement.link} navigate={navigate} className="home-announcement">
              <span className="home-announcement-label">Dispatch note</span>
              <span className="home-announcement-title">{announcement.heading}</span>
              {announcement.description && <span className="home-announcement-description">{announcement.description}</span>}
              <Icon name="arrow" size={15} />
            </AppLink>
          ) : (
            <div className="home-announcement">
              <span className="home-announcement-label">Dispatch note</span>
              <span className="home-announcement-title">{announcement.heading}</span>
              {announcement.description && <span className="home-announcement-description">{announcement.description}</span>}
            </div>
          )
        )}

        <section className="home-story-section">
          <div className="home-section-wrap home-story-grid">
            <ScrollReveal className="home-story-copy">
              <p className="home-eyebrow">More than a delivery app</p>
              <h2 className="home-section-title">
                A little more time
                <br />
                <em>for what matters.</em>
              </h2>
              <p className="home-section-lede">
                We connect riders, market shoppers, and intercity parcel dispatch on one platform—so households, UNICAL
                students, and Calabar businesses can send parcels and approve shopping lists without guessing the cost.
              </p>
              <AppLink href="/about" navigate={navigate} className="home-text-link">
                Meet DigiTrans in Calabar
                <Icon name="arrow" size={15} />
              </AppLink>
              <div className="home-story-note">
                <span className="home-note-icon">
                  <Icon name="check" size={16} />
                </span>
                <p>
                  <strong>Calabar Municipal operations office.</strong>
                  <br />
                  No 2, Ituebange Street, Nyahasang, Atimbo, Calabar.
                </p>
              </div>
            </ScrollReveal>
            <ScrollReveal className="home-photo-collage" delay={100}>
              <div className="home-photo-tall">
                <Picture
                  src="/images/hero-courier.jpg"
                  alt="A DigiTrans rider ready to handle a local delivery across Calabar"
                  sizes="(max-width: 768px) 100vw, 400px"
                />
                <span className="home-photo-caption">
                  <Icon name="bike" size={14} />
                  Your city. Your riders.
                </span>
              </div>
              <div className="home-photo-stack">
                <div className="home-photo-short">
                  <Picture
                    src="/images/depot.jpg"
                    alt="DigiTrans team preparing parcels at the Calabar dispatch depot"
                    sizes="(max-width: 768px) 100vw, 320px"
                  />
                  <span className="home-photo-overlay">Atimbo dispatch</span>
                </div>
                <div className="home-photo-short home-photo-market">
                  <Picture
                    src="/images/market-run.jpg"
                    alt="Fresh market foodstuff organized for a Calabar Market Run"
                    sizes="(max-width: 768px) 100vw, 320px"
                  />
                  <span className="home-photo-overlay">Market Runs, approved first</span>
                </div>
              </div>
              <div className="home-floating-tag">
                <span>
                  <Icon name="route" size={18} />
                </span>
                <div>
                  <b>One connected journey</b>
                  <small>Quote · confirm · track</small>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>

        <section className="home-services-section">
          <div className="home-section-wrap">
            <ScrollReveal className="home-section-heading">
              <div>
                <p className="home-eyebrow">Your delivery, your way</p>
                <h2 className="home-section-title">
                  Six ways to move.
                  <br />
                  <em>One local platform.</em>
                </h2>
              </div>
              <p className="home-section-lede">
                Choose the service built for your trip—from local Calabar drops and Market Runs to Port Harcourt and Obudu
                waybills.
              </p>
            </ScrollReveal>
            <div className="home-services-grid">
              {featuredServices.map((service, index) => (
                <ScrollReveal key={service.slug} className="home-service-reveal" delay={Math.min(index * 60, 300)}>
                  <AppLink href={`/services/${service.slug}`} navigate={navigate} className="home-service-card">
                    <div className="home-service-image">
                      <Picture
                        src={service.image}
                        alt={service.imageAlt || service.name}
                        sizes="(max-width: 768px) 100vw, 400px"
                      />
                      <span className="home-service-number">0{index + 1}</span>
                      <span className="home-service-price">{service.priceFrom}</span>
                      <span className="home-service-image-glow" />
                    </div>
                    <div className="home-service-details">
                      <span className="home-service-icon">
                        <Icon name={service.icon} size={18} />
                      </span>
                      <div className="home-service-title-group">
                        <h3>{service.shortName}</h3>
                        <p>{service.short}</p>
                      </div>
                      <span className="home-service-arrow">
                        <Icon name="arrow" size={15} />
                      </span>
                    </div>
                    <div className="home-service-footer">
                      <span>{service.turnaround}</span>
                      <span>Explore service</span>
                    </div>
                  </AppLink>
                </ScrollReveal>
              ))}
            </div>
            <div className="home-services-foot">
              <span>
                <Icon name="shield" size={15} />
                Server-calculated pricing shown before booking confirmation.
              </span>
              <AppLink href="/pricing" navigate={navigate}>
                See how pricing works
                <Icon name="arrow" size={14} />
              </AppLink>
            </div>
          </div>
        </section>

        <section className="home-operations-section">
          <div className="home-operations-photo">
            <Picture
              src="/images/depot.jpg"
              alt="DigiTrans delivery hub and riders in Calabar, Cross River State"
              sizes="(max-width: 1024px) 100vw, 680px"
            />
            <div className="home-operations-photo-shade" />
            <div className="home-depot-label">
              <span className="home-live-dot" />
              Nyahasang, Atimbo · Calabar
            </div>
          </div>
          <div className="home-operations-copy">
            <p className="home-eyebrow home-eyebrow-light">Calabar &amp; Intercity Coverage</p>
            <h2 className="home-section-title">
              Rooted in Calabar.
              <br />
              <em>Connected beyond.</em>
            </h2>
            <p className="home-operations-lede">
              Explore our 12 Calabar delivery zones—including UNICAL, Marian, State Housing, Atimbo, and Watt Market—plus
              tracked intercity waybills connecting Calabar, Port Harcourt, and Obudu.
            </p>
            <div className="home-proof-grid">
              <div>
                <b>{zones.length.toString().padStart(2, '0')}</b>
                <span>Calabar local zones</span>
              </div>
              <div>
                <b>03</b>
                <span>Core cities linked</span>
              </div>
              <div>
                <b>{featuredServices.length.toString().padStart(2, '0')}</b>
                <span>Dedicated services</span>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-4">
              <AppLink href="/cities/calabar" navigate={navigate} className="home-text-link home-text-link-light">
                Calabar hub
                <Icon name="arrow" size={15} />
              </AppLink>
              <AppLink href="/routes/calabar-to-port-harcourt" navigate={navigate} className="home-text-link home-text-link-light">
                Calabar ↔ Port Harcourt
                <Icon name="arrow" size={15} />
              </AppLink>
              <AppLink href="/routes/calabar-to-obudu" navigate={navigate} className="home-text-link home-text-link-light">
                Calabar ↔ Obudu
                <Icon name="arrow" size={15} />
              </AppLink>
            </div>
          </div>
        </section>

        <section className="home-testimonial-section">
          <div className="home-section-wrap home-testimonial-grid">
            <ScrollReveal>
              <p className="home-eyebrow">Built for every move</p>
              <h2 className="home-section-title">
                Practical workflows
                <br />
                <em>from quote to drop.</em>
              </h2>
              <p className="home-section-lede">
                Every service follows an auditable workflow—from Market Run budget approvals to intake weight checks and
                public tracking references.
              </p>
              <div className="home-review-controls">
                <button type="button" onClick={() => moveScenario(-1)} aria-label="Previous workflow example">
                  <Icon name="arrow" size={16} className="rotate-180" />
                </button>
                <span>
                  {String(scenarioIndex + 1).padStart(2, '0')} <i /> {String(serviceScenarios.length).padStart(2, '0')}
                </span>
                <button type="button" onClick={() => moveScenario(1)} aria-label="Next workflow example">
                  <Icon name="arrow" size={16} />
                </button>
              </div>
              <AppLink href="/how-it-works" navigate={navigate} className="home-text-link mt-6">
                See how every service works
                <Icon name="arrow" size={15} />
              </AppLink>
            </ScrollReveal>
            <ScrollReveal className="home-quote-card" delay={80}>
              <div className="home-quote-mark">0{scenarioIndex + 1}</div>
              <blockquote key={scenario.title} aria-live="polite">
                {scenario.summary}
              </blockquote>
              <div className="home-quote-footer">
                <div className="home-quote-avatar">
                  <Picture src="/images/rider-portrait.jpg" alt="" sizes="42px" />
                </div>
                <div>
                  <b>{scenario.title}</b>
                  <span>{scenario.persona}</span>
                </div>
                <span className="home-quote-detail">{scenario.tag}</span>
              </div>
            </ScrollReveal>
          </div>
        </section>

        <section className="home-insights-section">
          <div className="home-section-wrap">
            <ScrollReveal className="home-insights-heading">
              <div>
                <p className="home-eyebrow">Logistics guides</p>
                <h2 className="home-section-title">Practical guides for Calabar senders.</h2>
              </div>
              <AppLink href="/guides" navigate={navigate} className="home-text-link">
                All guides
                <Icon name="arrow" size={14} />
              </AppLink>
            </ScrollReveal>
            <div className="home-insights-grid">
              {articles.slice(0, 2).map((article, index) => (
                <ScrollReveal key={article.slug} className="home-insight-reveal" delay={index * 90}>
                  <article className="home-insight-card">
                    <Picture
                      src={article.image}
                      alt={article.imageAlt}
                      sizes="(max-width: 768px) 100vw, 300px"
                    />
                    <div>
                      <span>
                        {article.category} <i /> {article.readTime}
                      </span>
                      <h3>{article.title}</h3>
                      <p>{article.excerpt}</p>
                      <AppLink href={`/guides/${article.slug}`} navigate={navigate}>
                        Read guide
                        <Icon name="arrow" size={14} />
                      </AppLink>
                    </div>
                  </article>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        <section className="home-bottom-cta">
          <div className="home-bottom-cta-image">
            <Picture
              src="/images/street-wide.jpg"
              alt="A DigiTrans rider moving through Calabar at dusk"
              sizes="100vw"
            />
          </div>
          <div className="home-bottom-cta-shade" />
          <div className="home-bottom-cta-content">
            <p className="home-eyebrow home-eyebrow-light">Ready to send something?</p>
            <h2>
              Start a tracked
              <br />
              <em>Calabar move.</em>
            </h2>
            <p>Check your planning estimate or message our dispatch team directly.</p>
            <div>
              <AppLink
                href="/quote"
                navigate={navigate}
                onClick={() => trackEvent('booking_started', { source: 'bottom_cta' })}
                className="home-button home-button-primary"
              >
                Get a delivery quote
                <Icon name="arrow" size={15} />
              </AppLink>
              <AppLink
                href="/contact"
                navigate={navigate}
                onClick={() => trackEvent('contact_click', { source: 'bottom_cta' })}
                className="home-button home-button-quiet"
              >
                Talk to dispatch
              </AppLink>
            </div>
          </div>
        </section>
        <div className="home-shell-end">
          <span>DigiTrans Logistics</span>
          <span>No 2, Ituebange Street, Nyahasang, Atimbo · Calabar</span>
          <span>digitransdeliveryandlogistics@gmail.com</span>
        </div>
      </div>
    </section>
  );
}

export default HomePage;
