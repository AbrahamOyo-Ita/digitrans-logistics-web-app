import { SITE } from './site.js';

export const SERVICES = Object.freeze([
  {
    slug: 'local-delivery',
    legacySlugs: ['standard-delivery'],
    name: 'Local Delivery in Calabar',
    shortName: 'Local delivery',
    tagline: 'Same-day door-to-door parcel dispatch across Calabar.',
    blurb: 'Book a vetted Calabar rider in under a minute with live tracking and upfront fare calculation.',
    answerSummary:
      'DigiTrans provides same-day local parcel delivery across Calabar Municipal, Calabar South, Akpabuyo, and surrounding neighborhoods. Every delivery fare is calculated by the server before you confirm and tracked with live timeline updates.',
    description:
      'From a document in Duke Town to an urgent order heading toward State Housing or Atimbo, DigiTrans dispatches vetted local riders who know Calabar streets and landmarks by name. Each delivery includes live status updates and clear fare visibility before confirmation.',
    image: '/images/handover.jpg',
    imageAlt: 'A DigiTrans courier completing a door-to-door parcel handover in Calabar',
    ogImage: '/images/og/og-services.jpg',
    priceFrom: 'From ₦1,000',
    turnaround: 'Same-day dispatch',
    icon: 'truck',
    quoteService: 'standard',
    highlights: [
      'Server-calculated fare shown clearly before booking',
      'Live delivery timeline via public tracking reference',
      'Coverage across Calabar Municipal, Calabar South & Atimbo',
      'Instant or scheduled pickup windows',
    ],
    steps: [
      {
        title: 'Choose pickup and drop-off',
        body: 'Select Calabar service zones or enter street addresses and recognizable local landmarks.',
      },
      {
        title: 'Review the server-calculated fare',
        body: 'The platform computes base fee, distance rate, and any selected handling options before confirmation.',
      },
      {
        title: 'Track the handoff',
        body: 'Follow your DT-CAL reference as a rider is assigned, collects the parcel, and completes delivery.',
      },
    ],
    faqs: [
      {
        q: 'Which parts of Calabar does local delivery cover?',
        a: 'Local dispatch covers Calabar Municipal, Marian, UNICAL, Etta Agbor, State Housing, 8 Miles, Akim, Big Qua, Atimbo, Goldie, and nearby Calabar South and Akpabuyo areas.',
      },
      {
        q: 'How is a local delivery fare calculated?',
        a: 'Fares combine active zone rules, base fee, per-kilometre rate, and minimum fare rules configured in the DigiTrans pricing engine, with any optional surcharges shown clearly before you confirm.',
      },
      {
        q: 'What items cannot be sent with local delivery?',
        a: 'Cash, illegal goods, weapons, explosives, hazardous fuels, and live animals cannot be carried. See our prohibited items guide before booking.',
      },
    ],
  },
  {
    slug: 'market-runs',
    legacySlugs: [],
    name: 'Calabar Market Runs',
    shortName: 'Market Runs',
    tagline: 'Send your shopping list — we shop Calabar markets and deliver to your door.',
    blurb: 'Submit your Market Run list, review the estimate, approve before shopping starts, and receive with reconciled expenses.',
    answerSummary:
      'DigiTrans Market Runs handle shopping and delivery from Calabar markets including Watt Market, Marian Market, and Ikot Ishie. You submit a shopping list, approve the itemized estimate before procurement begins, and track delivery to your home or business.',
    description:
      'Skip traffic and market congestion across Calabar. Create a Market Run request with item names, quantities, and preferred units, review our team’s cost estimate plus the service fee, and approve before shopping begins. Actual expenses are reconciled cleanly against receipts.',
    image: '/images/market-run.jpg',
    imageAlt: 'Fresh foodstuff and household market items prepared during a DigiTrans Market Run in Calabar',
    ogImage: '/images/og/og-services.jpg',
    priceFrom: 'Items + ₦1,500 fee',
    turnaround: 'Same-day / scheduled',
    icon: 'bag',
    quoteService: 'market-run',
    highlights: [
      'Customer approval required before shopping starts',
      'Watt Market, Marian Market & Ikot Ishie coverage',
      'Reconciled expenses with transparent service fee',
      'Suitable for households, offices, and food businesses',
    ],
    steps: [
      {
        title: 'Submit your shopping list',
        body: 'List items, quantities, units (baskets, paints, tubers, packs), and an optional budget guide.',
      },
      {
        title: 'Approve the estimate',
        body: 'Operations reviews your list and sends the item estimate plus service fee to your workspace for approval.',
      },
      {
        title: 'Shopping & doorstep delivery',
        body: 'An assigned shopper buys approved items, records expenses, and hands off to a rider for delivery.',
      },
    ],
    faqs: [
      {
        q: 'Do you spend more than my approved budget without asking?',
        a: 'No. Market Runs require explicit customer estimate approval before procurement proceeds, and expense reviews reconcile actual spending.',
      },
      {
        q: 'Which Calabar markets do Market Runs cover?',
        a: 'Market Runs serve Watt Market, Marian Market, Ikot Ishie, Goldie, Atimbo, and surrounding Calabar trading hubs.',
      },
      {
        q: 'Can restaurants or offices place recurring Market Runs?',
        a: 'Yes. Businesses and households can submit lists from their DigiTrans workspace or request recurring arrangements through dispatch.',
      },
    ],
  },
  {
    slug: 'student-delivery',
    legacySlugs: [],
    name: 'Student Delivery in Calabar',
    shortName: 'Student delivery',
    tagline: 'Dedicated campus-zone pricing for verified students in Calabar.',
    blurb: 'Upload a valid student ID once in your account to unlock verified campus delivery pricing.',
    answerSummary:
      'DigiTrans offers verified student accounts special campus-zone delivery rates around UNICAL and approved Calabar student areas once your student ID is verified by operations.',
    description:
      'Built for students across the University of Calabar (UNICAL) and surrounding hostel corridors like Etta Agbor, Goldie, and Ekorinim. Register as a student, submit your student ID card for operations verification, and access verified campus-zone pricing on local deliveries.',
    image: '/images/depot.jpg',
    imageAlt: 'DigiTrans dispatch riders supporting student deliveries in Calabar',
    ogImage: '/images/og/og-services.jpg',
    priceFrom: '₦500 verified student rate',
    turnaround: 'Campus-zone dispatch',
    icon: 'user',
    quoteService: 'student',
    highlights: [
      'Campus-zone rate for verified student IDs',
      'Private document upload & operations verification',
      'Covers UNICAL, Etta Agbor, Goldie & nearby hostels',
      'Order food, documents, or parcel drops easily',
    ],
    steps: [
      {
        title: 'Create a student account',
        body: 'Select the Student role during registration and enter your institution and student ID details.',
      },
      {
        title: 'Upload your student ID',
        body: 'Submit a clear photo or PDF of your valid student ID privately in your account documents page.',
      },
      {
        title: 'Book at student pricing',
        body: 'Once verified, campus-eligible deliveries apply active student tariff rules automatically.',
      },
    ],
    faqs: [
      {
        q: 'Who qualifies for student delivery pricing?',
        a: 'Students at UNICAL and approved tertiary institutions in Calabar with an approved student ID on file.',
      },
      {
        q: 'Does student pricing apply to off-campus deliveries?',
        a: 'Special student rates apply when active student tariff conditions and campus zones are met; non-campus trips use standard local pricing.',
      },
      {
        q: 'How long does verification stay active?',
        a: 'Student verification stays active until the expiry period set during operations review, after which you can upload a renewed ID.',
      },
    ],
  },
  {
    slug: 'intercity-waybill',
    legacySlugs: ['waybills'],
    name: 'Intercity Waybills (Calabar, Port Harcourt & Obudu)',
    metaTitle: 'Intercity Waybills: Calabar, PH & Obudu | DigiTrans',
    shortName: 'Intercity waybills',
    tagline: 'Weight-tiered intercity parcel dispatch linking Calabar, Port Harcourt, and Obudu.',
    blurb: 'Submit parcel weight and recipient details, confirm intake at our Atimbo office or via pickup, and track with DT-WB codes.',
    answerSummary:
      'DigiTrans intercity waybills move tracked parcels along confirmed corridors between Calabar, Port Harcourt, and Obudu. Charges are verified by weight tier at intake, with every parcel tracked via a unique DT-WB waybill reference.',
    description:
      'Whether sending documents, electronics, or commercial parcels between Calabar and Port Harcourt or Calabar and Obudu, DigiTrans verifies parcel weight and route pricing before dispatch. Drop parcels off at our Atimbo, Calabar Municipal office or request an approved pickup, then share the public tracking link with your recipient.',
    image: '/images/waybill.jpg',
    imageAlt: 'Intercity parcel prepared and weighed for DigiTrans waybill dispatch',
    ogImage: '/images/og/og-routes.jpg',
    priceFrom: 'From ₦1,500',
    turnaround: 'Scheduled intercity dispatch',
    icon: 'box',
    quoteService: 'waybill',
    highlights: [
      'Corridors: Calabar <-> Port Harcourt & Calabar <-> Obudu',
      'Weight-tiered pricing verified before payment',
      'Printable & shareable DT-WB waybill tracking code',
      'Drop-off at Nyahasang, Atimbo office or approved pickup',
    ],
    steps: [
      {
        title: 'Submit waybill details',
        body: 'Enter sender, recipient, origin city, destination city, parcel description, and weight estimate.',
      },
      {
        title: 'Intake & weight confirmation',
        body: 'Operations checks actual parcel measurements at intake and confirms the final route charge.',
      },
      {
        title: 'Dispatch & tracking',
        body: 'Pay verified charges, then track every milestone from dispatch to arrival on /track.',
      },
    ],
    faqs: [
      {
        q: 'Which intercity routes does DigiTrans currently focus on?',
        a: 'Primary verified waybill corridors connect Calabar <-> Port Harcourt and Calabar <-> Obudu. Ask our dispatch desk for any special route requests.',
      },
      {
        q: 'Where do I drop off a parcel in Calabar?',
        a: `You can drop parcels at ${SITE.address}, or request an approved local pickup inside your booking.`,
      },
      {
        q: 'How do recipients track an intercity parcel?',
        a: 'Share the DT-WB waybill number or direct tracking link on digitransdelivery.com/track so recipients can follow arrival milestones.',
      },
    ],
  },
  {
    slug: 'business-logistics',
    legacySlugs: [],
    name: 'Business & Vendor Logistics',
    shortName: 'Business logistics',
    tagline: 'Reliable dispatch and order tracking for Calabar vendors, kitchens, and retailers.',
    blurb: 'Dedicated vendor workspace, contract pricing eligibility, CSV reporting, and multi-order tracking for businesses.',
    answerSummary:
      'DigiTrans Business Logistics equips Calabar restaurants, pharmacies, retail stores, and online sellers with a vendor workspace, approved discount pricing tiers, and traceable multi-delivery operations.',
    description:
      'Stop coordinating riders through scattered chat threads. Approved DigiTrans vendors manage orders from one dashboard, download CSV reconciliation logs, apply vendor discount rates when eligible, and route local parcels or intercity waybills from one operations partner.',
    image: '/images/vendor.jpg',
    imageAlt: 'Local business owner handing a packaged customer order to a DigiTrans rider',
    ogImage: '/images/og/og-services.jpg',
    priceFrom: '10% vendor discount',
    turnaround: 'On-demand & scheduled dispatch',
    icon: 'chart',
    quoteService: 'business',
    highlights: [
      'Vendor account workspace & delivery history board',
      'Server-applied vendor discount percentage when approved',
      'CSV export for weekly or monthly reconciliation',
      'Supports instant, scheduled, and multi-customer dispatch',
    ],
    steps: [
      {
        title: 'Apply as a vendor',
        body: 'Create a vendor account and upload business registration or operating documents for review.',
      },
      {
        title: 'Get verified by operations',
        body: 'Once approved, your vendor workspace unlocks business dispatch and configured vendor pricing.',
      },
      {
        title: 'Book & reconcile orders',
        body: 'Dispatch deliveries directly from your board and export full records anytime.',
      },
    ],
    faqs: [
      {
        q: 'What businesses use DigiTrans vendor accounts?',
        a: 'Restaurants, kitchens, pharmacies, bakeries, laundry services, supermarkets, and retail stores operating in Calabar.',
      },
      {
        q: 'Is there a mandatory software subscription?',
        a: 'No fixed subscription is required to apply. Pricing follows active vendor tariff rules configured on your account.',
      },
      {
        q: 'Can businesses send intercity orders to Port Harcourt or Obudu?',
        a: 'Yes. Combine local Calabar drops with intercity waybills along our Port Harcourt and Obudu corridors.',
      },
    ],
  },
  {
    slug: 'scheduled-pickups',
    legacySlugs: [],
    name: 'Scheduled Pickups in Calabar',
    shortName: 'Scheduled pickups',
    tagline: 'Book upcoming pickup windows ahead of time for planned deliveries.',
    blurb: 'Choose a future date and time window; operations confirms the slot before dispatch.',
    answerSummary:
      'DigiTrans Scheduled Pickups let households, students, and businesses book deliveries in advance with a chosen future pickup window and clear confirmation before dispatch.',
    description:
      'When tomorrow’s parcels, office packets, or vendor batches need predictable timing, schedule your pickup in advance. Choose your future date and time slot during booking so operations can reserve and confirm dispatch ahead of the window.',
    image: '/images/hero-courier.jpg',
    imageAlt: 'DigiTrans bicycle courier prepared for a scheduled parcel pickup in Calabar',
    ogImage: '/images/og/og-services.jpg',
    priceFrom: 'Standard + ₦300 slot',
    turnaround: 'Planned dispatch slot',
    icon: 'clock',
    quoteService: 'standard',
    highlights: [
      'Book future date & time pickup slots',
      'Operations confirmation before dispatch window opens',
      'Same live tracking & reference format as instant trips',
      'Great for offices, clinics, and scheduled customer drops',
    ],
    steps: [
      {
        title: 'Select scheduled timing',
        body: 'Pick Scheduled instead of Instant during delivery booking and enter your target date and time.',
      },
      {
        title: 'Await slot confirmation',
        body: 'Operations reviews and confirms the scheduled request before dispatch opens.',
      },
      {
        title: 'Rider collects within window',
        body: 'Follow status transitions on your dashboard or public tracking page as the pickup completes.',
      },
    ],
    faqs: [
      {
        q: 'How far ahead should I book a scheduled pickup?',
        a: 'Book whenever you know your upcoming route so operations has sufficient lead time to confirm your preferred slot.',
      },
      {
        q: 'Is there a fee difference for scheduled deliveries?',
        a: 'Active pricing settings may include a scheduled surcharge, always calculated and displayed before you confirm the booking.',
      },
      {
        q: 'Can I cancel a scheduled booking if plans change?',
        a: 'Pending or unassigned scheduled deliveries can be cancelled from your workspace before a rider is dispatched.',
      },
    ],
  },
]);

