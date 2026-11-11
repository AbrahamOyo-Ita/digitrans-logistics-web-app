"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, CircleCheck, Loader2, Minus, Plus, ShieldCheck } from "lucide-react";
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
      <div className="rounded-2xl border border-line bg-white p-8 text-center shadow-[var(--shadow-card)]">
        <span className="mx-auto grid size-14 place-items-center rounded-full bg-success/10 text-success">
          <CircleCheck className="size-7" />
        </span>
        <h2 className="display-3 mt-5 text-navy">Booking request received</h2>
        <p className="mx-auto mt-2 max-w-md text-[0.9375rem] leading-relaxed text-slate-ink">
          Dispatch has your request for {SERVICE_LABELS[service].toLowerCase()} at an estimated{" "}
          <strong className="font-semibold text-navy">{formatNaira(result.total)}</strong>. A rider is
          matched within minutes and you’ll get the tracking reference by SMS.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Link href="/track" className="btn btn-primary">
            Track this delivery
          </Link>
          <button type="button" onClick={() => setState("idle")} className="btn btn-outline">
            Book another
          </button>
        </div>
        <p className="mt-5 text-[0.6875rem] text-muted">
          Preview build — no payment is taken and no rider is dispatched.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
      <div className="relative space-y-5">
        <fieldset className="rounded-2xl border border-line bg-white p-5 pt-6 shadow-[var(--shadow-card)] sm:p-6 sm:pt-7">
          <legend className="px-1 text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-muted">
            1 · Service
          </legend>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {serviceOptions.map((option) => {
              const active = service === option;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => setService(option)}
                  className={cn(
                    "rounded-xl border px-3 py-3 text-left text-[0.8125rem] font-medium transition",
                    active
                      ? "border-cyan bg-cyan/10 text-navy ring-1 ring-cyan"
                      : "border-line text-slate-ink hover:border-navy/25 hover:bg-mist"
                  )}
                  aria-pressed={active}
                >
                  <span className="flex items-center justify-between gap-2">
                    {SERVICE_LABELS[option]}
                    <span
                      className={cn(
                        "grid size-4 place-items-center rounded-full border",
                        active ? "border-cyan bg-cyan text-white" : "border-line text-transparent"
                      )}
                    >
                      <Check className="size-2.5" strokeWidth={4} />
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>

        <fieldset className="rounded-2xl border border-line bg-white p-5 pt-6 shadow-[var(--shadow-card)] sm:p-6 sm:pt-7">
          <legend className="px-1 text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-muted">
            2 · Route &amp; details
          </legend>

          <div className="mt-3 grid gap-4 sm:grid-cols-2">
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
              <input id="q-pickup-detail" className="field" placeholder="e.g. 14 Marian Road, by the bank" />
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
            <div className="mt-4">
              <label className="field-label" htmlFor="q-weight">
                Parcel weight · {weight} kg
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

          <div className="mt-4 flex flex-wrap gap-2">
            {[
              { label: "Priority delivery", value: urgent, set: setUrgent, note: `+${formatNaira(700)}` },
              { label: "Careful handling", value: fragile, set: setFragile, note: `+${formatNaira(400)}` },
            ].map((toggle) => (
              <button
                key={toggle.label}
                type="button"
                onClick={() => toggle.set(!toggle.value)}
                aria-pressed={toggle.value}
                className={cn(
                  "inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-[0.8125rem] transition",
                  toggle.value ? "border-cyan bg-cyan/10 text-navy" : "border-line text-slate-ink hover:border-navy/25"
                )}
              >
                <span
                  className={cn(
                    "grid size-4 place-items-center rounded border",
                    toggle.value ? "border-cyan bg-cyan text-white" : "border-line text-transparent"
                  )}
                >
                  <Check className="size-2.5" strokeWidth={4} />
                </span>
                {toggle.label}
                <span className="text-[0.6875rem] text-muted">{toggle.note}</span>
              </button>
            ))}
          </div>
        </fieldset>

        {service === "market-run" && (
          <fieldset className="rounded-2xl border border-line bg-white p-5 shadow-[var(--shadow-card)] sm:p-6">
            <legend className="px-1 text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-muted">
              3 · Shopping list
            </legend>
            <div className="mt-3 space-y-2">
              {items.map((item, index) => (
                <div key={index} className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-2">
                  <input
                    className="field text-[0.8125rem]"
                    value={item.name}
                    onChange={(e) => updateItem(index, { name: e.target.value })}
                    placeholder="Item"
                    aria-label={`Item ${index + 1} name`}
                  />
                  <div className="flex items-center rounded-lg border border-line">
                    <button
                      type="button"
                      className="grid size-9 place-items-center text-muted transition hover:text-navy"
                      onClick={() => updateItem(index, { qty: Math.max(1, item.qty - 1) })}
                      aria-label="Decrease quantity"
                    >
                      <Minus className="size-3.5" />
                    </button>
                    <span className="w-6 text-center text-[0.8125rem] font-medium tabular-nums">{item.qty}</span>
                    <button
                      type="button"
                      className="grid size-9 place-items-center text-muted transition hover:text-navy"
                      onClick={() => updateItem(index, { qty: item.qty + 1 })}
                      aria-label="Increase quantity"
                    >
                      <Plus className="size-3.5" />
                    </button>
                  </div>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[0.8125rem] text-muted">
                      ₦
                    </span>
                    <input
                      type="number"
                      min={0}
                      step={100}
                      className="field w-24 pl-6 text-[0.8125rem] tabular-nums"
                      value={item.price}
                      onChange={(e) => updateItem(index, { price: Number(e.target.value) })}
                      aria-label={`Estimated price for item ${index + 1}`}
                    />
                  </div>
                  <span className="w-20 text-right text-[0.8125rem] font-medium tabular-nums text-navy">
                    {formatNaira(item.price * item.qty)}
                  </span>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setItems((prev) => [...prev, { name: "", qty: 1, price: 0 }])}
              className="mt-3 inline-flex items-center gap-1.5 text-[0.8125rem] font-semibold text-cyan"
            >
              <Plus className="size-3.5" /> Add another item
            </button>
          </fieldset>
        )}
      </div>

      {/* Summary */}
      <aside className="lg:sticky lg:top-24">
        <div className="overflow-hidden rounded-2xl border border-navy/10 bg-navy text-white shadow-[var(--shadow-lift)]">
          <div className="p-5 sm:p-6">
            <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-cyan-300">
              {SERVICE_LABELS[service]}
            </p>
            <p className="mt-1.5 font-display text-[2rem] font-bold leading-none tracking-tight">
              {formatNaira(result.total)}
            </p>
            <p className="mt-1.5 text-[0.75rem] text-white/55">
              {result.distanceKm.toFixed(1)} km · {result.etaMinutes[0]}–{result.etaMinutes[1]} min ETA
            </p>

            <div className="mt-5 space-y-1.5 border-t border-white/10 pt-4">
              {result.fares.map((line, i) => (
                <div key={`${line.label}-${i}`} className="flex items-baseline justify-between gap-3 text-[0.8125rem]">
                  <span className="text-white/60">
                    {line.label}
                    {line.detail && <span className="block text-[0.6875rem] text-white/35">{line.detail}</span>}
                  </span>
                  <span
                    className={cn(
                      "shrink-0 font-medium tabular-nums",
                      line.tone === "discount" ? "text-emerald-300" : line.tone === "surcharge" ? "text-amber-300" : "text-white/90"
                    )}
                  >
                    {formatNaira(line.amount)}
                  </span>
                </div>
              ))}
            </div>

            {result.notice && (
              <p className="mt-4 rounded-lg border border-white/10 bg-white/5 p-2.5 text-[0.6875rem] leading-relaxed text-white/55">
                {result.notice}
              </p>
            )}
          </div>

          <div className="border-t border-white/10 bg-navy-700/60 p-5 sm:p-6">
            <div className="grid gap-2">
              <label className="sr-only" htmlFor="q-phone">
                Your phone number
              </label>
              <input
                id="q-phone"
                required
                inputMode="tel"
                placeholder="Your phone number"
                className="field border-white/15 bg-white/10 text-white placeholder:text-white/35 focus:bg-white/15"
              />
              <button type="submit" className="btn btn-primary w-full" disabled={state === "submitting"}>
                {state === "submitting" ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> Reserving a rider…
                  </>
                ) : (
                  <>
                    Request this delivery <ArrowRight className="size-4" />
                  </>
                )}
              </button>
            </div>
            <p className="mt-3 flex items-start gap-1.5 text-[0.6875rem] leading-relaxed text-white/45">
              <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-cyan-300" />
              No payment is taken now. You confirm the final fare before dispatch in the next step.
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-line bg-white p-4 text-[0.75rem] leading-relaxed text-slate-ink">
          <strong className="font-semibold text-navy">Need it in a hurry?</strong> Call the dispatch desk on{" "}
          <a href="tel:+2348012345678" className="font-medium text-cyan">
            +234 801 234 5678
          </a>{" "}
          and we’ll book it for you.
        </div>
      </aside>
    </form>
  );
}
