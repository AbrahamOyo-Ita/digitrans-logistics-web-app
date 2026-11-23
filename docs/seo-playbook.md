# DigiTrans Logistics — SEO, GEO & Content Playbook

## 1. Canonical Domain & URL Architecture
- **Canonical origin:** `https://www.digitransdelivery.com` (aligned with Supabase Auth `site_url`, Paystack callbacks, Resend links, and DNS records in `docs/production-dns-setup.md`).
- **Apex redirect:** `digitransdelivery.com` issues a permanent `301` redirect to `https://www.digitransdelivery.com` inside `vercel.json`.
- **Clean URLs & HTTP 404:** `vercel.json` uses `"cleanUrls": true`, `"trailingSlash": false`, explicit rewrites to `/app-shell.html` for auth/workspace paths, and **no catch-all rewrite**, ensuring unknown URLs return a real HTTP `404` rendered by `dist/404.html`.
- **Preview & app protection:** `.vercel.app` hosts and authenticated/auth routes send `X-Robots-Tag: noindex, nofollow` headers plus `<meta name="robots" content="noindex, nofollow">`.

## 2. Ground-Truth Facts vs. `[CONFIRM]` Placeholders
- Confirmed facts live in `shared/site.js` (`SITE`), `client/src/config/site.js`, and Supabase `public.system_settings`:
  - **Brand:** `DigiTrans Logistics` (also referenced as `Digitrans`, `DigiTrans Delivery & Logistics`)
  - **Headquarters:** `No 2, Ituebange Street, Nyahasang, Atimbo, Calabar Municipal, Cross River State, Nigeria`
  - **Official Email:** `digitransdeliveryandlogistics@gmail.com`
  - **Confirmed Markets & Corridors:** Local Calabar (`12` zones) and intercity waybills between `Calabar ↔ Port Harcourt` and `Calabar ↔ Obudu`.
- Any unconfirmed operational detail (public telephone/WhatsApp line, counter operating hours, and example tariff numbers) is stored in `PLACEHOLDERS` and labelled `[CONFIRM]` until confirmed and updated in `public.system_settings` / `shared/site.js`.

## 3. Build, Media & Static Prerendering Pipeline
1. **Optimize images & generate `1200x630` OG share images:**
   ```bash
   npm run build:images
   ```
   Generates responsive `-640w.webp`, `-1200w.webp`, `.webp`, `public/images/og/og-*.jpg`, and updates `shared/mediaManifest.js` with exact `width`/`height` dimensions.
2. **Build client bundle, SSR prerender all public routes, Markdown mirrors & crawlers:**
   ```bash
   npm run build
   ```
   Outputs:
   - Static HTML for all 39 canonical public routes under `dist/*.html` + `dist/404.html` + `dist/app-shell.html`
   - Clean Markdown mirrors (`dist/*.md`) linked via `<link rel="alternate" type="text/markdown">`
   - `dist/robots.txt`, `dist/sitemap.xml`, `dist/llms.txt`, and `dist/llms-full.txt`
3. **Verify tests before deploy:**
   ```bash
   npm test
   ```

## 4. Structured Data (`JSON-LD`) Governance
- `shared/jsonLd.js` emits a single `@graph` per indexable page (`Organization`, `LocalBusiness` / `CourierService`, `WebSite`, `WebPage`, `BreadcrumbList`, plus `Service`, `FAQPage`, or `BlogPosting` matching visible page content 1:1).
- Never add `aggregateRating`, `review`, `openingHoursSpecification`, `telephone`, or `geo` coordinates unless verified on the live site and matching visible content.

## 5. Measurement, Search Console & Post-Deploy Checklist
1. **Google Search Console:** Verify `https://www.digitransdelivery.com` (domain property via DNS TXT), submit `https://www.digitransdelivery.com/sitemap.xml`, and inspect `/` and `/services/local-delivery`.
2. **Google Business Profile:** Set business name to `DigiTrans Logistics`, primary category `Courier service` / `Logistics service`, address to `No 2, Ituebange Street, Nyahasang, Atimbo, Calabar Municipal, Cross River State, Nigeria`, and website URL to `https://www.digitransdelivery.com/`.
3. **Bing / IndexNow:** Set `INDEXNOW_KEY` in Vercel environment variables, rebuild, verify `https://www.digitransdelivery.com/<INDEXNOW_KEY>.txt`, and run `npm run indexnow` after releases.
4. **Analytics:** Conversion events (`booking_started`, `booking_completed`, `waybill_booked`, `contact_click`, `whatsapp_click`, `call_click`) emit via `client/src/lib/analytics.js` respecting DNT and user consent.