export const SERVICE_BY_SLUG = Object.fromEntries(SERVICES.map((s) => [s.slug, s]));

export const ZONES = Object.freeze([
  { id: 'calabar-municipal', name: 'Calabar Municipal', lga: 'Calabar Municipal', x: 6, y: 10, landmarks: ['Calabar Municipal Secretariat', 'Marian', 'City Centre'] },
  { id: 'marian', name: 'Marian', lga: 'Calabar Municipal', x: 8, y: 10, landmarks: ['Marian Road', 'Atekong Drive', 'Ndiden Usang Iso'] },
  { id: 'unical', name: 'UNICAL', lga: 'Calabar Municipal', x: 14, y: 14, campus: true, landmarks: ['UNICAL Main Gate', 'Faculty areas', 'Staff quarters'] },
  { id: 'etta-agbor', name: 'Etta Agbor', lga: 'Calabar Municipal', x: 11, y: 12, campus: true, landmarks: ['Etta Agbor Road', 'Student hostels', 'Unical axis'] },
  { id: 'state-housing', name: 'State Housing', lga: 'Calabar Municipal', x: 9, y: 12, landmarks: ['State Housing Estate', 'Federal Housing', 'Parliamentary'] },
  { id: '8-miles', name: '8 Miles', lga: 'Calabar Municipal', x: 17, y: 18, landmarks: ['8 Miles Junction', 'Tinapa axis', 'Airport Road'] },
  { id: 'akim', name: 'Akim', lga: 'Calabar Municipal', x: 7, y: 11, landmarks: ['Akim Junction', 'Ibom Layout', 'Akim Market'] },
  { id: 'big-qua', name: 'Big Qua', lga: 'Calabar Municipal', x: 8, y: 11, landmarks: ['Big Qua Town', 'Marian extension', 'Ikot Ansa'] },
  { id: 'atimbo', name: 'Atimbo & Nyahasang', lga: 'Calabar Municipal', x: 13, y: 8, landmarks: ['No 2 Ituebange Street (Office)', 'Nyahasang', 'Atimbo Road'] },
  { id: 'goldie', name: 'Goldie', lga: 'Calabar South', x: 6, y: 8, campus: true, landmarks: ['Goldie Street', 'Mount Zion', 'Watt Market link'] },
  { id: 'watt-market', name: 'Watt Market & Duke Town', lga: 'Calabar South', x: 4, y: 8, landmarks: ['Watt Market', 'Marina Road', 'Target Road'] },
  { id: 'anantigha', name: 'Anantigha & Ikot Ishie', lga: 'Calabar South', x: 5, y: 5, landmarks: ['Anantigha', 'Ikot Ishie Market', 'Ekpo Abasi'] },
]);

