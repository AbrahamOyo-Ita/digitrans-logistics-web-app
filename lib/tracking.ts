export const DEMO_REFERENCES = ["DT-CAL-8842-5117", "DT-CAL-3016-7702", "DT-WB-4471-2200"] as const;

export type TrackEvent = { label: string; at: string; note: string };

export type TrackingResult = {
  reference: string;
  service: string;
  status: string;
  pickup: string;
  dropoff: string;
  recipient: string;
  rider: string;
  createdAt: string;
  events: TrackEvent[];
};

const now = Date.now();
const ago = (minutes: number) => new Date(now - minutes * 60_000).toISOString();

const records: Record<string, TrackingResult> = {
  "DT-CAL-8842-5117": {
    reference: "DT-CAL-8842-5117",
    service: "Standard delivery",
    status: "Out for delivery",
    pickup: "Watt Market",
    dropoff: "State Housing",
    recipient: "A. Bassey",
    rider: "Emeka O. · E-bike · CRD-114",
    createdAt: ago(96),
    events: [
      { label: "Booking confirmed", at: ago(96), note: "Fare held · ₦2,100" },
      { label: "Rider assigned", at: ago(90), note: "Emeka O. accepted the job" },
      { label: "Item collected", at: ago(77), note: "2 parcels scanned at Watt Market" },
      { label: "Out for delivery", at: ago(64), note: "En route to State Housing" },
    ],
  },
  "DT-CAL-3016-7702": {
    reference: "DT-CAL-3016-7702",
    service: "Market run",
    status: "Delivered",
    pickup: "Watt Market",
    dropoff: "Marian Road",
    recipient: "G. Etim",
    rider: "Blessing A. · Bicycle · CRD-072",
    createdAt: ago(1_460),
    events: [
      { label: "Request submitted", at: ago(1_460), note: "Shopping list · 7 items" },
      { label: "Shopping in progress", at: ago(1_420), note: "Budget approved · ₦8,000 held" },
      { label: "Purchase completed", at: ago(1_380), note: "Actual spend ₦7,480 · receipts uploaded" },
      { label: "Delivered", at: ago(1_340), note: "Signed by G. Etim · ₦520 balance returned" },
    ],
  },
  "DT-WB-4471-2200": {
    reference: "DT-WB-4471-2200",
    service: "Waybill · 5 – 10 kg",
    status: "Awaiting arrival scan",
    pickup: "Calabar (Marian Road office)",
    dropoff: "Uyo hub",
    recipient: "P. Okon",
    rider: "Line-haul · TRK-03",
    createdAt: ago(420),
    events: [
      { label: "Parcel received", at: ago(420), note: "Weighed 7.2 kg · tier 5 – 10 kg" },
      { label: "Waybill generated", at: ago(405), note: "Charged ₦3,000 · paid" },
      { label: "Dispatched from Calabar", at: ago(300), note: "Line-haul TRK-03 departed 14:20" },
    ],
  },
};

export function lookupTracking(reference: string): TrackingResult | null {
  return records[reference] ?? null;
}

export function generateReference() {
  return "DT-CAL-8842-5117";
}
