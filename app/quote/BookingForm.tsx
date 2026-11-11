"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, CircleCheck, Loader2, Minus, Plus } from "lucide-react";
import { SERVICE_LABELS, ZONES, estimate, formatNaira, type ServiceId } from "@/lib/pricing";
import { cn } from "@/lib/cn";

type Item = { name: string; qty: number; price: number };

const serviceOptions: ServiceId[] = ["standard", "market-run", "waybill", "business", "student"];

export function BookingForm() {
  const [service, setService] = useState<ServiceId>("standard");
  const [pickupZone, setPickupZone] = useState("watt-market");
  const [dropoffZone, setDropoffZone] = useState("state-housing");
  const [urgent, setUrgent] = useState(false);
  const [fragile, setFragile] = useState(false);
  const [weight, setWeight] = useState(4);
  const [items, setItems] = useState<Item[]>([
    { name: "Tomatoes (basket)", qty: 1, price: 2500 },
    { name: "Plantain (bunch)", qty: 2, price: 900 },
  ]);
  const [state, setState] = useState<"idle" | "submitting" | "done">("idle");

  const budget = items.reduce((sum, item) => sum + item.price * item.qty, 0);

  const result = useMemo(
    () =>
      estimate({
        service,
        pickupZone,
        dropoffZone,
        urgent,
        fragile,
        weightKg: weight,
        basketBudget: budget,
      }),
    [service, pickupZone, dropoffZone, urgent, fragile, weight, budget]
  );

  const updateItem = (index: number, patch: Partial<Item>) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setState("submitting");
    window.setTimeout(() => setState("done"), 900);
  };

  if (state === "done") {
    return (
      <div className="border border-line bg-white p-8 sm:p-12">
        <CircleCheck className="size-8 text-cyan" strokeWidth={1.5} />
        <h2 className="display-3 mt-5">Booking request received</h2>
        <p className="body-sm mt-3 max-w-lg">
          Dispatch has your request for {SERVICE_LABELS[service].toLowerCase()} at an estimated{" "}
          <strong className="font-medium text-navy">{formatNaira(result.total)}</strong>. A rider is
          matched within minutes and the tracking reference arrives by SMS.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link href="/track" className="btn btn-primary">
            Track this delivery
          </Link>
          <button type="button" onClick={() => setState("idle")} className="btn btn-outline">
            Book another
          </button>
        </div>
        <p className="mt-6 text-[0.75rem] text-muted">
          Preview build — no payment is taken and no rider is dispatched.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="grid gap-8 lg:grid-cols-12 lg:items-start">
      <div className="lg:col-span-7">
        {/* Service */}
        <fieldset className="border-b border-line pb-8">
          <legend className="sr-only">Service</legend>
          <p className="text-[0.6875rem] uppercase tracking-[0.14em] text-muted">01 · Service</p>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {serviceOptions.map((option) => {
              const active = service === option;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => setService(option)}
                  aria-pressed={active}
                  className={cn(
                    "flex items-center justify-between gap-2 border px-3.5 py-3 text-left text-[0.8125rem] transition-colors",
                    active ? "border-navy bg-navy text-white" : "border-line text-slate-ink hover:border-line-strong"
                  )}
                >
                  {SERVICE_LABELS[option]}
                  {active && <Check className="size-3.5 shrink-0" strokeWidth={2.5} />}
                </button>
              );
            })}
          </div>
        </fieldset>

        {/* Route */}
        <fieldset className="border-b border-line py-8">
          <legend className="sr-only">Route and details</legend>
          <p className="text-[0.6875rem] uppercase tracking-[0.14em] text-muted">02 · Route and details</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="field-label" htmlFor="q-pickup">
                Pickup zone
              </label>
              <select id="q-pickup" className="field" value={pickupZone} onChange={(e) => setPickupZone(e.target.value)}>
                {ZONES.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="field-label" htmlFor="q-dropoff">
                Drop-off zone
              </label>
              <select id="q-dropoff" className="field" value={dropoffZone} onChange={(e) => setDropoffZone(e.target.value)}>
                {ZONES.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="field-label" htmlFor="q-pickup-detail">
                Pickup landmark
              </label>
              <input id="q-pickup-detail" className="field" placeholder="14 Marian Road, by the bank" />
            </div>
            <div>
              <label className="field-label" htmlFor="q-recipient">
                Recipient phone
              </label>
              <input id="q-recipient" className="field" placeholder="080…" inputMode="tel" />
            </div>
            <div className="sm:col-span-2">
              <label className="field-label" htmlFor="q-notes">
                What are we moving?
              </label>
              <textarea
                id="q-notes"
                className="field min-h-24 resize-y"
                placeholder="Describe the item, plus any handling notes for the rider."
              />
            </div>
          </div>

          {service === "waybill" && (
            <div className="mt-5">
              <label className="field-label" htmlFor="q-weight">
                Parcel weight — {weight} kg
              </label>
              <input
                id="q-weight"
                type="range"
                min={1}
                max={25}
                value={weight}
                onChange={(e) => setWeight(Number(e.target.value))}
                className="w-full accent-cyan"
              />
              <div className="mt-1 flex justify-between text-[0.6875rem] text-muted">
                <span>1 kg</span>
                <span>25 kg</span>
              </div>
            </div>
          )}

          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            {[
              { label: "Priority delivery", note: `+${formatNaira(700)}`, value: urgent, set: setUrgent },
              { label: "Careful handling", note: `+${formatNaira(400)}`, value: fragile, set: setFragile },
            ].map((toggle) => (
              <button
                key={toggle.label}
                type="button"
                onClick={() => toggle.set(!toggle.value)}
                aria-pressed={toggle.value}
                className={cn(
                  "flex items-center justify-between border px-3.5 py-3 text-[0.8125rem] transition-colors",
                  toggle.value ? "border-navy bg-paper text-navy" : "border-line text-slate-ink hover:border-line-strong"
                )}
              >
                <span className="flex items-center gap-2.5">
                  <span
                    className={cn(
                      "grid size-4 place-items-center border",
                      toggle.value ? "border-navy bg-navy text-white" : "border-line-strong text-transparent"
                    )}
                  >
                    <Check className="size-2.5" strokeWidth={3.5} />
                  </span>
                  {toggle.label}
                </span>
                <span className="text-[0.75rem] text-muted">{toggle.note}</span>
              </button>
            ))}
          </div>
        </fieldset>

        {service === "market-run" && (
          <fieldset className="border-b border-line py-8">
            <legend className="sr-only">Shopping list</legend>
            <p className="text-[0.6875rem] uppercase tracking-[0.14em] text-muted">03 · Shopping list</p>
            <div className="mt-4 space-y-2">
              {items.map((item, index) => (
                <div key={index} className="grid grid-cols-[1fr_auto_auto] items-center gap-2 sm:grid-cols-[1fr_auto_auto_auto]">
                  <input
                    className="field"
                    value={item.name}
                    onChange={(e) => updateItem(index, { name: e.target.value })}
                    placeholder="Item"
                    aria-label={`Item ${index + 1} name`}
                  />
                  <div className="flex items-center border border-line-strong">
                    <button
                      type="button"
                      className="grid size-11 place-items-center text-muted transition-colors hover:text-navy"
                      onClick={() => updateItem(index, { qty: Math.max(1, item.qty - 1) })}
                      aria-label="Decrease quantity"
                    >
                      <Minus className="size-3.5" />
                    </button>
                    <span className="w-6 text-center text-[0.8125rem] tabular-nums">{item.qty}</span>
                    <button
                      type="button"
                      className="grid size-11 place-items-center text-muted transition-colors hover:text-navy"
                      onClick={() => updateItem(index, { qty: item.qty + 1 })}
                      aria-label="Increase quantity"
                    >
                      <Plus className="size-3.5" />
                    </button>
                  </div>
                  <div className="relative hidden sm:block">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[0.8125rem] text-muted">₦</span>
                    <input
                      type="number"
                      min={0}
                      step={100}
                      className="field w-28 pl-6 tabular-nums"
                      value={item.price}
                      onChange={(e) => updateItem(index, { price: Number(e.target.value) })}
                      aria-label={`Estimated price for item ${index + 1}`}
                    />
                  </div>
                  <span className="w-20 text-right text-[0.8125rem] tabular-nums text-navy">
                    {formatNaira(item.price * item.qty)}
                  </span>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setItems((prev) => [...prev, { name: "", qty: 1, price: 0 }])}
              className="mt-4 inline-flex items-center gap-1.5 text-[0.8125rem] font-medium text-navy underline decoration-line-strong underline-offset-4"
            >
              <Plus className="size-3.5" /> Add an item
            </button>
          </fieldset>
        )}

        <fieldset className="pt-8">
          <legend className="sr-only">Contact</legend>
          <p className="text-[0.6875rem] uppercase tracking-[0.14em] text-muted">04 · Your contact</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="field-label" htmlFor="q-name">
                Full name
              </label>
              <input id="q-name" required className="field" placeholder="Ada Effiong" autoComplete="name" />
            </div>
            <div>
              <label className="field-label" htmlFor="q-phone">
                Phone number
              </label>
              <input id="q-phone" required className="field" placeholder="080…" inputMode="tel" autoComplete="tel" />
            </div>
          </div>
          <label className="mt-4 flex items-start gap-2.5 text-[0.75rem] leading-relaxed text-muted">
            <input type="checkbox" defaultChecked className="mt-0.5 size-4 accent-navy" />
            Send the tracking link to the recipient by SMS when the rider collects the item.
          </label>
        </fieldset>
      </div>

      {/* Summary */}
      <aside className="lg:col-span-5">
        <div className="lg:sticky lg:top-24">
          <div className="border border-line bg-white">
            <div className="border-b border-line px-5 py-4">
              <p className="text-[0.6875rem] uppercase tracking-[0.14em] text-muted">{SERVICE_LABELS[service]}</p>
              <p className="mt-2 font-display text-[2rem] font-medium leading-none tracking-tight text-navy">
                {formatNaira(result.total)}
              </p>
              <p className="mt-2 text-[0.75rem] text-muted">
                {result.distanceKm.toFixed(1)} km · {result.etaMinutes[0]}–{result.etaMinutes[1]} min
              </p>
            </div>

            <div className="space-y-2 px-5 py-4">
              {result.fares.map((line, i) => (
                <div key={`${line.label}-${i}`} className="flex items-baseline justify-between gap-3 text-[0.8125rem]">
                  <span className="text-slate-ink">
                    {line.label}
                    {line.detail && <span className="block text-[0.6875rem] text-muted">{line.detail}</span>}
                  </span>
                  <span className={cn("shrink-0 tabular-nums", line.tone === "discount" ? "text-success" : "text-navy")}>
                    {line.tone === "discount" ? "−" : ""}
                    {formatNaira(Math.abs(line.amount))}
                  </span>
                </div>
              ))}
              <div className="flex justify-between border-t border-line pt-2.5 text-[0.875rem] font-medium text-navy">
                <span>Total</span>
                <span className="tabular-nums">{formatNaira(result.total)}</span>
              </div>
              {result.notice && <p className="pt-1 text-[0.6875rem] leading-relaxed text-muted">{result.notice}</p>}
            </div>

            <div className="border-t border-line p-5">
              <button type="submit" className="btn btn-primary w-full" disabled={state === "submitting"}>
                {state === "submitting" ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> Reserving a rider
                  </>
                ) : (
                  <>
                    Request this delivery <ArrowRight className="size-4" />
                  </>
                )}
              </button>
              <p className="mt-3 text-center text-[0.6875rem] leading-relaxed text-muted">
                No payment now. You confirm the final fare before dispatch.
              </p>
            </div>
          </div>

          <div className="mt-4 border border-line p-5">
            <p className="text-[0.875rem] font-medium text-navy">Prefer to talk?</p>
            <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-slate-ink">
              Dispatch answers Mon–Sat, 7am–8pm, on{" "}
              <a href="tel:+2348012345678" className="font-medium text-navy underline decoration-line-strong underline-offset-2">
                +234 801 234 5678
              </a>
              .
            </p>
          </div>
        </div>
      </aside>
    </form>
  );
}
