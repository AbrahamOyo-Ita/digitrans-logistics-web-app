import Link from "next/link";

export function Logo({
  variant = "dark",
  className,
}: {
  variant?: "dark" | "light";
  className?: string;
}) {
  const isLight = variant === "light";
  return (
    <Link href="/" aria-label="DigiTrans Logistics — home" className={`inline-flex items-center gap-2.5 ${className ?? ""}`}>
      <span
        aria-hidden
        className={`grid size-9 shrink-0 place-items-center rounded-[10px] ${
          isLight ? "bg-white/10 ring-1 ring-white/20" : "bg-cyan ring-1 ring-cyan"
        }`}
      >
        <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" aria-hidden>
          <path d="M2.6 7.4A2.4 2.4 0 0 1 5 5h6.2a2 2 0 0 1 0 4H7.8v6a2 2 0 0 0 2 2h4.6a2 2 0 0 1 0 4H9.8A6 6 0 0 1 3.8 15V8.2a1 1 0 0 1 0-.8Z" fill="#fff" />
          <path d="M21.2 12.6a2.4 2.4 0 0 1-2.4 2.4h-4.9a2 2 0 0 1 0-4h2.3V7a2 2 0 0 0-2-2h-3.9a2 2 0 0 1 0-4h5.9a5 5 0 0 1 5 5v6.6Z" fill="#0B1B2B" />
        </svg>
      </span>
      <span
        className={`font-display text-[1.35rem] font-semibold leading-none tracking-[-0.045em] ${
          isLight ? "text-white" : "text-navy"
        }`}
      >
        Digi<span className="text-cyan">trans</span>
      </span>
      <span
        aria-hidden
        className={`hidden h-3 w-px self-center sm:block ${isLight ? "bg-white/25" : "bg-line-strong"}`}
      />
      <span
        className={`hidden text-[0.625rem] font-medium uppercase leading-none tracking-[0.22em] sm:block ${
          isLight ? "text-white/55" : "text-muted"
        }`}
      >
        Logistics
      </span>
    </Link>
  );
}

export function SocialIcon({ kind }: { kind: "instagram" | "facebook" | "linkedin" | "x" }) {
  const common = { width: 15, height: 15, viewBox: "0 0 24 24", fill: "currentColor", "aria-hidden": true };
  if (kind === "instagram")
    return (
      <svg {...common}>
        <path d="M12 2.2c3.2 0 3.6 0 4.9.07 1.2.06 1.8.25 2.2.42.6.23 1 .5 1.4.94.44.44.71.84.94 1.4.17.4.36 1 .42 2.2.06 1.3.07 1.7.07 4.9s0 3.6-.07 4.9c-.06 1.2-.25 1.8-.42 2.2a3.8 3.8 0 0 1-.94 1.4 3.8 3.8 0 0 1-1.4.94c-.4.17-1 .36-2.2.42-1.3.06-1.7.07-4.9.07s-3.6 0-4.9-.07c-1.2-.06-1.8-.25-2.2-.42a3.8 3.8 0 0 1-1.4-.94 3.8 3.8 0 0 1-.94-1.4c-.17-.4-.36-1-.42-2.2C2.2 15.6 2.2 15.2 2.2 12s0-3.6.07-4.9c.06-1.2.25-1.8.42-2.2.23-.6.5-1 .94-1.4.44-.44.84-.71 1.4-.94.4-.17 1-.36 2.2-.42C8.4 2.2 8.8 2.2 12 2.2Zm0 1.8c-3.1 0-3.5 0-4.7.07-1 .04-1.5.2-1.8.32-.4.16-.7.34-1 .64-.3.3-.48.6-.64 1-.12.3-.28.8-.32 1.8C3.5 8.5 3.5 8.9 3.5 12s0 3.5.07 4.7c.04 1 .2 1.5.32 1.8.16.4.34.7.64 1 .3.3.6.48 1 .64.3.12.8.28 1.8.32 1.2.07 1.6.07 4.7.07s3.5 0 4.7-.07c1-.04 1.5-.2 1.8-.32.4-.16.7-.34 1-.64.3-.3.48-.6.64-1 .12-.3.28-.8.32-1.8.07-1.2.07-1.6.07-4.7s0-3.5-.07-4.7c-.04-1-.2-1.5-.32-1.8a2 2 0 0 0-.64-1 2 2 0 0 0-1-.64c-.3-.12-.8-.28-1.8-.32C15.5 4 15.1 4 12 4Zm0 3a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 1.8a3.2 3.2 0 1 0 0 6.4 3.2 3.2 0 0 0 0-6.4Zm5.2-2.9a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4Z" />
      </svg>
    );
  if (kind === "facebook")
    return (
      <svg {...common}>
        <path d="M14 8.5V6.9c0-.8.2-1.2 1.4-1.2H17V2.4c-.3 0-1.3-.1-2.4-.1-2.4 0-4.1 1.5-4.1 4.3v1.9H8v3.3h2.5V22h3.6v-10.2h2.6l.4-3.3H14Z" />
      </svg>
    );
  if (kind === "linkedin")
    return (
      <svg {...common}>
        <path d="M6.6 21.5H3V9h3.6v12.5ZM4.8 7.4A2.1 2.1 0 1 1 4.8 3a2.1 2.1 0 0 1 0 4.4Zm16.7 14.1h-3.5v-6.5c0-1.6-.6-2.6-1.9-2.6-1 0-1.6.7-1.9 1.4-.1.2-.1.6-.1.9v6.8H10.5s.05-11 0-12.5h3.5v1.8c.5-.8 1.4-1.9 3.3-1.9 2.4 0 4.2 1.6 4.2 5v7.6Z" />
      </svg>
    );
  return (
    <svg {...common}>
      <path d="M17.5 3h3.2l-7 8 8.2 10h-6.4l-5-6.1-5.7 6.1H2.6l7.5-8.5L2.1 3h6.6l4.5 5.6L17.5 3Zm-1.1 16.1h1.8L7.7 4.8H5.8l10.6 14.3Z" />
    </svg>
  );
}
