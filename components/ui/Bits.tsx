import Link from "next/link";
import {
  ArrowRight,
  Bike,
  Boxes,
  Building2,
  CalendarClock,
  Check,
  Clock,
  GraduationCap,
  Headset,
  MapPin,
  Package,
  Route,
  ShoppingBasket,
  ShieldCheck,
  Sparkles,
  Truck,
  Wallet,
  Warehouse,
  UtensilsCrossed,
  Pill,
  Store,
  Scissors,
  Shirt,
  Smartphone,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/cn";

/* ------------------------------------------------------------------ *
 * Eyebrow — the small uppercase label above a heading
 * ------------------------------------------------------------------ */
export function Eyebrow({
  children,
  tone = "dark",
  className,
}: {
  children: React.ReactNode;
  tone?: "dark" | "light";
  className?: string;
}) {
  return (
    <p className={cn("eyebrow", tone === "light" && "eyebrow-light", className)}>{children}</p>
  );
}

/* ------------------------------------------------------------------ *
 * SectionHead — eyebrow + title + optional lead and action
 * ------------------------------------------------------------------ */
export function SectionHead({
  eyebrow,
  title,
  lead,
  action,
  tone = "dark",
  align = "left",
  className,
  highlight,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  lead?: string;
  action?: React.ReactNode;
  tone?: "dark" | "light";
  align?: "left" | "center";
  className?: string;
  /** last words of the title rendered in the accent colour, as in the template */
  highlight?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-6",
        action ? "md:flex-row md:items-end md:justify-between" : "",
        align === "center" && "items-center text-center",
        className
      )}
    >
      <div className={cn("max-w-2xl", align === "center" && "mx-auto")}>
        {eyebrow && <Eyebrow tone={tone}>{eyebrow}</Eyebrow>}
        <h2
          className={cn(
            "display-2",
            eyebrow && "mt-3",
            tone === "light" && "text-white"
          )}
        >
          {title}
          {highlight && (
            <span className="text-cyan"> {highlight}</span>
          )}
        </h2>
        {lead && (
          <p
            className={cn(
              "mt-4 max-w-xl text-[0.9375rem] leading-relaxed",
              tone === "light" ? "text-white/65" : "body-sm"
            )}
          >
            {lead}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * RoundLink — the template's circular arrow / text link
 * ------------------------------------------------------------------ */
export function ReadMore({ href, label = "Read more" }: { href: string; label?: string }) {
  return (
    <Link
      href={href}
      className="group inline-flex items-center gap-2 text-[0.8125rem] font-medium text-cyan transition-colors hover:text-cyan-600"
    >
      {label}
      <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

/* ------------------------------------------------------------------ *
 * Icon badges — translucent tinted circles, as in the template
 * ------------------------------------------------------------------ */
export type BadgeTone = "cyan" | "navy" | "amber" | "green" | "violet" | "sky";

const badgeTone: Record<BadgeTone, string> = {
  cyan: "bg-cyan/12 text-cyan",
  navy: "bg-navy/8 text-navy",
  amber: "bg-[#B5762B]/12 text-[#B5762B]",
  green: "bg-[#2C7A4B]/12 text-[#2C7A4B]",
  violet: "bg-[#6D4AA6]/12 text-[#6D4AA6]",
  sky: "bg-[#2D6FA8]/12 text-[#2D6FA8]",
};

export function IconBadge({
  icon: Icon,
  tone = "cyan",
  size = "md",
  className,
}: {
  icon: LucideIcon;
  tone?: BadgeTone;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const dims = size === "lg" ? "size-14" : size === "sm" ? "size-10" : "size-12";
  const glyph = size === "lg" ? "size-6" : size === "sm" ? "size-4" : "size-5";
  return (
    <span className={cn("icon-badge", dims, badgeTone[tone], className)}>
      <Icon className={glyph} strokeWidth={1.7} aria-hidden />
    </span>
  );
}

/* ------------------------------------------------------------------ *
 * Icon registry — maps content keys to a lucide icon
 * ------------------------------------------------------------------ */
const icons: Record<string, LucideIcon> = {
  truck: Truck,
  basket: ShoppingBasket,
  package: Package,
  store: Store,
  student: GraduationCap,
  clock: Clock,
  route: Route,
  shield: ShieldCheck,
  headset: Headset,
  bike: Bike,
  wallet: Wallet,
  warehouse: Warehouse,
  boxes: Boxes,
  building: Building2,
  calendar: CalendarClock,
  pin: MapPin,
  sparkles: Sparkles,
  check: Check,
  restaurant: UtensilsCrossed,
  pharmacy: Pill,
  laundry: Scissors,
  grocery: ShoppingBasket,
  retail: Shirt,
  electronics: Smartphone,
};

export function iconFor(key: string): LucideIcon {
  return icons[key] ?? Truck;
}

/* ------------------------------------------------------------------ *
 * Chip — small rounded tag (category labels on article cards)
 * ------------------------------------------------------------------ */
export function Chip({
  children,
  tone = "solid",
}: {
  children: React.ReactNode;
  tone?: "solid" | "soft";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center self-start rounded-full px-2.5 py-1 text-[0.6875rem] font-medium leading-none",
        tone === "solid" ? "bg-navy text-white" : "bg-paper text-cyan border border-line"
      )}
    >
      {children}
    </span>
  );
}
