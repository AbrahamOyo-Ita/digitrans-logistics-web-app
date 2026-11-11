"use client";

import { useState } from "react";
import { CircleCheck, Loader2 } from "lucide-react";

const topics = [
  "Book a delivery",
  "Market run",
  "Waybill or parcel",
  "Vendor account",
  "Rider onboarding",
  "Complaint or claim",
  "Something else",
];

export function ContactForm() {
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");

  if (state === "sent") {
    return (
      <div className="border border-line bg-white p-8">
        <CircleCheck className="size-8 text-cyan" strokeWidth={1.5} />
        <p className="mt-5 font-display text-[1.25rem] font-medium tracking-tight text-navy">Message received</p>
        <p className="mt-2 max-w-md text-[0.875rem] leading-relaxed text-slate-ink">
          Dispatch replies within one working hour. For anything already on the road, call us
          directly.
        </p>
        <button type="button" onClick={() => setState("idle")} className="btn btn-outline btn-sm mt-6">
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        setState("sending");
        window.setTimeout(() => setState("sent"), 800);
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="field-label" htmlFor="c-name">
            Full name
          </label>
          <input id="c-name" required className="field" placeholder="Ada Effiong" autoComplete="name" />
        </div>
        <div>
          <label className="field-label" htmlFor="c-phone">
            Phone number
          </label>
          <input id="c-phone" required className="field" placeholder="080…" inputMode="tel" autoComplete="tel" />
        </div>
        <div className="sm:col-span-2">
          <label className="field-label" htmlFor="c-email">
            Email
          </label>
          <input id="c-email" type="email" className="field" placeholder="you@example.com" autoComplete="email" />
        </div>
        <div className="sm:col-span-2">
          <label className="field-label" htmlFor="c-topic">
            What is this about?
          </label>
          <select id="c-topic" className="field">
            {topics.map((topic) => (
              <option key={topic}>{topic}</option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="field-label" htmlFor="c-message">
            Message
          </label>
          <textarea
            id="c-message"
            required
            className="field min-h-32 resize-y"
            placeholder="Include a tracking reference if you have one."
          />
        </div>
      </div>

      <button type="submit" className="btn btn-primary mt-6 w-full sm:w-auto" disabled={state === "sending"}>
        {state === "sending" ? (
          <>
            <Loader2 className="size-4 animate-spin" /> Sending
          </>
        ) : (
          "Send message"
        )}
      </button>
      <p className="mt-3 text-[0.75rem] text-muted">
        Preview build — this form validates in the browser and does not yet submit to a backend.
      </p>
    </form>
  );
}