export const CITIES = Object.freeze([
  {
    slug: 'calabar',
    name: 'Calabar',
    state: 'Cross River State',
    title: 'Calabar Delivery, Market Runs & Dispatch Hub',
    metaTitle: 'Delivery & Logistics in Calabar | DigiTrans Logistics',
    metaDescription: 'Local delivery, Market Runs, UNICAL student drops & intercity waybill hub in Calabar. Office at Nyahasang, Atimbo.',
    heroImage: '/images/street-wide.jpg',
    heroAlt: 'DigiTrans delivery courier travelling through Calabar, Cross River State',
    ogImage: '/images/og/og-cities.jpg',
    answerSummary: `Calabar is DigiTrans Logistics’ primary operations base, headquartered at ${SITE.address}. We handle same-day local deliveries, Watt & Marian Market Runs, UNICAL student drops, vendor dispatch, and intercity waybill intake for Port Harcourt and Obudu.`,
    officeAddress: SITE.address,
    areasCovered: [
      'Calabar Municipal (Marian, State Housing, Big Qua, Akim, Ikot Ansa, Parliamentary)',
      'Nyahasang & Atimbo (DigiTrans operations office at No 2, Ituebange Street)',
      'UNICAL Campus, Etta Agbor, Goldie & surrounding student hostels',
      'Calabar South (Watt Market, Duke Town, Henshaw Town, Anantigha)',
      '8 Miles, Airport Road & Tinapa / Akpabuyo corridors',
    ],
    availableServices: ['local-delivery', 'market-runs', 'student-delivery', 'business-logistics', 'scheduled-pickups', 'intercity-waybill'],
    routesFromCity: ['calabar-to-port-harcourt', 'calabar-to-obudu'],
    faqs: [
      {
        q: 'Where is the DigiTrans office in Calabar?',
        a: `Our verified office address is ${SITE.address}.`,
      },
      {
        q: 'Can I book a Market Run in Calabar?',
        a: 'Yes. Submit shopping lists for Watt Market, Marian Market, or Ikot Ishie and approve the item + service fee estimate before procurement begins.',
      },
      {
        q: 'Do you support intercity parcels leaving Calabar?',
        a: 'Yes. Send tracked waybills from Calabar to Port Harcourt or Obudu through our intercity waybill desk.',
      },
    ],
  },
  {
    slug: 'port-harcourt',
    name: 'Port Harcourt',
    state: 'Rivers State',
    title: 'Port Harcourt Intercity Waybill Coverage',
    metaTitle: 'Calabar & Port Harcourt Waybill Logistics | DigiTrans',
    metaDescription: 'Send tracked intercity parcels between Calabar and Port Harcourt with weight-verified charges and DT-WB live tracking.',
    heroImage: '/images/hero-coastal-logistics.jpg',
    heroAlt: 'Intercity coastal logistics route connecting Port Harcourt and Calabar',
    ogImage: '/images/og/og-cities.jpg',
    answerSummary:
      'DigiTrans connects Port Harcourt and Calabar through tracked intercity waybill dispatch. Senders and recipients can track parcels online via DT-WB reference numbers from intake through destination handoff.',
    officeAddress: 'Pickup and collection point details confirmed upon waybill booking',
    areasCovered: [
      'Calabar -> Port Harcourt commercial & personal parcel dispatch',
      'Port Harcourt -> Calabar inbound waybills',
      'Tracked documents, electronics, packaged retail goods & household parcels',
    ],
    availableServices: ['intercity-waybill', 'business-logistics'],
    routesFromCity: ['port-harcourt-to-calabar', 'calabar-to-port-harcourt'],
    faqs: [
      {
        q: 'How do I send a parcel between Port Harcourt and Calabar?',
        a: 'Create a waybill request in your DigiTrans account or contact digitransdeliveryandlogistics@gmail.com to confirm drop-off and intake details.',
      },
      {
        q: 'How are Port Harcourt waybills priced?',
        a: 'Charges depend on verified parcel weight and route pricing rules confirmed by operations prior to dispatch.',
      },
      {
        q: 'Can both sender and recipient track the shipment?',
        a: 'Yes. Enter the DT-WB waybill reference on digitransdelivery.com/track to view status milestones.',
      },
    ],
  },
  {
    slug: 'obudu',
    name: 'Obudu',
    state: 'Cross River State',
    title: 'Obudu Intercity Waybill Coverage',
    metaTitle: 'Calabar & Obudu Parcel & Waybill Service | DigiTrans',
    metaDescription: 'Tracked intercity waybills connecting Calabar and Obudu in Cross River State with verified intake and live status updates.',
    heroImage: '/images/waybill.jpg',
    heroAlt: 'Tracked parcel prepared for the Calabar to Obudu waybill corridor',
    ogImage: '/images/og/og-cities.jpg',
    answerSummary:
      'DigiTrans connects northern Cross River State (Obudu) with Calabar via tracked intercity waybills. Send family packages, student essentials, documents, or retail stock with verifiable intake weight and online parcel tracking.',
    officeAddress: 'Collection and handoff details confirmed at waybill booking',
    areasCovered: [
      'Calabar -> Obudu parcel & document dispatch',
      'Obudu -> Calabar return parcel waybills',
      'Cross River North commercial, student & family parcels',
    ],
    availableServices: ['intercity-waybill', 'business-logistics'],
    routesFromCity: ['obudu-to-calabar', 'calabar-to-obudu'],
    faqs: [
      {
        q: 'Can I send parcels from Calabar to Obudu with tracking?',
        a: 'Yes. Every verified waybill receives a DT-WB reference code that can be tracked online at any time.',
      },
      {
        q: 'Where do I drop a parcel in Calabar going to Obudu?',
        a: `Bring properly packed parcels to ${SITE.address} or request an approved local pickup when submitting your waybill request.`,
      },
      {
        q: 'Are fragile items allowed on the Obudu route?',
        a: 'Permitted sturdy and well-packaged goods are accepted subject to operations intake inspection. Restricted or prohibited goods cannot be carried.',
      },
    ],
  },
]);

