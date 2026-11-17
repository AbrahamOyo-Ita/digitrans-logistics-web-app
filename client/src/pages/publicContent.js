export const site = {
  name: 'DigiTrans Logistics',
  phone: '+234 801 234 5678',
  phoneHref: 'tel:+2348012345678',
  whatsapp: '+234 801 234 5678',
  whatsappHref: 'https://wa.me/2348012345678',
  email: 'hello@digitrans.ng',
  emailHref: 'mailto:hello@digitrans.ng',
  address: '18 Marian Road, Calabar Municipality, Cross River State',
  hours: 'Mon – Sat · 7:00 – 20:00',
  founded: 2021,
  stats: { deliveries: '38,000+', riders: '240', onTime: '97.4%', partners: '180+' },
};

export const services = [
  {
    slug: 'standard-delivery', name: 'Standard delivery', short: 'Same-day parcels, anywhere in Calabar.',
    blurb: 'Book a rider in under a minute and watch every stop on the live timeline.',
    description: 'From a single document in Duke Town to a full order in State Housing, our riders move your items across Calabar with live tracking and a proof-of-delivery photo on every drop. Charges are calculated before you confirm, so there is never a surprise at the door.',
    image: '/images/handover.jpg', priceFrom: '₦1,000', turnaround: '60 – 120 min', icon: 'truck', quoteService: 'standard',
    highlights: ['Live tracking with rider contact', 'Photo + signature proof of delivery', 'Distance-based pricing from ₦1,000', 'Insured on every confirmed trip'],
    steps: [
      { title: 'Tell us the route', body: 'Pick a pickup and drop-off zone — or type a landmark for exact pricing.' },
      { title: 'Confirm the fare', body: 'You see the fare breakdown before booking. Pay online, by transfer, or cash to the rider.' },
      { title: 'Track to the door', body: 'Follow status updates and share your tracking link with the recipient.' },
    ],
    faqs: [
      { q: 'How fast is a standard delivery?', a: 'Most Calabar trips are picked up within 20 minutes and delivered inside 60 – 120 minutes.' },
      { q: "What can't I send?", a: 'Cash, illegal items, live animals and hazardous materials are excluded. Perishables need a market run or priority booking.' },
      { q: 'Is there insurance?', a: 'Every confirmed delivery carries cover up to ₦50,000 for loss or damage in transit. Declared-value cover is available on waybills.' },
    ],
  },
  {
    slug: 'market-runs', name: 'Market runs', short: 'We shop Watt Market so you don’t have to.',
    blurb: 'Send your list, approve the budget, get the goods plus your receipt.',
    description: 'Skip the traffic and the haggling. Send us your list, set a spending cap, and a trained market runner will buy at Watt Market, Marian or Ikot Ishie and deliver to your door — with receipts and any unspent balance returned.',
    image: '/images/market-run.jpg', priceFrom: '₦1,500 + budget', turnaround: '90 – 150 min', icon: 'bag', quoteService: 'market-run',
    highlights: ['Receipts for every purchase', 'Budget approval before extra spend', 'Trained market runners', 'Unspent balance returned'],
    steps: [
      { title: 'Write your list', body: 'Add items, quantities and an estimated price for each. Not sure? Leave it blank and we will confirm.' },
      { title: 'Approve the budget', body: 'The shopping budget plus a flat ₦1,500 service fee is held, not charged as a final total.' },
      { title: 'Receive with receipts', body: 'We reconcile actual cost, return any change, and deliver with photographed receipts.' },
    ],
    faqs: [
      { q: 'What if prices are higher at the market?', a: 'Nothing extra is spent without your approval. You will get a prompt in the app or on WhatsApp to top up.' },
      { q: 'Do you cover every market?', a: 'Watt Market, Marian, Ikot Ishie, Anantigha and Akpabuyo are covered today. Tell us about others and we will route it.' },
      { q: 'Can businesses use market runs?', a: 'Yes. Restaurants and eateries book recurring runs for produce and foodstuff through vendor accounts.' },
    ],
  },
  {
    slug: 'waybills', name: 'Waybills & parcels', short: 'Weight-priced parcels to and from Calabar.',
    blurb: 'Drop at our Marian Road counter or book a pickup, get a live waybill number.',
    description: 'For parcels leaving Calabar, our waybill service uses tiered weight pricing and a printable tracking number. Weight is verified at the counter, declared-value cover is optional, and every parcel is scanned at dispatch and arrival.',
    image: '/images/waybill.jpg', priceFrom: '₦1,500', turnaround: '24 – 72 hrs', icon: 'box', quoteService: 'waybill',
    highlights: ['Under 5 kg from ₦1,500', 'Optional declared-value cover', 'Printable waybill with QR', 'Office drop-off or pickup'],
    steps: [
      { title: 'Weigh & price', body: 'Bring the parcel to Marian Road or book a pickup. We verify the weight and confirm the tier.' },
      { title: 'Get your waybill', body: 'Receive a waybill number and QR code you can share with the recipient.' },
      { title: 'Track to arrival', body: 'Every dispatch and arrival is scanned, with updates on the tracking page.' },
    ],
    faqs: [
      { q: 'How is weight measured?', a: 'We charge on actual weight or volumetric weight (L×W×H ÷ 5000), whichever is higher.' },
      { q: 'Do you move parcels inter-state?', a: 'Calabar to Uyo, Port Harcourt and Abuja hubs run daily. Other destinations are routed through partners.' },
      { q: 'Can I insure a parcel?', a: 'Yes — declare a value above ₦50,000 and we quote cover on the declared amount at the counter.' },
    ],
  },
  {
    slug: 'business-logistics', name: 'Business & vendor', short: 'Dispatch for restaurants, pharmacies and stores.',
    blurb: 'Bulk dispatch, contract rates, and a dashboard your team actually enjoys.',
    description: 'Restaurants, pharmacies, laundry, groceries and retail stores plug into DigiTrans for on-demand dispatch with contract pricing. Manage orders, see every active trip on one board, and export delivery reports for reconciliation.',
    image: '/images/vendor.jpg', priceFrom: 'Contract', turnaround: 'On demand', icon: 'chart', quoteService: 'business',
    highlights: ['Contract pricing & invoicing', 'Multi-stop order board', 'Monthly delivery reports', 'WhatsApp + dashboard ordering'],
    steps: [
      { title: 'Apply as a vendor', body: 'Send your business details and documents; approvals usually land within 24 hours.' },
      { title: 'Agree your rates', body: 'We set contract pricing for your volume, zones and delivery windows.' },
      { title: 'Dispatch & monitor', body: 'Order from the dashboard or WhatsApp and track every active delivery in one board.' },
    ],
    faqs: [
      { q: 'Is there a monthly fee?', a: 'No subscription. You pay per delivery at your contract rate, invoiced weekly or monthly.' },
      { q: 'Can riders collect cash?', a: 'Yes. Cash-on-delivery, POS and prepaid billing are supported and reconciled in your report.' },
      { q: 'Do you offer scheduled dispatch?', a: 'Recurring windows are available for high-volume eateries and pharmacies.' },
    ],
  },
  {
    slug: 'student-delivery', name: 'Student delivery', short: 'Verified students ride at a flat ₦500 campus rate.',
    blurb: 'Upload your ID once, then every campus trip is a flat rate.',
    description: 'Students at UNICAL and approved hostels around Calabar get a flat ₦500 rate within campus zones after a one-time verification. Upload your student ID and institution details; approval keeps your rate active until your eligibility expires.',
    image: '/images/depot.jpg', priceFrom: '₦500 flat', turnaround: '30 – 45 min', icon: 'user', quoteService: 'student',
    highlights: ['Flat ₦500 campus rate', 'One-time ID verification', 'Book from phone in 3 taps', 'Campus-wide coverage'],
    steps: [
      { title: 'Register as a student', body: 'Add your name, institution, department and student ID number.' },
      { title: 'Upload your ID card', body: 'A clear photo of your student ID is reviewed by our team, usually within a day.' },
      { title: 'Ride at the flat rate', body: 'Once approved, campus-zone deliveries are charged at ₦500 automatically.' },
    ],
    faqs: [
      { q: 'Which institutions are covered?', a: 'UNICAL and approved hostels around Ekorinim and 8 Miles.' },
      { q: 'How long does verification take?', a: 'Most IDs are approved within 24 hours. Unverified accounts stay on standard pricing.' },
      { q: 'Does the flat rate apply outside campus?', a: 'No. The ₦500 rate applies to campus zones; outside trips are standard-priced.' },
    ],
  },
  {
    slug: 'scheduled-pickups', name: 'Scheduled pickups', short: 'Recurring runs, planned a week ahead.',
    blurb: 'Lock a pickup window and we arrive within it — every time.',
    description: "For offices, pharmacies and food businesses that know tomorrow's route today. Schedule single or recurring pickups, set a time window, and we dispatch against it with the same live tracking and proof of delivery.",
    image: '/images/hero-courier.jpg', priceFrom: '₦1,200', turnaround: 'Book 24 hrs ahead', icon: 'clock', quoteService: 'standard',
    highlights: ['Recurring daily or weekly runs', 'Locked pickup windows', 'Same tracking & proof of delivery', 'Priority rider allocation'],
    steps: [
      { title: 'Set the window', body: 'Tell us the pickup location, drop-off and a one-hour window.' },
      { title: 'Lock the rider', body: 'We reserve a rider for the slot and confirm before the day starts.' },
      { title: 'Run it again', body: 'Repeat the booking daily, weekly, or whenever you need with one tap.' },
    ],
    faqs: [
      { q: 'How far ahead can I book?', a: 'Up to 14 days ahead, with recurring series available on vendor accounts.' },
      { q: 'What if my window changes?', a: 'Reschedule free of charge up to 3 hours before the window opens.' },
      { q: 'Do scheduled runs cost more?', a: 'No premium — the fare follows standard pricing, and contracts get their vendor rate.' },
    ],
  },
];

