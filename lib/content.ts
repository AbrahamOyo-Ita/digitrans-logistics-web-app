export const site = {
  name: "DigiTrans Logistics",
  tagline: "Delivery, market runs and waybills across Calabar.",
  phone: "+234 801 234 5678",
  phoneHref: "tel:+2348012345678",
  whatsapp: "+234 801 234 5678",
  whatsappHref: "https://wa.me/2348012345678",
  email: "hello@digitrans.ng",
  emailHref: "mailto:hello@digitrans.ng",
  address: "18 Marian Road, Calabar Municipality, Cross River State",
  hours: "Mon – Sat · 7:00 – 20:00",
  founded: 2021,
  stats: {
    deliveries: "38,000+",
    riders: "240",
    onTime: "97.4%",
    partners: "180+",
  },
  socials: [
    { label: "Instagram", href: "https://instagram.com", icon: "instagram" as const },
    { label: "Facebook", href: "https://facebook.com", icon: "facebook" as const },
    { label: "LinkedIn", href: "https://linkedin.com", icon: "linkedin" as const },
    { label: "X", href: "https://x.com", icon: "x" as const },
  ],
};

export type Service = {
  slug: string;
  name: string;
  short: string;
  blurb: string;
  description: string;
  image: string;
  priceFrom: string;
  turnaround: string;
  icon: "truck" | "basket" | "package" | "store" | "student" | "clock";
  highlights: string[];
  steps: { title: string; body: string }[];
  faqs: { q: string; a: string }[];
};