export const CITY_BY_SLUG = Object.fromEntries(CITIES.map((c) => [c.slug, c]));

export const ROUTES = Object.freeze([
  {
    slug: 'calabar-to-port-harcourt',
    fromCity: 'Calabar',
    fromSlug: 'calabar',
    toCity: 'Port Harcourt',
    toSlug: 'port-harcourt',
    reverseSlug: 'port-harcourt-to-calabar',
    title: 'Calabar to Port Harcourt Waybill & Parcel Delivery',
    metaTitle: 'Calabar to Port Harcourt Waybills | DigiTrans Logistics',
    metaDescription: 'Send parcels from Calabar to Port Harcourt with DigiTrans. Drop off in Atimbo or book pickup, track with DT-WB.',
    heroImage: '/images/waybill.jpg',
    heroAlt: 'Parcel packaged for intercity dispatch from Calabar to Port Harcourt',
    ogImage: '/images/og/og-routes.jpg',
    answerSummary: `Send tracked parcels from Calabar to Port Harcourt with DigiTrans Logistics. Submit your waybill online, drop off at ${SITE.address} (or request approved local pickup), confirm verified weight charges, and track every stage via DT-WB code.`,
    intakeLocation: SITE.address,
    deliveryWindow: 'Scheduled intercity dispatch',
    pricingNote: '₦1,500 (<5 kg), ₦3,000 (5–10 kg), and ₦4,500 (>10 kg) verified at intake.',
    idealFor: ['Commercial retail orders & fashion stock', 'Legal & business documents', 'Packaged electronics & household supplies', 'Family care parcels'],
    faqs: [
      {
        q: 'How do I book a Calabar to Port Harcourt waybill?',
        a: 'Sign in to your DigiTrans customer workspace, open Intercity Waybills, enter origin Calabar and destination Port Harcourt, or reach out via our contact form.',
      },
      {
        q: 'When do I pay for a Calabar to Port Harcourt parcel?',
        a: 'Operations checks actual parcel weight at intake first, then confirms the route fee so you pay the verified amount before dispatch.',
      },
      {
        q: 'Can I send perishables or cash on this route?',
        a: 'No. Cash, unsafe fuels, hazardous materials, and prohibited items are never accepted on intercity waybills.',
      },
    ],
  },
  {
    slug: 'port-harcourt-to-calabar',
    fromCity: 'Port Harcourt',
    fromSlug: 'port-harcourt',
    toCity: 'Calabar',
    toSlug: 'calabar',
    reverseSlug: 'calabar-to-port-harcourt',
    title: 'Port Harcourt to Calabar Waybill & Parcel Delivery',
    metaTitle: 'Port Harcourt to Calabar Waybills | DigiTrans Logistics',
    metaDescription: 'Receive or dispatch tracked parcels from Port Harcourt to Calabar with local Atimbo & Calabar delivery options.',
    heroImage: '/images/depot.jpg',
    heroAlt: 'DigiTrans dispatch hub receiving inbound parcels for Calabar delivery',
    ogImage: '/images/og/og-routes.jpg',
    answerSummary: `Move parcels from Port Harcourt into Calabar with end-to-end tracking and local Calabar delivery options. Packages arriving in Calabar connect directly to our Nyahasang, Atimbo office (${SITE.shortAddress}) and local rider distribution across all 12 zones.`,
    intakeLocation: 'Port Harcourt dispatch intake details confirmed on booking',
    deliveryWindow: 'Scheduled intercity dispatch',
    pricingNote: '₦1,500 (<5 kg), ₦3,000 (5–10 kg), and ₦4,500 (>10 kg) verified before dispatch.',
    idealFor: ['Supplier inventory for Calabar vendors', 'UNICAL student supplies from Rivers State', 'Business & family shipments into Calabar'],
    faqs: [
      {
        q: 'Once a parcel arrives in Calabar from Port Harcourt, how is it handed off?',
        a: `Recipients can collect at ${SITE.address} or arrange local last-mile rider delivery across Calabar Municipal, UNICAL, and Calabar South.`,
      },
      {
        q: 'How do I check when my Port Harcourt parcel reaches Calabar?',
        a: 'Enter your DT-WB waybill reference on digitransdelivery.com/track for live milestone updates.',
      },
    ],
  },
  {
    slug: 'calabar-to-obudu',
    fromCity: 'Calabar',
    fromSlug: 'calabar',
    toCity: 'Obudu',
    toSlug: 'obudu',
    reverseSlug: 'obudu-to-calabar',
    title: 'Calabar to Obudu Waybill & Parcel Delivery',
    metaTitle: 'Calabar to Obudu Parcel Delivery | DigiTrans Logistics',
    metaDescription: 'Tracked parcel & waybill delivery from Calabar to Obudu, Cross River State. Drop off at Atimbo, track online.',
    heroImage: '/images/handover.jpg',
    heroAlt: 'Parcel handover prepared for Calabar to Obudu intercity dispatch',
    ogImage: '/images/og/og-routes.jpg',
    answerSummary: `Send documented, tracked waybills north from Calabar to Obudu across Cross River State. Drop off at ${SITE.address} or book a local Calabar pickup, confirm the verified weight charge, and follow transit status with your DT-WB code.`,
    intakeLocation: SITE.address,
    deliveryWindow: 'Scheduled Cross River dispatch',
    pricingNote: '₦1,500 (<5 kg), ₦3,000 (5–10 kg), and ₦4,500 (>10 kg) verified prior to dispatch.',
    idealFor: ['Up-state student & family parcels', 'Printed files & official documents', 'Packaged retail stock for Obudu merchants'],
    faqs: [
      {
        q: 'How do I send items from Calabar to Obudu?',
        a: `Submit a waybill request in your DigiTrans account and bring the parcel to ${SITE.address} (or request pickup inside Calabar).`,
      },
      {
        q: 'Does every Calabar to Obudu parcel get a tracking code?',
        a: 'Yes. Every accepted parcel is assigned a traceable DT-WB waybill reference.',
      },
    ],
  },
  {
    slug: 'obudu-to-calabar',
    fromCity: 'Obudu',
    fromSlug: 'obudu',
    toCity: 'Calabar',
    toSlug: 'calabar',
    reverseSlug: 'calabar-to-obudu',
    title: 'Obudu to Calabar Waybill & Parcel Delivery',
    metaTitle: 'Obudu to Calabar Parcel Delivery | DigiTrans Logistics',
    metaDescription: 'Tracked waybills from Obudu to Calabar with local delivery to Calabar Municipal, UNICAL, Marian & Atimbo.',
    heroImage: '/images/hero-courier.jpg',
    heroAlt: 'DigiTrans rider preparing local delivery for arriving Obudu parcels in Calabar',
    ogImage: '/images/og/og-routes.jpg',
    answerSummary: `Connect Obudu to Calabar reliably with DigiTrans tracked waybills. Parcels arriving at our Atimbo, Calabar hub (${SITE.shortAddress}) can be picked up at the office or forwarded anywhere in Calabar by our local rider fleet.`,
    intakeLocation: 'Obudu intake details confirmed upon waybill approval',
    deliveryWindow: 'Scheduled Cross River dispatch',
    pricingNote: '₦1,500 (<5 kg), ₦3,000 (5–10 kg), and ₦4,500 (>10 kg) verified at intake.',
    idealFor: ['Documents & applications heading to Calabar', 'Local agricultural/packaged dry goods [permitted items only]', 'Student & family parcels to UNICAL & Calabar zones'],
    faqs: [
      {
        q: 'Can parcels arriving from Obudu be delivered to a Calabar address?',
        a: 'Yes. Specify final Calabar destination delivery on your waybill so local riders complete the last mile once the parcel reaches Calabar.',
      },
      {
        q: 'How does the recipient know when the parcel is ready?',
        a: 'Both sender and recipient can check arrival progress on digitransdelivery.com/track using the DT-WB code.',
      },
    ],
  },
]);