export const zones = [
  { id: 'duke-town', name: 'Duke Town', lga: 'Calabar Municipality', x: 3, y: 9, landmarks: ['Duke Town clock', 'Old Residency', 'Marina Road'] },
  { id: 'watt-market', name: 'Watt Market', lga: 'Calabar Municipality', x: 5, y: 8, landmarks: ['Watt Market', 'Harbour Road', 'Target Road'] },
  { id: 'marian', name: 'Marian', lga: 'Calabar Municipality', x: 8, y: 10, landmarks: ['Marian Road', 'Atekong Drive', 'Palm Street'] },
  { id: 'state-housing', name: 'State Housing', lga: 'Calabar Municipality', x: 9, y: 12, landmarks: ['State Housing Estate', 'Federal Housing', 'Big Qua'] },
  { id: 'ekorinim', name: 'Ekorinim', lga: 'Calabar Municipality', x: 12, y: 12, landmarks: ['Ekorinim Junction', 'Goldie Street', 'Hostel row'] },
  { id: 'unical', name: 'UNICAL Campus', lga: 'Calabar Municipality', x: 14, y: 14, campus: true, landmarks: ['UNICAL main gate', 'Faculty of Law', 'Staff quarters'] },
  { id: '8-miles', name: '8 Miles', lga: 'Calabar Municipality', x: 17, y: 18, landmarks: ['8 Miles Junction', 'Airport Road', 'Calabar free trade zone'] },
  { id: 'atakpa', name: 'Atakpa', lga: 'Calabar Municipality', x: 10, y: 7, landmarks: ['Atakpa', 'Parliament Road'] },
  { id: 'ikot-ishie', name: 'Ikot Ishie', lga: 'Calabar South', x: 4, y: 6, landmarks: ['Ikot Ishie market', 'Ndidem Usang Iso Road'] },
  { id: 'anantigha', name: 'Anantigha', lga: 'Calabar South', x: 6, y: 3, landmarks: ['Anantigha junction', 'Ekpo Abasi Street'] },
  { id: 'henshaw-town', name: 'Henshaw Town', lga: 'Calabar South', x: 3, y: 5, landmarks: ['Henshaw Town', 'Bedwell Street'] },
  { id: 'akpabuyo', name: 'Akpabuyo Town', lga: 'Akpabuyo', x: 6, y: -6, landmarks: ['Akpabuyo town', 'Ikot Nakanda road'] },
];

