# DigiTrans Logistics — Website

The public website for **DigiTrans Logistics**, a delivery, market-run and waybill company operating in Calabar, Cross River State, Nigeria.

Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · self-hosted Inter.

---

## Running locally

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
npm start        # serve the production build
npm run typecheck
```

## Pages

| Route | Purpose |
| --- | --- |
| `/` | Home — hero, feature strip, services, why-us band, industries, tracking, numbers, reviews, insights, closing CTA |
| `/services` | All six services with tariffs and windows |
| `/services/[slug]` | Six service pages: standard, market runs, waybills, business/vendor, student, scheduled |
| `/pricing` | Full tariff table, optional extras, live fare calculator |
| `/coverage` | Zones by LGA with landmarks, plus inter-state waybill routes |
| `/quote` | Four-step booking form with itemised fare summary |
| `/track` | Reference lookup with status timeline (three sample references) |
| `/about` | Company story, operating model, milestones, careers |
| `/contact` | Support channels, vendor + rider onboarding, depot map, FAQs, privacy, terms |
| `/insights` | Guides and notes from the dispatch desk |
| `/insights/[slug]` | Three long-form articles (pricing, market runs, waybills) |

`/sitemap.xml` and `/robots.txt` are generated from `lib/content.ts` and `lib/articles.ts`.

## Design system

Tokens are defined once in `app/globals.css` under Tailwind's `@theme`.

| Token | Value | Role |
| --- | --- | --- |
| `--color-navy` | `#0B1B2B` | Dark surfaces, primary buttons, headings |
| `--color-cyan` | `#0E7C8B` | Small accents only — links, ticks, active states |
| `--color-paper` | `#F7F8F8` | Alternating section backgrounds |
| `--color-line` | `#E3E6E8` | Hairline borders |
| `--color-slate-ink` | `#46566B` | Body copy |
| `--color-muted` | `#6D7B89` | Secondary copy |

Layout rules:

- **Photography leads.** Every page opens with a full-bleed or half-bleed photograph that blends into the navy field through gradient and mask utilities (`photo-fade-*`).
- **Rounded geometry.** Cards at 14–18 px radii, pill buttons and pill inputs, hairline borders. Circular icon badges carry a light tint of their hue.
- **Eyebrow + two-tone headings.** Each section opens with a small uppercase eyebrow in cyan, then a heading whose second line is cyan.
- **No glow effects.** Shadows are neutral and low opacity — no coloured halos, no radial cyan washes, no pulsing dots.
- Typography: `Inter Tight` for display, `Inter` for text, both self-hosted. Line-height 1.7 for body copy.
- All interactive targets are at least 44 px; `prefers-reduced-motion` disables animation.

## Pricing engine (`lib/pricing.ts`)

Implements the PRD's hybrid model in integer Naira:

- **Standard** — `base ₦500 + distance × ₦250/km`, ₦1,000 minimum, zone fallback for unresolved landmarks.
- **Student** — flat ₦500 on campus zones for verified students.
- **Vendor** — 10% contract discount, applied automatically.
- **Waybill** — under 5 kg ₦1,500; 5–10 kg ₦3,000; above 10 kg ₦250/kg.
- **Market run** — shopping budget (held, then reconciled) + flat ₦1,500 fee.
- **Surcharges** — priority +₦700, careful handling +₦400.
- `riderShare()` mirrors the PRD's 25% rider / 75% company split.

Every surface — the home widget, the pricing page calculator, the service pages and the booking form — calls the same functions, so a tariff change lands everywhere at once.

## Content & assets

- `lib/content.ts` — services, zones, reviews, FAQs and contact details (single source of truth).
- `lib/tracking.ts` — demo tracking records; replace with API calls when the operations backend ships.
- `public/images` — brand photography in `public/images` (AI-generated, no licensing dependencies).

## Enquiries

`app/api/enquiries/route.ts` accepts three payload kinds — `booking`, `contact` and
`newsletter` — validates and normalises them, then forwards them to the transport
configured in the environment:

| Variable | Behaviour |
| --- | --- |
| `ENQUIRY_WEBHOOK_URL` | Every enquiry is POSTed as JSON (Slack, Zapier, a CRM, your own endpoint). |
| unset | The enquiry is validated, logged server-side and acknowledged. |

To deliver mail directly, replace the webhook branch with a Resend/SES/Postmark call —
the validation and the response shape stay the same.

## Before launch

- Replace placeholder contact details (phone, email, address) and confirm the RC number.
- Replace headline figures (deliveries, riders, on-time rate) with audited numbers.
- Set `ENQUIRY_WEBHOOK_URL` so bookings and messages reach the dispatch desk.
- Connect `/track` to the deliveries table instead of the sample records.