export const services: Service[] = [
  {
    slug: "standard-delivery",
    name: "Standard delivery",
    short: "Same-day parcels, anywhere in Calabar.",
    blurb: "Book a rider in under a minute and watch every stop on the live timeline.",
    description:
      "From a single document in Duke Town to a full order in State Housing, our riders move your items across Calabar with live tracking and a proof-of-delivery photo on every drop. Charges are calculated before you confirm, so there is never a surprise at the door.",
    image: "/images/handover.jpg",
    priceFrom: "₦1,000",
    turnaround: "60 – 120 min",
    icon: "truck",
    highlights: [
      "Live tracking with rider contact",
      "Photo + signature proof of delivery",
      "Distance-based pricing from ₦1,000",
      "Insured on every confirmed trip",
    ],
    steps: [
      { title: "Tell us the route", body: "Pick a pickup and drop-off zone — or type a landmark for exact pricing." },
      { title: "Confirm the fare", body: "You see the fare breakdown before booking. Pay online, by transfer, or cash to the rider." },
      { title: "Track to the door", body: "Follow status updates and share your tracking link with the recipient." },
    ],
    faqs: [
      { q: "How fast is a standard delivery?", a: "Most Calabar trips are picked up within 20 minutes and delivered inside 60 – 120 minutes." },
      { q: "What can't I send?", a: "Cash, illegal items, live animals and hazardous materials are excluded. Perishables need a market run or priority booking." },
      { q: "Is there insurance?", a: "Every confirmed delivery carries cover up to ₦50,000 for loss or damage in transit. Declared-value cover is available on waybills." },
    ],
  },
  {
    slug: "market-runs",
    name: "Market runs",
    short: "We shop Watt Market so you don’t have to.",
    blurb: "Send your list, approve the budget, get the goods plus your receipt.",
    description:
      "Skip the traffic and the haggling. Send us your list, set a spending cap, and a trained market runner will buy at Watt Market, Marian or Ikot Ishie and deliver to your door — with receipts and any unspent balance returned.",
    image: "/images/market-run.jpg",
    priceFrom: "₦1,500 + budget",
    turnaround: "90 – 150 min",
    icon: "basket",
    highlights: [
      "Receipts for every purchase",
      "Budget approval before extra spend",
      "Trained market runners",
      "Unspent balance returned",
    ],
    steps: [
      { title: "Write your list", body: "Add items, quantities and an estimated price for each. Not sure? Leave it blank and we will confirm." },
      { title: "Approve the budget", body: "The shopping budget plus a flat ₦1,500 service fee is held, not charged as a final total." },
      { title: "Receive with receipts", body: "We reconcile actual cost, return any change, and deliver with photographed receipts." },
    ],
    faqs: [
      { q: "What if prices are higher at the market?", a: "Nothing extra is spent without your approval. You will get a prompt in the app or on WhatsApp to top up." },
      { q: "Do you cover every market?", a: "Watt Market, Marian, Ikot Ishie, Anantigha and Akpabuyo are covered today. Tell us about others and we will route it." },
      { q: "Can businesses use market runs?", a: "Yes. Restaurants and eateries book recurring runs for produce and foodstuff through vendor accounts." },
    ],
  },
  {
    slug: "waybills",
    name: "Waybills & parcels",
    short: "Weight-priced parcels to and from Calabar.",
    blurb: "Drop at our Marian Road counter or book a pickup, get a live waybill number.",
    description:
      "For parcels leaving Calabar, our waybill service uses tiered weight pricing and a printable tracking number. Weight is verified at the counter, declared-value cover is optional, and every parcel is scanned at dispatch and arrival.",
    image: "/images/waybill.jpg",
    priceFrom: "₦1,500",
    turnaround: "24 – 72 hrs",
    icon: "package",
    highlights: [
      "Under 5 kg from ₦1,500",
      "Optional declared-value cover",
      "Printable waybill with QR",
      "Office drop-off or pickup",
    ],
    steps: [
      { title: "Weigh & price", body: "Bring the parcel to Marian Road or book a pickup. We verify the weight and confirm the tier." },
      { title: "Get your waybill", body: "Receive a waybill number and QR code you can share with the recipient." },
      { title: "Track to arrival", body: "Every dispatch and arrival is scanned, with updates on the tracking page." },
    ],
    faqs: [
      { q: "How is weight measured?", a: "We charge on actual weight or volumetric weight (L×W×H ÷ 5000), whichever is higher." },
      { q: "Do you move parcels inter-state?", a: "Calabar to Uyo, Port Harcourt and Abuja hubs run daily. Other destinations are routed through partners." },
      { q: "Can I insure a parcel?", a: "Yes — declare a value above ₦50,000 and we quote cover on the declared amount at the counter." },
    ],
  },
  {
    slug: "business-logistics",
    name: "Business & vendor",
    short: "Dispatch for restaurants, pharmacies and stores.",
    blurb: "Bulk dispatch, contract rates, and a dashboard your team actually enjoys.",
    image: "/images/vendor.jpg",
    priceFrom: "Contract",
    turnaround: "On demand",
    description:
      "Restaurants, pharmacies, laundry, groceries and retail stores plug into DigiTrans for on-demand dispatch with contract pricing. Manage orders, see every active trip on one board, and export delivery reports for reconciliation.",
    icon: "store",
    highlights: [
      "Contract pricing & invoicing",
      "Multi-stop order board",
      "Monthly delivery reports",
      "WhatsApp + dashboard ordering",
    ],
    steps: [
      { title: "Apply as a vendor", body: "Send your business details and documents; approvals usually land within 24 hours." },
      { title: "Agree your rates", body: "We set contract pricing for your volume, zones and delivery windows." },
      { title: "Dispatch & monitor", body: "Order from the dashboard or WhatsApp and track every active delivery in one board." },
    ],
    faqs: [
      { q: "Is there a monthly fee?", a: "No subscription. You pay per delivery at your contract rate, invoiced weekly or monthly." },
      { q: "Can riders collect cash?", a: "Yes. Cash-on-delivery, POS and prepaid billing are supported and reconciled in your report." },
      { q: "Do you offer scheduled dispatch?", a: "Recurring windows are available for high-volume eateries and pharmacies." },
    ],
  },
  {
    slug: "student-delivery",
    name: "Student delivery",
    short: "Verified students ride at a flat ₦500 campus rate.",
    blurb: "Upload your ID once, then every campus trip is a flat rate.",
    description:
      "Students at UNICAL, UNICROSS and other Calabar institutions get a flat ₦500 rate within campus zones after a one-time verification. Upload your student ID and institution details; approval keeps your rate active until your eligibility expires.",
    image: "/images/depot.jpg",
    priceFrom: "₦500 flat",
    turnaround: "30 – 45 min",
    icon: "student",
    highlights: [
      "Flat ₦500 campus rate",
      "One-time ID verification",
      "Book from phone in 3 taps",
      "Campus-wide coverage",
    ],
    steps: [
      { title: "Register as a student", body: "Add your name, institution, department and student ID number." },
      { title: "Upload your ID card", body: "A clear photo of your student ID is reviewed by our team, usually within a day." },
      { title: "Ride at the flat rate", body: "Once approved, campus-zone deliveries are charged at ₦500 automatically." },
    ],
    faqs: [
      { q: "Which institutions are covered?", a: "UNICAL, UNICROSS Calabar campus, and approved hostels around Ekorinim and 8 Miles." },
      { q: "How long does verification take?", a: "Most IDs are approved within 24 hours. Unverified accounts stay on standard pricing." },
      { q: "Does the flat rate apply outside campus?", a: "No. The ₦500 rate applies to campus zones; outside trips are standard-priced." },
    ],
  },
  {
    slug: "scheduled-pickups",
    name: "Scheduled pickups",
    short: "Recurring runs, planned a week ahead.",
    blurb: "Lock a pickup window and we arrive within it — every time.",
    description:
      "For offices, pharmacies and food businesses that know tomorrow's route today. Schedule single or recurring pickups, set a time window, and we dispatch against it with the same live tracking and proof of delivery.",
    image: "/images/hero-courier.jpg",
    priceFrom: "₦1,200",
    turnaround: "Book 24 hrs ahead",
    icon: "clock",
    highlights: [
      "Recurring daily or weekly runs",
      "Locked pickup windows",
      "Same tracking & proof of delivery",
      "Priority rider allocation",
    ],
    steps: [
      { title: "Set the window", body: "Tell us the pickup location, drop-off and a one-hour window." },
      { title: "Lock the rider", body: "We reserve a rider for the slot and confirm before the day starts." },
      { title: "Run it again", body: "Repeat the booking daily, weekly, or whenever you need with one tap." },
    ],
    faqs: [
      { q: "How far ahead can I book?", a: "Up to 14 days ahead, with recurring series available on vendor accounts." },
      { q: "What if my window changes?", a: "Reschedule free of charge up to 3 hours before the window opens." },
      { q: "Do scheduled runs cost more?", a: "No premium — the fare follows standard pricing, and contracts get their vendor rate." },
    ],
  },
];