export const ROUTE_BY_SLUG = Object.fromEntries(ROUTES.map((r) => [r.slug, r]));

export const PRICING_SUMMARY_ROWS = Object.freeze([
  ['Local delivery (Calabar)', '₦500 base + ₦250/km (₦1,000 minimum fare)', 'Shown upfront before booking'],
  ['Market Runs', 'Approved item cost estimate + ₦1,500 service fee', 'Reconciled against receipts'],
  ['Intercity waybill (under 5 kg)', '₦1,500 on Calabar <-> Port Harcourt & Calabar <-> Obudu', 'Verified at intake'],
  ['Intercity waybill (5–10 kg)', '₦3,000 on Calabar <-> Port Harcourt & Calabar <-> Obudu', 'Verified at intake'],
  ['Intercity waybill (above 10 kg)', '₦4,500 on Calabar <-> Port Harcourt & Calabar <-> Obudu', 'Verified at intake'],
  ['Verified student delivery', '₦500 flat rate on eligible campus trips', 'Requires approved student ID'],
  ['Business & vendor accounts', '10% vendor discount on approved business accounts', 'Applied automatically after approval'],
]);

export const PRICING_EXTRAS = Object.freeze([
  ['Scheduled pickup slot', '₦300 surcharge', 'Reserve a future pickup window ahead of dispatch.'],
  ['Fragile / special handling', 'Disclosed before confirmation', 'Extra packing care noted on the booking instructions.'],
  ['Intercity declared value', 'Recorded at intake review', 'Optional parcel valuation recorded on the waybill intake form.'],
]);

export const SERVICE_SCENARIOS = Object.freeze([
  {
    title: 'Same-day kitchen & retail dispatch',
    persona: 'Calabar restaurants & shops',
    summary:
      'Vendors log customer deliveries from one dashboard instead of coordinating riders by phone across multiple chats, keeping every reference and payout record searchable.',
    tag: 'Vendor workflow',
  },
  {
    title: 'Receipt-reconciled Watt & Marian shopping',
    persona: 'Busy households & offices',
    summary:
      'Send a structured Market Run list, review and approve the shopping estimate in your workspace before procurement begins, and track your basket to your doorstep.',
    tag: 'Market Runs',
  },
  {
    title: 'Verified UNICAL & campus parcel drops',
    persona: 'Calabar students',
    summary:
      'Upload a valid student ID privately once in your DigiTrans account so eligible campus deliveries use active verified student tariff rules automatically.',
    tag: 'Student delivery',
  },
]);

export const FAQS = Object.freeze([
  {
    category: 'Coverage',
    q: 'Where does DigiTrans deliver?',
    a: `DigiTrans operates local delivery across Calabar Municipal, Calabar South, UNICAL, Etta Agbor, Marian, State Housing, Atimbo, 8 Miles, and surrounding neighborhoods from our office at ${SITE.address}, plus intercity waybills between Calabar, Port Harcourt, and Obudu.`,
  },
  {
    category: 'Pricing',
    q: 'How is my delivery fee calculated?',
    a: 'All local delivery fares are calculated server-side from active pricing rules (base fee, distance rate, minimum fare, student eligibility, vendor discounts, or scheduled surcharges). You always see the calculated fare before confirming.',
  },
  {
    category: 'Market Runs',
    q: 'How do Market Runs work?',
    a: 'Submit your shopping list in your DigiTrans workspace. Operations reviews the items and sends an estimate for your approval before shopping begins, then reconciles actual receipts and delivers to your door.',
  },
  {
    category: 'Waybills',
    q: 'How do intercity waybills between Calabar, Port Harcourt, and Obudu work?',
    a: 'Submit a waybill request with sender, recipient, route, and parcel weight. Operations confirms actual intake weight and applicable route charges before payment and dispatch, issuing a live DT-WB tracking number.',
  },
  {
    category: 'Tracking',
    q: 'How do I track a delivery or waybill?',
    a: 'Visit digitransdelivery.com/track and enter your delivery reference (DT-CAL-...) or waybill number (DT-WB-...) to see every status update and timestamp.',
  },
  {
    category: 'Safety',
    q: 'What items are prohibited?',
    a: 'Illegal goods, weapons, explosives, unsafe fuel, hazardous chemicals, cash, negotiable instruments, and live animals cannot be carried.',
  },
  {
    category: 'Riders & Vendors',
    q: 'How do I join DigiTrans as a rider or business vendor?',
    a: 'Create a Rider or Vendor account on the registration page and upload your required identity, vehicle/guarantor, or business documents for operations verification.',
  },
  {
    category: 'Contact',
    q: 'How do I reach DigiTrans Logistics?',
    a: `Email ${SITE.email}, submit an enquiry on our Contact page (which routes directly to our support inbox and operations dashboard), or visit ${SITE.address}.`,
  },
]);

