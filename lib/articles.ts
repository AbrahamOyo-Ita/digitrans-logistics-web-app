export type Article = {
  slug: string;
  title: string;
  category: string;
  date: string;
  readTime: string;
  image: string;
  imageAlt: string;
  excerpt: string;
  body: { heading?: string; paragraphs: string[]; bullets?: string[] }[];
};

export const articles: Article[] = [
  {
    slug: "delivery-costs-in-calabar",
    title: "What a delivery should actually cost in Calabar",
    category: "Pricing",
    date: "4 November 2026",
    readTime: "5 min read",
    image: "/images/handover.jpg",
    imageAlt: "A rider handing a parcel to a customer in Calabar",
    excerpt:
      "Distance, weight and time of day move a fare more than anything else. Here is the arithmetic behind a typical Calabar trip, and the four extras worth paying for.",
    body: [
      {
        paragraphs: [
          "Most delivery quotes in Calabar are a single number with no breakdown, which makes it impossible to tell whether you are being charged for distance, weight or the weather. We publish our arithmetic instead: a base fee of ₦500 plus ₦250 per kilometre, with a ₦1,000 minimum.",
          "That structure matters because Calabar is not a grid. A trip from Watt Market to State Housing is roughly 6.4 km of real road, which lands at ₦2,100. The same distance on the airport road behaves differently — longer stretches, fewer stops, and a rider who can hold a steady speed.",
        ],
      },
      {
        heading: "What actually moves the fare",
        paragraphs: [],
        bullets: [
          "Distance: ₦250 per kilometre after the base fee, measured on real routes rather than straight lines.",
          "Weight: waybills move to a flat ₦3,000 between 5 kg and 10 kg, then ₦250 per kilogram above that.",
          "Time: priority dispatch adds ₦700 and pulls a rider off the bench immediately.",
          "Handling: fragile or awkward loads add ₦400, including the packing material.",
        ],
      },
      {
        heading: "The extras worth paying for",
        paragraphs: [
          "Priority is worth it when the parcel is the point — a passport, a signed document, medication. Careful handling is worth it when the item cannot be replaced locally. Everything else about a fare should be predictable, which is why we do not add a charge at the door.",
          "If a fare ever looks wrong, the dispatch desk can replay the route and the timestamps. That is the whole reason every stop is recorded.",
        ],
      },
    ],
  },
  {
    slug: "market-run-checklist",
    title: "How to send a market list that comes back right",
    category: "Market runs",
    date: "27 October 2026",
    readTime: "4 min read",
    image: "/images/market-run.jpg",
    imageAlt: "A market runner collecting produce at Watt Market",
    excerpt:
      "The difference between a good market run and a frustrating one is usually the list. Quantities, brands, budget caps and a photo of the thing you actually want.",
    body: [
      {
        paragraphs: [
          "Market runners are not mind readers, and a list that says “tomatoes, peppers, enough for the week” will always come back with somebody's judgement call attached. A better list names quantities in the units the market sells, and says what to do when the price is different from what you expected.",
        ],
      },
      {
        heading: "Five things every list should include",
        paragraphs: [],
        bullets: [
          "Quantity in market units — a paint bucket, a basket, a specific number of tubers.",
          "Brand or grade where it matters, plus an acceptable substitute.",
          "A spending cap, and a rule for what happens if the market is above it.",
          "Where the runner should call you — a WhatsApp number that will actually be answered.",
          "A delivery window, so the runner can plan the order of the market before heading out.",
        ],
      },
      {
        heading: "How the budget works",
        paragraphs: [
          "A market run holds your shopping budget rather than charging it. The flat ₦1,500 service fee covers the runner's time and the trip. At the end, we reconcile the actual receipts, return any unspent balance, and send photographs of every receipt with the delivery.",
          "If something costs more than expected, nothing extra is spent without your approval. You get a prompt, you decide, and the run continues or stops there.",
        ],
      },
    ],
  },
  {
    slug: "sending-parcels-out-of-calabar",
    title: "Sending a parcel out of Calabar, without the guesswork",
    category: "Waybills",
    date: "20 October 2026",
    readTime: "6 min read",
    image: "/images/waybill.jpg",
    imageAlt: "A waybill parcel being labelled at the counter",
    excerpt:
      "Waybills are priced by weight, scanned at both ends, and tracked with a printable number. Here is how the tiers work and what declared-value cover actually protects.",
    body: [
      {
        paragraphs: [
          "A waybill is the closest thing logistics has to a receipt for the journey itself. Ours carries a number, a QR code, and a scan at dispatch and at arrival, so the parcel's position is a fact rather than a phone call.",
          "Pricing follows weight tiers: ₦1,500 under 5 kg, ₦3,000 between 5 kg and 10 kg, then ₦250 per kilogram above 10 kg. Volumetric weight (length × width × height ÷ 5000) applies when a parcel is bulky but light, which is the same rule the airlines use.",
        ],
      },
      {
        heading: "Routes we run",
        paragraphs: [
          "Calabar to Uyo, Port Harcourt and Abuja move daily through our hubs. Destinations outside those corridors are routed through partner carriers, with the same waybill number following the parcel.",
        ],
      },
      {
        heading: "What cover means",
        paragraphs: [
          "Every confirmed trip carries cover up to ₦50,000 for loss or damage in transit. If a parcel is worth more, declare the value at the counter and we quote cover on the declared amount — a small percentage, quoted before you pay, not a surprise line on a claim form.",
          "Prohibited items are the usual list: cash, live animals, hazardous materials and anything illegal. Perishables travel on market runs or priority bookings, where the delivery window is short enough to matter.",
        ],
      },
    ],
  },
];

export const ARTICLE_BY_SLUG = Object.fromEntries(articles.map((a) => [a.slug, a]));
