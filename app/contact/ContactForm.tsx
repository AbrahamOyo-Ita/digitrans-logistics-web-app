"use client";

import { useState } from "react";
import { CircleCheck, Loader2, Send } from "lucide-react";

const topics = [
  "Book a delivery",
  "Market run",
  "Waybill / parcel",
  "Vendor account",
  "Rider onboarding",
  "Complaint or claim",
  "Something else",
];

export function ContactForm() {
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");

  if (state === "sent") {
    return (
      <div className="rounded-2xl border border-line bg-white p-6 text-center shadow-[var(--shadow-card)]">
        <span className="mx-auto grid size-12 place-items-center rounded-full bg-success/10 text-success">
          <CircleCheck className="size-6" />
        </span>
        <p className="mt-4 font-display text-lg font-semibold text-navy">Message received</p>
        <p className="mx-auto mt-1.5 max-w-sm text-[0.875rem] leading-relaxed text-slate-ink">
          Dispatch will reply within one working hour. For anything live on the road, call us directly.
        </p>
        <button type="button" onClick={() => setState("idle")} className="btn btn-outline btn-sm mt-5">
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form
      className="rounded-2xl border border-line bg-white p-5 shadow-[var(--shadow-card)] sm:p-6"
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
            className="field min-h-28 resize-y"
            placeholder="Include a tracking reference if you have one."
          />
        </div>
      </div>

      <button type="submit" className="btn btn-primary mt-5 w-full sm:w-auto" disabled={state === "sending"}>
        {state === "sending" ? (
          <>
            <Loader2 className="size-4 animate-spin" /> Sending…
          </>
        ) : (
          <>
            Send message <Send className="size-4" />
          </>
        )}
      </button>
      <p className="mt-3 text-[0.6875rem] text-muted">
        Preview build — the form is validated in-browser and does not yet submit to a backend.
      </p>
    </form>
  );
}