export const GUIDES = Object.freeze([
  {
    slug: 'how-delivery-pricing-works-in-calabar',
    legacyInsightSlug: 'delivery-costs-in-calabar',
    title: 'How delivery pricing works in Calabar',
    category: 'Pricing',
    datePublished: '2026-11-04',
    dateLabel: '4 November 2026',
    readTime: '5 min read',
    image: '/images/handover.jpg',
    imageAlt: 'DigiTrans rider completing a tracked parcel handover in Calabar',
    ogImage: '/images/og/og-pricing.jpg',
    excerpt:
      'Distance, zone rules, service timing, and weight determine every logistics fare. Learn how DigiTrans computes local, Market Run, student, and waybill pricing transparently.',
    answerSummary:
      'DigiTrans calculates delivery fares server-side using active pricing versions (base pickup fee, per-kilometre rate, and minimum fare) alongside Calabar zone rules—never charging undisclosed fees at the door.',
    body: [
      {
        paragraphs: [
          'Hidden surcharges and ad-hoc haggling make local delivery unpredictable for both households and growing businesses in Calabar. DigiTrans resolves this with transparent, rule-based pricing verified by the server before you confirm an order.',
          'Rather than quoting arbitrary flat numbers for widely different trips—like a quick handoff inside Marian versus a cross-town run from Watt Market to 8 Miles—our pricing engine combines route distance, active Calabar zones, and your selected service type.',
        ],
      },
      {
        heading: 'What determines your DigiTrans fare',
        paragraphs: [],
        bullets: [
          'Base fee & minimum fare: Every trip respects the current platform base fee and minimum delivery charge.',
          'Route distance: Trips across different Calabar corridors reflect actual travel distance between pickup and drop-off points.',
          'Service timing: Instant dispatch uses standard rules; scheduled pickups can carry a configured slot surcharge displayed upfront.',
          'Verified eligibility: Approved student accounts unlock campus-zone student pricing, while verified business vendors receive configured vendor contract discounts.',
          'Waybill weight tiers: Intercity parcels between Calabar, Port Harcourt, and Obudu follow verified weight tiers confirmed at intake.',
        ],
      },
      {
        heading: 'Planning vs. final confirmed price',
        paragraphs: [
          'Use the public quote calculator on our Pricing or Quote pages to preview typical zone-to-zone planning estimates anytime. Once signed in, the booking screen fetches active server pricing rules (₦500 base + ₦250/km with a ₦1,000 minimum local fare, ₦1,500 Market Run fee, ₦500 student rate, 10% vendor discount, ₦300 scheduled slot surcharge, and ₦1,500 / ₦3,000 / ₦4,500 intercity waybill weight bands) and displays the exact confirmed Naira total before you commit.',
        ],
      },
    ],
    faqs: [
      {
        q: 'Can the rider change the agreed delivery price on arrival?',
        a: 'No. Confirmed bookings carry the verified fare calculated by the server when the request was placed.',
      },
      {
        q: 'How do Market Run costs differ from local parcel fees?',
        a: 'Market Runs separate the Market Run service fee from the actual shopping cost, requiring customer approval of the estimate before shopping begins.',
      },
    ],
  },
  {
    slug: 'watt-market-and-marian-market-run-checklist',
    legacyInsightSlug: 'market-run-checklist',
    title: 'Watt Market & Marian Market Run checklist',
    category: 'Market Runs',
    datePublished: '2026-10-27',
    dateLabel: '27 October 2026',
    readTime: '4 min read',
    image: '/images/market-run.jpg',
    imageAlt: 'Fresh groceries prepared for a Calabar Market Run delivery',
    ogImage: '/images/og/og-guides.jpg',
    excerpt:
      'Write clearer Calabar market lists so your shopper gets the exact measure, quality, and budget—with customer approval before procurement begins.',
    answerSummary:
      'A clear Calabar Market Run list includes market units (paint buckets, baskets, tubers, bunches), acceptable substitutions, your budget estimate, and preferred contact method so you can approve costs cleanly.',
    body: [
      {
        paragraphs: [
          'The difference between a seamless Watt Market or Marian Market delivery and a frustrating one usually comes down to how specific the shopping list is. Writing "tomatoes and pepper for stew" leaves size, freshness, and quantity open to guesswork.',
          'With DigiTrans Market Runs, every item enters as a structured line with name, quantity, and unit—plus your delivery landmark and optional budget guide.',
        ],
      },
      {
        heading: 'Five items to put on every Market Run request',
        paragraphs: [],
        bullets: [
          'Local market units: Specify painter, half-painter, basket, bunch, crate, or piece count.',
          'Quality or brand notes: Mention whether you want ripe/firm produce, smoked vs. fresh fish, or a specific brand.',
          'Substitution preference: Use the instructions box to say whether similar brands are fine if an item is out of stock.',
          'Preferred contact channel: Pick phone, WhatsApp, or email in case the shopper or operations needs a quick confirmation.',
          'Clear delivery landmark: Include street name, estate gate, or nearby junction in Calabar.',
        ],
      },
      {
        heading: 'How budget approval protects you',
        paragraphs: [
          'Operations reviews your list, calculates an estimated item total plus the Market Run service fee, and sends that estimate to your workspace for explicit approval. Procurement only proceeds after you approve—and actual expenses are reconciled against receipts.',
        ],
      },
    ],
    faqs: [
      {
        q: 'What happens if I only know an approximate budget?',
        a: 'Enter an optional budget guide when submitting your list; operations will confirm the structured item estimate for your approval first.',
      },
    ],
  },
  {
    slug: 'sending-waybills-from-calabar-to-port-harcourt',
    legacyInsightSlug: 'sending-parcels-out-of-calabar',
    title: 'Sending waybills from Calabar to Port Harcourt',
    category: 'Intercity Waybills',
    datePublished: '2026-10-20',
    dateLabel: '20 October 2026',
    readTime: '6 min read',
    image: '/images/waybill.jpg',
    imageAlt: 'Labelled parcel weighed for Calabar to Port Harcourt waybill transit',
    ogImage: '/images/og/og-routes.jpg',
    excerpt:
      'Everything you need to prepare, price, drop off, and track an intercity parcel along the Calabar to Port Harcourt corridor.',
    answerSummary: `To send a parcel from Calabar to Port Harcourt with DigiTrans, submit a waybill request in your workspace, deliver the packaged parcel to ${SITE.address} (or request pickup), verify weight-tier pricing, and share your DT-WB tracking number.`,
    body: [
      {
        paragraphs: [
          'Moving commercial stock, important documents, or personal packages between Calabar and Port Harcourt requires clear intake verification so nothing goes missing between hubs.',
          'Every DigiTrans waybill generates both an internal request reference and a public DT-WB waybill tracking code once processed.',
        ],
      },
      {
        heading: 'Step-by-step intake checklist',
        paragraphs: [],
        bullets: [
          'Pack securely: Wrap fragile contents in cushioned sleeves inside a rigid carton or sealed courier bag.',
          'Provide accurate recipient phone numbers: Ensure the Port Harcourt recipient’s number is active for handoff coordination.',
          'Drop off or request local pickup: Bring parcels to our Nyahasang, Atimbo office in Calabar or select pickup inside your booking.',
          'Confirm weight and payment: Operations verifies parcel weight and route pricing before unlocking Paystack checkout or payment confirmation.',
        ],
      },
      {
        heading: 'Prohibited items reminder',
        paragraphs: [
          'Cash, flammable fuels, weapons, illegal substances, and live animals are strictly excluded from all intercity corridors. Review the Prohibited Items page whenever shipping unfamiliar products.',
        ],
      },
    ],
    faqs: [
      {
        q: 'Can Port Harcourt recipients pay or track online?',
        a: 'Anyone with the DT-WB code can track milestone status publicly on /track, while waybill payment is initiated securely by the booking account after intake confirmation.',
      },
    ],
  },
  {
    slug: 'calabar-to-obudu-parcel-and-waybill-guide',
    title: 'Calabar to Obudu parcel & waybill dispatch guide',
    category: 'Intercity Waybills',
    datePublished: '2026-11-01',
    dateLabel: '1 November 2026',
    readTime: '5 min read',
    image: '/images/depot.jpg',
    imageAlt: 'Parcels organized at the DigiTrans depot for Calabar to Obudu dispatch',
    ogImage: '/images/og/og-routes.jpg',
    excerpt:
      'How students, families, and merchants move parcels reliably between Calabar and Obudu using DigiTrans tracked waybills.',
    answerSummary:
      'DigiTrans runs tracked intercity waybills linking Calabar and Obudu across Cross River State, letting families, students, and businesses send verified parcels without relying on unrecorded roadside drivers.',
    body: [
      {
        paragraphs: [
          'Sending parcels across Cross River State between Calabar and Obudu traditionally meant handing boxes to random park vehicles and hoping a phone number worked at arrival. DigiTrans brings structured accountability to the Calabar <-> Obudu corridor.',
          'Each request records sender identity, recipient contact details, declared item descriptions, weight verification, and milestone scans from intake through arrival.',
        ],
      },
      {
        heading: 'Common shipments on the Obudu corridor',
        paragraphs: [],
        bullets: [
          'Academic documents, books, and clothing for students travelling between Calabar and northern Cross River.',
          'Business stock and packaged supplies ordered by Obudu merchants from Calabar suppliers.',
          'Family parcels routed cleanly through our Nyahasang, Atimbo Calabar hub.',
        ],
      },
    ],
    faqs: [
      {
        q: 'Can parcels travel in both directions between Calabar and Obudu?',
        a: 'Yes. Explore our dedicated Calabar to Obudu and Obudu to Calabar route pages or submit a waybill request in your workspace.',
      },
    ],
  },
  {
    slug: 'student-delivery-guide-for-unical-and-calabar-hostels',
    title: 'Student delivery guide for UNICAL & Calabar hostels',
    metaTitle: 'UNICAL & Hostel Student Delivery Guide | DigiTrans',
    category: 'Student Delivery',
    datePublished: '2026-10-15',
    dateLabel: '15 October 2026',
    readTime: '4 min read',
    image: '/images/hero-courier.jpg',
    imageAlt: 'DigiTrans bicycle courier ready for UNICAL campus deliveries',
    ogImage: '/images/og/og-services.jpg',
    excerpt:
      'How to verify your UNICAL or Calabar student ID once and unlock campus-zone pricing for food, printouts, and hostel runs.',
    answerSummary:
      'Register with the Student role, upload a clear student ID in your private Documents page, and wait for operations verification to activate student pricing across UNICAL, Etta Agbor, Goldie, and nearby hostel zones.',
    body: [
      {
        paragraphs: [
          'Moving textbooks, lab coats, food orders, and parcels between Etta Agbor, Goldie, and inside UNICAL takes valuable study time. DigiTrans student accounts keep campus deliveries accessible and predictable.',
        ],
      },
      {
        heading: 'How to pass student verification smoothly',
        paragraphs: [],
        bullets: [
          'Register specifically as a Student account so your student profile record is created.',
          'Upload a sharp, readable photo or PDF of your valid institution ID card (under 10 MB).',
          'Make sure your full name on the account matches your student ID card.',
          'Once approved by our review team, your account automatically receives verified student eligibility on campus zones.',
        ],
      },
    ],
    faqs: [
      {
        q: 'Are uploaded student ID cards kept private?',
        a: 'Yes. Verification files are stored privately and visible only to you and authorised operations reviewers.',
      },
    ],
  },
  {
    slug: 'packaging-fragile-items-for-intercity-waybills',
    title: 'How to pack fragile items for intercity waybills',
    category: 'Safety & Packing',
    datePublished: '2026-10-10',
    dateLabel: '10 October 2026',
    readTime: '5 min read',
    image: '/images/handover.jpg',
    imageAlt: 'Safely boxed parcel during a DigiTrans handover',
    ogImage: '/images/og/og-guides.jpg',
    excerpt:
      'Practical packaging guidelines for electronics, glass bottles, and boxed merchandise heading from Calabar to Port Harcourt or Obudu.',
    answerSummary:
      'Double-walled cardboard boxes, individual bubble/foam cushioning, sealed internal liquids, and clear "Fragile" handling notes dramatically reduce transit risk on intercity routes.',
    body: [
      {
        paragraphs: [
          'Even careful vehicle loading involves vibration and stacking pressure across intercity highways. Good packaging protects your item before the parcel ever leaves our Atimbo office.',
        ],
      },
      {
        heading: 'Four rules before dropping off a parcel',
        paragraphs: [],
        bullets: [
          'Eliminate empty gaps: Fill voids with crumpled paper, foam, or bubble wrap so contents cannot rattle inside the box.',
          'Wrap items individually: Never pack two glass jars or hard components touching directly.',
          'Seal liquids upright: Tape caps securely and place liquid containers inside leak-proof inner bags before boxing.',
          'Note handling instructions accurately: Mention "Fragile" or "Keep Upright" on your waybill form.',
        ],
      },
    ],
    faqs: [
      {
        q: 'Does DigiTrans inspect parcels during waybill intake?',
        a: 'Yes. Operations verifies packaging safety, prohibited item compliance, and actual parcel weight prior to accepting waybills for dispatch.',
      },
    ],
  },
  {
    slug: 'how-calabar-vendors-manage-same-day-dispatch',
    title: 'How Calabar businesses manage same-day dispatch',
    category: 'Business Logistics',
    datePublished: '2026-10-05',
    dateLabel: '5 October 2026',
    readTime: '4 min read',
    image: '/images/vendor.jpg',
    imageAlt: 'Calabar retail store preparing orders for DigiTrans vendor dispatch',
    ogImage: '/images/og/og-services.jpg',
    excerpt:
      'Why Calabar restaurants, pharmacies, and online shops move faster with a verified DigiTrans vendor dashboard instead of ad-hoc phone calls.',
    answerSummary:
      'A DigiTrans vendor account centralizes booking, tracking, recipient details, vendor discount calculation, and downloadable CSV history so small teams spend less time chasing riders.',
    body: [
      {
        paragraphs: [
          'When customer orders come in via Instagram, WhatsApp, and walk-in counters at once, relying on scattered paper notes leads to missed drop-offs and lost fare receipts.',
        ],
      },
      {
        heading: 'What verified vendors gain inside DigiTrans',
        paragraphs: [],
        bullets: [
          'Centralized order history with instant reference numbers and shareable tracking links.',
          'Automatic application of approved vendor contract discounts during checkout.',
          'One-click "Book again" for repeat local Calabar customer routes.',
          'Downloadable CSV exports for weekly finance reconciliation.',
        ],
      },
    ],
    faqs: [
      {
        q: 'What documents are required to verify a vendor account?',
        a: 'Upload your business registration, permit, or tax verification document inside your Vendor Documents section after registration.',
      },
    ],
  },
  {
    slug: 'tracking-your-digitrans-delivery-and-waybill-codes',
    title: 'Understanding DigiTrans delivery & waybill tracking codes',
    metaTitle: 'DigiTrans Delivery & Waybill Tracking Codes',
    category: 'Tracking',
    datePublished: '2026-09-28',
    dateLabel: '28 September 2026',
    readTime: '3 min read',
    image: '/images/street-wide.jpg',
    imageAlt: 'DigiTrans rider travelling in Calabar with a tracked delivery',
    ogImage: '/images/og/og-guides.jpg',
    excerpt:
      'Know the difference between DT-CAL delivery codes, DT-WB waybill numbers, SUP support tickets, and how to follow live timeline milestones.',
    answerSummary:
      'DigiTrans issues DT-CAL (or DEL-) references for local deliveries and DT-WB codes for intercity waybills. Enter either code on digitransdelivery.com/track to view status milestones without logging in.',
    body: [
      {
        paragraphs: [
          'Every service request in DigiTrans gets a deterministic reference number so customers, recipients, and dispatch teams always talk about the exact same shipment.',
        ],
      },
      {
        heading: 'Reference formats at a glance',
        paragraphs: [],
        bullets: [
          'Local deliveries: Tracked with delivery references (such as DT-CAL-...) showing rider assignment, collection, transit, and completion timestamps.',
          'Intercity waybills: Tracked with waybill numbers (starting with DT-WB) across intake, dispatch, intercity transit, arrival, and handoff.',
          'Support tickets: References starting with SUP link directly to your specific delivery, payment, Market Run, or waybill conversation.',
        ],
      },
    ],
    faqs: [
      {
        q: 'Do recipients need a DigiTrans account to track a parcel?',
        a: 'No. Anyone with the tracking reference can check parcel status publicly at digitransdelivery.com/track.',
      },
    ],
  },
]);

