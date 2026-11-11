"use client";

import { useState } from "react";
import { CircleCheck, Loader2 } from "lucide-react";
import { site } from "@/lib/content";

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
  const [error, setError] = useState<string | null>(null);

  if (state === "sent") {
    return (
      <div className="rounded-[16px] border border-line bg-white p-8">
        <CircleCheck className="size-8 text-cyan" strokeWidth={1.5} />
        <p className="mt-5 font-display text-[1.25rem] font-medium tracking-tight text-navy">Message received</p>
        <p className="mt-2 max-w-md text-[0.875rem] leading-relaxed text-slate-ink">
          Dispatch replies within one working hour. For anything already on the road, call us
          directly.
        </p>
        <button type="button" onClick={() => setState("idle")} className="pill pill-line pill-sm mt-6">
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={async (event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        setState("sending");
        setError(null);

        try {
          const response = await fetch("/api/enquiries", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              kind: "contact",
              name: String(data.get("name") ?? ""),
              phone: String(data.get("phone") ?? ""),
              email: String(data.get("email") ?? ""),
              topic: String(data.get("topic") ?? ""),
              message: String(data.get("message") ?? ""),
            }),
          });
          const body = (await response.json()) as { ok?: boolean; error?: string };
          if (!response.ok || !body.ok) throw new Error(body.error ?? "Submission failed");
          setState("sent");
        } catch (err) {
          setState("idle");
          setError(
            err instanceof Error
              ? err.message
              : "We could not reach the desk. Please call +234 801 234 5678."
          );
        }
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="field-label" htmlFor="c-name">
            Full name
          </label>
          <input id="c-name" name="name" required className="field" placeholder="Ada Effiong" autoComplete="name" />
        </div>
        <div>
          <label className="field-label" htmlFor="c-phone">
            Phone number
          </label>
          <input id="c-phone" name="phone" required className="field" placeholder="080…" inputMode="tel" autoComplete="tel" />
        </div>
        <div className="sm:col-span-2">
          <label className="field-label" htmlFor="c-email">
            Email
          </label>
          <input id="c-email" name="email" type="email" className="field" placeholder="you@example.com" autoComplete="email" />
        </div>
        <div className="sm:col-span-2">
          <label className="field-label" htmlFor="c-topic">
            What is this about?
          </label>
          <select id="c-topic" name="topic" className="field">
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
            name="message"
            required
            className="field min-h-32 resize-y"
            placeholder="Include a tracking reference if you have one."
          />
        </div>
      </div>

      <button type="submit" className="pill pill-navy mt-6 w-full sm:w-auto" disabled={state === "sending"}>
        {state === "sending" ? (
          <>
            <Loader2 className="size-4 animate-spin" /> Sending
          </>
        ) : (
          "Send message"
        )}
      </button>
      {error && (
        <p role="alert" className="mt-3 rounded-[8px] border-l-2 border-danger bg-danger/5 px-3 py-2 text-[0.75rem] leading-relaxed text-danger">
          {error}
        </p>
      )}
      <p className="mt-3 text-[0.75rem] text-muted">
        Dispatch replies within one working hour ({site.hours}). Nothing on the road? Call{" "}
        <a href={site.phoneHref} className="font-medium text-navy underline decoration-line-strong underline-offset-2">
          {site.phone}
        </a>
        .
      </p>
    </form>
  );
}
