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
| `/` | Home — hero, introduction, services, live fare widget, tracking, operations, tariffs, coverage, reviews, process, FAQ, closing CTA |
| `/services` | All six services with tariffs and windows |
| `/services/[slug]` | Six service pages: standard, market runs, waybills, business/vendor, student, scheduled |
| `/pricing` | Full tariff table, optional extras, live fare calculator |
| `/coverage` | Zones by LGA with landmarks, plus inter-state waybill routes |
| `/quote` | Four-step booking form with itemised fare summary |
| `/track` | Reference lookup with status timeline (three demo references) |
| `/about` | Company story, operating model, milestones, careers |
| `/contact` | Support channels, vendor + rider onboarding, depot map, FAQs, privacy, terms |

`/sitemap.xml` and `/robots.txt` are generated from `lib/content.ts`.

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

Rules the site follows:

- **Photography leads.** Every page opens with a full-bleed or half-bleed photograph that blends into the navy field through gradient and mask utilities (`photo-fade-*`), not through coloured glows.
- **No glow effects.** No box-shadow coloured halos, no radial cyan washes, no pulsing dots. Shadows are neutral and low opacity.
- **No eyebrow labels or pill badges.** Section headings carry the meaning; small text is reserved for captions and data.
- **Squared geometry.** 4 px radii on controls, hairline borders, generous whitespace. Buttons are navy, white-on-navy or outlined — cyan is never a large fill.
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

## Before launch

- Replace placeholder contact details (phone, email, address) and confirm the RC number.
- Replace headline figures (deliveries, riders, on-time rate) with audited numbers.
- Wire `/quote` and `/contact` to the backend; both currently validate and simulate success in the browser.
- Connect `/track` to the deliveries table instead of the demo records.