export const GUIDE_BY_SLUG = Object.fromEntries(GUIDES.map((g) => [g.slug, g]));

export const LEGAL_PAGES = Object.freeze({
  '/terms': {
    eyebrow: 'Service terms',
    title: 'Terms & conditions',
    lead: 'Clear expectations for every DigiTrans delivery, Market Run, waybill, and account.',
    sections: [
      [
        'Using the service',
        'Provide accurate booking, recipient, and account information. Do not submit prohibited or unsafe items. Pricing and availability are verified by the platform when you submit a request.',
      ],
      [
        'Delivery and payment',
        'Delivery timelines depend on traffic, weather, and route conditions. Electronic payments are considered confirmed only after server-side provider verification.',
      ],
      [
        'Accounts',
        `Keep your login credentials private and contact DigiTrans at ${SITE.email} if you believe your account has been accessed without permission.`,
      ],
    ],
  },
  '/privacy': {
    eyebrow: 'Your information',
    title: 'Privacy policy',
    lead: 'DigiTrans uses personal information only to deliver logistics services, verify accounts, and support customers.',
    sections: [
      [
        'What we use',
        'We use account contact details, addresses, and item descriptions to process bookings and updates. Verification documents (student IDs, rider IDs, guarantor records, business registrations) remain private to authorised reviewers.',
      ],
      [
        'Records and security',
        'Financial and operational audit records are retained for accurate reconciliation and accountability. Sensitive private documents are never exposed publicly.',
      ],
      [
        'Your choices',
        `Contact ${SITE.email} to request assistance or enquire about your account data.`,
      ],
    ],
  },
  '/prohibited-items': {
    eyebrow: 'Safety first',
    title: 'Prohibited & restricted items',
    lead: 'Every parcel carried locally or between cities must be safe, lawful, and suitably packaged.',
    sections: [
      [
        'Items not accepted',
        'Illegal drugs, weapons, explosives, ammunition, hazardous chemicals, unsafe fuels, cash or negotiable instruments, and live animals cannot be carried.',
      ],
      [
        'Inspection & clarification',
        `Operations reserves the right to inspect, hold, or decline items that pose safety risks. Contact ${SITE.email} before booking if you are unsure about an item.`,
      ],
    ],
  },
  '/delivery-refund': {
    eyebrow: 'Service policy',
    title: 'Delivery, cancellation & refunds',
    lead: 'Cancellation eligibility and refunds follow transparent review tied to your booking status and payment record.',
    sections: [
      [
        'Cancellation',
        'Unassigned deliveries may be cancelled directly from your workspace. Once a rider is dispatched or an intercity parcel enters transit, cancellations require an operations review.',
      ],
      [
        'Refunds',
        'Approved refunds are traced against the verified payment reference. Open a support ticket linked to your reference or email digitransdeliveryandlogistics@gmail.com for assistance.',
      ],
    ],
  },
  '/investment-risk': {
    eyebrow: 'Important disclosure',
    title: 'Investment risk disclosure',
    lead: 'Information on DigiTrans is not financial, legal, or tax advice. Submitting an application is not a guarantee of approval or return.',
    sections: [
      [
        'Before applying',
        'Read all agreement terms and disclosures carefully. Any projected returns shown on approved opportunities are estimates only—not guaranteed earnings or completed payouts.',
      ],
      [
        'Risk acknowledgement',
        'Capital opportunities may carry risk of delay or loss. Seek independent professional advice before proceeding.',
      ],
    ],
  },
});

