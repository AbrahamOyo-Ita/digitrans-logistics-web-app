# DigiTrans Logistics — Web App

Public marketing site (Milestone 1) for **DigiTrans Logistics**, a delivery, market-run and waybill company operating in Calabar, Cross River State, Nigeria.

Built with **Next.js 16 (App Router) + TypeScript + Tailwind CSS v4**.

---

## Running locally

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
npm start        # serve the production build
npm run typecheck
```

## What's included

| Route | Purpose |
| --- | --- |
| `/` | Home: hero with live quote widget, services, tracking preview, pricing, coverage map, testimonials, FAQ |
| `/services` | Service + tariff comparison |
| `/services/[slug]` | Six detail pages (standard, market runs, waybills, business/vendor, student, scheduled) |
| `/quote` | Full booking builder with itemised fare breakdown |
| `/track` | Tracking lookup with a status timeline |
| `/about` | Company story, operating model, milestones, careers/vendor/rider CTAs |
| `/contact` | Support channels, vendor + rider onboarding, depot map, FAQs, privacy/terms |

`/sitemap.xml` and `/robots.txt` are generated from `lib/content.ts`.

## Pricing engine (`lib/pricing.ts`)

Implements the PRD's hybrid pricing model in integer Naira:

- **Standard** — `base (₦500) + distance × ₦250/km`, minimum fare ₦1,000, zone fallback when a landmark has no GPS.
- **Student** — flat ₦500 for verified students on campus zones (standard rate until verification).
- **Vendor** — 10% contract discount applied automatically.
- **Waybill** — weight tiers: under 5 kg ₦1,500, 5–10 kg ₦3,000, above 10 kg ₦250/kg.
- **Market run** — shopping budget (held, then reconciled) + flat ₦1,500 service fee.
- **Surcharges** — priority +₦700, careful handling +₦400.
- `riderShare()` mirrors the PRD's 25% rider / 75% company split.

Every surface (`QuoteWidget` on the home and service pages, `BookingForm` on `/quote`) calls the same functions, so tariffs never drift between pages.

## Design system

Tokens live in `app/globals.css` via Tailwind's `@theme`:

| Token | Value | Use |
| --- | --- | --- |
| `--color-cyan` | `#0797A8` | Primary action, accents |
| `--color-navy` | `#0A1B35` | Dark surfaces, headings |
| `--color-mist` | `#F5F8FA` | Section backgrounds |
| `--color-line` | `#DFE7EC` | Borders |
| `--color-success` / `--color-danger` | `#16865B` / `#D64545` | Status |

Typography: `Inter` for body, `Inter Tight` for display, both self-hosted via Fontsource (no external font requests). All tap targets are ≥ 48 px, and `prefers-reduced-motion` disables animation.

## Content & data

- `lib/content.ts` — services, zones, testimonials, FAQs, contact details (single source of truth).
- `lib/tracking.ts` — demo tracking records. Replace with API calls when the operations backend ships.
- All imagery is in `public/images` (AI-generated brand photography, no licensing dependencies).

## Notes for the next milestone

- Forms (`/quote`, `/contact`) validate and simulate success client-side; they are not wired to a backend yet.
- Tracking resolves three demo references (`DT-CAL-8842-5117`, `DT-CAL-3016-7702`, `DT-WB-4471-2200`).
- Placeholder company details (phone, email, RC number, address) need confirming before launch.
