"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowRightLeft, Check, ChevronDown, Clock, MapPin, Package, ShoppingBasket, Zap } from "lucide-react";
import {
  SERVICE_LABELS,
  ZONES,
  estimate,
  formatNaira,
  waybillTier,
  type ServiceId,
} from "@/lib/pricing";
import { cn } from "@/lib/cn";

const tabs: { id: ServiceId; label: string; icon: typeof Package }[] = [
  { id: "standard", label: "Standard", icon: Package },
  { id: "market-run", label: "Market run", icon: ShoppingBasket },
  { id: "waybill", label: "Waybill", icon: MapPin },
];

export function QuoteWidget({
  variant = "hero",
  defaultService = "standard",
}: {
  variant?: "hero" | "full";
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
    <div className="w-full">
      {/* Tabs */}
      <div
        className={cn(
          "flex items-center gap-1 rounded-t-2xl border border-line bg-white px-2 pt-2",
          variant === "hero" && "rounded-t-2xl"
        )}
        role="tablist"
        aria-label="Delivery type"
      >
        {tabs.map((tab) => {
          const active = service === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={active}
              onClick={() => setService(tab.id)}
              className={cn(
                "relative -mb-px inline-flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-t-lg border-b-2 px-2 py-3 text-[0.8125rem] font-semibold transition sm:px-3 sm:text-sm",
                active
                  ? "border-cyan text-navy"
                  : "border-transparent text-muted hover:text-slate-ink"
              )}
            >
              <Icon className={cn("size-4", active ? "text-cyan" : "text-muted")} />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div
        className={cn(
          "rounded-b-2xl border border-t-0 border-line bg-white p-4 shadow-[0_30px_60px_-30px_rgba(10,27,53,0.35)] sm:p-5",
          variant === "full" && "rounded-2xl border-t sm:rounded-2xl"
        )}
      >
        <div className={cn("grid gap-3", variant === "full" ? "md:grid-cols-[1fr_auto_1fr]" : "sm:grid-cols-[1fr_auto_1fr]")}>
          <div>
            <label className="field-label" htmlFor="pickup-zone">
              Pickup zone
            </label>
            <div className="relative">
              <MapPin className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-cyan" />
              <select
                id="pickup-zone"
                className="field pl-9 pr-8 text-[0.875rem]"
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
          </div>

          <div className="flex items-end justify-center pb-1 sm:w-9">
            <button
              type="button"
              onClick={swap}
              className="grid size-9 place-items-center rounded-full border border-line text-muted transition hover:border-cyan hover:text-cyan"
              aria-label="Swap pickup and drop-off"
            >
              <ArrowRightLeft className="size-4" />
            </button>
          </div>

          <div>
            <label className="field-label" htmlFor="dropoff-zone">
              {service === "market-run" ? "Deliver to" : "Drop-off zone"}
            </label>
            <div className="relative">
              <MapPin className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-navy/40" />
              <select
                id="dropoff-zone"
                className="field pl-9 pr-8 text-[0.875rem]"
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
        </div>

        {service === "waybill" && (
          <div className="mt-3 animate-fade">
            <span className="field-label">Parcel weight</span>
            <div className="flex flex-wrap gap-2">
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
                    "rounded-lg border px-3 py-2 text-[0.8125rem] font-medium transition",
                    weight === w.value
                      ? "border-cyan bg-cyan/10 text-cyan-600"
                      : "border-line text-slate-ink hover:border-navy/30"
                  )}
                >
                  {w.label}
                  <span className="ml-1.5 text-muted">· {formatNaira(waybillTier(w.value).price)}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {service === "market-run" && (
          <div className="mt-3 animate-fade">
            <span className="field-label">Shopping budget</span>
            <div className="flex flex-wrap gap-2">
              {[5000, 8000, 15000].map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => setBudget(b)}
                  className={cn(
                    "rounded-lg border px-3 py-2 text-[0.8125rem] font-medium transition",
                    budget === b ? "border-cyan bg-cyan/10 text-cyan-600" : "border-line text-slate-ink hover:border-navy/30"
                  )}
                >
                  {formatNaira(b)}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-mist p-3">
          <button
            type="button"
            onClick={() => setUrgent(!urgent)}
            className="group inline-flex items-center gap-2.5 text-left"
            aria-pressed={urgent}
          >
            <span
              className={cn(
                "flex size-5 items-center justify-center rounded-md border transition",
                urgent ? "border-cyan bg-cyan text-white" : "border-line bg-white text-transparent"
              )}
            >
              <Check className="size-3.5" strokeWidth={3} />
            </span>
            <span>
              <span className="flex items-center gap-1 text-[0.8125rem] font-semibold text-navy">
                <Zap className="size-3.5 text-cyan" /> Priority delivery
              </span>
              <span className="text-[0.7rem] text-muted">Next available rider · +{formatNaira(700)}</span>
            </span>
          </button>

          <div className="text-right">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-muted">
              {service === "market-run" ? "Budget + fee" : "Estimated fare"}
            </p>
            <p className="font-display text-[1.6rem] font-bold leading-none tracking-tight text-navy">
              {formatNaira(result.total)}
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
          <Link href="/quote" className="btn btn-primary flex-1">
            Book this delivery
            <ArrowRight className="size-4" />
          </Link>
          {variant === "full" ? (
            <button type="button" className="btn btn-outline sm:w-auto">
              <Clock className="size-4" />
              Schedule for later
            </button>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-[0.75rem] text-muted sm:w-auto">
              <Clock className="size-3.5" />
              {result.etaMinutes[0]} – {result.etaMinutes[1]} min ETA
            </span>
          )}
        </div>

        {variant === "full" && (
          <div className="mt-4 space-y-1.5 border-t border-line pt-4">
            {result.fares.map((line, i) => (
              <div key={`${line.label}-${i}`} className="flex items-baseline justify-between text-[0.8125rem]">
                <span className="text-slate-ink">
                  {line.label}
                  {line.detail && <span className="ml-1.5 text-muted">· {line.detail}</span>}
                </span>
                <span
                  className={cn(
                    "font-medium tabular-nums",
                    line.tone === "discount" ? "text-success" : line.tone === "surcharge" ? "text-warning" : "text-navy"
                  )}
                >
                  {formatNaira(line.amount)}
                </span>
              </div>
            ))}
            <div className="flex items-baseline justify-between border-t border-line pt-2 text-sm font-semibold text-navy">
              <span>{SERVICE_LABELS[service]}</span>
              <span className="tabular-nums">{formatNaira(result.total)}</span>
            </div>
            {result.notice && <p className="pt-1 text-[0.7rem] leading-relaxed text-muted">{result.notice}</p>}
          </div>
        )}
      </div>
    </div>
  );
}

export function ScrollCue() {
  return (
    <span className="inline-flex items-center gap-1 text-[0.75rem] font-medium text-white/60">
      <ChevronDown className="size-3.5 animate-bounce" /> More below
    </span>
  );
}