export const testimonials = [
  { quote: 'Our kitchen runs on DigiTrans now. Orders leave the counter in minutes, and the vendor dashboard replaced the notebook we used to keep by the phone.', name: 'Iniobong Effiong', role: 'Owner, Calabar Kitchen', detail: 'Vendor account · 1,400+ deliveries' },
  { quote: 'I send market lists from my office and everything arrives weighed, bagged and with receipts. The budget approval flow means I never overpay.', name: 'Grace Etim', role: 'Operations Lead, Marian Road Clinics', detail: 'Market runs · weekly' },
  { quote: 'The flat student rate makes a real difference. I order food and printouts to the hostel and it costs the same every single time.', name: 'Daniel Otu', role: 'UNICAL student', detail: 'Verified student · 2024' },
];

export const faqs = [
  { q: 'Where does DigiTrans deliver?', a: 'Across Calabar Municipality and Calabar South, with expanded runs to Akpabuyo and Odukpani. Every neighbourhood is grouped into a zone so pricing stays predictable.' },
  { q: 'How is my delivery fee calculated?', a: 'We use a hybrid engine: a base pickup fee plus a per-kilometre rate, with a minimum fare. Students on approved accounts, vendors on contract, and waybills by weight each follow their own rate card. You always see the breakdown before confirming.' },
  { q: 'Can I pay cash on delivery?', a: 'Yes. You can pay online, by bank transfer, or in cash to the rider on arrival. Vendors can also use prepaid billing with weekly reconciliation.' },
  { q: 'How do I become a rider?', a: 'Rider onboarding opens with your documents, a guarantor and acceptance of the rider agreement. The DigiTrans rider app handles the full onboarding flow and daily earnings once approved.' },
  { q: 'Do you deliver outside Calabar?', a: 'Our waybill service connects Calabar to Uyo, Port Harcourt and Abuja hubs daily, with partner routing elsewhere. Multi-city delivery is on our roadmap.' },
  { q: 'What happens if my parcel is damaged?', a: 'Report it from your tracking page within 24 hours of delivery. Every confirmed trip carries cover up to ₦50,000, and declared-value cover is available on waybills.' },
];