export const zones = [
  { name: "Duke Town", note: "Old town pickups" },
  { name: "Watt Market", note: "Market runs" },
  { name: "Marian", note: "Office & retail" },
  { name: "State Housing", note: "Residential" },
  { name: "Ekorinim", note: "Student hostels" },
  { name: "UNICAL Campus", note: "Student flat rate" },
  { name: "8 Miles", note: "Airport road" },
  { name: "Ikot Ishie", note: "Market & homes" },
  { name: "Anantigha", note: "South Calabar" },
  { name: "Henshaw Town", note: "Old town" },
  { name: "Akpabuyo", note: "Expanded zone" },
  { name: "Atakpa", note: "Riverside" },
];

export const testimonials = [
  {
    quote:
      "Our kitchen runs on DigiTrans now. Orders leave the counter in minutes, and the vendor dashboard replaced the notebook we used to keep by the phone.",
    name: "Iniobong Effiong",
    role: "Owner, Calabar Kitchen",
    initials: "IE",
    rating: 5,
    detail: "Vendor account · 1,400+ deliveries",
  },
  {
    quote:
      "I send market lists from my office and everything arrives weighed, bagged and with receipts. The budget approval flow means I never overpay.",
    name: "Grace Etim",
    role: "Operations Lead, Marian Road Clinics",
    initials: "GE",
    rating: 5,
    detail: "Market runs · weekly",
  },
  {
    quote:
      "The flat student rate makes a real difference. I order food and printouts to the hostel and it costs the same every single time.",
    name: "Daniel Otu",
    role: "UNICAL student",
    initials: "DO",
    rating: 5,
    detail: "Verified student · 2024",
  },
];

export const faqs = [
  {
    q: "Where does DigiTrans deliver?",
    a: "Across Calabar Municipality and Calabar South, with expanded runs to Akpabuyo and Odukpani. Every neighbourhood is grouped into a zone so pricing stays predictable.",
  },
  {
    q: "How is my delivery fee calculated?",
    a: "We use a hybrid engine: a base pickup fee plus a per-kilometre rate, with a minimum fare. Students on approved accounts, vendors on contract, and waybills by weight each follow their own rate card. You always see the breakdown before confirming.",
  },
  {
    q: "Can I pay cash on delivery?",
    a: "Yes. You can pay online, by bank transfer, or in cash to the rider on arrival. Vendors can also use prepaid billing with weekly reconciliation.",
  },
  {
    q: "How do I become a rider?",
    a: "Rider onboarding opens with your documents, a guarantor and acceptance of the rider agreement. The DigiTrans rider app handles the full onboarding flow and daily earnings once approved.",
  },
  {
    q: "Do you deliver outside Calabar?",
    a: "Our waybill service connects Calabar to Uyo, Port Harcourt and Abuja hubs daily, with partner routing elsewhere. Multi-city delivery is on our roadmap.",
  },
  {
    q: "What happens if my parcel is damaged?",
    a: "Report it from your tracking page within 24 hours of delivery. Every confirmed trip carries cover up to ₦50,000, and declared-value cover is available on waybills.",
  },
];
