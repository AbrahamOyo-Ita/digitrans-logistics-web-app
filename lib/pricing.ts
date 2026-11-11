/**
 * DigiTrans hybrid pricing engine (public estimate).
 * Mirrors the PRD formula: Base fee + (distance x rate/km), with zone
 * fallback, student flat tariff, waybill weight tiers, vendor contracts
 * and optional surcharges. All amounts are integer Naira.
 */

export type ServiceId =
  | "standard"
  | "market-run"
  | "waybill"
  | "business"
  | "student"
  | "scheduled";

export type Zone = {
  id: string;
  name: string;
  short: string;
  lga: "Calabar South" | "Calabar Municipality" | "Akpabuyo" | "Odukpani";
  x: number;
  y: number;
  campus?: boolean;
};

/** Approximate coordinates in an abstract Calabar grid (km units, 1 unit ~ 1km). */
export const ZONES: Zone[] = [
  { id: "duke-town", name: "Duke Town", short: "Duke Town", lga: "Calabar Municipality", x: 3, y: 9 },
  { id: "watt-market", name: "Watt Market", short: "Watt Market", lga: "Calabar Municipality", x: 5, y: 8 },
  { id: "marian", name: "Marian", short: "Marian", lga: "Calabar Municipality", x: 8, y: 10 },
  { id: "state-housing", name: "State Housing", short: "State Housing", lga: "Calabar Municipality", x: 9, y: 12 },
  { id: "ekorinim", name: "Ekorinim", short: "Ekorinim", lga: "Calabar Municipality", x: 12, y: 12 },
  { id: "unical", name: "UNICAL Campus", short: "UNICAL", lga: "Calabar Municipality", x: 14, y: 14, campus: true },
  { id: "unicross", name: "UNICROSS (Calabar)", short: "UNICROSS", lga: "Calabar Municipality", x: 16, y: 15, campus: true },
  { id: "8-miles", name: "8 Miles", short: "8 Miles", lga: "Calabar Municipality", x: 17, y: 18 },
  { id: "ikot-ishie", name: "Ikot Ishie", short: "Ikot Ishie", lga: "Calabar South", x: 4, y: 6 },
  { id: "anantigha", name: "Anantigha", short: "Anantigha", lga: "Calabar South", x: 6, y: 3 },
  { id: "henshaw-town", name: "Henshaw Town", short: "Henshaw", lga: "Calabar South", x: 3, y: 5 },
  { id: "ediba", name: "Ediba", short: "Ediba", lga: "Calabar South", x: 2, y: 2 },
  { id: "akpabuyo", name: "Akpabuyo Town", short: "Akpabuyo", lga: "Akpabuyo", x: 6, y: -6 },
  { id: "atakpa", name: "Atakpa", short: "Atakpa", lga: "Calabar Municipality", x: 10, y: 7 },
];

export const ZONE_BY_ID = Object.fromEntries(ZONES.map((z) => [z.id, z])) as Record<string, Zone>;

export const SERVICE_LABELS: Record<ServiceId, string> = {
  standard: "Standard delivery",
  "market-run": "Market run",
  waybill: "Waybill / parcel",
  business: "Business & vendor",
  student: "Student delivery",
  scheduled: "Scheduled pickup",
};

export type EstimateInput = {
  service: ServiceId;
  pickupZone: string;
  dropoffZone: string;
  urgent?: boolean;
  fragile?: boolean;
  weightKg?: number;
  basketBudget?: number;
  verifiedStudent?: boolean;
};

export type EstimateLine = {
  label: string;
  detail?: string;
  amount: number;
  tone?: "neutral" | "discount" | "surcharge";
};

export type Estimate = {
  total: number;
  distanceKm: number;
  etaMinutes: [number, number];
  fares: EstimateLine[];
  notice?: string;
  zoneFallback: boolean;
};

export const PRICING = {
  baseFee: 500,
  ratePerKm: 250,
  minimumFee: 1_000,
  urgentSurcharge: 700,
  fragileSurcharge: 400,
  studentFlat: 500,
  vendorDiscountRate: 0.1,
  marketRunFee: 1_500,
  waybillTiers: [
    { maxKg: 5, price: 1_500, label: "Under 5 kg" },
    { maxKg: 10, price: 3_000, label: "5 – 10 kg" },
    { maxKg: Infinity, pricePerKg: 250, label: "Above 10 kg" },
  ],
} as const;

const roundTo = (value: number, step = 50) => Math.round(value / step) * step;

function distanceBetween(from: Zone, to: Zone) {
  const dx = from.x - to.x;
  const dy = from.y - to.y;
  const raw = Math.sqrt(dx * dx + dy * dy);
  // Road routes average ~1.28x straight-line distance.
  return Math.max(0.8, Math.round(raw * 1.28 * 10) / 10);
}