export const articles = [
  {
    slug: 'delivery-costs-in-calabar', title: 'What a delivery should actually cost in Calabar', category: 'Pricing', date: '4 November 2026', readTime: '5 min read',
    image: '/images/handover.jpg', imageAlt: 'A rider handing a parcel to a customer in Calabar',
    excerpt: 'Distance, weight and time of day move a fare more than anything else. Here is the arithmetic behind a typical Calabar trip, and the four extras worth paying for.',
    body: [
      { paragraphs: ['Most delivery quotes in Calabar are a single number with no breakdown, which makes it impossible to tell whether you are being charged for distance, weight or the weather. We publish our arithmetic instead: a base fee of ₦500 plus ₦250 per kilometre, with a ₦1,000 minimum.', 'That structure matters because Calabar is not a grid. A trip from Watt Market to State Housing is roughly 6.4 km of real road, which lands at ₦2,100. The same distance on the airport road behaves differently — longer stretches, fewer stops, and a rider who can hold a steady speed.'] },
      { heading: 'What actually moves the fare', paragraphs: [], bullets: ['Distance: ₦250 per kilometre after the base fee, measured on real routes rather than straight lines.', 'Weight: waybills move to a flat ₦3,000 between 5 kg and 10 kg, then ₦250 per kilogram above that.', 'Time: priority dispatch adds ₦700 and pulls a rider off the bench immediately.', 'Handling: fragile or awkward loads add ₦400, including the packing material.'] },
      { heading: 'The extras worth paying for', paragraphs: ['Priority is worth it when the parcel is the point — a passport, a signed document, medication. Careful handling is worth it when the item cannot be replaced locally. Everything else about a fare should be predictable, which is why we do not add a charge at the door.', 'If a fare ever looks wrong, the dispatch desk can replay the route and the timestamps. That is the whole reason every stop is recorded.'] },
    ],
  },
  {
    slug: 'market-run-checklist', title: 'How to send a market list that comes back right', category: 'Market runs', date: '27 October 2026', readTime: '4 min read',
    image: '/images/market-run.jpg', imageAlt: 'A market runner collecting produce at Watt Market',
    excerpt: 'The difference between a good market run and a frustrating one is usually the list. Quantities, brands, budget caps and a photo of the thing you actually want.',
    body: [
      { paragraphs: ["Market runners are not mind readers, and a list that says ‘tomatoes, peppers, enough for the week’ will always come back with somebody's judgement call attached. A better list names quantities in the units the market sells, and says what to do when the price is different from what you expected."] },
      { heading: 'Five things every list should include', paragraphs: [], bullets: ['Quantity in market units — a paint bucket, a basket, a specific number of tubers.', 'Brand or grade where it matters, plus an acceptable substitute.', 'A spending cap, and a rule for what happens if the market is above it.', 'Where the runner should call you — a WhatsApp number that will actually be answered.', 'A delivery window, so the runner can plan the order of the market before heading out.'] },
      { heading: 'How the budget works', paragraphs: ["A market run holds your shopping budget rather than charging it. The flat ₦1,500 service fee covers the runner's time and the trip. At the end, we reconcile the actual receipts, return any unspent balance, and send photographs of every receipt with the delivery.", 'If something costs more than expected, nothing extra is spent without your approval. You get a prompt, you decide, and the run continues or stops there.'] },
    ],
  },
  {
    slug: 'sending-parcels-out-of-calabar', title: 'Sending a parcel out of Calabar, without the guesswork', category: 'Waybills', date: '20 October 2026', readTime: '6 min read',
    image: '/images/waybill.jpg', imageAlt: 'A waybill parcel being labelled at the counter',
    excerpt: 'Waybills are priced by weight, scanned at both ends, and tracked with a printable number. Here is how the tiers work and what declared-value cover actually protects.',
    body: [
      { paragraphs: ['A waybill is the closest thing logistics has to a receipt for the journey itself. Ours carries a number, a QR code, and a scan at dispatch and at arrival, so the parcel position is a fact rather than a phone call.', 'Pricing follows weight tiers: ₦1,500 under 5 kg, ₦3,000 between 5 kg and 10 kg, then ₦250 per kilogram above 10 kg. Volumetric weight (length × width × height ÷ 5000) applies when a parcel is bulky but light, which is the same rule the airlines use.'] },
      { heading: 'Routes we run', paragraphs: ['Calabar to Uyo, Port Harcourt and Abuja move daily through our hubs. Destinations outside those corridors are routed through partner carriers, with the same waybill number following the parcel.'] },
      { heading: 'What cover means', paragraphs: ['Every confirmed trip carries cover up to ₦50,000 for loss or damage in transit. If a parcel is worth more, declare the value at the counter and we quote cover on the declared amount — a small percentage, quoted before you pay, not a surprise line on a claim form.', 'Prohibited items are the usual list: cash, live animals, hazardous materials and anything illegal. Perishables travel on market runs or priority bookings, where the delivery window is short enough to matter.'] },
    ],
  },
];

