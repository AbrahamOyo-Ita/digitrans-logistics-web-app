"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowRightLeft, Check, Clock } from "lucide-react";
import { ZONES, estimate, formatNaira, waybillTier, type ServiceId } from "@/lib/pricing";
import { cn } from "@/lib/cn";

const tabs: { id: ServiceId; label: string }[] = [
  { id: "standard", label: "Delivery" },
  { id: "market-run", label: "Market run" },
  { id: "waybill", label: "Waybill" },
];

export function QuoteWidget({
  variant = "panel",
  defaultService = "standard",
}: {
  variant?: "panel" | "full";
  defaultService?: ServiceId;
}) {
  const [service, setService] = useState<ServiceId>(defaultService);
  const [pickupZone, setPickupZone] = useState("watt-market");
  const [dropoffZone, setDropoffZone] = useState("state-housing");
  const [urgent, setUrgent] = useState(false);
  const [weight, setWeight] = useState(3);
  const [budget, setBudget] = useState(8000);

  const result = useMemo(
    () =>
      estimate({
        service,
        pickupZone,
        dropoffZone,
        urgent,
        weightKg: weight,
        basketBudget: budget,
      }),
    [service, pickupZone, dropoffZone, urgent, weight, budget]
  );

  const swap = () => {
    setPickupZone(dropoffZone);
    setDropoffZone(pickupZone);
  };

  return (
    <div className={cn(variant === "panel" && "border border-line bg-white")}>
      {/* Service tabs */}
      <div className="flex border-b border-line" role="tablist" aria-label="Delivery type">
        {tabs.map((tab) => {
          const active = service === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={active}
              onClick={() => setService(tab.id)}
              className={cn(
                "relative flex-1 px-2 py-3.5 text-[0.8125rem] font-medium transition-colors",
                active ? "text-navy" : "text-muted hover:text-slate-ink"
              )}
            >
              {tab.label}
              <span
                className={cn(
                  "absolute inset-x-0 -bottom-px h-[2px] bg-navy transition-opacity",
                  active ? "opacity-100" : "opacity-0"
                )}
              />
            </button>
          );
        })}
      </div>

      <div className="p-5">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
          <div>
            <label className="field-label" htmlFor="pickup-zone">
              Pickup
            </label>
            <select
              id="pickup-zone"
              className="field text-[0.875rem]"
              value={pickupZone}
              onChange={(e) => setPickupZone(e.target.value)}
            >
              {ZONES.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={swap}
            className="mb-1 hidden size-9 place-items-center border border-line text-muted transition-colors hover:border-line-strong hover:text-navy sm:grid"
            aria-label="Swap pickup and drop-off"
          >
            <ArrowRightLeft className="size-3.5" />
          </button>

          <div>
            <label className="field-label" htmlFor="dropoff-zone">
              {service === "market-run" ? "Deliver to" : "Drop-off"}
            </label>
            <select
              id="dropoff-zone"
              className="field text-[0.875rem]"
              value={dropoffZone}
              onChange={(e) => setDropoffZone(e.target.value)}
            >
              {ZONES.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {service === "waybill" && (
          <div className="mt-4 animate-fade">
            <p className="field-label">Parcel weight</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Under 5 kg", value: 3 },
                { label: "5 – 10 kg", value: 8 },
                { label: "10 – 20 kg", value: 15 },
              ].map((w) => (
                <button
                  key={w.value}
                  type="button"
                  onClick={() => setWeight(w.value)}
                  className={cn(
                    "border px-2 py-2 text-[0.75rem] transition-colors",
                    weight === w.value
                      ? "border-navy bg-navy text-white"
                      : "border-line text-slate-ink hover:border-line-strong"
                  )}
                >
                  {w.label}
                  <span className={cn("mt-0.5 block text-[0.6875rem]", weight === w.value ? "text-white/60" : "text-muted")}>
                    {formatNaira(waybillTier(w.value).price)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {service === "market-run" && (
          <div className="mt-4 animate-fade">
            <p className="field-label">Shopping budget</p>
            <div className="grid grid-cols-3 gap-2">
              {[5000, 8000, 15000].map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => setBudget(b)}
                  className={cn(
                    "border px-2 py-2.5 text-[0.8125rem] transition-colors",
                    budget === b
                      ? "border-navy bg-navy text-white"
                      : "border-line text-slate-ink hover:border-line-strong"
                  )}
                >
                  {formatNaira(b)}
                </button>
              ))}
            </div>
          </div>
        )}

        <label className="mt-4 flex cursor-pointer items-start gap-2.5">
          <span
            className={cn(
              "mt-0.5 grid size-4 shrink-0 place-items-center border transition-colors",
              urgent ? "border-navy bg-navy text-white" : "border-line-strong text-transparent"
            )}
          >
            <Check className="size-2.5" strokeWidth={3.5} />
          </span>
          <input type="checkbox" checked={urgent} onChange={() => setUrgent(!urgent)} className="sr-only" />
          <span className="text-[0.8125rem] text-slate-ink">
            Priority delivery
            <span className="ml-1 text-muted">+{formatNaira(700)}</span>
          </span>
        </label>
      </div>

      {/* Fare */}
      <div className="border-t border-line bg-paper p-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[0.75rem] text-muted">
              {service === "market-run" ? "Budget plus service fee" : "Estimated total"}
            </p>
            <p className="mt-1 font-display text-[1.75rem] font-medium leading-none tracking-tight text-navy">
              {formatNaira(result.total)}
            </p>
          </div>
          <p className="flex items-center gap-1.5 pb-1 text-[0.75rem] text-muted">
            <Clock className="size-3.5" />
            {result.etaMinutes[0]}–{result.etaMinutes[1]} min
          </p>
        </div>

        {variant === "full" && (
          <div className="mt-5 space-y-2 border-t border-line pt-4">
            {result.fares.map((line, i) => (
              <div key={`${line.label}-${i}`} className="flex items-baseline justify-between gap-3 text-[0.8125rem]">
                <span className="text-slate-ink">
                  {line.label}
                  {line.detail && <span className="block text-[0.6875rem] text-muted">{line.detail}</span>}
                </span>
                <span
                  className={cn(
                    "shrink-0 tabular-nums",
                    line.tone === "discount" ? "text-success" : "text-navy"
                  )}
                >
                  {line.tone === "discount" ? "−" : ""}
                  {formatNaira(Math.abs(line.amount))}
                </span>
              </div>
            ))}
            <p className="flex justify-between border-t border-line pt-2.5 text-[0.8125rem] font-medium text-navy">
              <span>Total</span>
              <span className="tabular-nums">{formatNaira(result.total)}</span>
            </p>
            {result.notice && (
              <p className="pt-1 text-[0.6875rem] leading-relaxed text-muted">{result.notice}</p>
            )}
          </div>
        )}

        <Link href="/quote" className="btn btn-primary mt-5 w-full">
          Continue to booking
          <ArrowRight className="size-4" />
        </Link>
        <p className="mt-3 text-center text-[0.6875rem] text-muted">
          No payment now. You confirm the fare before a rider is dispatched.
        </p>
      </div>
    </div>
  );
}