export function waybillTier(weightKg: number) {
  const tier = PRICING.waybillTiers.find((t) => weightKg <= t.maxKg) ?? PRICING.waybillTiers[2];
  if ("price" in tier) return { price: tier.price, label: tier.label };
  return { price: Math.round(weightKg * tier.pricePerKg), label: `${tier.label} · ₦${tier.pricePerKg}/kg` };
}

export function estimate(input: EstimateInput): Estimate {
  const from = ZONE_BY_ID[input.pickupZone];
  const to = ZONE_BY_ID[input.dropoffZone];
  const fares: EstimateLine[] = [];

  if (!from || !to) {
    return { total: 0, distanceKm: 0, etaMinutes: [0, 0], fares, zoneFallback: false };
  }

  const distanceKm = from.id === to.id ? 1.2 : distanceBetween(from, to);
  const zoneFallback = from.lga !== to.lga;

  if (input.service === "waybill") {
    const weight = input.weightKg ?? 3;
    const tier = waybillTier(weight);
    fares.push({ label: "Weight category", detail: tier.label, amount: tier.price });
    if (input.fragile) fares.push({ label: "Fragile handling", amount: PRICING.fragileSurcharge, tone: "surcharge" });
    const total = fares.reduce((sum, line) => sum + line.amount, 0);
    return {
      total,
      distanceKm,
      etaMinutes: [Math.round(24 + distanceKm * 4), Math.round(48 + distanceKm * 6)],
      fares,
      zoneFallback,
      notice:
        "Waybill pricing is confirmed at the office after weighing. Declared value cover is quoted separately.",
    };
  }

  if (input.service === "market-run") {
    const budget = Math.max(input.basketBudget ?? 5_000, 0);
    fares.push({ label: "Shopping budget (held)", detail: "Reconciled after purchase", amount: budget });
    fares.push({ label: "Market run service fee", detail: "Rider shopping + delivery", amount: PRICING.marketRunFee });
    if (input.urgent) fares.push({ label: "Priority slot", amount: PRICING.urgentSurcharge, tone: "surcharge" });
    return {
      total: fares.reduce((sum, line) => sum + line.amount, 0),
      distanceKm,
      etaMinutes: [75, 150],
      fares,
      zoneFallback,
      notice:
        "You only pay the service fee up front. Any change to the shopping budget needs your approval in-app.",
    };
  }

  if (input.service === "student" || input.verifiedStudent) {
    const eligible = (from.campus || to.campus) && input.verifiedStudent;
    if (eligible) {
      fares.push({ label: "Verified student flat rate", detail: "Campus zone delivery", amount: PRICING.studentFlat });
      return {
        total: PRICING.studentFlat,
        distanceKm,
        etaMinutes: [20, 40],
        fares,
        zoneFallback,
        notice: "Student pricing applies automatically once your ID is verified.",
      };
    }
    fares.push({ label: "Standard delivery fee", detail: "Student rate available after verification", amount: 0 });
  }

  const base = PRICING.baseFee;
  const distanceFee = roundTo(distanceKm * PRICING.ratePerKm, 50);
  fares.push({ label: "Base pickup fee", amount: base });
  fares.push({ label: "Distance charge", detail: `${distanceKm.toFixed(1)} km × ₦${PRICING.ratePerKm}/km`, amount: distanceFee });

  let subtotal = base + distanceFee;

  if (input.urgent) {
    fares.push({ label: "Priority delivery", detail: "Next available rider", amount: PRICING.urgentSurcharge, tone: "surcharge" });
    subtotal += PRICING.urgentSurcharge;
  }

  if (input.fragile) {
    fares.push({ label: "Careful handling", amount: PRICING.fragileSurcharge, tone: "surcharge" });
    subtotal += PRICING.fragileSurcharge;
  }

  if (subtotal < PRICING.minimumFee) {
    fares.push({ label: "Minimum fee top-up", amount: PRICING.minimumFee - subtotal });
    subtotal = PRICING.minimumFee;
  }

  if (input.service === "business") {
    const discount = -roundTo(subtotal * PRICING.vendorDiscountRate, 50);
    fares.push({ label: "Vendor contract rate", detail: "10% off standard tariff", amount: discount, tone: "discount" });
    subtotal += discount;
  }

  const eta: [number, number] = [Math.round(18 + distanceKm * 3.2), Math.round(34 + distanceKm * 5)];

  return { total: subtotal, distanceKm, etaMinutes: eta, fares, zoneFallback };
}

export function formatNaira(value: number) {
  return `₦${new Intl.NumberFormat("en-NG", { maximumFractionDigits: 0 }).format(Math.max(0, Math.round(value)))}`;
}

export function riderShare(total: number, rate = 0.25) {
  const rider = Math.round((total * rate) / 50) * 50;
  return { rider: Math.min(rider, total), company: total - Math.min(rider, total) };
}