export const legalPages = {
  '/terms': { eyebrow: 'Service terms', title: 'Terms & conditions', lead: 'Clear expectations for every delivery and account.', sections: [['Using the service', 'Provide accurate booking and account information. Do not submit prohibited or unsafe items. Pricing and availability are confirmed by the platform when you request a service.'], ['Delivery and payment', 'Delivery timelines are estimates and can change with traffic, weather and operational conditions. A payment is considered confirmed only after provider-side verification.'], ['Accounts', 'Keep your login details private and contact DigiTrans if you believe your account has been used without permission.']] },
  '/privacy': { eyebrow: 'Your information', title: 'Privacy policy', lead: 'DigiTrans uses personal information to provide logistics services, keep accounts secure and support customers.', sections: [['What we use', 'We use account details to manage bookings and service communication. Private identity documents are restricted to authorised review workflows.'], ['Records and security', 'Financial records and audit activity are retained for reconciliation. Access is controlled by role and sensitive documents are not made public.'], ['Your choices', 'Contact the support team to ask about your information or request help with your account.']] },
  '/prohibited-items': { eyebrow: 'Safety first', title: 'What we can’t carry.', lead: 'Every parcel must be safe, lawful and packed for the selected delivery method.', sections: [['Not accepted', 'Illegal drugs, weapons, explosives, ammunition or hazardous chemicals. Cash, negotiable instruments or high-value items without prior approval. Live animals, unsafe fuel and items prohibited by law or the selected logistics partner.'], ['If you are unsure', 'Contact the operations team before submitting a request. Operations may inspect, hold or reject an item that does not meet these rules.']] },
  '/delivery-refund': { eyebrow: 'Service policy', title: 'Delivery, cancellation and refunds.', lead: 'Each service type follows its own operational and payment workflow. The latest fare and eligibility rules shown at checkout apply to your request.', sections: [['Cancellation', 'Eligible unassigned deliveries may be cancelled from your account. Once a rider is dispatched, cancellation may need an operations review.'], ['Refunds', 'Refunds are linked to the original payment and require an approved review. Contact support with your booking reference if a service is incomplete.']] },
  '/investment-risk': { eyebrow: 'Important disclosure', title: 'Investment involves risk.', lead: 'Investment information on DigiTrans is not financial, legal or tax advice. An application is not an offer, approval or guarantee of a return.', sections: [['Before applying', 'Read the current agreement and all risk disclosures before applying. Projected returns are estimates; they are not actual earnings or guaranteed payments.'], ['Risk', 'Investment opportunities can be delayed, suspended or lose value. Do not invest money you cannot afford to lose. Seek independent professional advice and review applicable laws before proceeding.']] },
};