export const HOW_IT_WORKS_STEPS = Object.freeze([
  {
    service: 'Local Delivery (Calabar)',
    steps: [
      'Pick pickup & drop-off zones or enter street landmarks.',
      'Review the server-calculated Naira fare and select instant or scheduled timing.',
      'Submit and track your DT-CAL reference until delivery handoff.',
    ],
    href: '/services/local-delivery',
  },
  {
    service: 'Market Runs',
    steps: [
      'Create a structured list of items, quantities, units, and delivery landmark.',
      'Review and approve the item + service fee estimate inside your workspace.',
      'Shopper purchases items, reconciles expenses, and dispatches delivery.',
    ],
    href: '/services/market-runs',
  },
  {
    service: 'Student Delivery',
    steps: [
      'Register with the Student account role and submit your student ID card privately.',
      'Wait for operations approval of your institution ID.',
      'Book campus-zone trips using verified student pricing.',
    ],
    href: '/services/student-delivery',
  },
  {
    service: 'Intercity Waybills (Port Harcourt & Obudu)',
    steps: [
      'Submit sender, recipient, origin/destination city, and estimated parcel weight.',
      `Drop off parcel at ${SITE.address} or arrange pickup for weight intake verification.`,
      'Complete verified payment and share your DT-WB tracking code.',
    ],
    href: '/services/intercity-waybill',
  },
]);
